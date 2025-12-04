'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { 
  ChevronLeft, Building, 
  Briefcase, CheckCircle, XCircle, FileText, MapPin,
  Linkedin, Github, Globe, User, GraduationCap, Loader2, Eye 
} from 'lucide-react';
// 1. IMPORTAR O HOOK
import { useBreadcrumb } from '@/components/ui/breadcrumbs';
import Link from 'next/link';

interface ApplicationDetail {
  id: number;
  status: 'PENDING' | 'REVIEWING' | 'ACCEPTED' | 'REJECTED';
  createdAt: string;
  resumeUrl: string | null;
  user: {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
    avatarUrl: string | null;
    resumeUrl: string | null;
    bio: string | null;
    linkedinUrl: string | null;
    githubUrl: string | null;
    portfolioUrl: string | null;
    course: string | null;
    graduationYear: number | null;
  };
  job: {
    id: number;
    title: string;
    description: string;
    institution: { name: string };
    area: { name: string };
    category: { name: string };
  };
}

export default function ApplicationDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { token } = useAuth();
  const [app, setApp] = useState<ApplicationDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  // 2. USAR O HOOK
  const { setCustomLabel } = useBreadcrumb();

  const fetchDetails = async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/applications/manage/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setApp(data);
        
        // 3. DEFINIR O NOME NO BREADCRUMB
        // Aqui usamos o nome do candidato para substituir o ID na navegação
        if (data.user) {
            setCustomLabel(String(id), `${data.user.firstName} ${data.user.lastName}`);
        }
      } else {
        toast.error('Erro ao carregar detalhes.');
        router.push('/admin/applications');
      }
    } catch (error) {
      toast.error('Erro de rede.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token && id) fetchDetails();
  }, [token, id]); // Adicionei fetchDetails implícito nas deps ou ignore se preferir o padrão anterior

  const handleStatusChange = async (newStatus: string) => {
    setUpdating(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/applications/manage/${id}/status`, {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({ status: newStatus })
      });

      if (res.ok) {
        toast.success(`Status alterado para ${newStatus}`);
        fetchDetails(); 
      } else {
        toast.error('Erro ao atualizar.');
      }
    } catch {
      toast.error('Erro de rede.');
    } finally {
      setUpdating(false);
    }
  };

  if (loading) return <div className="flex h-screen items-center justify-center"><Loader2 className="animate-spin text-blue-600 h-8 w-8" /></div>;
  if (!app) return null;

  const resumeLink = app.resumeUrl || app.user.resumeUrl;

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-20">
      {/* Header com Botão Voltar */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => router.back()} className="pl-0 text-neutral-500 hover:text-neutral-900 px-0">
            <ChevronLeft className="h-4 w-4 mr-1" /> Voltar
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* COLUNA ESQUERDA: Perfil do Candidato */}
        <div className="lg:col-span-2 space-y-6">
            
            {/* Card Principal do Candidato */}
            <div className="bg-white rounded-xl shadow-sm border border-neutral-200 overflow-hidden">
                <div className="p-6 md:p-8 border-b border-neutral-100 flex flex-col md:flex-row gap-6 items-center md:items-start">
                    <div className="h-24 w-24 rounded-full bg-neutral-100 overflow-hidden shrink-0 border-2 border-white shadow-sm">
                        {app.user.avatarUrl ? (
                            <img src={`${process.env.NEXT_PUBLIC_API_URL}${app.user.avatarUrl}`} className="h-full w-full object-cover" alt="Avatar" />
                        ) : (
                            <div className="h-full w-full flex items-center justify-center text-neutral-400">
                                <User className="h-10 w-10" />
                            </div>
                        )}
                    </div>
                    <div className="text-center md:text-left flex-1">
                        <h1 className="text-2xl font-bold text-neutral-900">{app.user.firstName} {app.user.lastName}</h1>
                        <p className="text-neutral-500 mb-4">{app.user.email}</p>
                        
                        <div className="flex flex-wrap justify-center md:justify-start gap-2">
                            {app.user.linkedinUrl && (
                                <Button variant="outline" size="sm" asChild className="h-8 text-xs">
                                    <a href={app.user.linkedinUrl} target="_blank" rel="noopener noreferrer"><Linkedin className="h-3 w-3 mr-2 text-[#0077b5]" /> LinkedIn</a>
                                </Button>
                            )}
                            {app.user.githubUrl && (
                                <Button variant="outline" size="sm" asChild className="h-8 text-xs">
                                    <a href={app.user.githubUrl} target="_blank" rel="noopener noreferrer"><Github className="h-3 w-3 mr-2 text-neutral-800" /> GitHub</a>
                                </Button>
                            )}
                            {app.user.portfolioUrl && (
                                <Button variant="outline" size="sm" asChild className="h-8 text-xs">
                                    <a href={app.user.portfolioUrl} target="_blank" rel="noopener noreferrer"><Globe className="h-3 w-3 mr-2 text-emerald-600" /> Portfólio</a>
                                </Button>
                            )}
                        </div>
                    </div>
                </div>
                
                <div className="p-6 md:p-8 bg-neutral-50/50">
                    <h3 className="font-semibold text-neutral-900 mb-3 flex items-center gap-2">
                        <GraduationCap className="h-4 w-4 text-blue-600" /> Formação Acadêmica
                    </h3>
                    <div className="bg-white p-4 rounded-lg border border-neutral-200">
                        <p className="font-medium text-neutral-900">{app.user.course || 'Curso não informado'}</p>
                        {app.user.graduationYear && (
                            <p className="text-sm text-neutral-500 mt-1">Previsão de formatura: {app.user.graduationYear}</p>
                        )}
                    </div>

                    {app.user.bio && (
                        <div className="mt-6">
                            <h3 className="font-semibold text-neutral-900 mb-3">Sobre o Candidato</h3>
                            <p className="text-sm text-neutral-600 leading-relaxed whitespace-pre-wrap">{app.user.bio}</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Currículo */}
            <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-6">
                <h3 className="font-semibold text-neutral-900 mb-4 flex items-center gap-2">
                    <FileText className="h-4 w-4 text-blue-600" /> Currículo (PDF)
                </h3>
                {resumeLink ? (
                    <div className="h-[600px] w-full bg-neutral-100 rounded-lg border border-neutral-200 overflow-hidden">
                        <iframe 
                            src={`${process.env.NEXT_PUBLIC_API_URL}${resumeLink}`} 
                            className="w-full h-full"
                            title="Currículo do Candidato"
                        />
                    </div>
                ) : (
                    <div className="text-center py-10 bg-neutral-50 rounded-lg border border-dashed border-neutral-200 text-neutral-500">
                        O candidato não anexou um currículo PDF.
                    </div>
                )}
            </div>
        </div>

        {/* COLUNA DIREITA: Contexto e Ações */}
        <div className="space-y-6">
            
            {/* Status e Ações */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-neutral-200 sticky top-6">
                <h3 className="font-semibold text-neutral-900 mb-4">Gerenciar Candidatura</h3>
                
                <div className="mb-6">
                    <span className="text-xs text-neutral-500 uppercase tracking-wider font-bold">Status Atual</span>
                    <div className={`mt-2 inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border w-full justify-center
                        ${app.status === 'ACCEPTED' ? 'bg-green-50 text-green-700 border-green-200' : 
                          app.status === 'REJECTED' ? 'bg-red-50 text-red-700 border-red-200' : 
                          'bg-yellow-50 text-yellow-700 border-yellow-200'}`
                    }>
                        {app.status === 'ACCEPTED' ? 'Aprovado' : app.status === 'REJECTED' ? 'Rejeitado' : app.status === 'REVIEWING' ? 'Em Análise' : 'Pendente'}
                    </div>
                </div>

                <div className="space-y-3">
                    <Button 
                        onClick={() => handleStatusChange('ACCEPTED')} 
                        disabled={updating || app.status === 'ACCEPTED'}
                        className="w-full bg-green-600 hover:bg-green-700 text-white"
                    >
                        {updating ? <Loader2 className="h-4 w-4 animate-spin"/> : <CheckCircle className="h-4 w-4 mr-2" />}
                        Aprovar Candidato
                    </Button>
                    
                    <Button 
                        onClick={() => handleStatusChange('REVIEWING')} 
                        disabled={updating || app.status === 'REVIEWING'}
                        variant="outline"
                        className="w-full border-blue-200 text-blue-700 hover:bg-blue-50"
                    >
                        Marcar em Análise
                    </Button>

                    <Button 
                        onClick={() => handleStatusChange('REJECTED')} 
                        disabled={updating || app.status === 'REJECTED'}
                        variant="outline"
                        className="w-full border-red-200 text-red-700 hover:bg-red-50"
                    >
                        <XCircle className="h-4 w-4 mr-2" />
                        Rejeitar
                    </Button>
                </div>

                <div className="mt-6 pt-6 border-t border-neutral-100">
                    <p className="text-xs text-neutral-400 text-center">
                        Candidatura realizada em <br/>
                        {new Date(app.createdAt).toLocaleDateString('pt-BR')} às {new Date(app.createdAt).toLocaleTimeString('pt-BR')}
                    </p>
                </div>
            </div>

            {/* Resumo da Vaga */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-neutral-200">
                <h3 className="font-semibold text-neutral-900 mb-4">Sobre a Vaga</h3>
                <h4 className="font-bold text-lg text-blue-600 mb-1">{app.job.title}</h4>
                <div className="flex items-center text-sm text-neutral-500 mb-4">
                    <Building className="h-3.5 w-3.5 mr-1" /> {app.job.institution.name}
                </div>

                <div className="space-y-2 text-sm text-neutral-600">
                    <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-neutral-400" /> {app.job.area.name}
                    </div>
                    <div className="flex items-center gap-2">
                        <Briefcase className="h-4 w-4 text-neutral-400" /> {app.job.category.name}
                    </div>
                </div>
                
                {/* Botão Ver Vaga */}
                <Button variant="ghost" className="mt-4 w-full justify-start pl-0 text-blue-600 hover:text-blue-700" asChild>
                    <Link href={`/admin/jobs/edit/${app.job.id}`} target="_blank">
                        <Eye className="h-4 w-4 mr-2" /> Ver vaga original
                    </Link>
                </Button>
            </div>

        </div>
      </div>
    </div>
  );
}