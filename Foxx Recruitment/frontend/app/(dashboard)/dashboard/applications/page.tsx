"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';
import { 
  Briefcase, Calendar, Building, Loader2, 
  ExternalLink, Trash2, AlertTriangle, Eye 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import Link from 'next/link';
import { JobDetailModal } from '@/components/JobDetailModal'; // Importando o modal

// Interface expandida para suportar o Modal
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
  job: Job; // Usando a interface completa
}

const API_URL = `${process.env.NEXT_PUBLIC_API_URL}/applications`;

export default function MyApplicationsPage() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Estados para o Cancelamento
  const [appToCancel, setAppToCancel] = useState<number | null>(null);
  const [isCanceling, setIsCanceling] = useState(false);

  // Estados para o Modal de Detalhes
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [savedJobIds, setSavedJobIds] = useState<Set<number>>(new Set());
  const [isSaving, setIsSaving] = useState(false);

  const { token } = useAuth();

  useEffect(() => {
    document.title = 'Minhas Candidaturas | Decola Vagas';
    if (token) {
        fetchData();
    }
  }, [token]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [appRes, savedRes] = await Promise.all([
        fetch(`${API_URL}/my-applications`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/saved-jobs/my-saved/ids`, { headers: { Authorization: `Bearer ${token}` } })
      ]);

      if (appRes.ok) {
        setApplications(await appRes.json());
      }
      if (savedRes.ok) {
        setSavedJobIds(new Set(await savedRes.json()));
      }
    } catch (error) {
      toast.error('Erro de rede.');
    } finally {
      setIsLoading(false);
    }
  };

  // Lógica de Salvar/Remover Favorito (Reutilizada do Dashboard)
  const handleToggleSaveJob = async (jobId: number) => {
    if (isSaving || !token) return;
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

  const handleCancelApplication = async () => {
    if (!token || !appToCancel) return;
    
    setIsCanceling(true);
    try {
        const res = await fetch(`${API_URL}/${appToCancel}`, {
            method: 'DELETE',
            headers: { Authorization: `Bearer ${token}` }
        });

        if (res.ok || res.status === 204) {
            toast.success("Candidatura cancelada com sucesso.");
            setApplications(prev => prev.filter(app => app.id !== appToCancel));
            setAppToCancel(null);
        } else {
            const data = await res.json();
            toast.error(data.error || "Erro ao cancelar.");
        }
    } catch (error) {
        toast.error("Erro de rede.");
    } finally {
        setIsCanceling(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      PENDING: "bg-yellow-50 text-yellow-700 border-yellow-200",
      REVIEWING: "bg-blue-50 text-blue-700 border-blue-200",
      ACCEPTED: "bg-green-50 text-green-700 border-green-200",
      REJECTED: "bg-red-50 text-red-700 border-red-200"
    };
    const labels = {
      PENDING: "Pendente",
      REVIEWING: "Em Análise",
      ACCEPTED: "Aprovado",
      REJECTED: "Não Selecionado"
    };
    // @ts-ignore
    return <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium border ${styles[status] || styles.PENDING}`}>{labels[status] || status}</span>;
  };

  if (isLoading) return <div className="flex justify-center h-64 items-center"><Loader2 className="animate-spin text-blue-600" /></div>;

  return (
    <div className="container mx-auto pb-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-neutral-900 tracking-tight">Histórico de Candidaturas</h1>
        <p className="text-neutral-500 mt-1">Acompanhe o status das vagas que você se aplicou.</p>
      </div>

      {applications.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-xl border border-dashed border-neutral-200">
            <Briefcase className="h-12 w-12 text-neutral-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-neutral-900">Nenhuma candidatura ainda</h3>
            <p className="text-neutral-500 mt-1 mb-6">Você ainda não se aplicou para nenhuma vaga.</p>
            <Button asChild className="bg-blue-600 hover:bg-blue-700">
                <Link href="/dashboard">Encontrar Vagas</Link>
            </Button>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-neutral-200 overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                    <thead className="bg-neutral-50 border-b border-neutral-100 text-neutral-500 uppercase text-xs">
                        <tr>
                            <th className="px-6 py-4 font-medium">Vaga</th>
                            <th className="px-6 py-4 font-medium">Instituição</th>
                            <th className="px-6 py-4 font-medium">Data</th>
                            <th className="px-6 py-4 font-medium">Status</th>
                            <th className="px-6 py-4 text-right">Ações</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-100">
                        {applications.map((app) => (
                            <tr key={app.id} className="hover:bg-neutral-50/50 transition-colors">
                                <td className="px-6 py-4 font-medium text-neutral-900">
                                    {app.job.title}
                                    <div className="text-xs text-neutral-500 font-normal mt-0.5">{app.job.area.name}</div>
                                </td>
                                <td className="px-6 py-4 text-neutral-600">
                                    <div className="flex items-center gap-2">
                                        <Building className="h-3.5 w-3.5 text-neutral-400" />
                                        {app.job.institution.name}
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-neutral-500">
                                    <div className="flex items-center gap-2">
                                        <Calendar className="h-3.5 w-3.5 text-neutral-400" />
                                        {new Date(app.createdAt).toLocaleDateString()}
                                    </div>
                                </td>
                                <td className="px-6 py-4">{getStatusBadge(app.status)}</td>
                                <td className="px-6 py-4 text-right">
                                    <div className="flex justify-end items-center gap-2">
                                        {/* Botão Ver Vaga (Agora abre o Modal) */}
                                        <Button 
                                            variant="ghost" 
                                            size="sm" 
                                            className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 h-8"
                                            onClick={() => setSelectedJob(app.job)}
                                        ><Eye className="ml-2 h-3.5 w-3.5" />
                                        </Button>
                                        
                                        {/* Botão Cancelar */}
                                        {app.status === 'PENDING' && (
                                            <Button 
                                                variant="ghost" 
                                                size="sm" 
                                                className="text-neutral-400 hover:text-red-600 hover:bg-red-50 h-8 w-8 p-0"
                                                onClick={() => setAppToCancel(app.id)}
                                                title="Cancelar Candidatura"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
      )}

      {/* DIÁLOGO DE CONFIRMAÇÃO DE CANCELAMENTO */}
      <AlertDialog open={!!appToCancel} onOpenChange={(open) => !open && setAppToCancel(null)}>
        <AlertDialogContent>
            <AlertDialogHeader>
                <AlertDialogTitle className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-red-600" />
                    Cancelar Candidatura?
                </AlertDialogTitle>
                <AlertDialogDescription>
                    Você tem certeza que deseja cancelar sua candidatura para esta vaga? 
                    <br/>Isso removerá seu perfil da lista de candidatos do recrutador.
                </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
                <AlertDialogCancel disabled={isCanceling}>Voltar</AlertDialogCancel>
                <AlertDialogAction 
                    onClick={(e) => { e.preventDefault(); handleCancelApplication(); }} 
                    disabled={isCanceling}
                    className="bg-red-600 hover:bg-red-700 text-white"
                >
                    {isCanceling ? <Loader2 className="h-4 w-4 animate-spin mr-2"/> : null}
                    Confirmar Cancelamento
                </AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* MODAL DE DETALHES DA VAGA */}
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