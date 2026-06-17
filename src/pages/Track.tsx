import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, Package, MapPin, Phone, Mail, AlertCircle, Loader2, QrCode, ShoppingBag } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { trackShipment } from '../api/shipments';
import TrackingTimeline from '../components/TrackingTimeline';
import StatusBadge from '../components/StatusBadge';
import type { Shipment } from '../types';

export default function Track() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [query, setQuery] = useState(searchParams.get('id') ?? '');
  const [shipment, setShipment] = useState<Shipment | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showQr, setShowQr] = useState(false);

  useEffect(() => {
    const id = searchParams.get('id');
    if (id) {
      setQuery(id);
      handleSearch(id);
    }
  }, []);

  async function handleSearch(id?: string) {
    const trackId = (id ?? query).trim().toUpperCase();
    if (!trackId) return;

    setLoading(true);
    setError('');
    setShipment(null);
    setShowQr(false);
    setSearchParams({ id: trackId });

    try {
      const result = await trackShipment(trackId);
      setShipment(result);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error
        ?? 'Tracking ID not found. Please check and try again.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    handleSearch();
  }

  return (
    <div className="min-h-screen bg-brand-gray py-10">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Track Your Shipment</h1>
          <p className="text-gray-500">Enter your Tracking ID to see real-time status updates</p>
        </div>

        {/* Search Form */}
        <div className="card mb-6">
          <form onSubmit={onSubmit} className="flex gap-3">
            <div className="flex-1 flex items-center gap-3 border border-gray-300 rounded-lg px-4 py-3 focus-within:ring-2 focus-within:ring-brand-blue focus-within:border-transparent transition-all">
              <Search className="w-5 h-5 text-gray-400 flex-shrink-0" />
              <input
                type="text"
                placeholder="Enter Tracking ID (e.g. SC-2026-0001)"
                value={query}
                onChange={e => setQuery(e.target.value.toUpperCase())}
                className="flex-1 outline-none text-gray-900 placeholder-gray-400 bg-transparent"
              />
            </div>
            <button type="submit" disabled={loading} className="btn-primary whitespace-nowrap">
              {loading ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" /> Searching...
                </span>
              ) : 'Track'}
            </button>
          </form>
        </div>

        {/* Loading */}
        {loading && (
          <div className="card text-center py-12">
            <Loader2 className="w-10 h-10 text-brand-blue animate-spin mx-auto mb-3" />
            <p className="text-gray-500">Searching for your shipment...</p>
          </div>
        )}

        {/* Error */}
        {error && !loading && (
          <div className="card border-red-200 bg-red-50">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-6 h-6 text-red-500 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-red-800 mb-1">Shipment Not Found</h3>
                <p className="text-sm text-red-600">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Result */}
        {shipment && !loading && (
          <div className="space-y-6 animate-slide-up">
            {/* Summary Card */}
            <div className="card">
              <div className="flex items-start justify-between flex-wrap gap-4 mb-6">
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <h2 className="text-2xl font-bold text-brand-blue font-mono">{shipment.trackingId}</h2>
                    <StatusBadge status={shipment.status} />
                  </div>
                  <p className="text-sm text-gray-500">
                    Booked on {new Date(shipment.createdAt).toLocaleDateString('en-KE', {
                      day: 'numeric', month: 'long', year: 'numeric'
                    })}
                  </p>
                </div>
                <button
                  onClick={() => setShowQr(!showQr)}
                  className="flex items-center gap-2 text-sm text-brand-blue border border-brand-blue px-3 py-2 rounded-lg hover:bg-brand-blue hover:text-white transition-colors"
                >
                  <QrCode className="w-4 h-4" />
                  {showQr ? 'Hide' : 'Show'} QR
                </button>
              </div>

              {/* QR Code */}
              {showQr && (
                <div className="mb-6 flex justify-center">
                  <div className="bg-white border-2 border-gray-100 rounded-xl p-4 shadow-sm text-center">
                    <QRCodeSVG
                      value={`${window.location.origin}/track?id=${shipment.trackingId}`}
                      size={160}
                      fgColor="#1E3A8A"
                    />
                    <p className="text-xs text-gray-500 mt-2">{shipment.trackingId}</p>
                  </div>
                </div>
              )}

              {/* Shipment Details — Customer + Route (top row) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div className="bg-brand-gray rounded-lg p-4">
                  <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">Customer</p>
                  <p className="font-semibold text-gray-900 text-base">{shipment.customerName}</p>
                  <div className="flex items-center gap-1.5 mt-2 text-sm text-gray-600">
                    <Phone className="w-3.5 h-3.5" />
                    {shipment.phone}
                  </div>
                  {shipment.email && (
                    <div className="flex items-center gap-1.5 mt-1 text-sm text-gray-600">
                      <Mail className="w-3.5 h-3.5" />
                      {shipment.email}
                    </div>
                  )}
                </div>

                <div className="bg-brand-gray rounded-lg p-4">
                  <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">Route</p>
                  <div className="flex items-center gap-3">
                    <div className="text-center flex-1">
                      <MapPin className="w-5 h-5 text-brand-blue mx-auto mb-1" />
                      <p className="font-semibold text-gray-900 text-sm">{shipment.from}</p>
                      <p className="text-xs text-gray-500 mt-0.5">Origin</p>
                    </div>
                    <div className="flex-1 border-t-2 border-dashed border-gray-300 relative">
                      <span className="absolute -top-2 left-1/2 -translate-x-1/2 text-brand-green text-sm">→</span>
                    </div>
                    <div className="text-center flex-1">
                      <MapPin className="w-5 h-5 text-brand-green mx-auto mb-1" />
                      <p className="font-semibold text-gray-900 text-sm">{shipment.to}</p>
                      <p className="text-xs text-gray-500 mt-0.5">Destination</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Cargo Details — full width below */}
              <div className="mb-6">
                {(() => {
                  const CARGO_ICONS: Record<string, string> = { box: '📦', kifungashio: '🎁', robe: '👜', other: '📋' };
                  const CARGO_LABELS: Record<string, string> = { box: 'Box / Sanduku', kifungashio: 'Kifungashio', robe: 'Robe / Mfuko', other: 'Nyingine' };
                  type SubItem = { quantity: number; unit_price: number; subtotal?: number };
                  type CargoItem = { type: string; label?: string; quantity?: number; subtotal?: number; sub_items?: SubItem[] };
                  const items = ((shipment as unknown as { cargoItems?: CargoItem[] }).cargoItems || []).filter(it => it && (it.sub_items?.length || it.quantity));
                  const price = (shipment as unknown as { price?: number }).price ?? 0;
                  const totalCount = items.reduce((n, it) => n + (it.quantity ?? (it.sub_items?.reduce((s, x) => s + (x.quantity || 0), 0) ?? 0)), 0);
                  const notes = shipment.description || '';
                  const hasItems = items.length > 0;

                  return (
                    <div className="bg-gradient-to-br from-blue-50 via-white to-emerald-50 border border-blue-100 rounded-2xl p-5">
                      {/* Header */}
                      <div className="flex items-center justify-between mb-4 pb-3 border-b border-blue-100">
                        <div className="flex items-center gap-2.5">
                          <div className="w-9 h-9 bg-gradient-to-br from-brand-blue to-blue-700 rounded-xl flex items-center justify-center shadow-md">
                            <ShoppingBag className="w-4 h-4 text-white" />
                          </div>
                          <div>
                            <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">Cargo Details</p>
                            <p className="text-[10px] text-gray-400">Kilichomo ndani ya mzigo</p>
                          </div>
                        </div>
                        {price > 0 && (
                          <div className="text-right">
                            <p className="text-[10px] text-gray-500 uppercase tracking-wider">Jumla</p>
                            <p className="text-lg font-bold text-brand-blue">TZS {price.toLocaleString()}</p>
                          </div>
                        )}
                      </div>

                      {hasItems ? (
                        <div className="space-y-3">
                          {items.map((item, i) => {
                            const label = item.label || CARGO_LABELS[item.type] || item.type;
                            const icon = CARGO_ICONS[item.type] || '📋';
                            const subs = item.sub_items || [];
                            const itemTotal = item.subtotal ?? subs.reduce((s, x) => s + (x.subtotal ?? x.quantity * x.unit_price), 0);
                            const itemCount = item.quantity ?? subs.reduce((n, x) => n + (x.quantity || 0), 0);
                            return (
                              <div key={i} className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                                {/* Item head */}
                                <div className="flex items-center justify-between gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-50/50 to-transparent border-b border-gray-100">
                                  <div className="flex items-center gap-2">
                                    <span className="text-xl">{icon}</span>
                                    <div>
                                      <p className="text-sm font-bold text-gray-900 leading-tight">{label}</p>
                                      <p className="text-[10px] text-gray-500 mt-0.5">{itemCount} vipande</p>
                                    </div>
                                  </div>
                                  <span className="text-sm font-bold text-brand-blue">TZS {itemTotal.toLocaleString()}</span>
                                </div>
                                {/* Sub-items */}
                                {subs.length > 0 && (
                                  <div className="divide-y divide-gray-100">
                                    {subs.map((s, j) => (
                                      <div key={j} className="grid grid-cols-[auto_1fr_auto] items-center gap-3 px-4 py-2 text-sm">
                                        <span className="font-mono font-bold text-gray-700 text-right w-6">{s.quantity}×</span>
                                        <span className="text-gray-500 font-mono text-xs">TZS {Number(s.unit_price).toLocaleString()}</span>
                                        <span className="font-mono font-semibold text-gray-900">TZS {(s.subtotal ?? s.quantity * s.unit_price).toLocaleString()}</span>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            );
                          })}

                          {/* Footer summary */}
                          <div className="flex items-center justify-between px-4 py-2.5 bg-brand-blue text-white rounded-xl shadow-md">
                            <div>
                              <p className="text-[10px] uppercase tracking-widest text-blue-200">Total</p>
                              <p className="text-xs text-blue-100">{totalCount} vipande · {items.length} aina</p>
                            </div>
                            <p className="text-xl font-bold">TZS {price.toLocaleString()}</p>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-start gap-2 bg-white border border-gray-200 rounded-xl px-4 py-3">
                          <Package className="w-4 h-4 text-brand-blue mt-0.5 flex-shrink-0" />
                          <span className="text-sm text-gray-700">{shipment.description || 'General cargo'}</span>
                        </div>
                      )}

                      {/* Notes */}
                      {hasItems && notes && (
                        <div className="mt-3 px-4 py-2.5 bg-white/60 border border-blue-100 rounded-xl">
                          <p className="text-[10px] font-bold text-brand-blue uppercase tracking-widest mb-1">Maelezo</p>
                          <p className="text-xs text-gray-700 leading-relaxed">{notes}</p>
                        </div>
                      )}
                    </div>
                  );
                })()}
              </div>
            </div>

            {/* Tracking Timeline */}
            <div className="card">
              <h2 className="text-lg font-bold text-gray-900 mb-6">Tracking Timeline</h2>
              <TrackingTimeline shipment={shipment} />
            </div>
          </div>
        )}

        {/* Empty state */}
        {!loading && !error && !shipment && (
          <div className="card text-center py-16">
            <Package className="w-16 h-16 text-gray-200 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-400 mb-1">Enter a Tracking ID</h3>
            <p className="text-sm text-gray-400">Track your shipment by entering the Tracking ID above.</p>
          </div>
        )}
      </div>
    </div>
  );
}
