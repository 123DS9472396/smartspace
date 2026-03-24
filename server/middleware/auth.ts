import { Request, Response, NextFunction } from 'express';
import { createClient } from '@supabase/supabase-js';

// Use environment variables for Supabase credentials
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://bsrzqffxgvdebyofmhzg.supabase.co';
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJzcnpxZmZ4Z3ZkZWJ5b2ZtaHpnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcwNjEzNDcsImV4cCI6MjA3MjYzNzM0N30.VyCEg70kLhTV2l8ZyG9CfPb00FBdVrlVBcBUhyI88Z8';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Extended Request type to include user info
export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
    userType?: 'seeker' | 'owner' | 'admin';
  };
}

/**
 * Middleware to verify authentication via Supabase JWT token
 * Extracts token from Authorization header and validates it
 */
export async function requireAuth(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Authentication required. Please sign in to access this resource.',
      });
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Verify the JWT token with Supabase
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Invalid or expired token. Please sign in again.',
      });
    }

    // Fetch user profile to get user_type
    const { data: profile } = await supabase
      .from('users')
      .select('user_type')
      .eq('id', user.id)
      .single();

    // Attach user info to request
    req.user = {
      id: user.id,
      email: user.email || '',
      role: user.role || 'authenticated',
      userType: profile?.user_type || 'seeker',
    };

    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    return res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to authenticate request',
    });
  }
}

/**
 * Middleware to verify user has specific role
 */
export function requireRole(...allowedRoles: string[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Authentication required',
      });
    }

    const userType = req.user.userType;
    if (!userType || !allowedRoles.includes(userType)) {
      return res.status(403).json({
        error: 'Forbidden',
        message: `Access denied. Required role: ${allowedRoles.join(' or ')}`,
      });
    }

    next();
  };
}

/**
 * Optional authentication - attaches user if token present, but doesn't block request
 */
export async function optionalAuth(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      // No token, continue without user
      return next();
    }

    const token = authHeader.substring(7);
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (!error && user) {
      const { data: profile } = await supabase
        .from('users')
        .select('user_type')
        .eq('id', user.id)
        .single();

      req.user = {
        id: user.id,
        email: user.email || '',
        role: user.role || 'authenticated',
        userType: profile?.user_type || 'seeker',
      };
    }

    next();
  } catch (error) {
    // On error, just continue without user
    next();
  }
}
