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

app.use('/api/shipments', shipmentRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/staff', staffRoutes);
app.use('/api/vehicles', require('./src/routes/vehicles'));

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'SafiriCargo API', db: 'Supabase (PostgreSQL)' });
});

app.use((req, res) => res.status(404).json({ error: 'Route not found' }));
app.use((err, req, res, _next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`🚀 SafiriCargo API running on http://localhost:${PORT}`);
  console.log(`📦 Database: Supabase — ${process.env.SUPABASE_URL}`);
});
