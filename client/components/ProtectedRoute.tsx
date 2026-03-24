import { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
    children: ReactNode;
    allowedRoles?: ('seeker' | 'owner' | 'admin')[];
    redirectTo?: string;
}

/**
 * ProtectedRoute component - wraps routes that require authentication
 * Redirects to login if user is not authenticated
 * Optionally restricts access based on user role
 * 
 * CRITICAL: Checks authentication IMMEDIATELY to prevent unauthorized access
 */
export default function ProtectedRoute({
    children,
    allowedRoles,
    redirectTo = '/login',
}: ProtectedRouteProps) {
    const { user, profile, loading } = useAuth();
    const location = useLocation();

    console.log('🔐 ProtectedRoute check:', { 
        path: location.pathname, 
        loading, 
        hasUser: !!user, 
        userEmail: user?.email,
        profileType: profile?.user_type,
        allowedRoles 
    });

    // Show loading spinner only while initial auth check is happening
    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-warehouse">
                <div className="text-center">
                    <Loader2 className="h-12 w-12 animate-spin text-blue-500 mx-auto mb-4" />
                    <p className="text-slate-300 text-lg">Loading...</p>
                </div>
            </div>
        );
    }

    // CRITICAL: Check authentication IMMEDIATELY
    // Redirect to login if not authenticated
    if (!user) {
        console.log('🔒 ProtectedRoute: User not authenticated, redirecting to login');
        return (
            <Navigate
                to={redirectTo}
                state={{ from: location.pathname }}
                replace
            />
        );
    }

    // If user exists but no profile found, redirect to login to create profile
    if (!profile) {
        console.log('⚠️ ProtectedRoute: User authenticated but no profile found, redirecting to login');
        return (
            <Navigate
                to="/login"
                state={{ from: location.pathname, needsProfile: true }}
                replace
            />
        );
    }

    // Check role-based access if specified
    if (allowedRoles && profile) {
        if (!allowedRoles.includes(profile.user_type)) {
            console.log(`🔒 ProtectedRoute: User role '${profile.user_type}' not in allowed roles [${allowedRoles.join(', ')}]`);
            
            // Smart redirect based on user type instead of always going to login
            let smartRedirect = redirectTo;
            if (profile.user_type === 'seeker') {
                smartRedirect = '/seeker-hub';
            } else if (profile.user_type === 'owner') {
                smartRedirect = '/dashboard';
            } else if (profile.user_type === 'admin') {
                smartRedirect = '/admin-dashboard';
            }
            
            console.log(`🔀 Redirecting to: ${smartRedirect}`);
            return (
                <Navigate
                    to={smartRedirect}
                    replace
                />
            );
        }
    }

    // User is authenticated and has correct role - render protected content
    return <>{children}</>;
}
