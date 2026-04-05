/**
 * True when browser + server can talk to Supabase (real backend).
 * When false, the app runs in offline UI demo mode (mock session + empty or stub data).
 */
export function isSupabaseConfigured(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim()
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim()
  return Boolean(url && key)
}

export function isOfflineDemoMode(): boolean {
  return !isSupabaseConfigured()
}
