import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Plus, Truck, X, Users, Settings, Building2,
  LayoutDashboard, Menu, LogOut, ChevronsLeft, ChevronsRight,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface MapokeziUser {
  id: string;
  name: string;
  email: string;
  department: string;
  station?: string;
  employee_id?: string;
}

interface DashboardLayoutProps {
  children: React.ReactNode;
  /** Page title shown in the mobile top bar. */
  title?: string;
  /** Force a role; otherwise auto-detected from the stored token. */
  role?: 'admin' | 'mapokezi';
  /** When provided, shows the "New Shipment" action in the sidebar. */
  onNewShipment?: () => void;
}

export default function DashboardLayout({ children, title = 'Dashboard', role, onNewShipment }: DashboardLayoutProps) {
  const auth = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const resolvedRole: 'admin' | 'mapokezi' =
    role ?? (localStorage.getItem('sc_mapokezi_token') ? 'mapokezi' : 'admin');
  const isAdmin = resolvedRole === 'admin';

  const mapokeziUser: MapokeziUser | null = isAdmin
    ? null
    : (() => {
        try {
          const raw = localStorage.getItem('sc_mapokezi');
          return raw && raw !== 'undefined' ? JSON.parse(raw) : null;
        } catch { return null; }
      })();

  const displayName = isAdmin ? auth.admin?.username : mapokeziUser?.name;
  const displayRole = isAdmin ? 'Administrator' : 'Mapokezi';

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

  function handleLogout() {
    if (isAdmin) {
      auth.logout();
    } else {
      localStorage.removeItem('sc_mapokezi_token');
      localStorage.removeItem('sc_mapokezi');
    }
    navigate('/admin/login');
  }

  const dashPath = isAdmin ? '/admin/dashboard' : '/mapokezi';
  const allNavItems = [
    { label: 'Dashboard', icon: LayoutDashboard, path: dashPath, roles: ['admin', 'mapokezi'] },
    { label: 'Wateja', icon: Users, path: '/admin/customers', roles: ['admin', 'mapokezi'] },
    { label: 'Wafanyakazi', icon: Users, path: '/admin/staff', roles: ['admin'] },
    { label: 'Matawi', icon: Building2, path: '/admin/branches', roles: ['admin'] },
    { label: 'Magali', icon: Truck, path: '/admin/vehicles', roles: ['admin', 'mapokezi'] },
    { label: 'Settings', icon: Settings, path: '/admin/settings', roles: ['admin'] },
  ];
  const navItems = allNavItems
    .filter(item => item.roles.includes(resolvedRole))
    .map(item => ({ ...item, active: location.pathname === item.path }));

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

          {/* Primary action */}
          {onNewShipment && (
            <div className="pt-4 mt-4 border-t border-white/10">
              {!sidebarCollapsed && (
                <p className="px-3 mb-2 text-[10px] font-semibold text-blue-200/50 uppercase tracking-widest">Actions</p>
              )}
              <button
                onClick={() => { onNewShipment(); setSidebarOpen(false); }}
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
          <h1 className="font-bold text-gray-900">{title}</h1>
        </div>

        {children}
      </div>
    </div>
  );
}
