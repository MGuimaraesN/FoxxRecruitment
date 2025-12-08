'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';
import { 
  Building, Users, Briefcase, Clock, 
  ChevronLeft, Mail, Shield, Activity, 
  Globe, CheckCircle, XCircle 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Table, TableHeader, TableBody, TableRow, TableHead, TableCell
} from '@/components/ui/table';
import { useBreadcrumb } from '@/components/ui/breadcrumbs';

// Interfaces Atualizadas
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
  institutionId: number; // Útil para validação
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
  // --- NOVOS CAMPOS ---
  slug?: string | null;
  logoUrl?: string | null;
  primaryColor?: string | null;
  isActive: boolean;
  // --------------------
  users: UserRole[];
  jobs: Job[];
}

const API_URL = `${process.env.NEXT_PUBLIC_API_URL}`;
const ROOT_DOMAIN = process.env.NEXT_PUBLIC_ROOT_DOMAIN || 'localhost:3000';

export default function InstitutionDetailsPage() {
  const { id } = useParams();
  const router = useRouter();
  const { token } = useAuth();
  const { setCustomLabel } = useBreadcrumb();

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
          // Atualiza breadcrumb com o nome da instituição
          if (setCustomLabel) setCustomLabel(String(id), json.institution.name);
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

  if (loading) return <div className="p-10 text-center flex justify-center"><Activity className="animate-spin mr-2"/> Carregando detalhes...</div>;
  if (!data) return null;

  const { institution, logs } = data;
  const primaryColor = institution.primaryColor || '#ea580c'; // Cor padrão (Laranja) se não tiver

  return (
    <div className="space-y-6 pb-20">
      {/* Header e Ações */}
      <div className="flex flex-col gap-4">
        <div className="flex justify-between items-center">
             <Button variant="ghost" className="w-fit pl-0 text-neutral-500 hover:text-neutral-900" onClick={() => router.back()}>
               <ChevronLeft className="mr-2 h-4 w-4" /> Voltar para lista
             </Button>
             
             {/* Botão de Editar Rápido */}
             <Button variant="outline" onClick={() => router.push(`/admin/institutions/${id}/edit`)}>
                Editar Instituição
             </Button>
        </div>
        
        <div className="flex flex-col md:flex-row md:items-center gap-6 bg-white p-6 rounded-xl border border-neutral-200 shadow-sm">
          {/* Logo / Ícone Dinâmico */}
          <div className="h-20 w-20 rounded-xl flex items-center justify-center overflow-hidden border border-neutral-100 shrink-0 bg-neutral-50">
            {institution.logoUrl ? (
                <img 
                    src={`${API_URL}${institution.logoUrl}`} 
                    alt={institution.name} 
                    className="h-full w-full object-contain p-1" 
                />
            ) : (
                <Building className="h-8 w-8 opacity-80" style={{ color: primaryColor }} />
            )}
          </div>
          
          <div className="flex-1 space-y-2">
            <div className="flex items-start justify-between">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold text-neutral-900 leading-tight">
                        {institution.name}
                    </h1>
                    
                    {/* Link do Portal (Slug) */}
                    {institution.slug && (
                        <a 
                            href={`http://${institution.slug}.${ROOT_DOMAIN}`} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700 hover:underline mt-1"
                        >
                            <Globe className="h-3 w-3" /> 
                            {institution.slug}.{ROOT_DOMAIN}
                        </a>
                    )}
                </div>

                {/* Badge de Status */}
                <div className={`px-3 py-1 rounded-full text-xs font-bold border flex items-center gap-1.5 ${institution.isActive ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'}`}>
                    {institution.isActive ? <CheckCircle className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
                    {institution.isActive ? 'ATIVO' : 'INATIVO'}
                </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 text-sm text-neutral-500">
              <span className="capitalize px-2 py-0.5 bg-neutral-100 rounded-md border border-neutral-200 text-xs font-medium text-neutral-600">
                {institution.type === 'university' ? 'Universidade' : 'Empresa'}
              </span>
              <span className="text-neutral-300">|</span>
              <span>ID: #{institution.id}</span>
              <span className="text-neutral-300">|</span>
              <div className="flex items-center gap-1">
                 <div className="w-3 h-3 rounded-full border border-black/10" style={{ backgroundColor: primaryColor }}></div>
                 <span className="text-xs font-mono">{primaryColor}</span>
              </div>
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
              {logs.length > 0 ? new Date(logs[0].date).toLocaleDateString() : 'Sem registros'}
            </p>
          </div>
        </div>
      </div>

      {/* Navegação de Abas */}
      <div className="border-b border-neutral-200">
        <nav className="flex gap-6">
          {['overview', 'users', 'jobs'].map((tab) => (
             <button 
                key={tab}
                onClick={() => setActiveTab(tab as any)}
                className={`pb-3 text-sm font-medium border-b-2 transition-colors capitalize ${
                    activeTab === tab 
                    ? 'border-orange-600 text-orange-600' 
                    : 'border-transparent text-neutral-500 hover:text-neutral-700'
                }`}
             >
                {tab === 'overview' ? 'Visão Geral' : tab === 'users' ? `Usuários (${institution.users.length})` : `Vagas (${institution.jobs.length})`}
             </button>
          ))}
        </nav>
      </div>

      {/* Conteúdo das Abas */}
      <div className="bg-white rounded-xl border border-neutral-200 shadow-sm min-h-[400px]">
        
        {/* ABA: LOGS / VISÃO GERAL */}
        {activeTab === 'overview' && (
          <div className="p-6">
            <h3 className="font-bold text-neutral-900 mb-6 flex items-center gap-2">
              <Clock className="h-4 w-4 text-neutral-500" /> Linha do Tempo
            </h3>
            <div className="space-y-6 relative border-l border-neutral-200 ml-3 pl-8 py-2">
              {logs.length === 0 ? (
                <p className="text-neutral-500 text-sm italic">Nenhuma atividade registrada recentemente.</p>
              ) : (
                logs.map((log) => (
                  <div key={log.id} className="relative group">
                    {/* Bolinha da timeline */}
                    <div className={`absolute -left-[41px] top-1 h-5 w-5 rounded-full border-2 border-white ring-1 ring-neutral-200 shadow-sm transition-transform group-hover:scale-110 ${log.type === 'USER' ? 'bg-blue-500' : 'bg-green-500'}`} />
                    
                    <div className="flex flex-col gap-1">
                      <span className="text-xs text-neutral-400 font-mono flex items-center gap-2">
                        {new Date(log.date).toLocaleDateString()} 
                        <span className="w-1 h-1 rounded-full bg-neutral-300"></span>
                        {new Date(log.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                      </span>
                      <p className="text-sm text-neutral-800 font-medium">
                        {log.message}
                      </p>
                      <p className="text-xs text-neutral-500 bg-neutral-50 w-fit px-2 py-0.5 rounded border border-neutral-100 mt-1">
                        Por: {log.actor}
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
                <TableRow className="bg-neutral-50 hover:bg-neutral-50">
                  <TableHead>Nome</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Cargo</TableHead>
                  <TableHead>Último Login</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {institution.users.map((u) => (
                  <TableRow key={u.id} className="hover:bg-neutral-50/50">
                    <TableCell className="font-medium text-neutral-900">{u.user.firstName} {u.user.lastName}</TableCell>
                    <TableCell className="text-neutral-500">
                      <div className="flex items-center gap-2"><Mail className="h-3 w-3 text-neutral-400"/> {u.user.email}</div>
                    </TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border gap-1 ${u.role.name === 'admin' ? 'bg-purple-50 text-purple-700 border-purple-200' : 'bg-neutral-100 text-neutral-700 border-neutral-200'}`}>
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
                <TableRow className="bg-neutral-50 hover:bg-neutral-50">
                  <TableHead>Título</TableHead>
                  <TableHead>Área</TableHead>
                  <TableHead>Autor</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Data</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {institution.jobs.map((job) => (
                  <TableRow key={job.id} className="hover:bg-neutral-50/50">
                    <TableCell className="font-medium text-neutral-900">{job.title}</TableCell>
                    <TableCell className="text-neutral-500 text-sm">{job.area.name}</TableCell>
                    <TableCell className="text-neutral-500 text-sm">{job.author.firstName} {job.author.lastName}</TableCell>
                    <TableCell>
                      <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium border ${
                          job.status === 'published' ? 'bg-green-50 text-green-700 border-green-200' : 
                          job.status === 'draft' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' :
                          'bg-neutral-100 text-neutral-600 border-neutral-200'
                      }`}>
                        {job.status === 'published' ? 'Publicado' : job.status === 'draft' ? 'Rascunho' : job.status}
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