require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const { getSupabase } = require('./config/supabase');
const { createAdmin, findAdminByEmail } = require('./services/adminService');

async function seed() {
  console.log('🌱 Seeding Supabase database...');

  // Admin
  const existing = await findAdminByEmail('admin@safiricargo.com');
  if (!existing) {
    await createAdmin({ username: 'admin', email: 'admin@safiricargo.com', password: 'SafiriAdmin2026!' });
    console.log('✅ Admin created:');
    console.log('   Email:    admin@safiricargo.com');
    console.log('   Password: SafiriAdmin2026!');
  } else {
    console.log('ℹ️  Admin already exists.');
  }

  const sb = getSupabase();

  // Check if shipments exist
  const { data: existing_shipments } = await sb.from('sc_shipments').select('id').limit(1);
  if (existing_shipments && existing_shipments.length > 0) {
    console.log('ℹ️  Shipments already exist, skipping.');
  } else {
    const now = Date.now();
    const samples = [
      {
        tracking_id: 'SC-2026-0001',
        customer_name: 'Amina Hassan',
        phone: '+255 712 345 678',
        email: 'amina@example.com',
        origin: 'Dar es Salaam',
        destination: 'Nairobi',
        weight: 15.5,
        description: 'Electronics',
        status: 'In Transit',
        status_history: [
          { status: 'Received', note: 'Package received at warehouse', timestamp: new Date(now - 3 * 86400000).toISOString() },
          { status: 'Processing', note: 'Package sorted and labeled', timestamp: new Date(now - 2 * 86400000).toISOString() },
          { status: 'In Transit', note: 'Package departed Dar es Salaam hub', timestamp: new Date(now - 86400000).toISOString() }
        ]
      },
      {
        tracking_id: 'SC-2026-0002',
        customer_name: 'John Kamau',
        phone: '+254 700 123 456',
        email: 'john@example.com',
        origin: 'Mombasa',
        destination: 'Kampala',
        weight: 8.2,
        description: 'Clothing and textiles',
        status: 'Delivered',
        status_history: [
          { status: 'Received', note: 'Package received', timestamp: new Date(now - 7 * 86400000).toISOString() },
          { status: 'Processing', note: 'Processing complete', timestamp: new Date(now - 6 * 86400000).toISOString() },
          { status: 'In Transit', note: 'In transit to Kampala', timestamp: new Date(now - 4 * 86400000).toISOString() },
          { status: 'Arrived at Hub', note: 'Arrived at Kampala hub', timestamp: new Date(now - 2 * 86400000).toISOString() },
          { status: 'Out for Delivery', note: 'Out for delivery', timestamp: new Date(now - 86400000).toISOString() },
          { status: 'Delivered', note: 'Delivered successfully', timestamp: new Date(now).toISOString() }
        ]
      },
      {
        tracking_id: 'SC-2026-0003',
        customer_name: 'Grace Odhiambo',
        phone: '+254 722 987 654',
        email: '',
        origin: 'Kisumu',
        destination: 'Arusha',
        weight: 22.0,
        description: 'Agricultural produce',
        status: 'Received',
        status_history: [
          { status: 'Received', note: 'Package received at warehouse', timestamp: new Date(now).toISOString() }
        ]
      }
    ];

    const { error } = await sb.from('sc_shipments').insert(samples);
    if (error) throw error;
    console.log('✅ Sample shipments created (SC-2026-0001, 0002, 0003)');
  }

  console.log('\n🎉 Seed complete! Run: npm run dev');
  process.exit(0);
}

seed().catch(err => {
  console.error('❌ Seed failed:', err.message);
  process.exit(1);
});
