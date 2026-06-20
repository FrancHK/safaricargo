const { getSupabase } = require('../config/supabase');

const STATUSES = ['Received', 'Processing', 'In Transit', 'Arrived at Hub', 'Out for Delivery', 'Delivered'];

async function generateTrackingId() {
  const sb = getSupabase();
  const year = new Date().getFullYear();

  // Atomic increment via RPC or manual update
  const { data: counter } = await sb
    .from('sc_counters')
    .select('current_val')
    .eq('id', 'sc_shipments')
    .single();

  const next = counter ? counter.current_val + 1 : 1;

  await sb.from('sc_counters').upsert({ id: 'sc_shipments', current_val: next, year });

  return `SC-${year}-${String(next).padStart(4, '0')}`;
}

function toRow(data) {
  return {
    tracking_id: data.trackingId,
    customer_name: data.customerName,
    phone: data.phone,
    email: data.email || '',
    origin: data.from,
    destination: data.to,
    weight: parseFloat(data.weight),
    description: data.description || '',
    status: data.status || 'Received',
    status_history: data.statusHistory || []
  };
}

function fromRow(row) {
  if (!row) return null;
  return {
    _id: row.id,
    trackingId: row.tracking_id,
    customerName: row.customer_name,
    phone: row.phone,
    email: row.email,
    from: row.origin,
    to: row.destination,
    weight: row.weight,
    description: row.description,
    cargoType: row.cargo_type,
    cargoTypeCustom: row.cargo_type_custom,
    cargoContents: row.cargo_contents,
    cargoItems: row.cargo_items || [],
    price: row.price,
    currency: row.currency || 'TZS',
    routeNote: row.route_note,
    status: row.status,
    statusHistory: row.status_history || [],
    paymentStatus: row.payment_status || 'unpaid',
    paymentRef: row.payment_ref || '',
    paymentMethod: row.payment_method || '',
    paidAt: row.paid_at || null,
    paymentConfirmedBy: row.payment_confirmed_by || '',
    paymentConfirmedAt: row.payment_confirmed_at || null,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

async function createShipment(data) {
  const sb = getSupabase();
  const trackingId = await generateTrackingId();
  const now = new Date().toISOString();

  const row = {
    tracking_id: trackingId,
    customer_name: data.customerName,
    phone: data.phone,
    email: data.email || '',
    origin: data.from,
    destination: data.to,
    weight: parseFloat(data.weight) || 0,
    description: data.cargo_contents || data.description || '',
    cargo_type: data.cargo_type || 'box',
    cargo_type_custom: data.cargo_type_custom || '',
    cargo_contents: data.cargo_contents || '',
    cargo_items: Array.isArray(data.cargo_items) ? data.cargo_items : [],
    price: parseFloat(data.price) || 0,
    route_note: data.route_note || '',
    customer_id: data.customer_id || null,
    status: 'Received',
    status_history: [{ status: 'Received', note: 'Shipment registered in system', timestamp: now }]
  };

  const { data: created, error } = await sb.from('sc_shipments').insert(row).select().single();
  if (error) throw error;
  return fromRow(created);
}

async function getAllShipments({ status, search, paymentStatus } = {}) {
  const sb = getSupabase();
  let query = sb.from('sc_shipments').select('*');

  // Pending-payments view sorts by submission time (newest first); default sorts by creation.
  if (paymentStatus) {
    query = query.eq('payment_status', paymentStatus).order('paid_at', { ascending: false });
  } else {
    query = query.order('created_at', { ascending: false });
  }
  query = query.limit(100);

  if (status && status !== 'All') query = query.eq('status', status);

  const { data, error } = await query;
  if (error) throw error;

  let shipments = (data || []).map(fromRow);

  if (search) {
    const s = search.toLowerCase();
    shipments = shipments.filter(sh =>
      sh.trackingId.toLowerCase().includes(s) ||
      sh.customerName.toLowerCase().includes(s) ||
      sh.phone.includes(s)
    );
  }

  return { shipments, total: shipments.length };
}

async function getShipmentByTrackingId(trackingId) {
  const sb = getSupabase();
  const { data, error } = await sb
    .from('sc_shipments')
    .select('*')
    .eq('tracking_id', trackingId.toUpperCase())
    .single();

  if (error || !data) return null;
  return fromRow(data);
}

async function updateShipmentStatus(id, status, note) {
  const sb = getSupabase();
  const { data: existing, error: fetchErr } = await sb
    .from('sc_shipments').select('status_history').eq('id', id).single();

  if (fetchErr || !existing) return null;

  const newEntry = { status, note: note || `Status updated to ${status}`, timestamp: new Date().toISOString() };
  const history = [...(existing.status_history || []), newEntry];

  const { data, error } = await sb
    .from('sc_shipments')
    .update({ status, status_history: history })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return fromRow(data);
}

async function deleteShipment(id) {
  const sb = getSupabase();
  const { error } = await sb.from('sc_shipments').delete().eq('id', id);
  if (error) throw error;
  return true;
}

// Confirm a customer's payment → marks paid + delivered. Only valid when pending.
async function confirmPayment(id, adminName) {
  const sb = getSupabase();
  const { data: existing, error: fetchErr } = await sb
    .from('sc_shipments').select('status_history, payment_status').eq('id', id).single();

  if (fetchErr || !existing) return { error: 'not_found' };
  if (existing.payment_status !== 'pending') return { error: 'not_pending' };

  const now = new Date().toISOString();
  const history = [
    ...(existing.status_history || []),
    { status: 'Delivered', note: `Payment confirmed by ${adminName} — cargo delivered`, timestamp: now },
  ];

  const { data, error } = await sb.from('sc_shipments').update({
    payment_status: 'paid',
    status: 'Delivered',
    payment_confirmed_by: adminName,
    payment_confirmed_at: now,
    status_history: history,
    updated_at: now,
  }).eq('id', id).select().single();

  if (error) throw error;
  return { shipment: fromRow(data) };
}

// Reject a customer's payment → resets to unpaid so they can resubmit. Status stays "Out for Delivery".
async function rejectPayment(id, adminName, reason) {
  const sb = getSupabase();
  const { data: existing, error: fetchErr } = await sb
    .from('sc_shipments').select('status_history, payment_status, status').eq('id', id).single();

  if (fetchErr || !existing) return { error: 'not_found' };
  if (existing.payment_status !== 'pending') return { error: 'not_pending' };

  const now = new Date().toISOString();
  const history = [
    ...(existing.status_history || []),
    {
      status: existing.status || 'Out for Delivery',
      note: `Payment rejected by ${adminName}: ${reason || 'hakuna sababu'}`,
      timestamp: now,
    },
  ];

  const { data, error } = await sb.from('sc_shipments').update({
    payment_status: 'unpaid',
    payment_ref: '',
    status_history: history,
    updated_at: now,
  }).eq('id', id).select().single();

  if (error) throw error;
  return { shipment: fromRow(data) };
}

// Aggregate payment figures for the dashboard (pending + confirmed today/month/total).
async function getPaymentStats() {
  const sb = getSupabase();
  const { data, error } = await sb
    .from('sc_shipments')
    .select('payment_status, price, payment_confirmed_at, paid_at')
    .in('payment_status', ['pending', 'paid']);
  if (error) throw error;

  const now = new Date();
  const startToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const startMonth = new Date(now.getFullYear(), now.getMonth(), 1).getTime();

  const stats = {
    pending: { count: 0, amount: 0 },
    today: { count: 0, amount: 0 },
    month: { count: 0, amount: 0 },
    total: { count: 0, amount: 0 },
  };

  for (const r of data || []) {
    const price = parseFloat(r.price) || 0;
    if (r.payment_status === 'pending') {
      stats.pending.count += 1;
      stats.pending.amount += price;
    } else if (r.payment_status === 'paid') {
      stats.total.count += 1;
      stats.total.amount += price;
      const when = r.payment_confirmed_at || r.paid_at;
      const whenMs = when ? new Date(when).getTime() : 0;
      if (whenMs >= startMonth) { stats.month.count += 1; stats.month.amount += price; }
      if (whenMs >= startToday) { stats.today.count += 1; stats.today.amount += price; }
    }
  }

  return stats;
}

module.exports = { createShipment, getAllShipments, getShipmentByTrackingId, updateShipmentStatus, deleteShipment, confirmPayment, rejectPayment, getPaymentStats, STATUSES };
