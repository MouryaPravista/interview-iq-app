import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  // The Supabase client creation logic remains the same.
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name, value, options) {
          request.cookies.set({ name, value, ...options })
          response = NextResponse.next({ request: { headers: request.headers } })
          response.cookies.set({ name, value, ...options })
        },
        remove(name, options) {
          request.cookies.set({ name, value: '', ...options })
          response = NextResponse.next({ request: { headers: request.headers } })
          response.cookies.set({ name, value: '', ...options })
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  // The redirect logic remains the same.
  // If the user is not signed in, they will be sent to the login page.
  if (!user) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // If they are signed in, allow them to proceed.
  return response
}

// --- THIS IS THE CORRECTED CONFIGURATION ---
export const config = {
  // The matcher now ONLY runs the middleware for the pages that should be private.
  // We are explicitly telling it to protect '/dashboard', '/analytics', '/interview', and '/results'.
  // All other pages, including the landing page ('/'), are now automatically public.
  matcher: [
    '/dashboard/:path*',
    '/analytics/:path*',
    '/interview/:path*',
    '/results/:path*'
  ],
}