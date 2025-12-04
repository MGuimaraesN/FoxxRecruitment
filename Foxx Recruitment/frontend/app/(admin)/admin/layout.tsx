'use client';

import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, ReactNode } from 'react';
import { Toaster } from 'sonner';
import AdminSidebar, { NavLink } from './components/AdminSidebar'; 
import Header from '@/components/layout/Header';
import {
  Users,
  Building,         
  ClipboardList,
  Network,
  Shield,
  LayoutDashboard,
  Briefcase,
  GraduationCap,    
  Activity,
  Inbox,            // Importado Inbox
  Loader2
} from 'lucide-react';
import { Breadcrumbs, BreadcrumbProvider } from '@/components/ui/breadcrumbs';

// --- NAVEGAÇÃO DO SISTEMA ---
const allAdminLinks: NavLink[] = [
  // 1. Visão Geral
  { 
    href: '/admin', 
    label: 'Visão Geral', 
    icon: LayoutDashboard, 
    roles: ['professor', 'coordenador', 'empresa', 'admin', 'superadmin'] 
  },
  
  // 2. Gestão do SaaS (Apenas Super Admin)
  { 
    href: '/admin/institutions', 
    label: 'Faculdades (Tenants)', 
    icon: GraduationCap,           
    roles: ['superadmin'] 
  },
  { 
    href: '/admin/users', 
    label: 'Usuários Globais', 
    icon: Users, 
    roles: ['admin', 'superadmin'] 
  },

  // 3. Entidades Globais / Auditoria
  { 
    href: '/admin/companies', 
    label: 'Empresas Parceiras', 
    icon: Building, 
    roles: ['admin', 'superadmin'] 
  },
  { 
    href: '/admin/jobs', 
    label: 'Moderação de Vagas', 
    icon: Briefcase, 
    roles: ['professor', 'coordenador', 'empresa', 'admin', 'superadmin'] 
  },
  // ADICIONADO: Candidaturas visível para Superadmin também
  { 
    href: '/admin/applications', 
    label: 'Candidaturas', 
    icon: Inbox, 
    roles: ['professor', 'coordenador', 'empresa', 'admin', 'superadmin'] 
  },

  // 4. Configurações Globais
  { 
    href: '/admin/categories', 
    label: 'Categorias', 
    icon: ClipboardList, 
    roles: ['professor', 'coordenador', 'empresa', 'admin', 'superadmin'] 
  },
  { 
    href: '/admin/areas', 
    label: 'Áreas de Atuação', 
    icon: Network, 
    roles: ['professor', 'coordenador', 'empresa', 'admin', 'superadmin'] 
  },
  { 
    href: '/admin/roles', 
    label: 'Controle de Acesso', 
    icon: Shield, 
    roles: ['superadmin'] 
  },

  // 5. Logs de Sistema (Auditoria)
  {
    href: '/admin/logs',
    label: 'Logs do Sistema',
    icon: Activity,
    roles: ['superadmin']
  }
];

const AdminAuthGuard = ({ children }: { children: ReactNode }) => {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push('/');
        return;
      }
      // Lógica de permissão
      const isGlobalAdmin = user.institutions.some(
        (inst: any) => inst.role.name === 'admin' || inst.role.name === 'superadmin'
      );
      if (isGlobalAdmin) return;
      
      const activeInstitution = user.institutions.find(
        (inst: any) => inst.institution.id === user.activeInstitutionId
      );
      const activeRole = activeInstitution?.role.name;
      
      if (activeRole && ['professor', 'coordenador', 'empresa'].includes(activeRole)) {
        return;
      }
      router.push('/dashboard');
    }
  }, [user, loading, router]);

  if (loading || !user) return (
    <div className="flex h-screen items-center justify-center bg-neutral-50">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
    </div>
  );

  return <>{children}</>;
};

export default function AdminLayout({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  let viewRole: string | undefined;
  
  const isSuperAdmin = user?.institutions.some((inst: any) => inst.role.name === 'superadmin');
  const isAdmin = user?.institutions.some((inst: any) => inst.role.name === 'admin');

  if (isSuperAdmin) viewRole = 'superadmin';
  else if (isAdmin) viewRole = 'admin';
  else {
    const activeInstitution = user?.institutions.find((inst) => inst.institution.id === user.activeInstitutionId);
    viewRole = activeInstitution?.role.name;
  }

  const filteredLinks = allAdminLinks.filter((link) => link.roles?.includes(viewRole || ''));

  return (
    <AdminAuthGuard>
      <BreadcrumbProvider>
        <div className="flex min-h-screen w-full bg-white">
          <AdminSidebar navLinks={filteredLinks} />
          <div className="flex-1 flex flex-col overflow-hidden">
            <Header />
            <main className="flex-1 overflow-y-auto bg-neutral-50 p-6 md:p-10">
              <Toaster richColors />
              <Breadcrumbs />
              {children}
            </main>
          </div>
        </div>
      </BreadcrumbProvider>
    </AdminAuthGuard>
  );
}