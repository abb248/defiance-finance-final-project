import { createBrowserClient } from '@supabase/ssr'

export const createClient = () =>
  createBrowserClient(
    (() => {
      const url = process.env.NEXT_PUBLIC_SUPABASE_URL
      if (!url) throw new Error('Missing env: NEXT_PUBLIC_SUPABASE_URL')
      return url
    })(),
    (() => {
      const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      if (!key) throw new Error('Missing env: NEXT_PUBLIC_SUPABASE_ANON_KEY')
      return key
    })()
  )

// Mevcut kodlarınla çakışmaması için:
export const supabase = createClient()