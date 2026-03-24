import { createClient } from '@supabase/supabase-js';

// Server-side Supabase client with environment variables
// Uses process.env instead of import.meta.env for Node.js server
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://your-supabase-url.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.VITE_SUPABASE_ANON_KEY || 'your-public-anon-key';

export const supabase = createClient(supabaseUrl, supabaseKey);
