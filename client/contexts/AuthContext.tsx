import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session, AuthError } from '@supabase/supabase-js';
import { supabase } from '../services/supabaseClient';
import { getStoredDemoSession, isDemoSession, normalizeDemoSessionStorage } from '../services/demoAuth';

interface UserProfile {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  user_type: 'owner' | 'seeker' | 'admin';
  seeker_type?: 'farmer' | 'wholesaler' | 'quick_commerce' | 'msme' | 'industrial' | null;
  company_name?: string | null;
  city?: string | null;
  state?: string | null;
  created_at?: string;
  updated_at?: string;
  is_verified?: boolean;
}

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  session: Session | null;
  loading: boolean;
  signUp: (email: string, password: string, userData: {
    name: string;
    phone: string;
    company: string;
    user_type: 'owner' | 'seeker';
  }) => Promise<{ error: AuthError | null }>;
  signIn: (email: string, password: string) => Promise<{ error: AuthError | null; data?: { user: User } }>;
  signOut: () => Promise<{ error: AuthError | null }>;
  resetPassword: (email: string) => Promise<{ error: AuthError | null }>;
  resendVerification: (email: string) => Promise<{ error: AuthError | null }>;
  updateProfile: (updates: Partial<UserProfile>) => Promise<{ error: Error | null }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log('🔐 AuthContext: Initializing auth state...');
    
    // Get initial session with timeout protection
    const initAuth = async () => {
      try {
        normalizeDemoSessionStorage();

        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('❌ AuthContext: Error getting session:', error);
        }
        
        setSession(session);
        setUser(session?.user ?? null);

        if (session?.user) {
          console.log('✅ AuthContext: User found, loading profile...');
          
          // Load profile with timeout protection
          try {
            await Promise.race([
              loadUserProfile(session.user.id),
              new Promise((_, reject) => 
                setTimeout(() => reject(new Error('Profile load timeout')), 5000)
              )
            ]);
          } catch (profileError) {
            console.error('⚠️ Profile load failed or timed out:', profileError);
            // Continue anyway - app can work without profile in some cases
          }
        } else {
          console.log('ℹ️ AuthContext: No active session');

          const path = window.location.pathname;
          const hash = window.location.hash;
          const isRecoveryRoute = path === '/reset-password' || path === '/forgot-password';
          const hasRecoveryHash = hash.includes('type=recovery') || hash.includes('error=');

          if (!isRecoveryRoute && !hasRecoveryHash && isDemoSession()) {
            const demo = getStoredDemoSession();
            if (demo) {
              setSession(demo.session);
              setUser(demo.user);
              setProfile(demo.profile as UserProfile);
              console.log('✅ AuthContext: Demo session restored');
            }
          }
        }
      } catch (error) {
        console.error('❌ AuthContext: Exception in getSession:', error);
      } finally {
        setLoading(false);
        console.log('✅ AuthContext: Initial auth check complete');
      }
    };
    
    initAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);

        if (session?.user) {
          const userId = session.user.id;
          setTimeout(() => {
            loadUserProfile(userId).catch(() => {}).finally(() => setLoading(false));
          }, 0);
        } else {
          setProfile(null);
          setLoading(false);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const loadUserProfile = async (userId: string) => {
    try {
      console.log('📋 Loading profile for user:', userId);
      
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (error) {
        console.error('Error loading user profile:', error);
        return;
      }

      if (!data) {
        const { data: authData } = await supabase.auth.getUser();
        const authUser = authData.user;
        if (!authUser) {
          return;
        }

        const { error: insertError } = await supabase
          .from('profiles')
          .insert({
            user_id: authUser.id,
            email: authUser.email ?? '',
            name: (authUser.user_metadata?.name as string) || '',
            phone: (authUser.user_metadata?.phone as string) || null,
            user_type: (authUser.user_metadata?.user_type as 'owner' | 'seeker' | 'admin') || 'seeker',
            seeker_type: (authUser.user_metadata?.seeker_type as any) || null,
            company_name: (authUser.user_metadata?.company as string) || null,
            city: (authUser.user_metadata?.location as string) || null,
          });

        if (insertError) {
          console.error('Error creating profile from auth metadata:', insertError);
          return;
        }

        const { data: refreshedProfile, error: refreshError } = await supabase
          .from('profiles')
          .select('*')
          .eq('user_id', userId)
          .maybeSingle();

        if (refreshError) {
          console.error('❌ Error reloading profile:', refreshError);
          return;
        }

        if (refreshedProfile) {
          setProfile(refreshedProfile);
        }
        return;
      }

      console.log('✅ Profile loaded:', data?.user_type);
      setProfile(data);
    } catch (error) {
      console.error('❌ Exception loading user profile:', error);
    }
  };

  const signUp = async (
    email: string,
    password: string,
    userData: {
      name: string;
      phone: string;
      company: string;
      user_type: 'owner' | 'seeker';
      seeker_type?: 'farmer' | 'wholesaler' | 'quick_commerce' | 'msme' | 'industrial';
      location?: string;
    }
  ) => {
    try {
      // First, sign up the user with Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            user_type: userData.user_type,
            name: userData.name,
            phone: userData.phone,
            seeker_type: userData.seeker_type,
            company: userData.company || '',
            location: userData.location || '',
          },
        },
      });

      if (authError) {
        return { error: authError };
      }

      // Profile creation is handled by the DB trigger on auth.users
      // Avoid client-side insert to prevent RLS failures.

      return { error: null };
    } catch (error) {
      return { error: error as AuthError };
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      // Demo logins only
      if (email.includes('demo.')) {
        const { signInWithFallback } = await import('../services/demoAuth');
        let userType: 'seeker' | 'owner' | 'admin' = 'seeker';
        if (email.includes('owner')) userType = 'owner';
        if (email.includes('admin')) userType = 'admin';

        const { user, session, profile } = await signInWithFallback(email, password, userType);
        if (user) {
          setUser(user);
          setSession(session);
          if (profile) {
            console.log('✅ Setting profile from demo auth:', profile);
            setProfile(profile as UserProfile);
          } else {
            console.log('📋 No profile from demo auth, loading from DB...');
            await loadUserProfile(user.id);
          }
          return { error: null, data: { user } };
        }
        return { error: { message: 'Demo login failed.' } as any };
      }

      // Real Supabase auth only (no fallback)
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error || !data.user) {
        const message = error?.message?.includes('Invalid login credentials')
          ? 'Invalid login credentials or email not confirmed. Please verify your email before logging in.'
          : (error?.message || 'Authentication failed.');
        return { error: { message } as any };
      }

      setUser(data.user);
      setSession(data.session);
      await loadUserProfile(data.user.id);

      return { error: null, data: { user: data.user } };
    } catch (error) {
      console.error('Sign in error:', error);
      return { error: { message: 'Authentication failed. Please try again.' } as any };
    }
  };

  const signOut = async () => {
    try {
      // Import dynamically to avoid circular dependencies
      const { signOutWithFallback } = await import('../services/demoAuth');
      await signOutWithFallback();

      setUser(null);
      setSession(null);
      setProfile(null);

      // Force navigation to home page
      window.location.href = '/';

      return { error: null };
    } catch (error) {
      console.error('Sign out error:', error);
      return { error: { message: 'Sign out failed. Please try again.' } as any };
    }
  };

  const resetPassword = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    return { error };
  };

  const resendVerification = async (email: string) => {
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email,
    });
    return { error };
  };

  const updateProfile = async (updates: Partial<UserProfile>) => {
    if (!user) {
      return { error: new Error('No user logged in') };
    }

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', user.id);

      if (error) {
        return { error };
      }

      // Reload the profile
      await loadUserProfile(user.id);
      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  };

  const value: AuthContextType = {
    user,
    profile,
    session,
    loading,
    signUp,
    signIn,
    signOut,
    resetPassword,
    resendVerification,
    updateProfile,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
