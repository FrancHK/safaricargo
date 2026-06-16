import { useState, useRef, useEffect, useCallback } from 'react';
import { Search, X, Phone, CheckCircle, Loader2, Users, ChevronDown } from 'lucide-react';
import { getAllCustomers } from '../api/shipments';

interface CustomerItem {
  id: string;
  name: string;
  phone: string;
  email?: string;
}

interface Selected {
  id?: string;
  name: string;
  phone: string;
  email?: string;
  manual?: boolean;
}

interface Props {
  value: Selected | null;
  onChange: (c: Selected | null) => void;
}

export default function CustomerSearchInput({ value, onChange }: Props) {
  const [query, setQuery] = useState('');
  const [allCustomers, setAllCustomers] = useState<CustomerItem[]>([]);
  const [filtered, setFiltered] = useState<CustomerItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [manualMode, setManualMode] = useState(false);
  const [manualForm, setManualForm] = useState({ name: '', phone: '' });
  const ref = useRef<HTMLDivElement>(null);

  // Load all customers once
  const loadCustomers = useCallback(async () => {
    if (allCustomers.length > 0) return;
    setLoading(true);
    try {
      const result = await getAllCustomers();
      const list: CustomerItem[] = (result.customers || []).map(c => ({
        id: c.id,
        name: c.name,
        phone: c.phone,
        email: c.email
      }));
      setAllCustomers(list);
      setFiltered(list);
    } catch (err) {
      console.error('CustomerSearch error:', err);
      setAllCustomers([]);
      setFiltered([]);
    } finally {
      setLoading(false);
    }
  }, [allCustomers.length]);

  // Filter on query change
  useEffect(() => {
    if (!query.trim()) {
      setFiltered(allCustomers);
      return;
    }
    const q = query.toLowerCase();
    setFiltered(
      allCustomers.filter(c =>
        c.name.toLowerCase().includes(q) ||
        c.phone.includes(q) ||
        (c.email || '').toLowerCase().includes(q)
      )
    );
  }, [query, allCustomers]);

  // Close on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  function handleOpen() {
    setOpen(true);
    loadCustomers();
  }

  function select(c: CustomerItem) {
    onChange({ id: c.id, name: c.name, phone: c.phone, email: c.email });
    setQuery('');
    setOpen(false);
    setManualMode(false);
  }

  function clear() {
    onChange(null);
    setQuery('');
    setManualForm({ name: '', phone: '' });
  }

  function applyManual() {
    if (!manualForm.name.trim() || !manualForm.phone.trim()) return;
    onChange({ name: manualForm.name.trim(), phone: manualForm.phone.trim(), manual: true });
    setManualMode(false);
    setOpen(false);
  }

  function getInitials(name: string) {
    return name.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase();
  }

  const COLORS = ['bg-blue-500','bg-purple-500','bg-green-500','bg-orange-500','bg-pink-500','bg-teal-500'];
  function avatarColor(name: string) {
    return COLORS[name.charCodeAt(0) % COLORS.length];
  }

  // ── SELECTED ──────────────────────────────────────────────────
  if (value) {
    return (
      <div className="flex items-center gap-3 bg-blue-50 border-2 border-brand-blue/20 rounded-xl p-3.5">
        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0 ${avatarColor(value.name)}`}>
          {getInitials(value.name)}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-semibold text-gray-900 text-sm">{value.name}</p>
            {value.manual && (
              <span className="text-xs bg-orange-100 text-orange-600 px-2 py-0.5 rounded-full font-medium">Manual</span>
            )}
          </div>
          <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
            <Phone className="w-3 h-3" /> {value.phone}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <CheckCircle className="w-5 h-5 text-brand-green" />
          <button onClick={clear} className="w-7 h-7 flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  // ── MANUAL MODE ───────────────────────────────────────────────
  if (manualMode) {
    return (
      <div className="border-2 border-orange-200 bg-orange-50 rounded-xl p-4 space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold text-orange-800">Ingiza Maelezo ya Mteja</p>
          <button onClick={() => setManualMode(false)} className="text-gray-400 hover:text-gray-600">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div>
          <label className="label text-xs">Majina Matatu (Kwanza Kati Mwisho) *</label>
          <input
            autoFocus
            placeholder="mfano: Juma Hamisi Mwangi"
            value={manualForm.name}
            onChange={e => setManualForm(p => ({ ...p, name: e.target.value }))}
            className="input-field text-sm"
          />
        </div>
        <div>
          <label className="label text-xs">Nambari ya Simu *</label>
          <input
            placeholder="+255 700 000 000"
            value={manualForm.phone}
            onChange={e => setManualForm(p => ({ ...p, phone: e.target.value }))}
            className="input-field text-sm"
          />
        </div>
        <div className="flex gap-2">
          <button onClick={() => setManualMode(false)} className="flex-1 py-2 text-sm border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50">
            Rudi
          </button>
          <button
            onClick={applyManual}
            disabled={!manualForm.name.trim() || !manualForm.phone.trim()}
            className="flex-1 py-2 text-sm btn-primary"
          >
            Tumia Maelezo Haya
          </button>
        </div>
      </div>
    );
  }

  // ── SEARCH + DROPDOWN ─────────────────────────────────────────
  return (
    <div ref={ref} className="relative">
      <div
        onClick={handleOpen}
        className={`flex items-center gap-2.5 border-2 rounded-xl px-4 py-3 cursor-pointer transition-all bg-white ${
          open ? 'border-brand-blue shadow-sm' : 'border-gray-200 hover:border-gray-300'
        }`}
      >
        {loading
          ? <Loader2 className="w-4 h-4 text-brand-blue animate-spin flex-shrink-0" />
          : <Search className="w-4 h-4 text-gray-400 flex-shrink-0" />
        }
        <input
          className="flex-1 text-sm outline-none bg-transparent text-gray-900 placeholder-gray-400 cursor-pointer"
          placeholder="Tafuta mteja kwa jina au simu..."
          value={query}
          onChange={e => { setQuery(e.target.value); if (!open) handleOpen(); }}
          onFocus={handleOpen}
          readOnly={!open}
        />
        {query ? (
          <button onClick={e => { e.stopPropagation(); setQuery(''); }} className="text-gray-400 hover:text-gray-600">
            <X className="w-4 h-4" />
          </button>
        ) : (
          <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`} />
        )}
      </div>

      {/* Dropdown */}
      {open && (
        <div className="absolute z-50 top-full mt-1.5 left-0 right-0 bg-white border border-gray-200 rounded-xl shadow-2xl overflow-hidden">

          {/* Header row */}
          <div className="flex items-center justify-between px-4 py-2.5 bg-gray-50 border-b border-gray-100">
            <div className="flex items-center gap-1.5 text-xs text-gray-500">
              <Users className="w-3.5 h-3.5" />
              {loading ? 'Inapakia...' : `${filtered.length} mteja${filtered.length !== 1 ? '' : ''}`}
            </div>
            <button
              onClick={() => { setManualMode(true); setOpen(false); }}
              className="text-xs text-brand-blue hover:underline font-medium"
            >
              + Ingiza kwa mkono
            </button>
          </div>

          {/* List */}
          <div className="max-h-60 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center gap-2 py-8 text-sm text-gray-400">
                <Loader2 className="w-4 h-4 animate-spin" /> Inapakia wateja...
              </div>
            ) : filtered.length === 0 ? (
              <div className="py-8 text-center">
                <Users className="w-10 h-10 text-gray-200 mx-auto mb-2" />
                <p className="text-sm text-gray-400 mb-3">
                  {query ? `Hakuna mteja anayeitwa "${query}"` : 'Hakuna wateja bado'}
                </p>
                <button
                  onClick={() => { setManualMode(true); setOpen(false); }}
                  className="text-xs text-brand-blue hover:underline"
                >
                  + Ingiza mteja mpya kwa mkono
                </button>
              </div>
            ) : (
              filtered.map((c, i) => (
                <button
                  key={c.id}
                  onClick={() => select(c)}
                  className="w-full text-left px-4 py-3 hover:bg-blue-50 flex items-center gap-3 transition-colors border-b border-gray-50 last:border-0"
                >
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0 ${avatarColor(c.name)}`}>
                    {getInitials(c.name)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">{c.name}</p>
                    <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                      <Phone className="w-3 h-3" /> {c.phone}
                    </p>
                  </div>
                  <span className="text-xs text-gray-300 font-mono flex-shrink-0">#{i + 1}</span>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
