"use client";

import { useState, useEffect, FormEvent } from 'react';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { 
    Loader2, Link as LinkIcon, FileText, UploadCloud, CheckCircle, Phone, User, Mail, BookOpen
} from 'lucide-react';

interface QuickApplyModalProps {
  isOpen: boolean;
  onClose: () => void;
  jobId: number; 
  jobTitle?: string;
  onSuccess?: () => Promise<void> | void;
}

export function QuickApplyModal({ 
  isOpen, onClose, jobId, jobTitle, onSuccess 
}: QuickApplyModalProps) {
  const { user, token, fetchUserProfile } = useAuth();
  
  const [isLoading, setIsLoading] = useState(false);
  
  // Dados do Formulário Inteligente
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  
  // Documentos e Links
  const [linkedinUrl, setLinkedinUrl] = useState('');
  const [lattesUrl, setLattesUrl] = useState(''); // Novo estado para Lattes
  const [resumeFile, setResumeFile] = useState<File | null>(null);

  // Preenchimento automático ao abrir
  useEffect(() => { 
      if (isOpen && user) {
          setFullName(`${user.firstName} ${user.lastName}`);
          setEmail(user.email);
          
          // Auto-preenchimento dos novos campos se existirem no usuário
          if (user.phone) setPhone(user.phone);
          if (user.linkedinUrl) setLinkedinUrl(user.linkedinUrl);
          if (user.lattesUrl) setLattesUrl(user.lattesUrl);
      }
  }, [isOpen, user]);

  const handleSubmit = async (e: FormEvent) => {
      e.preventDefault();
      
      const hasPreviousResume = user?.resumeUrl;
      
      if (!resumeFile && !hasPreviousResume) {
          toast.error("O envio do Currículo é obrigatório.");
          return;
      }

      setIsLoading(true);

      try {
          // 1. Upload de Currículo (se houver)
          if (resumeFile) {
              const formData = new FormData();
              formData.append('resume', resumeFile);
              await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/profile/resume`, {
                  method: 'POST',
                  headers: { 'Authorization': `Bearer ${token}` },
                  body: formData
              });
              // Não precisamos chamar fetchUserProfile aqui se vamos atualizar os dados abaixo,
              // mas por segurança vamos deixar a aplicação seguir.
          }

          // 2. Enviar Candidatura com Dados Extras para Persistência
          const applyRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/applications`, {
              method: 'POST',
              headers: { 
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${token}`
              },
              body: JSON.stringify({ 
                  jobId,
                  // Envia os dados para serem salvos/atualizados no perfil
                  phone,
                  linkedinUrl,
                  lattesUrl
              })
          });

          if (applyRes.ok) {
              toast.success('Inscrição enviada com sucesso!');
              // Atualiza o perfil local para refletir os novos dados salvos
              await fetchUserProfile();
              
              if (onSuccess) await onSuccess();
              onClose();
          } else {
              const applyData = await applyRes.json();
              if (applyData.error && applyData.error.includes('já se candidatou')) {
                  toast.info('Você já está inscrito neste processo.');
                  if (onSuccess) await onSuccess();
                  onClose();
              } else {
                  toast.error(applyData.error || 'Erro ao aplicar.');
              }
          }
      } catch (error) {
          console.error(error);
          toast.error('Erro ao processar candidatura.');
      } finally {
          setIsLoading(false);
      }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[600px] border-0 shadow-2xl bg-white p-0 overflow-hidden">
         
         <div className="bg-slate-900 p-6 text-white relative">
            <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10"></div>
            <div className="relative z-10">
                <DialogTitle className="text-xl font-bold tracking-tight mb-1">
                   Finalizar Candidatura
                </DialogTitle>
                <DialogDescription className="text-slate-300 text-sm">
                   Você está se candidatando para: <span className="text-white font-medium">{jobTitle}</span>
                </DialogDescription>
            </div>
        </div>

        <div className="p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
                
                {/* Seção 1: Seus Dados (Preenchidos) */}
                <div className="space-y-4">
                    <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Seus Dados</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <label className="text-xs font-medium text-slate-600 flex items-center gap-1.5">
                                <User size={12} /> Nome Completo
                            </label>
                            <Input value={fullName} onChange={e => setFullName(e.target.value)} className="bg-slate-50" />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-xs font-medium text-slate-600 flex items-center gap-1.5">
                                <Mail size={12} /> Email
                            </label>
                            <Input value={email} readOnly className="bg-slate-50 text-slate-500 cursor-not-allowed" />
                        </div>
                        <div className="space-y-1.5 md:col-span-2">
                            <label className="text-xs font-medium text-slate-600 flex items-center gap-1.5">
                                <Phone size={12} /> Telefone (Contato)
                            </label>
                            <Input 
                                value={phone} 
                                onChange={e => setPhone(e.target.value)} 
                                placeholder="(00) 00000-0000"
                                className="bg-white" 
                            />
                        </div>
                    </div>
                </div>

                <div className="h-px bg-slate-100" />

                {/* Seção 2: Currículo e Links */}
                <div className="space-y-4">
                    <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Profissional</h4>
                    
                    <div className="space-y-3">
                         <div className="relative">
                            <span className="absolute left-3 top-2.5 text-blue-600 text-xs font-bold">IN</span>
                            <Input className="pl-9 bg-white" placeholder="Linkedin URL (Opcional)" value={linkedinUrl} onChange={e => setLinkedinUrl(e.target.value)} />
                        </div>
                        
                        {/* Novo campo Lattes */}
                        <div className="relative">
                            <span className="absolute left-3 top-2.5 text-slate-500 text-xs font-bold">
                                <BookOpen size={14} />
                            </span>
                            <Input className="pl-9 bg-white" placeholder="Link do Lattes (Opcional)" value={lattesUrl} onChange={e => setLattesUrl(e.target.value)} />
                        </div>

                        <div className="bg-blue-50 border border-blue-100 rounded-lg p-4">
                            <label className="text-sm font-semibold text-blue-900 flex items-center gap-2 mb-3">
                                <FileText className="h-4 w-4" /> Currículo {user?.resumeUrl ? '(Cadastrado)' : '(Obrigatório)'}
                            </label>
                            
                            {user?.resumeUrl && !resumeFile ? (
                                <div className="flex items-center justify-between bg-white p-3 rounded border border-blue-100">
                                    <div className="flex items-center gap-2 text-sm text-slate-600">
                                        <CheckCircle className="h-4 w-4 text-green-500" />
                                        <span>Currículo atual será enviado</span>
                                    </div>
                                    <Button type="button" variant="ghost" size="sm" onClick={() => {}} className="relative overflow-hidden text-xs h-7">
                                        Trocar
                                        <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" accept="application/pdf" onChange={(e) => setResumeFile(e.target.files?.[0] || null)} />
                                    </Button>
                                </div>
                            ) : (
                                <label className={`flex flex-col items-center justify-center w-full h-24 border-2 border-dashed rounded-lg cursor-pointer transition-all ${resumeFile ? 'border-green-500 bg-green-50' : 'border-blue-300 bg-white hover:bg-blue-50/50'}`}>
                                    <div className="flex flex-col items-center justify-center pt-3 pb-4">
                                        {resumeFile ? (
                                            <>
                                                <CheckCircle className="h-6 w-6 text-green-600 mb-1" />
                                                <p className="text-xs font-bold text-green-700">{resumeFile.name}</p>
                                            </>
                                        ) : (
                                            <>
                                                <UploadCloud className="w-6 h-6 text-blue-400 mb-1" />
                                                <p className="text-xs font-medium text-slate-600">Clique para enviar PDF</p>
                                            </>
                                        )}
                                    </div>
                                    <input type="file" className="hidden" accept="application/pdf" onChange={(e) => setResumeFile(e.target.files?.[0] || null)} />
                                </label>
                            )}
                        </div>
                    </div>
                </div>

                <div className="flex justify-end pt-2">
                    <Button type="submit" className="w-full sm:w-auto bg-green-600 hover:bg-green-700 text-white font-bold shadow-lg min-w-[200px]" disabled={isLoading}>
                        {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Confirmar e Enviar'}
                    </Button>
                </div>
            </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}