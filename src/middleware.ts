import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import './app/admin/login/type';

const ADMIN_FRESH_LOGIN_COOKIE = 'admin-fresh-login';
const ADMIN_AUTH_BYPASS_PARAM = 'auth';
const COOKIE_EXPIRY_SHORT = 10;
const COOKIE_EXPIRY_LONG = 60 * 60;

const PUBLIC_PATHS = new Set([
  '/', 
  '/login', 
  '/register', 
  '/our-courses'
]);

const PROTECTED_PATHS = new Set([
  '/my-courses', 
  '/profile', 
  '/my-wishlist', 
  '/my-assignments'
]);

const ADMIN_PATHS = ['/admin'];

const STATIC_PATHS = ['/_next/', '/api/', '/favicon.ico'];

function isStaticResource(path: string): boolean {
  return STATIC_PATHS.some(staticPath => path.startsWith(staticPath));
}

function isPublicPath(path: string): boolean {
  if (PUBLIC_PATHS.has(path)) return true;
  if (path.startsWith('/course-detail/')) return true;
  return false;
}

function isProtectedPath(path: string): boolean {
  if (PROTECTED_PATHS.has(path)) return true;
  const protectedPrefixes = ['/payment/', '/course-learning/'];
  return protectedPrefixes.some(prefix => path.startsWith(prefix));
}

function isAdminPath(path: string): boolean {
  return ADMIN_PATHS.some(adminPath => path.startsWith(adminPath));
}

async function handleAdminAuth(request: NextRequest): Promise<NextResponse> {
  const response = NextResponse.next();
  const path = request.nextUrl.pathname;

  if (path === '/admin/login') {
    return response;
  }

  if (request.nextUrl.searchParams.get(ADMIN_AUTH_BYPASS_PARAM) === 'success') {
    const url = new URL(request.url);
    url.searchParams.delete(ADMIN_AUTH_BYPASS_PARAM);
    const redirectResponse = NextResponse.redirect(url);
    redirectResponse.cookies.set(ADMIN_FRESH_LOGIN_COOKIE, 'true', {
      httpOnly: true,
      maxAge: COOKIE_EXPIRY_SHORT,
      path: '/',
      secure: process.env.NODE_ENV === 'production'
    });
    return redirectResponse;
  }

  const freshLoginCookie = request.cookies.get(ADMIN_FRESH_LOGIN_COOKIE);
  if (freshLoginCookie?.value === 'true') {
    response.cookies.delete(ADMIN_FRESH_LOGIN_COOKIE);
    return response;
  }

  try {
    const supabase = createMiddlewareClient({ req: request, res: response });
    const { data: { session }, error } = await supabase.auth.getSession();

    if (error) {
      return NextResponse.redirect(new URL('/admin/login', request.url));
    }

    if (!session) {
      return NextResponse.redirect(new URL('/admin/login', request.url));
    }

    const userRole = session.user?.user_metadata?.role || 
                    session.user?.raw_user_meta_data?.role;

    if (userRole !== 'admin') {
      return NextResponse.redirect(new URL('/admin/login', request.url));
    }

    return response;

  } catch (error) {
    return NextResponse.redirect(new URL('/admin/login', request.url));
  }
}

async function handleUserAuth(request: NextRequest, path: string): Promise<NextResponse> {
  const response = NextResponse.next();
  
  try {
    const supabase = createMiddlewareClient({ req: request, res: response });
    const { data: { session } } = await supabase.auth.getSession();

    if (session) {
      response.cookies.set('redirecting', '', { 
        maxAge: 0,
        path: '/'
      });

      if (path === '/login' || path === '/register') {
        return NextResponse.redirect(new URL('/my-courses', request.url));
      }
      
      return response;
    }

    if (isProtectedPath(path)) {
      const redirectingCookie = request.cookies.get('redirecting');
      const hasVisitedLoginPage = request.cookies.get('visited_login');
      
      if (redirectingCookie?.value === 'true' || hasVisitedLoginPage?.value === 'true') {
        return response;
      }

      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('redirectUrl', path);
      
      const redirectResponse = NextResponse.redirect(loginUrl);
      redirectResponse.cookies.set('redirecting', 'true', { 
        maxAge: 1,
        path: '/'
      });
      redirectResponse.cookies.set('visited_login', 'true', { 
        maxAge: COOKIE_EXPIRY_LONG,
        path: '/'
      });
      
      return redirectResponse;
    }
    
    return response;
    
  } catch (error) {
    if (isPublicPath(path) || isStaticResource(path)) {
      return response;
    }
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirectUrl', path);
    return NextResponse.redirect(loginUrl);
  }
}

export async function middleware(request: NextRequest) {
  try {
    const path = request.nextUrl.pathname;

    if (isStaticResource(path)) {
      return NextResponse.next();
    }

    if (isAdminPath(path)) {
      return await handleAdminAuth(request);
    }

    if (isPublicPath(path)) {
      if (path === '/login' || path === '/register') {
        return await handleUserAuth(request, path);
      }
      return NextResponse.next();
    }

    return await handleUserAuth(request, path);

  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
    }
    return NextResponse.next();
  }
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
