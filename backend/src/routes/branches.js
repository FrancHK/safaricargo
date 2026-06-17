const express = require('express');
const authMiddleware = require('../middleware/auth');
const eitherAuth = require('../middleware/eitherAuth');
const { getSupabase } = require('../config/supabase');
const router = express.Router();

// GET /api/branches — admin or mapokezi (list with staff count)
router.get('/', eitherAuth, async (_req, res) => {
  try {
    const sb = getSupabase();
    const { data: branches, error: brErr } = await sb
      .from('sc_branches')
      .select('*')
      .order('created_at', { ascending: false });
    if (brErr) throw brErr;

    const { data: staff, error: stErr } = await sb
      .from('sc_staff')
      .select('station, is_active');
    if (stErr) throw stErr;

    const counts = (staff || []).reduce((acc, s) => {
      const key = (s.station || '').trim();
      if (!key) return acc;
      if (!acc[key]) acc[key] = { total: 0, active: 0 };
      acc[key].total += 1;
      if (s.is_active) acc[key].active += 1;
      return acc;
    }, {});

    const withCounts = (branches || []).map(b => ({
      ...b,
      staff_total: counts[b.name]?.total || 0,
      staff_active: counts[b.name]?.active || 0,
    }));

    res.json({ branches: withCounts, total: withCounts.length });
  } catch (err) {
    console.error('Get branches error:', err);
    res.status(500).json({ error: 'Imeshindwa kupata matawi.' });
  }
});

// POST /api/branches — admin only
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { name, location, region } = req.body;
    if (!name || !name.trim()) return res.status(400).json({ error: 'Jina la tawi linahitajika.' });

    const sb = getSupabase();
    const { data, error } = await sb
      .from('sc_branches')
      .insert({
        name: name.trim(),
        location: (location || '').trim(),
        region: (region || '').trim(),
      })
      .select()
      .single();
    if (error) {
      if (error.code === '23505') return res.status(409).json({ error: 'Tawi lenye jina hili tayari lipo.' });
      throw error;
    }
    res.status(201).json({ ...data, staff_total: 0, staff_active: 0 });
  } catch (err) {
    console.error('Create branch error:', err);
    res.status(500).json({ error: 'Imeshindwa kuongeza tawi.' });
  }
});

// PATCH /api/branches/:id — admin only
router.patch('/:id', authMiddleware, async (req, res) => {
  try {
    const { name, location, region, is_active } = req.body;
    const updates = { updated_at: new Date().toISOString() };
    if (name !== undefined) updates.name = String(name).trim();
    if (location !== undefined) updates.location = String(location).trim();
    if (region !== undefined) updates.region = String(region).trim();
    if (is_active !== undefined) updates.is_active = !!is_active;

    const sb = getSupabase();
    const { data, error } = await sb
      .from('sc_branches')
      .update(updates)
      .eq('id', req.params.id)
      .select()
      .single();
    if (error) {
      if (error.code === '23505') return res.status(409).json({ error: 'Tawi lenye jina hili tayari lipo.' });
      throw error;
    }
    res.json(data);
  } catch (err) {
    console.error('Update branch error:', err);
    res.status(500).json({ error: 'Imeshindwa kubadilisha tawi.' });
  }
});

// DELETE /api/branches/:id — admin only
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const sb = getSupabase();
    const { error } = await sb.from('sc_branches').delete().eq('id', req.params.id);
    if (error) throw error;
    res.json({ message: 'Tawi limefutwa.' });
  } catch (err) {
    console.error('Delete branch error:', err);
    res.status(500).json({ error: 'Imeshindwa kufuta tawi.' });
  }
});

module.exports = router;
