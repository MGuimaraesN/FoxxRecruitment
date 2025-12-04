'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';
import { JobDetailModal } from '@/components/JobDetailModal';
import { Briefcase, MapPin, Clock, Building, Bookmark, Search, Calendar, ChevronRight, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

// Interfaces
interface Job {
  id: number;
  title: string;
  description: string;
  status: string;
  area: { name: string };
  category: { name: string };
  companyName?: string | null;
  institution: { name: string };
  createdAt: string;
  email: string;
  telephone: string;
  author: { firstName: string; lastName: string };
}

const API_URL = `${process.env.NEXT_PUBLIC_API_URL}/saved-jobs/my-saved`;

export default function SavedJobsPage() {
  const [savedJobs, setSavedJobs] = useState<Job[]>([]);
  const [filteredJobs, setFilteredJobs] = useState<Job[]>([]);
  const [search, setSearch] = useState('');
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  
  const { token } = useAuth();

  useEffect(() => {
    document.title = 'Vagas Salvas | Decola Vagas';
  }, []);
  
  useEffect(() => {
    const fetchSavedJobs = async () => {
      if (!token) {
        setIsLoading(false);
        return;
      }
      setIsLoading(true);
      try {
        const res = await fetch(API_URL, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          setSavedJobs(data);
          setFilteredJobs(data);
        } else {
          toast.error('Falha ao buscar vagas salvas.');
        }
      } catch (error) {
        toast.error('Erro de rede ao buscar vagas salvas.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchSavedJobs();
  }, [token]);

  // Filtro local
  useEffect(() => {
    const lower = search.toLowerCase();
    setFilteredJobs(savedJobs.filter(j => 
        j.title.toLowerCase().includes(lower) || 
        j.institution.name.toLowerCase().includes(lower) ||
        (j.companyName && j.companyName.toLowerCase().includes(lower))
    ));
  }, [search, savedJobs]);

  const handleUnsaveJob = async (jobId: number, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (isSaving || !token) return;
    
    // Confirmação visual rápida (otimista) pode ser perigosa se falhar, 
    // mas aqui vamos esperar a request para evitar inconsistência.
    setIsSaving(true);

    try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/saved-jobs/${jobId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
        });

        if (res.ok) {
        toast.success('Vaga removida dos favoritos.');
        setSavedJobs(prev => prev.filter(j => j.id !== jobId));
        if (selectedJob?.id === jobId) setSelectedJob(null);
        } else {
        toast.error('Falha ao remover vaga.');
        }
    } catch (error) {
        toast.error('Erro de rede.');
    } finally {
        setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
        <div className="flex h-64 items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        </div>
    );
  }

  return (
    <div className="container mx-auto pb-10 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
            <h1 className="text-3xl font-bold text-neutral-900 tracking-tight">Meus Favoritos</h1>
            <p className="text-neutral-500 mt-1">Gerencie as oportunidades que você salvou.</p>
        </div>
        
        {savedJobs.length > 0 && (
            <div className="relative w-full md:w-72">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-neutral-400" />
                <Input 
                    placeholder="Filtrar vagas salvas..." 
                    className="pl-9 bg-white border-neutral-200"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />
            </div>
        )}
      </div>

      {savedJobs.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 bg-white rounded-xl border border-dashed border-neutral-200 text-center">
            <div className="h-16 w-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mb-4">
                <Bookmark className="h-8 w-8" />
            </div>
            <h2 className="text-xl font-semibold text-neutral-900">Nenhuma vaga salva ainda</h2>
            <p className="text-neutral-500 max-w-md mt-2 mb-6">
                Você ainda não salvou nenhuma oportunidade. Navegue pelo mural e clique no ícone de salvar para guardar as vagas que te interessam.
            </p>
            <Button asChild className="bg-blue-600 hover:bg-blue-700">
                <Link href="/dashboard">Ir para o Mural</Link>
            </Button>
        </div>
      ) : filteredJobs.length === 0 ? (
        <div className="text-center py-12 text-neutral-500">
            Nenhuma vaga encontrada com o termo "{search}".
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredJobs.map((job) => (
            <div 
                key={job.id} 
                onClick={() => setSelectedJob(job)}
                className="group bg-white rounded-xl border border-neutral-200 p-6 cursor-pointer hover:shadow-lg hover:border-blue-200 transition-all duration-300 relative flex flex-col justify-between"
            >
                {/* Botão Remover (Destaque Vermelho no Hover) */}
                <div className="absolute top-4 right-4 z-10">
                    <button 
                        onClick={(e) => handleUnsaveJob(job.id, e)} 
                        className="p-2 rounded-full bg-blue-50 text-blue-600 hover:bg-red-50 hover:text-red-600 transition-colors shadow-sm"
                        title="Remover dos favoritos"
                        disabled={isSaving}
                    >
                        <Bookmark className="h-5 w-5 fill-current" />
                    </button>
                </div>

                <div>
                    <div className="mb-4 pr-8">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium bg-purple-50 text-purple-700 mb-2 border border-purple-100">
                            {job.category.name}
                        </span>
                        <h3 className="text-lg font-bold text-neutral-900 group-hover:text-blue-600 transition-colors line-clamp-2">
                            {job.title}
                        </h3>
                        <div className="flex items-center text-sm text-neutral-500 mt-1">
                            <Building className="h-3.5 w-3.5 mr-1.5" />
                            <span className="truncate">{job.companyName || job.institution.name}</span>
                        </div>
                    </div>

                    <div className="space-y-2 mb-6">
                        <div className="flex items-center text-xs text-neutral-500 bg-neutral-50 p-2 rounded-md">
                            <MapPin className="h-3.5 w-3.5 mr-2 text-neutral-400" />
                            <span className="truncate">{job.area.name}</span>
                        </div>
                        <div className="flex items-center text-xs text-neutral-500 bg-neutral-50 p-2 rounded-md">
                            <Calendar className="h-3.5 w-3.5 mr-2 text-neutral-400" />
                            <span>Salvo em {new Date(job.createdAt).toLocaleDateString()}</span>
                        </div>
                    </div>
                </div>

                <div className="pt-4 border-t border-neutral-100 flex justify-between items-center">
                    <span className="text-xs font-medium text-neutral-400">Ver detalhes</span>
                    <div className="h-8 w-8 rounded-full bg-neutral-100 flex items-center justify-center text-neutral-600 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                        <ChevronRight className="h-4 w-4" />
                    </div>
                </div>
            </div>
          ))}
        </div>
      )}
      
      {selectedJob && (
        <JobDetailModal
            job={selectedJob}
            isOpen={!!selectedJob}
            onClose={() => setSelectedJob(null)}
            isSaved={true}
            onToggleSave={(id) => handleUnsaveJob(id)}
            isSaving={isSaving}
        />
      )}
    </div>
  );
}