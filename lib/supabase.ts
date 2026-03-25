import { createClient } from '@supabase/supabase-js'

// Supabase configuration
const supabaseUrl = 'https://mwtnayogicrmnapubimv.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im13dG5heW9naWNybW5hcHViaW12Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM2NzkwOTAsImV4cCI6MjA4OTI1NTA5MH0.bmYPWsfHbC7dSkKhWauEY4lS97S1Fo3VVflv115_dFc'

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  }
})

console.log('✅ Supabase client initialized')
