const express = require('express');
const authMiddleware = require('../middleware/auth');
const { getSupabase } = require('../config/supabase');
const router = express.Router();

const VALID_TYPES = ['mobile', 'bank'];

// GET /api/payments — public (shown to customers for payment)
router.get('/', async (_req, res) => {
  try {
    const sb = getSupabase();
    const { data, error } = await sb
      .from('sc_payment_methods')
      .select('*')
      .order('created_at', { ascending: true });
    if (error) throw error;
    res.json({ payments: data || [], total: (data || []).length });
  } catch (err) {
    console.error('Get payments error:', err);
    res.status(500).json({ error: 'Imeshindwa kupata njia za malipo.' });
  }
});

// POST /api/payments — admin only
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { type, network_name, account_name, account_number } = req.body;
    if (!network_name || !network_name.trim())
      return res.status(400).json({ error: 'Jina la mtandao/benki linahitajika.' });
    if (!account_number || !account_number.trim())
      return res.status(400).json({ error: 'Namba ya malipo inahitajika.' });

    const sb = getSupabase();
    const { data, error } = await sb
      .from('sc_payment_methods')
      .insert({
        type: VALID_TYPES.includes(type) ? type : 'mobile',
        network_name: network_name.trim(),
        account_name: (account_name || '').trim(),
        account_number: account_number.trim(),
      })
      .select()
      .single();
    if (error) throw error;
    res.status(201).json(data);
  } catch (err) {
    console.error('Create payment error:', err);
    res.status(500).json({ error: 'Imeshindwa kuongeza njia ya malipo.' });
  }
});

// PATCH /api/payments/:id — admin only
router.patch('/:id', authMiddleware, async (req, res) => {
  try {
    const { type, network_name, account_name, account_number, is_active } = req.body;
    const updates = { updated_at: new Date().toISOString() };
    if (type !== undefined && VALID_TYPES.includes(type)) updates.type = type;
    if (network_name !== undefined) updates.network_name = String(network_name).trim();
    if (account_name !== undefined) updates.account_name = String(account_name).trim();
    if (account_number !== undefined) updates.account_number = String(account_number).trim();
    if (is_active !== undefined) updates.is_active = !!is_active;

    const sb = getSupabase();
    const { data, error } = await sb
      .from('sc_payment_methods')
      .update(updates)
      .eq('id', req.params.id)
      .select()
      .single();
    if (error) throw error;
    res.json(data);
  } catch (err) {
    console.error('Update payment error:', err);
    res.status(500).json({ error: 'Imeshindwa kubadilisha njia ya malipo.' });
  }
});

// DELETE /api/payments/:id — admin only
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const sb = getSupabase();
    const { error } = await sb.from('sc_payment_methods').delete().eq('id', req.params.id);
    if (error) throw error;
    res.json({ message: 'Njia ya malipo imefutwa.' });
  } catch (err) {
    console.error('Delete payment error:', err);
    res.status(500).json({ error: 'Imeshindwa kufuta njia ya malipo.' });
  }
});

module.exports = router;
