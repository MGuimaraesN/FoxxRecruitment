'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';
import { 
  Users, Building, Briefcase, CheckCircle, Edit3, Loader2, 
  ArrowUpRight, Plus, Search 
} from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';

// ... (Interfaces AdminStats e PersonalStats mantidas iguais) ...
interface AdminStats {
  type: 'global';
  userCount: number;
  institutionCount: number;
  jobCount: number;
}

interface PersonalStats {
    type: 'personal';
    totalMyJobs: number;
    publishedMyJobs: number;
    draftMyJobs: number;
}

type Stats = AdminStats | PersonalStats | null;

const API_BASE_URL = `${process.env.NEXT_PUBLIC_API_URL}`;

// Card Melhorado
function StatCard({
  title,
  value,
  icon: Icon,
  colorClass,
  trend
}: {
  title: string;
  value: string | number;
  icon: React.ElementType;
  colorClass: string;
  trend?: string;
}) {
  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-neutral-100 hover:shadow-md transition-all duration-200">
      <div className="flex justify-between items-start">
        <div>
          <p className="text-sm font-medium text-neutral-500 mb-1">{title}</p>
          <h3 className="text-3xl font-bold text-neutral-900 tracking-tight">{value}</h3>
        </div>
        <div className={`p-3 rounded-lg ${colorClass} bg-opacity-10`}>
          <Icon className={`h-6 w-6 ${colorClass}`} />
        </div>
      </div>
      {trend && (
        <div className="mt-4 flex items-center text-xs text-green-600 font-medium">
          <ArrowUpRight className="h-3 w-3 mr-1" />
          {trend} este mês
        </div>
      )}
    </div>
  );
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<Stats>(null);
  const [recentJobs, setRecentJobs] = useState<any[]>([]); // Estado para vagas recentes
  const [isLoading, setIsLoading] = useState(true);
  const { token, user } = useAuth();

  useEffect(() => {
    document.title = 'Admin: Dashboard | Decola Vagas';
  }, []);
  
  useEffect(() => {
    const fetchData = async () => {
      if (!token) {
        setIsLoading(false);
        return;
      }
      setIsLoading(true);
      try {
        // Busca stats
        const statsRes = await fetch(`${API_BASE_URL}/admin/stats`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        
        // Busca vagas recentes (reutilizando a rota de listagem, limitando a 5)
        // Nota: Idealmente crie um endpoint específico para "recentes", mas este serve
        const jobsUrl = user?.role?.name === 'superadmin' || user?.role?.name === 'admin' 
            ? `${API_BASE_URL}/admin/jobs` 
            : `${API_BASE_URL}/jobs/my-institution`;

        const jobsRes = await fetch(jobsUrl, {
            headers: { Authorization: `Bearer ${token}` }
        });

        if (statsRes.ok) setStats(await statsRes.json());
        if (jobsRes.ok) {
            const jobsData = await jobsRes.json();
            // Se vier paginado (data, meta) ou array direto
            const list = Array.isArray(jobsData) ? jobsData : (jobsData.data || []);
            setRecentJobs(list.slice(0, 5)); // Pega as 5 primeiras
        }

      } catch (error) {
        toast.error('Erro de rede ao carregar dashboard.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [token, user]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!stats) return <div className="text-red-500">Erro ao carregar.</div>;

  return (
    <div className="space-y-8">
      {/* Cabeçalho da Página */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
            <h1 className="text-3xl font-bold text-neutral-900 tracking-tight">
            Visão Geral
            </h1>
            <p className="text-neutral-500 mt-1">Acompanhe as métricas e atividades recentes.</p>
        </div>
        <div className="flex gap-3">
            <Button variant="outline" asChild>
                <Link href="/admin/jobs">
                    <Search className="mr-2 h-4 w-4" /> Buscar Vagas
                </Link>
            </Button>
            <Button asChild className="bg-blue-600 hover:bg-blue-700">
                <Link href="/admin/jobs/new">
                    <Plus className="mr-2 h-4 w-4" /> Nova Vaga
                </Link>
            </Button>
        </div>
      </div>

      {/* Cards de Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {stats.type === 'global' ? (
          <>
            <StatCard title="Usuários Totais" value={stats.userCount} icon={Users} colorClass="text-blue-600" trend="+12%" />
            <StatCard title="Instituições" value={stats.institutionCount} icon={Building} colorClass="text-purple-600" />
            <StatCard title="Total de Vagas" value={stats.jobCount} icon={Briefcase} colorClass="text-green-600" trend="+5%" />
          </>
        ) : (
          <>
            <StatCard title="Minhas Vagas" value={stats.totalMyJobs} icon={Briefcase} colorClass="text-blue-600" />
            <StatCard title="Publicadas" value={stats.publishedMyJobs} icon={CheckCircle} colorClass="text-green-600" />
            <StatCard title="Rascunhos" value={stats.draftMyJobs} icon={Edit3} colorClass="text-amber-600" />
          </>
        )}
      </div>

      {/* Seção Inferior: Vagas Recentes */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Tabela ocupa 2/3 */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-neutral-100 overflow-hidden">
            <div className="p-6 border-b border-neutral-100 flex justify-between items-center">
                <h3 className="font-bold text-lg text-neutral-800">Vagas Recentes</h3>
                <Link href="/admin/jobs" className="text-sm text-blue-600 hover:underline">Ver todas</Link>
            </div>
            <Table>
                <TableHeader>
                    <TableRow className="hover:bg-transparent">
                        <TableHead>Título</TableHead>
                        <TableHead>Data</TableHead>
                        <TableHead className="text-right">Status</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {recentJobs.length > 0 ? (
                        recentJobs.map((job) => (
                            <TableRow key={job.id} className="hover:bg-neutral-50/50">
                                <TableCell className="font-medium">{job.title}</TableCell>
                                <TableCell className="text-neutral-500 text-xs">
                                    {new Date(job.createdAt).toLocaleDateString()}
                                </TableCell>
                                <TableCell className="text-right">
                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                        job.status === 'published' || job.status === 'open' 
                                        ? 'bg-green-100 text-green-800' 
                                        : 'bg-amber-100 text-amber-800'
                                    }`}>
                                        {job.status === 'published' ? 'Publicado' : 'Rascunho'}
                                    </span>
                                </TableCell>
                            </TableRow>
                        ))
                    ) : (
                        <TableRow>
                            <TableCell colSpan={3} className="text-center py-8 text-neutral-500">
                                Nenhuma atividade recente.
                            </TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>
        </div>

        {/* Sidebar de Ações ou Avisos (1/3) */}
        <div className="bg-blue-50/50 rounded-xl p-6 border border-blue-100 h-fit">
            <h3 className="font-bold text-blue-900 mb-2">Dica Rápida</h3>
            <p className="text-sm text-blue-800/80 mb-6">
                Mantenha as descrições das vagas detalhadas para atrair os melhores candidatos. Vagas com salário visível recebem 40% mais cliques.
            </p>
            
            <h3 className="font-bold text-neutral-900 mb-3 border-t border-blue-200 pt-4">Atalhos</h3>
            <div className="space-y-2">
                <Button variant="outline" className="w-full justify-start bg-white hover:bg-blue-50" asChild>
                    <Link href="/admin/companies">Gerenciar Empresas</Link>
                </Button>
                <Button variant="outline" className="w-full justify-start bg-white hover:bg-blue-50" asChild>
                    <Link href="/admin/institutions">Gerenciar Instituições</Link>
                </Button>
                {stats?.type === 'global' && (
                    <Button variant="outline" className="w-full justify-start bg-white hover:bg-blue-50" asChild>
                        <Link href="/admin/users">Gerenciar Usuários</Link>
                    </Button>
                )}
            </div>
        </div>
      </div>
    </div>
  );
}