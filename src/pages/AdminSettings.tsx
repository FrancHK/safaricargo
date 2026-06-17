import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Settings, ArrowLeft, Loader2, CheckCircle, Building2, MapPin, Phone, Mail } from 'lucide-react';
import { getSettings, updateSettings, type CompanySettings } from '../api/shipments';

export default function AdminSettings() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    company_name: '',
    address: '',
    phone: '',
    email: '',
  });
  const [original, setOriginal] = useState<CompanySettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const data = await getSettings();
        setOriginal(data);
        setForm({
          company_name: data.company_name,
          address: data.address,
          phone: data.phone,
          email: data.email,
        });
      } catch {
        setError('Imeshindwa kupata settings.');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const dirty = original && (
    form.company_name !== original.company_name ||
    form.address !== original.address ||
    form.phone !== original.phone ||
    form.email !== original.email
  );

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess(false);
    try {
      const updated = await updateSettings(form);
      setOriginal(updated);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: unknown) {
      setError((err as { response?: { data?: { error?: string } } })?.response?.data?.error ?? 'Imeshindwa kuhifadhi.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-br from-[#0a1747] via-brand-blue to-[#1a2d7a] text-white px-4 sm:px-6 lg:px-10 py-6 relative overflow-hidden">
        <div className="absolute inset-0 opacity-[0.06] pointer-events-none"
          style={{
            backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)',
            backgroundSize: '50px 50px'
          }}
        />
        <div className="relative flex items-center gap-3">
          <button
            onClick={() => navigate(localStorage.getItem('sc_mapokezi_token') ? '/mapokezi' : '/admin/dashboard')}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="w-12 h-12 bg-white/10 backdrop-blur-md border border-white/20 rounded-xl flex items-center justify-center shadow-lg">
            <Settings className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
            <p className="text-blue-200/80 text-sm">Mipangilio ya kampuni — inayoonekana kwenye labels na pages za umma</p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-8 h-8 text-brand-blue animate-spin" />
          </div>
        ) : (
          <form onSubmit={handleSave} className="bg-white shadow-md border border-gray-100 p-6 sm:p-8 space-y-6">

            {/* Section: Company info */}
            <div>
              <div className="flex items-center gap-2 mb-4 pb-3 border-b border-gray-100">
                <Building2 className="w-5 h-5 text-brand-blue" />
                <h2 className="text-base font-bold text-gray-900">Maelezo ya Kampuni</h2>
              </div>

              <div className="space-y-5">
                <div>
                  <label className="label flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5 text-gray-400" /> Jina la Kampuni *
                  </label>
                  <input
                    value={form.company_name}
                    onChange={e => setForm(p => ({ ...p, company_name: e.target.value }))}
                    required
                    placeholder="SafiriCargo Ltd"
                    className="input-field"
                  />
                </div>

                <div>
                  <label className="label flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-gray-400" /> Anwani *
                  </label>
                  <input
                    value={form.address}
                    onChange={e => setForm(p => ({ ...p, address: e.target.value }))}
                    required
                    placeholder="P.O.Box 123, Dar es Salaam, Tanzania"
                    className="input-field"
                  />
                  <p className="text-xs text-gray-400 mt-1.5">Itaonekana kwenye footer ya label</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="label flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-gray-400" /> Simu *
                    </label>
                    <input
                      value={form.phone}
                      onChange={e => setForm(p => ({ ...p, phone: e.target.value }))}
                      required
                      placeholder="+255 700 000 000"
                      className="input-field"
                    />
                  </div>
                  <div>
                    <label className="label flex items-center gap-1.5">
                      <Mail className="w-3.5 h-3.5 text-gray-400" /> Email *
                    </label>
                    <input
                      type="email"
                      value={form.email}
                      onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                      required
                      placeholder="info@safiricargo.com"
                      className="input-field"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Preview */}
            <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
              <p className="text-[10px] font-semibold text-brand-blue uppercase tracking-widest mb-2">Preview (Footer ya Label)</p>
              <div className="bg-white border border-gray-200 rounded-lg px-4 py-2.5 text-xs text-gray-600 flex flex-wrap items-center gap-2">
                <span>📍 {form.company_name || '—'} | {form.address || '—'}</span>
                <span className="text-gray-300">|</span>
                <span>📞 {form.phone || '—'}</span>
                <span className="text-gray-300">|</span>
                <span>✉ {form.email || '—'}</span>
              </div>
            </div>

            {/* Status */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg">
                {error}
              </div>
            )}
            {success && (
              <div className="bg-green-50 border border-green-200 text-green-700 text-sm px-4 py-3 rounded-lg flex items-center gap-2">
                <CheckCircle className="w-4 h-4" /> Settings zimehifadhiwa.
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3 pt-3 border-t border-gray-100">
              <button
                type="button"
                onClick={() => {
                  if (original) setForm({
                    company_name: original.company_name,
                    address: original.address,
                    phone: original.phone,
                    email: original.email,
                  });
                }}
                disabled={!dirty || saving}
                className="btn-outline flex-1 py-3 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Acha
              </button>
              <button
                type="submit"
                disabled={!dirty || saving}
                className="btn-primary flex-1 py-3 text-sm flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving
                  ? <><Loader2 className="w-4 h-4 animate-spin" /> Inahifadhi...</>
                  : <>Hifadhi Mabadiliko</>
                }
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
