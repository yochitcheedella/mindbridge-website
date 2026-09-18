import React, { useState, useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { getCurrentUser, getUserProfile, syncProfileToLocalAuth } from '../../utils/supabaseAuth';
import { getAuth, type UserRole } from '../../utils/auth';

interface ProtectedRouteProps {
  allowedRoles: string[];
  children: React.ReactNode;
}

/**
 * Route guard component verifying that the user is authenticated with Supabase
 * and holds one of the authorized roles from public.profiles.
 */
export function ProtectedRoute({ allowedRoles, children }: ProtectedRouteProps) {
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);
  const location = useLocation();

  useEffect(() => {
    let isMounted = true;

    async function checkUser() {
      try {
        // 1. Check Supabase Auth
        const user = await getCurrentUser();
        const localAuth = getAuth();

        if (!user && !localAuth?.access_token) {
          if (isMounted) {
            setAuthorized(false);
            setLoading(false);
          }
          return;
        }

        // 2. Resolve Role from public.profiles or synced local session
        let role: string | undefined = localAuth?.role;
        if (user) {
          const profile = await getUserProfile(user.id);
          if (profile?.role) {
            role = profile.role;
            syncProfileToLocalAuth(profile);
          }
        }

        // Normalize psychologist / counsellor
        if (role === 'counsellor') role = 'psychologist';

        if (role && (allowedRoles.includes(role) || (role === 'super_admin' && allowedRoles.includes('admin')))) {
          if (isMounted) setAuthorized(true);
        } else {
          if (isMounted) setAuthorized(false);
        }
      } catch (err) {
        console.error('Error in ProtectedRoute checkUser:', err);
        if (isMounted) setAuthorized(false);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    checkUser();
    return () => {
      isMounted = false;
    };
  }, [allowedRoles, location.pathname]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FFFFFF] flex flex-col items-center justify-center p-4">
        <div className="w-10 h-10 border-4 border-[#111111] border-t-[#F4C542] rounded-full animate-spin mb-4" />
        <p className="font-heading font-black text-sm text-[#111111]">Verifying Security Credentials...</p>
      </div>
    );
  }

  if (!authorized) {
    const targetRole = allowedRoles[0] || 'student';
    return <Navigate to={`/login?role=${targetRole}&redirect=${encodeURIComponent(location.pathname)}`} replace />;
  }

  return <>{children}</>;
}

export default ProtectedRoute;
