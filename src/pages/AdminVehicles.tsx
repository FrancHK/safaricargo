import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Truck, Plus, ArrowLeft, Loader2, X, RefreshCw,
  CheckCircle, Wrench, Package, Weight, Send, RotateCcw, Trash2,
  MapPin, Clock, PackageOpen
} from 'lucide-react';
import axios from 'axios';
import type { Vehicle } from '../types';
import DashboardLayout from '../components/DashboardLayout';

const STATUS_COLORS: Record<string, string> = {
  available:   'bg-green-100 text-green-700 border-green-200',
  loading:     'bg-yellow-100 text-yellow-700 border-yellow-200',
  in_transit:  'bg-blue-100 text-blue-700 border-blue-200',
  arrived:     'bg-purple-100 text-purple-700 border-purple-200',
  maintenance: 'bg-red-100 text-red-600 border-red-200'
};
const STATUS_LABELS: Record<string, string> = {
  available: 'Inasubiri', loading: 'Inapakiwa',
  in_transit: 'Safarini', arrived: 'Imefika', maintenance: 'Matengenezo'
};
const VEHICLE_TYPES = ['truck', 'van', 'pickup', 'container', 'minibus'];

function api() {
  const token =
    localStorage.getItem('sc_token') ||
    localStorage.getItem('sc_mapokezi_token');
  return axios.create({ baseURL: '/api', headers: { Authorization: `Bearer ${token}` } });
}

export default function AdminVehicles() {
  const navigate = useNavigate();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ plate_number: '', vehicle_type: 'truck', capacity_kg: '5000', notes: '' });
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchVehicles = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api().get('/vehicles');
      setVehicles(data.vehicles || []);
    } catch { /* silent */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchVehicles(); }, [fetchVehicles]);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setFormLoading(true); setFormError('');
    try {
      const { data } = await api().post('/vehicles', form);
      setVehicles(prev => [data, ...prev]);
      setShowAdd(false);
      setForm({ plate_number: '', vehicle_type: 'truck', capacity_kg: '5000', notes: '' });
    } catch (err: unknown) {
      setFormError((err as { response?: { data?: { error?: string } } })?.response?.data?.error ?? 'Imeshindwa.');
    } finally { setFormLoading(false); }
  }

  async function handleClear(id: string) {
    setActionLoading(id + '-clear');
    try {
      await api().post(`/vehicles/${id}/clear`);
      fetchVehicles();
    } catch { alert('Imeshindwa kusafisha gali.'); }
    finally { setActionLoading(null); }
  }

  async function handleArrive(id: string) {
    setActionLoading(id + '-arrive');
    try {
      await api().post(`/vehicles/${id}/arrive`);
      fetchVehicles();
    } catch { alert('Imeshindwa kubadilisha hali.'); }
    finally { setActionLoading(null); }
  }

  async function handleStatusChange(id: string, status: string) {
    setActionLoading(id + '-status');
    try {
      await api().patch(`/vehicles/${id}`, { status });
      fetchVehicles();
    } catch { alert('Imeshindwa.'); }
    finally { setActionLoading(null); }
  }

  async function handleDelete(id: string) {
    try {
      await api().delete(`/vehicles/${id}`);
      setVehicles(prev => prev.filter(v => v.id !== id));
      setDeleteConfirm(null);
    } catch { alert('Imeshindwa kufuta gali.'); }
  }

  const inTransit = vehicles.filter(v => v.status === 'in_transit');

  const stats = {
    total: vehicles.length,
    available: vehicles.filter(v => v.status === 'available').length,
    in_transit: inTransit.length,
    loading: vehicles.filter(v => v.status === 'loading').length,
  };

  return (
    <DashboardLayout title="Magali ya Kampuni">
      {/* Header */}
      <div className="bg-brand-blue text-white px-4 sm:px-6 lg:px-8 py-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-4 mb-6">
            <div>
              <h1 className="text-2xl font-bold">Magali ya Kampuni</h1>
              <p className="text-blue-300 text-sm mt-0.5">Simamia magali na mzigo</p>
            </div>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: 'Magali Yote', value: stats.total, color: 'bg-blue-500', icon: <Truck className="w-5 h-5" /> },
              { label: 'Yanasubiri', value: stats.available, color: 'bg-green-500', icon: <CheckCircle className="w-5 h-5" /> },
              { label: 'Safarini', value: stats.in_transit, color: 'bg-yellow-500', icon: <Send className="w-5 h-5" /> },
              { label: 'Inapakiwa', value: stats.loading, color: 'bg-purple-500', icon: <Package className="w-5 h-5" /> },
            ].map(c => (
              <div key={c.label} className="bg-white/10 rounded-xl p-4 border border-white/10">
                <div className="flex items-center gap-3">
                  <div className={`${c.color} p-2 rounded-lg`}>{c.icon}</div>
                  <div>
                    <p className="text-2xl font-bold">{c.value}</p>
                    <p className="text-blue-300 text-xs">{c.label}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Toolbar */}
        <div className="card mb-6 flex justify-between items-center">
          <p className="text-sm text-gray-500">Magali {vehicles.length} yamesajiliwa</p>
          <div className="flex gap-3">
            <button onClick={fetchVehicles} className="border border-gray-300 p-2 rounded-lg hover:bg-gray-50">
              <RefreshCw className={`w-4 h-4 text-gray-500 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button onClick={() => setShowAdd(true)} className="btn-primary flex items-center gap-2 py-2.5 text-sm">
              <Plus className="w-4 h-4" /> Sajili Gali
            </button>
          </div>
        </div>

        {/* Arrivals — magari yaliyo safarini, yanasubiri kufika */}
        {!loading && inTransit.length > 0 && (
          <div className="mb-6 bg-white border border-blue-200 rounded-2xl overflow-hidden shadow-sm">
            <div className="flex items-center gap-2.5 px-5 py-3.5 bg-blue-50 border-b border-blue-100">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-blue-500" />
              </span>
              <h2 className="font-bold text-gray-900 text-sm sm:text-base">Magari Safarini — Yanasubiri Kufika</h2>
              <span className="ml-auto text-xs font-semibold text-blue-700 bg-blue-100 rounded-full px-2.5 py-0.5">
                {inTransit.length}
              </span>
            </div>

            <div className="divide-y divide-gray-100">
              {inTransit.map(v => {
                const hasCargo = (v.current_load_count || 0) > 0;
                return (
                  <div key={v.id} className="flex flex-col sm:flex-row sm:items-center gap-3 px-5 py-4">
                    {/* Vehicle */}
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className="w-11 h-11 bg-blue-50 text-brand-blue rounded-xl flex items-center justify-center shrink-0">
                        <Truck className="w-5 h-5" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono font-bold text-brand-blue">{v.vehicle_code}</span>
                          <span className="text-sm font-semibold text-gray-700">{v.plate_number}</span>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-gray-500 mt-0.5 flex-wrap">
                          {v.route_from && (
                            <span className="flex items-center gap-1">
                              <MapPin className="w-3 h-3" /> {v.route_from} → {v.route_to || '—'}
                            </span>
                          )}
                          {v.driver_name && <span>Dereva: {v.driver_name}</span>}
                        </div>
                      </div>
                    </div>

                    {/* Cargo badge: na mizigo au tupu */}
                    <div className="shrink-0">
                      {hasCargo ? (
                        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-full px-3 py-1.5">
                          <Package className="w-3.5 h-3.5" /> Na mizigo ({v.current_load_count})
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-500 bg-gray-100 border border-gray-200 rounded-full px-3 py-1.5">
                          <PackageOpen className="w-3.5 h-3.5" /> Tupu
                        </span>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => handleArrive(v.id)}
                        disabled={actionLoading === v.id + '-arrive'}
                        className="text-sm font-semibold text-white bg-brand-blue hover:bg-brand-blue/90 px-4 py-2 rounded-lg flex items-center justify-center gap-1.5 disabled:opacity-50"
                      >
                        {actionLoading === v.id + '-arrive'
                          ? <Loader2 className="w-4 h-4 animate-spin" />
                          : <CheckCircle className="w-4 h-4" />}
                        Limefika
                      </button>
                      <span className="hidden sm:inline-flex items-center gap-1 text-xs text-gray-400">
                        <Clock className="w-3.5 h-3.5" /> bado
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Vehicles Grid */}
        {loading ? (
          <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-brand-blue" /></div>
        ) : vehicles.length === 0 ? (
          <div className="card text-center py-20">
            <Truck className="w-14 h-14 text-gray-200 mx-auto mb-4" />
            <p className="text-gray-400 font-medium">Hakuna magali yaliyosajiliwa</p>
            <button onClick={() => setShowAdd(true)} className="btn-primary mt-4 px-6 py-2.5 text-sm">
              Sajili Gali la Kwanza
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {vehicles.map(v => {
              const pct = v.capacity_kg > 0 ? Math.round((v.current_load_kg / v.capacity_kg) * 100) : 0;
              return (
                <div key={v.id} className="card hover:shadow-lg transition-shadow">
                  {/* Top */}
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <span className="text-xl font-black text-brand-blue font-mono">{v.vehicle_code}</span>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium border ${STATUS_COLORS[v.status]}`}>
                          {STATUS_LABELS[v.status]}
                        </span>
                        <span className="text-xs text-gray-400">{v.vehicle_type}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-gray-900">{v.plate_number}</p>
                      <p className="text-xs text-gray-400">{v.capacity_kg} kg max</p>
                    </div>
                  </div>

                  {/* Load bar */}
                  <div className="mb-4">
                    <div className="flex justify-between text-xs text-gray-500 mb-1">
                      <span>{v.current_load_count} mzigo · {v.current_load_kg} kg</span>
                      <span className="font-semibold">{pct}%</span>
                    </div>
                    <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full transition-all ${pct > 90 ? 'bg-red-500' : pct > 70 ? 'bg-yellow-500' : 'bg-brand-green'}`}
                        style={{ width: `${Math.min(pct, 100)}%` }} />
                    </div>
                  </div>

                  {v.driver_name && (
                    <div className="bg-blue-50 rounded-lg px-3 py-2 text-xs text-gray-600 mb-3">
                      <span className="font-semibold">Dereva:</span> {v.driver_name} {v.driver_phone && `· ${v.driver_phone}`}
                      {v.route_from && <span className="block mt-0.5">{v.route_from} → {v.route_to}</span>}
                    </div>
                  )}

                  {v.notes && <p className="text-xs text-gray-400 mb-3 italic">{v.notes}</p>}

                  {/* Actions */}
                  <div className="flex flex-wrap gap-2 pt-3 border-t border-gray-100">
                    {v.status === 'in_transit' && (
                      <button onClick={() => handleArrive(v.id)} disabled={actionLoading === v.id + '-arrive'}
                        className="flex-1 text-xs font-medium text-purple-700 border border-purple-200 px-3 py-2 rounded-lg hover:bg-purple-50 flex items-center justify-center gap-1.5">
                        {actionLoading === v.id + '-arrive' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle className="w-3.5 h-3.5" />}
                        Limefika
                      </button>
                    )}
                    {(v.status === 'arrived' || v.status === 'loading') && (
                      <button onClick={() => handleClear(v.id)} disabled={actionLoading === v.id + '-clear'}
                        className="flex-1 text-xs font-medium text-green-700 border border-green-200 px-3 py-2 rounded-lg hover:bg-green-50 flex items-center justify-center gap-1.5">
                        {actionLoading === v.id + '-clear' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RotateCcw className="w-3.5 h-3.5" />}
                        Safisha Gali
                      </button>
                    )}
                    {v.status === 'available' && (
                      <button onClick={() => handleStatusChange(v.id, 'maintenance')}
                        className="text-xs font-medium text-gray-500 border border-gray-200 px-3 py-2 rounded-lg hover:bg-gray-50 flex items-center gap-1.5">
                        <Wrench className="w-3.5 h-3.5" /> Matengenezo
                      </button>
                    )}
                    {v.status === 'maintenance' && (
                      <button onClick={() => handleStatusChange(v.id, 'available')}
                        className="text-xs font-medium text-green-700 border border-green-200 px-3 py-2 rounded-lg hover:bg-green-50 flex items-center gap-1.5">
                        <CheckCircle className="w-3.5 h-3.5" /> Tayari
                      </button>
                    )}
                    {deleteConfirm === v.id ? (
                      <div className="flex gap-1">
                        <button onClick={() => handleDelete(v.id)} className="text-xs text-red-600 border border-red-300 px-2.5 py-2 rounded-lg hover:bg-red-50">Ndio, Futa</button>
                        <button onClick={() => setDeleteConfirm(null)} className="text-xs text-gray-500 border border-gray-200 px-2.5 py-2 rounded-lg">Hapana</button>
                      </div>
                    ) : (
                      v.status === 'available' && (
                        <button onClick={() => setDeleteConfirm(v.id)} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Add Vehicle Modal */}
      {showAdd && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h2 className="font-bold text-gray-900 text-lg">Sajili Gali Jipya</h2>
              <button onClick={() => { setShowAdd(false); setFormError(''); }} className="p-2 hover:bg-gray-100 rounded-xl">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <form onSubmit={handleAdd} className="p-6 space-y-4">
              <div>
                <label className="label">Nambari ya Gali (Plate) *</label>
                <input required value={form.plate_number} onChange={e => setForm(p => ({ ...p, plate_number: e.target.value.toUpperCase() }))}
                  placeholder="T 123 ABC" className="input-field font-mono uppercase" />
              </div>
              <div>
                <label className="label">Aina ya Gali</label>
                <select value={form.vehicle_type} onChange={e => setForm(p => ({ ...p, vehicle_type: e.target.value }))} className="input-field">
                  {VEHICLE_TYPES.map(t => <option key={t} value={t} className="capitalize">{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
                </select>
              </div>
              <div>
                <label className="label flex items-center gap-1.5"><Weight className="w-3.5 h-3.5 text-gray-400" /> Uwezo wa Kubeba (kg)</label>
                <input type="number" min="100" step="100" value={form.capacity_kg}
                  onChange={e => setForm(p => ({ ...p, capacity_kg: e.target.value }))} className="input-field" />
              </div>
              <div>
                <label className="label">Maelezo (optional)</label>
                <input value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))}
                  placeholder="mfano: Gali la baridi, Gali kubwa..." className="input-field" />
              </div>
              {formError && <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl">{formError}</div>}
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowAdd(false)} className="btn-outline flex-1 py-3">Acha</button>
                <button type="submit" disabled={formLoading} className="btn-primary flex-1 py-3 flex items-center justify-center gap-2">
                  {formLoading ? <><Loader2 className="w-4 h-4 animate-spin" /> Inasajili...</> : 'Sajili Gali'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
