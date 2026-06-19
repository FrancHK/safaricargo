import { useState, useEffect } from 'react';
import {
  Settings, Loader2, CheckCircle, Building2, MapPin, Phone, Mail,
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
  const [tab, setTab] = useState<'company' | 'payments'>('company');

  const [form, setForm] = useState({ company_name: '', address: '', phone: '', email: '' });
  const [original, setOriginal] = useState<CompanySettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  // Payment methods
  const [payments, setPayments] = useState<PaymentMethod[]>([]);
  const [payForm, setPayForm] = useState(emptyPayForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showPayForm, setShowPayForm] = useState(false);
  const [paySaving, setPaySaving] = useState(false);
  const [payError, setPayError] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const [data, pay] = await Promise.all([getSettings(), getPaymentMethods()]);
        setOriginal(data);
        setForm({ company_name: data.company_name, address: data.address, phone: data.phone, email: data.email });
        setPayments(pay.payments);
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

  function openNewPayment() {
    setEditingId(null);
    setPayForm(emptyPayForm);
    setPayError('');
    setShowPayForm(true);
  }

  function startEditPayment(p: PaymentMethod) {
    setEditingId(p.id);
    setPayForm({ type: p.type, network_name: p.network_name, account_name: p.account_name, account_number: p.account_number });
    setPayError('');
    setShowPayForm(true);
  }

  function cancelPayForm() {
    setEditingId(null);
    setPayForm(emptyPayForm);
    setPayError('');
    setShowPayForm(false);
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
      cancelPayForm();
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
      if (editingId === id) cancelPayForm();
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

  return (
    <DashboardLayout title="Settings">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 sm:px-6 lg:px-10 py-6">
        <div className="max-w-2xl mx-auto flex items-center gap-3">
          <div className="w-11 h-11 bg-brand-blue/10 rounded-xl flex items-center justify-center">
            <Settings className="w-5 h-5 text-brand-blue" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-gray-900">Mipangilio</h1>
            <p className="text-gray-500 text-sm">Maelezo ya kampuni na njia za malipo</p>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setTab('company')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition ${
              tab === 'company' ? 'bg-brand-blue text-white shadow-sm' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
            }`}
          >
            <Building2 className="w-4 h-4" /> Kampuni
          </button>
          <button
            onClick={() => setTab('payments')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition ${
              tab === 'payments' ? 'bg-brand-blue text-white shadow-sm' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
            }`}
          >
            <CreditCard className="w-4 h-4" /> Malipo
            {payments.length > 0 && (
              <span className={`text-[11px] rounded-full px-1.5 ${tab === 'payments' ? 'bg-white/20' : 'bg-gray-100 text-gray-500'}`}>
                {payments.length}
              </span>
            )}
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-7 h-7 text-brand-blue animate-spin" />
          </div>
        ) : tab === 'company' ? (
          /* ===== Company info ===== */
          <form onSubmit={handleSave} className="bg-white shadow-sm border border-gray-200 rounded-2xl p-5 sm:p-7 space-y-5">
            <div>
              <label className="label flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-gray-400" /> Jina la Kampuni
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
                <MapPin className="w-3.5 h-3.5 text-gray-400" /> Anwani
              </label>
              <input
                value={form.address}
                onChange={e => setForm(p => ({ ...p, address: e.target.value }))}
                required
                placeholder="P.O.Box 123, Dar es Salaam, Tanzania"
                className="input-field"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="label flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-gray-400" /> Simu
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
                  <Mail className="w-3.5 h-3.5 text-gray-400" /> Email
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

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg">{error}</div>
            )}
            {success && (
              <div className="bg-green-50 border border-green-200 text-green-700 text-sm px-4 py-3 rounded-lg flex items-center gap-2">
                <CheckCircle className="w-4 h-4" /> Imehifadhiwa.
              </div>
            )}

            <button
              type="submit"
              disabled={!dirty || saving}
              className="btn-primary w-full py-3 text-sm flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Inahifadhi...</> : <>Hifadhi Mabadiliko</>}
            </button>
          </form>
        ) : (
          /* ===== Payment methods ===== */
          <div className="space-y-4">
            {/* List */}
            {payments.length === 0 && !showPayForm ? (
              <div className="bg-white border border-dashed border-gray-300 rounded-2xl text-center py-12 px-6">
                <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <CreditCard className="w-6 h-6 text-gray-400" />
                </div>
                <p className="text-sm text-gray-500 mb-4">Hakuna njia ya malipo bado.</p>
                <button onClick={openNewPayment} className="btn-primary px-5 py-2.5 text-sm inline-flex items-center gap-2">
                  <Plus className="w-4 h-4" /> Ongeza njia ya malipo
                </button>
              </div>
            ) : (
              <>
                {payments.map(p => (
                  <div
                    key={p.id}
                    className={`flex items-center gap-3 bg-white border rounded-2xl px-4 py-3.5 shadow-sm ${
                      p.is_active ? 'border-gray-200' : 'border-gray-200 opacity-60'
                    }`}
                  >
                    <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${
                      p.type === 'bank' ? 'bg-emerald-50 text-emerald-600' : 'bg-blue-50 text-brand-blue'
                    }`}>
                      {p.type === 'bank' ? <Landmark className="w-5 h-5" /> : <Smartphone className="w-5 h-5" />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-gray-900 text-sm">{p.network_name}</span>
                        {!p.is_active && (
                          <span className="text-[10px] uppercase tracking-wider font-medium text-amber-600 bg-amber-50 rounded px-1.5 py-0.5">
                            Imezimwa
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-500 truncate">
                        {p.account_number}{p.account_name ? ` · ${p.account_name}` : ''}
                      </p>
                    </div>
                    <div className="flex items-center gap-0.5 shrink-0">
                      <button
                        onClick={() => handleTogglePayment(p)}
                        title={p.is_active ? 'Zima' : 'Washa'}
                        className={`text-xs px-2.5 py-1.5 rounded-lg transition ${
                          p.is_active ? 'text-gray-400 hover:bg-gray-100' : 'text-green-600 hover:bg-green-50'
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

                {/* Add button (when list has items and form is closed) */}
                {!showPayForm && (
                  <button
                    onClick={openNewPayment}
                    className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl border border-dashed border-gray-300 text-sm font-medium text-gray-500 hover:border-brand-blue hover:text-brand-blue transition"
                  >
                    <Plus className="w-4 h-4" /> Ongeza njia nyingine
                  </button>
                )}
              </>
            )}

            {/* Add / Edit form */}
            {showPayForm && (
              <form onSubmit={handleSavePayment} className="bg-white border border-gray-200 rounded-2xl p-5 sm:p-6 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <p className="font-semibold text-gray-900 text-sm">
                    {editingId ? 'Hariri njia ya malipo' : 'Njia mpya ya malipo'}
                  </p>
                  <button type="button" onClick={cancelPayForm} className="p-1.5 text-gray-400 hover:bg-gray-100 rounded-lg">
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Type toggle */}
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setPayForm(p => ({ ...p, type: 'mobile' }))}
                    className={`flex items-center justify-center gap-2 py-3 rounded-xl border text-sm font-medium transition ${
                      payForm.type === 'mobile'
                        ? 'border-brand-blue bg-brand-blue/5 text-brand-blue'
                        : 'border-gray-200 text-gray-500 hover:border-gray-300'
                    }`}
                  >
                    <Smartphone className="w-4 h-4" /> Mtandao wa Simu
                  </button>
                  <button
                    type="button"
                    onClick={() => setPayForm(p => ({ ...p, type: 'bank' }))}
                    className={`flex items-center justify-center gap-2 py-3 rounded-xl border text-sm font-medium transition ${
                      payForm.type === 'bank'
                        ? 'border-brand-blue bg-brand-blue/5 text-brand-blue'
                        : 'border-gray-200 text-gray-500 hover:border-gray-300'
                    }`}
                  >
                    <Landmark className="w-4 h-4" /> Benki
                  </button>
                </div>

                <div>
                  <label className="label">{payForm.type === 'bank' ? 'Jina la Benki' : 'Jina la Mtandao'}</label>
                  <input
                    value={payForm.network_name}
                    onChange={e => setPayForm(p => ({ ...p, network_name: e.target.value }))}
                    placeholder={payForm.type === 'bank' ? 'CRDB, NMB, NBC...' : 'M-Pesa, Tigo Pesa, Airtel Money...'}
                    className="input-field"
                    autoFocus
                  />
                </div>

                <div>
                  <label className="label">{payForm.type === 'bank' ? 'Namba ya Akaunti' : 'Namba ya Malipo'}</label>
                  <input
                    value={payForm.account_number}
                    onChange={e => setPayForm(p => ({ ...p, account_number: e.target.value }))}
                    placeholder={payForm.type === 'bank' ? '0150xxxxxxxxx' : '0700 000 000'}
                    className="input-field"
                  />
                </div>

                <div>
                  <label className="label">Jina la Malipo <span className="text-gray-400 font-normal">(hiari)</span></label>
                  <input
                    value={payForm.account_name}
                    onChange={e => setPayForm(p => ({ ...p, account_name: e.target.value }))}
                    placeholder="Jina lililosajiliwa kwenye akaunti"
                    className="input-field"
                  />
                </div>

                {payError && (
                  <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-3 py-2 rounded-lg">{payError}</div>
                )}

                <div className="flex gap-3 pt-1">
                  <button type="button" onClick={cancelPayForm} className="btn-outline flex-1 py-3 text-sm">
                    Acha
                  </button>
                  <button
                    type="submit"
                    disabled={paySaving}
                    className="btn-primary flex-1 py-3 text-sm flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
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
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
