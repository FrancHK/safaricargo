import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Package, MapPin, Shield, Clock, Truck, ArrowRight, CheckCircle, ClipboardEdit, Warehouse, PackageCheck } from 'lucide-react';

export default function Home() {
  const [trackingId, setTrackingId] = useState('');
  const navigate = useNavigate();

  function handleTrack(e: React.FormEvent) {
    e.preventDefault();
    const id = trackingId.trim();
    if (id) navigate(`/track?id=${encodeURIComponent(id.toUpperCase())}`);
  }

  const features = [
    {
      icon: <MapPin className="w-6 h-6 text-brand-blue" />,
      title: 'Real-Time Tracking',
      desc: 'Track your cargo with live status updates from pickup to delivery.'
    },
    {
      icon: <Truck className="w-6 h-6 text-brand-blue" />,
      title: 'Fast Delivery',
      desc: 'Express and standard delivery options for all cargo types across East Africa.'
    },
    {
      icon: <Shield className="w-6 h-6 text-brand-blue" />,
      title: 'Secure Handling',
      desc: 'Your cargo is insured and handled with the utmost care by our trained team.'
    },
    {
      icon: <Clock className="w-6 h-6 text-brand-blue" />,
      title: '24/7 Support',
      desc: 'Our customer support team is always available to assist you.'
    }
  ];

  const steps = [
    { num: '01', title: 'Book Your Cargo', desc: 'Fill in the booking form with shipment details and destination.', Icon: ClipboardEdit, gradient: 'linear-gradient(135deg, #38bdf8 0%, #3b82f6 100%)', glow: 'rgba(59, 130, 246, 0.5)' },
    { num: '02', title: 'Drop Off or Pickup', desc: 'Drop your cargo at our warehouse or schedule a pickup.', Icon: Warehouse, gradient: 'linear-gradient(135deg, #a78bfa 0%, #6366f1 100%)', glow: 'rgba(99, 102, 241, 0.5)' },
    { num: '03', title: 'We Handle Transit', desc: 'Your cargo is processed, sorted, and shipped to the destination.', Icon: Truck, gradient: 'linear-gradient(135deg, #fbbf24 0%, #f97316 100%)', glow: 'rgba(249, 115, 22, 0.5)' },
    { num: '04', title: 'Delivered Safely', desc: 'Receive your cargo safely at the destination address.', Icon: PackageCheck, gradient: 'linear-gradient(135deg, #34d399 0%, #10b981 100%)', glow: 'rgba(16, 185, 129, 0.5)' }
  ];

  const stats = [
    { value: '1,200+', label: 'Deliveries Completed' },
    { value: '50+', label: 'Destinations Covered' },
    { value: '99.2%', label: 'On-Time Rate' },
    { value: '5,000+', label: 'Happy Customers' }
  ];

  return (
    <div>
      {/* Hero Section — full viewport */}
      <section className="relative min-h-[calc(100vh-64px)] flex items-center overflow-hidden bg-[#0f1f5c]">

        {/* Cargo trucks background */}
        <div className="absolute inset-0">
          <img
            src="/carcargo.jpg"
            alt="SafiriCargo fleet of cargo trucks"
            className="w-full h-full object-cover object-center"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-[#0f1f5c]/92 via-[#0f1f5c]/85 to-[#0a1628]/96" />
        </div>

        {/* Animated background grid */}
        <div className="absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)',
            backgroundSize: '60px 60px'
          }}
        />

        {/* Glowing blobs */}
        <div className="absolute top-[-80px] right-[-80px] w-[500px] h-[500px] rounded-full bg-brand-green opacity-10 blur-[120px] pointer-events-none" />
        <div className="absolute bottom-[-100px] left-[-60px] w-[400px] h-[400px] rounded-full bg-blue-400 opacity-10 blur-[100px] pointer-events-none" />

        {/* Floating package icons */}
        <div className="absolute top-16 left-8 opacity-10 hidden lg:block">
          <Package className="w-20 h-20 text-white" strokeWidth={1} />
        </div>
        <div className="absolute bottom-16 right-10 opacity-10 hidden lg:block">
          <Truck className="w-24 h-24 text-white" strokeWidth={1} />
        </div>

        <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          {/* Glassmorphism panel */}
          <div className="max-w-3xl mx-auto text-center bg-white/[0.07] backdrop-blur-2xl border border-white/15 rounded-[2rem] px-6 sm:px-10 lg:px-14 py-12 sm:py-14 shadow-2xl shadow-black/30">

            {/* Badge */}
            <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 backdrop-blur-sm rounded-full px-5 py-2 text-sm font-medium text-white mb-8">
              <span className="w-2 h-2 bg-brand-green rounded-full animate-pulse" />
              East Africa's Trusted Cargo Partner
            </div>

            {/* Headline */}
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold leading-[1.05] tracking-tight text-white mb-6">
              Your Cargo,
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-green to-emerald-300">
                Our Commitment
              </span>
            </h1>

            <p className="text-blue-200 text-lg lg:text-xl mb-12 leading-relaxed max-w-xl mx-auto">
              Fast, reliable, and secure cargo delivery across East Africa.
              Track your shipment in real-time with SafiriCargo.
            </p>

            {/* Tracking Form */}
            <form onSubmit={handleTrack} className="max-w-2xl mx-auto mb-5">
              <div className="flex flex-col sm:flex-row gap-3 bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-2 shadow-2xl">
                <div className="flex items-center gap-3 flex-1 bg-white rounded-xl px-4 py-3.5">
                  <Search className="w-5 h-5 text-gray-400 flex-shrink-0" />
                  <input
                    type="text"
                    placeholder="Enter Tracking ID  —  e.g. SC-2026-0001"
                    value={trackingId}
                    onChange={e => setTrackingId(e.target.value)}
                    className="flex-1 text-gray-900 text-sm outline-none bg-transparent placeholder-gray-400 font-medium"
                  />
                </div>
                <button
                  type="submit"
                  className="bg-brand-green hover:bg-brand-green-dark text-white font-bold px-8 py-3.5 rounded-xl transition-all duration-200 text-sm whitespace-nowrap shadow-lg shadow-green-900/30 hover:shadow-green-900/50 hover:scale-[1.02] active:scale-100"
                >
                  Track Now →
                </button>
              </div>
            </form>

            {/* Trust indicators */}
            <div className="flex items-center justify-center gap-6 mt-14 flex-wrap">
              {[
                { icon: <Shield className="w-4 h-4" />, label: 'Insured Cargo' },
                { icon: <Clock className="w-4 h-4" />, label: '24/7 Support' },
                { icon: <CheckCircle className="w-4 h-4" />, label: '99.2% On-Time' },
              ].map(item => (
                <div key={item.label} className="flex items-center gap-2 text-blue-300 text-sm">
                  <span className="text-brand-green">{item.icon}</span>
                  {item.label}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Stats + Features — combined full screen section */}
      <section className="relative min-h-screen flex flex-col justify-center bg-[#0a1628] overflow-hidden py-20">

        {/* Background decoration */}
        <div className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)',
            backgroundSize: '40px 40px'
          }}
        />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-brand-blue opacity-20 blur-[120px] rounded-full pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-brand-green opacity-10 blur-[100px] rounded-full pointer-events-none" />

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">

          {/* Section heading */}
          <div className="text-center mb-16">
            <span className="inline-block text-brand-green text-sm font-semibold tracking-widest uppercase mb-3">
              Why SafiriCargo
            </span>
            <h2 className="text-4xl sm:text-5xl font-extrabold text-white mb-4 leading-tight">
              Built for East Africa's
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-green to-emerald-300">
                Cargo Needs
              </span>
            </h2>
            <p className="text-gray-400 max-w-lg mx-auto text-lg">
              We combine technology with logistics expertise to deliver your cargo safely and on time.
            </p>
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-16">
            {stats.map((s, i) => (
              <div key={s.label}
                className="relative bg-white/5 border border-white/10 rounded-2xl p-6 text-center hover:bg-white/10 transition-all duration-300 group overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-brand-green/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl" />
                <div className="relative z-10">
                  <div className="text-4xl sm:text-5xl font-black text-white mb-1 tracking-tight">
                    {s.value}
                  </div>
                  <div className="text-gray-400 text-sm font-medium">{s.label}</div>
                  <div className="w-8 h-0.5 bg-brand-green mx-auto mt-3 rounded-full group-hover:w-16 transition-all duration-300" />
                </div>
              </div>
            ))}
          </div>

          {/* Features grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {features.map((f, i) => (
              <div key={f.title}
                className="group relative bg-white/5 border border-white/10 rounded-2xl p-6 hover:border-brand-green/40 hover:bg-white/10 transition-all duration-300 cursor-default overflow-hidden"
              >
                {/* Hover glow */}
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-brand-green to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                {/* Icon */}
                <div className="w-14 h-14 rounded-2xl bg-brand-blue/30 border border-brand-blue/30 flex items-center justify-center mb-5 group-hover:bg-brand-green/20 group-hover:border-brand-green/30 transition-all duration-300">
                  <span className="text-brand-blue group-hover:text-brand-green transition-colors duration-300">
                    {f.icon}
                  </span>
                </div>

                <h3 className="text-white font-bold text-lg mb-2 group-hover:text-brand-green transition-colors duration-300">
                  {f.title}
                </h3>
                <p className="text-gray-400 text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="min-h-screen flex items-center py-20 bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
          {/* Header */}
          <div className="text-center mb-14">
            <span className="inline-block px-4 py-1.5 rounded-full bg-brand-blue/10 text-brand-blue text-xs font-semibold tracking-widest uppercase mb-4">
              Process
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-3">How It Works</h2>
            <p className="text-gray-600 max-w-xl mx-auto">Simple steps to get your cargo delivered safely and on time.</p>
          </div>

          {/* Grid of cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {steps.map((step) => {
              const Icon = step.Icon;
              return (
                <div
                  key={step.num}
                  className="group relative bg-white rounded-2xl p-7 border border-gray-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
                >
                  {/* Step number watermark */}
                  <span className="absolute top-4 right-5 text-5xl font-bold text-gray-100 group-hover:text-gray-200 transition-colors select-none">
                    {step.num}
                  </span>

                  {/* Icon badge */}
                  <div
                    className="relative w-14 h-14 rounded-xl flex items-center justify-center mb-5 shadow-md"
                    style={{ background: step.gradient }}
                  >
                    <Icon className="w-7 h-7 text-white" strokeWidth={2} />
                  </div>

                  <h3 className="font-semibold text-gray-900 text-lg mb-2">{step.title}</h3>
                  <p className="text-sm text-gray-600 leading-relaxed">{step.desc}</p>

                  {/* Bottom accent bar */}
                  <div
                    className="absolute bottom-0 left-0 h-1 w-0 group-hover:w-full transition-all duration-500 rounded-b-2xl"
                    style={{ background: step.gradient }}
                  />
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative py-24 overflow-hidden bg-gradient-to-br from-[#0a1747] via-brand-blue to-[#1a2d7a]">
        {/* Decorative grid */}
        <div className="absolute inset-0 opacity-[0.07] pointer-events-none"
          style={{
            backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)',
            backgroundSize: '50px 50px'
          }}
        />
        {/* Glow accents */}
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-brand-green/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-blue-400/20 rounded-full blur-3xl pointer-events-none" />

        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="relative rounded-3xl overflow-hidden bg-white/[0.04] backdrop-blur-sm border border-white/10 p-8 sm:p-12 lg:p-16">
            {/* Top accent line */}
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-brand-green to-transparent" />

            <div className="grid grid-cols-1 lg:grid-cols-5 gap-10 items-center">
              {/* Left: content */}
              <div className="lg:col-span-3 text-center lg:text-left">
                <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-green/15 border border-brand-green/30 text-brand-green-light text-xs font-semibold tracking-widest uppercase mb-5">
                  <span className="w-1.5 h-1.5 rounded-full bg-brand-green animate-pulse" />
                  Start Shipping
                </span>

                <h2 className="text-4xl sm:text-5xl font-bold text-white mb-4 leading-tight">
                  Ready to <span className="bg-gradient-to-r from-brand-green-light to-emerald-300 bg-clip-text text-transparent">Ship?</span>
                </h2>
                <p className="text-blue-100/80 text-lg leading-relaxed mb-8 max-w-xl mx-auto lg:mx-0">
                  Book your cargo today and experience fast, reliable delivery across East Africa — tracked every step of the way.
                </p>

                <div className="flex flex-col sm:flex-row gap-3 justify-center lg:justify-start">
                  <a href="/track" className="bg-white/10 border border-white/20 hover:bg-white/15 hover:border-white/30 text-white font-semibold px-7 py-3.5 rounded-xl transition-all inline-flex items-center gap-2 justify-center backdrop-blur-sm">
                    <Search className="w-4 h-4" />
                    Track Shipment
                  </a>
                </div>

                {/* Trust row */}
                <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-2 justify-center lg:justify-start text-sm text-blue-100/70">
                  <span className="inline-flex items-center gap-1.5"><CheckCircle className="w-4 h-4 text-brand-green-light" /> Insured</span>
                  <span className="inline-flex items-center gap-1.5"><CheckCircle className="w-4 h-4 text-brand-green-light" /> Real-time tracking</span>
                  <span className="inline-flex items-center gap-1.5"><CheckCircle className="w-4 h-4 text-brand-green-light" /> 24/7 support</span>
                </div>
              </div>

              {/* Right: visual */}
              <div className="lg:col-span-2 relative hidden lg:flex items-center justify-center">
                <div className="relative w-full max-w-sm aspect-square">
                  {/* Outer ring */}
                  <div className="absolute inset-0 rounded-full border border-white/10" />
                  <div className="absolute inset-6 rounded-full border border-white/10" />
                  <div className="absolute inset-12 rounded-full border border-brand-green/20" />

                  {/* Center icon */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-32 h-32 rounded-3xl bg-gradient-to-br from-brand-green to-brand-green-dark shadow-2xl shadow-brand-green/40 flex items-center justify-center rotate-6 hover:rotate-0 transition-transform duration-500">
                      <Package className="w-16 h-16 text-white" strokeWidth={1.5} />
                    </div>
                  </div>

                  {/* Floating mini badges */}
                  <div className="absolute top-4 right-4 bg-white/10 backdrop-blur-md border border-white/20 rounded-xl px-3 py-2 flex items-center gap-2 shadow-lg">
                    <Truck className="w-4 h-4 text-brand-green-light" />
                    <span className="text-xs font-semibold text-white">In Transit</span>
                  </div>
                  <div className="absolute bottom-8 left-0 bg-white/10 backdrop-blur-md border border-white/20 rounded-xl px-3 py-2 flex items-center gap-2 shadow-lg">
                    <MapPin className="w-4 h-4 text-brand-green-light" />
                    <span className="text-xs font-semibold text-white">East Africa</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
