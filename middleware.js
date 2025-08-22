import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'

export async function middleware(request) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        get(name) {
          const value = request.cookies.get(name)?.value
          
          if (!value && name.startsWith('sb-') && name.includes('auth-token')) {
            const customValue = request.cookies.get('sb-auth-token')?.value
            if (customValue) {
              return customValue
            }
          }
          
          return value
        },
        set(name, value, options) {
          request.cookies.set({
            name,
            value,
            ...options,
          })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({
            name,
            value,
            ...options,
          })
        },
        remove(name, options) {
          request.cookies.set({
            name,
            value: '',
            ...options,
          })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({
            name,
            value: '',
            ...options,
          })
        },
      },
    }
  )

  if (request.nextUrl.searchParams.has('code')) {
    const code = request.nextUrl.searchParams.get('code')
    
    const { data: { session }, error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (error) {
      return NextResponse.redirect(new URL('/auth/login', request.url))
    }
    
    if (session) {
      // Redirect to boards page only if not already on a board page
      if (!request.nextUrl.pathname.startsWith('/boards/')) {
        const url = new URL('/boards', request.url)
        return NextResponse.redirect(url)
      }
      return response
    }
  }

  if (request.nextUrl.pathname.startsWith('/api/')) {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    
    return response
  }
  
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user && request.nextUrl.pathname.startsWith('/boards')) {
    return NextResponse.redirect(new URL('/auth/login', request.url))
  }

  return response
}

export const config = {
  matcher: ['/', '/boards/:path*', '/api/boards/:path*']
}
