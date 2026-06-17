require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');

const shipmentRoutes = require('./src/routes/shipments');
const authRoutes = require('./src/routes/auth');
const customerRoutes = require('./src/routes/customers');
const staffRoutes = require('./src/routes/staff');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(helmet());
app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:5173', credentials: true }));
app.use(express.json({ limit: '10mb' }));

// Mount each route group at both /api/* (local dev, direct access) and /*
// (Vercel experimentalServices strips the routePrefix before forwarding).
function mountAll(base) {
  app.use(`${base}/shipments`, shipmentRoutes);
  app.use(`${base}/auth`, authRoutes);
  app.use(`${base}/customers`, customerRoutes);
  app.use(`${base}/staff`, staffRoutes);
  app.use(`${base}/vehicles`, require('./src/routes/vehicles'));
  app.use(`${base}/settings`, require('./src/routes/settings'));
  app.use(`${base}/branches`, require('./src/routes/branches'));
  app.get(`${base}/health`, (req, res) => {
    res.json({ status: 'ok', service: 'SafiriCargo API', db: 'Supabase (PostgreSQL)' });
  });
}
mountAll('/api');
mountAll('');

app.use((req, res) => res.status(404).json({ error: 'Route not found' }));
app.use((err, req, res, _next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`🚀 SafiriCargo API running on http://localhost:${PORT}`);
  console.log(`📦 Database: Supabase — ${process.env.SUPABASE_URL}`);
});
