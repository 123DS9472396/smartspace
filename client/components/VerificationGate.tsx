/**
 * VerificationGate Component
 * Blocks access to features until profile is verified
 */

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { checkVerificationStatus } from '../services/verificationService';
import { ShieldX, ShieldCheck, Clock, AlertTriangle, ArrowRight } from 'lucide-react';
import { Button } from './ui/button';

interface VerificationGateProps {
    children: React.ReactNode;
    fallback?: React.ReactNode;
    requiredFor: 'booking' | 'listing';
}

export function VerificationGate({ children, fallback, requiredFor }: VerificationGateProps) {
    const { user, profile } = useAuth();
    const [verificationStatus, setVerificationStatus] = useState<string>('loading');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function checkStatus() {
            if (!user?.id || !profile?.user_type) {
                setVerificationStatus('no_profile');
                setLoading(false);
                return;
            }

            const userType = profile.user_type as 'seeker' | 'owner';

            // Check if this gate is relevant for the user type
            if (requiredFor === 'booking' && userType !== 'seeker') {
                // Owners don't need seeker verification for booking
                setVerificationStatus('verified');
                setLoading(false);
                return;
            }

            if (requiredFor === 'listing' && userType !== 'owner') {
                // Seekers don't need owner verification for listing
                setVerificationStatus('verified');
                setLoading(false);
                return;
            }

            try {
                const result = await checkVerificationStatus(user.id, userType);
                setVerificationStatus(result.status);
            } catch (error) {
                console.error('Error checking verification:', error);
                setVerificationStatus('error');
            } finally {
                setLoading(false);
            }
        }

        checkStatus();
    }, [user, profile, requiredFor]);

    if (loading) {
        return (
            <div className="flex items-center justify-center p-8">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    // If verified, show children
    if (verificationStatus === 'verified') {
        return <>{children}</>;
    }

    // Show custom fallback if provided
    if (fallback) {
        return <>{fallback}</>;
    }

    // Default blocking UI
    const profilePath = profile?.user_type === 'owner' ? '/owner-profile' : '/seeker-profile';
    const actionText = requiredFor === 'booking' ? 'book warehouses' : 'list warehouses';

    return (
        <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-xl p-8 max-w-lg mx-auto">
            <div className="text-center">
                {verificationStatus === 'pending' && (
                    <>
                        <div className="bg-yellow-500/20 p-4 rounded-full w-20 h-20 mx-auto mb-4 flex items-center justify-center">
                            <Clock className="w-10 h-10 text-yellow-400" />
                        </div>
                        <h2 className="text-2xl font-bold text-white mb-2">Profile Not Yet Submitted</h2>
                        <p className="text-slate-300 mb-6">
                            You need to complete and submit your profile for verification before you can {actionText}.
                        </p>
                        <Button asChild className="bg-blue-600 hover:bg-blue-700">
                            <Link to={profilePath}>
                                Complete Your Profile
                                <ArrowRight className="w-4 h-4 ml-2" />
                            </Link>
                        </Button>
                    </>
                )}

                {verificationStatus === 'submitted' && (
                    <>
                        <div className="bg-blue-500/20 p-4 rounded-full w-20 h-20 mx-auto mb-4 flex items-center justify-center">
                            <ShieldCheck className="w-10 h-10 text-blue-400" />
                        </div>
                        <h2 className="text-2xl font-bold text-white mb-2">Verification In Progress</h2>
                        <p className="text-slate-300 mb-6">
                            Your profile is currently being reviewed by our team. This usually takes 1-2 business days.
                            You'll be able to {actionText} once approved.
                        </p>
                        <div className="flex items-center justify-center gap-2 text-slate-400">
                            <Clock className="w-4 h-4" />
                            <span>Estimated wait: 24-48 hours</span>
                        </div>
                    </>
                )}

                {verificationStatus === 'rejected' && (
                    <>
                        <div className="bg-red-500/20 p-4 rounded-full w-20 h-20 mx-auto mb-4 flex items-center justify-center">
                            <ShieldX className="w-10 h-10 text-red-400" />
                        </div>
                        <h2 className="text-2xl font-bold text-white mb-2">Verification Failed</h2>
                        <p className="text-slate-300 mb-6">
                            Your profile verification was not approved. Please review and update your information,
                            then submit again for verification.
                        </p>
                        <Button asChild className="bg-red-600 hover:bg-red-700">
                            <Link to={profilePath}>
                                Update Profile
                                <ArrowRight className="w-4 h-4 ml-2" />
                            </Link>
                        </Button>
                    </>
                )}

                {verificationStatus === 'no_profile' && (
                    <>
                        <div className="bg-slate-500/20 p-4 rounded-full w-20 h-20 mx-auto mb-4 flex items-center justify-center">
                            <AlertTriangle className="w-10 h-10 text-slate-400" />
                        </div>
                        <h2 className="text-2xl font-bold text-white mb-2">Profile Required</h2>
                        <p className="text-slate-300 mb-6">
                            You need to create and verify your profile before you can {actionText}.
                        </p>
                        <Button asChild className="bg-blue-600 hover:bg-blue-700">
                            <Link to={profilePath}>
                                Create Profile
                                <ArrowRight className="w-4 h-4 ml-2" />
                            </Link>
                        </Button>
                    </>
                )}

                {verificationStatus === 'error' && (
                    <>
                        <div className="bg-red-500/20 p-4 rounded-full w-20 h-20 mx-auto mb-4 flex items-center justify-center">
                            <AlertTriangle className="w-10 h-10 text-red-400" />
                        </div>
                        <h2 className="text-2xl font-bold text-white mb-2">Something Went Wrong</h2>
                        <p className="text-slate-300 mb-6">
                            We couldn't verify your profile status. Please try again later.
                        </p>
                    </>
                )}
            </div>
        </div>
    );
}

/**
 * Hook to check verification status
 */
export function useVerificationStatus() {
    const { user, profile } = useAuth();
    const [status, setStatus] = useState<{
        isVerified: boolean;
        status: string;
        loading: boolean;
    }>({
        isVerified: false,
        status: 'loading',
        loading: true
    });

    useEffect(() => {
        async function check() {
            if (!user?.id || !profile?.user_type) {
                setStatus({ isVerified: false, status: 'no_profile', loading: false });
                return;
            }

            try {
                const result = await checkVerificationStatus(
                    user.id,
                    profile.user_type as 'seeker' | 'owner'
                );
                setStatus({
                    isVerified: result.isVerified,
                    status: result.status,
                    loading: false
                });
            } catch (error) {
                setStatus({ isVerified: false, status: 'error', loading: false });
            }
        }

        check();
    }, [user, profile]);

    return status;
}
