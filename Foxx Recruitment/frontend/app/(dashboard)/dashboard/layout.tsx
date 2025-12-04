"use client";

import { useEffect, ReactNode } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import {
  User,
  Building,
  FileText,
  Loader2 
} from 'lucide-react';
import { Toaster } from 'sonner';
import Sidebar, { NavLink } from '@/components/layout/Sidebar';
import Header from '@/components/layout/Header';

// --- ATUALIZAÇÃO: Apenas Candidaturas e Perfil ---
const allNavLinks: NavLink[] = [
  { 
    href: '/dashboard', 
    label: 'Minhas Candidaturas', 
    icon: FileText, // Ícone de arquivo/status
    roles: ['student', 'professor', 'coordenador', 'empresa', 'admin', 'superadmin'] 
  },
  { 
    href: '/dashboard/profile', 
    label: 'Meu Perfil', 
    icon: User, 
    roles: ['student', 'professor', 'coordenador', 'empresa', 'admin', 'superadmin'] 
  },
];

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const { user, loading, getActiveRole } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/');
    }
  }, [user, loading, router]);

  if (loading || !user) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-neutral-50">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-10 w-10 animate-spin text-blue-600" />
          <p className="text-sm font-medium text-neutral-500 animate-pulse">
            Carregando seu espaço...
          </p>
        </div>
      </div>
    );
  }

  const activeRole = getActiveRole();
  const filteredLinks = allNavLinks.filter(
    (link) => !link.roles || (activeRole && link.roles.includes(activeRole))
  );

  return (
    <div className="flex h-screen w-full bg-white">
      <Sidebar
        title="FoxxRecruitment"
        icon={Building}
        navLinks={filteredLinks} 
      />

      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto bg-neutral-50 p-6 md:p-10">
          <Toaster richColors />
          {children}
        </main>
      </div>
    </div>
  );
}