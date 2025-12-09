"use client";

import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Building, LogIn, UserPlus, MapPin, CheckCircle, Info, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/AuthContext';
import { AuthModal } from '@/components/AuthModal'; // Novo
import { QuickApplyModal } from '@/components/QuickApplyModal'; // Atualizado
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '@/components/ui/dialog';

const safeColor = (color: string | null | undefined, fallback = '#2563eb') => {
    if (!color) return fallback;
    return color.startsWith('#') ? color : `#${color}`;
};

export default function InstitutionPage({ params }: { params: Promise<{ slug: string }> }) {
  const resolvedParams = use(params);
  const slug = resolvedParams.slug;
  const router = useRouter();
  const { user, token } = useAuth();

  const [institution, setInstitution] = useState<any>(null);
  const [jobs, setJobs] = useState<any[]>([]);
  const [appliedJobIds, setAppliedJobIds] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(true);
  
  // Modais
  const [selectedJob, setSelectedJob] = useState<any | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authTab, setAuthTab] = useState<'login' | 'register'>('login');
  const [isApplyModalOpen, setIsApplyModalOpen] = useState(false);
  
  // Estado para guardar a vaga que o usuário tentou aplicar antes de logar
  const [pendingJobId, setPendingJobId] = useState<number | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL;
        
        const instRes = await fetch(`${apiUrl}/institutions/public/slug/${slug}`, {
            cache: 'no-store',
            headers: { 'Pragma': 'no-cache' }
        });
        
        if (!instRes.ok) {
           window.location.href = process.env.NEXT_PUBLIC_APP_URL || '/';
           return;
        }

        const instData = await instRes.json();
        setInstitution(instData);

        const jobsRes = await fetch(`${apiUrl}/jobs/public?limit=50&institutionId=${instData.id}`, {
            cache: 'no-store' 
        });
        const jobsData = await jobsRes.json();
        setJobs(jobsData.data || []);

      } catch (error) {
        console.error("Erro", error);
      } finally {
        setLoading(false);
      }
    };

    if (slug) fetchData();
  }, [slug]);

  const fetchApplicationStatus = async () => {
    if (!user || !token) return;
    try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/applications/my-applications`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (res.ok) {
            const apps = await res.json();
            const ids = new Set<number>(apps.map((app: any) => app.jobId));
            setAppliedJobIds(ids);
        }
    } catch (error) {
        console.error("Erro ao buscar candidaturas", error);
    }
  };

  useEffect(() => {
    fetchApplicationStatus();
  }, [user, token]);

  // Handler de Clique em "Candidatar-se"
  const handleApplyClick = (jobId: number) => {
      if (!user) {
          // Não logado: Guarda a intenção e abre Auth
          setPendingJobId(jobId);
          setAuthTab('login');
          setIsAuthModalOpen(true);
      } else {
          // Logado: Abre formulário de candidatura direto
          setPendingJobId(jobId); // Guarda também para usar no modal
          setIsApplyModalOpen(true);
      }
  };

  // Callback após login/cadastro com sucesso
  const handleAuthSuccess = () => {
      // Se tinha uma vaga pendente, abre o modal de aplicação
      if (pendingJobId) {
          // Pequeno delay para garantir que o contexto de auth atualizou
          setTimeout(() => setIsApplyModalOpen(true), 100);
      }
  };

  const handleApplicationSuccess = () => {
      // Atualiza lista de aplicados e fecha modais
      fetchApplicationStatus();
      setPendingJobId(null);
      setSelectedJob(null); // Fecha detalhes se estiver aberto
  };

  if (loading) return <div className="h-screen flex items-center justify-center bg-slate-50"><Loader2 className="animate-spin text-blue-600"/></div>;
  if (!institution) return null;

  const primaryColor = safeColor(institution.primaryColor);

  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      
      {/* Header Institucional */}
      <header className="bg-white border-b border-slate-200 shadow-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 h-20 flex items-center justify-between">
            <div className="flex items-center gap-3">
                {institution.logoUrl ? (
                    <img src={`${process.env.NEXT_PUBLIC_API_URL}${institution.logoUrl}`} alt={institution.name} className="h-12 w-auto object-contain" />
                ) : (
                    <Building className="h-8 w-8 text-slate-400" />
                )}
                <div className="h-8 w-px bg-slate-200 mx-2 hidden md:block"></div>
                <h1 className="text-xl font-bold text-slate-800 hidden md:block">{institution.name} <span className="text-slate-400 font-normal text-sm">| Carreiras</span></h1>
            </div>
            
            <div className="flex gap-3">
                 {user ? (
                    <Button onClick={() => router.push('/dashboard')} variant="ghost" className="hidden md:flex gap-2 text-slate-700">
                        Acessar Painel
                    </Button>
                 ) : (
                    <>
                        <Button onClick={() => { setAuthTab('login'); setIsAuthModalOpen(true); }} variant="ghost" className="hidden md:flex gap-2">
                            <LogIn className="h-4 w-4" /> Entrar
                        </Button>
                        <Button onClick={() => { setAuthTab('register'); setIsAuthModalOpen(true); }} className="bg-slate-900 text-white hover:bg-slate-800 gap-2">
                            <UserPlus className="h-4 w-4" /> Cadastrar
                        </Button>
                    </>
                 )}
            </div>
        </div>
      </header>

      {/* Hero Banner */}
      <div className="relative py-20 px-4 text-center text-white transition-colors duration-500" style={{ backgroundColor: primaryColor }}>
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="relative z-10 container mx-auto">
            <h2 className="text-4xl font-bold mb-4">Oportunidades Exclusivas</h2>
            <p className="text-lg opacity-90 max-w-2xl mx-auto">
                Confira as vagas de estágio, pesquisa e emprego selecionadas para alunos da {institution.name}.
            </p>
        </div>
      </div>

      {/* Listagem de Vagas */}
      <div className="container mx-auto px-4 py-16 max-w-5xl">
         <div className="flex items-center justify-between mb-8">
            <h3 className="text-2xl font-bold text-slate-900 border-l-4 pl-4" style={{ borderColor: primaryColor }}>
                Vagas Disponíveis ({jobs.length})
            </h3>
         </div>

         <div className="grid gap-4">
            {jobs.length > 0 ? jobs.map(job => {
                const isApplied = appliedJobIds.has(job.id);

                return (
                    <div key={job.id} className="bg-white p-6 rounded-xl border border-slate-200 hover:shadow-md transition-all flex flex-col md:flex-row justify-between items-start md:items-center gap-4 group">
                        <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                                {isApplied && (
                                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                                        <CheckCircle className="w-3 h-3 mr-1" /> Inscrito
                                    </span>
                                )}
                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-600">
                                    {job.category.name}
                                </span>
                            </div>
                            <h4 className="text-lg font-bold text-slate-800 group-hover:text-blue-700 transition-colors">{job.title}</h4>
                            <div className="flex gap-4 mt-2 text-sm text-slate-500">
                                <span className="flex items-center"><Building className="w-4 h-4 mr-1"/> {job.companyName || institution.name}</span>
                                <span className="flex items-center"><MapPin className="w-4 h-4 mr-1"/> {job.area.name}</span>
                            </div>
                        </div>

                        {/* Botão de Ação Condicional */}
                        {isApplied ? (
                             <Button 
                                disabled
                                className="bg-slate-100 text-slate-400 border border-slate-200 min-w-[160px] cursor-not-allowed"
                            >
                                Inscrição Realizada
                            </Button>
                        ) : (
                            <Button 
                                onClick={() => setSelectedJob(job)}
                                style={{ backgroundColor: primaryColor }}
                                className="text-white hover:opacity-90 min-w-[160px] shadow-sm"
                            >
                                Ver Detalhes
                            </Button>
                        )}
                    </div>
                );
            }) : (
                <div className="text-center py-12 text-slate-500 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                    <Info className="h-10 w-10 mx-auto mb-3 text-slate-300" />
                    <p>Nenhuma vaga aberta no momento para esta instituição.</p>
                </div>
            )}
         </div>
      </div>

      <footer className="bg-slate-900 text-slate-400 py-8 text-center text-sm">
        <p>Powered by <strong>Foxx Recruitment</strong> for {institution.name}</p>
      </footer>

      {/* MODAL DE DETALHES DA VAGA */}
      <Dialog open={!!selectedJob} onOpenChange={(open) => !open && setSelectedJob(null)}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto p-0 gap-0">
            {selectedJob && (
                <>
                    <div className="p-6 border-b border-slate-100 bg-slate-50 sticky top-0 z-10 flex justify-between items-start">
                        <div>
                            <DialogTitle className="text-xl font-bold text-slate-900">{selectedJob.title}</DialogTitle>
                            <DialogDescription className="mt-1 flex items-center gap-2">
                                <Building className="h-3.5 w-3.5" /> {selectedJob.companyName || institution.name}
                            </DialogDescription>
                        </div>
                        <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => setSelectedJob(null)}
                            className="h-8 w-8 text-slate-400 hover:text-slate-600"
                        >
                            <X className="h-4 w-4" />
                        </Button>
                    </div>

                    <div className="p-6 md:p-8">
                        <div className="prose prose-sm prose-slate max-w-none text-slate-600">
                             <div dangerouslySetInnerHTML={{ __html: selectedJob.description }} />
                        </div>
                    </div>

                    <div className="p-4 border-t border-slate-100 bg-white sticky bottom-0 z-10 flex justify-end gap-3">
                        <Button variant="outline" onClick={() => setSelectedJob(null)}>
                            Fechar
                        </Button>
                        <Button 
                            onClick={() => handleApplyClick(selectedJob.id)}
                            style={{ backgroundColor: primaryColor }}
                            className="text-white hover:opacity-90 px-6 font-semibold"
                        >
                            Candidatar-se Agora
                        </Button>
                    </div>
                </>
            )}
        </DialogContent>
      </Dialog>
      
      {/* 1. Modal de Autenticação Unificado */}
      <AuthModal 
        isOpen={isAuthModalOpen} 
        onClose={() => setIsAuthModalOpen(false)} 
        defaultTab={authTab}
        institutionId={institution.id}
        onSuccess={handleAuthSuccess}
      />

      {/* 2. Modal de Aplicação Inteligente */}
      {pendingJobId && (
          <QuickApplyModal 
            isOpen={isApplyModalOpen}
            onClose={() => setIsApplyModalOpen(false)}
            jobId={pendingJobId}
            jobTitle={jobs.find(j => j.id === pendingJobId)?.title}
            onSuccess={handleApplicationSuccess}
          />
      )}

    </div>
  );
}