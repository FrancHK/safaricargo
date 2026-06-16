import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Printer, ArrowLeft, Minus, Plus, Loader2 } from 'lucide-react';
import { trackShipment } from '../api/shipments';
import ShipmentLabel from '../components/ShipmentLabel';
import type { Shipment } from '../types';

export default function PrintLabel() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const trackingId = searchParams.get('id') || '';

  const [shipment, setShipment] = useState<Shipment | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [copies, setCopies] = useState(1);

  useEffect(() => {
    if (!trackingId) { setError('Hakuna Tracking ID.'); setLoading(false); return; }
    trackShipment(trackingId)
      .then(s => setShipment(s))
      .catch(() => setError('Mzigo haukupatikana.'))
      .finally(() => setLoading(false));
  }, [trackingId]);

  function handlePrint() {
    window.print();
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <Loader2 className="w-8 h-8 animate-spin text-brand-blue" />
    </div>
  );

  if (error || !shipment) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <p className="text-red-500 font-semibold">{error || 'Hitilafu'}</p>
        <button onClick={() => navigate(-1)} className="btn-outline mt-4 px-6 py-2">Rudi</button>
      </div>
    </div>
  );

  return (
    <>
      {/* ── Print controls — hidden when printing ── */}
      <div className="print:hidden bg-brand-blue text-white px-6 py-4">
        <div className="max-w-3xl mx-auto flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate(-1)} className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="font-bold text-lg">Chapisha Lebo ya Mzigo</h1>
              <p className="text-blue-300 text-sm">{shipment.trackingId} · {shipment.customerName}</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Copies control */}
            <div className="flex items-center gap-1 bg-white/10 rounded-xl p-1">
              <button
                onClick={() => setCopies(c => Math.max(1, c - 1))}
                className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/20 transition-colors"
              >
                <Minus className="w-4 h-4" />
              </button>
              <div className="px-3 text-center min-w-[60px]">
                <div className="font-bold text-lg leading-none">{copies}</div>
                <div className="text-blue-300 text-xs">nakala</div>
              </div>
              <button
                onClick={() => setCopies(c => Math.min(20, c + 1))}
                className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/20 transition-colors"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            <button
              onClick={handlePrint}
              className="flex items-center gap-2 bg-brand-green hover:bg-brand-green-dark text-white font-bold px-6 py-3 rounded-xl transition-colors shadow-lg"
            >
              <Printer className="w-5 h-5" />
              Chapisha {copies > 1 ? `(${copies} nakala)` : ''}
            </button>
          </div>
        </div>
      </div>

      {/* ── Label preview area ── */}
      <div className="print:p-0 bg-gray-100 min-h-screen p-6 print:bg-white">
        <div className="max-w-3xl mx-auto">
          {/* Screen preview title */}
          <p className="print:hidden text-center text-sm text-gray-500 mb-4">
            Muundo wa Lebo — {copies} nakala zitachapishwa
          </p>

          {/* Labels */}
          <div className="space-y-6 print:space-y-0">
            {Array.from({ length: copies }).map((_, i) => (
              <div key={i} className="print:break-after-page last:print:break-after-avoid">
                <ShipmentLabel shipment={shipment} copyIndex={i} />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Print-only styles ── */}
      <style>{`
        @media print {
          @page {
            size: A5 landscape;
            margin: 5mm;
          }
          body { margin: 0; background: white; }
          .print\\:hidden { display: none !important; }
        }
      `}</style>
    </>
  );
}
