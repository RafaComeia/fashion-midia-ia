import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { updateSession } from '@/lib/supabase/middleware';

const AUTH_PATHS = ['/login', '/cadastro', '/recuperar-senha'];

const isProtectedPath = (pathname: string) =>
  pathname.startsWith('/dashboard') || pathname.startsWith('/(dashboard)');

const isAuthPath = (pathname: string) =>
  AUTH_PATHS.some((p) => pathname.startsWith(p));

export async function proxy(request: NextRequest) {
  const { supabaseResponse, user } = await updateSession(request);
  const { pathname } = request.nextUrl;

  // Rota protegida sem usuário → redireciona para login
  if (isProtectedPath(pathname) && !user) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = '/login';
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Usuário autenticado tentando acessar página de auth → redireciona
  if (isAuthPath(pathname) && user) {
    const hasWorkspace = user.user_metadata?.workspace_id;
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = hasWorkspace ? '/dashboard' : '/onboarding';
    redirectUrl.search = '';
    return NextResponse.redirect(redirectUrl);
  }

  return supabaseResponse;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
};
