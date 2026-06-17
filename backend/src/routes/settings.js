const express = require('express');
const authMiddleware = require('../middleware/auth');
const { getSupabase } = require('../config/supabase');
const router = express.Router();

// GET /api/settings — public (label uses it)
router.get('/', async (_req, res) => {
  try {
    const sb = getSupabase();
    const { data, error } = await sb.from('sc_settings').select('*').eq('id', 1).single();
    if (error) throw error;
    res.json(data);
  } catch (err) {
    console.error('Get settings error:', err);
    res.status(500).json({ error: 'Imeshindwa kupata settings.' });
  }
});

// PATCH /api/settings — admin only
router.patch('/', authMiddleware, async (req, res) => {
  try {
    const { company_name, address, phone, email } = req.body;
    const updates = {};
    if (company_name !== undefined) updates.company_name = String(company_name).trim();
    if (address !== undefined) updates.address = String(address).trim();
    if (phone !== undefined) updates.phone = String(phone).trim();
    if (email !== undefined) updates.email = String(email).trim();
    updates.updated_at = new Date().toISOString();

    const sb = getSupabase();
    const { data, error } = await sb
      .from('sc_settings')
      .update(updates)
      .eq('id', 1)
      .select()
      .single();
    if (error) throw error;
    res.json(data);
  } catch (err) {
    console.error('Update settings error:', err);
    res.status(500).json({ error: 'Imeshindwa kubadilisha settings.' });
  }
});

module.exports = router;
