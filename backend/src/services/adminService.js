const { getSupabase } = require('../config/supabase');
const bcrypt = require('bcryptjs');

async function createAdmin({ username, email, password, role = 'admin' }) {
  const sb = getSupabase();
  const hashed = await bcrypt.hash(password, 12);

  const { data, error } = await sb
    .from('sc_admins')
    .insert({ username, email: email.toLowerCase(), password: hashed, role })
    .select()
    .single();

  if (error) throw error;
  return data;
}

async function findAdminByEmail(email) {
  const sb = getSupabase();
  const { data, error } = await sb
    .from('sc_admins')
    .select('*')
    .eq('email', email.toLowerCase())
    .single();

  if (error || !data) return null;
  return data;
}

async function comparePassword(candidate, hashed) {
  return bcrypt.compare(candidate, hashed);
}

module.exports = { createAdmin, findAdminByEmail, comparePassword };
