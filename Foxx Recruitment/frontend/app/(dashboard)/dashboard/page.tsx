'use client';

import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/context/AuthContext';
import { 
  Briefcase, MapPin, Calendar, Building, 
  ChevronRight, Loader2, Clock, CheckCircle2, XCircle, FileText,
  Search, Filter, TrendingUp
} from 'lucide-react';
import { JobDetailModal } from '@/components/JobDetailModal';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

// Interfaces
interface Job {
  id: number;
  title: string;
  description: string;
  status: string;
  createdAt: string;
  email: string;
  telephone: string;
  area: { name: string };
  category: { name: string };
  author: { firstName: string; lastName: string };
  companyName?: string | null;
  institution: { name: string };
}

interface Application {
    id: number;
    status: 'PENDING' | 'REVIEWING' | 'ACCEPTED' | 'REJECTED';
    createdAt: string;
    job: Job;
}

// Componente de Card de Estatística (Estilo consistente com Admin)
function StatCard({ 
    title, value, icon: Icon, color, description 
}: { 
    title: string; value: number; icon: any; color: 'blue' | 'green' | 'purple' | 'orange'; description: string 
}) {
    const themes = {
        blue: { bg: 'bg-blue-50', text: 'text-blue-600', ring: 'ring-blue-100' },
        green: { bg: 'bg-emerald-50', text: 'text-emerald-600', ring: 'ring-emerald-100' },
        purple: { bg: 'bg-purple-50', text: 'text-purple-600', ring: 'ring-purple-100' },
        orange: { bg: 'bg-orange-50', text: 'text-orange-600', ring: 'ring-orange-100' }
    };
    const theme = themes[color];

    return (
        <div className="bg-white p-5 rounded-xl border border-neutral-200 shadow-sm flex flex-col justify-between h-full hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start mb-4">
                <div className={`p-2.5 rounded-lg ${theme.bg} ${theme.text} ring-1 ${theme.ring}`}>
                    <Icon className="h-5 w-5" />
                </div>
                <span className="text-2xl font-bold text-neutral-900">{value}</span>
            </div>
            <div>
                <p className="text-sm font-medium text-neutral-900">{title}</p>
                <p className="text-xs text-neutral-500 mt-1">{description}</p>
            </div>
        </div>
    );
}

export default function DashboardPage() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [filteredApps, setFilteredApps] = useState<Application[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  
  // Filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Hooks para o Modal
  const [savedJobIds, setSavedJobIds] = useState<Set<number>>(new Set());
  const [isSaving, setIsSaving] = useState(false);

  const { token, user } = useAuth();

  useEffect(() => { 
      document.title = 'Minhas Candidaturas | FoxxRecruitment'; 
  }, []);

  // Fetch Candidaturas
  useEffect(() => {
    const fetchApplications = async () => {
        if (!token) {
            setIsLoading(false);
            return;
        }
        setIsLoading(true);
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/applications/my-applications`, { 
                headers: { Authorization: `Bearer ${token}` } 
            });

            if (res.ok) {
                const data = await res.json();
                setApplications(data);
                setFilteredApps(data);
            } else {
                toast.error('Não foi possível carregar suas candidaturas.');
            }

            const savedRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/saved-jobs/my-saved/ids`, { 
                headers: { Authorization: `Bearer ${token}` } 
            });
            if(savedRes.ok) setSavedJobIds(new Set(await savedRes.json()));

        } catch (err) { 
            toast.error('Erro de conexão.'); 
        } finally { 
            setIsLoading(false); 
        }
    };

    fetchApplications();
  }, [token]);

  // Lógica de Filtragem
  useEffect(() => {
    let result = applications;

    if (searchTerm) {
        const lower = searchTerm.toLowerCase();
        result = result.filter(app => 
            app.job.title.toLowerCase().includes(lower) || 
            app.job.companyName?.toLowerCase().includes(lower) ||
            app.job.institution.name.toLowerCase().includes(lower)
        );
    }

    if (statusFilter !== 'ALL') {
        result = result.filter(app => app.status === statusFilter);
    }

    setFilteredApps(result);
  }, [searchTerm, statusFilter, applications]);

  // Estatísticas
  const stats = useMemo(() => {
      return {
          total: applications.length,
          pending: applications.filter(a => a.status === 'PENDING').length,
          reviewing: applications.filter(a => a.status === 'REVIEWING').length,
          accepted: applications.filter(a => a.status === 'ACCEPTED').length,
      };
  }, [applications]);

  const handleToggleSaveJob = async (jobId: number) => {
    if (isSaving) return;
    setIsSaving(true);
    const isSaved = savedJobIds.has(jobId);
    try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/saved-jobs/${jobId}`, {
            method: isSaved ? 'DELETE' : 'POST',
            headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
            const newSet = new Set(savedJobIds);
            isSaved ? newSet.delete(jobId) : newSet.add(jobId);
            setSavedJobIds(newSet);
            toast.success(isSaved ? 'Removido dos salvos.' : 'Vaga salva!');
        }
    } catch { toast.error('Erro ao salvar.'); } 
    finally { setIsSaving(false); }
  };

  const getStatusConfig = (status: string) => {
      switch (status) {
          case 'ACCEPTED':
              return { label: 'Aprovado', color: 'bg-green-50 text-green-700 border-green-200', icon: CheckCircle2 };
          case 'REJECTED':
              return { label: 'Não Selecionado', color: 'bg-red-50 text-red-700 border-red-200', icon: XCircle };
          case 'REVIEWING':
              return { label: 'Em Análise', color: 'bg-blue-50 text-blue-700 border-blue-200', icon: FileText };
          default:
              return { label: 'Pendente', color: 'bg-yellow-50 text-yellow-700 border-yellow-200', icon: Clock };
      }
  };

  return (
    <div className="container mx-auto pb-20 max-w-6xl space-y-8">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-end gap-4">
        <div>
            <h1 className="text-3xl font-bold text-neutral-900 tracking-tight">Minhas Candidaturas</h1>
            <p className="text-neutral-500 mt-1">Gerencie seu progresso nos processos seletivos.</p>
        </div>
      </div>

      {/* Stats Grid */}
      {!isLoading && applications.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard 
                  title="Total Enviado" 
                  value={stats.total} 
                  icon={Briefcase} 
                  color="blue" 
                  description="Candidaturas ativas"
              />
              <StatCard 
                  title="Em Análise" 
                  value={stats.reviewing} 
                  icon={TrendingUp} 
                  color="purple" 
                  description="Visualizadas pelo recrutador"
              />
               <StatCard 
                  title="Pendentes" 
                  value={stats.pending} 
                  icon={Clock} 
                  color="orange" 
                  description="Aguardando revisão"
              />
              <StatCard 
                  title="Aprovados" 
                  value={stats.accepted} 
                  icon={CheckCircle2} 
                  color="green" 
                  description="Chamados para entrevista"
              />
          </div>
      )}

      {/* Filtros */}
      <div className="bg-white p-4 rounded-xl border border-neutral-200 shadow-sm flex flex-col md:flex-row gap-4 items-center">
         <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-neutral-400" />
            <Input 
                placeholder="Buscar vaga ou empresa..." 
                className="pl-9 bg-neutral-50 border-neutral-200"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
            />
         </div>
         <div className="w-full md:w-48">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="bg-neutral-50 border-neutral-200">
                    <div className="flex items-center gap-2 text-neutral-600">
                        <Filter className="h-4 w-4" />
                        <SelectValue placeholder="Status" />
                    </div>
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="ALL">Todos</SelectItem>
                    <SelectItem value="PENDING">Pendentes</SelectItem>
                    <SelectItem value="REVIEWING">Em Análise</SelectItem>
                    <SelectItem value="ACCEPTED">Aprovados</SelectItem>
                    <SelectItem value="REJECTED">Encerrados</SelectItem>
                </SelectContent>
            </Select>
         </div>
      </div>

      {/* Lista de Candidaturas */}
      {isLoading ? (
        <div className="flex flex-col gap-4">
            {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-32 bg-white animate-pulse rounded-xl border border-neutral-200" />
            ))}
        </div>
      ) : filteredApps.length > 0 ? (
        <div className="grid grid-cols-1 gap-4">
          {filteredApps.map((app) => {
            const statusConfig = getStatusConfig(app.status);
            const StatusIcon = statusConfig.icon;

            return (
                <div 
                    key={app.id} 
                    className="group bg-white rounded-xl border border-neutral-200 p-6 hover:shadow-md transition-all duration-200 relative flex flex-col md:flex-row items-start md:items-center gap-6"
                >
                    {/* Icone da Vaga/Empresa */}
                    <div className="hidden md:flex h-14 w-14 rounded-lg bg-neutral-100 items-center justify-center shrink-0 text-neutral-500 group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">
                        <Building className="h-7 w-7" />
                    </div>

                    <div className="flex-1 min-w-0 w-full">
                        <div className="flex flex-wrap items-center gap-2 mb-2">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${statusConfig.color}`}>
                                <StatusIcon className="w-3 h-3 mr-1" />
                                {statusConfig.label}
                            </span>
                            <span className="text-xs text-neutral-400 flex items-center">
                                <Calendar className="w-3 h-3 mr-1" />
                                {new Date(app.createdAt).toLocaleDateString('pt-BR')}
                            </span>
                        </div>

                        <h3 className="text-lg font-bold text-neutral-900 mb-1 truncate group-hover:text-blue-600 transition-colors">
                            {app.job.title}
                        </h3>

                        <div className="flex flex-wrap gap-y-1 gap-x-4 text-sm text-neutral-500">
                            <span className="flex items-center gap-1">
                                <Building className="h-3.5 w-3.5" />
                                {app.job.companyName || app.job.institution.name}
                            </span>
                            <span className="hidden md:inline text-neutral-300">•</span>
                            <span className="flex items-center gap-1">
                                <MapPin className="h-3.5 w-3.5" />
                                {app.job.area.name}
                            </span>
                            <span className="hidden md:inline text-neutral-300">•</span>
                            <span className="flex items-center gap-1">
                                <Briefcase className="h-3.5 w-3.5" />
                                {app.job.category.name}
                            </span>
                        </div>
                    </div>

                    <div className="w-full md:w-auto flex justify-end">
                        <Button 
                            variant="ghost" 
                            onClick={() => setSelectedJob(app.job)}
                            className="text-neutral-500 hover:text-blue-600 hover:bg-blue-50 w-full md:w-auto justify-center md:justify-start"
                        >
                            Ver Detalhes <ChevronRight className="w-4 h-4 ml-1" />
                        </Button>
                    </div>
                </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-24 bg-white rounded-xl border border-neutral-200 border-dashed">
            <div className="bg-neutral-50 h-20 w-20 rounded-full flex items-center justify-center mx-auto mb-6">
                <FileText className="h-10 w-10 text-neutral-300" />
            </div>
            <h3 className="text-xl font-semibold text-neutral-900">Nenhuma candidatura encontrada</h3>
            <p className="text-neutral-500 mt-2 mb-8 max-w-md mx-auto">
                {searchTerm || statusFilter !== 'ALL' 
                    ? 'Tente ajustar os filtros para encontrar o que procura.' 
                    : 'Você ainda não se candidatou a nenhuma vaga.'}
            </p>
            {(searchTerm || statusFilter !== 'ALL') && (
                <Button variant="outline" onClick={() => { setSearchTerm(''); setStatusFilter('ALL'); }}>
                    Limpar Filtros
                </Button>
            )}
        </div>
      )}

      {/* Modal de Detalhes */}
      {selectedJob && (
        <JobDetailModal
            job={selectedJob}
            isOpen={!!selectedJob}
            onClose={() => setSelectedJob(null)}
            isSaved={savedJobIds.has(selectedJob.id)}
            onToggleSave={(id) => handleToggleSaveJob(id)}
            isSaving={isSaving}
        />
      )}
    </div>
  );
}