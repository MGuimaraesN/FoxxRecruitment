'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';
import { 
  Users, Building, Briefcase, CheckCircle, Edit3, Loader2, 
  ArrowUpRight, Plus, Search, GraduationCap, FileText, AlertCircle,
  TrendingUp, Activity, CalendarDays, DollarSign, Layout
} from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';

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

// --- Componente Card de Estatística (Novo Padrão) ---
function StatCard({
  title,
  value,
  icon: Icon,
  color, 
  subtext,
  alert
}: {
  title: string;
  value: string | number;
  icon: React.ElementType;
  color: 'blue' | 'green' | 'orange' | 'purple' | 'red' | 'amber';
  subtext?: string;
  alert?: boolean;
}) {
  
  const theme = {
    blue: { bg: 'bg-blue-50', text: 'text-blue-600', ring: 'ring-blue-100' },
    green: { bg: 'bg-emerald-50', text: 'text-emerald-600', ring: 'ring-emerald-100' },
    orange: { bg: 'bg-orange-50', text: 'text-orange-600', ring: 'ring-orange-100' },
    purple: { bg: 'bg-purple-50', text: 'text-purple-600', ring: 'ring-purple-100' },
    red: { bg: 'bg-red-50', text: 'text-red-600', ring: 'ring-red-100' },
    amber: { bg: 'bg-amber-50', text: 'text-amber-600', ring: 'ring-amber-100' },
  }[color];

  return (
    <div className={`group relative overflow-hidden bg-white p-6 rounded-xl border border-neutral-200 shadow-sm hover:shadow-md transition-all duration-300 ${alert ? 'ring-2 ring-red-100 border-red-200' : ''}`}>
      <div className="flex justify-between items-start">
        <div className="space-y-1">
          <p className="text-sm font-medium text-neutral-500">{title}</p>
          <h3 className="text-3xl font-bold text-neutral-900 tracking-tight">{value}</h3>
        </div>
        <div className={`p-3 rounded-xl ${theme.bg} ${theme.text} ring-1 ${theme.ring} group-hover:scale-110 transition-transform duration-300`}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
      
      {subtext && (
        <div className="mt-4 flex items-center text-xs font-medium">
          {alert ? (
            <span className="flex items-center text-red-700 bg-red-50 px-2 py-1 rounded-md border border-red-100">
               <AlertCircle className="h-3 w-3 mr-1.5" /> {subtext}
            </span>
          ) : (
            <span className="flex items-center text-neutral-500">
              <TrendingUp className="h-3 w-3 mr-1.5 text-emerald-500" />
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
  const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME;
  useEffect(() => {
    document.title = `Dashboard | ${APP_NAME}`;
    
    const fetchData = async () => {
      if (!token) return;
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
      <div className="flex h-[calc(100vh-100px)] items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!stats) return <div className="p-8 text-red-500 text-center">Não foi possível carregar os dados do dashboard.</div>;

  const currentDate = new Date().toLocaleDateString('pt-BR', { 
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' 
  });

  return (
    <div className="space-y-8 pb-20 max-w-[1600px] mx-auto px-2">
      
      {/* --- HEADER --- */}
      <div className="flex flex-col md:flex-row justify-between items-end gap-6 bg-white p-8 rounded-2xl shadow-sm border border-neutral-200 relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none">
             <Layout className="w-64 h-64 text-blue-600 -rotate-12" />
        </div>

        <div className="relative z-10">
            <div className="flex items-center gap-2 text-blue-600 mb-2">
                <CalendarDays className="h-4 w-4" />
                <span className="text-xs font-bold uppercase tracking-wider">{currentDate}</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-neutral-900 tracking-tight">
                Olá, {user?.firstName}
            </h1>
            <p className="text-neutral-500 mt-2 text-base max-w-lg">
                {stats.type === 'global' 
                    ? 'Visão geral do ecossistema. Monitore o crescimento e a saúde da plataforma.' 
                    : 'Acompanhe o desempenho das suas vagas e gerencie candidaturas recentes.'}
            </p>
        </div>
        
        <div className="relative z-10 flex gap-3 w-full md:w-auto">
            {stats.type === 'global' ? (
                 <Button asChild className="bg-orange-600 hover:bg-orange-700 text-white shadow-lg shadow-orange-200/50 h-12 px-6 rounded-xl w-full md:w-auto text-base font-medium transition-all hover:scale-105">
                    <Link href="/admin/institutions">
                        <Plus className="mr-2 h-5 w-5" /> Novo Tenant
                    </Link>
                </Button>
            ) : (
                <Button asChild className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-200/50 h-12 px-6 rounded-xl w-full md:w-auto text-base font-medium transition-all hover:scale-105">
                    <Link href="/admin/jobs/new">
                        <Plus className="mr-2 h-5 w-5" /> Publicar Vaga
                    </Link>
                </Button>
            )}
        </div>
      </div>

      {/* --- KPI GRID --- */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.type === 'global' ? (
          // SUPER ADMIN STATS
          <>
            <StatCard 
                title="Tenants Ativos" 
                value={stats.institutionCount} 
                icon={GraduationCap} 
                color="orange"
                subtext="Faculdades & Empresas"
            />
            <StatCard 
                title="Usuários Totais" 
                value={stats.userCount} 
                icon={Users} 
                color="blue"
                subtext="Alunos e Recrutadores"
            />
            <StatCard 
                title="Vagas na Plataforma" 
                value={stats.jobCount} 
                icon={Briefcase} 
                color="green"
                subtext="Oportunidades ativas"
            />
            <StatCard 
                title="Candidaturas" 
                value={stats.applicationCount} 
                icon={Activity} 
                color="purple"
                subtext="Volume total de aplicações"
            />
          </>
        ) : (
          // TENANT ADMIN / RECRUITER STATS
          <>
             <StatCard 
                title="Revisão Pendente" 
                value={stats.pendingApplications} 
                icon={AlertCircle} 
                color="red"
                alert={stats.pendingApplications > 0}
                subtext={stats.pendingApplications === 1 ? "1 candidato aguardando" : `${stats.pendingApplications} candidatos aguardando`}
            />
            <StatCard 
                title="Vagas Publicadas" 
                value={stats.publishedMyJobs} 
                icon={CheckCircle} 
                color="green"
                subtext="Visíveis no portal"
            />
            <StatCard 
                title="Total de Candidatos" 
                value={stats.totalApplications} 
                icon={Users} 
                color="blue"
                subtext="Interesse total acumulado"
            />
            <StatCard 
                title="Rascunhos" 
                value={stats.draftMyJobs} 
                icon={Edit3} 
                color="amber"
                subtext="Vagas em edição"
            />
          </>
        )}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        
        {/* --- COLUNA PRINCIPAL: Vagas Recentes --- */}
        <div className="xl:col-span-2 space-y-6">
            <div className="bg-white rounded-2xl shadow-sm border border-neutral-200 overflow-hidden">
                <div className="p-6 border-b border-neutral-100 flex justify-between items-center">
                    <div>
                        <h3 className="font-bold text-lg text-neutral-900 flex items-center gap-2">
                            Vagas Recentes
                        </h3>
                        <p className="text-sm text-neutral-500">Últimas oportunidades movimentadas.</p>
                    </div>
                    <Button variant="ghost" size="sm" asChild className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 font-medium">
                        <Link href="/admin/jobs">
                            Ver todas <ArrowUpRight className="ml-1 h-4 w-4" />
                        </Link>
                    </Button>
                </div>
                
                <Table>
                    <TableHeader>
                        <TableRow className="bg-neutral-50/50 border-neutral-100">
                            <TableHead className="pl-6 w-[40%] text-xs uppercase tracking-wider font-semibold text-neutral-500">Título</TableHead>
                            <TableHead className="text-xs uppercase tracking-wider font-semibold text-neutral-500">Publicação</TableHead>
                            <TableHead className="text-xs uppercase tracking-wider font-semibold text-neutral-500">Local</TableHead>
                            <TableHead className="text-right pr-6 text-xs uppercase tracking-wider font-semibold text-neutral-500">Status</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {recentJobs.length > 0 ? (
                            recentJobs.map((job) => (
                                <TableRow key={job.id} className="hover:bg-neutral-50 group transition-colors border-neutral-50">
                                    <TableCell className="pl-6 py-4">
                                        <div className="font-semibold text-neutral-900 group-hover:text-blue-600 transition-colors">
                                            {job.title}
                                        </div>
                                        {stats.type === 'global' && job.institution && (
                                            <div className="text-xs text-neutral-400 mt-1 flex items-center gap-1">
                                                <Building className="h-3 w-3" /> {job.institution.name}
                                            </div>
                                        )}
                                    </TableCell>
                                    <TableCell className="text-neutral-500 text-sm">
                                        {new Date(job.createdAt).toLocaleDateString()}
                                    </TableCell>
                                    <TableCell className="text-neutral-500 text-sm">
                                        <span className="inline-flex items-center px-2 py-1 rounded bg-neutral-100 text-neutral-600 text-xs">
                                            {job.area?.name || '-'}
                                        </span>
                                    </TableCell>
                                    <TableCell className="text-right pr-6">
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold tracking-wide border ${
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
                                    <div className="flex flex-col items-center gap-3">
                                        <div className="h-12 w-12 bg-neutral-100 rounded-full flex items-center justify-center">
                                            <FileText className="h-6 w-6 text-neutral-300" />
                                        </div>
                                        <p>Nenhuma vaga encontrada.</p>
                                        {stats.type !== 'global' && (
                                            <Button variant="link" asChild className="text-blue-600">
                                                <Link href="/admin/jobs/new">Criar primeira vaga</Link>
                                            </Button>
                                        )}
                                    </div>
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>

        {/* --- COLUNA LATERAL --- */}
        <div className="flex flex-col gap-6">
            
            {/* Quick Actions */}
            <div className="bg-white rounded-2xl p-6 border border-neutral-200 shadow-sm">
                <h3 className="font-bold text-neutral-900 mb-4 text-sm uppercase tracking-wider text-neutral-400">Acesso Rápido</h3>
                <div className="space-y-3">
                    {stats.type === 'global' ? (
                        <>
                            <Button variant="outline" className="w-full justify-start h-12 border-neutral-200 bg-white hover:bg-orange-50 hover:text-orange-700 hover:border-orange-200 transition-all group" asChild>
                                <Link href="/admin/institutions">
                                    <div className="p-1.5 rounded bg-orange-100 text-orange-600 mr-3 group-hover:bg-orange-200 transition-colors">
                                        <GraduationCap className="h-4 w-4" />
                                    </div>
                                    Gerenciar Faculdades
                                </Link>
                            </Button>
                            <Button variant="outline" className="w-full justify-start h-12 border-neutral-200 bg-white hover:bg-blue-50 hover:text-blue-700 hover:border-blue-200 transition-all group" asChild>
                                <Link href="/admin/users">
                                    <div className="p-1.5 rounded bg-blue-100 text-blue-600 mr-3 group-hover:bg-blue-200 transition-colors">
                                        <Users className="h-4 w-4" />
                                    </div>
                                    Base de Usuários
                                </Link>
                            </Button>
                            <Button variant="outline" className="w-full justify-start h-12 border-neutral-200 bg-white hover:bg-purple-50 hover:text-purple-700 hover:border-purple-200 transition-all group" asChild>
                                <Link href="/admin/logs">
                                    <div className="p-1.5 rounded bg-purple-100 text-purple-600 mr-3 group-hover:bg-purple-200 transition-colors">
                                        <Activity className="h-4 w-4" />
                                    </div>
                                    Logs de Auditoria
                                </Link>
                            </Button>
                        </>
                    ) : (
                        <>
                            <Button variant="outline" className="w-full justify-start h-12 border-neutral-200 bg-white hover:bg-blue-50 hover:text-blue-700 hover:border-blue-200 transition-all group" asChild>
                                <Link href="/admin/jobs/new">
                                    <div className="p-1.5 rounded bg-blue-100 text-blue-600 mr-3 group-hover:bg-blue-200 transition-colors">
                                        <Plus className="h-4 w-4" />
                                    </div>
                                    Criar Nova Vaga
                                </Link>
                            </Button>
                            <Button variant="outline" className="w-full justify-start h-12 border-neutral-200 bg-white hover:bg-purple-50 hover:text-purple-700 hover:border-purple-200 transition-all group" asChild>
                                <Link href="/admin/applications">
                                    <div className="p-1.5 rounded bg-purple-100 text-purple-600 mr-3 group-hover:bg-purple-200 transition-colors">
                                        <FileText className="h-4 w-4" />
                                    </div>
                                    Processar Candidatos
                                </Link>
                            </Button>
                            <Button variant="outline" className="w-full justify-start h-12 border-neutral-200 bg-white hover:bg-neutral-50 hover:text-neutral-900 transition-all group" asChild>
                                <Link href="/dashboard/profile">
                                    <div className="p-1.5 rounded bg-neutral-100 text-neutral-600 mr-3 group-hover:bg-neutral-200 transition-colors">
                                        <Users className="h-4 w-4" />
                                    </div>
                                    Meu Perfil
                                </Link>
                            </Button>
                        </>
                    )}
                </div>
            </div>

            {/* Marketing Card */}
            <div className="relative overflow-hidden bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-6 shadow-lg text-white border border-slate-700">
                <div className="absolute top-0 right-0 -mt-8 -mr-8 w-32 h-32 bg-blue-500/20 rounded-full blur-3xl"></div>
                <div className="relative z-10">
                    <div className="bg-white/10 w-fit p-2 rounded-lg mb-4 backdrop-blur-sm border border-white/10">
                        <ArrowUpRight className="h-5 w-5 text-blue-300" />
                    </div>
                    <h3 className="font-bold text-lg mb-2 text-white">Melhore seu Alcance</h3>
                    <p className="text-slate-300 text-sm leading-relaxed mb-4">
                        Vagas com descrição detalhada e requisitos claros recebem <strong className="text-white">40% mais candidaturas</strong> qualificadas.
                    </p>
                    {stats.type !== 'global' && (
                        <Button size="sm" className="w-full bg-white text-slate-900 hover:bg-blue-50 border-0 font-semibold" asChild>
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