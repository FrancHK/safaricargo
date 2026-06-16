/**
 * Migration: rename Usindikaji → Mpakiaji and deactivate staff in removed departments.
 *
 * Removed departments: Upokezi, Kituo cha Hub, Ukamilishaji
 * Renamed:             Usindikaji → Mpakiaji
 * Untouched:           Mapokezi, Usafirishaji, Utoaji
 *
 * Staff in removed departments are deactivated (is_active = false) — their records are
 * preserved so admin can reassign them through the UI. They cannot log in until reassigned.
 *
 * Run: cd backend && node src/migrate-departments.js
 */

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const { getSupabase } = require('./config/supabase');

const RENAME_MAP = {
  'Usindikaji': 'Mpakiaji',
};

const DEACTIVATE_DEPARTMENTS = ['Upokezi', 'Kituo cha Hub', 'Ukamilishaji'];

async function migrate() {
  const sb = getSupabase();
  console.log('🔄 Starting department migration...\n');

  // Snapshot before
  const { data: before } = await sb
    .from('sc_staff')
    .select('id, name, email, department, is_active');

  if (!before || before.length === 0) {
    console.log('ℹ️  No staff in database. Nothing to migrate.');
    process.exit(0);
  }

  const counts = before.reduce((acc, s) => {
    acc[s.department] = (acc[s.department] || 0) + 1;
    return acc;
  }, {});
  console.log('📋 Current staff by department:');
  Object.entries(counts).forEach(([dept, n]) => console.log(`   ${dept.padEnd(20)} ${n}`));
  console.log('');

  let renamedTotal = 0;
  let deactivatedTotal = 0;

  // 1) Rename Usindikaji → Mpakiaji
  for (const [oldName, newName] of Object.entries(RENAME_MAP)) {
    const { data, error } = await sb
      .from('sc_staff')
      .update({ department: newName })
      .eq('department', oldName)
      .select('id, name, email');
    if (error) {
      console.error(`❌ Rename ${oldName} → ${newName} failed:`, error.message);
      continue;
    }
    if (data && data.length > 0) {
      renamedTotal += data.length;
      console.log(`✅ Renamed ${data.length} staff: ${oldName} → ${newName}`);
      data.forEach(s => console.log(`     • ${s.name} (${s.email})`));
    } else {
      console.log(`ℹ️  No staff to rename from ${oldName}.`);
    }
  }

  // 2) Deactivate staff in removed departments
  console.log('');
  for (const dept of DEACTIVATE_DEPARTMENTS) {
    const { data, error } = await sb
      .from('sc_staff')
      .update({ is_active: false })
      .eq('department', dept)
      .eq('is_active', true)
      .select('id, name, email');
    if (error) {
      console.error(`❌ Deactivate ${dept} failed:`, error.message);
      continue;
    }
    if (data && data.length > 0) {
      deactivatedTotal += data.length;
      console.log(`⚠️  Deactivated ${data.length} staff in removed department "${dept}":`);
      data.forEach(s => console.log(`     • ${s.name} (${s.email}) — reassign via Admin → Wafanyakazi`));
    } else {
      console.log(`ℹ️  No active staff to deactivate in "${dept}".`);
    }
  }

  console.log('');
  console.log('═══════════════════════════════════════');
  console.log(`✅ Migration complete.`);
  console.log(`   Renamed:     ${renamedTotal}`);
  console.log(`   Deactivated: ${deactivatedTotal}`);
  console.log('═══════════════════════════════════════');

  if (deactivatedTotal > 0) {
    console.log('\n⚠️  Deactivated staff cannot log in until you reassign them to a new');
    console.log('   department (Mpakiaji / Usafirishaji / Utoaji) via the Admin → Wafanyakazi page.');
  }

  process.exit(0);
}

migrate().catch(err => {
  console.error('❌ Migration failed:', err.message);
  process.exit(1);
});
