'use client'

import { createBrowserClient } from '@supabase/ssr'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/supabase'
import { isSupabaseConfigured } from '@/lib/config/backend'

async function mockAuthFetch(path: string, body: unknown) {
  const res = await fetch(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(body),
  })
  return res
}

function createMockBrowserClient(): SupabaseClient<Database> {
  const auth = {
    signInWithPassword: async ({
      email,
      password: _password,
    }: {
      email: string
      password: string
    }) => {
      const res = await mockAuthFetch('/api/mock/auth/login', { email })
      if (!res.ok) {
        const j = (await res.json().catch(() => ({}))) as { error?: string }
        return {
          data: { user: null, session: null },
          error: { message: j.error ?? 'Login failed', name: 'AuthError', status: res.status } as any,
        }
      }
      return { data: { user: null, session: null }, error: null }
    },
    signUp: async (opts: {
      email: string
      password: string
      options?: { data?: Record<string, unknown> }
    }) => {
      const meta = opts.options?.data ?? {}
      const res = await mockAuthFetch('/api/mock/auth/signup', {
        email: opts.email,
        password: opts.password,
        firstName: meta.first_name as string | undefined,
        lastName: meta.last_name as string | undefined,
        companyName: meta.company_name as string | undefined,
      })
      if (!res.ok) {
        const j = (await res.json().catch(() => ({}))) as { error?: string }
        return {
          data: { user: null, session: null },
          error: { message: j.error ?? 'Signup failed', name: 'AuthError', status: res.status } as any,
        }
      }
      return { data: { user: null, session: null }, error: null }
    },
    signOut: async () => {
      await fetch('/api/mock/auth/logout', { method: 'POST', credentials: 'include' })
      return { error: null }
    },
    getUser: async () => ({ data: { user: null }, error: null }),
    updateUser: async (_attrs: { password?: string }) => ({
      data: { user: null },
      error: null,
    }),
  }

  return { auth } as unknown as SupabaseClient<Database>
}

export function createClient(): SupabaseClient<Database> {
  if (isSupabaseConfigured()) {
    return createBrowserClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
  }
  return createMockBrowserClient()
}
