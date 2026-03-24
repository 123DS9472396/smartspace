import { User, Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

const DEMO_SESSION_KEY = 'demo.auth.session';
const LEGACY_SUPABASE_SESSION_KEY = 'supabase.auth.token';

// Create a User type that extends User from supabase
type DemoUser = {
  id: string;
  email: string;
  aud: string;
  role: string;
  app_metadata: { provider: string; };
  user_metadata: { name: string; user_type: string; };
  created_at: string;
  updated_at: string;
  phone: string | null;
  confirmed_at: string;
  email_confirmed_at: string;
  last_sign_in_at: string;
};

/**
 * Demo users for quick testing
 */
const DEMO_USERS: Record<string, DemoUser> = {
  // Warehouse Seeker User
  seeker: {
    id: '550e8400-e29b-41d4-a716-446655440001',
    email: 'demo.seeker@smartspace.com',
    aud: 'authenticated',
    role: 'authenticated',
    app_metadata: { provider: 'demo' },
    user_metadata: {
      name: 'Demo Seeker',
      user_type: 'seeker'
    },
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    phone: '+91 98765 43210',
    confirmed_at: new Date().toISOString(),
    email_confirmed_at: new Date().toISOString(),
    last_sign_in_at: new Date().toISOString(),
  },
  // Warehouse Owner User
  owner: {
    id: '550e8400-e29b-41d4-a716-446655440002',
    email: 'demo.owner@smartspace.com',
    aud: 'authenticated',
    role: 'authenticated',
    app_metadata: { provider: 'demo' },
    user_metadata: {
      name: 'Demo Owner',
      user_type: 'owner'
    },
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    phone: '+91 98765 43211',
    confirmed_at: new Date().toISOString(),
    email_confirmed_at: new Date().toISOString(),
    last_sign_in_at: new Date().toISOString(),
  },
  // Admin User
  admin: {
    id: '550e8400-e29b-41d4-a716-446655440003',
    email: 'demo.admin@smartspace.com',
    aud: 'authenticated',
    role: 'authenticated',
    app_metadata: { provider: 'demo' },
    user_metadata: {
      name: 'Demo Admin',
      user_type: 'admin'
    },
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    phone: '+91 98765 43212',
    confirmed_at: new Date().toISOString(),
    email_confirmed_at: new Date().toISOString(),
    last_sign_in_at: new Date().toISOString(),
  }
};

/**
 * Demo profiles for quick testing
 */
const DEMO_PROFILES = {
  seeker: {
    id: '550e8400-e29b-41d4-a716-446655440001',
    email: 'demo.seeker@smartspace.com',
    name: 'Demo Seeker',
    phone: '+91 98765 43210',
    company: 'Smart Logistics Inc',
    user_type: 'seeker',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  owner: {
    id: '550e8400-e29b-41d4-a716-446655440002',
    email: 'demo.owner@smartspace.com',
    name: 'Demo Owner',
    phone: '+91 98765 43211',
    company: 'Maharashtra Warehousing Ltd',
    user_type: 'owner',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  admin: {
    id: '550e8400-e29b-41d4-a716-446655440003',
    email: 'demo.admin@smartspace.com',
    name: 'Demo Admin',
    phone: '+91 98765 43212',
    company: 'SmartSpace Admin',
    user_type: 'admin',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
};

/**
 * Helper to create a demo session object
 */
function createDemoSession(userType: 'seeker' | 'owner' | 'admin'): Session {
  const user = DEMO_USERS[userType];
  
  return {
    access_token: `demo-token-${userType}-${Date.now()}`,
    token_type: 'bearer',
    expires_in: 3600,
    refresh_token: `demo-refresh-${userType}-${Date.now()}`,
    user: user as unknown as User,
    expires_at: Date.now() + 3600000
  };
}

/**
 * Simulates a demo login for easier testing
 */
export async function loginWithDemo(userType: 'seeker' | 'owner' | 'admin') {
  const demoSession = createDemoSession(userType);
  
  // Store in localStorage to persist the demo session (avoid Supabase auth storage)
  localStorage.setItem(
    DEMO_SESSION_KEY,
    JSON.stringify({
      session: demoSession,
      userType,
    })
  );
  
  // Return the demo user and session
  return {
    user: DEMO_USERS[userType] as unknown as User,
    session: demoSession,
    profile: DEMO_PROFILES[userType]
  };
}

/**
 * Try to sign in with Supabase first, fallback to demo login if it fails
 */
export async function signInWithFallback(email: string, password: string, userType: 'seeker' | 'owner' | 'admin' = 'seeker') {
  console.log('🔑 signInWithFallback called - VERSION 2.0');
  console.log('Email:', email);
  console.log('User Type:', userType);

  // ALWAYS use demo login for demo accounts - NO SUPABASE AUTH
  if (email.includes('demo.')) {
    console.log('🎭 DEMO ACCOUNT DETECTED - Using demo login immediately');
    const result = await loginWithDemo(userType);
    console.log('✅ Demo login successful:', result);
    return result;
  }

  try {
    // Try real Supabase auth first
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      console.log('Supabase auth failed, using demo login:', error.message);
      return loginWithDemo(userType);
    }

    return { user: data.user, session: data.session, profile: null };
  } catch (error) {
    console.error('Error in signInWithFallback:', error);
    return loginWithDemo(userType);
  }
}

/**
 * Sign out from both Supabase and demo login
 */
export async function signOutWithFallback() {
  // Clear demo login data
  localStorage.removeItem(DEMO_SESSION_KEY);
  // Clear legacy demo session if present
  localStorage.removeItem(LEGACY_SUPABASE_SESSION_KEY);
  
  // Also try to sign out from Supabase
  try {
    await supabase.auth.signOut();
  } catch (error) {
    console.error('Error signing out from Supabase:', error);
  }
  
  return { error: null };
}

/**
 * Check if current session is a demo session
 */
export function isDemoSession() {
  const token = localStorage.getItem(DEMO_SESSION_KEY);
  if (!token) return false;
  
  try {
    const parsed = JSON.parse(token);
    return parsed?.session?.access_token?.startsWith('demo-token');
  } catch (error) {
    return false;
  }
}

/**
 * Get current demo user type if using a demo session
 */
export function getCurrentDemoUserType(): 'seeker' | 'owner' | 'admin' | null {
  if (!isDemoSession()) return null;
  
  const token = localStorage.getItem(DEMO_SESSION_KEY);
  if (!token) return null;
  
  try {
    const parsed = JSON.parse(token);
    if (parsed?.userType) return parsed.userType;

    const accessToken = parsed?.session?.access_token;
    if (accessToken?.includes('-seeker-')) return 'seeker';
    if (accessToken?.includes('-owner-')) return 'owner';
    if (accessToken?.includes('-admin-')) return 'admin';
    
    return null;
  } catch (error) {
    return null;
  }
}

export function getStoredDemoSession(): { user: User; session: Session; profile: typeof DEMO_PROFILES[keyof typeof DEMO_PROFILES] } | null {
  const token = localStorage.getItem(DEMO_SESSION_KEY);
  if (!token) return null;

  try {
    const parsed = JSON.parse(token);
    const userType = (parsed?.userType as 'seeker' | 'owner' | 'admin') || getCurrentDemoUserType();
    if (!userType) return null;

    const session = parsed?.session as Session | undefined;
    if (!session) return null;

    return {
      user: DEMO_USERS[userType] as unknown as User,
      session,
      profile: DEMO_PROFILES[userType]
    };
  } catch (error) {
    return null;
  }
}

export function normalizeDemoSessionStorage() {
  const legacyToken = localStorage.getItem(LEGACY_SUPABASE_SESSION_KEY);
  if (!legacyToken) return;

  try {
    const parsed = JSON.parse(legacyToken);
    const accessToken = parsed?.currentSession?.access_token;
    if (!accessToken?.startsWith('demo-token')) return;

    let userType: 'seeker' | 'owner' | 'admin' | null = null;
    if (accessToken.includes('-seeker-')) userType = 'seeker';
    if (accessToken.includes('-owner-')) userType = 'owner';
    if (accessToken.includes('-admin-')) userType = 'admin';

    if (userType && parsed?.currentSession) {
      localStorage.setItem(
        DEMO_SESSION_KEY,
        JSON.stringify({
          session: parsed.currentSession,
          userType,
        })
      );
      localStorage.removeItem(LEGACY_SUPABASE_SESSION_KEY);
    }
  } catch (error) {
    // Ignore parse errors
  }
}
