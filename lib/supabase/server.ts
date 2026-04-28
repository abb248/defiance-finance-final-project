// lib/supabase/server.ts
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createSessionClient() {
  const cookieStore = await cookies()

  return createServerClient(
    (() => {
      const url = process.env.NEXT_PUBLIC_SUPABASE_URL
      if (!url) throw new Error('Missing env: NEXT_PUBLIC_SUPABASE_URL')
      return url
    })(),
    (() => {
      const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      if (!key) throw new Error('Missing env: NEXT_PUBLIC_SUPABASE_ANON_KEY')
      return key
    })(),
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // Middleware zaten setleme işini yapıyor
          }
        },
      },
    }
  )
}
// 2. createAdminClient adında yeni bir fonksiyon ekliyoruz )
// Bu, veritabanına "patron" yetkisiyle girer.
export async function createAdminClient() {
  return createServerClient(
    (() => {
      const url = process.env.NEXT_PUBLIC_SUPABASE_URL
      if (!url) throw new Error('Missing env: NEXT_PUBLIC_SUPABASE_URL')
      return url
    })(),
    (() => {
      const key = process.env.SUPABASE_SERVICE_ROLE_KEY
      if (!key) throw new Error('Missing env: SUPABASE_SERVICE_ROLE_KEY')
      return key
    })(), //  Anon değil
    {
      cookies: {
        getAll() { return [] },
        setAll() { },
      },
    }
  )
}