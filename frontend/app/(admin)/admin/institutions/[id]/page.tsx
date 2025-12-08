'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';
import { 
  Building, Users, Briefcase, Clock, 
  ChevronLeft, Mail, Shield, Calendar,
  Activity, FileText
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Table, TableHeader, TableBody, TableRow, TableHead, TableCell
} from '@/components/ui/table';
import { useBreadcrumb } from '@/components/ui/breadcrumbs';

// Interfaces para tipagem
interface Log {
  id: string;
  type: 'USER' | 'JOB';
  message: string;
  date: string;
  actor: string;
}

interface UserRole {
  id: number;
  role: { name: string };
  user: {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
    lastLogin: string | null;
  };
}

interface Job {
  id: number;
  title: string;
  status: string;
  createdAt: string;
  author: { firstName: string; lastName: string };
  area: { name: string };
}

interface InstitutionDetail {
  id: number;
  name: string;
  type: string;
  users: UserRole[];
  jobs: Job[];
}

const API_URL = `${process.env.NEXT_PUBLIC_API_URL}`;

export default function InstitutionDetailsPage() {
  const { id } = useParams();
  const router = useRouter();
  const { token } = useAuth();
  const { setCustomLabel } = useBreadcrumb(); // Hook do breadcrumb (se estiver usando)

  const [data, setData] = useState<{ institution: InstitutionDetail, logs: Log[] } | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'jobs'>('overview');

  useEffect(() => {
    const fetchDetails = async () => {
      try {
        const res = await fetch(`${API_URL}/admin/institutions/${id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        if (res.ok) {
          const json = await res.json();
          setData(json);
          setCustomLabel && setCustomLabel(String(id), json.institution.name);
        } else {
          toast.error('Erro ao carregar instituição.');
          router.push('/admin/institutions');
        }
      } catch (err) {
        toast.error('Erro de rede.');
      } finally {
        setLoading(false);
      }
    };

    if (token && id) fetchDetails();
  }, [token, id, router]);

  if (loading) return <div className="p-10 text-center">Carregando detalhes...</div>;
  if (!data) return null;

  const { institution, logs } = data;

  return (
    <div className="space-y-6 pb-20">
      {/* Header */}
      <div className="flex flex-col gap-4">
        <Button variant="ghost" className="w-fit pl-0 text-neutral-500" onClick={() => router.back()}>
          <ChevronLeft className="mr-2 h-4 w-4" /> Voltar para lista
        </Button>
        
        <div className="flex items-center gap-4">
          <div className="h-16 w-16 rounded-xl bg-orange-100 flex items-center justify-center text-orange-600">
            <Building className="h-8 w-8" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-neutral-900">{institution.name}</h1>
            <div className="flex items-center gap-3 text-sm text-neutral-500 mt-1">
              <span className="capitalize px-2 py-0.5 bg-neutral-100 rounded-md border border-neutral-200">
                {institution.type === 'university' ? 'Universidade' : 'Empresa'}
              </span>
              <span>•</span>
              <span>ID: #{institution.id}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Cards de Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-xl border border-neutral-200 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-lg">
            <Users className="h-6 w-6" />
          </div>
          <div>
            <p className="text-sm text-neutral-500">Usuários Vinculados</p>
            <p className="text-2xl font-bold text-neutral-900">{institution.users.length}</p>
          </div>
        </div>
        
        <div className="bg-white p-5 rounded-xl border border-neutral-200 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-green-50 text-green-600 rounded-lg">
            <Briefcase className="h-6 w-6" />
          </div>
          <div>
            <p className="text-sm text-neutral-500">Vagas Criadas</p>
            <p className="text-2xl font-bold text-neutral-900">{institution.jobs.length}</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-neutral-200 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-purple-50 text-purple-600 rounded-lg">
            <Activity className="h-6 w-6" />
          </div>
          <div>
            <p className="text-sm text-neutral-500">Última Atividade</p>
            <p className="text-sm font-semibold text-neutral-900">
              {logs.length > 0 ? new Date(logs[0].date).toLocaleDateString() : '-'}
            </p>
          </div>
        </div>
      </div>

      {/* Navegação de Abas */}
      <div className="border-b border-neutral-200">
        <nav className="flex gap-6">
          <button 
            onClick={() => setActiveTab('overview')}
            className={`pb-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'overview' ? 'border-orange-600 text-orange-600' : 'border-transparent text-neutral-500 hover:text-neutral-700'}`}
          >
            Visão Geral & Logs
          </button>
          <button 
            onClick={() => setActiveTab('users')}
            className={`pb-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'users' ? 'border-orange-600 text-orange-600' : 'border-transparent text-neutral-500 hover:text-neutral-700'}`}
          >
            Usuários ({institution.users.length})
          </button>
          <button 
            onClick={() => setActiveTab('jobs')}
            className={`pb-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'jobs' ? 'border-orange-600 text-orange-600' : 'border-transparent text-neutral-500 hover:text-neutral-700'}`}
          >
            Vagas ({institution.jobs.length})
          </button>
        </nav>
      </div>

      {/* Conteúdo das Abas */}
      <div className="bg-white rounded-xl border border-neutral-200 shadow-sm min-h-[400px]">
        
        {/* ABA: LOGS / VISÃO GERAL */}
        {activeTab === 'overview' && (
          <div className="p-6">
            <h3 className="font-bold text-neutral-900 mb-4 flex items-center gap-2">
              <Clock className="h-4 w-4" /> Histórico de Atividades
            </h3>
            <div className="space-y-6 relative border-l border-neutral-200 ml-3 pl-8 py-2">
              {logs.length === 0 ? (
                <p className="text-neutral-500 text-sm">Nenhuma atividade registrada.</p>
              ) : (
                logs.map((log) => (
                  <div key={log.id} className="relative">
                    {/* Bolinha da timeline */}
                    <div className={`absolute -left-[41px] top-1 h-5 w-5 rounded-full border-2 border-white ${log.type === 'USER' ? 'bg-blue-500' : 'bg-green-500'}`} />
                    
                    <div className="flex flex-col gap-1">
                      <span className="text-xs text-neutral-400 font-mono">
                        {new Date(log.date).toLocaleDateString()} às {new Date(log.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                      </span>
                      <p className="text-sm text-neutral-800 font-medium">
                        {log.message}
                      </p>
                      <p className="text-xs text-neutral-500">
                        Autor: {log.actor}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* ABA: USUÁRIOS */}
        {activeTab === 'users' && (
          <div className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Cargo</TableHead>
                  <TableHead>Último Login</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {institution.users.map((u) => (
                  <TableRow key={u.id}>
                    <TableCell className="font-medium">{u.user.firstName} {u.user.lastName}</TableCell>
                    <TableCell className="text-neutral-500">
                      <div className="flex items-center gap-2"><Mail className="h-3 w-3"/> {u.user.email}</div>
                    </TableCell>
                    <TableCell>
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-neutral-100 text-neutral-700 border border-neutral-200 gap-1">
                        <Shield className="h-3 w-3" /> {u.role.name}
                      </span>
                    </TableCell>
                    <TableCell className="text-neutral-500 text-xs">
                      {u.user.lastLogin ? new Date(u.user.lastLogin).toLocaleDateString() : 'Nunca'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        {/* ABA: VAGAS */}
        {activeTab === 'jobs' && (
          <div className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Título</TableHead>
                  <TableHead>Área</TableHead>
                  <TableHead>Autor</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Data</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {institution.jobs.map((job) => (
                  <TableRow key={job.id}>
                    <TableCell className="font-medium text-neutral-900">{job.title}</TableCell>
                    <TableCell className="text-neutral-500">{job.area.name}</TableCell>
                    <TableCell className="text-neutral-500">{job.author.firstName} {job.author.lastName}</TableCell>
                    <TableCell>
                      <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${job.status === 'published' || job.status === 'open' ? 'bg-green-100 text-green-700' : 'bg-neutral-100 text-neutral-600'}`}>
                        {job.status === 'published' ? 'Publicado' : job.status}
                      </span>
                    </TableCell>
                    <TableCell className="text-right text-xs text-neutral-500">
                      {new Date(job.createdAt).toLocaleDateString()}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

      </div>
    </div>
  );
}