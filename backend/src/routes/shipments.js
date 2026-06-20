const express = require('express');
const authMiddleware = require('../middleware/auth');
const eitherAuth = require('../middleware/eitherAuth');
const { getSupabase } = require('../config/supabase');
const {
  createShipment, getAllShipments, getShipmentByTrackingId,
  updateShipmentStatus, deleteShipment, confirmPayment, rejectPayment, getPaymentStats, STATUSES
} = require('../services/shipmentService');
const router = express.Router();

// Resolve a human-friendly name for the logged-in actor (admin or mapokezi).
async function resolveActorName(req) {
  if (req.staff) return req.staff.name || 'mapokezi';
  if (req.admin) {
    try {
      const sb = getSupabase();
      const { data } = await sb.from('sc_admins').select('username').eq('id', req.admin.id).single();
      return data?.username || req.admin.email || 'admin';
    } catch {
      return req.admin.email || 'admin';
    }
  }
  return 'admin';
}

// POST /api/shipments — public booking
router.post('/', async (req, res) => {
  try {
    const { customerName, phone, from, to, weight } = req.body;
    if (!customerName || !phone || !from || !to || !weight) {
      return res.status(400).json({ error: 'Required: customerName, phone, from, to, weight' });
    }
    const shipment = await createShipment(req.body);
    res.status(201).json(shipment);
  } catch (err) {
    console.error('Create error:', err);
    res.status(500).json({ error: 'Failed to create shipment.' });
  }
});

// GET /api/shipments — admin or mapokezi
router.get('/', eitherAuth, async (req, res) => {
  try {
    const { status, search, payment_status } = req.query;
    const result = await getAllShipments({ status, search, paymentStatus: payment_status });
    res.json(result);
  } catch (err) {
    console.error('Get all error:', err);
    res.status(500).json({ error: 'Failed to fetch shipments.' });
  }
});

// GET /api/shipments/payment-stats — admin or mapokezi (must precede /:trackingId)
router.get('/payment-stats', eitherAuth, async (_req, res) => {
  try {
    const stats = await getPaymentStats();
    res.json(stats);
  } catch (err) {
    console.error('Payment stats error:', err);
    res.status(500).json({ error: 'Failed to fetch payment stats.' });
  }
});

// GET /api/shipments/:trackingId — public tracking
router.get('/:trackingId', async (req, res) => {
  try {
    const shipment = await getShipmentByTrackingId(req.params.trackingId);
    if (!shipment) return res.status(404).json({ error: 'Shipment not found. Please check your Tracking ID.' });
    res.json(shipment);
  } catch (err) {
    console.error('Track error:', err);
    res.status(500).json({ error: 'Server error.' });
  }
});

// PUT /api/shipments/:id/status — admin or mapokezi
router.put('/:id/status', eitherAuth, async (req, res) => {
  try {
    const { status, note } = req.body;
    if (!STATUSES.includes(status)) {
      return res.status(400).json({ error: `Invalid status. Valid: ${STATUSES.join(', ')}` });
    }
    const shipment = await updateShipmentStatus(req.params.id, status, note);
    if (!shipment) return res.status(404).json({ error: 'Shipment not found.' });
    res.json(shipment);
  } catch (err) {
    console.error('Status update error:', err);
    res.status(500).json({ error: 'Failed to update status.' });
  }
});

// POST /api/shipments/:id/confirm-payment — admin or mapokezi
router.post('/:id/confirm-payment', eitherAuth, async (req, res) => {
  try {
    const adminName = await resolveActorName(req);
    const result = await confirmPayment(req.params.id, adminName);
    if (result.error === 'not_found') return res.status(404).json({ error: 'Shipment not found.' });
    if (result.error === 'not_pending') return res.status(409).json({ error: 'Malipo haya hayako kwenye hali ya pending.' });
    res.json(result);
  } catch (err) {
    console.error('Confirm payment error:', err);
    res.status(500).json({ error: 'Imeshindwa kuthibitisha malipo.' });
  }
});

// POST /api/shipments/:id/reject-payment — admin or mapokezi
router.post('/:id/reject-payment', eitherAuth, async (req, res) => {
  try {
    const { reason } = req.body;
    const adminName = await resolveActorName(req);
    const result = await rejectPayment(req.params.id, adminName, reason);
    if (result.error === 'not_found') return res.status(404).json({ error: 'Shipment not found.' });
    if (result.error === 'not_pending') return res.status(409).json({ error: 'Malipo haya hayako kwenye hali ya pending.' });
    res.json(result);
  } catch (err) {
    console.error('Reject payment error:', err);
    res.status(500).json({ error: 'Imeshindwa kukataa malipo.' });
  }
});

// DELETE /api/shipments/:id — admin or mapokezi
router.delete('/:id', eitherAuth, async (req, res) => {
  try {
    const deleted = await deleteShipment(req.params.id);
    if (!deleted) return res.status(404).json({ error: 'Shipment not found.' });
    res.json({ message: 'Shipment deleted.' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete shipment.' });
  }
});

module.exports = router;
