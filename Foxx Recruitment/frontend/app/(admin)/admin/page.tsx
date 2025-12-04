'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';
import { 
  Users, Building, Briefcase, CheckCircle, Edit3, Loader2, 
  ArrowUpRight, Plus, Search, GraduationCap, FileText, AlertCircle,
  TrendingUp, Activity, CalendarDays
} from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';

// --- Interfaces ---
interface AdminStats {
  type: 'global';
  userCount: number;
  institutionCount: number;
  jobCount: number;
  applicationCount: number;
}

interface PersonalStats {
    type: 'personal';
    totalMyJobs: number;
    publishedMyJobs: number;
    draftMyJobs: number;
    totalApplications: number;
    pendingApplications: number;
}

type Stats = AdminStats | PersonalStats | null;

const API_BASE_URL = `${process.env.NEXT_PUBLIC_API_URL}`;

// --- Componente Card de Estatística Redesenhado ---
function StatCard({
  title,
  value,
  icon: Icon,
  color, // 'blue' | 'green' | 'orange' | 'purple' | 'red'
  subtext,
  alert
}: {
  title: string;
  value: string | number;
  icon: React.ElementType;
  color: string;
  subtext?: string;
  alert?: boolean;
}) {
  // Mapeamento de cores para classes Tailwind
  const colorMap: Record<string, { bg: string, text: string, border: string }> = {
    blue: { bg: 'bg-blue-50', text: 'text-blue-600', border: 'border-blue-100' },
    green: { bg: 'bg-emerald-50', text: 'text-emerald-600', border: 'border-emerald-100' },
    orange: { bg: 'bg-orange-50', text: 'text-orange-600', border: 'border-orange-100' },
    purple: { bg: 'bg-purple-50', text: 'text-purple-600', border: 'border-purple-100' },
    red: { bg: 'bg-red-50', text: 'text-red-600', border: 'border-red-100' },
    amber: { bg: 'bg-amber-50', text: 'text-amber-600', border: 'border-amber-100' },
  };

  const theme = colorMap[color] || colorMap.blue;

  return (
    <div className={`relative overflow-hidden bg-white p-6 rounded-2xl border shadow-sm transition-all duration-300 hover:shadow-md group ${alert ? 'ring-2 ring-red-100 border-red-200' : 'border-neutral-100'}`}>
      
      {/* Background decorativo sutil */}
      <div className={`absolute -right-6 -top-6 h-24 w-24 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500 ${theme.bg}`} />
      
      <div className="relative z-10 flex justify-between items-start">
        <div>
          <p className="text-sm font-medium text-neutral-500 mb-1">{title}</p>
          <h3 className="text-3xl font-bold text-neutral-900 tracking-tight">{value}</h3>
        </div>
        <div className={`p-3 rounded-xl ${theme.bg} ${theme.text} ${alert ? 'animate-pulse' : ''}`}>
          <Icon className="h-6 w-6" />
        </div>
      </div>
      
      {subtext && (
        <div className="relative z-10 mt-4 flex items-center text-xs font-medium text-neutral-500">
          {alert ? (
            <span className="flex items-center text-red-600 font-semibold bg-red-50 px-2 py-0.5 rounded-full">
               Ação Necessária
            </span>
          ) : (
            <span className="flex items-center text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
              <TrendingUp className="h-3 w-3 mr-1" />
              {subtext}
            </span>
          )}
        </div>
      )}
    </div>
  );
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<Stats>(null);
  const [recentJobs, setRecentJobs] = useState<any[]>([]); 
  const [isLoading, setIsLoading] = useState(true);
  const { token, user } = useAuth();

  useEffect(() => {
    document.title = 'Admin: Dashboard | FoxxRecruitment';
  }, []);
  
  useEffect(() => {
    const fetchData = async () => {
      if (!token) {
        setIsLoading(false);
        return;
      }
      setIsLoading(true);
      try {
        const statsRes = await fetch(`${API_BASE_URL}/admin/stats`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        
        const jobsUrl = user?.role?.name === 'superadmin' || user?.role?.name === 'admin' 
            ? `${API_BASE_URL}/admin/jobs` 
            : `${API_BASE_URL}/jobs/my-institution`;

        const jobsRes = await fetch(jobsUrl, {
            headers: { Authorization: `Bearer ${token}` }
        });

        if (statsRes.ok) setStats(await statsRes.json());
        if (jobsRes.ok) {
            const jobsData = await jobsRes.json();
            const list = Array.isArray(jobsData) ? jobsData : (jobsData.data || []);
            setRecentJobs(list.slice(0, 5)); 
        }

      } catch (error) {
        toast.error('Erro ao carregar dashboard.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [token, user]);

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-neutral-50">
        <Loader2 className="h-10 w-10 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!stats) return <div className="p-8 text-red-500">Erro ao carregar dados.</div>;

  const currentDate = new Date().toLocaleDateString('pt-BR', { 
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' 
  });

  return (
    <div className="space-y-8 pb-20 max-w-[1600px] mx-auto">
      
      {/* --- HEADER DE BOAS-VINDAS --- */}
      <div className="flex flex-col md:flex-row justify-between items-end gap-6 bg-white p-6 rounded-2xl shadow-sm border border-neutral-100">
        <div>
            <p className="text-xs font-bold text-blue-600 uppercase tracking-wider mb-1 flex items-center gap-2">
                <CalendarDays className="h-3 w-3" /> {currentDate}
            </p>
            <h1 className="text-3xl font-bold text-neutral-900 tracking-tight">
                Olá, {user?.firstName} 👋
            </h1>
            <p className="text-neutral-500 mt-1 text-sm">
                {stats.type === 'global' 
                    ? 'Aqui está o panorama geral do seu ecossistema SaaS hoje.' 
                    : 'Gerencie suas vagas e acompanhe seus candidatos.'}
            </p>
        </div>
        <div className="flex gap-3 w-full md:w-auto">
            {stats.type === 'global' ? (
                 <Button asChild className="bg-orange-600 hover:bg-orange-700 text-white shadow-md shadow-orange-200/50 h-11 px-6 rounded-xl w-full md:w-auto">
                    <Link href="/admin/institutions">
                        <Plus className="mr-2 h-4 w-4" /> Novo Tenant
                    </Link>
                </Button>
            ) : (
                <Button asChild className="bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-200/50 h-11 px-6 rounded-xl w-full md:w-auto">
                    <Link href="/admin/jobs/new">
                        <Plus className="mr-2 h-4 w-4" /> Publicar Vaga
                    </Link>
                </Button>
            )}
        </div>
      </div>

      {/* --- GRID DE ESTATÍSTICAS (KPIs) --- */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.type === 'global' ? (
          // SUPER ADMIN
          <>
            <StatCard 
                title="Tenants Ativos" 
                value={stats.institutionCount} 
                icon={GraduationCap} 
                color="orange"
                subtext="Faculdades & Empresas"
            />
            <StatCard 
                title="Usuários na Plataforma" 
                value={stats.userCount} 
                icon={Users} 
                color="blue"
                subtext="Crescimento Mensal"
            />
            <StatCard 
                title="Total de Vagas" 
                value={stats.jobCount} 
                icon={Briefcase} 
                color="green"
                subtext="Vagas ativas"
            />
            <StatCard 
                title="Total de Candidaturas" 
                value={stats.applicationCount} 
                icon={Activity} 
                color="purple"
                subtext="Engajamento"
            />
          </>
        ) : (
          // TENANT ADMIN
          <>
             <StatCard 
                title="Revisão Pendente" 
                value={stats.pendingApplications} 
                icon={AlertCircle} 
                color="red"
                alert={stats.pendingApplications > 0}
                subtext="Candidatos aguardando"
            />
            <StatCard 
                title="Vagas Publicadas" 
                value={stats.publishedMyJobs} 
                icon={CheckCircle} 
                color="green"
                subtext="Visíveis agora"
            />
            <StatCard 
                title="Total de Candidatos" 
                value={stats.totalApplications} 
                icon={Users} 
                color="blue"
                subtext="Interesse total"
            />
            <StatCard 
                title="Rascunhos" 
                value={stats.draftMyJobs} 
                icon={Edit3} 
                color="amber"
                subtext="Vagas não finalizadas"
            />
          </>
        )}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        
        {/* --- COLUNA PRINCIPAL: Vagas Recentes --- */}
        <div className="xl:col-span-2 space-y-6">
            <div className="bg-white rounded-2xl shadow-sm border border-neutral-200 overflow-hidden">
                <div className="p-6 border-b border-neutral-100 flex justify-between items-center bg-neutral-50/30">
                    <div>
                        <h3 className="font-bold text-lg text-neutral-900 flex items-center gap-2">
                            Vagas Recentes
                        </h3>
                        <p className="text-xs text-neutral-500">Últimas oportunidades adicionadas ao sistema</p>
                    </div>
                    <Button variant="ghost" size="sm" asChild className="text-blue-600 hover:text-blue-700 hover:bg-blue-50">
                        <Link href="/admin/jobs">
                            Ver todas <ArrowUpRight className="ml-1 h-3 w-3" />
                        </Link>
                    </Button>
                </div>
                
                <Table>
                    <TableHeader>
                        <TableRow className="hover:bg-transparent border-neutral-100">
                            <TableHead className="pl-6 w-[40%]">Título da Vaga</TableHead>
                            <TableHead>Publicação</TableHead>
                            <TableHead>Local</TableHead>
                            <TableHead className="text-right pr-6">Status</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {recentJobs.length > 0 ? (
                            recentJobs.map((job) => (
                                <TableRow key={job.id} className="hover:bg-neutral-50/50 border-neutral-50 group transition-colors">
                                    <TableCell className="pl-6">
                                        <div className="font-medium text-neutral-900 group-hover:text-blue-600 transition-colors">
                                            {job.title}
                                        </div>
                                        {stats.type === 'global' && job.institution && (
                                            <div className="text-xs text-neutral-400 mt-0.5">
                                                {job.institution.name}
                                            </div>
                                        )}
                                    </TableCell>
                                    <TableCell className="text-neutral-500 text-sm">
                                        {new Date(job.createdAt).toLocaleDateString()}
                                    </TableCell>
                                    <TableCell className="text-neutral-500 text-sm">
                                        {job.area?.name || '-'}
                                    </TableCell>
                                    <TableCell className="text-right pr-6">
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] uppercase font-bold tracking-wide border ${
                                            job.status === 'published' || job.status === 'open' 
                                            ? 'bg-emerald-50 text-emerald-700 border-emerald-100' 
                                            : 'bg-neutral-100 text-neutral-600 border-neutral-200'
                                        }`}>
                                            {job.status === 'published' ? 'Ativo' : 'Rascunho'}
                                        </span>
                                    </TableCell>
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={4} className="text-center py-16 text-neutral-500">
                                    <div className="flex flex-col items-center gap-2">
                                        <FileText className="h-8 w-8 text-neutral-300 mb-1" />
                                        <p>Nenhuma vaga encontrada.</p>
                                    </div>
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>

        {/* --- COLUNA LATERAL: Atalhos e Dicas --- */}
        <div className="flex flex-col gap-6">
            
            {/* Card de Acesso Rápido */}
            <div className="bg-white rounded-2xl p-6 border border-neutral-200 shadow-sm">
                <h3 className="font-bold text-neutral-900 mb-4 text-sm uppercase tracking-wider text-neutral-400">Acesso Rápido</h3>
                <div className="space-y-3">
                    {stats.type === 'global' ? (
                        <>
                            <Button variant="outline" className="w-full justify-start h-12 border-neutral-200 hover:bg-orange-50 hover:text-orange-700 hover:border-orange-200 transition-all" asChild>
                                <Link href="/admin/institutions"><GraduationCap className="mr-3 h-4 w-4" /> Gerenciar Faculdades</Link>
                            </Button>
                            <Button variant="outline" className="w-full justify-start h-12 border-neutral-200 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-200 transition-all" asChild>
                                <Link href="/admin/users"><Users className="mr-3 h-4 w-4" /> Base de Usuários</Link>
                            </Button>
                            <Button variant="outline" className="w-full justify-start h-12 border-neutral-200 hover:bg-purple-50 hover:text-purple-700 hover:border-purple-200 transition-all" asChild>
                                <Link href="/admin/logs"><Activity className="mr-3 h-4 w-4" /> Logs de Auditoria</Link>
                            </Button>
                        </>
                    ) : (
                        <>
                            <Button variant="outline" className="w-full justify-start h-12 border-neutral-200 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-200 transition-all" asChild>
                                <Link href="/admin/jobs/new"><Plus className="mr-3 h-4 w-4" /> Criar Nova Vaga</Link>
                            </Button>
                            <Button variant="outline" className="w-full justify-start h-12 border-neutral-200 hover:bg-purple-50 hover:text-purple-700 hover:border-purple-200 transition-all" asChild>
                                <Link href="/admin/applications"><FileText className="mr-3 h-4 w-4" /> Processar Candidatos</Link>
                            </Button>
                            <Button variant="outline" className="w-full justify-start h-12 border-neutral-200 hover:bg-neutral-50 hover:text-neutral-900 transition-all" asChild>
                                <Link href="/dashboard/profile"><Users className="mr-3 h-4 w-4" /> Configurações</Link>
                            </Button>
                        </>
                    )}
                </div>
            </div>

            {/* Card de Dica/Marketing */}
            <div className="relative overflow-hidden bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl p-6 shadow-lg text-white">
                <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-white/10 rounded-full blur-2xl"></div>
                <div className="relative z-10">
                    <div className="bg-white/20 w-fit p-2 rounded-lg mb-4">
                        <ArrowUpRight className="h-5 w-5 text-white" />
                    </div>
                    <h3 className="font-bold text-lg mb-2">Melhore seu Alcance</h3>
                    <p className="text-blue-100 text-sm leading-relaxed mb-4">
                        Vagas com descrição detalhada e requisitos claros recebem <strong>40% mais candidaturas</strong> qualificadas.
                    </p>
                    {stats.type !== 'global' && (
                        <Button size="sm" className="w-full bg-white text-blue-700 hover:bg-blue-50 border-0 font-semibold" asChild>
                            <Link href="/admin/jobs/new">Otimizar Vagas</Link>
                        </Button>
                    )}
                </div>
            </div>

        </div>
      </div>
    </div>
  );
}