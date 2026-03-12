import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL=https://mlgfkqeugebgqtoawoqv.supabase.co
const supabaseAnonkey = import.meta.env.VITE_SUPABASE_ANON_KEY=sb_publishable_bdg9AJZNVf_W9WxXLJ5fsw_5himSCdn

export const supabase = createClient(supabaseUrl, supabaseAnonKey)