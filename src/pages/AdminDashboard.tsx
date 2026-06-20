import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus, Search, RefreshCw, Loader2, Package, Truck,
  CheckCircle, Clock, X, Trash2, Filter, ChevronDown,
  MapPin, FileText, StickyNote, Printer,
  CreditCard, Copy, Check, XCircle, Phone, User, Wallet,
  Send, Building2, PackageOpen,
} from 'lucide-react';
import {
  getAllShipments, createShipment, updateShipmentStatus, deleteShipment,
  confirmPayment, rejectPayment, getPaymentStats, getAllVehicles, getAllBranches,
  type PaymentStats, type Branch,
} from '../api/shipments';
import StatusBadge from '../components/StatusBadge';
import SearchableSelect from '../components/SearchableSelect';
import CustomerSearchInput from '../components/CustomerSearchInput';
import Calendar from '../components/Calendar';
import DashboardLayout from '../components/DashboardLayout';
import type { Shipment, ShipmentStatus, CreateShipmentForm, Vehicle } from '../types';
import { STATUSES } from '../types';
import { useAuth } from '../contexts/AuthContext';

const INITIAL_FORM: CreateShipmentForm = {
  customerName: '', phone: '', email: '',
  from: '', to: '', weight: '', description: ''
};

interface SubItem {
  id: string;
  quantity: string;
  unitPrice: string;
}

interface CargoItem {
  id: string;          // local-only uid
  type: string;        // 'box' | 'kifungashio' | 'robe' | 'other'
  customLabel?: string; // when type === 'other'
  subItems: SubItem[];
}

function makeSubItem(): SubItem {
  return {
    id: `sub-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    quantity: '1',
    unitPrice: '',
  };
}

const INITIAL_ORDER = {
  customer: null as { id?: string; name: string; phone: string; email?: string; manual?: boolean } | null,
  cargoItems: [] as CargoItem[],
  cargoContents: '',
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
const PENDING_PAYMENTS = 'Pending Payments';

const PAYMENT_BADGE: Record<string, { label: string; cls: string }> = {
  unpaid:  { label: 'Unpaid',         cls: 'bg-gray-100 text-gray-600 border-gray-200' },
  pending: { label: 'Pending Review', cls: 'bg-orange-100 text-orange-700 border-orange-200' },
  paid:    { label: 'Paid',           cls: 'bg-green-100 text-green-700 border-green-200' },
};

function PaymentBadge({ status }: { status?: string }) {
  const b = PAYMENT_BADGE[status || 'unpaid'] || PAYMENT_BADGE.unpaid;
  return (
    <span className={`inline-flex items-center text-xs font-medium px-2 py-0.5 rounded-full border whitespace-nowrap ${b.cls}`}>
      {b.label}
    </span>
  );
}

function formatMoney(price?: number, currency = 'TZS') {
  return `${currency} ${(price ?? 0).toLocaleString()}`;
}

interface DashboardProps {
  role?: 'admin' | 'mapokezi';
}

export default function AdminDashboard({ role = 'admin' }: DashboardProps) {
  const auth = useAuth();
  const navigate = useNavigate();
  const isAdmin = role === 'admin';

  // Redirect if unauthenticated for the role
  useEffect(() => {
    if (isAdmin && !auth.isAuthenticated) navigate('/admin/login');
    if (!isAdmin && !localStorage.getItem('sc_mapokezi_token')) navigate('/admin/login');
  }, [isAdmin, auth.isAuthenticated, navigate]);

  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [allShipments, setAllShipments] = useState<Shipment[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [showFilters, setShowFilters] = useState(false);
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

  // Payment verification
  const [pendingCount, setPendingCount] = useState(0);
  const [paymentStats, setPaymentStats] = useState<PaymentStats | null>(null);
  const [reviewShipment, setReviewShipment] = useState<Shipment | null>(null);
  const [reviewLoading, setReviewLoading] = useState(false);
  const [rejecting, setRejecting] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [copied, setCopied] = useState(false);
  const [reviewError, setReviewError] = useState('');

  const fetchShipments = useCallback(async () => {
    setLoading(true);
    try {
      const data = filter === PENDING_PAYMENTS
        ? await getAllShipments({ payment_status: 'pending', search })
        : await getAllShipments({ status: filter === 'All' ? undefined : filter, search });
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

  // All shipments for the calendar + per-day list — independent of filter/search
  const fetchAllShipments = useCallback(async () => {
    try {
      const data = await getAllShipments();
      setAllShipments(data.shipments);
      setPendingCount(data.shipments.filter(s => s.paymentStatus === 'pending').length);
    } catch {
      // handled silently
    }
  }, []);

  useEffect(() => { fetchAllShipments(); }, [fetchAllShipments]);

  const fetchPaymentStats = useCallback(async () => {
    try {
      const data = await getPaymentStats();
      setPaymentStats(data);
      setPendingCount(data.pending.count);
    } catch {
      // handled silently
    }
  }, []);

  useEffect(() => { fetchPaymentStats(); }, [fetchPaymentStats]);

  // Fleet + branches for the dashboard sidebar widgets
  const fetchSidebarData = useCallback(async () => {
    try {
      const [v, b] = await Promise.all([getAllVehicles(), getAllBranches()]);
      setVehicles(v.vehicles);
      setBranches(b.branches);
    } catch {
      // handled silently
    }
  }, []);

  useEffect(() => { fetchSidebarData(); }, [fetchSidebarData]);

  // Shipments registered on the day picked in the calendar
  const selectedDayShipments = useMemo(() => {
    return allShipments.filter(s => {
      const d = new Date(s.createdAt);
      return d.getFullYear() === selectedDate.getFullYear()
        && d.getMonth() === selectedDate.getMonth()
        && d.getDate() === selectedDate.getDate();
    });
  }, [allShipments, selectedDate]);

  const fleet = useMemo(() => ({
    total: vehicles.length,
    departed: vehicles.filter(v => v.status === 'in_transit').length,
    loading: vehicles.filter(v => v.status === 'loading').length,
    arrived: vehicles.filter(v => v.status === 'arrived').length,
    available: vehicles.filter(v => v.status === 'available').length,
  }), [vehicles]);

  function addCargoItem(typeId: string) {
    setOrder(p => {
      const newItem: CargoItem = {
        id: `${typeId}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        type: typeId,
        subItems: [makeSubItem()],
        ...(typeId === 'other' ? { customLabel: '' } : {}),
      };
      return { ...p, cargoItems: [...p.cargoItems, newItem] };
    });
  }

  function updateCargoItem(id: string, patch: Partial<CargoItem>) {
    setOrder(p => ({
      ...p,
      cargoItems: p.cargoItems.map(it => it.id === id ? { ...it, ...patch } : it),
    }));
  }

  function removeCargoItem(id: string) {
    setOrder(p => ({ ...p, cargoItems: p.cargoItems.filter(it => it.id !== id) }));
  }

  function addSubItem(itemId: string) {
    setOrder(p => ({
      ...p,
      cargoItems: p.cargoItems.map(it =>
        it.id === itemId ? { ...it, subItems: [...it.subItems, makeSubItem()] } : it
      ),
    }));
  }

  function updateSubItem(itemId: string, subId: string, patch: Partial<SubItem>) {
    setOrder(p => ({
      ...p,
      cargoItems: p.cargoItems.map(it =>
        it.id === itemId
          ? { ...it, subItems: it.subItems.map(s => s.id === subId ? { ...s, ...patch } : s) }
          : it
      ),
    }));
  }

  function removeSubItem(itemId: string, subId: string) {
    setOrder(p => ({
      ...p,
      cargoItems: p.cargoItems.map(it =>
        it.id === itemId
          ? { ...it, subItems: it.subItems.filter(s => s.id !== subId) }
          : it
      ),
    }));
  }

  function itemSubtotal(item: CargoItem): number {
    return item.subItems.reduce((sum, s) => {
      const q = parseFloat(s.quantity) || 0;
      const u = parseFloat(s.unitPrice) || 0;
      return sum + q * u;
    }, 0);
  }

  function itemCount(item: CargoItem): number {
    return item.subItems.reduce((n, s) => n + (parseFloat(s.quantity) || 0), 0);
  }

  const cargoTotal = order.cargoItems.reduce((sum, it) => sum + itemSubtotal(it), 0);
  const cargoCount = order.cargoItems.reduce((n, it) => n + itemCount(it), 0);

  async function handleCreateShipment(e: React.FormEvent) {
    e.preventDefault();
    if (!order.customer) { setFormError('Tafadhali chagua au ingiza mteja.'); return; }
    if (order.cargoItems.length === 0) { setFormError('Chagua angalau aina moja ya mzigo.'); return; }
    for (const it of order.cargoItems) {
      if (it.type === 'other' && !it.customLabel?.trim()) { setFormError('Andika jina la mzigo wa "Nyingine".'); return; }
      if (it.subItems.length === 0) { setFormError('Kila aina ya mzigo lazima iwe na angalau row moja.'); return; }
      for (const s of it.subItems) {
        const q = parseFloat(s.quantity);
        if (!q || q < 1) { setFormError('Idadi kwenye kila row lazima iwe angalau 1.'); return; }
      }
    }
    if (!order.from || !order.to) { setFormError('Weka mkoa wa kuanzia na kukuelekea.'); return; }
    if (order.from === order.to) { setFormError('Mkoa wa kuanzia na kukuelekea lazima uwe tofauti.'); return; }

    setFormLoading(true);
    setFormError('');
    try {
      const labelFor = (it: CargoItem) => {
        if (it.type === 'other') return it.customLabel || 'Nyingine';
        return CARGO_TYPES.find(c => c.id === it.type)?.label ?? it.type;
      };
      const itemsSummary = order.cargoItems
        .map(it => {
          const subs = it.subItems
            .map(s => `${s.quantity} × TZS ${parseFloat(s.unitPrice || '0').toLocaleString()}`)
            .join(', ');
          return `${labelFor(it)} (${subs})`;
        })
        .join('; ');
      const primaryType = order.cargoItems[0]?.type || '';

      const payload = {
        customerName: order.customer.name,
        phone: order.customer.phone,
        email: order.customer.email || '',
        from: order.from,
        to: order.to,
        weight: '0',
        description: order.cargoContents || itemsSummary,
        cargo_type: primaryType,
        cargo_type_custom: order.cargoItems.find(it => it.type === 'other')?.customLabel || '',
        cargo_contents: [itemsSummary, order.cargoContents].filter(Boolean).join(' — '),
        cargo_items: order.cargoItems.map(it => ({
          type: it.type,
          label: labelFor(it),
          sub_items: it.subItems.map(s => ({
            quantity: parseFloat(s.quantity) || 0,
            unit_price: parseFloat(s.unitPrice) || 0,
            subtotal: (parseFloat(s.quantity) || 0) * (parseFloat(s.unitPrice) || 0),
          })),
          quantity: itemCount(it),
          subtotal: itemSubtotal(it),
        })),
        price: cargoTotal,
        route_note: order.routeNote,
        customer_id: order.customer.id || null,
      } as unknown as CreateShipmentForm;

      const newShipment = await createShipment(payload);
      setShipments(prev => [newShipment, ...prev]);
      setAllShipments(prev => [newShipment, ...prev]);
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
      fetchAllShipments();
    } catch {
      alert('Failed to delete shipment.');
    }
  }

  function openReview(s: Shipment) {
    setReviewShipment(s);
    setRejecting(false);
    setRejectReason('');
    setReviewError('');
    setCopied(false);
  }

  function closeReview() {
    setReviewShipment(null);
    setRejecting(false);
    setRejectReason('');
    setReviewError('');
  }

  // Apply an updated shipment to the visible list. In the "Pending Payments"
  // view, drop it since it is no longer pending.
  function applyReviewed(updated: Shipment) {
    setShipments(prev =>
      filter === PENDING_PAYMENTS
        ? prev.filter(s => s._id !== updated._id)
        : prev.map(s => (s._id === updated._id ? updated : s))
    );
    fetchAllShipments();
    fetchPaymentStats();
  }

  async function handleConfirmPayment() {
    if (!reviewShipment) return;
    setReviewLoading(true);
    setReviewError('');
    try {
      const updated = await confirmPayment(reviewShipment._id);
      applyReviewed(updated);
      closeReview();
    } catch (err: unknown) {
      setReviewError((err as { response?: { data?: { error?: string } } })?.response?.data?.error ?? 'Imeshindwa kuthibitisha malipo.');
    } finally {
      setReviewLoading(false);
    }
  }

  async function handleRejectPayment() {
    if (!reviewShipment) return;
    setReviewLoading(true);
    setReviewError('');
    try {
      const updated = await rejectPayment(reviewShipment._id, rejectReason.trim());
      applyReviewed(updated);
      closeReview();
    } catch (err: unknown) {
      setReviewError((err as { response?: { data?: { error?: string } } })?.response?.data?.error ?? 'Imeshindwa kukataa malipo.');
    } finally {
      setReviewLoading(false);
    }
  }

  async function copyRef(ref: string) {
    try {
      await navigator.clipboard.writeText(ref);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // clipboard unavailable
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
    <DashboardLayout
      role={role}
      title="Dashboard"
      onNewShipment={isAdmin ? undefined : () => setShowAddModal(true)}
    >
        {/* ═══ STATS — shipments + payments in one clean section ═══ */}
        <div className="bg-gray-50 px-4 sm:px-6 lg:px-10 pt-6 pb-1 space-y-3 sm:space-y-4">
          {/* Shipments */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {statCards.map(card => {
              const Icon = card.icon;
              return (
                <div key={card.label} className="bg-white border border-gray-200 rounded-xl px-4 py-3 flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${card.bg} ${card.accent}`}>
                    <Icon className="w-5 h-5" strokeWidth={2.25} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xl font-bold text-gray-900 leading-none">{card.value}</p>
                    <p className="text-gray-500 text-xs font-medium mt-1 truncate">{card.label}</p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Payments */}
          {paymentStats && (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              {([
                { key: 'pending', label: 'Malipo Yanasubiri',   bucket: paymentStats.pending, icon: Clock,       cls: 'bg-orange-50 text-orange-600', clickable: true },
                { key: 'today',   label: 'Yamethibitishwa Leo', bucket: paymentStats.today,   icon: CheckCircle, cls: 'bg-green-50 text-green-600',   clickable: false },
                { key: 'month',   label: 'Malipo Mwezi Huu',    bucket: paymentStats.month,   icon: CreditCard,  cls: 'bg-blue-50 text-brand-blue',   clickable: false },
                { key: 'total',   label: 'Jumla ya Malipo',     bucket: paymentStats.total,   icon: Wallet,      cls: 'bg-gray-100 text-gray-700',    clickable: false },
              ] as const).map(card => {
                const Icon = card.icon;
                return (
                  <button
                    key={card.key}
                    type="button"
                    onClick={() => card.clickable && setFilter(PENDING_PAYMENTS)}
                    className={`text-left bg-white border border-gray-200 rounded-xl px-4 py-3 flex items-center gap-3 transition-colors ${
                      card.clickable ? 'hover:border-orange-300 cursor-pointer' : 'cursor-default'
                    }`}
                  >
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${card.cls}`}>
                      <Icon className="w-5 h-5" strokeWidth={2.25} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-base sm:text-lg font-bold text-gray-900 leading-none truncate">{formatMoney(card.bucket.amount)}</p>
                      <p className="text-gray-500 text-xs font-medium mt-1 truncate">{card.label} · {card.bucket.count}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

      {/* Main Content */}
      <div className="px-4 sm:px-6 lg:px-10 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_330px] gap-6 items-start">

        {/* ═══ LEFT: SHIPMENTS ═══ */}
        <div className="min-w-0 order-2 lg:order-1">
        {/* Section title + toolbar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Shipments</h2>
            <p className="text-xs text-gray-500 mt-0.5">Manage and track all cargo shipments</p>
          </div>
          <div className="flex gap-2 w-full sm:w-auto">
            <div className="flex-1 sm:w-60 flex items-center gap-2 border border-gray-200 bg-white rounded-xl px-3.5 py-2.5 focus-within:ring-2 focus-within:ring-brand-blue focus-within:border-brand-blue transition-all">
              <Search className="w-4 h-4 text-gray-400" />
              <input
                placeholder="Tafuta jina, ID, simu..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="flex-1 text-sm outline-none bg-transparent placeholder-gray-400 min-w-0"
              />
            </div>
            <button
              onClick={() => setShowFilters(v => !v)}
              className={`inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-sm font-semibold border transition-colors ${
                showFilters || filter !== 'All'
                  ? 'bg-brand-blue text-white border-brand-blue'
                  : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
              }`}
            >
              <Filter className="w-4 h-4" />
              <span className="hidden sm:inline">Filter</span>
              {filter !== 'All' && <span className="w-1.5 h-1.5 rounded-full bg-brand-green" />}
              <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
            </button>
            <button
              onClick={fetchShipments}
              className="border border-gray-200 bg-white hover:border-brand-blue hover:text-brand-blue p-2.5 rounded-xl transition-all"
              title="Refresh"
            >
              <RefreshCw className={`w-4 h-4 text-gray-500 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Filters (collapsible) */}
        {showFilters && (
          <div className="bg-white border border-gray-200 rounded-xl p-3 mb-4">
            <div className="flex flex-wrap gap-1.5">
              {FILTER_TABS.map(tab => (
                <button
                  key={tab}
                  onClick={() => setFilter(tab)}
                  className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                    filter === tab
                      ? 'bg-brand-blue text-white shadow-sm'
                      : 'bg-gray-50 text-gray-600 hover:bg-gray-100 border border-gray-200'
                  }`}
                >
                  {tab}
                </button>
              ))}
              <button
                onClick={() => setFilter(PENDING_PAYMENTS)}
                className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                  filter === PENDING_PAYMENTS
                    ? 'bg-orange-500 text-white shadow-sm'
                    : 'bg-orange-50 text-orange-700 hover:bg-orange-100 border border-orange-200'
                }`}
              >
                <Wallet className="w-3.5 h-3.5" /> Pending Payments
                {pendingCount > 0 && (
                  <span className={`min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-bold inline-flex items-center justify-center ${
                    filter === PENDING_PAYMENTS ? 'bg-white/25 text-white' : 'bg-orange-500 text-white'
                  }`}>
                    {pendingCount}
                  </span>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Table */}
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden p-0">
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
                    <th className="text-left px-4 py-3.5 font-semibold text-gray-600 text-xs uppercase tracking-wide">Status</th>
                    <th className="text-left px-4 py-3.5 font-semibold text-gray-600 text-xs uppercase tracking-wide">Payment</th>
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
                      <td className="px-4 py-3.5">
                        <StatusBadge status={s.status} />
                      </td>
                      <td className="px-4 py-3.5">
                        {s.paymentStatus === 'pending' ? (
                          <button onClick={() => openReview(s)} title="Hakiki malipo">
                            <PaymentBadge status={s.paymentStatus} />
                          </button>
                        ) : (
                          <PaymentBadge status={s.paymentStatus} />
                        )}
                      </td>
                      <td className="px-4 py-3.5 hidden sm:table-cell text-gray-500 text-xs whitespace-nowrap">
                        {new Date(s.createdAt).toLocaleDateString('en-KE', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </td>
                      <td className="px-4 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {s.paymentStatus === 'pending' && (
                            <button
                              onClick={() => openReview(s)}
                              className="flex items-center gap-1 text-xs font-semibold text-orange-700 border border-orange-300 bg-orange-50 px-2.5 py-1.5 rounded-lg hover:bg-orange-100 transition-colors whitespace-nowrap"
                              title="Hakiki Malipo"
                            >
                              <CreditCard className="w-3 h-3" /> Hakiki
                            </button>
                          )}
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
        {/* ═══ END LEFT ═══ */}

        {/* ═══ RIGHT: SIDEBAR ═══ */}
        <div className="order-1 lg:order-2 lg:sticky lg:top-4 space-y-4">
          {/* Calendar */}
          <Calendar events={allShipments.map(s => s.createdAt)} onSelectDate={setSelectedDate} />

          {/* Selected day's shipments */}
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-sm font-bold text-gray-900">Matukio ya Siku</h3>
              <span className="text-xs text-gray-400">
                {selectedDate.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}
              </span>
            </div>
            {selectedDayShipments.length === 0 ? (
              <p className="px-4 py-6 text-center text-xs text-gray-400">Hakuna mzigo siku hii.</p>
            ) : (
              <div className="divide-y divide-gray-50 max-h-40 overflow-y-auto">
                {selectedDayShipments.map(s => (
                  <a key={s._id} href={`/track?id=${s.trackingId}`} className="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 transition-colors">
                    <div className="w-8 h-8 rounded-lg bg-blue-50 text-brand-blue flex items-center justify-center shrink-0">
                      <Package className="w-4 h-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-mono text-xs font-semibold text-brand-blue truncate">{s.trackingId}</p>
                      <p className="text-xs text-gray-500 truncate">{s.customerName} · {s.from} → {s.to}</p>
                    </div>
                    <StatusBadge status={s.status} />
                  </a>
                ))}
              </div>
            )}
          </div>

          {/* Fleet summary */}
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                <Truck className="w-4 h-4 text-brand-blue" /> Magali
              </h3>
              <span className="text-xs text-gray-400">Jumla {fleet.total}</span>
            </div>
            <div className="grid grid-cols-2 gap-px bg-gray-100">
              {[
                { label: 'Yameondoka', value: fleet.departed, icon: Send, cls: 'text-amber-600' },
                { label: 'Yanapakiwa', value: fleet.loading, icon: PackageOpen, cls: 'text-purple-600' },
                { label: 'Yamefika', value: fleet.arrived, icon: CheckCircle, cls: 'text-emerald-600' },
                { label: 'Yapo Tayari', value: fleet.available, icon: Truck, cls: 'text-gray-600' },
              ].map(f => {
                const Icon = f.icon;
                return (
                  <div key={f.label} className="bg-white p-3">
                    <div className="flex items-center gap-2">
                      <Icon className={`w-4 h-4 ${f.cls}`} />
                      <span className="text-lg font-bold text-gray-900">{f.value}</span>
                    </div>
                    <p className="text-[11px] text-gray-500 mt-0.5">{f.label}</p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Branches */}
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                <Building2 className="w-4 h-4 text-brand-blue" /> Matawi
              </h3>
              <span className="text-xs text-gray-400">{branches.length}</span>
            </div>
            {branches.length === 0 ? (
              <p className="px-4 py-6 text-center text-xs text-gray-400">Hakuna matawi.</p>
            ) : (
              <div className="divide-y divide-gray-50 max-h-36 overflow-y-auto">
                {branches.map(b => (
                  <div key={b.id} className="flex items-center gap-3 px-4 py-2.5">
                    <div className={`w-2 h-2 rounded-full shrink-0 ${b.is_active ? 'bg-brand-green' : 'bg-gray-300'}`} />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-gray-800 truncate">{b.name}</p>
                      <p className="text-xs text-gray-400 truncate">{b.location || b.region || '—'}</p>
                    </div>
                    <span className="text-xs text-gray-400 shrink-0">{b.staff_total} staff</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        </div>
      </div>
      {/* ═══ END MAIN CONTENT ═══ */}

      {/* ═══ NEW ORDER MODAL ═══ */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-3 sm:p-5 lg:p-6">
          <div className="bg-white w-full max-w-7xl shadow-2xl flex flex-col max-h-[94vh]">

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

                {/* ── SECTION 2: AINA YA MIZIGO ── */}
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-6 h-6 bg-brand-blue rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0">2</div>
                    <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wide">Aina ya Mizigo *</h3>
                    <span className="text-xs text-gray-400">(bonyeza kuongeza zaidi)</span>
                  </div>

                  {/* GRID: left = type chips, right = selected items list */}
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">

                    {/* LEFT: Type picker */}
                    <div className="lg:col-span-4">
                      <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-widest mb-2">Chagua Aina</p>
                      <div className="grid grid-cols-2 gap-2">
                        {CARGO_TYPES.map(ct => {
                          const count = order.cargoItems.filter(it => it.type === ct.id).length;
                          return (
                            <button key={ct.id} type="button"
                              onClick={() => addCargoItem(ct.id)}
                              className="relative flex flex-col items-center gap-1.5 py-4 px-2 rounded-xl border-2 border-gray-200 text-xs font-medium text-gray-700 hover:border-brand-blue hover:bg-blue-50 hover:text-brand-blue transition-all group"
                            >
                              {count > 0 && (
                                <span className="absolute -top-1.5 -right-1.5 min-w-[20px] h-5 px-1 bg-brand-blue text-white text-[10px] font-bold rounded-full flex items-center justify-center shadow">
                                  {count}
                                </span>
                              )}
                              <span className="text-2xl">{ct.icon}</span>
                              <span className="text-center leading-tight">{ct.label}</span>
                              <span className="absolute bottom-1.5 right-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                <Plus className="w-3 h-3 text-brand-blue" />
                              </span>
                            </button>
                          );
                        })}
                      </div>

                      {/* Description (moved here) */}
                      <div className="mt-4">
                        <label className="label flex items-center gap-1.5">
                          <FileText className="w-3.5 h-3.5 text-gray-400" /> Maelezo ya Ziada
                        </label>
                        <textarea
                          value={order.cargoContents}
                          onChange={e => setOrder(p => ({ ...p, cargoContents: e.target.value }))}
                          placeholder="Elezea kilichopo ndani ya mizigo..."
                          rows={3}
                          className="input-field resize-none"
                        />
                      </div>
                    </div>

                    {/* RIGHT: Selected items list */}
                    <div className="lg:col-span-8">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-widest">
                          Mizigo Iliyochaguliwa {order.cargoItems.length > 0 && <span className="text-brand-blue">({order.cargoItems.length})</span>}
                        </p>
                        {order.cargoItems.length > 0 && (
                          <button
                            type="button"
                            onClick={() => setOrder(p => ({ ...p, cargoItems: [] }))}
                            className="text-[10px] font-semibold text-red-500 hover:text-red-700 uppercase tracking-wider"
                          >
                            Futa Zote
                          </button>
                        )}
                      </div>

                      {order.cargoItems.length === 0 ? (
                        <div className="border-2 border-dashed border-gray-200 rounded-xl py-12 px-4 text-center text-gray-400">
                          <Package className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                          <p className="text-sm font-medium">Hakuna mzigo bado</p>
                          <p className="text-xs mt-1">Bonyeza aina yoyote upande wa kushoto kuongeza</p>
                        </div>
                      ) : (
                        <div className="space-y-2 max-h-[460px] overflow-y-auto pr-1">
                          {order.cargoItems.map((item, idx) => {
                            const ct = CARGO_TYPES.find(c => c.id === item.type);
                            const itemTotal = itemSubtotal(item);
                            return (
                              <div key={item.id} className="border border-gray-200 rounded-xl p-3 bg-gray-50 hover:bg-white hover:shadow-sm transition-all">
                                {/* Item header */}
                                <div className="flex items-center justify-between gap-2 mb-2 pb-2 border-b border-gray-200">
                                  <div className="flex items-center gap-2 min-w-0">
                                    <span className="text-lg flex-shrink-0">{ct?.icon ?? '📋'}</span>
                                    {item.type === 'other' ? (
                                      <input
                                        value={item.customLabel || ''}
                                        onChange={e => updateCargoItem(item.id, { customLabel: e.target.value })}
                                        placeholder="Andika aina ya mzigo..."
                                        className="text-sm font-semibold text-gray-800 bg-white border border-gray-200 rounded-lg px-2 py-1 flex-1 min-w-0"
                                        required
                                      />
                                    ) : (
                                      <span className="text-sm font-semibold text-gray-800 truncate">{ct?.label ?? item.type}</span>
                                    )}
                                    <span className="text-xs text-gray-400 flex-shrink-0">#{idx + 1}</span>
                                  </div>
                                  <div className="flex items-center gap-2 flex-shrink-0">
                                    <span className="text-xs font-bold text-brand-blue">TZS {itemTotal.toLocaleString()}</span>
                                    <button
                                      type="button"
                                      onClick={() => removeCargoItem(item.id)}
                                      className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                      title="Ondoa mzigo"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                </div>

                                {/* Sub-items header (shown once) */}
                                <div className="grid grid-cols-[1fr_1fr_1fr_28px] gap-2 mb-1">
                                  <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Idadi</span>
                                  <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Bei / Moja</span>
                                  <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Jumla</span>
                                  <span></span>
                                </div>

                                {/* Sub-items rows */}
                                <div className="space-y-1.5">
                                  {item.subItems.map(sub => {
                                    const subTotal = (parseFloat(sub.quantity) || 0) * (parseFloat(sub.unitPrice) || 0);
                                    const canRemove = item.subItems.length > 1;
                                    return (
                                      <div key={sub.id} className="grid grid-cols-[1fr_1fr_1fr_28px] gap-2 items-center">
                                        <input
                                          type="number" min="1" step="1"
                                          value={sub.quantity}
                                          onChange={e => updateSubItem(item.id, sub.id, { quantity: e.target.value })}
                                          placeholder="1"
                                          className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand-blue focus:border-brand-blue outline-none bg-white"
                                        />
                                        <div className="relative">
                                          <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[10px] text-gray-400 font-medium">TZS</span>
                                          <input
                                            type="number" min="0" step="500"
                                            value={sub.unitPrice}
                                            onChange={e => updateSubItem(item.id, sub.id, { unitPrice: e.target.value })}
                                            placeholder="0"
                                            className="w-full pl-10 pr-2 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand-blue focus:border-brand-blue outline-none bg-white"
                                          />
                                        </div>
                                        <div className="px-3 py-2 text-sm font-bold text-brand-blue bg-blue-50 border border-blue-100 rounded-lg">
                                          TZS {subTotal.toLocaleString()}
                                        </div>
                                        <button
                                          type="button"
                                          onClick={() => canRemove && removeSubItem(item.id, sub.id)}
                                          disabled={!canRemove}
                                          className={`p-1.5 rounded-lg transition-colors ${
                                            canRemove
                                              ? 'text-gray-400 hover:text-red-500 hover:bg-red-50'
                                              : 'text-gray-200 cursor-not-allowed'
                                          }`}
                                          title={canRemove ? 'Ondoa row' : 'Lazima iwe na angalau row moja'}
                                        >
                                          <X className="w-3.5 h-3.5" />
                                        </button>
                                      </div>
                                    );
                                  })}
                                </div>

                                {/* Add sub-item */}
                                <button
                                  type="button"
                                  onClick={() => addSubItem(item.id)}
                                  className="mt-2 w-full flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-brand-blue bg-white border-2 border-dashed border-brand-blue/30 rounded-lg hover:bg-brand-blue/5 hover:border-brand-blue transition-all"
                                >
                                  <Plus className="w-3.5 h-3.5" /> Ongeza Row
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {/* Total — always shown when items exist */}
                      {order.cargoItems.length > 0 && (
                        <div className="flex items-center justify-between bg-gradient-to-r from-brand-blue to-brand-blue-dark text-white rounded-xl px-4 py-3 shadow-md mt-3">
                          <div>
                            <p className="text-[10px] uppercase tracking-widest text-blue-100">Jumla ya Mizigo</p>
                            <p className="text-xs text-blue-100">{cargoCount} vipande, {order.cargoItems.length} aina</p>
                          </div>
                          <p className="text-2xl font-bold">TZS {cargoTotal.toLocaleString()}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* ── SECTION 3: SAFARI / ROUTE ── */}
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-6 h-6 bg-brand-blue rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0">3</div>
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

      {/* ═══ PAYMENT REVIEW MODAL ═══ */}
      {reviewShipment && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md shadow-2xl rounded-2xl flex flex-col max-h-[94vh]">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-orange-100 rounded-xl flex items-center justify-center">
                  <CreditCard className="w-5 h-5 text-orange-600" />
                </div>
                <div>
                  <h2 className="font-bold text-gray-900">Hakiki Malipo</h2>
                  <p className="text-xs text-brand-blue font-mono mt-0.5">{reviewShipment.trackingId}</p>
                </div>
              </div>
              <button onClick={closeReview} className="p-2 hover:bg-gray-100 rounded-full">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {/* Body */}
            <div className="p-6 space-y-4 overflow-y-auto">
              {/* Customer */}
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-sm text-gray-700">
                  <User className="w-4 h-4 text-gray-400" />
                  <span className="font-semibold">{reviewShipment.customerName}</span>
                </div>
                <a href={`tel:${reviewShipment.phone}`} className="flex items-center gap-1.5 text-sm text-brand-blue">
                  <Phone className="w-3.5 h-3.5" /> {reviewShipment.phone}
                </a>
              </div>

              {/* Route */}
              <div className="flex items-center gap-2 text-sm text-gray-600 bg-gray-50 rounded-lg px-3 py-2">
                <MapPin className="w-4 h-4 text-gray-400 flex-shrink-0" />
                <span>{reviewShipment.from}</span>
                <span className="text-gray-400">→</span>
                <span>{reviewShipment.to}</span>
              </div>

              {/* Amount due */}
              <div className="bg-blue-50 border border-blue-100 rounded-xl px-4 py-3 flex items-center justify-between">
                <span className="text-xs font-semibold text-brand-blue uppercase tracking-wider">Kiasi cha Kulipa</span>
                <span className="text-2xl font-bold text-brand-blue">{formatMoney(reviewShipment.price, reviewShipment.currency)}</span>
              </div>

              {/* Payment method */}
              {reviewShipment.paymentMethod && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">Njia ya malipo</span>
                  <span className="font-medium text-gray-800">{reviewShipment.paymentMethod}</span>
                </div>
              )}

              {/* Transaction reference */}
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Namba ya Muamala</p>
                <div className="flex items-center gap-2 bg-gray-900 rounded-xl px-4 py-3">
                  <span className="flex-1 font-mono text-lg font-bold text-white tracking-wide break-all">
                    {reviewShipment.paymentRef || '—'}
                  </span>
                  {reviewShipment.paymentRef && (
                    <button
                      onClick={() => copyRef(reviewShipment.paymentRef || '')}
                      className="flex items-center gap-1 text-xs font-medium text-gray-200 bg-white/10 hover:bg-white/20 px-2.5 py-1.5 rounded-lg transition-colors flex-shrink-0"
                      title="Nakili namba"
                    >
                      {copied ? <><Check className="w-3.5 h-3.5 text-green-400" /> Imenakiliwa</> : <><Copy className="w-3.5 h-3.5" /> Nakili</>}
                    </button>
                  )}
                </div>
                <p className="text-xs text-gray-400 mt-1.5">Linganisha namba hii na taarifa ya M-Pesa/benki kabla ya kuthibitisha.</p>
              </div>

              {/* Submitted time */}
              {reviewShipment.paidAt && (
                <div className="flex items-center gap-1.5 text-xs text-gray-500">
                  <Clock className="w-3.5 h-3.5" />
                  Iliwasilishwa: {new Date(reviewShipment.paidAt).toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </div>
              )}

              {/* Reject reason (revealed) */}
              {rejecting && (
                <div>
                  <label className="label">Sababu ya kukataa (hiari)</label>
                  <textarea
                    value={rejectReason}
                    onChange={e => setRejectReason(e.target.value)}
                    placeholder="mfano: Namba ya muamala haipatikani kwenye taarifa..."
                    rows={2}
                    className="input-field resize-none"
                  />
                </div>
              )}

              {reviewError && (
                <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-3 py-2 rounded-lg">{reviewError}</div>
              )}
            </div>

            {/* Footer actions — only when pending */}
            {reviewShipment.paymentStatus === 'pending' ? (
              <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 rounded-b-2xl">
                {rejecting ? (
                  <div className="flex gap-3">
                    <button
                      onClick={() => setRejecting(false)}
                      disabled={reviewLoading}
                      className="btn-outline flex-1 py-3 text-sm"
                    >
                      Rudi
                    </button>
                    <button
                      onClick={handleRejectPayment}
                      disabled={reviewLoading}
                      className="flex-1 py-3 text-sm font-bold text-white bg-red-600 hover:bg-red-700 rounded-lg flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      {reviewLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />}
                      Thibitisha Kukataa
                    </button>
                  </div>
                ) : (
                  <div className="flex gap-3">
                    <button
                      onClick={() => { setRejecting(true); setReviewError(''); }}
                      disabled={reviewLoading}
                      className="flex-1 py-3 text-sm font-bold text-red-600 border border-red-300 hover:bg-red-50 rounded-lg flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      <XCircle className="w-4 h-4" /> Kataa
                    </button>
                    <button
                      onClick={handleConfirmPayment}
                      disabled={reviewLoading}
                      className="flex-1 py-3 text-sm font-bold text-white bg-green-600 hover:bg-green-700 rounded-lg flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      {reviewLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                      Thibitisha Malipo
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 rounded-b-2xl flex items-center justify-center gap-2 text-sm">
                <PaymentBadge status={reviewShipment.paymentStatus} />
                {reviewShipment.paymentConfirmedBy && (
                  <span className="text-gray-500">na {reviewShipment.paymentConfirmedBy}</span>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
