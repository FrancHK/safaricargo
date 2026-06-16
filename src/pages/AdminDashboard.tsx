import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus, Search, RefreshCw, Loader2, Package, Truck,
  CheckCircle, Clock, X, ChevronDown, Trash2, Filter, Users,
  Weight, DollarSign, MapPin, FileText, StickyNote, Box, Printer,
  TrendingUp, LayoutDashboard, Menu, LogOut, ChevronsLeft, ChevronsRight
} from 'lucide-react';
import { getAllShipments, createShipment, updateShipmentStatus, deleteShipment } from '../api/shipments';
import StatusBadge from '../components/StatusBadge';
import SearchableSelect from '../components/SearchableSelect';
import CustomerSearchInput from '../components/CustomerSearchInput';
import type { Shipment, ShipmentStatus, CreateShipmentForm } from '../types';
import { STATUSES } from '../types';
import { useAuth } from '../contexts/AuthContext';

const INITIAL_FORM: CreateShipmentForm = {
  customerName: '', phone: '', email: '',
  from: '', to: '', weight: '', description: ''
};

const INITIAL_ORDER = {
  customer: null as { id?: string; name: string; phone: string; email?: string; manual?: boolean } | null,
  cargoType: '' as string,
  cargoTypeCustom: '',
  cargoContents: '',
  weight: '',
  price: '',
  from: '',
  to: '',
  routeNote: '',
};

const TANZANIA_REGIONS = [
  'Arusha','Dar es Salaam','Dodoma','Geita','Iringa','Kagera',
  'Katavi','Kigoma','Kilimanjaro','Lindi','Manyara','Mara',
  'Mbeya','Morogoro','Mtwara','Mwanza','Njombe','Pemba Kaskazini',
  'Pemba Kusini','Pwani','Rukwa','Ruvuma','Shinyanga','Simiyu',
  'Singida','Songwe','Tabora','Tanga','Unguja Kaskazini',
  'Unguja Kusini','Mjini Magharibi'
];

const CARGO_TYPES = [
  { id: 'box',        label: 'Box / Sanduku',   icon: '📦' },
  { id: 'kifungashio',label: 'Kifungashio',      icon: '🎁' },
  { id: 'robe',       label: 'Robe / Mfuko',    icon: '👜' },
  { id: 'other',      label: 'Nyingine',         icon: '📋' },
];

const FILTER_TABS = ['All', ...STATUSES];

interface DashboardProps {
  role?: 'admin' | 'mapokezi';
}

interface MapokeziUser {
  id: string;
  name: string;
  email: string;
  department: string;
  station?: string;
  employee_id?: string;
}

export default function AdminDashboard({ role = 'admin' }: DashboardProps) {
  const auth = useAuth();
  const navigate = useNavigate();
  const isAdmin = role === 'admin';

  const mapokeziUser: MapokeziUser | null = isAdmin
    ? null
    : (() => {
        try {
          const raw = localStorage.getItem('sc_mapokezi');
          return raw && raw !== 'undefined' ? JSON.parse(raw) : null;
        } catch { return null; }
      })();

  // Redirect if unauthenticated for the role
  useEffect(() => {
    if (isAdmin && !auth.isAuthenticated) navigate('/admin/login');
    if (!isAdmin && !localStorage.getItem('sc_mapokezi_token')) navigate('/admin/login');
  }, [isAdmin, auth.isAuthenticated, navigate]);

  function handleLogout() {
    if (isAdmin) {
      auth.logout();
    } else {
      localStorage.removeItem('sc_mapokezi_token');
      localStorage.removeItem('sc_mapokezi');
    }
    navigate('/admin/login');
  }

  const displayName = isAdmin ? auth.admin?.username : mapokeziUser?.name;
  const displayRole = isAdmin ? 'Administrator' : 'Mapokezi';
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('All');
  const [search, setSearch] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState<Shipment | null>(null);
  const [form, setForm] = useState<CreateShipmentForm>(INITIAL_FORM);
  const [order, setOrder] = useState(INITIAL_ORDER);
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<ShipmentStatus>('Received');
  const [statusNote, setStatusNote] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem('admin_sidebar_collapsed') === '1';
  });

  function toggleCollapsed() {
    setSidebarCollapsed(prev => {
      const next = !prev;
      try { localStorage.setItem('admin_sidebar_collapsed', next ? '1' : '0'); } catch {}
      return next;
    });
  }

  const dashPath = isAdmin ? '/admin/dashboard' : '/mapokezi';
  const allNavItems = [
    { label: 'Dashboard', icon: LayoutDashboard, path: dashPath, active: true, roles: ['admin', 'mapokezi'] },
    { label: 'Wateja', icon: Users, path: '/admin/customers', active: false, roles: ['admin', 'mapokezi'] },
    { label: 'Wafanyakazi', icon: Users, path: '/admin/staff', active: false, roles: ['admin'] },
    { label: 'Magali', icon: Truck, path: '/admin/vehicles', active: false, roles: ['admin', 'mapokezi'] },
  ];
  const navItems = allNavItems.filter(item => item.roles.includes(role));

  const fetchShipments = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getAllShipments({ status: filter === 'All' ? undefined : filter, search });
      setShipments(data.shipments);
      setTotal(data.total);
    } catch {
      // handled silently
    } finally {
      setLoading(false);
    }
  }, [filter, search]);

  useEffect(() => {
    const timer = setTimeout(fetchShipments, 300);
    return () => clearTimeout(timer);
  }, [fetchShipments]);

  async function handleCreateShipment(e: React.FormEvent) {
    e.preventDefault();
    if (!order.customer) { setFormError('Tafadhali chagua au ingiza mteja.'); return; }
    if (!order.cargoType) { setFormError('Chagua aina ya mzigo.'); return; }
    if (!order.from || !order.to) { setFormError('Weka mkoa wa kuanzia na kukuelekea.'); return; }
    if (order.from === order.to) { setFormError('Mkoa wa kuanzia na kukuelekea lazima uwe tofauti.'); return; }

    setFormLoading(true);
    setFormError('');
    try {
      const payload = {
        customerName: order.customer.name,
        phone: order.customer.phone,
        email: order.customer.email || '',
        from: order.from,
        to: order.to,
        weight: order.weight || '0',
        description: order.cargoContents,
        cargo_type: order.cargoType,
        cargo_type_custom: order.cargoTypeCustom,
        cargo_contents: order.cargoContents,
        price: order.price ? parseFloat(order.price) : 0,
        route_note: order.routeNote,
        customer_id: order.customer.id || null,
      } as unknown as CreateShipmentForm;

      const newShipment = await createShipment(payload);
      setShipments(prev => [newShipment, ...prev]);
      setTotal(prev => prev + 1);
      setShowAddModal(false);
      setOrder(INITIAL_ORDER);
      setFormError('');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error ?? 'Imeshindwa kusajili oda.';
      setFormError(msg);
    } finally {
      setFormLoading(false);
    }
  }

  async function handleStatusUpdate() {
    if (!showStatusModal) return;
    try {
      const updated = await updateShipmentStatus(showStatusModal._id, selectedStatus, statusNote);
      setShipments(prev => prev.map(s => s._id === updated._id ? updated : s));
      setShowStatusModal(null);
      setStatusNote('');
    } catch {
      alert('Failed to update status.');
    }
  }

  async function handleDelete(id: string) {
    try {
      await deleteShipment(id);
      setShipments(prev => prev.filter(s => s._id !== id));
      setTotal(prev => prev - 1);
      setDeleteConfirm(null);
    } catch {
      alert('Failed to delete shipment.');
    }
  }

  const statusCounts = STATUSES.reduce<Record<string, number>>((acc, s) => {
    acc[s] = shipments.filter(sh => sh.status === s).length;
    return acc;
  }, {});

  const statCards = [
    { label: 'Total Shipments', value: total, icon: Package, gradient: 'from-blue-500 to-blue-600', glow: 'shadow-blue-500/20', accent: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'In Transit', value: statusCounts['In Transit'] ?? 0, icon: Truck, gradient: 'from-amber-500 to-orange-500', glow: 'shadow-amber-500/20', accent: 'text-amber-600', bg: 'bg-amber-50' },
    { label: 'Delivered', value: statusCounts['Delivered'] ?? 0, icon: CheckCircle, gradient: 'from-emerald-500 to-green-600', glow: 'shadow-emerald-500/20', accent: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: 'Processing', value: (statusCounts['Received'] ?? 0) + (statusCounts['Processing'] ?? 0), icon: Clock, gradient: 'from-violet-500 to-purple-600', glow: 'shadow-violet-500/20', accent: 'text-violet-600', bg: 'bg-violet-50' }
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex">

      {/* ═══ SIDEBAR ═══ */}
      {/* Mobile backdrop */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          className="lg:hidden fixed inset-0 bg-black/50 backdrop-blur-sm z-30"
        />
      )}

      <aside
        className={`fixed lg:sticky top-0 inset-y-0 left-0 z-40 h-screen flex flex-col bg-gradient-to-b from-[#0a1747] via-brand-blue to-[#0f1f5c] text-white shadow-2xl transition-all duration-300 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        } ${sidebarCollapsed ? 'w-20' : 'w-64'}`}
      >
        {/* Grid texture */}
        <div className="absolute inset-0 opacity-[0.05] pointer-events-none"
          style={{
            backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)',
            backgroundSize: '40px 40px'
          }}
        />
        <div className="absolute -top-20 -left-20 w-60 h-60 bg-brand-green/15 rounded-full blur-3xl pointer-events-none" />

        {/* Collapse toggle (desktop only) */}
        <button
          onClick={toggleCollapsed}
          className="hidden lg:flex absolute -right-3 top-7 z-50 w-6 h-6 items-center justify-center rounded-full bg-white text-brand-blue border border-gray-200 shadow-lg hover:bg-brand-blue hover:text-white hover:border-brand-blue transition-colors"
          title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {sidebarCollapsed ? <ChevronsRight className="w-3.5 h-3.5" /> : <ChevronsLeft className="w-3.5 h-3.5" />}
        </button>

        {/* Logo */}
        <div className={`relative py-4 border-b border-white/10 flex items-center ${sidebarCollapsed ? 'justify-center px-2' : 'justify-between px-3'}`}>
          {sidebarCollapsed ? (
            <img src="/logo.png" alt="SafiriCargo" className="h-10 w-10 object-contain bg-white rounded-lg p-1" />
          ) : (
            <img src="/logo.png" alt="SafiriCargo" className="h-12 w-auto object-contain bg-white rounded-lg px-2 py-1.5" />
          )}
          {!sidebarCollapsed && (
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden p-1.5 hover:bg-white/10 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Nav items */}
        <nav className={`relative flex-1 py-5 space-y-1 overflow-y-auto ${sidebarCollapsed ? 'px-2' : 'px-3'}`}>
          {!sidebarCollapsed && (
            <p className="px-3 mb-2 text-[10px] font-semibold text-blue-200/50 uppercase tracking-widest">Menu</p>
          )}
          {navItems.map(item => {
            const Icon = item.icon;
            return (
              <button
                key={item.label}
                onClick={() => { navigate(item.path); setSidebarOpen(false); }}
                title={sidebarCollapsed ? item.label : undefined}
                className={`w-full flex items-center rounded-xl text-sm font-medium transition-all ${
                  sidebarCollapsed ? 'justify-center px-2 py-3' : 'gap-3 px-3 py-2.5'
                } ${
                  item.active
                    ? 'bg-white/15 text-white shadow-lg backdrop-blur-md border border-white/15'
                    : 'text-blue-100/80 hover:bg-white/10 hover:text-white'
                }`}
              >
                <Icon className="w-[18px] h-[18px] flex-shrink-0" strokeWidth={2} />
                {!sidebarCollapsed && (
                  <>
                    <span className="flex-1 text-left">{item.label}</span>
                    {item.active && <span className="w-1.5 h-1.5 rounded-full bg-brand-green animate-pulse" />}
                  </>
                )}
              </button>
            );
          })}

          {/* Primary action — mapokezi only */}
          {!isAdmin && (
            <div className="pt-4 mt-4 border-t border-white/10">
              {!sidebarCollapsed && (
                <p className="px-3 mb-2 text-[10px] font-semibold text-blue-200/50 uppercase tracking-widest">Actions</p>
              )}
              <button
                onClick={() => { setShowAddModal(true); setSidebarOpen(false); }}
                title={sidebarCollapsed ? 'New Shipment' : undefined}
                className={`w-full flex items-center rounded-xl text-sm font-semibold bg-brand-green hover:bg-brand-green-dark text-white shadow-lg shadow-brand-green/30 hover:-translate-y-0.5 transition-all ${
                  sidebarCollapsed ? 'justify-center p-3' : 'gap-3 px-3 py-3'
                }`}
              >
                <div className={`bg-white/20 rounded-lg flex items-center justify-center flex-shrink-0 ${sidebarCollapsed ? 'w-6 h-6' : 'w-7 h-7'}`}>
                  <Plus className="w-4 h-4" />
                </div>
                {!sidebarCollapsed && <span className="flex-1 text-left">New Shipment</span>}
              </button>
            </div>
          )}
        </nav>

        {/* User panel */}
        <div className={`relative border-t border-white/10 ${sidebarCollapsed ? 'p-2' : 'p-3'}`}>
          <div className={`flex items-center rounded-xl bg-white/5 ${sidebarCollapsed ? 'flex-col gap-2 p-2' : 'gap-3 p-2.5'}`}>
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-brand-blue-light to-brand-blue flex items-center justify-center text-sm font-bold uppercase shadow-md flex-shrink-0">
              {displayName?.[0] ?? 'U'}
            </div>
            {!sidebarCollapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-white truncate">{displayName || '—'}</p>
                <p className="text-[10px] text-blue-200/60 truncate">{displayRole}</p>
              </div>
            )}
            <button
              onClick={handleLogout}
              className="p-2 hover:bg-white/10 rounded-lg text-blue-100/70 hover:text-white transition-colors flex-shrink-0"
              title="Logout"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* ═══ MAIN CONTENT ═══ */}
      <div className="flex-1 min-w-0 flex flex-col">

        {/* Top bar (mobile hamburger + page title) */}
        <div className="lg:hidden sticky top-0 z-20 bg-white border-b border-gray-200 px-4 py-3 flex items-center gap-3">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <Menu className="w-5 h-5 text-gray-700" />
          </button>
          <h1 className="font-bold text-gray-900">Dashboard</h1>
        </div>

        {/* Stat cards section */}
        <div className="relative bg-gradient-to-br from-[#0a1747] via-brand-blue to-[#1a2d7a] text-white overflow-hidden">
          <div className="absolute inset-0 opacity-[0.06] pointer-events-none"
            style={{
              backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)',
              backgroundSize: '50px 50px'
            }}
          />
          <div className="absolute -top-20 right-0 w-72 h-72 bg-brand-green/15 rounded-full blur-3xl pointer-events-none" />

          <div className="relative px-4 sm:px-6 lg:px-10 py-8">
            {/* Stat cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {statCards.map(card => {
                const Icon = card.icon;
                return (
                  <div
                    key={card.label}
                    className={`group relative bg-white p-5 shadow-xl ${card.glow} hover:-translate-y-1 transition-all duration-300 overflow-hidden`}
                  >
                    <div className={`absolute -top-8 -right-8 w-24 h-24 bg-gradient-to-br ${card.gradient} opacity-10 rounded-full blur-2xl group-hover:opacity-20 transition-opacity`} />

                    <div className="relative flex items-start justify-between mb-3">
                      <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${card.gradient} flex items-center justify-center shadow-md`}>
                        <Icon className="w-5 h-5 text-white" strokeWidth={2.25} />
                      </div>
                      <span className={`inline-flex items-center gap-1 ${card.bg} ${card.accent} text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full`}>
                        <TrendingUp className="w-3 h-3" /> Live
                      </span>
                    </div>

                    <p className="text-3xl font-bold text-gray-900 leading-none mb-1.5">{card.value}</p>
                    <p className="text-gray-500 text-xs font-medium">{card.label}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

      {/* Main Content */}
      <div className="px-4 sm:px-6 lg:px-10 py-8">
        {/* Section title */}
        <div className="flex items-end justify-between mb-5">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Shipments</h2>
            <p className="text-xs text-gray-500 mt-0.5">Manage and track all cargo shipments</p>
          </div>
        </div>

        {/* Filters & Search */}
        <div className="bg-white shadow-sm border border-gray-100 p-4 mb-5">
          <div className="flex flex-col lg:flex-row gap-3 items-start lg:items-center justify-between">
            <div className="flex items-center gap-2 flex-wrap">
              <div className="flex items-center gap-1.5 text-gray-400 pr-2 border-r border-gray-200">
                <Filter className="w-4 h-4" />
                <span className="text-xs font-semibold uppercase tracking-wider">Filter</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {FILTER_TABS.map(tab => (
                  <button
                    key={tab}
                    onClick={() => setFilter(tab)}
                    className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                      filter === tab
                        ? 'bg-brand-blue text-white shadow-md shadow-brand-blue/25'
                        : 'bg-gray-50 text-gray-600 hover:bg-gray-100 border border-gray-200'
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex gap-2 w-full lg:w-auto">
              <div className="flex-1 lg:w-72 flex items-center gap-2 border border-gray-200 bg-gray-50 rounded-xl px-3.5 py-2.5 focus-within:ring-2 focus-within:ring-brand-blue focus-within:border-brand-blue focus-within:bg-white transition-all">
                <Search className="w-4 h-4 text-gray-400" />
                <input
                  placeholder="Search by name, ID, phone..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="flex-1 text-sm outline-none bg-transparent placeholder-gray-400"
                />
              </div>
              <button
                onClick={fetchShipments}
                className="border border-gray-200 bg-gray-50 hover:bg-white hover:border-brand-blue hover:text-brand-blue p-2.5 rounded-xl transition-all"
                title="Refresh"
              >
                <RefreshCw className={`w-4 h-4 text-gray-500 ${loading ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white shadow-md border border-gray-100 overflow-hidden p-0">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-8 h-8 text-brand-blue animate-spin" />
            </div>
          ) : shipments.length === 0 ? (
            <div className="text-center py-16">
              <Package className="w-12 h-12 text-gray-200 mx-auto mb-3" />
              <p className="text-gray-400 font-medium">No shipments found</p>
              <p className="text-gray-400 text-sm">Create a new shipment to get started.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    <th className="text-left px-4 py-3.5 font-semibold text-gray-600 text-xs uppercase tracking-wide">Tracking ID</th>
                    <th className="text-left px-4 py-3.5 font-semibold text-gray-600 text-xs uppercase tracking-wide">Customer</th>
                    <th className="text-left px-4 py-3.5 font-semibold text-gray-600 text-xs uppercase tracking-wide hidden md:table-cell">Route</th>
                    <th className="text-left px-4 py-3.5 font-semibold text-gray-600 text-xs uppercase tracking-wide hidden lg:table-cell">Weight</th>
                    <th className="text-left px-4 py-3.5 font-semibold text-gray-600 text-xs uppercase tracking-wide">Status</th>
                    <th className="text-left px-4 py-3.5 font-semibold text-gray-600 text-xs uppercase tracking-wide hidden sm:table-cell">Date</th>
                    <th className="text-right px-4 py-3.5 font-semibold text-gray-600 text-xs uppercase tracking-wide">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {shipments.map(s => (
                    <tr key={s._id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3.5">
                        <a href={`/track?id=${s.trackingId}`} className="font-mono text-brand-blue font-semibold text-xs hover:underline">
                          {s.trackingId}
                        </a>
                      </td>
                      <td className="px-4 py-3.5">
                        <p className="font-medium text-gray-900">{s.customerName}</p>
                        <p className="text-xs text-gray-500">{s.phone}</p>
                      </td>
                      <td className="px-4 py-3.5 hidden md:table-cell">
                        <span className="text-gray-700">{s.from}</span>
                        <span className="text-gray-400 mx-1">→</span>
                        <span className="text-gray-700">{s.to}</span>
                      </td>
                      <td className="px-4 py-3.5 hidden lg:table-cell text-gray-600">{s.weight} kg</td>
                      <td className="px-4 py-3.5">
                        <StatusBadge status={s.status} />
                      </td>
                      <td className="px-4 py-3.5 hidden sm:table-cell text-gray-500 text-xs whitespace-nowrap">
                        {new Date(s.createdAt).toLocaleDateString('en-KE', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </td>
                      <td className="px-4 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => { setShowStatusModal(s); setSelectedStatus(s.status); }}
                            className="flex items-center gap-1 text-xs font-medium text-brand-blue border border-brand-blue px-2.5 py-1.5 rounded-lg hover:bg-brand-blue hover:text-white transition-colors"
                          >
                            <ChevronDown className="w-3 h-3" /> Update
                          </button>
                          <button
                            onClick={() => navigate(`/admin/print?id=${s.trackingId}`)}
                            className="flex items-center gap-1 text-xs font-medium text-gray-600 border border-gray-300 px-2.5 py-1.5 rounded-lg hover:bg-gray-100 transition-colors"
                            title="Chapisha Lebo"
                          >
                            <Printer className="w-3 h-3" />
                          </button>
                          {deleteConfirm === s._id ? (
                            <div className="flex gap-1">
                              <button onClick={() => handleDelete(s._id)} className="text-xs text-red-600 font-medium px-2 py-1.5 rounded-lg border border-red-300 hover:bg-red-50">Yes</button>
                              <button onClick={() => setDeleteConfirm(null)} className="text-xs text-gray-500 px-2 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-50">No</button>
                            </div>
                          ) : (
                            <button
                              onClick={() => setDeleteConfirm(s._id)}
                              className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                            >
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
          {!loading && shipments.length > 0 && (
            <div className="px-4 py-3 bg-gray-50 border-t border-gray-100 text-xs text-gray-500">
              Showing {shipments.length} of {total} shipments
            </div>
          )}
        </div>
      </div>
      </div>
      {/* ═══ END MAIN CONTENT ═══ */}

      {/* ═══ NEW ORDER MODAL ═══ */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-3 sm:p-6">
          <div className="bg-white w-full max-w-2xl shadow-2xl flex flex-col max-h-[95vh]">

            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 flex-shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-brand-blue rounded-xl flex items-center justify-center">
                  <Package className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-gray-900">Sajili Oda Mpya</h2>
                  <p className="text-xs text-gray-400">Jaza sehemu zote zilizo na alama *</p>
                </div>
              </div>
              <button onClick={() => { setShowAddModal(false); setOrder(INITIAL_ORDER); setFormError(''); }}
                className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {/* Scrollable Body */}
            <form onSubmit={handleCreateShipment} className="overflow-y-auto flex-1">
              <div className="p-6 space-y-6">

                {/* ── SECTION 1: MTEJA ── */}
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-6 h-6 bg-brand-blue rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0">1</div>
                    <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wide">Mteja</h3>
                  </div>
                  <CustomerSearchInput
                    value={order.customer}
                    onChange={c => setOrder(p => ({ ...p, customer: c }))}
                  />
                </div>

                {/* ── SECTION 2: AINA YA MZIGO ── */}
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-6 h-6 bg-brand-blue rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0">2</div>
                    <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wide">Aina ya Mzigo *</h3>
                  </div>

                  <div className="grid grid-cols-4 gap-2 mb-3">
                    {CARGO_TYPES.map(ct => (
                      <button key={ct.id} type="button"
                        onClick={() => setOrder(p => ({ ...p, cargoType: ct.id, cargoTypeCustom: '' }))}
                        className={`flex flex-col items-center gap-1.5 py-3 px-2 rounded-xl border-2 text-xs font-medium transition-all ${
                          order.cargoType === ct.id
                            ? 'border-brand-blue bg-blue-50 text-brand-blue shadow-sm'
                            : 'border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        <span className="text-xl">{ct.icon}</span>
                        <span className="text-center leading-tight">{ct.label}</span>
                      </button>
                    ))}
                  </div>

                  {order.cargoType === 'other' && (
                    <div className="mb-3">
                      <label className="label">Andika Jina la Aina ya Mzigo *</label>
                      <input
                        value={order.cargoTypeCustom}
                        onChange={e => setOrder(p => ({ ...p, cargoTypeCustom: e.target.value }))}
                        placeholder="mfano: Vifaa vya ujenzi, Samani..."
                        className="input-field"
                        required={order.cargoType === 'other'}
                      />
                    </div>
                  )}

                  <div>
                    <label className="label flex items-center gap-1.5">
                      <FileText className="w-3.5 h-3.5 text-gray-400" /> Kilichopo Ndani
                    </label>
                    <textarea
                      value={order.cargoContents}
                      onChange={e => setOrder(p => ({ ...p, cargoContents: e.target.value }))}
                      placeholder="Elezea kilichopo ndani ya mzigo..."
                      rows={2}
                      className="input-field resize-none"
                    />
                  </div>
                </div>

                {/* ── SECTION 3: UZITO & BEI ── */}
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-6 h-6 bg-brand-blue rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0">3</div>
                    <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wide">Uzito & Bei</h3>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="label flex items-center gap-1.5">
                        <Weight className="w-3.5 h-3.5 text-gray-400" /> Uzito (kg)
                      </label>
                      <div className="relative">
                        <input
                          type="number" min="0.1" step="0.1"
                          value={order.weight}
                          onChange={e => setOrder(p => ({ ...p, weight: e.target.value }))}
                          placeholder="0.0"
                          className="input-field pr-10"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 font-medium">kg</span>
                      </div>
                    </div>
                    <div>
                      <label className="label flex items-center gap-1.5">
                        <DollarSign className="w-3.5 h-3.5 text-gray-400" /> Bei ya Mzigo
                      </label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 font-medium">TZS</span>
                        <input
                          type="number" min="0" step="500"
                          value={order.price}
                          onChange={e => setOrder(p => ({ ...p, price: e.target.value }))}
                          placeholder="0"
                          className="input-field pl-11"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* ── SECTION 4: SAFARI / ROUTE ── */}
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-6 h-6 bg-brand-blue rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0">4</div>
                    <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wide">Safari (Route) *</h3>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-3">
                    <div>
                      <SearchableSelect
                        label="Kutoka Mkoa *"
                        options={TANZANIA_REGIONS}
                        value={order.from}
                        onChange={v => setOrder(p => ({ ...p, from: v }))}
                        placeholder="Tafuta mkoa..."
                      />
                    </div>
                    <div>
                      <SearchableSelect
                        label="Kwenda Mkoa *"
                        options={TANZANIA_REGIONS.filter(r => r !== order.from)}
                        value={order.to}
                        onChange={v => setOrder(p => ({ ...p, to: v }))}
                        placeholder="Tafuta mkoa..."
                      />
                    </div>
                  </div>

                  {/* Route preview */}
                  {order.from && order.to && (
                    <div className="flex items-center gap-2 bg-blue-50 border border-blue-100 rounded-xl px-4 py-2.5 mb-3">
                      <MapPin className="w-4 h-4 text-brand-blue flex-shrink-0" />
                      <span className="text-sm font-medium text-brand-blue">{order.from}</span>
                      <span className="text-gray-400">→</span>
                      <MapPin className="w-4 h-4 text-brand-green flex-shrink-0" />
                      <span className="text-sm font-medium text-brand-green">{order.to}</span>
                    </div>
                  )}

                  <div>
                    <label className="label flex items-center gap-1.5">
                      <StickyNote className="w-3.5 h-3.5 text-gray-400" /> Maelezo ya Ziada (optional)
                    </label>
                    <textarea
                      value={order.routeNote}
                      onChange={e => setOrder(p => ({ ...p, routeNote: e.target.value }))}
                      placeholder="mfano: Peleka kwa haraka, Usishughulikie kwa nguvu..."
                      rows={2}
                      className="input-field resize-none"
                    />
                  </div>
                </div>

                {/* Error */}
                {formError && (
                  <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl flex items-center gap-2">
                    <X className="w-4 h-4 flex-shrink-0" /> {formError}
                  </div>
                )}
              </div>
            </form>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex-shrink-0">
              <div className="flex gap-3">
                <button type="button"
                  onClick={() => { setShowAddModal(false); setOrder(INITIAL_ORDER); setFormError(''); }}
                  className="btn-outline flex-1 py-3 text-sm">
                  Acha
                </button>
                <button
                  onClick={handleCreateShipment}
                  disabled={formLoading}
                  className="btn-success flex-1 py-3 text-sm flex items-center justify-center gap-2 font-bold"
                >
                  {formLoading
                    ? <><Loader2 className="w-4 h-4 animate-spin" /> Inasajili...</>
                    : <><Package className="w-4 h-4" /> Sajili Oda Mpya</>
                  }
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Update Status Modal */}
      {showStatusModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-sm shadow-2xl">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <div>
                <h2 className="font-bold text-gray-900">Update Status</h2>
                <p className="text-xs text-brand-blue font-mono mt-0.5">{showStatusModal.trackingId}</p>
              </div>
              <button onClick={() => setShowStatusModal(null)} className="p-2 hover:bg-gray-100 rounded-full">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="label">New Status</label>
                <div className="space-y-2">
                  {STATUSES.map(s => (
                    <button
                      key={s}
                      onClick={() => setSelectedStatus(s as ShipmentStatus)}
                      className={`w-full text-left px-4 py-2.5 rounded-lg border-2 text-sm font-medium transition-colors ${
                        selectedStatus === s
                          ? 'border-brand-blue bg-blue-50 text-brand-blue'
                          : 'border-gray-200 text-gray-700 hover:border-gray-300'
                      }`}
                    >
                      {s === showStatusModal.status ? `${s} (current)` : s}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="label">Note (optional)</label>
                <textarea
                  value={statusNote}
                  onChange={e => setStatusNote(e.target.value)}
                  placeholder="Add a note about this update..."
                  rows={2}
                  className="input-field resize-none"
                />
              </div>

              <div className="flex gap-3">
                <button onClick={() => setShowStatusModal(null)} className="btn-outline flex-1 py-2.5 text-sm">Cancel</button>
                <button
                  onClick={handleStatusUpdate}
                  disabled={selectedStatus === showStatusModal.status}
                  className="btn-success flex-1 py-2.5 text-sm"
                >
                  Update Status
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
