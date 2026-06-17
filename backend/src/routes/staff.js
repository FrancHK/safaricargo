const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const authMiddleware = require('../middleware/auth');
const staffAuthMiddleware = require('../middleware/staffAuth');
const { getSupabase } = require('../config/supabase');
const router = express.Router();

const DEPARTMENT_STATUS = {
  'Mapokezi':      'Received',
  'Upokezi':       'Received',
  'Mpakiaji':      'Processing',
  'Usindikaji':    'Processing',
  'Usafirishaji':  'In Transit',
  'Kituo cha Hub': 'Arrived at Hub',
  'Utoaji':        'Out for Delivery',
  'Ukamilishaji':  'Delivered',
};

// POST /api/staff/login — staff login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email na password zinahitajika.' });

    const sb = getSupabase();
    const { data: staff, error } = await sb
      .from('sc_staff').select('*').eq('email', email.toLowerCase()).single();

    if (error || !staff) return res.status(401).json({ error: 'Email au password si sahihi.' });
    if (!staff.is_active) return res.status(403).json({ error: 'Akaunti yako imezuiwa. Wasiliana na admin.' });

    const isMatch = await bcrypt.compare(password, staff.password);
    if (!isMatch) return res.status(401).json({ error: 'Email au password si sahihi.' });

    // Mapokezi wanapata role yao maalum
    const role = staff.department === 'Mapokezi' ? 'mapokezi' : 'staff';

    const token = jwt.sign(
      {
        id: staff.id,
        email: staff.email,
        name: staff.name,
        department: staff.department,
        station: staff.station,
        employee_id: staff.employee_id,
        role
      },
      process.env.JWT_SECRET,
      { expiresIn: '12h' }
    );

    res.json({
      token,
      role,
      staff: {
        id: staff.id,
        name: staff.name,
        email: staff.email,
        department: staff.department,
        station: staff.station,
        employee_id: staff.employee_id,
        role,
        status_to_assign: DEPARTMENT_STATUS[staff.department] || 'Processing'
      }
    });
  } catch (err) {
    console.error('Staff login error:', err);
    res.status(500).json({ error: 'Hitilafu ya seva.' });
  }
});

// GET /api/staff/vehicles — list available vehicles for operator
router.get('/vehicles', staffAuthMiddleware, async (req, res) => {
  try {
    const sb = getSupabase();
    const { data, error } = await sb
      .from('sc_vehicles')
      .select('id, vehicle_code, plate_number, vehicle_type, capacity_kg, current_load_kg, current_load_count, status, driver_name, driver_phone, route_from, route_to, created_at')
      .in('status', ['available', 'loading', 'dispatched'])
      .order('plate_number', { ascending: true });

    if (error) throw error;

    res.json(
      (data || []).map((v) => ({
        id: v.id,
        vehicleCode: v.vehicle_code,
        plateNumber: v.plate_number,
        vehicleType: v.vehicle_type,
        capacityKg: Number(v.capacity_kg ?? 0),
        currentLoadKg: Number(v.current_load_kg ?? 0),
        currentLoadCount: v.current_load_count ?? 0,
        status: v.status,
        driverName: v.driver_name || '',
        driverPhone: v.driver_phone || '',
        routeFrom: v.route_from || '',
        routeTo: v.route_to || '',
        createdAt: v.created_at,
      }))
    );
  } catch (err) {
    console.error('Vehicles fetch error:', err);
    res.status(500).json({ error: 'Hitilafu kupata orodha ya magari.' });
  }
});

// GET /api/staff/vehicles/:id/shipments — list shipments loaded on a vehicle
router.get('/vehicles/:id/shipments', staffAuthMiddleware, async (req, res) => {
  try {
    const sb = getSupabase();
    const { data, error } = await sb
      .from('sc_vehicle_loads')
      .select('shipment_id, tracking_id, customer_name, destination, weight_kg, created_at')
      .eq('vehicle_id', req.params.id)
      .order('created_at', { ascending: false })
      .limit(100);

    if (error) throw error;

    res.json(
      (data || []).map((row) => ({
        shipmentId: row.shipment_id,
        trackingId: row.tracking_id,
        customerName: row.customer_name,
        destination: row.destination,
        weightKg: Number(row.weight_kg ?? 0),
        loadedAt: row.created_at,
      }))
    );
  } catch (err) {
    console.error('Vehicle shipments fetch error:', err);
    res.status(500).json({ error: 'Hitilafu kupata mizigo ya gari.' });
  }
});

// GET /api/staff/stats/today — staff today stats
router.get('/stats/today', staffAuthMiddleware, async (req, res) => {
  try {
    const sb = getSupabase();
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const { count: todayScans } = await sb
      .from('sc_scan_logs')
      .select('*', { count: 'exact', head: true })
      .eq('staff_id', req.staff.id)
      .gte('created_at', startOfDay.toISOString());

    const { data: staff } = await sb
      .from('sc_staff')
      .select('total_scans')
      .eq('id', req.staff.id)
      .single();

    res.json({
      todayScans: todayScans || 0,
      totalScans: staff?.total_scans || 0,
    });
  } catch (err) {
    console.error('Today stats error:', err);
    res.json({ todayScans: 0, totalScans: 0 });
  }
});

// GET /api/staff/scans/recent — recent scans by this staff
router.get('/scans/recent', staffAuthMiddleware, async (req, res) => {
  try {
    const sb = getSupabase();
    const { data, error } = await sb
      .from('sc_scan_logs')
      .select('tracking_id, new_status, created_at')
      .eq('staff_id', req.staff.id)
      .order('created_at', { ascending: false })
      .limit(10);

    if (error) throw error;

    res.json(
      (data || []).map((s) => ({
        trackingId: s.tracking_id,
        newStatus: s.new_status,
        timestamp: s.created_at,
      }))
    );
  } catch (err) {
    console.error('Recent scans error:', err);
    res.json([]);
  }
});

// GET /api/staff/shipments/lookup/:trackingId — peek details before approving
router.get('/shipments/lookup/:trackingId', staffAuthMiddleware, async (req, res) => {
  try {
    const sb = getSupabase();
    const { data: shipment, error } = await sb
      .from('sc_shipments')
      .select('*')
      .eq('tracking_id', req.params.trackingId.toUpperCase())
      .single();

    if (error || !shipment) {
      return res.status(404).json({ error: 'Mzigo haukupatikana. Angalia Tracking ID.' });
    }

    res.json({
      id: shipment.id,
      trackingId: shipment.tracking_id,
      customerName: shipment.customer_name || '',
      phone: shipment.phone || '',
      email: shipment.email || '',
      origin: shipment.origin || '',
      destination: shipment.destination || '',
      weight: Number(shipment.weight ?? 0),
      description: shipment.description || '',
      cargoType: shipment.cargo_type || '',
      cargoContents: shipment.cargo_contents || '',
      cargoItems: shipment.cargo_items || [],
      price: Number(shipment.price ?? 0),
      currency: shipment.currency || 'TZS',
      routeNote: shipment.route_note || '',
      status: shipment.status || '',
      createdAt: shipment.created_at,
    });
  } catch (err) {
    console.error('Shipment lookup error:', err);
    res.status(500).json({ error: 'Hitilafu kupata taarifa za mzigo.' });
  }
});

// POST /api/staff/scan — scan shipment (staff only)
router.post('/scan', staffAuthMiddleware, async (req, res) => {
  try {
    const { trackingId, vehicleId } = req.body;
    if (!trackingId) return res.status(400).json({ error: 'Tracking ID inahitajika.' });

    const sb = getSupabase();

    // Optional vehicle context
    let vehicle = null;
    if (vehicleId) {
      const { data: v, error: vehicleErr } = await sb
        .from('sc_vehicles')
        .select('id, plate_number, status, capacity_kg, current_load_kg, current_load_count')
        .eq('id', vehicleId)
        .single();
      if (vehicleErr || !v) {
        return res.status(404).json({ error: 'Gari halikupatikana.' });
      }
      if (!['available', 'loading', 'dispatched'].includes(v.status)) {
        return res.status(400).json({ error: `Gari hili lina hali ya "${v.status}" — haliwezi kupokea mizigo sasa.` });
      }
      vehicle = v;
    }

    const { data: shipment, error: findErr } = await sb
      .from('sc_shipments').select('*').eq('tracking_id', trackingId.toUpperCase()).single();

    if (findErr || !shipment) {
      return res.status(404).json({ error: 'Mzigo haukupatikana. Angalia Tracking ID.' });
    }

    const newStatus = DEPARTMENT_STATUS[req.staff.department];
    if (!newStatus) {
      return res.status(400).json({ error: 'Kitengo chako hakijulikani.' });
    }

    // Prevent duplicate load onto same vehicle
    if (vehicle) {
      const { data: existing } = await sb
        .from('sc_vehicle_loads')
        .select('id')
        .eq('vehicle_id', vehicle.id)
        .eq('shipment_id', shipment.id)
        .maybeSingle();
      if (existing) {
        return res.status(400).json({ error: 'Mzigo huu tayari umepakizwa kwenye gari hili.' });
      }
    }

    const previousStatus = shipment.status;
    const now = new Date().toISOString();
    const shipmentWeight = Number(shipment.weight_kg ?? shipment.weight ?? 0);

    const newEntry = {
      status: newStatus,
      note: vehicle
        ? `Imepakizwa kwenye gari ${vehicle.plate_number} na ${req.staff.name} — ${req.staff.department}`
        : `Imescan na ${req.staff.name} — ${req.staff.department} (${req.staff.station || 'N/A'})`,
      timestamp: now,
      ...(vehicle && { vehicle_id: vehicle.id, plate_number: vehicle.plate_number }),
    };
    const history = [...(shipment.status_history || []), newEntry];

    const { data: updated, error: updateErr } = await sb
      .from('sc_shipments')
      .update({ status: newStatus, status_history: history })
      .eq('id', shipment.id)
      .select().single();

    if (updateErr) throw updateErr;

    // Log the scan
    await sb.from('sc_scan_logs').insert({
      staff_id: req.staff.id,
      staff_name: req.staff.name,
      department: req.staff.department,
      tracking_id: trackingId.toUpperCase(),
      previous_status: previousStatus,
      new_status: newStatus,
      station: req.staff.station || ''
    });

    // Add to sc_vehicle_loads if a vehicle was selected
    let newLoadCount = null;
    let newLoadKg = null;
    if (vehicle) {
      const { error: loadErr } = await sb.from('sc_vehicle_loads').insert({
        shipment_id: shipment.id,
        vehicle_id: vehicle.id,
        tracking_id: updated.tracking_id,
        customer_name: updated.customer_name || 'Mteja',
        destination: updated.destination || '',
        loaded_by: req.staff.id,
      });
      if (loadErr) {
        console.error('Vehicle load insert error:', loadErr);
      } else {
        newLoadCount = (vehicle.current_load_count ?? 0) + 1;
        newLoadKg = Number(vehicle.current_load_kg ?? 0) + shipmentWeight;
        await sb
          .from('sc_vehicles')
          .update({
            current_load_count: newLoadCount,
            current_load_kg: newLoadKg,
            status: vehicle.status === 'available' ? 'loading' : vehicle.status,
          })
          .eq('id', vehicle.id);
      }
    }

    // Update staff scan count
    await sb.from('sc_staff').update({
      total_scans: (await sb.from('sc_staff').select('total_scans').eq('id', req.staff.id).single()).data?.total_scans + 1,
      last_scan: now
    }).eq('id', req.staff.id);

    res.json({
      success: true,
      shipment: {
        trackingId: updated.tracking_id,
        customerName: updated.customer_name,
        from: updated.origin,
        to: updated.destination,
        previousStatus,
        newStatus,
        updatedAt: now,
      },
      ...(vehicle && {
        vehicleId: vehicle.id,
        plateNumber: vehicle.plate_number,
        currentLoadCount: newLoadCount,
        currentLoadKg: newLoadKg,
      }),
    });
  } catch (err) {
    console.error('Scan error:', err);
    res.status(500).json({ error: 'Hitilafu wakati wa kuscan.' });
  }
});

// GET /api/staff — get all staff (admin only)
router.get('/', authMiddleware, async (req, res) => {
  try {
    const sb = getSupabase();
    const { data, error } = await sb.from('sc_staff')
      .select('id, name, email, phone, department, station, employee_id, is_active, total_scans, last_scan, created_at')
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json({ staff: data || [], total: data?.length || 0 });
  } catch (err) {
    res.status(500).json({ error: 'Imeshindwa kupata orodha ya wafanyakazi.' });
  }
});

// POST /api/staff — create staff (admin only)
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { name, email, password, phone, department, station } = req.body;
    if (!name || !email || !password || !department) {
      return res.status(400).json({ error: 'Jina, email, password na kitengo vinahitajika.' });
    }

    const sb = getSupabase();
    const hashed = await bcrypt.hash(password, 12);

    // Generate employee ID
    const { count } = await sb.from('sc_staff').select('*', { count: 'exact', head: true });
    const employee_id = `SC-EMP-${String((count || 0) + 1).padStart(3, '0')}`;

    const { data, error } = await sb.from('sc_staff')
      .insert({ name, email: email.toLowerCase(), password: hashed, phone: phone || '', department, station: station || '', employee_id })
      .select('id, name, email, phone, department, station, employee_id, is_active, total_scans, created_at')
      .single();

    if (error) {
      if (error.code === '23505') return res.status(409).json({ error: 'Email tayari ipo.' });
      throw error;
    }
    res.status(201).json(data);
  } catch (err) {
    console.error('Create staff error:', err);
    res.status(500).json({ error: 'Imeshindwa kuongeza mfanyakazi.' });
  }
});

// PATCH /api/staff/:id — update staff (admin only)
router.patch('/:id', authMiddleware, async (req, res) => {
  try {
    const sb = getSupabase();
    const { name, is_active, department, station, phone } = req.body;
    const updates = {};
    if (name !== undefined) updates.name = String(name).trim();
    if (is_active !== undefined) updates.is_active = is_active;
    if (department) updates.department = department;
    if (station !== undefined) updates.station = station;
    if (phone !== undefined) updates.phone = phone;

    const { data, error } = await sb.from('sc_staff').update(updates).eq('id', req.params.id)
      .select('id, name, email, phone, department, station, employee_id, is_active, total_scans, created_at').single();

    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: 'Imeshindwa kubadilisha.' });
  }
});

// DELETE /api/staff/:id (admin only)
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const sb = getSupabase();
    await sb.from('sc_staff').delete().eq('id', req.params.id);
    res.json({ message: 'Mfanyakazi amefutwa.' });
  } catch (err) {
    res.status(500).json({ error: 'Imeshindwa kufuta.' });
  }
});

// GET /api/staff/logs — scan logs (admin only)
router.get('/logs', authMiddleware, async (req, res) => {
  try {
    const sb = getSupabase();
    const { data, error } = await sb.from('sc_scan_logs')
      .select('*').order('scanned_at', { ascending: false }).limit(100);
    if (error) throw error;
    res.json({ logs: data || [] });
  } catch (err) {
    res.status(500).json({ error: 'Imeshindwa kupata logs.' });
  }
});

module.exports = router;
