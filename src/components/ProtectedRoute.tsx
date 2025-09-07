import { Navigate, useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';
import type { RoleRequirement, AppRole } from '@/types/auth';
import { getSessionAndRole } from '@/lib/auth/session';

interface ProtectedRouteProps {
  children: JSX.Element;
  requiredRole?: RoleRequirement;
  redirectUnauthedTo?: string;
  redirectForbiddenTo?: string;
}

export function ProtectedRoute({
  children,
  requiredRole,
  redirectUnauthedTo = '/auth',
  redirectForbiddenTo = '/forbidden',
}: ProtectedRouteProps) {
  const location = useLocation();
  const [state, setState] = useState<{
    ready: boolean;
    authed: boolean;
    role: AppRole | null;
  }>({ ready: false, authed: false, role: null });

  useEffect(() => {
    (async () => {
      try {
        const { session, role } = await getSessionAndRole();
        setState({ ready: true, authed: Boolean(session), role });
      } catch (error) {
        console.error('Error checking auth state:', error);
        setState({ ready: true, authed: false, role: null });
      }
    })();
  }, []);

  if (!state.ready) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // 1) Require authentication
  if (!state.authed) {
    return <Navigate to={redirectUnauthedTo} replace state={{ from: location }} />;
  }

  // 2) Check role requirements
  if (requiredRole) {
    const roles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
    if (!state.role || !roles.includes(state.role)) {
      return <Navigate to={redirectForbiddenTo} replace state={{ from: location }} />;
    }
  }

  return children;
}