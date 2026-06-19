import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Settings, ArrowLeft, Loader2, CheckCircle, Building2, MapPin, Phone, Mail,
  CreditCard, Smartphone, Landmark, Plus, Trash2, Pencil, X, Check,
} from 'lucide-react';
import {
  getSettings, updateSettings, type CompanySettings,
  getPaymentMethods, createPaymentMethod, updatePaymentMethod, deletePaymentMethod,
  type PaymentMethod,
} from '../api/shipments';
import DashboardLayout from '../components/DashboardLayout';

const emptyPayForm = { type: 'mobile' as 'mobile' | 'bank', network_name: '', account_name: '', account_number: '' };

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

  // Payment methods
  const [payments, setPayments] = useState<PaymentMethod[]>([]);
  const [payForm, setPayForm] = useState(emptyPayForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [paySaving, setPaySaving] = useState(false);
  const [payError, setPayError] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const [data, pay] = await Promise.all([getSettings(), getPaymentMethods()]);
        setOriginal(data);
        setForm({
          company_name: data.company_name,
          address: data.address,
          phone: data.phone,
          email: data.email,
        });
        setPayments(pay.payments);
      } catch {
        setError('Imeshindwa kupata settings.');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  function startEditPayment(p: PaymentMethod) {
    setEditingId(p.id);
    setPayForm({
      type: p.type,
      network_name: p.network_name,
      account_name: p.account_name,
      account_number: p.account_number,
    });
    setPayError('');
  }

  function cancelEditPayment() {
    setEditingId(null);
    setPayForm(emptyPayForm);
    setPayError('');
  }

  async function handleSavePayment(e: React.FormEvent) {
    e.preventDefault();
    if (!payForm.network_name.trim()) {
      setPayError(payForm.type === 'bank' ? 'Jina la benki linahitajika.' : 'Jina la mtandao linahitajika.');
      return;
    }
    if (!payForm.account_number.trim()) {
      setPayError('Namba ya malipo inahitajika.');
      return;
    }
    setPaySaving(true);
    setPayError('');
    try {
      if (editingId) {
        const updated = await updatePaymentMethod(editingId, payForm);
        setPayments(prev => prev.map(p => (p.id === editingId ? updated : p)));
      } else {
        const created = await createPaymentMethod(payForm);
        setPayments(prev => [...prev, created]);
      }
      cancelEditPayment();
    } catch (err: unknown) {
      setPayError((err as { response?: { data?: { error?: string } } })?.response?.data?.error ?? 'Imeshindwa kuhifadhi malipo.');
    } finally {
      setPaySaving(false);
    }
  }

  async function handleDeletePayment(id: string) {
    if (!confirm('Una uhakika unataka kufuta njia hii ya malipo?')) return;
    const prev = payments;
    setPayments(p => p.filter(x => x.id !== id));
    try {
      await deletePaymentMethod(id);
      if (editingId === id) cancelEditPayment();
    } catch {
      setPayments(prev);
      setPayError('Imeshindwa kufuta njia ya malipo.');
    }
  }

  async function handleTogglePayment(p: PaymentMethod) {
    const updated = { ...p, is_active: !p.is_active };
    setPayments(prev => prev.map(x => (x.id === p.id ? updated : x)));
    try {
      await updatePaymentMethod(p.id, { is_active: updated.is_active });
    } catch {
      setPayments(prev => prev.map(x => (x.id === p.id ? p : x)));
    }
  }

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
    <DashboardLayout title="Settings">
      {/* Header */}
      <div className="bg-gradient-to-br from-[#0a1747] via-brand-blue to-[#1a2d7a] text-white px-4 sm:px-6 lg:px-10 py-6 relative overflow-hidden">
        <div className="absolute inset-0 opacity-[0.06] pointer-events-none"
          style={{
            backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)',
            backgroundSize: '50px 50px'
          }}
        />
        <div className="relative flex items-center gap-3">
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

        {/* Section: Payment methods */}
        {!loading && (
          <div className="bg-white shadow-md border border-gray-100 p-6 sm:p-8 mt-8">
            <div className="flex items-center gap-2 mb-1 pb-3 border-b border-gray-100">
              <CreditCard className="w-5 h-5 text-brand-blue" />
              <h2 className="text-base font-bold text-gray-900">Njia za Malipo</h2>
            </div>
            <p className="text-xs text-gray-400 mb-5 mt-2">
              Ongeza mitandao ya simu au benki ambapo wateja watalipa. Zitaonekana kwa wateja wakati wa kulipa.
            </p>

            {/* Add / Edit form */}
            <form onSubmit={handleSavePayment} className="bg-gray-50 border border-gray-200 rounded-xl p-4 sm:p-5 mb-6 space-y-4">
              <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                {editingId ? 'Hariri njia ya malipo' : 'Ongeza njia mpya'}
              </p>

              {/* Type toggle: mobile or bank */}
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setPayForm(p => ({ ...p, type: 'mobile' }))}
                  className={`flex items-center justify-center gap-2 py-2.5 rounded-lg border text-sm font-medium transition ${
                    payForm.type === 'mobile'
                      ? 'border-brand-blue bg-brand-blue/5 text-brand-blue'
                      : 'border-gray-200 bg-white text-gray-500 hover:border-gray-300'
                  }`}
                >
                  <Smartphone className="w-4 h-4" /> Mtandao wa Simu
                </button>
                <button
                  type="button"
                  onClick={() => setPayForm(p => ({ ...p, type: 'bank' }))}
                  className={`flex items-center justify-center gap-2 py-2.5 rounded-lg border text-sm font-medium transition ${
                    payForm.type === 'bank'
                      ? 'border-brand-blue bg-brand-blue/5 text-brand-blue'
                      : 'border-gray-200 bg-white text-gray-500 hover:border-gray-300'
                  }`}
                >
                  <Landmark className="w-4 h-4" /> Benki
                </button>
              </div>

              <div>
                <label className="label">{payForm.type === 'bank' ? 'Jina la Benki *' : 'Jina la Mtandao *'}</label>
                <input
                  value={payForm.network_name}
                  onChange={e => setPayForm(p => ({ ...p, network_name: e.target.value }))}
                  placeholder={payForm.type === 'bank' ? 'CRDB, NMB, NBC...' : 'M-Pesa, Tigo Pesa, Airtel Money...'}
                  className="input-field"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="label">Jina la Malipo</label>
                  <input
                    value={payForm.account_name}
                    onChange={e => setPayForm(p => ({ ...p, account_name: e.target.value }))}
                    placeholder="Jina lililosajiliwa"
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="label">{payForm.type === 'bank' ? 'Namba ya Akaunti *' : 'Namba ya Malipo *'}</label>
                  <input
                    value={payForm.account_number}
                    onChange={e => setPayForm(p => ({ ...p, account_number: e.target.value }))}
                    placeholder={payForm.type === 'bank' ? '0150xxxxxxxxx' : '0700 000 000'}
                    className="input-field"
                  />
                </div>
              </div>

              {payError && (
                <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-3 py-2 rounded-lg">{payError}</div>
              )}

              <div className="flex gap-3">
                {editingId && (
                  <button type="button" onClick={cancelEditPayment} className="btn-outline px-4 py-2.5 text-sm flex items-center gap-1.5">
                    <X className="w-4 h-4" /> Acha
                  </button>
                )}
                <button
                  type="submit"
                  disabled={paySaving}
                  className="btn-primary px-5 py-2.5 text-sm flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {paySaving
                    ? <><Loader2 className="w-4 h-4 animate-spin" /> Inahifadhi...</>
                    : editingId
                      ? <><Check className="w-4 h-4" /> Hifadhi</>
                      : <><Plus className="w-4 h-4" /> Ongeza</>
                  }
                </button>
              </div>
            </form>

            {/* List */}
            {payments.length === 0 ? (
              <div className="text-center py-8 text-sm text-gray-400">
                Hakuna njia ya malipo bado. Ongeza moja hapo juu.
              </div>
            ) : (
              <div className="space-y-3">
                {payments.map(p => (
                  <div
                    key={p.id}
                    className={`flex items-center gap-3 border rounded-xl px-4 py-3 ${
                      p.is_active ? 'border-gray-200 bg-white' : 'border-gray-200 bg-gray-50 opacity-70'
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
                      p.type === 'bank' ? 'bg-emerald-50 text-emerald-600' : 'bg-blue-50 text-brand-blue'
                    }`}>
                      {p.type === 'bank' ? <Landmark className="w-5 h-5" /> : <Smartphone className="w-5 h-5" />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-gray-900 text-sm">{p.network_name}</span>
                        <span className="text-[10px] uppercase tracking-wider font-medium text-gray-400 border border-gray-200 rounded px-1.5 py-0.5">
                          {p.type === 'bank' ? 'Benki' : 'Simu'}
                        </span>
                        {!p.is_active && (
                          <span className="text-[10px] uppercase tracking-wider font-medium text-amber-600 bg-amber-50 rounded px-1.5 py-0.5">
                            Imezimwa
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 truncate">
                        {p.account_number}{p.account_name ? ` — ${p.account_name}` : ''}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => handleTogglePayment(p)}
                        title={p.is_active ? 'Zima' : 'Washa'}
                        className={`text-xs px-2.5 py-1.5 rounded-lg border transition ${
                          p.is_active
                            ? 'border-gray-200 text-gray-500 hover:bg-gray-50'
                            : 'border-green-200 text-green-600 hover:bg-green-50'
                        }`}
                      >
                        {p.is_active ? 'Zima' : 'Washa'}
                      </button>
                      <button
                        onClick={() => startEditPayment(p)}
                        title="Hariri"
                        className="p-2 text-gray-400 hover:text-brand-blue hover:bg-blue-50 rounded-lg transition"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeletePayment(p.id)}
                        title="Futa"
                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
