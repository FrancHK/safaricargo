import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Building2, Plus, ArrowLeft, Loader2, X, MapPin, Pencil, Trash2,
  Users, CheckCircle, XCircle, RefreshCw
} from 'lucide-react';
import { getAllBranches, createBranch, updateBranch, deleteBranch, type Branch } from '../api/shipments';
import DashboardLayout from '../components/DashboardLayout';

const TANZANIA_REGIONS = [
  'Arusha','Dar es Salaam','Dodoma','Geita','Iringa','Kagera',
  'Katavi','Kigoma','Kilimanjaro','Lindi','Manyara','Mara',
  'Mbeya','Morogoro','Mtwara','Mwanza','Njombe','Pemba Kaskazini',
  'Pemba Kusini','Pwani','Rukwa','Ruvuma','Shinyanga','Simiyu',
  'Singida','Songwe','Tabora','Tanga','Unguja Kaskazini',
  'Unguja Kusini','Mjini Magharibi'
];

const INITIAL_FORM = { name: '', location: '', region: '' };

export default function AdminBranches() {
  const navigate = useNavigate();
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [editBranch, setEditBranch] = useState<Branch | null>(null);
  const [form, setForm] = useState(INITIAL_FORM);
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const fetchBranches = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getAllBranches();
      setBranches(res.branches);
    } catch { /* silent */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchBranches(); }, [fetchBranches]);

  function openAdd() {
    setForm(INITIAL_FORM);
    setFormError('');
    setShowAdd(true);
  }

  function openEdit(b: Branch) {
    setEditBranch(b);
    setForm({ name: b.name, location: b.location, region: b.region });
    setFormError('');
  }

  function closeForm() {
    setShowAdd(false);
    setEditBranch(null);
    setForm(INITIAL_FORM);
    setFormError('');
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) { setFormError('Jina la tawi linahitajika.'); return; }
    setFormLoading(true);
    setFormError('');
    try {
      if (editBranch) {
        const updated = await updateBranch(editBranch.id, form);
        setBranches(prev => prev.map(b => b.id === editBranch.id
          ? { ...b, ...updated, staff_total: b.staff_total, staff_active: b.staff_active }
          : b));
      } else {
        const created = await createBranch(form);
        setBranches(prev => [created, ...prev]);
      }
      closeForm();
    } catch (err: unknown) {
      setFormError((err as { response?: { data?: { error?: string } } })?.response?.data?.error ?? 'Imeshindwa.');
    } finally { setFormLoading(false); }
  }

  async function handleToggle(b: Branch) {
    try {
      const updated = await updateBranch(b.id, { is_active: !b.is_active });
      setBranches(prev => prev.map(x => x.id === b.id ? { ...x, is_active: updated.is_active } : x));
    } catch { alert('Imeshindwa kubadilisha hali.'); }
  }

  async function handleDelete(id: string) {
    try {
      await deleteBranch(id);
      setBranches(prev => prev.filter(b => b.id !== id));
      setDeleteConfirm(null);
    } catch { alert('Imeshindwa kufuta.'); }
  }

  const totalStaff = branches.reduce((sum, b) => sum + b.staff_total, 0);

  return (
    <DashboardLayout title="Matawi (Branches)">
      {/* Header */}
      <div className="relative bg-gradient-to-br from-[#0a1747] via-brand-blue to-[#1a2d7a] text-white px-4 sm:px-6 lg:px-10 py-6 overflow-hidden">
        <div className="absolute inset-0 opacity-[0.06] pointer-events-none"
          style={{
            backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)',
            backgroundSize: '50px 50px'
          }}
        />
        <div className="relative max-w-7xl mx-auto">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-12 h-12 bg-white/10 backdrop-blur-md border border-white/20 rounded-xl flex items-center justify-center shadow-lg">
              <Building2 className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1">
              <h1 className="text-2xl font-bold tracking-tight">Matawi (Branches)</h1>
              <p className="text-blue-200/80 text-sm">Simamia matawi ya kampuni na wafanyakazi wao</p>
            </div>
            <button
              onClick={openAdd}
              className="flex items-center gap-2 bg-brand-green hover:bg-brand-green-dark text-white text-sm font-semibold px-5 py-2.5 rounded-xl shadow-lg shadow-brand-green/25 transition-all"
            >
              <Plus className="w-4 h-4" /> Ongeza Tawi
            </button>
          </div>

          {/* Summary */}
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
            <div className="bg-white/10 backdrop-blur-md border border-white/15 rounded-xl p-3 flex items-center gap-3">
              <div className="w-10 h-10 bg-white/15 rounded-lg flex items-center justify-center">
                <Building2 className="w-5 h-5" />
              </div>
              <div>
                <p className="text-2xl font-bold leading-none">{branches.length}</p>
                <p className="text-[10px] text-blue-200/80 uppercase tracking-widest mt-1">Total Matawi</p>
              </div>
            </div>
            <div className="bg-white/10 backdrop-blur-md border border-white/15 rounded-xl p-3 flex items-center gap-3">
              <div className="w-10 h-10 bg-brand-green/30 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-brand-green-light" />
              </div>
              <div>
                <p className="text-2xl font-bold leading-none">{branches.filter(b => b.is_active).length}</p>
                <p className="text-[10px] text-blue-200/80 uppercase tracking-widest mt-1">Yanafanya kazi</p>
              </div>
            </div>
            <div className="bg-white/10 backdrop-blur-md border border-white/15 rounded-xl p-3 flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-400/30 rounded-lg flex items-center justify-center">
                <Users className="w-5 h-5 text-blue-200" />
              </div>
              <div>
                <p className="text-2xl font-bold leading-none">{totalStaff}</p>
                <p className="text-[10px] text-blue-200/80 uppercase tracking-widest mt-1">Wafanyakazi Wote</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Orodha ya Matawi</h2>
            <p className="text-xs text-gray-500 mt-0.5">Kila tawi linaonyesha idadi ya wafanyakazi (kutoka station ya staff)</p>
          </div>
          <button
            onClick={fetchBranches}
            className="border border-gray-200 bg-white hover:bg-gray-50 p-2.5 rounded-xl transition-all"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 text-gray-500 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-8 h-8 text-brand-blue animate-spin" />
          </div>
        ) : branches.length === 0 ? (
          <div className="bg-white border-2 border-dashed border-gray-200 rounded-2xl py-16 text-center">
            <Building2 className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 font-medium">Hakuna tawi bado</p>
            <p className="text-gray-400 text-sm mb-4">Ongeza tawi la kwanza kuanza.</p>
            <button onClick={openAdd} className="btn-primary inline-flex items-center gap-2 px-5 py-2.5 text-sm">
              <Plus className="w-4 h-4" /> Ongeza Tawi
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {branches.map(b => (
              <div key={b.id} className="bg-white border border-gray-100 rounded-2xl shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all overflow-hidden group flex flex-col">
                {/* Identity */}
                <div className="p-5 pb-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-11 h-11 bg-gradient-to-br from-brand-blue to-blue-700 rounded-xl flex items-center justify-center shadow-md flex-shrink-0">
                        <Building2 className="w-5 h-5 text-white" />
                      </div>
                      <div className="min-w-0">
                        <h3 className="text-base font-bold text-gray-900 truncate">{b.name}</h3>
                        {(b.location || b.region) ? (
                          <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                            <MapPin className="w-3 h-3 flex-shrink-0" />
                            <span className="truncate">{[b.location, b.region].filter(Boolean).join(' · ')}</span>
                          </p>
                        ) : (
                          <p className="text-xs text-gray-300 mt-0.5">Hakuna eneo</p>
                        )}
                      </div>
                    </div>
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider flex-shrink-0 ${
                      b.is_active
                        ? 'bg-green-50 text-green-700 border border-green-200'
                        : 'bg-red-50 text-red-600 border border-red-200'
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${b.is_active ? 'bg-green-500' : 'bg-red-400'}`} />
                      {b.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>

                {/* Staff count */}
                <div className="px-5">
                  <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100 rounded-xl p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-3xl font-bold text-brand-blue leading-none">{b.staff_total}</p>
                        <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider mt-1.5">Wafanyakazi</p>
                      </div>
                      <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-sm">
                        <Users className="w-6 h-6 text-brand-blue" />
                      </div>
                    </div>
                    {b.staff_total > 0 ? (
                      <div className="flex items-center gap-2 mt-3">
                        <span className="inline-flex items-center gap-1 bg-green-100 text-green-700 text-[10px] font-semibold px-2 py-1 rounded-full">
                          <span className="w-1.5 h-1.5 rounded-full bg-green-500" /> {b.staff_active} active
                        </span>
                        {b.staff_total - b.staff_active > 0 && (
                          <span className="inline-flex items-center gap-1 bg-gray-100 text-gray-500 text-[10px] font-semibold px-2 py-1 rounded-full">
                            <span className="w-1.5 h-1.5 rounded-full bg-gray-400" /> {b.staff_total - b.staff_active} suspended
                          </span>
                        )}
                      </div>
                    ) : (
                      <p className="text-[11px] text-gray-400 mt-3">Hakuna mfanyakazi kwenye station hii</p>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="p-5 pt-4 mt-auto flex gap-2">
                  <button
                    onClick={() => openEdit(b)}
                    className="flex-1 text-xs font-semibold text-gray-600 border border-gray-200 px-3 py-2 rounded-lg hover:bg-brand-blue hover:text-white hover:border-brand-blue transition-colors flex items-center justify-center gap-1"
                  >
                    <Pencil className="w-3 h-3" /> Hariri
                  </button>
                  <button
                    onClick={() => handleToggle(b)}
                    className={`text-xs px-3 py-2 rounded-lg border transition-colors ${
                      b.is_active
                        ? 'text-red-600 border-red-200 hover:bg-red-50'
                        : 'text-green-700 border-green-200 hover:bg-green-50'
                    }`}
                    title={b.is_active ? 'Simamisha' : 'Wezesha'}
                  >
                    {b.is_active ? <XCircle className="w-3.5 h-3.5" /> : <CheckCircle className="w-3.5 h-3.5" />}
                  </button>
                  {deleteConfirm === b.id ? (
                    <div className="flex gap-1">
                      <button onClick={() => handleDelete(b.id)} className="text-xs text-red-600 border border-red-300 px-2 py-2 rounded-lg hover:bg-red-50">Ndio</button>
                      <button onClick={() => setDeleteConfirm(null)} className="text-xs text-gray-500 border border-gray-200 px-2 py-2 rounded-lg hover:bg-gray-50">Hapana</button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setDeleteConfirm(b.id)}
                      disabled={b.staff_total > 0}
                      className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-gray-400 disabled:cursor-not-allowed"
                      title={b.staff_total > 0 ? 'Hawezi kufuta — kuna wafanyakazi' : 'Futa'}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ═══ FORM MODAL (Add/Edit) ═══ */}
      {(showAdd || editBranch) && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-brand-blue rounded-xl flex items-center justify-center">
                  <Building2 className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-gray-900">
                    {editBranch ? 'Hariri Tawi' : 'Ongeza Tawi'}
                  </h2>
                  <p className="text-xs text-gray-500">Jaza sehemu zifuatazo</p>
                </div>
              </div>
              <button onClick={closeForm} className="p-2 hover:bg-gray-100 rounded-xl">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="label">Jina la Tawi *</label>
                <input
                  required
                  value={form.name}
                  onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                  placeholder="mfano: Dar es Salaam Hub"
                  className="input-field"
                />
                <p className="text-[10px] text-gray-400 mt-1">Jina hili ndilo litakalotumika kuwapanga wafanyakazi (kupitia "station" yao).</p>
              </div>

              <div>
                <label className="label flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-gray-400" /> Eneo / Location
                </label>
                <input
                  value={form.location}
                  onChange={e => setForm(p => ({ ...p, location: e.target.value }))}
                  placeholder="mfano: Mwenge, Sam Nujoma Rd"
                  className="input-field"
                />
              </div>

              <div>
                <label className="label">Mkoa</label>
                <select
                  value={form.region}
                  onChange={e => setForm(p => ({ ...p, region: e.target.value }))}
                  className="input-field"
                >
                  <option value="">Chagua mkoa...</option>
                  {TANZANIA_REGIONS.map(r => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </div>

              {formError && (
                <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg">
                  {formError}
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={closeForm} className="btn-outline flex-1 py-3 text-sm">Acha</button>
                <button type="submit" disabled={formLoading} className="btn-primary flex-1 py-3 text-sm flex items-center justify-center gap-2">
                  {formLoading
                    ? <><Loader2 className="w-4 h-4 animate-spin" /> Inahifadhi...</>
                    : editBranch ? 'Hifadhi' : 'Ongeza Tawi'
                  }
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
