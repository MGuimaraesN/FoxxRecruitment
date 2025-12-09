"use client";

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { 
    Loader2, ChevronLeft, UploadCloud, 
    FileText, CheckCircle, ShieldCheck, User 
} from 'lucide-react';

export default function ApplicationCheckoutPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const { id: jobId } = resolvedParams;
  const { user, token, login } = useAuth(); // login usado para cadastro on-the-fly se necessário
  const router = useRouter();

  // Estados do Formulário
  const [formData, setFormData] = useState({
      firstName: '',
      lastName: '',
      email: '',
      password: '', // Apenas para novos usuários
  });
  
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [existingResumeUrl, setExistingResumeUrl] = useState<string | null>(null);
  
  const [loading, setLoading] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const [jobTitle, setJobTitle] = useState('');
  const [hasApplied, setHasApplied] = useState(false); // Novo estado

  // 1. Verificar Dados Salvos (Auto-fill) e Candidatura Existente no Mount
  useEffect(() => {
    const initPage = async () => {
        try {
            // A. Busca dados da vaga
            const jobRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/jobs/${jobId}`);
            if (jobRes.ok) {
                const jobData = await jobRes.json();
                setJobTitle(jobData.title);
            }

            // B. Se logado, verifica candidatura e pré-popula
            if (user && token) {
                // 1. Verifica candidatura
                const checkRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/applications/check/${jobId}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                
                if (checkRes.ok) {
                    const checkData = await checkRes.json();
                    if (checkData.hasApplied) {
                        setHasApplied(true);
                        // Opcional: Redirecionar imediatamente ou mostrar estado de sucesso
                        // router.push('/dashboard'); 
                    }
                }

                // 2. Pré-popula dados
                setFormData(prev => ({
                    ...prev,
                    firstName: user.firstName,
                    lastName: user.lastName,
                    email: user.email
                }));
                if (user.resumeUrl) {
                    setExistingResumeUrl(user.resumeUrl);
                }
            }
        } catch (error) {
            console.error(error);
        } finally {
            setIsInitializing(false);
        }
    };
    initPage();
  }, [user, jobId, token]); // Adicionado token nas dependências

  // Atualiza form se o user carregar depois (ex: refresh)
  useEffect(() => {
      if (user && !isInitializing) {
          setFormData(prev => ({
            ...prev,
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email
          }));
          if (user.resumeUrl) setExistingResumeUrl(user.resumeUrl);
      }
  }, [user, isInitializing]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const { name, value } = e.target;
      setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      setLoading(true);

      try {
          let currentToken = token;

          // Cenário 1: Novo Usuário (Cadastro implícito)
          if (!user) {
              if (!formData.password) {
                  toast.error("Defina uma senha para acompanhar sua candidatura.");
                  setLoading(false);
                  return;
              }
              
              // Tenta registrar
              const registerRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/register`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                      firstName: formData.firstName,
                      lastName: formData.lastName,
                      email: formData.email,
                      password: formData.password,
                      // Assume instituição padrão ou pega da vaga (simplificado aqui)
                      institutionId: 1 // Idealmente pegaria da vaga, mas para MVP ok
                  })
              });

              if (!registerRes.ok) {
                  const errorData = await registerRes.json();
                  throw new Error(errorData.error || "Falha no cadastro.");
              }

              const registerData = await registerRes.json();
              currentToken = registerData.access_token;
              
              // Loga o usuário no contexto sem redirecionar
              await login(currentToken!, false); 
          }

          if (!currentToken) throw new Error("Erro de autenticação.");

          // Cenário 2: Upload de Currículo (se houver novo arquivo)
          if (resumeFile) {
              const uploadForm = new FormData();
              uploadForm.append('resume', resumeFile);
              
              const uploadRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/profile/resume`, {
                  method: 'POST',
                  headers: { 'Authorization': `Bearer ${currentToken}` },
                  body: uploadForm
              });
              
              if (!uploadRes.ok) throw new Error("Falha ao enviar currículo.");
          } else if (!existingResumeUrl && !resumeFile) {
              toast.error("O currículo é obrigatório.");
              setLoading(false);
              return;
          }

          // Cenário 3: Aplicar para a Vaga
          const applyRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/applications`, {
              method: 'POST',
              headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${currentToken}`
              },
              body: JSON.stringify({ jobId: parseInt(jobId) })
          });

          if (applyRes.ok) {
              toast.success("Candidatura realizada com sucesso!");
              router.push('/dashboard'); // Redireciona para o painel do aluno
          } else {
              const applyData = await applyRes.json();
              if (applyData.error?.includes('já se candidatou')) {
                  toast.info("Você já se candidatou para esta vaga.");
                  router.push('/dashboard');
              } else {
                  throw new Error(applyData.error || "Erro ao aplicar.");
              }
          }

      } catch (error: any) {
          toast.error(error.message || "Ocorreu um erro. Tente novamente.");
      } finally {
          setLoading(false);
      }
  };

  if (isInitializing) {
      return <div className="h-screen flex items-center justify-center bg-slate-50"><Loader2 className="animate-spin text-blue-600"/></div>;
  }

  // --- NOVA VIEW: SE JÁ APLICOU ---
  if (hasApplied) {
    return (
        <div className="min-h-screen bg-slate-50 py-12 px-4 flex items-center justify-center">
            <div className="max-w-md w-full bg-white rounded-2xl shadow-xl border border-slate-100 p-8 text-center">
                <div className="h-16 w-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircle className="h-8 w-8" />
                </div>
                <h1 className="text-2xl font-bold text-slate-900 mb-2">Candidatura Enviada!</h1>
                <p className="text-slate-500 mb-6">
                    Você já está participando do processo seletivo para <span className="font-semibold text-slate-700">{jobTitle}</span>.
                </p>
                <div className="space-y-3">
                    <Button className="w-full bg-blue-600 hover:bg-blue-700" onClick={() => router.push('/dashboard')}>
                        Ir para meu Painel
                    </Button>
                    <Button variant="outline" className="w-full" onClick={() => router.back()}>
                        Voltar
                    </Button>
                </div>
            </div>
        </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 flex items-center justify-center">
        <div className="max-w-md w-full">
            
            {/* Header Checkout */}
            <div className="mb-8">
                <Button variant="ghost" size="sm" onClick={() => router.back()} className="text-slate-500 pl-0 hover:bg-transparent hover:text-slate-900">
                    <ChevronLeft className="h-4 w-4 mr-1" /> Voltar
                </Button>
                <h1 className="text-2xl font-bold text-slate-900 mt-4">Finalizar Candidatura</h1>
                <p className="text-slate-500 text-sm mt-1">
                    Você está se candidatando para: <span className="font-semibold text-slate-700">{jobTitle}</span>
                </p>
            </div>

            {/* Card do Formulário */}
            <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/60 border border-slate-100 overflow-hidden">
                <div className="h-2 bg-gradient-to-r from-blue-500 to-indigo-600 w-full" />
                
                <form onSubmit={handleSubmit} className="p-6 md:p-8 space-y-6">
                    
                    {/* Seção 1: Dados Pessoais (Auto-filled ou Novos) */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 mb-2">
                            <User className="h-4 w-4 text-blue-600" />
                            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500">Seus Dados</h3>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <label className="text-xs font-semibold text-slate-700">Nome</label>
                                <Input 
                                    name="firstName"
                                    value={formData.firstName} 
                                    onChange={handleInputChange}
                                    placeholder="Seu nome" 
                                    required 
                                    disabled={!!user} // Bloqueia se já vier do banco
                                    className={user ? "bg-slate-50 border-transparent" : ""}
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-semibold text-slate-700">Sobrenome</label>
                                <Input 
                                    name="lastName"
                                    value={formData.lastName} 
                                    onChange={handleInputChange}
                                    placeholder="Sobrenome" 
                                    required 
                                    disabled={!!user}
                                    className={user ? "bg-slate-50 border-transparent" : ""}
                                />
                            </div>
                        </div>

                        <div className="space-y-1">
                            <label className="text-xs font-semibold text-slate-700">Email Profissional</label>
                            <Input 
                                type="email"
                                name="email"
                                value={formData.email} 
                                onChange={handleInputChange}
                                placeholder="seu@email.com" 
                                required 
                                disabled={!!user}
                                className={user ? "bg-slate-50 border-transparent" : ""}
                            />
                        </div>

                        {/* Campo de Senha apenas para novos usuários */}
                        {!user && (
                            <div className="space-y-1 animate-in fade-in slide-in-from-top-2">
                                <label className="text-xs font-semibold text-slate-700">Crie uma senha</label>
                                <Input 
                                    type="password"
                                    name="password"
                                    value={formData.password} 
                                    onChange={handleInputChange}
                                    placeholder="Mínimo 6 caracteres" 
                                    required 
                                    minLength={6}
                                />
                                <p className="text-[10px] text-slate-400">Para acompanhar o status da sua candidatura.</p>
                            </div>
                        )}
                    </div>

                    <div className="h-px bg-slate-100 my-4" />

                    {/* Seção 2: Currículo */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 mb-2">
                            <FileText className="h-4 w-4 text-blue-600" />
                            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500">Currículo</h3>
                        </div>

                        {existingResumeUrl && !resumeFile ? (
                            <div className="bg-green-50 border border-green-100 rounded-lg p-4 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="bg-white p-2 rounded-full shadow-sm text-green-600">
                                        <CheckCircle className="h-4 w-4" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-green-800">Currículo Importado</p>
                                        <p className="text-xs text-green-600">Usando seu arquivo salvo do perfil.</p>
                                    </div>
                                </div>
                                <Button 
                                    type="button" 
                                    variant="ghost" 
                                    size="sm" 
                                    className="text-xs text-green-700 hover:text-green-800 hover:bg-green-100"
                                    onClick={() => setExistingResumeUrl(null)} // Permite trocar
                                >
                                    Trocar
                                </Button>
                            </div>
                        ) : (
                            <div className="relative">
                                <label className={`flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-xl cursor-pointer transition-all hover:bg-slate-50 ${resumeFile ? 'border-blue-500 bg-blue-50/50' : 'border-slate-300'}`}>
                                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                        <UploadCloud className={`w-8 h-8 mb-3 ${resumeFile ? 'text-blue-500' : 'text-slate-400'}`} />
                                        {resumeFile ? (
                                            <p className="text-sm text-blue-600 font-medium">{resumeFile.name}</p>
                                        ) : (
                                            <>
                                                <p className="text-sm text-slate-600 font-medium">Clique para enviar o PDF</p>
                                                <p className="text-xs text-slate-400 mt-1">Máximo 5MB</p>
                                            </>
                                        )}
                                    </div>
                                    <input 
                                        type="file" 
                                        className="hidden" 
                                        accept="application/pdf"
                                        onChange={(e) => setResumeFile(e.target.files?.[0] || null)}
                                    />
                                </label>
                            </div>
                        )}
                    </div>

                    <Button 
                        type="submit" 
                        disabled={loading} 
                        className="w-full h-12 text-base font-bold bg-green-600 hover:bg-green-700 shadow-lg shadow-green-200 mt-4 text-white"
                    >
                        {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Enviar Candidatura"}
                    </Button>

                    <div className="flex items-center justify-center gap-2 text-xs text-slate-400 mt-4">
                        <ShieldCheck className="h-3 w-3" />
                        Seus dados estão seguros e serão enviados apenas ao recrutador.
                    </div>
                </form>
            </div>
        </div>
    </div>
  );
}