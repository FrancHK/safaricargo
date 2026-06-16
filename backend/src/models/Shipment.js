const mongoose = require('mongoose');

const STATUSES = ['Received', 'Processing', 'In Transit', 'Arrived at Hub', 'Out for Delivery', 'Delivered'];

const statusHistorySchema = new mongoose.Schema({
  status: { type: String, enum: STATUSES },
  note: { type: String, default: '' },
  timestamp: { type: Date, default: Date.now }
}, { _id: false });

const shipmentSchema = new mongoose.Schema({
  trackingId: { type: String, unique: true, required: true, uppercase: true },
  customerName: { type: String, required: true, trim: true },
  phone: { type: String, required: true, trim: true },
  email: { type: String, trim: true, lowercase: true, default: '' },
  from: { type: String, required: true, trim: true },
  to: { type: String, required: true, trim: true },
  weight: { type: Number, required: true, min: 0.1 },
  description: { type: String, trim: true, default: '' },
  status: { type: String, enum: STATUSES, default: 'Received' },
  statusHistory: { type: [statusHistorySchema], default: [] }
}, { timestamps: true });

module.exports = mongoose.model('Shipment', shipmentSchema);
module.exports.STATUSES = STATUSES;
