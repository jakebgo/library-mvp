import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(req: NextRequest) {
  try {
    // Skip middleware for static files, API routes, and other non-page requests
    if (
      req.nextUrl.pathname.startsWith('/_next') ||
      req.nextUrl.pathname.startsWith('/api') ||
      req.nextUrl.pathname.startsWith('/static') ||
      req.nextUrl.pathname.includes('.') ||
      req.nextUrl.pathname === '/favicon.ico'
    ) {
      return NextResponse.next();
    }

    const res = NextResponse.next();
    const supabase = createMiddlewareClient({ req, res });

    // Protected routes
    const protectedRoutes = ['/books', '/upload'];
    const isProtectedRoute = protectedRoutes.some(route => 
      req.nextUrl.pathname.startsWith(route)
    );

    // Auth page
    const isAuthPage = req.nextUrl.pathname === '/auth';

    // Only check auth for protected routes or auth page
    if (isProtectedRoute || isAuthPage) {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      // If there's a session error (not just missing session), handle it
      if (sessionError && sessionError.message !== 'Auth session missing!') {
        console.error('Session error:', sessionError.message);
        return handleAuthError(req);
      }

      // If session exists and is expired, try to refresh it
      if (session?.expires_at && Date.now() / 1000 > session.expires_at) {
        const { data: { session: newSession }, error: refreshError } = 
          await supabase.auth.refreshSession();
        
        if (refreshError) {
          console.error('Session refresh error:', refreshError.message);
          return handleAuthError(req);
        }

        // Update cookies with new session data
        if (newSession) {
          const response = NextResponse.redirect(req.url);
          await supabase.auth.setSession(newSession);
          return response;
        }
      }

      // Get user data only if needed
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      // If there's a user error (not just missing session), handle it
      if (userError && userError.message !== 'Auth session missing!') {
        console.error('User error:', userError.message);
        return handleAuthError(req);
      }

      // Redirect if accessing protected route without auth
      if (isProtectedRoute && !user) {
        return NextResponse.redirect(new URL('/auth', req.url));
      }

      // Redirect if accessing auth page while logged in
      if (isAuthPage && user) {
        return NextResponse.redirect(new URL('/', req.url));
      }
    }

    return res;
  } catch (error) {
    console.error('Middleware error:', error);
    return handleAuthError(req);
  }
}

function handleAuthError(req: NextRequest) {
  const redirectUrl = new URL('/auth', req.url);
  return NextResponse.redirect(redirectUrl);
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|public/).*)',
  ],
}; 