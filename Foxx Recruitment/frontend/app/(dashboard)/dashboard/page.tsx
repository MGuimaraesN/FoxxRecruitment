'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { 
  Briefcase, MapPin, Calendar, Building, 
  ChevronRight, Loader2, Clock, CheckCircle2, XCircle, FileText 
} from 'lucide-react';
import { JobDetailModal } from '@/components/JobDetailModal';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';

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

export default function DashboardPage() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  
  // Hooks para o Modal (Salvar vaga é opcional aqui, mas mantemos a compatibilidade)
  const [savedJobIds, setSavedJobIds] = useState<Set<number>>(new Set());
  const [isSaving, setIsSaving] = useState(false);

  const { token } = useAuth();

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
            } else {
                toast.error('Não foi possível carregar suas candidaturas.');
            }

            // Carrega salvos apenas para manter o estado do modal correto se abrir
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

  // Função mock para salvar (caso clique no modal)
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
              return { label: 'Aprovado', color: 'bg-green-100 text-green-700 border-green-200', icon: CheckCircle2 };
          case 'REJECTED':
              return { label: 'Não Selecionado', color: 'bg-red-100 text-red-700 border-red-200', icon: XCircle };
          case 'REVIEWING':
              return { label: 'Em Análise', color: 'bg-blue-100 text-blue-700 border-blue-200', icon: FileText };
          default:
              return { label: 'Pendente', color: 'bg-yellow-100 text-yellow-700 border-yellow-200', icon: Clock };
      }
  };

  return (
    <div className="container mx-auto pb-20 max-w-5xl">
      
      {/* Header da Página */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-neutral-900 tracking-tight">Status das Candidaturas</h1>
        <p className="text-neutral-500 mt-2">Acompanhe o andamento dos seus processos seletivos em tempo real.</p>
      </div>

      {/* Lista de Candidaturas */}
      {isLoading ? (
        <div className="flex flex-col gap-4">
            {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-32 bg-neutral-100 animate-pulse rounded-xl border border-neutral-200" />
            ))}
        </div>
      ) : applications.length > 0 ? (
        <div className="grid grid-cols-1 gap-4">
          {applications.map((app) => {
            const statusConfig = getStatusConfig(app.status);
            const StatusIcon = statusConfig.icon;

            return (
                <div 
                    key={app.id} 
                    className="group bg-white rounded-xl border border-neutral-200 p-6 hover:shadow-md transition-all duration-300 relative flex flex-col sm:flex-row sm:items-center justify-between gap-6"
                >
                    {/* Linha Vertical de Status */}
                    <div className={`absolute left-0 top-0 bottom-0 w-1.5 rounded-l-xl ${statusConfig.color.split(' ')[0].replace('bg-', 'bg-')}`}></div>

                    <div className="flex-1 pl-2">
                        <div className="flex flex-wrap items-center gap-3 mb-2">
                            <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${statusConfig.color}`}>
                                <StatusIcon className="w-3.5 h-3.5 mr-1.5" />
                                {statusConfig.label}
                            </span>
                            <span className="text-xs text-neutral-400 flex items-center">
                                <Calendar className="w-3.5 h-3.5 mr-1" />
                                Aplicado em {new Date(app.createdAt).toLocaleDateString()}
                            </span>
                        </div>

                        <h3 className="text-lg font-bold text-neutral-900 mb-1">
                            {app.job.title}
                        </h3>

                        <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-neutral-500">
                            <div className="flex items-center">
                                <Building className="h-4 w-4 mr-1.5 text-neutral-400" />
                                <span className="font-medium text-neutral-700">{app.job.companyName || app.job.institution.name}</span>
                            </div>
                            <div className="flex items-center">
                                <MapPin className="h-4 w-4 mr-1.5 text-neutral-400" />
                                <span>{app.job.area.name}</span>
                            </div>
                            <div className="flex items-center">
                                <Briefcase className="h-4 w-4 mr-1.5 text-neutral-400" />
                                <span>{app.job.category.name}</span>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center sm:self-center pt-4 sm:pt-0 border-t sm:border-t-0 border-neutral-100 w-full sm:w-auto">
                        <Button 
                            variant="outline" 
                            onClick={() => setSelectedJob(app.job)}
                            className="w-full sm:w-auto group-hover:border-blue-300 group-hover:text-blue-600 transition-colors"
                        >
                            Ver Detalhes <ChevronRight className="w-4 h-4 ml-2" />
                        </Button>
                    </div>
                </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-24 bg-white rounded-xl border border-neutral-200 border-dashed">
            <div className="bg-neutral-50 h-20 w-20 rounded-full flex items-center justify-center mx-auto mb-6">
                <FileText className="h-10 w-10 text-neutral-400" />
            </div>
            <h3 className="text-xl font-semibold text-neutral-900">Nenhuma candidatura encontrada</h3>
            <p className="text-neutral-500 mt-2 mb-8 max-w-md mx-auto">
                Você ainda não se candidatou a nenhuma vaga. Entre em contato com sua instituição para saber sobre novas oportunidades.
            </p>
        </div>
      )}

      {/* Modal de Detalhes (Apenas Visualização para o candidato já aplicado) */}
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