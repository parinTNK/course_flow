import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';

export async function middleware(request: NextRequest) {
  const response = NextResponse.next();
  
  const supabase = createMiddlewareClient({ req: request, res: response });

  const { data: { session } } = await supabase.auth.getSession();
  
  const publicPaths = ['/','/login', '/register',];
  
  // เส้นทางปัจจุบัน
  const path = request.nextUrl.pathname;
  
  const isAdminRoute = path.startsWith('/admin') && !path.startsWith('/admin/login');
  
  const isApiRoute = path.startsWith('/api');
  
  // ตรวจสอบว่าต้องการ authentication หรือไม่
  const requiresAuth = !publicPaths.some(publicPath => 
    path === publicPath || path.startsWith(`${publicPath}/`)
  ) && !isApiRoute;
  
  if (isAdminRoute) {
    if (!session) {
      return NextResponse.redirect(new URL('/admin/login', request.url));
    }
    
    const { data: userData } = await supabase.auth.getUser();
    const userRole = userData.user?.user_metadata?.role;
    
    if (userRole !== 'admin') {
      return NextResponse.redirect(new URL('/admin/login', request.url));
    }
    
    return response;
  }
  
  if (requiresAuth && !session) {
    return NextResponse.redirect(new URL('/login', request.url));
  }
  
  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};