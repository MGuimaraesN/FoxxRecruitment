"use client";

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Briefcase, MapPin, Mail, Phone, User, Clock, 
  Building, Bookmark, CheckCircle2, Loader2, FileText, UploadCloud 
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';

// --- Interfaces ---
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

interface JobDetailModalProps {
  job: Job | null;
  isOpen: boolean;
  onClose: () => void;
  isSaved: boolean;
  onToggleSave: (jobId: number) => void;
  isSaving: boolean;
}

export const JobDetailModal = ({ job, isOpen, onClose, isSaved, onToggleSave, isSaving }: JobDetailModalProps) => {
  const { token, user, fetchUserProfile } = useAuth(); // fetchUserProfile necessário para atualizar o estado após upload
  
  // States de UI e Lógica
  const [isApplying, setIsApplying] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [hasApplied, setHasApplied] = useState(false);
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [isLoadingStatus, setIsLoadingStatus] = useState(false);

  // Verifica se o usuário (do contexto) já tem currículo
  // Uso (user as any) temporário caso a interface User ainda não tenha resumeUrl tipada
  const userHasResume = (user as any)?.resumeUrl;

  // 1. Verifica status da candidatura ao abrir
  useEffect(() => {
    const checkApplicationStatus = async () => {
        if (!token || !job || !isOpen) return;

        setIsLoadingStatus(true);
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/applications/my-applications`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (res.ok) {
                const myApplications = await res.json();
                const alreadyApplied = myApplications.some((app: any) => app.jobId === job.id);
                setHasApplied(alreadyApplied);
            }
        } catch (error) {
            console.error("Erro ao verificar status da candidatura", error);
        } finally {
            setIsLoadingStatus(false);
        }
    };

    checkApplicationStatus();
    // Resetar o arquivo ao abrir modal nova
    setResumeFile(null);
  }, [job, isOpen, token]);

  // 2. Lógica Unificada de Candidatura + Upload
  const handleApply = async () => {
    if (!token || !job) {
        toast.error("Você precisa estar logado para se candidatar.");
        return;
    }

    // Validação: Se não tem CV no perfil E não selecionou arquivo
    if (!userHasResume && !resumeFile) {
        toast.error("Por favor, anexe seu currículo (PDF) para continuar.");
        return;
    }

    setIsApplying(true);
    try {
        // Passo A: Se tiver arquivo novo, faz upload primeiro
        if (resumeFile) {
            setIsUploading(true);
            const formData = new FormData();
            formData.append('resume', resumeFile);
            
            const uploadRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/profile/resume`, {
                method: 'POST', 
                headers: { 'Authorization': `Bearer ${token}` }, 
                body: formData
            });

            if (!uploadRes.ok) throw new Error('Falha no upload do currículo');
            
            // Atualiza o contexto global para o React saber que agora o user tem currículo
            await fetchUserProfile(); 
            setIsUploading(false);
        }

        // Passo B: Aplica para a vaga
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/applications/apply`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ jobId: job.id })
        });

        const json = await res.json();

        if (res.ok) {
            toast.success("Candidatura enviada com sucesso!");
            setHasApplied(true);
            setResumeFile(null); // Limpa input
        } else if (res.status === 409) {
            toast.info("Você já se candidatou para esta vaga.");
            setHasApplied(true);
        } else {
            toast.error(json.error || "Erro ao se candidatar.");
        }
    } catch (error) {
        toast.error("Erro no processo de candidatura.");
    } finally {
        setIsApplying(false);
        setIsUploading(false);
    }
  };

  if (!job) return null;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit', month: '2-digit', year: 'numeric',
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="!max-w-4xl w-full max-h-[90vh] overflow-y-auto p-0 gap-0 border-0">
        
        {/* --- HEADER (Visual do Original) --- */}
        <div className="bg-neutral-50 border-b border-neutral-100 p-6 md:p-8">
          <DialogHeader className="space-y-4">
            <div className="flex flex-col md:flex-row justify-between items-start gap-4">
              
              <div className="space-y-2 flex-1">
                <DialogTitle className="text-2xl font-bold text-neutral-900 leading-tight">
                  {job.title}
                </DialogTitle>

                <div className="flex flex-wrap items-center gap-2 text-sm text-neutral-600">
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                      job.status === 'published' || job.status === 'open'
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : 'bg-neutral-100 text-neutral-600 border-neutral-200'
                  }`}>
                    {job.status === 'published' ? 'Publicado' : job.status}
                  </span>

                  {job.companyName && (
                    <>
                      <span className="text-neutral-300 mx-1">•</span>
                      <div className="flex items-center font-medium">
                        <Building size={14} className="mr-1.5 opacity-70" /> 
                        {job.companyName}
                      </div>
                    </>
                  )}
                  
                  <span className="text-neutral-300 mx-1">•</span>
                  <div className="flex items-center">
                    <MapPin size={14} className="mr-1.5 opacity-70" /> 
                    {job.institution?.name || job.area.name}
                  </div>
                </div>
              </div>

              {/* Botão de Salvar apenas (Aplicar foi para a sidebar) */}
              <div className="flex items-center gap-3 shrink-0 mt-4 md:mt-0">
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onToggleSave(job.id)}
                    disabled={isSaving}
                    className={`h-10 px-4 rounded-md border-neutral-200 hover:bg-blue-50 ${isSaved ? 'text-blue-600 border-blue-200' : 'text-neutral-500'}`}
                >
                    <Bookmark className={`h-4 w-4 mr-2 ${isSaved ? 'fill-current' : ''}`} />
                    {isSaved ? 'Vaga Salva' : 'Salvar Vaga'}
                </Button>
              </div>
            </div>

            {/* Badges Informativos */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-2">
              <InfoBadge icon={Briefcase} label="Categoria" value={job.category.name} />
              <InfoBadge icon={User} label="Postado por" value={`${job.author?.firstName} ${job.author?.lastName}`} />
              <InfoBadge icon={Clock} label="Data" value={formatDate(job.createdAt)} />
              <InfoBadge icon={MapPin} label="Local" value={job.area.name} />
            </div>
          </DialogHeader>
        </div>

        {/* --- CORPO --- */}
        <div className="p-6 md:p-8 flex flex-col md:flex-row gap-8 items-start bg-white">
          
          {/* LADO ESQUERDO: Descrição */}
          <div className="flex-1 min-w-0 space-y-4">
             <h3 className="font-semibold text-lg text-neutral-900">Sobre a vaga</h3>
             <div 
                className="prose prose-sm prose-neutral max-w-none text-neutral-600 leading-relaxed break-words"
                dangerouslySetInnerHTML={{ __html: job.description }} 
             />
          </div>

          {/* LADO DIREITO: Sidebar de Ação e Contato */}
          <div className="w-full md:w-[320px] shrink-0 space-y-6">
             
             {/* 1. CARD DE CANDIDATURA (Lógica do Novo) */}
             <div className="bg-white rounded-xl p-5 border border-blue-100 shadow-sm ring-4 ring-blue-50/50">
                <h4 className="font-bold text-neutral-900 text-sm mb-4 flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-blue-600" />
                    Candidatura
                </h4>
                
                {isLoadingStatus ? (
                    <div className="flex justify-center py-4">
                        <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
                    </div>
                ) : hasApplied ? (
                    <div className="text-center py-4 bg-green-50 rounded-lg border border-green-100">
                        <CheckCircle2 className="h-8 w-8 text-green-600 mx-auto mb-2" />
                        <p className="font-semibold text-green-800 text-sm">Candidatura Enviada!</p>
                        <p className="text-xs text-green-600 mt-1">Você já está participando.</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {/* Se usuário já tem currículo salvo */}
                        {userHasResume && !resumeFile && (
                            <div className="text-xs text-blue-700 bg-blue-50 p-3 rounded-lg border border-blue-100 flex items-start gap-2">
                                <FileText className="h-4 w-4 shrink-0 mt-0.5" />
                                <div>
                                    <p className="font-medium">Currículo disponível</p>
                                    <p className="opacity-80 mt-0.5">Seu perfil já possui um CV. Basta clicar para aplicar.</p>
                                </div>
                            </div>
                        )}

                        {/* Input de Upload (aparece se não tem CV ou se quiser trocar) */}
                        <div className="space-y-2">
                            <label className="text-xs font-medium text-neutral-700 block flex justify-between">
                                <span>{userHasResume ? "Atualizar Currículo (Opcional)" : "Anexar Currículo (PDF)"}</span>
                            </label>
                            
                            <div className="relative">
                                <Input 
                                    type="file" 
                                    accept="application/pdf" 
                                    onChange={(e) => setResumeFile(e.target.files?.[0] || null)} 
                                    className="bg-neutral-50 h-10 text-xs cursor-pointer file:cursor-pointer file:text-blue-600 file:font-semibold" 
                                />
                                {!resumeFile && !userHasResume && (
                                    <UploadCloud className="absolute right-3 top-2.5 h-4 w-4 text-neutral-400 pointer-events-none" />
                                )}
                            </div>
                            {resumeFile && (
                                <p className="text-[10px] text-green-600 font-medium">
                                    Arquivo selecionado: {resumeFile.name}
                                </p>
                            )}
                        </div>

                        <Button 
                            onClick={handleApply} 
                            disabled={isApplying || isUploading || (!userHasResume && !resumeFile)} 
                            className="w-full bg-blue-600 hover:bg-blue-700 h-10 shadow-sm"
                        >
                            {isApplying || isUploading ? (
                                <><Loader2 className="animate-spin h-4 w-4 mr-2"/> Processando...</>
                            ) : (
                                "Confirmar Candidatura"
                            )}
                        </Button>
                    </div>
                )}
             </div>

             {/* 2. CARD DE CONTATO (Visual do Original) */}
             <div className="bg-neutral-50/80 rounded-xl p-5 border border-neutral-200">
                <h4 className="text-xs font-bold text-neutral-500 uppercase tracking-wider mb-4 border-b border-neutral-200 pb-2">
                  Contato do Recrutador
                </h4>
                
                <div className="space-y-4">
                  <div className="flex gap-3 items-start">
                    <div className="bg-white p-2 rounded-md shadow-sm text-neutral-500 mt-0.5">
                      <Mail size={14} />
                    </div>
                    <div className="overflow-hidden">
                      <p className="text-xs text-neutral-500 font-medium mb-0.5">E-mail</p>
                      <a href={`mailto:${job.email}`} className="text-sm font-semibold text-neutral-900 hover:text-blue-700 hover:underline break-all block">
                        {job.email}
                      </a>
                    </div>
                  </div>

                  {job.telephone && (
                    <div className="flex gap-3 items-start">
                      <div className="bg-white p-2 rounded-md shadow-sm text-neutral-500 mt-0.5">
                        <Phone size={14} />
                      </div>
                      <div>
                        <p className="text-xs text-neutral-500 font-medium mb-0.5">Telefone</p>
                        <p className="text-sm font-semibold text-neutral-900">{job.telephone}</p>
                      </div>
                    </div>
                  )}
                </div>
             </div>
          </div>
        </div>

      </DialogContent>
    </Dialog>
  );
};

// Componente Badge
function InfoBadge({ icon: Icon, label, value }: { icon: any, label: string, value: string }) {
  return (
    <div className="bg-white border border-neutral-200 rounded-lg p-2.5 flex flex-col justify-center shadow-sm">
      <div className="flex items-center gap-1.5 text-neutral-400 mb-1">
        <Icon size={12} />
        <span className="text-[10px] uppercase font-bold tracking-wider">{label}</span>
      </div>
      <p className="text-xs md:text-sm font-medium text-neutral-900 truncate" title={value}>
        {value}
      </p>
    </div>
  );
}