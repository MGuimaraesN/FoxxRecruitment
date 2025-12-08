import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export default function proxy(req: NextRequest) {
  const url = req.nextUrl;
  
  // Pega o hostname (ex: usp.localhost:3000 ou vagas.usp.br)
  let hostname = req.headers.get('host') || '';
  hostname = hostname.split(':')[0]; // Remove porta

  const mainDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN || 'localhost';
  const isSubdomain = hostname !== mainDomain && hostname.endsWith(`.${mainDomain}`);
  
  if (isSubdomain) {
    const subdomain = hostname.replace(`.${mainDomain}`, '');
    
    // CORREÇÃO CRÍTICA:
    // Só reescreve para a página da instituição se for a raiz "/"
    if (url.pathname === '/') {
        return NextResponse.rewrite(new URL(`/institution/${subdomain}`, req.url));
    }

    // Para todas as outras páginas (jobs, login, etc), deixa o Next.js carregar a rota correta
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};