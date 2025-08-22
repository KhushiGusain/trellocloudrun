import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// For build-time, use placeholder values if env vars are missing
const fallbackUrl = supabaseUrl || 'https://ihbibcrwwpizsrfpznuz.supabase.co'
const fallbackKey = supabaseKey || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImloYmliY3J3d3BpenNyZnB6bnV6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU3ODA2MTcsImV4cCI6MjA3MTM1NjYxN30.G5iiOeiXbDSN0Dojjl0PFVi98aEkq_NqzbRNndSKn14'

// Only throw error in browser/runtime if vars are actually missing
if (typeof window !== 'undefined' && (!supabaseUrl || !supabaseKey)) {
  console.error('Missing Supabase environment variables')
}

const createCustomStorage = () => {
  if (typeof window === 'undefined') return undefined
  
  return {
    getItem: (key) => {
      try {
        const value = localStorage.getItem(key)
        if (value) return value
        
        const cookies = document.cookie.split(';')
        for (const cookie of cookies) {
          const [cookieName, cookieValue] = cookie.trim().split('=')
          if (cookieName === 'sb-auth-token') {
            return JSON.stringify({
              access_token: cookieValue,
              token_type: 'bearer',
              expires_in: 3600,
              expires_at: Date.now() + 3600000,
              refresh_token: '',
              user: null
            })
          }
        }
        return null
      } catch (error) {
        console.warn('Storage getItem failed:', error)
        return null
      }
    },
    setItem: (key, value) => {
      try {
        localStorage.setItem(key, value)
        
        if (key === 'supabase.auth.token') {
          try {
            const parsed = JSON.parse(value)
            if (parsed.access_token) {
              document.cookie = `sb-auth-token=${parsed.access_token}; path=/; max-age=3600; SameSite=Lax`
            }
          } catch (e) {
            console.warn('Storage setItem failed:', e)
          }
        }
      } catch (error) {
        console.warn('Storage setItem failed:', error)
      }
    },
    removeItem: (key) => {
      try {
        localStorage.removeItem(key)
        document.cookie = 'sb-auth-token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT'
      } catch (error) {
        console.warn('Storage removeItem failed:', error)
      }
    }
  }
}

export const supabase = createClient(fallbackUrl, fallbackKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    flowType: 'pkce',
    storage: createCustomStorage(),
    storageKey: 'supabase.auth.token'
  }
})
