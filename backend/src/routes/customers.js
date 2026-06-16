const express = require('express');
const bcrypt = require('bcryptjs');
const authMiddleware = require('../middleware/auth');
const eitherAuth = require('../middleware/eitherAuth');
const { getSupabase } = require('../config/supabase');
const router = express.Router();

// GET /api/customers — all customers (admin only)
router.get('/', eitherAuth, async (req, res) => {
  try {
    const sb = getSupabase();
    const { search, is_active } = req.query;

    let query = sb.from('sc_customers')
      .select('id, name, email, phone, gender, city, is_active, created_at')
      .order('created_at', { ascending: false });

    if (is_active !== undefined) query = query.eq('is_active', is_active === 'true');

    const { data, error } = await query;
    if (error) throw error;

    let customers = data || [];
    if (search) {
      const s = search.toLowerCase();
      customers = customers.filter(c =>
        (c.name || '').toLowerCase().includes(s) ||
        (c.email || '').toLowerCase().includes(s) ||
        (c.phone || '').includes(s)
      );
    }

    res.json({ customers, total: customers.length });
  } catch (err) {
    console.error('Get customers error:', err);
    res.status(500).json({ error: 'Failed to fetch customers.' });
  }
});

// PATCH /api/customers/:id/status — admin or mapokezi
router.patch('/:id/status', eitherAuth, async (req, res) => {
  try {
    const sb = getSupabase();
    const { is_active } = req.body;
    const { data, error } = await sb
      .from('sc_customers')
      .update({ is_active })
      .eq('id', req.params.id)
      .select()
      .single();
    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update customer.' });
  }
});

// POST /api/customers — register from mobile app (public)
router.post('/', async (req, res) => {
  try {
    const sb = getSupabase();
    const { name, email, phone, password, gender, firstName, middleName, lastName } = req.body;

    if (!name || !email || !phone || !password) {
      return res.status(400).json({ error: 'Jina, email, simu na password zinahitajika.' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    const { data, error } = await sb
      .from('sc_customers')
      .insert({
        name,
        email: email.toLowerCase().trim(),
        phone,
        password: hashedPassword,
        gender: gender || 'other',
        city: '',
        device_type: 'mobile',
        app_version: '',
      })
      .select('id, name, email, phone, gender, city, created_at')
      .single();

    if (error) {
      if (error.code === '23505') {
        return res.status(409).json({ error: 'Email tayari imesajiliwa. Ingia au tumia email nyingine.' });
      }
      throw error;
    }

    res.status(201).json(data);
  } catch (err) {
    console.error('Register customer error:', err);
    res.status(500).json({ error: 'Imeshindwa kusajili. Jaribu tena.' });
  }
});

module.exports = router;
