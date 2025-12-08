"use client";

import { useState, useEffect, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { 
    Loader2, LogIn, User, Mail, Lock, 
    GraduationCap, ChevronRight, Link as LinkIcon, 
    FileText, UploadCloud, CheckCircle, School, Rocket 
} from 'lucide-react';

interface QuickApplyModalProps {
  isOpen: boolean;
  onClose: () => void;
  jobTitle?: string;
  jobInstitutionId?: number; 
  institutionName?: string;
  jobId?: number; 
  institutionId?: number; 
  initialView?: 'register' | 'login';
  onSuccess?: () => Promise<void> | void;
}

export function QuickApplyModal({ 
  isOpen, onClose, jobTitle, jobInstitutionId, institutionName, jobId, institutionId, initialView = 'register', onSuccess 
}: QuickApplyModalProps) {
  const { login, user } = useAuth();
  const router = useRouter();
  
  const [mode, setMode] = useState<'register' | 'login'>(initialView);
  const [step, setStep] = useState<'auth' | 'academic'>('auth');
  const [isLoading, setIsLoading] = useState(false);
  
  // Passo 1
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [educationLevel, setEducationLevel] = useState('');
  const [specialization, setSpecialization] = useState('');

  // Passo 2
  const [lattesUrl, setLattesUrl] = useState('');
  const [linkedinUrl, setLinkedinUrl] = useState('');
  const [resumeFile, setResumeFile] = useState<File | null>(null);

  useEffect(() => { 
      if (isOpen) {
          // Se o usuário JÁ está logado (e carregado corretamente pelo AuthContext),
          // vai direto para o passo de documentos.
          if (user) {
              setStep('academic');
              if (user.linkedinUrl) setLinkedinUrl(user.linkedinUrl);
              if (user.portfolioUrl) setLattesUrl(user.portfolioUrl);
          } else {
              setMode(initialView); 
              setStep('auth');
          }
      }
  }, [initialView, isOpen, user]);

  const executeApplication = async (authToken: string) => {
      if (!jobId) {
          toast.success('Cadastro atualizado!');
          if (onSuccess) await onSuccess();
          router.push('/dashboard'); 
          onClose();
          return;
      }

      try {
          const applyRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/applications`, {
              method: 'POST',
              headers: { 
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${authToken}`
              },
              body: JSON.stringify({ jobId })
          });

          if (applyRes.ok) {
              toast.success('Inscrição enviada com sucesso!');
              if (onSuccess) await onSuccess();
              router.push('/dashboard');
          } else {
              const applyData = await applyRes.json();
              if (applyData.error && applyData.error.includes('já se candidatou')) {
                  toast.info('Você já está inscrito neste processo.');
                  router.push('/dashboard');
              } else {
                  toast.error('Erro na inscrição: ' + (applyData.error || 'Erro desconhecido'));
              }
          }
          onClose();
      } catch (error) {
          toast.error('Erro ao processar inscrição.');
          onClose();
      }
  };

  const handleAuthSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
        let authUrl = mode === 'register' 
            ? `${process.env.NEXT_PUBLIC_API_URL}/auth/register`
            : `${process.env.NEXT_PUBLIC_API_URL}/auth/login`;

        const authBody: any = { email, password };
        
        if (mode === 'register') {
            const targetInstId = jobInstitutionId || institutionId;
            if (!targetInstId) { toast.error("Erro: Instituição não identificada."); setIsLoading(false); return; }
            
            authBody.firstName = firstName;
            authBody.lastName = lastName;
            authBody.institutionId = targetInstId;
            authBody.educationLevel = educationLevel;
            authBody.specialization = specialization;
        }

        const authRes = await fetch(authUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(authBody)
        });

        const authData = await authRes.json();

        if (!authRes.ok) {
            toast.error(authData.error || 'Erro de acesso.');
            setIsLoading(false);
            return;
        }

        // Login sem redirecionar, pois vamos para o passo 2
        await login(authData.access_token, false); 

        if (mode === 'register') {
            setStep('academic'); // Vai para upload de currículo
            setIsLoading(false);
            toast.success("Conta criada! Complete seu perfil.");
        } else {
            // Se fez login, verificamos se precisa de CV ou vai direto
            // Por segurança, mandamos para o passo academic também para confirmar dados
            setStep('academic');
            setIsLoading(false);
        }

    } catch (error) {
        console.error(error);
        toast.error('Erro de conexão.');
        setIsLoading(false);
    }
  };

  const handleAcademicSubmit = async (e: FormEvent) => {
      e.preventDefault();
      
      const hasPreviousResume = user?.resumeUrl;
      
      if (!resumeFile && !hasPreviousResume) {
          toast.error("O envio do Currículo ou Histórico Escolar é obrigatório.");
          return;
      }

      setIsLoading(true);
      const token = localStorage.getItem('access_token'); 

      if (!token) {
          toast.error("Sessão expirada. Faça login novamente.");
          onClose();
          return;
      }

      try {
          if (linkedinUrl || lattesUrl) {
              await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/profile`, {
                  method: 'PUT',
                  headers: { 
                      'Content-Type': 'application/json', 
                      'Authorization': `Bearer ${token}` 
                  },
                  body: JSON.stringify({ 
                      linkedinUrl, 
                      portfolioUrl: lattesUrl 
                  })
              });
          }

          if (resumeFile) {
              const formData = new FormData();
              formData.append('resume', resumeFile);
              
              const uploadRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/profile/resume`, {
                  method: 'POST',
                  headers: { 'Authorization': `Bearer ${token}` },
                  body: formData
              });
              
              if (!uploadRes.ok) throw new Error('Falha no upload do documento.');
          }

          await executeApplication(token);

      } catch (error) {
          console.error(error);
          toast.error('Erro ao salvar documentos.');
          setIsLoading(false);
      }
  };

  const instTitle = institutionName || "Instituição de Ensino";

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[550px] p-0 overflow-hidden border-0 shadow-2xl bg-white">
         
         <div className="bg-blue-900 p-6 text-white text-center relative overflow-hidden">
            <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10"></div>
            <div className="relative z-10 flex flex-col items-center">
                <div className="h-14 w-14 bg-white/10 rounded-full flex items-center justify-center mb-3 backdrop-blur-md border border-white/20">
                    {step === 'academic' ? <FileText className="h-7 w-7 text-yellow-300" /> : <School className="h-7 w-7 text-blue-200" />}
                </div>
                
                <DialogTitle className="text-xl font-bold tracking-tight">
                    {step === 'academic' 
                        ? 'Confirmação Acadêmica' 
                        : (mode === 'login' ? 'Login do Aluno' : `Inscrição: ${instTitle}`)}
                </DialogTitle>
                
                <DialogDescription className="text-blue-200 mt-1 max-w-sm mx-auto text-sm">
                    {step === 'academic' 
                        ? 'Anexe seus documentos acadêmicos para formalizar a inscrição.' 
                        : (mode === 'register' ? 'Identifique-se para iniciar o processo.' : 'Entre para continuar sua inscrição.')}
                </DialogDescription>
            </div>
        </div>

        <div className="p-6">
            
            {/* ETAPA 1 */}
            {step === 'auth' && (
                <form onSubmit={handleAuthSubmit} className="space-y-5">
                    {mode === 'register' && (
                        <>
                            <div className="space-y-3">
                                <div className="flex gap-3">
                                    <Input placeholder="Nome" className="bg-neutral-50" value={firstName} onChange={e => setFirstName(e.target.value)} required disabled={isLoading} />
                                    <Input placeholder="Sobrenome" className="bg-neutral-50" value={lastName} onChange={e => setLastName(e.target.value)} required disabled={isLoading} />
                                </div>
                            </div>
                            <div className="pt-2">
                                <label className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-2 block">Dados Acadêmicos</label>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    <Select onValueChange={setEducationLevel} value={educationLevel} disabled={isLoading} required>
                                        <SelectTrigger className="bg-neutral-50"><SelectValue placeholder="Nível" /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Ensino Médio">Ensino Médio</SelectItem>
                                            <SelectItem value="Graduação">Graduação</SelectItem>
                                            <SelectItem value="Pós-graduação">Pós-graduação</SelectItem>
                                            <SelectItem value="Mestrado">Mestrado</SelectItem>
                                            <SelectItem value="Doutorado">Doutorado</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <Input 
                                        placeholder="Curso/Semestre" 
                                        className="bg-neutral-50"
                                        value={specialization} 
                                        onChange={e => setSpecialization(e.target.value)} 
                                        disabled={isLoading} 
                                    />
                                </div>
                            </div>
                        </>
                    )}

                    <div className="space-y-3 pt-2 border-t border-neutral-100">
                        <Input type="email" placeholder="E-mail Institucional ou Pessoal" value={email} onChange={e => setEmail(e.target.value)} required disabled={isLoading} className="bg-neutral-50" />
                        <Input type="password" placeholder="Senha" value={password} onChange={e => setPassword(e.target.value)} required minLength={6} disabled={isLoading} className="bg-neutral-50" />
                    </div>

                    <Button type="submit" className="w-full bg-blue-700 hover:bg-blue-800 text-white h-11 text-base font-semibold" disabled={isLoading}>
                        {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : (
                            <span className="flex items-center">
                                {mode === 'register' ? 'Continuar' : 'Entrar'} 
                                <ChevronRight className="ml-2 h-4 w-4" />
                            </span>
                        )}
                    </Button>
                    
                    <div className="text-center bg-neutral-50 p-3 rounded-lg border border-neutral-100 mt-4">
                        <p className="text-xs text-neutral-500">
                            {mode === 'register' ? 'Já possui conta? ' : 'Primeiro acesso? '}
                            <button type="button" onClick={() => setMode(mode === 'register' ? 'login' : 'register')} className="text-blue-700 font-bold hover:underline ml-1">
                                {mode === 'register' ? 'Fazer Login' : 'Cadastre-se'}
                            </button>
                        </p>
                    </div>
                </form>
            )}

            {/* ETAPA 2 */}
            {step === 'academic' && (
                <form onSubmit={handleAcademicSubmit} className="space-y-6 animate-in slide-in-from-right-8 duration-300">
                    <div className="space-y-4">
                        <div className="space-y-3">
                            <label className="text-xs font-semibold text-neutral-500 uppercase tracking-wider flex items-center gap-2">
                                <LinkIcon className="h-3 w-3" /> Links (Opcional)
                            </label>
                            <div className="relative">
                                <span className="absolute left-3 top-2.5 text-neutral-400 text-xs font-bold">LATTES</span>
                                <Input className="pl-16 bg-neutral-50" placeholder="URL do Lattes" value={lattesUrl} onChange={e => setLattesUrl(e.target.value)} disabled={isLoading} />
                            </div>
                            <div className="relative">
                                <span className="absolute left-3 top-2.5 text-blue-600 text-xs font-bold">IN</span>
                                <Input className="pl-9 bg-neutral-50" placeholder="Linkedin URL" value={linkedinUrl} onChange={e => setLinkedinUrl(e.target.value)} disabled={isLoading} />
                            </div>
                        </div>

                        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 space-y-3">
                            <label className="text-sm font-bold text-amber-900 flex items-center gap-2">
                                <FileText className="h-4 w-4" /> Documentação {user?.resumeUrl ? '(Atualizar)' : '(Obrigatório)'}
                            </label>
                            
                            <div className="flex items-center justify-center w-full">
                                <label className={`flex flex-col items-center justify-center w-full h-28 border-2 border-dashed rounded-lg cursor-pointer transition-all ${resumeFile ? 'border-green-500 bg-green-50' : 'border-amber-300 bg-white hover:bg-amber-50/50'}`}>
                                    <div className="flex flex-col items-center justify-center pt-5 pb-6 px-4 text-center">
                                        {resumeFile ? (
                                            <div className="flex flex-col items-center gap-1 text-green-700">
                                                <CheckCircle className="h-8 w-8 mb-1" />
                                                <p className="text-sm font-bold truncate max-w-[220px]">{resumeFile.name}</p>
                                            </div>
                                        ) : (
                                            <>
                                                <UploadCloud className="w-8 h-8 text-amber-400 mb-2" />
                                                <p className="text-xs font-medium text-neutral-600">
                                                    {user?.resumeUrl ? 'Clique para substituir o arquivo atual' : 'Selecione Currículo/Histórico (PDF)'}
                                                </p>
                                            </>
                                        )}
                                    </div>
                                    <input type="file" className="hidden" accept="application/pdf" onChange={(e) => setResumeFile(e.target.files?.[0] || null)} disabled={isLoading} />
                                </label>
                            </div>
                        </div>
                    </div>

                    <div className="flex gap-3 pt-2">
                        {user && (
                            <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
                                Cancelar
                            </Button>
                        )}
                        <Button type="submit" className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold shadow-lg" disabled={isLoading}>
                            {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Confirmar Inscrição'}
                        </Button>
                    </div>
                </form>
            )}
        </div>
      </DialogContent>
    </Dialog>
  );
}