const Shipment = require('../models/Shipment');

async function generateTrackingId() {
  const year = new Date().getFullYear();
  const prefix = `SC-${year}-`;

  const last = await Shipment.findOne(
    { trackingId: { $regex: `^${prefix}` } },
    { trackingId: 1 },
    { sort: { createdAt: -1 } }
  );

  let seq = 1;
  if (last) {
    const parts = last.trackingId.split('-');
    seq = parseInt(parts[2]) + 1;
  }

  return `${prefix}${String(seq).padStart(4, '0')}`;
}

module.exports = { generateTrackingId };
