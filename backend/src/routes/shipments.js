const express = require('express');
const authMiddleware = require('../middleware/auth');
const eitherAuth = require('../middleware/eitherAuth');
const {
  createShipment, getAllShipments, getShipmentByTrackingId,
  updateShipmentStatus, deleteShipment, STATUSES
} = require('../services/shipmentService');
const router = express.Router();

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
    const { status, search } = req.query;
    const result = await getAllShipments({ status, search });
    res.json(result);
  } catch (err) {
    console.error('Get all error:', err);
    res.status(500).json({ error: 'Failed to fetch shipments.' });
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
