import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Loader2, ShieldCheck, Inbox, Truck, MapPin, Clock } from 'lucide-react';
import axios from 'axios';
import { loginAdmin } from '../api/shipments';
import { useAuth } from '../contexts/AuthContext';

type Role = 'admin' | 'mapokezi';

export default function AdminLogin() {
  const [role, setRole] = useState<Role>('admin');
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  if (isAuthenticated) {
    navigate('/admin/dashboard');
    return null;
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  }

  function changeRole(next: Role) {
    setRole(next);
    setError('');
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (role === 'admin') {
        const { token, admin } = await loginAdmin(form.email, form.password);
        login(token, admin);
        navigate('/admin/dashboard');
      } else {
        const { data } = await axios.post('/api/staff/login', form);
        if (data.role !== 'mapokezi') {
          setError('Akaunti hii si ya Mapokezi. Tumia tab ya Admin.');
          return;
        }
        localStorage.setItem('sc_mapokezi_token', data.token);
        localStorage.setItem('sc_mapokezi', JSON.stringify(data.staff));
        navigate('/mapokezi');
      }
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error
        ?? 'Login failed. Please try again.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-gray-50">

      {/* LEFT — Form panel */}
      <div className="w-full lg:w-[480px] xl:w-[520px] flex flex-col justify-center px-6 sm:px-10 lg:px-14 py-10 bg-white shadow-xl relative z-10">

        {/* Logo — centered */}
        <div className="mb-8 flex justify-center">
          <img src="/logo.png" alt="SafiriCargo" className="h-44 w-auto object-contain" />
        </div>

        {/* Heading */}
        <div className="mb-6">
          <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold tracking-wide mb-4 transition-colors ${
            role === 'admin'
              ? 'bg-brand-blue/10 text-brand-blue'
              : 'bg-brand-green/10 text-brand-green-dark'
          }`}>
            {role === 'admin' ? <ShieldCheck className="w-3.5 h-3.5" /> : <Inbox className="w-3.5 h-3.5" />}
            {role === 'admin' ? 'Manager Portal' : 'Mapokezi Portal'}
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Welcome back</h2>
          <p className="text-gray-500">
            {role === 'admin'
              ? 'Sign in to manage shipments and operations across East Africa.'
              : 'Ingia kupokea, kusajili, na kupakia mizigo kwenye magari.'}
          </p>
        </div>

        {/* Role tabs */}
        <div className="grid grid-cols-2 gap-2 p-1 bg-gray-100 rounded-xl mb-7">
          <button
            type="button"
            onClick={() => changeRole('admin')}
            className={`flex items-center justify-center gap-2 px-3 py-3 rounded-lg text-sm font-semibold transition-all ${
              role === 'admin'
                ? 'bg-white text-brand-blue shadow-md'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            Manager
          </button>
          <button
            type="button"
            onClick={() => changeRole('mapokezi')}
            className={`flex items-center justify-center gap-2 px-3 py-3 rounded-lg text-sm font-semibold transition-all ${
              role === 'mapokezi'
                ? 'bg-white text-brand-green-dark shadow-md'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <Inbox className="w-4 h-4" />
            Mapokezi
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="label">Email Address</label>
            <input
              name="email"
              type="email"
              value={form.email}
              onChange={handleChange}
              required
              autoComplete="email"
              placeholder={role === 'admin' ? 'admin@safiricargo.com' : 'mapokezi@safiricargo.com'}
              className="input-field"
            />
          </div>

          <div>
            <label className="label">Password</label>
            <div className="relative">
              <input
                name="password"
                type={showPassword ? 'text' : 'password'}
                value={form.password}
                onChange={handleChange}
                required
                autoComplete="current-password"
                placeholder="••••••••"
                className="input-field pr-12"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className={`w-full flex items-center justify-center gap-2 py-3.5 text-base text-white font-semibold rounded-lg transition-all hover:-translate-y-0.5 ${
              role === 'admin'
                ? 'bg-brand-blue hover:bg-brand-blue-dark shadow-lg shadow-brand-blue/25 hover:shadow-brand-blue/40'
                : 'bg-brand-green hover:bg-brand-green-dark shadow-lg shadow-brand-green/25 hover:shadow-brand-green/40'
            } disabled:opacity-60 disabled:cursor-not-allowed`}
          >
            {loading
              ? <><Loader2 className="w-5 h-5 animate-spin" /> Signing in...</>
              : role === 'admin' ? 'Sign In to Dashboard' : 'Ingia Mapokezi'}
          </button>
        </form>

        <p className="text-center text-gray-400 text-xs mt-8">
          &copy; {new Date().getFullYear()} SafiriCargo. All rights reserved.
        </p>
      </div>

      {/* RIGHT — Visual panel with transport background */}
      <div className="hidden lg:flex relative flex-1 overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: 'url(/transport-bg.avif)' }}
        />
        <div className="absolute inset-0 bg-gradient-to-br from-[#0a1747]/85 via-brand-blue/70 to-[#0f1f5c]/90" />
        <div
          className="absolute inset-0 opacity-[0.06]"
          style={{
            backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)',
            backgroundSize: '60px 60px'
          }}
        />
        <div className="absolute top-20 -right-20 w-96 h-96 bg-brand-green/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-20 left-10 w-96 h-96 bg-blue-400/20 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col justify-between p-14 w-full text-white">
          <div>
            <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-xs font-semibold tracking-widest uppercase">
              <span className="w-1.5 h-1.5 rounded-full bg-brand-green animate-pulse" />
              Live Operations
            </span>
          </div>

          <div className="max-w-lg">
            <h3 className="text-4xl xl:text-5xl font-bold leading-tight mb-4 drop-shadow-lg">
              Manage cargo,<br/>
              <span className="bg-gradient-to-r from-brand-green-light to-emerald-300 bg-clip-text text-transparent">
                deliver with confidence.
              </span>
            </h3>
            <p className="text-blue-100/80 text-lg leading-relaxed">
              Track every shipment, dispatch every vehicle, and keep your customers updated — all from one dashboard.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-3 max-w-lg">
            <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-4 hover:bg-white/15 transition-colors">
              <Truck className="w-5 h-5 text-brand-green-light mb-2" />
              <p className="text-sm font-semibold">Live Fleet</p>
              <p className="text-xs text-blue-100/70 mt-0.5">Real-time</p>
            </div>
            <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-4 hover:bg-white/15 transition-colors">
              <MapPin className="w-5 h-5 text-brand-green-light mb-2" />
              <p className="text-sm font-semibold">East Africa</p>
              <p className="text-xs text-blue-100/70 mt-0.5">50+ cities</p>
            </div>
            <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-4 hover:bg-white/15 transition-colors">
              <Clock className="w-5 h-5 text-brand-green-light mb-2" />
              <p className="text-sm font-semibold">24/7</p>
              <p className="text-xs text-blue-100/70 mt-0.5">Support</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
