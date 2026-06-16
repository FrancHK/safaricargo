const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { getSupabase } = require('../config/supabase');
const { findAdminByEmail, comparePassword } = require('../services/adminService');
const router = express.Router();

// POST /api/auth/login — customer OR admin login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email na password zinahitajika.' });
    }

    const sb = getSupabase();

    // 1. Try customer login first
    const { data: customer } = await sb
      .from('sc_customers')
      .select('*')
      .eq('email', email.toLowerCase().trim())
      .single();

    if (customer) {
      // Customer found — check password
      if (!customer.password) {
        return res.status(401).json({ error: 'Akaunti hii haina password. Jisajili upya.' });
      }
      const isMatch = await bcrypt.compare(password, customer.password);
      if (!isMatch) {
        return res.status(401).json({ error: 'Email au password si sahihi.' });
      }

      const token = jwt.sign(
        { id: customer.id, email: customer.email, role: 'customer' },
        process.env.JWT_SECRET,
        { expiresIn: '30d' }
      );

      return res.json({
        token,
        user: {
          id: customer.id,
          _id: customer.id,
          email: customer.email,
          phone: customer.phone || '',
          firstName: (customer.name || '').split(' ')[0] || '',
          middleName: (customer.name || '').split(' ').slice(1, -1).join(' ') || '',
          lastName: (customer.name || '').split(' ').pop() || '',
          name: customer.name,
          gender: customer.gender || 'other',
          role: 'customer',
          createdAt: customer.created_at,
        },
      });
    }

    // 2. Try admin login
    const admin = await findAdminByEmail(email);
    if (admin) {
      const isMatch = await comparePassword(password, admin.password);
      if (!isMatch) {
        return res.status(401).json({ error: 'Email au password si sahihi.' });
      }

      const token = jwt.sign(
        { id: admin._id || admin.id, email: admin.email, role: admin.role || 'admin' },
        process.env.JWT_SECRET,
        { expiresIn: '8h' }
      );

      return res.json({
        token,
        user: {
          id: admin._id || admin.id,
          _id: admin._id || admin.id,
          email: admin.email,
          phone: '',
          firstName: admin.username || admin.email,
          middleName: '',
          lastName: '',
          role: admin.role || 'admin',
          createdAt: admin.created_at || new Date().toISOString(),
        },
      });
    }

    // Not found anywhere
    return res.status(401).json({ error: 'Email au password si sahihi.' });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Hitilafu ya seva.' });
  }
});

// GET /api/auth/me — get current user profile
router.get('/me', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: 'Token inahitajika.' });

    const token = authHeader.replace('Bearer ', '');
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const sb = getSupabase();

    if (decoded.role === 'customer') {
      const { data: customer } = await sb
        .from('sc_customers').select('*').eq('id', decoded.id).single();
      if (!customer) return res.status(404).json({ error: 'Mtumiaji hakupatikana.' });

      return res.json({
        id: customer.id,
        email: customer.email,
        phone: customer.phone || '',
        firstName: (customer.name || '').split(' ')[0] || '',
        middleName: (customer.name || '').split(' ').slice(1, -1).join(' ') || '',
        lastName: (customer.name || '').split(' ').pop() || '',
        role: 'customer',
        createdAt: customer.created_at,
      });
    }

    return res.json({ ...decoded, role: decoded.role || 'admin' });
  } catch (err) {
    res.status(401).json({ error: 'Token si sahihi.' });
  }
});

module.exports = router;
