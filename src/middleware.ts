import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';

export async function middleware(request: NextRequest) {
  try {
    const response = NextResponse.next();
    const path = request.nextUrl.pathname;
    const publicPathsSet = new Set(['/', '/login', '/register', '/our-courses','/course-detail/[courseId]']);

    const protectedPathsSet = new Set([ '/my-courses', '/profile', '/my-wishlist', '/my-assignments','/payment/[courseId]','/course-learn/[courseId]/learning']);
    const isPublicPath = publicPathsSet.has(path);
    const isPublicPathWithSubpath = !isPublicPath && Array.from(publicPathsSet).some(publicPath => 
      path.startsWith(`${publicPath}/`)
    );

    const isStaticFile = path.startsWith('/_next/') || 
    path.startsWith('/api/') || 
    path.startsWith('/favicon.ico');

    const isPublicResource = isPublicPath || isPublicPathWithSubpath || isStaticFile;

    const isProtectedPath = protectedPathsSet.has(path) || 
    Array.from(protectedPathsSet).some(protectedPath => path.startsWith(`${protectedPath}/`));  
  
    if (isPublicResource && !isProtectedPath) {
      return response;
    }
  
    const supabase = createMiddlewareClient({ req: request, res: response });
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (process.env.NODE_ENV === 'development') {
        console.log(`Path: ${path}, Session exists: ${!!session}`);
        if (session) {
          console.log(`User ID: ${session.user.id}`);
        }
      }

      if (session) {

        response.cookies.set('redirecting', '', { 
          maxAge: 0,
          path: '/'
        });
        

        if (path === '/login' || path === '/register') {
          return NextResponse.redirect(new URL('/my-courses', request.url));
        }
        
        return response;
      } else if (isProtectedPath) {
        const redirectingCookie = request.cookies.get('redirecting');
        const hasVisitedLoginPage = request.cookies.get('visited_login');
        
        if (redirectingCookie?.value === 'true' || hasVisitedLoginPage?.value === 'true') {
          return response;
        }
        
        if (process.env.NODE_ENV === 'development') {
          console.log(`No session found, redirecting to login from: ${path}`);
        }
        
        const loginUrl = new URL('/login', request.url);
        loginUrl.searchParams.set('redirectUrl', path);
        
        const redirectResponse = NextResponse.redirect(loginUrl);
        
        redirectResponse.cookies.set('redirecting', 'true', { 
          maxAge: 1,
          path: '/'
        });
        redirectResponse.cookies.set('visited_login', 'true', { 
          maxAge: 60 * 60, 
          path: '/'
        });
        
        return redirectResponse;
      }
      
      const isAdminRoute = path.startsWith('/admin') && !path.startsWith('/admin/login');
      
      if (isAdminRoute) {
        const userRole = session?.user?.user_metadata?.role;
        
        if (userRole !== 'admin') {
          return NextResponse.redirect(new URL('/admin/login', request.url));
        }
      }
      
      return response;
    } catch (sessionError) {
      console.error('Error checking session:', sessionError);
      
      if (!isProtectedPath) {
        return response;
      }
      
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('redirectUrl', path);
      return NextResponse.redirect(loginUrl);
    }
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('Middleware error:', error);
    }
    return NextResponse.next();
  }
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};