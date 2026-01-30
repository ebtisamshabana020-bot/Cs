import { createClient } from '@supabase/supabase-js';

// Safe environment variable access for various environments (Vite, Next, plain Browser)
const getEnv = (key: string, viteKey?: string) => {
  // Try process.env
  try {
    if (typeof process !== 'undefined' && process.env && process.env[key]) {
      return process.env[key];
    }
  } catch (e) {}

  // Try import.meta.env (Vite)
  try {
    // @ts-ignore
    if (typeof import.meta !== 'undefined' && import.meta.env) {
      // @ts-ignore
      if (viteKey && import.meta.env[viteKey]) return import.meta.env[viteKey];
      // @ts-ignore
      if (import.meta.env[key]) return import.meta.env[key];
    }
  } catch (e) {}

  return '';
};

/**
 * Supabase Configuration
 * URL: https://djgvntdnisqjtgploopd.supabase.co
 * Key: Provided via user prompt
 */
const supabaseUrl = getEnv('SUPABASE_URL', 'VITE_SUPABASE_URL') || 'https://djgvntdnisqjtgploopd.supabase.co';
const supabaseKey = getEnv('SUPABASE_KEY', 'VITE_SUPABASE_KEY') || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRqZ3ZudGRuaXNxanRncGxvb3BkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkwMzAyMzUsImV4cCI6MjA4NDYwNjIzNX0.TL0GV2XPw_BE8R7YGjSLHBVS0-lQYdLVvERRiRUsBUs';

if (!supabaseUrl || !supabaseKey) {
  console.error("Critical: Supabase credentials missing from services/supabaseClient.ts");
}

export const supabase = createClient(supabaseUrl, supabaseKey);