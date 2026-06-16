const express = require('express');
const authMiddleware = require('../middleware/auth');
const staffAuthMiddleware = require('../middleware/staffAuth');
const { getSupabase } = require('../config/supabase');
const router = express.Router();

// Middleware ya admin AU mapokezi
function adminOrMapokezi(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Token inahitajika.' });

  const jwt = require('jsonwebtoken');
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    if (decoded.role === 'admin' || decoded.role === 'mapokezi') return next();
    return res.status(403).json({ error: 'Ruhusa ya admin au mapokezi inahitajika.' });
  } catch {
    return res.status(401).json({ error: 'Token batili.' });
  }
}

async function generateVehicleCode() {
  const sb = getSupabase();
  const { data: counter } = await sb.from('sc_counters').select('current_val').eq('id', 'vehicles').single();
  const next = (counter?.current_val || 0) + 1;
  await sb.from('sc_counters').upsert({ id: 'vehicles', current_val: next, year: new Date().getFullYear() });
  return `SC-VH-${String(next).padStart(3, '0')}`;
}

// GET /api/vehicles — get all (admin + mapokezi)
router.get('/', adminOrMapokezi, async (req, res) => {
  try {
    const sb = getSupabase();
    const { status } = req.query;
    let query = sb.from('sc_vehicles').select('*').order('created_at', { ascending: false });
    if (status) query = query.eq('status', status);
    const { data, error } = await query;
    if (error) throw error;
    res.json({ vehicles: data || [], total: data?.length || 0 });
  } catch (err) {
    res.status(500).json({ error: 'Imeshindwa kupata magali.' });
  }
});

// POST /api/vehicles — register vehicle (admin only)
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { plate_number, vehicle_type, capacity_kg, notes } = req.body;
    if (!plate_number) return res.status(400).json({ error: 'Nambari ya gali inahitajika.' });

    const sb = getSupabase();
    const vehicle_code = await generateVehicleCode();

    const { data, error } = await sb.from('sc_vehicles')
      .insert({ vehicle_code, plate_number: plate_number.toUpperCase(), vehicle_type: vehicle_type || 'truck', capacity_kg: parseFloat(capacity_kg) || 5000, notes: notes || '' })
      .select().single();

    if (error) {
      if (error.code === '23505') return res.status(409).json({ error: 'Nambari ya gali tayari imesajiliwa.' });
      throw error;
    }
    res.status(201).json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Imeshindwa kusajili gali.' });
  }
});

// GET /api/vehicles/:id/loads — loads in a vehicle
router.get('/:id/loads', adminOrMapokezi, async (req, res) => {
  try {
    const sb = getSupabase();
    const { data, error } = await sb.from('sc_vehicle_loads')
      .select('*').eq('vehicle_id', req.params.id).order('loaded_at', { ascending: false });
    if (error) throw error;
    res.json({ loads: data || [], total: data?.length || 0 });
  } catch (err) {
    res.status(500).json({ error: 'Imeshindwa kupata mizigo ya gali.' });
  }
});

// POST /api/vehicles/:id/load — add shipment to vehicle (mapokezi)
router.post('/:id/load', adminOrMapokezi, async (req, res) => {
  try {
    const { tracking_id, customer_name, weight, destination } = req.body;
    if (!tracking_id) return res.status(400).json({ error: 'Tracking ID inahitajika.' });

    const sb = getSupabase();

    // Get vehicle
    const { data: vehicle } = await sb.from('sc_vehicles').select('*').eq('id', req.params.id).single();
    if (!vehicle) return res.status(404).json({ error: 'Gali haikupatikana.' });
    if (vehicle.status === 'in_transit') return res.status(400).json({ error: 'Gali liko safarini tayari.' });

    // Check capacity
    const newLoad = (vehicle.current_load_kg || 0) + (parseFloat(weight) || 0);
    if (newLoad > vehicle.capacity_kg) {
      return res.status(400).json({ error: `Gali limejaa! Uwezo: ${vehicle.capacity_kg}kg, Sasa: ${vehicle.current_load_kg}kg` });
    }

    // Check if shipment already in this vehicle
    const { data: existing } = await sb.from('sc_vehicle_loads')
      .select('id').eq('tracking_id', tracking_id.toUpperCase()).single();
    if (existing) return res.status(409).json({ error: 'Mzigo huu tayari umewekwa kwenye gali.' });

    // Add load
    const { data: load, error: loadErr } = await sb.from('sc_vehicle_loads').insert({
      vehicle_id: req.params.id,
      shipment_id: req.body.shipment_id || '',
      tracking_id: tracking_id.toUpperCase(),
      customer_name: customer_name || '',
      weight: parseFloat(weight) || 0,
      destination: destination || '',
      loaded_by: req.user?.name || req.user?.username || 'mapokezi'
    }).select().single();

    if (loadErr) throw loadErr;

    // Update vehicle totals + status
    await sb.from('sc_vehicles').update({
      current_load_kg: newLoad,
      current_load_count: (vehicle.current_load_count || 0) + 1,
      status: 'loading',
      updated_at: new Date().toISOString()
    }).eq('id', req.params.id);

    // Update shipment status to Processing
    await sb.from('sc_shipments')
      .update({ status: 'Processing', status_history: [...(await getHistory(sb, tracking_id)), { status: 'Processing', note: `Imewekwa kwenye gali ${vehicle.vehicle_code}`, timestamp: new Date().toISOString() }] })
      .eq('tracking_id', tracking_id.toUpperCase());

    res.status(201).json({ load, message: `Mzigo umewekwa kwenye ${vehicle.vehicle_code}` });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Imeshindwa kuweka mzigo kwenye gali.' });
  }
});

async function getHistory(sb, trackingId) {
  const { data } = await sb.from('sc_shipments').select('status_history').eq('tracking_id', trackingId.toUpperCase()).single();
  return data?.status_history || [];
}

// POST /api/vehicles/:id/dispatch — dispatch vehicle (mapokezi)
router.post('/:id/dispatch', adminOrMapokezi, async (req, res) => {
  try {
    const { driver_name, driver_phone, route_from, route_to } = req.body;
    if (!driver_name) return res.status(400).json({ error: 'Jina la dereva linahitajika.' });

    const sb = getSupabase();
    const now = new Date().toISOString();

    const { data: vehicle } = await sb.from('sc_vehicles').select('*').eq('id', req.params.id).single();
    if (!vehicle) return res.status(404).json({ error: 'Gali haikupatikana.' });

    // Update vehicle
    await sb.from('sc_vehicles').update({
      status: 'in_transit', driver_name, driver_phone: driver_phone || '',
      route_from: route_from || '', route_to: route_to || '',
      dispatched_at: now, updated_at: now
    }).eq('id', req.params.id);

    // Update all shipments in this vehicle to "In Transit"
    const { data: loads } = await sb.from('sc_vehicle_loads').select('tracking_id').eq('vehicle_id', req.params.id);
    for (const load of (loads || [])) {
      const history = await getHistory(sb, load.tracking_id);
      await sb.from('sc_shipments').update({
        status: 'In Transit',
        status_history: [...history, { status: 'In Transit', note: `Gali ${vehicle.vehicle_code} limeondoka. Dereva: ${driver_name}`, timestamp: now }]
      }).eq('tracking_id', load.tracking_id);
    }

    res.json({ message: `Gali ${vehicle.vehicle_code} limetumwa. Mizigo ${loads?.length || 0} imebadilishwa hadi "In Transit"` });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Imeshindwa kutuma gali.' });
  }
});

// POST /api/vehicles/:id/arrive — mark vehicle as arrived
router.post('/:id/arrive', adminOrMapokezi, async (req, res) => {
  try {
    const sb = getSupabase();
    const now = new Date().toISOString();

    const { data: vehicle } = await sb.from('sc_vehicles').select('*').eq('id', req.params.id).single();
    if (!vehicle) return res.status(404).json({ error: 'Gali haikupatikana.' });

    await sb.from('sc_vehicles').update({ status: 'arrived', arrived_at: now, updated_at: now }).eq('id', req.params.id);

    const { data: loads } = await sb.from('sc_vehicle_loads').select('tracking_id').eq('vehicle_id', req.params.id);
    for (const load of (loads || [])) {
      const history = await getHistory(sb, load.tracking_id);
      await sb.from('sc_shipments').update({
        status: 'Arrived at Hub',
        status_history: [...history, { status: 'Arrived at Hub', note: `Gali ${vehicle.vehicle_code} limefika.`, timestamp: now }]
      }).eq('tracking_id', load.tracking_id);
    }

    res.json({ message: `Gali ${vehicle.vehicle_code} limefika. Mizigo ${loads?.length || 0} - "Arrived at Hub"` });
  } catch (err) {
    res.status(500).json({ error: 'Imeshindwa kubadilisha hali ya gali.' });
  }
});

// POST /api/vehicles/:id/clear — clear vehicle after delivery
router.post('/:id/clear', authMiddleware, async (req, res) => {
  try {
    const sb = getSupabase();
    await sb.from('sc_vehicle_loads').delete().eq('vehicle_id', req.params.id);
    await sb.from('sc_vehicles').update({
      status: 'available', current_load_kg: 0, current_load_count: 0,
      driver_name: '', driver_phone: '', route_from: '', route_to: '',
      dispatched_at: null, arrived_at: null, updated_at: new Date().toISOString()
    }).eq('id', req.params.id);
    res.json({ message: 'Gali imesafishwa na iko tayari kupakiwa tena.' });
  } catch (err) {
    res.status(500).json({ error: 'Imeshindwa kusafisha gali.' });
  }
});

// PATCH /api/vehicles/:id — update vehicle (admin)
router.patch('/:id', authMiddleware, async (req, res) => {
  try {
    const sb = getSupabase();
    const { data, error } = await sb.from('sc_vehicles').update({ ...req.body, updated_at: new Date().toISOString() }).eq('id', req.params.id).select().single();
    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: 'Imeshindwa kubadilisha gali.' });
  }
});

// DELETE /api/vehicles/:id (admin)
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const sb = getSupabase();
    await sb.from('sc_vehicles').delete().eq('id', req.params.id);
    res.json({ message: 'Gali imefutwa.' });
  } catch (err) {
    res.status(500).json({ error: 'Imeshindwa kufuta gali.' });
  }
});

module.exports = router;
