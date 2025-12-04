"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { User, Shield, Bell } from 'lucide-react';

import { useAuth } from '@/context/AuthContext';
import InstitutionSwitcher from '@/components/InstitutionSwitcher';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

// --- Interface para Notificação ---
interface Notification {
  id: number;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
}

export default function Header() {
  const { user, token } = useAuth();
  const pathname = usePathname();
  
  // --- States de Notificação ---
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  // --- Lógica de Notificações ---
  const fetchNotifications = async () => {
    if (!token) return;
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/notifications`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications || []);
        setUnreadCount(data.unreadCount || 0);
      }
    } catch (e) {
      console.error("Erro ao buscar notificações:", e);
    }
  };

  useEffect(() => {
    fetchNotifications();
    // Polling simples a cada 60s para atualizar notificações
    const interval = setInterval(fetchNotifications, 60000);
    return () => clearInterval(interval);
  }, [token]);

  const markAsRead = async () => {
    if (!token || unreadCount === 0) return;
    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/notifications/mark-all-read`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` }
      });
      setUnreadCount(0);
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    } catch (e) {
      console.error(e);
    }
  };

  // --- 1. Lógica para definir o Título da Página (Mantida do Original) ---
  const getPageTitle = (path: string) => {
    if (path === '/admin') return 'Dashboard Geral';
    if (path.startsWith('/admin/users')) return 'Gerenciar Usuários';
    if (path.startsWith('/admin/companies')) return 'Gerenciar Empresas';
    if (path.startsWith('/admin/jobs')) return 'Gerenciar Vagas';
    if (path.startsWith('/admin/institutions')) return 'Gerenciar Instituições';
    if (path.startsWith('/admin/categories')) return 'Gerenciar Categorias';
    if (path.startsWith('/admin/areas')) return 'Gerenciar Áreas';
    if (path.startsWith('/admin/roles')) return 'Cargos e Permissões';
    
    if (path === '/dashboard') return 'Mural de Vagas';
    if (path === '/dashboard/saved') return 'Vagas Salvas';
    if (path === '/dashboard/profile') return 'Meu Perfil';
    if (path.includes('/candidates')) return 'Gestão de Candidatos';
    
    return 'Decola Vagas'; // Padrão
  };

  const pageTitle = getPageTitle(pathname);

  // --- Lógica de permissão do botão Admin (Mantida do Original para segurança) ---
  let hasAdminAccess = false;
  if (user?.institutions) {
    const isGlobalAdmin = user.institutions.some(
      (inst: any) => inst.role.name === 'admin' || inst.role.name === 'superadmin'
    );
    if (isGlobalAdmin) {
      hasAdminAccess = true;
    } else {
      const activeInstitution = user.institutions.find(
        (inst: any) => inst.institution.id === user.activeInstitutionId
      );
      const activeRole = activeInstitution?.role.name;
      // Adicionei 'empresa' aqui caso queira que empresa veja algo administrativo, 
      // senão remova.
      if (activeRole && ['professor', 'coordenador', 'empresa'].includes(activeRole)) {
        hasAdminAccess = true;
      }
    }
  }
  
  const showAdminButton = hasAdminAccess;
  const isAdminPanel = pathname.startsWith('/admin');

  return (
    <header className="bg-white border-b border-neutral-200 h-16 px-6 flex justify-between items-center sticky top-0 z-40 shadow-sm">
      
      {/* --- LADO ESQUERDO: Título da Página e Botão Admin --- */}
      <div className="flex items-center gap-4">
        <h2 className="text-lg font-semibold text-neutral-800 hidden md:block">
          {pageTitle}
        </h2>

        {/* Botão para ir ao Painel Admin (se tiver permissão) */}
        {showAdminButton && !isAdminPanel && (
          <div className="pl-4 md:border-l md:border-neutral-200">
            <Button asChild variant="ghost" size="sm" className="text-blue-600 hover:text-blue-700 hover:bg-blue-50">
              <Link href="/admin">
                <Shield className="h-4 w-4 mr-2" />
                Painel Admin
              </Link>
            </Button>
          </div>
        )}
      </div>

      {/* --- LADO DIREITO: Seletor, Notificações e Perfil --- */}
      <div className="flex items-center gap-6">
        <InstitutionSwitcher />
        
        {/* --- NOVO: SININHO DE NOTIFICAÇÕES --- */}
        <Popover>
            <PopoverTrigger asChild>
                <button 
                  className="relative p-2 rounded-full hover:bg-neutral-100 transition-colors outline-none focus:ring-2 focus:ring-neutral-200" 
                  onClick={markAsRead}
                >
                    <Bell className="h-5 w-5 text-neutral-600" />
                    {unreadCount > 0 && (
                        <span className="absolute top-1.5 right-1.5 h-2.5 w-2.5 rounded-full bg-red-500 border-2 border-white animate-pulse" />
                    )}
                </button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-0 mr-4" align="end">
                <div className="p-3 border-b border-neutral-100 font-medium text-sm text-neutral-900 flex justify-between items-center">
                  <span>Notificações</span>
                  {unreadCount > 0 && <span className="text-xs text-blue-600 font-normal">{unreadCount} nova(s)</span>}
                </div>
                <div className="max-h-[300px] overflow-y-auto">
                    {notifications.length === 0 ? (
                        <div className="p-6 text-center text-xs text-neutral-500">
                          Nenhuma notificação no momento.
                        </div>
                    ) : (
                        notifications.map(n => (
                            <div key={n.id} className={`p-3 border-b border-neutral-50 text-sm hover:bg-neutral-50 transition-colors ${!n.read ? 'bg-blue-50/50' : ''}`}>
                                <p className="font-semibold text-neutral-800 mb-1">{n.title}</p>
                                <p className="text-neutral-600 text-xs leading-relaxed">{n.message}</p>
                                <span className="text-[10px] text-neutral-400 mt-2 block">
                                  {new Date(n.createdAt).toLocaleDateString('pt-BR')}
                                </span>
                            </div>
                        ))
                    )}
                </div>
            </PopoverContent>
        </Popover>

        {/* --- Perfil do Usuário --- */}
        <div className="flex items-center gap-3 pl-6 border-l border-neutral-200">
          <div className="text-right hidden md:block">
            <p className="text-sm font-medium text-neutral-900 leading-none">
              {user?.firstName} {user?.lastName}
            </p>
            <p className="text-xs text-neutral-500 mt-1">
              {user?.email}
            </p>
          </div>

          <div className="relative h-10 w-10 rounded-full overflow-hidden border border-neutral-200 bg-neutral-100 shadow-sm">
            {user?.avatarUrl ? (
              <img
                src={`${process.env.NEXT_PUBLIC_API_URL}${user.avatarUrl}`}
                alt="Avatar"
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="h-full w-full flex items-center justify-center text-neutral-500 font-bold bg-neutral-100">
                {user?.firstName?.charAt(0)}{user?.lastName?.charAt(0)}
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}