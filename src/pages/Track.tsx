import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, Package, MapPin, Weight, Phone, Mail, AlertCircle, Loader2, QrCode } from 'lucide-react';
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

              {/* Shipment Details Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                <div className="bg-brand-gray rounded-lg p-4">
                  <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Customer</p>
                  <p className="font-semibold text-gray-900">{shipment.customerName}</p>
                  <div className="flex items-center gap-1.5 mt-1.5 text-sm text-gray-600">
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
                  <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Route</p>
                  <div className="flex items-center gap-2">
                    <div className="text-center">
                      <MapPin className="w-4 h-4 text-brand-blue mx-auto mb-0.5" />
                      <p className="font-semibold text-gray-900 text-sm">{shipment.from}</p>
                      <p className="text-xs text-gray-500">Origin</p>
                    </div>
                    <div className="flex-1 border-t-2 border-dashed border-gray-300" />
                    <div className="text-center">
                      <MapPin className="w-4 h-4 text-brand-green mx-auto mb-0.5" />
                      <p className="font-semibold text-gray-900 text-sm">{shipment.to}</p>
                      <p className="text-xs text-gray-500">Destination</p>
                    </div>
                  </div>
                </div>

                <div className="bg-brand-gray rounded-lg p-4">
                  <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Cargo Details</p>
                  <div className="flex items-center gap-1.5 mb-1">
                    <Weight className="w-4 h-4 text-brand-blue" />
                    <span className="font-semibold text-gray-900">{shipment.weight} kg</span>
                  </div>
                  <div className="flex items-start gap-1.5">
                    <Package className="w-4 h-4 text-brand-blue mt-0.5" />
                    <span className="text-sm text-gray-600">{shipment.description || 'General cargo'}</span>
                  </div>
                </div>
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
