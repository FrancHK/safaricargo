import { BrowserRouter, Routes, Route, Outlet } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import ProtectedRoute from './components/ProtectedRoute';
import Home from './pages/Home';
import Track from './pages/Track';
import Booking from './pages/Booking';
import AdminLogin from './pages/AdminLogin';
import AdminDashboard from './pages/AdminDashboard';
import AdminCustomers from './pages/AdminCustomers';
import AdminStaff from './pages/AdminStaff';
import AdminVehicles from './pages/AdminVehicles';
import AdminSettings from './pages/AdminSettings';
import AdminBranches from './pages/AdminBranches';
import StaffPortal from './pages/StaffPortal';
import MapokeziPortal from './pages/MapokeziPortal';
import PrintLabel from './pages/PrintLabel';

function PublicLayout() {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-1"><Outlet /></main>
      <Footer />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Admin routes */}
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/admin/dashboard" element={<ProtectedRoute adminOnly><AdminDashboard /></ProtectedRoute>} />
          <Route path="/admin/customers" element={<ProtectedRoute><AdminCustomers /></ProtectedRoute>} />
          <Route path="/admin/staff" element={<ProtectedRoute adminOnly><AdminStaff /></ProtectedRoute>} />
          <Route path="/admin/vehicles" element={<ProtectedRoute><AdminVehicles /></ProtectedRoute>} />
          <Route path="/admin/settings" element={<ProtectedRoute adminOnly><AdminSettings /></ProtectedRoute>} />
          <Route path="/admin/branches" element={<ProtectedRoute adminOnly><AdminBranches /></ProtectedRoute>} />
          <Route path="/admin/print" element={<ProtectedRoute><PrintLabel /></ProtectedRoute>} />

          {/* Staff & Mapokezi portals */}
          <Route path="/staff" element={<StaffPortal />} />
          <Route path="/mapokezi" element={<MapokeziPortal />} />

          {/* Public routes */}
          <Route element={<PublicLayout />}>
            <Route path="/" element={<Home />} />
            <Route path="/track" element={<Track />} />
            <Route path="/book" element={<Booking />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
