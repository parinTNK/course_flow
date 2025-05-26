import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import './app/admin/login/type';

export async function middleware(request: NextRequest) {
  try {
    const response = NextResponse.next();
    const path = request.nextUrl.pathname;
if (path.startsWith('/admin')) {
      if (path === '/admin/login') {
        return response;
      }
      
      // Method 1: Check for auth bypass parameter
      if (request.nextUrl.searchParams.get('auth') === 'success') {
        console.log("Admin middleware - First login bypass");
        const url = new URL(request.url);
        url.searchParams.delete('auth');
        
        // Set a temporary cookie to remember this is a fresh login
        const redirectResponse = NextResponse.redirect(url);
        redirectResponse.cookies.set('admin-fresh-login', 'true', {
          httpOnly: true,
          maxAge: 10, // 10 seconds
          path: '/'
        });
        return redirectResponse;
      }
      
      // Method 2: Check for fresh login cookie
      if (request.cookies.get('admin-fresh-login')?.value === 'true') {
        console.log("Admin middleware - Fresh login detected, allowing access");
        response.cookies.delete('admin-fresh-login');
        return response;
      }
      
      // Method 3: Normal session check
      const supabase = createMiddlewareClient({ req: request, res: response });
      
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        console.log("Admin middleware - Session check:", {
          hasSession: !!session,
          error: error?.message
        });
        
        if (!session) {
          // Double check by trying to get user
          const { data: { user } } = await supabase.auth.getUser();
          
          if (!user) {
            console.log("Admin middleware - No user found, redirecting to login");
            return NextResponse.redirect(new URL('/admin/login', request.url));
          }
          
          // If user exists but no session, try to refresh
          const { data: refreshData } = await supabase.auth.refreshSession();
          if (!refreshData.session) {
            return NextResponse.redirect(new URL('/admin/login', request.url));
          }
        }
        
        // Check admin role
        const userRole = 
          session?.user?.user_metadata?.role ||
          session?.user?.raw_user_meta_data?.role;
          
        console.log("Admin middleware - Role check:", userRole);
        
        if (userRole !== 'admin') {
          console.log("Admin middleware - Not admin, redirecting");
          return NextResponse.redirect(new URL('/admin/login', request.url));
        }
        
        console.log("Admin middleware - Access granted");
        return response;
        
      } catch (error) {
        console.error('Admin middleware error:', error);
        return NextResponse.redirect(new URL('/admin/login', request.url));
      }
    }
    
    
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