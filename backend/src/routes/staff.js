const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const authMiddleware = require('../middleware/auth');
const staffAuthMiddleware = require('../middleware/staffAuth');
const { getSupabase } = require('../config/supabase');
const router = express.Router();

const DEPARTMENT_STATUS = {
  'Mpakiaji':      'Processing',
  'Usafirishaji':  'In Transit',
  'Utoaji':        'Out for Delivery'
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

// POST /api/staff/scan — scan shipment (staff only)
router.post('/scan', staffAuthMiddleware, async (req, res) => {
  try {
    const { trackingId } = req.body;
    if (!trackingId) return res.status(400).json({ error: 'Tracking ID inahitajika.' });

    const sb = getSupabase();
    const { data: shipment, error: findErr } = await sb
      .from('sc_shipments').select('*').eq('tracking_id', trackingId.toUpperCase()).single();

    if (findErr || !shipment) {
      return res.status(404).json({ error: 'Mzigo haukupatikana. Angalia Tracking ID.' });
    }

    const newStatus = DEPARTMENT_STATUS[req.staff.department];
    if (!newStatus) {
      return res.status(400).json({ error: 'Kitengo chako hakijulikani.' });
    }

    const previousStatus = shipment.status;
    const now = new Date().toISOString();
    const newEntry = {
      status: newStatus,
      note: `Imescan na ${req.staff.name} — ${req.staff.department} (${req.staff.station || 'N/A'})`,
      timestamp: now
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
        updatedAt: now
      }
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
    const { is_active, department, station, phone } = req.body;
    const updates = {};
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
