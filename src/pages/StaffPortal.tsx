import { useState, useEffect, useRef } from 'react';
import { Package, Scan, CheckCircle, XCircle, Loader2, LogOut, User, MapPin, ArrowRight, QrCode, Keyboard } from 'lucide-react';
import { loginStaff, scanShipment } from '../api/shipments';
import type { StaffUser, ScanResult } from '../types';

type ScanState = 'idle' | 'scanning' | 'loading' | 'success' | 'error';

export default function StaffPortal() {
  const [staffUser, setStaffUser] = useState<StaffUser | null>(() => {
    const saved = localStorage.getItem('sc_staff');
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('sc_staff_token'));

  // Login state
  const [loginForm, setLoginForm] = useState({ email: '', password: '' });
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState('');

  // Scan state
  const [scanState, setScanState] = useState<ScanState>('idle');
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [scanError, setScanError] = useState('');
  const [manualId, setManualId] = useState('');
  const [useManual, setUseManual] = useState(false);
  const scannerRef = useRef<HTMLDivElement>(null);
  const html5QrRef = useRef<unknown>(null);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoginLoading(true);
    setLoginError('');
    try {
      const { token: t, staff } = await loginStaff(loginForm.email, loginForm.password);
      setToken(t);
      setStaffUser(staff);
      localStorage.setItem('sc_staff_token', t);
      localStorage.setItem('sc_staff', JSON.stringify(staff));
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error ?? 'Imeshindwa kuingia.';
      setLoginError(msg);
    } finally {
      setLoginLoading(false);
    }
  }

  function handleLogout() {
    setStaffUser(null);
    setToken(null);
    localStorage.removeItem('sc_staff_token');
    localStorage.removeItem('sc_staff');
    stopScanner();
  }

  async function processTrackingId(trackingId: string) {
    if (!token || !trackingId.trim()) return;
    setScanState('loading');
    setScanError('');
    stopScanner();
    try {
      const result = await scanShipment(trackingId.trim().toUpperCase(), token);
      setScanResult(result);
      setScanState('success');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error ?? 'Scan imeshindwa.';
      setScanError(msg);
      setScanState('error');
    }
  }

  async function startScanner() {
    setScanState('scanning');
    setScanResult(null);
    setScanError('');

    try {
      const { Html5Qrcode } = await import('html5-qrcode');
      const qr = new Html5Qrcode('qr-reader');
      html5QrRef.current = qr;

      await qr.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        (decodedText: string) => {
          // Extract tracking ID from URL or use as-is
          const match = decodedText.match(/SC-\d{4}-\d{4}/);
          const trackingId = match ? match[0] : decodedText;
          processTrackingId(trackingId);
        },
        () => {}
      );
    } catch {
      setScanState('idle');
      setUseManual(true);
    }
  }

  function stopScanner() {
    const qr = html5QrRef.current as { stop?: () => Promise<void>; clear?: () => void } | null;
    if (qr?.stop) {
      qr.stop().then(() => qr.clear?.()).catch(() => {});
      html5QrRef.current = null;
    }
  }

  function resetScan() {
    setScanState('idle');
    setScanResult(null);
    setScanError('');
    setManualId('');
  }

  useEffect(() => () => stopScanner(), []);

  const STATUS_COLOR: Record<string, string> = {
    'Received': 'bg-gray-500', 'Processing': 'bg-blue-500', 'In Transit': 'bg-yellow-500',
    'Arrived at Hub': 'bg-purple-500', 'Out for Delivery': 'bg-orange-500', 'Delivered': 'bg-green-500'
  };

  // ─── LOGIN SCREEN ──────────────────────────────────────────────
  if (!staffUser || !token) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-brand-blue to-blue-900 flex items-center justify-center p-4">
        <div className="w-full max-w-sm">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-white/20">
              <Package className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-white">Safiri<span className="text-brand-green">Cargo</span></h1>
            <p className="text-blue-300 text-sm mt-1">Portal ya Wafanyakazi</p>
          </div>

          <div className="bg-white rounded-2xl shadow-2xl p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-5">Ingia Kwa Akaunti Yako</h2>
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="label">Email</label>
                <input type="email" required value={loginForm.email}
                  onChange={e => setLoginForm(p => ({ ...p, email: e.target.value }))}
                  placeholder="jina@safiricargo.com" className="input-field" />
              </div>
              <div>
                <label className="label">Password</label>
                <input type="password" required value={loginForm.password}
                  onChange={e => setLoginForm(p => ({ ...p, password: e.target.value }))}
                  placeholder="••••••••" className="input-field" />
              </div>
              {loginError && (
                <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-3 py-2.5 rounded-lg">{loginError}</div>
              )}
              <button type="submit" disabled={loginLoading} className="btn-primary w-full flex items-center justify-center gap-2 py-3">
                {loginLoading ? <><Loader2 className="w-4 h-4 animate-spin" /> Ingia...</> : 'Ingia'}
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  // ─── STAFF PORTAL ──────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-brand-blue text-white px-4 py-4 shadow-lg">
        <div className="max-w-md mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-brand-green rounded-full flex items-center justify-center font-bold text-sm">
              {staffUser.name.charAt(0)}
            </div>
            <div>
              <p className="font-semibold text-sm">{staffUser.name}</p>
              <p className="text-blue-300 text-xs">{staffUser.department} · {staffUser.employee_id}</p>
            </div>
          </div>
          <button onClick={handleLogout} className="flex items-center gap-1.5 text-blue-300 hover:text-white text-sm transition-colors">
            <LogOut className="w-4 h-4" /> Toka
          </button>
        </div>
      </div>

      <div className="max-w-md mx-auto px-4 py-6 space-y-4">
        {/* Department badge */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex items-center gap-4">
          <div className="w-12 h-12 bg-brand-blue/10 rounded-xl flex items-center justify-center">
            <User className="w-6 h-6 text-brand-blue" />
          </div>
          <div className="flex-1">
            <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Kitengo Chako</p>
            <p className="font-bold text-gray-900">{staffUser.department}</p>
            {staffUser.station && (
              <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                <MapPin className="w-3 h-3" /> {staffUser.station}
              </p>
            )}
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-500">Status utakayoweka</p>
            <span className={`inline-block mt-1 text-xs font-semibold text-white px-2.5 py-1 rounded-full ${STATUS_COLOR[staffUser.status_to_assign] || 'bg-gray-500'}`}>
              {staffUser.status_to_assign}
            </span>
          </div>
        </div>

        {/* SUCCESS STATE */}
        {scanState === 'success' && scanResult && (
          <div className="bg-white rounded-2xl shadow-sm border border-green-200 overflow-hidden">
            <div className="bg-green-500 p-4 text-white text-center">
              <CheckCircle className="w-10 h-10 mx-auto mb-2" />
              <p className="font-bold text-lg">Scan Imefaulu!</p>
            </div>
            <div className="p-5 space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-500 uppercase tracking-wide">Tracking ID</span>
                <span className="font-mono font-bold text-brand-blue">{scanResult.shipment.trackingId}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-500 uppercase tracking-wide">Mteja</span>
                <span className="font-medium text-gray-900">{scanResult.shipment.customerName}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-500 uppercase tracking-wide">Safari</span>
                <span className="text-sm text-gray-700">{scanResult.shipment.from} <ArrowRight className="inline w-3 h-3" /> {scanResult.shipment.to}</span>
              </div>
              <div className="flex items-center justify-between bg-gray-50 rounded-xl p-3 mt-2">
                <div className="text-center">
                  <p className="text-xs text-gray-500 mb-1">Ilikuwa</p>
                  <span className="text-xs bg-gray-200 text-gray-700 px-2 py-0.5 rounded-full font-medium">{scanResult.shipment.previousStatus}</span>
                </div>
                <ArrowRight className="w-5 h-5 text-brand-green" />
                <div className="text-center">
                  <p className="text-xs text-gray-500 mb-1">Sasa</p>
                  <span className={`text-xs text-white px-2 py-0.5 rounded-full font-medium ${STATUS_COLOR[scanResult.shipment.newStatus] || 'bg-gray-500'}`}>
                    {scanResult.shipment.newStatus}
                  </span>
                </div>
              </div>
              <button onClick={resetScan} className="btn-primary w-full mt-2 flex items-center justify-center gap-2">
                <Scan className="w-4 h-4" /> Scan Mzigo Mwingine
              </button>
            </div>
          </div>
        )}

        {/* ERROR STATE */}
        {scanState === 'error' && (
          <div className="bg-white rounded-2xl shadow-sm border border-red-200 p-5 text-center">
            <XCircle className="w-12 h-12 text-red-400 mx-auto mb-3" />
            <p className="font-semibold text-gray-900 mb-1">Scan Imeshindwa</p>
            <p className="text-sm text-red-600 mb-4">{scanError}</p>
            <button onClick={resetScan} className="btn-outline text-sm px-6 py-2.5">Jaribu Tena</button>
          </div>
        )}

        {/* LOADING STATE */}
        {scanState === 'loading' && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-10 text-center">
            <Loader2 className="w-12 h-12 text-brand-blue animate-spin mx-auto mb-3" />
            <p className="text-gray-600 font-medium">Inasasisha hali ya mzigo...</p>
          </div>
        )}

        {/* IDLE / SCAN STATE */}
        {(scanState === 'idle' || scanState === 'scanning') && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            {/* Mode toggle */}
            <div className="flex border-b border-gray-100">
              <button onClick={() => { setUseManual(false); }} className={`flex-1 py-3 text-sm font-medium flex items-center justify-center gap-2 transition-colors ${!useManual ? 'text-brand-blue border-b-2 border-brand-blue' : 'text-gray-400'}`}>
                <QrCode className="w-4 h-4" /> Scan QR Code
              </button>
              <button onClick={() => { setUseManual(true); stopScanner(); setScanState('idle'); }} className={`flex-1 py-3 text-sm font-medium flex items-center justify-center gap-2 transition-colors ${useManual ? 'text-brand-blue border-b-2 border-brand-blue' : 'text-gray-400'}`}>
                <Keyboard className="w-4 h-4" /> Weka ID
              </button>
            </div>

            <div className="p-5">
              {!useManual ? (
                <>
                  {scanState === 'scanning' ? (
                    <div>
                      <div id="qr-reader" ref={scannerRef} className="w-full rounded-xl overflow-hidden" />
                      <button onClick={() => { stopScanner(); setScanState('idle'); }}
                        className="mt-4 w-full text-sm text-gray-500 border border-gray-200 py-2.5 rounded-xl hover:bg-gray-50">
                        Simamisha Scanner
                      </button>
                    </div>
                  ) : (
                    <div className="text-center py-4">
                      <div className="w-20 h-20 bg-brand-blue/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <QrCode className="w-10 h-10 text-brand-blue" />
                      </div>
                      <p className="text-gray-600 text-sm mb-5">Bonyeza kitufe hapa chini kufungua kamera na kuscan QR code ya mzigo</p>
                      <button onClick={startScanner} className="btn-primary w-full flex items-center justify-center gap-2 py-3.5">
                        <Scan className="w-5 h-5" /> Fungua Scanner
                      </button>
                    </div>
                  )}
                </>
              ) : (
                <div>
                  <p className="text-sm text-gray-600 mb-4">Weka Tracking ID ya mzigo hapa chini:</p>
                  <input
                    type="text"
                    value={manualId}
                    onChange={e => setManualId(e.target.value.toUpperCase())}
                    placeholder="SC-2026-0001"
                    className="input-field font-mono text-center text-lg tracking-widest mb-4"
                    onKeyDown={e => e.key === 'Enter' && processTrackingId(manualId)}
                  />
                  <button
                    onClick={() => processTrackingId(manualId)}
                    disabled={!manualId.trim()}
                    className="btn-primary w-full flex items-center justify-center gap-2 py-3.5"
                  >
                    <CheckCircle className="w-5 h-5" /> Thibitisha Mzigo
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Info */}
        <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 text-xs text-blue-700">
          <p className="font-semibold mb-1">Jinsi ya kufanya kazi:</p>
          <p>Scan QR code ya mzigo au weka Tracking ID. Status ya mzigo itabadilika kuwa <strong>{staffUser.status_to_assign}</strong> moja kwa moja.</p>
        </div>
      </div>
    </div>
  );
}
