import { useState } from 'react';
import { Package, CheckCircle, Copy, Loader2 } from 'lucide-react';
import { createShipment } from '../api/shipments';
import type { CreateShipmentForm, Shipment } from '../types';

const INITIAL_FORM: CreateShipmentForm = {
  customerName: '',
  phone: '',
  email: '',
  from: '',
  to: '',
  weight: '',
  description: ''
};

const CITIES = [
  'Dar es Salaam', 'Nairobi', 'Mombasa', 'Kampala', 'Arusha',
  'Dodoma', 'Zanzibar', 'Kigali', 'Addis Ababa', 'Kisumu',
  'Mwanza', 'Tanga', 'Entebbe', 'Nakuru', 'Eldoret'
];

export default function Booking() {
  const [form, setForm] = useState<CreateShipmentForm>(INITIAL_FORM);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<Shipment | null>(null);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (parseFloat(form.weight) <= 0) {
      setError('Weight must be greater than 0.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const shipment = await createShipment(form);
      setSuccess(shipment);
      setForm(INITIAL_FORM);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error
        ?? 'Failed to book cargo. Please try again.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  function copyTrackingId() {
    if (success) {
      navigator.clipboard.writeText(success.trackingId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  if (success) {
    return (
      <div className="min-h-screen bg-brand-gray flex items-center justify-center py-10 px-4">
        <div className="max-w-md w-full card text-center animate-slide-up">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-10 h-10 text-brand-green" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Booking Confirmed!</h2>
          <p className="text-gray-500 mb-6">
            Your cargo has been registered successfully. Save your Tracking ID below.
          </p>

          <div className="bg-brand-gray border-2 border-dashed border-brand-blue rounded-xl p-6 mb-6">
            <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">Your Tracking ID</p>
            <p className="text-3xl font-bold text-brand-blue font-mono tracking-wider">{success.trackingId}</p>
            <button
              onClick={copyTrackingId}
              className="mt-3 flex items-center gap-2 text-sm text-gray-500 hover:text-brand-blue mx-auto transition-colors"
            >
              {copied ? (
                <><CheckCircle className="w-4 h-4 text-brand-green" /> Copied!</>
              ) : (
                <><Copy className="w-4 h-4" /> Copy Tracking ID</>
              )}
            </button>
          </div>

          <div className="bg-blue-50 rounded-lg p-4 text-left mb-6">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div><span className="text-gray-500">From:</span> <span className="font-medium">{success.from}</span></div>
              <div><span className="text-gray-500">To:</span> <span className="font-medium">{success.to}</span></div>
              <div><span className="text-gray-500">Weight:</span> <span className="font-medium">{success.weight} kg</span></div>
              <div><span className="text-gray-500">Status:</span> <span className="font-medium text-brand-blue">{success.status}</span></div>
            </div>
          </div>

          <div className="flex gap-3">
            <a href={`/track?id=${success.trackingId}`} className="btn-primary flex-1 text-center text-sm">
              Track Shipment
            </a>
            <button onClick={() => setSuccess(null)} className="btn-outline flex-1 text-sm">
              New Booking
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-brand-gray py-10">
      <div className="max-w-2xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-8">
          <div className="w-14 h-14 bg-brand-blue rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Package className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Book Your Cargo</h1>
          <p className="text-gray-500">Fill in the details below to register your shipment</p>
        </div>

        <div className="card">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Customer Info */}
            <div>
              <h3 className="text-sm font-semibold text-brand-blue uppercase tracking-wide mb-4">
                Customer Information
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="label">Full Name *</label>
                  <input
                    name="customerName"
                    value={form.customerName}
                    onChange={handleChange}
                    required
                    placeholder="John Doe"
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="label">Phone Number *</label>
                  <input
                    name="phone"
                    type="tel"
                    value={form.phone}
                    onChange={handleChange}
                    required
                    placeholder="+255 700 000 000"
                    className="input-field"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="label">Email (optional)</label>
                  <input
                    name="email"
                    type="email"
                    value={form.email}
                    onChange={handleChange}
                    placeholder="john@example.com"
                    className="input-field"
                  />
                </div>
              </div>
            </div>

            <div className="border-t border-gray-100 pt-6">
              <h3 className="text-sm font-semibold text-brand-blue uppercase tracking-wide mb-4">
                Shipment Details
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="label">From (Origin) *</label>
                  <select name="from" value={form.from} onChange={handleChange} required className="select-field">
                    <option value="">Select city...</option>
                    {CITIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label">To (Destination) *</label>
                  <select name="to" value={form.to} onChange={handleChange} required className="select-field">
                    <option value="">Select city...</option>
                    {CITIES.filter(c => c !== form.from).map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label">Weight (kg) *</label>
                  <input
                    name="weight"
                    type="number"
                    min="0.1"
                    step="0.1"
                    value={form.weight}
                    onChange={handleChange}
                    required
                    placeholder="e.g. 5.5"
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="label">Description (optional)</label>
                  <input
                    name="description"
                    value={form.description}
                    onChange={handleChange}
                    placeholder="e.g. Electronics, Clothing..."
                    className="input-field"
                  />
                </div>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg">
                {error}
              </div>
            )}

            <div className="pt-2">
              <button type="submit" disabled={loading} className="btn-primary w-full justify-center flex items-center gap-2 text-base py-3.5">
                {loading ? (
                  <><Loader2 className="w-5 h-5 animate-spin" /> Registering Shipment...</>
                ) : (
                  <><Package className="w-5 h-5" /> Confirm Booking</>
                )}
              </button>
              <p className="text-xs text-gray-400 text-center mt-3">
                * By submitting, you agree to SafiriCargo's terms of service.
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
