'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { LogOut, ArrowLeft, LucideIcon, GraduationCap } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';

export interface NavLink {
  href: string;
  label: string;
  icon: LucideIcon;
  roles?: string[];
}

interface AdminSidebarProps {
  navLinks: NavLink[];
}

export default function AdminSidebar({ navLinks }: AdminSidebarProps) {
  const pathname = usePathname();
  const { logout } = useAuth();
  const router = useRouter();
  const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME;


  const handleLogout = () => {
    logout();
    router.push('/');
  };

  return (
    <aside className="w-72 flex-shrink-0 bg-[#0f172a] border-r border-white/10 flex flex-col h-screen sticky top-0 transition-all duration-300">
      
      {/* --- CABEÇALHO (Rebranding) --- */}
      <div className="p-6 pb-4">
        <div className="flex items-center gap-3 mb-6">
          <div className="h-10 w-10 rounded-xl bg-orange-600 flex items-center justify-center shadow-lg shadow-orange-900/20 border border-orange-500/20">
            <GraduationCap className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-white leading-tight tracking-tight">{APP_NAME} Admin</h1>
            <p className="text-xs text-slate-400 font-medium">Gestão SaaS</p>
          </div>
        </div>

        <Button 
            asChild 
            variant="outline" 
            className="w-full justify-start border-slate-800 bg-slate-900/50 text-slate-400 hover:text-white hover:bg-slate-800 hover:border-slate-700 transition-all group"
        >
            <Link href="/dashboard">
                <ArrowLeft className="h-4 w-4 mr-2 transition-transform duration-300 group-hover:-translate-x-1" />
                Voltar ao Portal
            </Link>
        </Button>
      </div>

      <div className="h-px bg-gradient-to-r from-transparent via-slate-800 to-transparent mx-6 mb-4" />

      {/* --- NAVEGAÇÃO --- */}
      <nav className="flex-1 overflow-y-auto px-4 space-y-1.5 custom-scrollbar">
        {navLinks.map((link) => {
          // Lógica de ativo: Exato para home, startsWith para subpáginas
          const isActive = link.href === '/admin' 
            ? pathname === '/admin'
            : pathname.startsWith(link.href);
          
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200 relative overflow-hidden ${
                isActive
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                  : 'text-slate-400 hover:bg-white/5 hover:text-white'
              }`}
            >
              {isActive && <div className="absolute left-0 top-0 bottom-0 w-1 bg-white/20" />}
              
              <link.icon className={`h-4 w-4 transition-colors ${isActive ? 'text-white' : 'text-slate-500 group-hover:text-slate-300'}`} />
              <span className="relative z-10">{link.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* --- RODAPÉ --- */}
      <div className="p-4 border-t border-white/5 bg-[#020617]">
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium text-slate-400 transition-all hover:bg-red-500/10 hover:text-red-400 group border border-transparent hover:border-red-500/20"
        >
          <div className="p-1.5 rounded-md bg-slate-800 group-hover:bg-red-500/20 transition-colors">
             <LogOut className="h-4 w-4 group-hover:text-red-400" />
          </div>
          Sair do Sistema
        </button>
      </div>
    </aside>
  );
}