import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users, Plus, ArrowLeft, Loader2, Search, RefreshCw,
  Trash2, CheckCircle, XCircle, X, Eye, EyeOff, Scan,
  Pencil, Phone, MapPin, Building2
} from 'lucide-react';
import { getAllStaff, createStaff, updateStaff, deleteStaff, getAllBranches, type Branch } from '../api/shipments';
import type { Staff } from '../types';
import { DEPARTMENTS } from '../types';
import DashboardLayout from '../components/DashboardLayout';

const DEPT_STATUS: Record<string, string> = {
  'Mapokezi': 'Received',
  'Mpakiaji': 'Processing',
  'Usafirishaji': 'In Transit',
  'Utoaji': 'Out for Delivery'
};

const STATUS_COLOR: Record<string, string> = {
  'Received': 'bg-gray-400', 'Processing': 'bg-blue-500', 'In Transit': 'bg-yellow-500',
  'Arrived at Hub': 'bg-purple-500', 'Out for Delivery': 'bg-orange-500', 'Delivered': 'bg-green-500'
};

const INITIAL_FORM = { name: '', email: '', password: '', phone: '', department: '', station: '' };

export default function AdminStaff() {
  const navigate = useNavigate();
  const [staff, setStaff] = useState<Staff[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(INITIAL_FORM);
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [editStaff, setEditStaff] = useState<Staff | null>(null);
  const [editForm, setEditForm] = useState({ name: '', phone: '', station: '', department: '' });
  const [branches, setBranches] = useState<Branch[]>([]);
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState('');

  const fetchStaff = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getAllStaff();
      let list = res.staff;
      if (search) {
        const s = search.toLowerCase();
        list = list.filter(w => w.name.toLowerCase().includes(s) || w.email.toLowerCase().includes(s) || w.department.toLowerCase().includes(s));
      }
      setStaff(list);
      setTotal(res.total);
    } catch { /* silent */ }
    finally { setLoading(false); }
  }, [search]);

  useEffect(() => {
    const t = setTimeout(fetchStaff, 300);
    return () => clearTimeout(t);
  }, [fetchStaff]);

  useEffect(() => {
    getAllBranches()
      .then(res => setBranches(res.branches.filter(b => b.is_active)))
      .catch(() => { /* silent — fall back to free text */ });
  }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setFormLoading(true);
    setFormError('');
    try {
      const created = await createStaff(form);
      setStaff(prev => [created, ...prev]);
      setTotal(p => p + 1);
      setShowModal(false);
      setForm(INITIAL_FORM);
    } catch (err: unknown) {
      setFormError((err as { response?: { data?: { error?: string } } })?.response?.data?.error ?? 'Imeshindwa kuongeza.');
    } finally { setFormLoading(false); }
  }

  async function handleToggle(id: string, current: boolean) {
    try {
      const updated = await updateStaff(id, { is_active: !current });
      setStaff(prev => prev.map(w => w.id === id ? { ...w, is_active: updated.is_active } : w));
    } catch { alert('Imeshindwa kubadilisha hali.'); }
  }

  function openEdit(w: Staff) {
    setEditStaff(w);
    setEditForm({ name: w.name, phone: w.phone || '', station: w.station || '', department: w.department });
    setEditError('');
  }

  async function handleEditSave(e: React.FormEvent) {
    e.preventDefault();
    if (!editStaff) return;
    if (!editForm.name.trim()) { setEditError('Jina haliwezi kuwa tupu.'); return; }
    setEditLoading(true);
    setEditError('');
    try {
      const updated = await updateStaff(editStaff.id, {
        name: editForm.name.trim(),
        phone: editForm.phone,
        station: editForm.station,
        department: editForm.department,
      });
      setStaff(prev => prev.map(w => w.id === editStaff.id ? { ...w, ...updated } : w));
      setEditStaff(null);
    } catch (err: unknown) {
      setEditError((err as { response?: { data?: { error?: string } } })?.response?.data?.error ?? 'Imeshindwa kuhifadhi.');
    } finally {
      setEditLoading(false);
    }
  }

  async function handleDelete(id: string) {
    try {
      await deleteStaff(id);
      setStaff(prev => prev.filter(w => w.id !== id));
      setTotal(p => p - 1);
      setDeleteConfirm(null);
    } catch { alert('Imeshindwa kufuta.'); }
  }

  function timeAgo(date: string | null) {
    if (!date) return 'Haijawahi';
    const diff = Date.now() - new Date(date).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m iliyopita`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h iliyopita`;
    return `${Math.floor(hrs / 24)}d iliyopita`;
  }

  const activeCount = staff.filter(w => w.is_active).length;
  const totalScans = staff.reduce((sum, w) => sum + w.total_scans, 0);

  return (
    <DashboardLayout title="Wafanyakazi">
      {/* Header */}
      <div className="relative bg-gradient-to-br from-[#0a1747] via-brand-blue to-[#1a2d7a] text-white px-4 sm:px-6 lg:px-10 py-7 overflow-hidden">
        <div className="absolute inset-0 opacity-[0.06] pointer-events-none"
          style={{
            backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)',
            backgroundSize: '50px 50px'
          }}
        />
        <div className="absolute -top-24 right-0 w-72 h-72 bg-brand-green/15 rounded-full blur-3xl pointer-events-none" />
        {/* Clip-path accent shapes */}
        <div className="absolute right-0 top-0 h-full w-56 bg-brand-green/15 pointer-events-none hidden sm:block"
          style={{ clipPath: 'polygon(45% 0, 100% 0, 100% 100%, 12% 100%)' }} />
        <div className="absolute right-0 top-0 h-full w-40 bg-white/5 pointer-events-none hidden sm:block"
          style={{ clipPath: 'polygon(55% 0, 100% 0, 100% 100%, 22% 100%)' }} />

        <div className="relative">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-white/10 backdrop-blur-md border border-white/20 rounded-xl flex items-center justify-center shadow-lg flex-shrink-0">
              <Users className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl font-bold tracking-tight">Wafanyakazi</h1>
              <p className="text-blue-200/80 text-sm">Simamia wafanyakazi na vitendo vyao</p>
            </div>
            <button
              onClick={() => setShowModal(true)}
              className="hidden sm:flex items-center gap-2 bg-brand-green hover:bg-brand-green-dark text-white text-sm font-semibold px-5 py-2.5 rounded-xl shadow-lg shadow-brand-green/25 transition-all hover:-translate-y-0.5"
            >
              <Plus className="w-4 h-4" /> Ongeza Mfanyakazi
            </button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {[
              { label: 'Wafanyakazi Wote', value: total, color: 'from-blue-400 to-blue-600', icon: <Users className="w-5 h-5" /> },
              { label: 'Wanaofanya Kazi', value: activeCount, color: 'from-emerald-400 to-green-600', icon: <CheckCircle className="w-5 h-5" /> },
              { label: 'Vitengo', value: DEPARTMENTS.length, color: 'from-violet-400 to-purple-600', icon: <Building2 className="w-5 h-5" /> },
              { label: 'Jumla ya Scans', value: totalScans, color: 'from-amber-400 to-orange-600', icon: <Scan className="w-5 h-5" /> },
            ].map(c => (
              <div key={c.label} className="relative bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/15 hover:bg-white/[0.14] hover:-translate-y-0.5 transition-all overflow-hidden">
                <div className="flex items-center gap-3">
                  <div className={`bg-gradient-to-br ${c.color} p-2.5 rounded-xl shadow-md flex-shrink-0`}>{c.icon}</div>
                  <div className="min-w-0">
                    <p className="text-2xl font-bold leading-none">{c.value}</p>
                    <p className="text-blue-200/70 text-xs mt-1 truncate">{c.label}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="px-4 sm:px-6 lg:px-10 py-6">
        {/* Toolbar */}
        <div className="card mb-6 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div className="flex gap-2 w-full sm:w-auto">
            <div className="flex-1 sm:w-64 flex items-center gap-2 border border-gray-300 rounded-lg px-3 py-2 focus-within:ring-2 focus-within:ring-brand-blue">
              <Search className="w-4 h-4 text-gray-400" />
              <input placeholder="Tafuta mfanyakazi..." value={search} onChange={e => setSearch(e.target.value)} className="flex-1 text-sm outline-none bg-transparent" />
            </div>
            <button onClick={fetchStaff} className="border border-gray-300 p-2 rounded-lg hover:bg-gray-50">
              <RefreshCw className={`w-4 h-4 text-gray-500 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
          <button onClick={() => setShowModal(true)} className="sm:hidden flex items-center justify-center gap-2 bg-brand-green hover:bg-brand-green-dark text-white font-semibold px-5 py-2.5 rounded-lg transition-colors w-full">
            <Plus className="w-4 h-4" /> Ongeza Mfanyakazi
          </button>
        </div>

        {/* Table */}
        <div className="card overflow-hidden p-0">
          {loading ? (
            <div className="flex items-center justify-center py-16"><Loader2 className="w-8 h-8 text-brand-blue animate-spin" /></div>
          ) : staff.length === 0 ? (
            <div className="text-center py-16">
              <Users className="w-12 h-12 text-gray-200 mx-auto mb-3" />
              <p className="text-gray-400 font-medium">Hakuna wafanyakazi bado</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    {['Mfanyakazi', 'Simu', 'Kitengo', 'Kituo', 'Nambari', 'Scans', 'Hali', 'Vitendo'].map(h => (
                      <th key={h} className="text-left px-4 py-3.5 font-semibold text-gray-600 text-xs uppercase tracking-wide whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {staff.map(w => (
                    <tr key={w.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-brand-blue flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                            {w.name.charAt(0)}
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900">{w.name}</p>
                            <p className="text-xs text-gray-400">{w.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3.5 text-gray-700 text-sm font-medium whitespace-nowrap">
                        {w.phone ? (
                          <a href={`tel:${w.phone}`} className="hover:text-brand-blue inline-flex items-center gap-1">
                            <Phone className="w-3 h-3 text-gray-400" /> {w.phone}
                          </a>
                        ) : <span className="text-gray-300">—</span>}
                      </td>
                      <td className="px-4 py-3.5">
                        <div>
                          <p className="font-medium text-gray-800 text-xs">{w.department}</p>
                          <span className={`inline-block mt-0.5 text-xs text-white px-2 py-0.5 rounded-full ${STATUS_COLOR[DEPT_STATUS[w.department]] || 'bg-gray-400'}`}>
                            {DEPT_STATUS[w.department]}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3.5 text-gray-600 text-xs">{w.station || '—'}</td>
                      <td className="px-4 py-3.5 font-mono text-xs text-brand-blue font-semibold">{w.employee_id}</td>
                      <td className="px-4 py-3.5">
                        <p className="font-bold text-gray-900">{w.total_scans}</p>
                        <p className="text-[10px] text-gray-400">{timeAgo(w.last_scan)}</p>
                      </td>
                      <td className="px-4 py-3.5">
                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${w.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${w.is_active ? 'bg-green-500' : 'bg-red-400'}`} />
                          {w.is_active ? 'Active' : 'Suspended'}
                        </span>
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-2">
                          <button onClick={() => openEdit(w)}
                            className="text-xs px-2.5 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-brand-blue hover:text-white hover:border-brand-blue transition-colors"
                            title="Hariri">
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button onClick={() => handleToggle(w.id, w.is_active)}
                            className={`text-xs px-2.5 py-1.5 rounded-lg border transition-colors ${w.is_active ? 'text-red-600 border-red-200 hover:bg-red-50' : 'text-green-700 border-green-200 hover:bg-green-50'}`}>
                            {w.is_active ? <XCircle className="w-3.5 h-3.5" /> : <CheckCircle className="w-3.5 h-3.5" />}
                          </button>
                          {deleteConfirm === w.id ? (
                            <div className="flex gap-1">
                              <button onClick={() => handleDelete(w.id)} className="text-xs text-red-600 border border-red-300 px-2 py-1.5 rounded-lg hover:bg-red-50">Ndio</button>
                              <button onClick={() => setDeleteConfirm(null)} className="text-xs text-gray-500 border border-gray-200 px-2 py-1.5 rounded-lg hover:bg-gray-50">Hapana</button>
                            </div>
                          ) : (
                            <button onClick={() => setDeleteConfirm(w.id)} className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {!loading && staff.length > 0 && (
            <div className="px-4 py-3 bg-gray-50 border-t text-xs text-gray-500">Wafanyakazi {staff.length}</div>
          )}
        </div>
      </div>

      {/* Add Staff Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h2 className="text-lg font-bold text-gray-900">Ongeza Mfanyakazi</h2>
              <button onClick={() => { setShowModal(false); setFormError(''); setForm(INITIAL_FORM); }} className="p-2 hover:bg-gray-100 rounded-full">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <form onSubmit={handleCreate} className="p-6 space-y-4">
              <div>
                <label className="label">Jina Kamili *</label>
                <input required value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="Jina la mfanyakazi" className="input-field" />
              </div>
              <div>
                <label className="label">Email *</label>
                <input type="email" required value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} placeholder="email@safiricargo.com" className="input-field" />
              </div>
              <div>
                <label className="label">Password *</label>
                <div className="relative">
                  <input type={showPwd ? 'text' : 'password'} required value={form.password} onChange={e => setForm(p => ({ ...p, password: e.target.value }))} placeholder="Angalau herufi 6" className="input-field pr-10" />
                  <button type="button" onClick={() => setShowPwd(!showPwd)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                    {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <div>
                <label className="label">Simu</label>
                <input value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} placeholder="+255 700 000 000" className="input-field" />
              </div>
              <div>
                <label className="label">Kitengo (Department) *</label>
                <select required value={form.department} onChange={e => setForm(p => ({ ...p, department: e.target.value }))} className="input-field">
                  <option value="">Chagua kitengo...</option>
                  {DEPARTMENTS.map(d => (
                    <option key={d.name} value={d.name}>{d.label} → {d.status}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">Kituo / Station</label>
                {branches.length > 0 ? (
                  <select
                    value={form.station}
                    onChange={e => setForm(p => ({ ...p, station: e.target.value }))}
                    className="input-field"
                  >
                    <option value="">— Hakuna —</option>
                    {branches.map(b => (
                      <option key={b.id} value={b.name}>
                        {b.name}{b.region ? ` · ${b.region}` : ''}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    value={form.station}
                    onChange={e => setForm(p => ({ ...p, station: e.target.value }))}
                    placeholder="mfano: Dar es Salaam Hub"
                    className="input-field"
                  />
                )}
                {branches.length === 0 && (
                  <p className="text-[10px] text-gray-400 mt-1">Ongeza matawi kwenye "Matawi" ili upate dropdown hapa.</p>
                )}
              </div>
              {formError && <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg">{formError}</div>}
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="btn-outline flex-1 py-3">Acha</button>
                <button type="submit" disabled={formLoading} className="btn-primary flex-1 py-3 flex items-center justify-center gap-2">
                  {formLoading ? <><Loader2 className="w-4 h-4 animate-spin" /> Inaongeza...</> : 'Ongeza'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ═══ EDIT MODAL ═══ */}
      {editStaff && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-brand-blue rounded-xl flex items-center justify-center">
                  <Pencil className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-gray-900">Hariri Mfanyakazi</h2>
                  <p className="text-xs text-gray-500">{editStaff.name}</p>
                </div>
              </div>
              <button onClick={() => setEditStaff(null)} className="p-2 hover:bg-gray-100 rounded-full">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <form onSubmit={handleEditSave} className="p-6 space-y-4">
              <div>
                <label className="label">Jina Kamili *</label>
                <input
                  required
                  value={editForm.name}
                  onChange={e => setEditForm(p => ({ ...p, name: e.target.value }))}
                  placeholder="Jina la mfanyakazi"
                  className="input-field"
                />
              </div>

              <div>
                <label className="label flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-gray-400" /> Simu
                </label>
                <input
                  value={editForm.phone}
                  onChange={e => setEditForm(p => ({ ...p, phone: e.target.value }))}
                  placeholder="+255 700 000 000"
                  className="input-field"
                />
              </div>

              <div>
                <label className="label">Kitengo (Department)</label>
                <select
                  value={editForm.department}
                  onChange={e => setEditForm(p => ({ ...p, department: e.target.value }))}
                  className="input-field"
                >
                  {DEPARTMENTS.map(d => (
                    <option key={d.name} value={d.name}>{d.label} → {d.status}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="label flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-gray-400" /> Kituo / Station
                </label>
                {branches.length > 0 ? (
                  <select
                    value={editForm.station}
                    onChange={e => setEditForm(p => ({ ...p, station: e.target.value }))}
                    className="input-field"
                  >
                    <option value="">— Hakuna —</option>
                    {branches.map(b => (
                      <option key={b.id} value={b.name}>
                        {b.name}{b.region ? ` · ${b.region}` : ''}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    value={editForm.station}
                    onChange={e => setEditForm(p => ({ ...p, station: e.target.value }))}
                    placeholder="mfano: Dar es Salaam Hub"
                    className="input-field"
                  />
                )}
                {branches.length === 0 && (
                  <p className="text-[10px] text-gray-400 mt-1">Ongeza matawi kwenye "Matawi" ili upate dropdown hapa.</p>
                )}
              </div>

              {editError && (
                <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg">
                  {editError}
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setEditStaff(null)} className="btn-outline flex-1 py-3">Acha</button>
                <button type="submit" disabled={editLoading} className="btn-primary flex-1 py-3 flex items-center justify-center gap-2">
                  {editLoading ? <><Loader2 className="w-4 h-4 animate-spin" /> Inahifadhi...</> : 'Hifadhi'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
