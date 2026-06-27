import { createClient } from '@supabase/supabase-js';

const envUrl = import.meta.env.VITE_SUPABASE_URL;
const envKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

const localUrl = localStorage.getItem('fatah_erp_supabase_url');
const localKey = localStorage.getItem('fatah_erp_supabase_key');

export const supabaseUrl = envUrl || localUrl || '';
export const supabaseAnonKey = envKey || localKey || '';

export const isSupabaseConfigured = !!(supabaseUrl && supabaseAnonKey);

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;
