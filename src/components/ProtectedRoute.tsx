import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

interface Props {
  children: React.ReactNode;
  adminOnly?: boolean;
}

export default function ProtectedRoute({ children, adminOnly = false }: Props) {
  const { isAuthenticated } = useAuth();
  const hasMapokezi = typeof window !== 'undefined' && !!localStorage.getItem('sc_mapokezi_token');

  if (adminOnly) {
    return isAuthenticated ? <>{children}</> : <Navigate to="/admin/login" replace />;
  }
  return (isAuthenticated || hasMapokezi) ? <>{children}</> : <Navigate to="/admin/login" replace />;
}
