import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users, Search, RefreshCw, Loader2, Smartphone, ArrowLeft,
  CheckCircle, XCircle, MapPin, Package, Clock, Filter
} from 'lucide-react';
import { getAllCustomers, toggleCustomerStatus } from '../api/shipments';
import type { Customer } from '../types';
import { useAuth } from '../contexts/AuthContext';

export default function AdminCustomers() {
  const { admin } = useAuth();
  const navigate = useNavigate();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterActive, setFilterActive] = useState<'all' | 'active' | 'inactive'>('all');

  const fetchCustomers = useCallback(async () => {
    setLoading(true);
    try {
      const params: { search?: string; is_active?: boolean } = {};
      if (search) params.search = search;
      if (filterActive === 'active') params.is_active = true;
      if (filterActive === 'inactive') params.is_active = false;

      const result = await getAllCustomers(params);
      setCustomers(result.customers);
      setTotal(result.total);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, [search, filterActive]);

  useEffect(() => {
    const t = setTimeout(fetchCustomers, 300);
    return () => clearTimeout(t);
  }, [fetchCustomers]);

  async function handleToggle(id: string, current: boolean) {
    try {
      const updated = await toggleCustomerStatus(id, !current);
      setCustomers(prev => prev.map(c => c.id === id ? { ...c, is_active: updated.is_active } : c));
    } catch {
      alert('Failed to update customer status.');
    }
  }

  const activeCount = customers.filter(c => c.is_active).length;
  const androidCount = customers.filter(c => c.device_type === 'Android').length;
  const iosCount = customers.filter(c => c.device_type === 'iOS').length;

  function timeAgo(date: string) {
    const diff = Date.now() - new Date(date).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  }

  return (
    <div className="min-h-screen bg-brand-gray">
      {/* Header */}
      <div className="bg-brand-blue text-white px-4 sm:px-6 lg:px-8 py-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-4 mb-6">
            <button onClick={() => navigate('/admin/dashboard')}
              className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-2xl font-bold">App Customers</h1>
              <p className="text-blue-300 text-sm mt-0.5">Wateja waliojisajili kwenye app ya simu</p>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: 'Total Customers', value: total, icon: <Users className="w-5 h-5" />, color: 'bg-blue-500' },
              { label: 'Active', value: activeCount, icon: <CheckCircle className="w-5 h-5" />, color: 'bg-green-500' },
              { label: 'Android', value: androidCount, icon: <Smartphone className="w-5 h-5" />, color: 'bg-emerald-600' },
              { label: 'iOS', value: iosCount, icon: <Smartphone className="w-5 h-5" />, color: 'bg-gray-500' },
            ].map(card => (
              <div key={card.label} className="bg-white/10 rounded-xl p-4 border border-white/10">
                <div className="flex items-center gap-3">
                  <div className={`${card.color} p-2 rounded-lg`}>{card.icon}</div>
                  <div>
                    <p className="text-2xl font-bold">{card.value}</p>
                    <p className="text-blue-300 text-xs">{card.label}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Filters */}
        <div className="card mb-6">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-gray-400" />
              {(['all', 'active', 'inactive'] as const).map(f => (
                <button key={f} onClick={() => setFilterActive(f)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-full capitalize transition-colors ${
                    filterActive === f ? 'bg-brand-blue text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}>
                  {f}
                </button>
              ))}
            </div>

            <div className="flex gap-2 w-full sm:w-auto">
              <div className="flex-1 sm:w-64 flex items-center gap-2 border border-gray-300 rounded-lg px-3 py-2 focus-within:ring-2 focus-within:ring-brand-blue">
                <Search className="w-4 h-4 text-gray-400" />
                <input
                  placeholder="Search name, email, city..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="flex-1 text-sm outline-none bg-transparent"
                />
              </div>
              <button onClick={fetchCustomers}
                className="border border-gray-300 p-2 rounded-lg hover:bg-gray-50 transition-colors">
                <RefreshCw className={`w-4 h-4 text-gray-500 ${loading ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="card overflow-hidden p-0">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-8 h-8 text-brand-blue animate-spin" />
            </div>
          ) : customers.length === 0 ? (
            <div className="text-center py-16">
              <Users className="w-12 h-12 text-gray-200 mx-auto mb-3" />
              <p className="text-gray-400 font-medium">Hakuna wateja</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    <th className="text-left px-4 py-3.5 font-semibold text-gray-600 text-xs uppercase tracking-wide">Mteja</th>
                    <th className="text-left px-4 py-3.5 font-semibold text-gray-600 text-xs uppercase tracking-wide hidden sm:table-cell">Simu / Email</th>
                    <th className="text-left px-4 py-3.5 font-semibold text-gray-600 text-xs uppercase tracking-wide hidden md:table-cell">Mji</th>
                    <th className="text-left px-4 py-3.5 font-semibold text-gray-600 text-xs uppercase tracking-wide hidden lg:table-cell">Device</th>
                    <th className="text-left px-4 py-3.5 font-semibold text-gray-600 text-xs uppercase tracking-wide hidden lg:table-cell">Mizigo</th>
                    <th className="text-left px-4 py-3.5 font-semibold text-gray-600 text-xs uppercase tracking-wide hidden md:table-cell">Login ya Mwisho</th>
                    <th className="text-left px-4 py-3.5 font-semibold text-gray-600 text-xs uppercase tracking-wide">Hali</th>
                    <th className="text-right px-4 py-3.5 font-semibold text-gray-600 text-xs uppercase tracking-wide">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {customers.map(c => (
                    <tr key={c.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-brand-blue flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                            {c.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900">{c.name}</p>
                            <p className="text-xs text-gray-400">
                              Joined {new Date(c.created_at).toLocaleDateString('en-KE', { day: '2-digit', month: 'short', year: 'numeric' })}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3.5 hidden sm:table-cell">
                        <p className="text-gray-700">{c.phone}</p>
                        <p className="text-xs text-gray-400">{c.email}</p>
                      </td>
                      <td className="px-4 py-3.5 hidden md:table-cell">
                        <div className="flex items-center gap-1.5 text-gray-600">
                          <MapPin className="w-3.5 h-3.5 text-gray-400" />
                          {c.city || '—'}
                        </div>
                      </td>
                      <td className="px-4 py-3.5 hidden lg:table-cell">
                        <div className="flex items-center gap-1.5">
                          <Smartphone className="w-3.5 h-3.5 text-gray-400" />
                          <span className="text-gray-700">{c.device_type}</span>
                          {c.app_version && (
                            <span className="text-xs bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded">v{c.app_version}</span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3.5 hidden lg:table-cell">
                        <div className="flex items-center gap-1.5">
                          <Package className="w-3.5 h-3.5 text-gray-400" />
                          <span className="font-medium text-gray-700">{c.total_shipments}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3.5 hidden md:table-cell">
                        <div className="flex items-center gap-1.5 text-gray-500 text-xs">
                          <Clock className="w-3.5 h-3.5" />
                          {timeAgo(c.last_login)}
                        </div>
                      </td>
                      <td className="px-4 py-3.5">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                          c.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${c.is_active ? 'bg-green-500' : 'bg-red-400'}`} />
                          {c.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-right">
                        <button
                          onClick={() => handleToggle(c.id, c.is_active)}
                          className={`flex items-center gap-1 text-xs font-medium px-2.5 py-1.5 rounded-lg border transition-colors ml-auto ${
                            c.is_active
                              ? 'text-red-600 border-red-200 hover:bg-red-50'
                              : 'text-green-700 border-green-200 hover:bg-green-50'
                          }`}
                        >
                          {c.is_active
                            ? <><XCircle className="w-3.5 h-3.5" /> Suspend</>
                            : <><CheckCircle className="w-3.5 h-3.5" /> Activate</>
                          }
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {!loading && customers.length > 0 && (
            <div className="px-4 py-3 bg-gray-50 border-t border-gray-100 text-xs text-gray-500">
              Wateja {customers.length} kati ya {total}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
