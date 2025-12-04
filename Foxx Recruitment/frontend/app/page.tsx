"use client";

// Imports de React e Next
import { useEffect, useState, FormEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

// Imports dos componentes de UI reais de /components
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Building,
  Loader2,
  LogIn,
  Briefcase,
  Filter,
  Waypoints,
  MapPin,
  Clock,
  Search,
  Mail // Adicionado ícone de Email para feedback visual
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { toast, Toaster } from 'sonner';

// --- Interfaces ---
interface Area {
  id: number;
  name: string;
}

interface Category {
  id: number;
  name: string;
}

interface Job {
  id: number;
  title: string;
  description: string;
  createdAt: string;
  area: { name: string };
  category: { name: string };
  institution: { name: string };
}

export default function LandingPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loadingJobs, setLoadingJobs] = useState(true);
  // Estados dos filtros
  const [filters, setFilters] = useState({ search: '', areaId: '', categoryId: '' });
  const [areas, setAreas] = useState<Area[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  
  // --- ESTADO PARA O MODAL ---
  const [showLoginModal, setShowLoginModal] = useState(false);
  
  // Hooks para o modal
  const { login, user, loading } = useAuth();
  const router = useRouter();

  // --- REDIRECIONAMENTO INSTANTÂNEO ---
  useEffect(() => {
    // Verifica o localStorage diretamente para evitar esperar a validação da API
    const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
    
    if (token || user) {
      router.push('/dashboard');
    }
  }, [user, router]);

  // --- Lógica de Busca ---

  useEffect(() => {
    document.title = 'Decola Vagas';
  }, []);

  useEffect(() => {
    const fetchPublicJobs = async () => {
      setLoadingJobs(true);
      try {
        const query = new URLSearchParams({
          search: filters.search,
          areaId: filters.areaId,
          categoryId: filters.categoryId,
        }).toString();

        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
        const res = await fetch(`${apiUrl}/jobs/public?${query}`);

        if (res.ok) {
          const json = await res.json();
          if (json.data && Array.isArray(json.data)) {
            setJobs(json.data);
          } else if (Array.isArray(json)) {
            setJobs(json);
          } else {
            setJobs([]);
          }
        } else {
          console.error("Falha ao buscar vagas, status:", res.status);
          setJobs([]);
        }
      } catch (error) {
        console.error("Erro ao buscar vagas públicas:", error);
        setJobs([]);
      } finally {
        setLoadingJobs(false);
      }
    };
    fetchPublicJobs();
  }, [filters]);

  // Buscar Áreas e Categorias
  useEffect(() => {
    const fetchFilterData = async () => {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
        const [areaRes, catRes] = await Promise.all([
          fetch(`${apiUrl}/areas/public`),
          fetch(`${apiUrl}/categories/public`),
        ]);
        if (areaRes.ok) setAreas(await areaRes.json());
        if (catRes.ok) setCategories(await catRes.json());
      } catch (err) {
        console.error("Falha ao carregar dados para os filtros.");
      }
    };
    fetchFilterData();
  }, []);

  if (loading || user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-slate-950 text-slate-50 selection:bg-blue-600/30 selection:text-blue-100 font-sans">
      {/* Header */}
      <header className="sticky top-0 z-40 w-full border-b border-white/10 bg-slate-950/80 backdrop-blur-md">
        <div className="container mx-auto flex h-16 items-center justify-between px-4 md:px-6">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-white shadow-lg shadow-blue-900/20 transition-transform group-hover:scale-105">
              <Building className="h-5 w-5" />
            </div>
            <span className="text-xl font-bold text-white tracking-tight">
              Decola Vagas
            </span>
          </Link>
          <nav className="flex items-center gap-4">
            <Button 
                onClick={() => setShowLoginModal(true)} 
                variant="ghost"
                className="flex items-center gap-2 text-slate-300 hover:text-white hover:bg-white/10 transition-all"
            >
              <LogIn className="h-4 w-4" />
              Entrar
            </Button>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1">
        <section className="w-full bg-slate-900 py-24 md:py-32 relative overflow-hidden border-b border-white/5">
          <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-blue-600/10 rounded-full blur-[100px] pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-purple-600/10 rounded-full blur-[80px] pointer-events-none" />

          <div className="container mx-auto flex flex-col items-center justify-center px-4 text-center z-10 relative">
            
            <h1 className="text-4xl font-bold tracking-tight text-white sm:text-5xl md:text-7xl drop-shadow-sm leading-tight">
              Encontre sua próxima <br className="hidden md:block"/>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-indigo-400">
                  oportunidade acadêmica.
              </span>
            </h1>
            
            <p className="mt-6 max-w-2xl text-lg text-slate-400 leading-relaxed">
              O hub definitivo que centraliza estágios, iniciações científicas e vagas
              juniores diretamente da sua instituição de ensino.
            </p>
            
            <div className="mt-10 flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
              <Button asChild size="lg" className="text-lg h-12 px-8 bg-blue-600 hover:bg-blue-500 text-white rounded-full shadow-[0_0_20px_rgba(37,99,235,0.3)] transition-all duration-300 border-0">
                <Link href="/register">
                  Começar agora
                </Link>
              </Button>
              <Button 
                  variant="outline" 
                  size="lg" 
                  className="text-lg h-12 px-8 bg-transparent border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white rounded-full hover:border-slate-500 transition-all duration-300" 
                  onClick={() => setShowLoginModal(true)}
              >
                Fazer Login
              </Button>
            </div>

          </div>
        </section>

        {/* Vagas Recentes */}
        <section className="bg-slate-950 py-20 md:py-24 border-t border-white/5 relative">
          <div className="container mx-auto max-w-6xl px-4">
            <div className="text-center mb-12">
                <h2 className="text-3xl font-bold text-white mb-4">
                Vagas Recentes
                </h2>
                <p className="text-slate-400 max-w-2xl mx-auto">
                Filtre as oportunidades abertas e encontre a ideal para o seu perfil.
                </p>
            </div>

            {/* --- ÁREA DE FILTROS --- */}
            <div className="mb-12 p-1.5 bg-slate-900 rounded-2xl border border-slate-800 shadow-xl max-w-4xl mx-auto">
              <div className="flex flex-col md:flex-row gap-2 items-center">
                
                {/* Input de Busca */}
                <div className="relative flex-1 w-full">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none">
                        <Search className="h-5 w-5" />
                    </div>
                    <Input
                        placeholder="Buscar por título..."
                        value={filters.search}
                        onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                        className="w-full bg-transparent border-0 text-white placeholder:text-slate-400 focus-visible:ring-0 focus-visible:ring-offset-0 h-12 pl-10"
                    />
                </div>

                <div className="h-8 w-px bg-slate-800 hidden md:block" />

                {/* Select Área */}
                <div className="w-full md:w-[240px]">
                    <Select value={filters.areaId} onValueChange={(value) =>
                        setFilters(prev => ({ ...prev, areaId: value === 'all' ? '' : value }))}>
                        <SelectTrigger className="w-full bg-transparent border-0 text-slate-300 focus:ring-0 focus:ring-offset-0 h-12 hover:bg-white/5 transition-colors">
                            <SelectValue placeholder="Todas as Áreas" />
                        </SelectTrigger>
                        <SelectContent className="bg-slate-900 border-slate-800 text-slate-200">
                            <SelectItem value="all" className="focus:bg-slate-800 focus:text-white cursor-pointer">Todas as Áreas</SelectItem>
                            {areas.map(area => (
                                <SelectItem key={area.id} value={String(area.id)} className="focus:bg-slate-800 focus:text-white cursor-pointer">
                                    {area.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                <div className="h-8 w-px bg-slate-800 hidden md:block" />

                {/* Select Categoria */}
                <div className="w-full md:w-[240px]">
                    <Select value={filters.categoryId} onValueChange={(value) =>
                        setFilters(prev => ({ ...prev, categoryId: value === 'all' ? '' : value }))}>
                        <SelectTrigger className="w-full bg-transparent border-0 text-slate-300 focus:ring-0 focus:ring-offset-0 h-12 hover:bg-white/5 transition-colors">
                            <SelectValue placeholder="Todas as Categorias" />
                        </SelectTrigger>
                        <SelectContent className="bg-slate-900 border-slate-800 text-slate-200">
                            <SelectItem value="all" className="focus:bg-slate-800 focus:text-white cursor-pointer">Todas as Categorias</SelectItem>
                            {categories.map(cat => (
                                <SelectItem key={cat.id} value={String(cat.id)} className="focus:bg-slate-800 focus:text-white cursor-pointer">
                                    {cat.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

              </div>
            </div>

            {loadingJobs ? (
              <div className="flex justify-center items-center h-64">
                <Loader2 className="h-10 w-10 animate-spin text-blue-500" />
              </div>
            ) : jobs.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {jobs.slice(0, 6).map((job) => (
                  <JobCard key={job.id} job={job} />
                ))}
              </div>
            ) : (
              <div className="text-center py-16 bg-slate-900/30 rounded-2xl border border-white/5 border-dashed">
                  <Briefcase className="h-12 w-12 text-slate-600 mx-auto mb-4 opacity-50" />
                  <p className="text-slate-500 text-lg">
                    Nenhuma vaga publicada no momento.
                  </p>
              </div>
            )}
            
            <div className="text-center mt-16">
              <Link
                href="/register"
                className="inline-flex items-center text-lg font-medium text-blue-400 hover:text-blue-300 transition-colors group"
              >
                Crie sua conta para ver todas as vagas 
                <span className="ml-2 block transition-transform group-hover:translate-x-1">→</span>
              </Link>
            </div>
          </div>
        </section>
        
        {/* Features Section */}
        <section className="bg-slate-950 py-24 border-t border-white/5">
          <div className="container mx-auto max-w-6xl px-4">
            <h2 className="text-center text-3xl font-bold text-white mb-16">
              Tudo em um só lugar
            </h2>
            <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
              <FeatureCard
                icon={Briefcase}
                title="Vagas Centralizadas"
                description="Professores e coordenadores postam as vagas, e você encontra tudo aqui."
              />
              <FeatureCard
                icon={Waypoints}
                title="Conexão Direta"
                description="Acesse oportunidades exclusivas da sua instituição de ensino."
              />
              <FeatureCard
                icon={Filter}
                title="Filtros Inteligentes"
                description="Encontre rapidamente vagas por área, categoria ou status."
              />
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-slate-950 py-10 border-t border-white/10">
        <div className="container mx-auto flex flex-col md:flex-row items-center justify-between px-4 md:px-6 gap-6">
          <div className="flex items-center gap-2">
            <div className="bg-blue-600 rounded-md p-1">
                <Building className="h-4 w-4 text-white" />
            </div>
            <span className="text-lg font-bold text-white">Decola Vagas</span>
          </div>
          <p className="text-sm text-slate-500">
            &copy; {new Date().getFullYear()} Decola Vagas. Todos os direitos reservados.
          </p>
        </div>
      </footer>

      {/* --- MODAL DE LOGIN --- */}
      <LoginModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        login={login}
        router={router}
      />
      <Toaster richColors theme="dark" />
    </div>
  );
}

// --- MODAL DE LOGIN ATUALIZADO ---

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  login: (token: string) => Promise<any>;
  router: any;
}

function LoginModal({ isOpen, onClose, login, router }: LoginModalProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  
  // CORREÇÃO: Mudamos de boolean para string para saber QUAL ação está ocorrendo
  const [loadingAction, setLoadingAction] = useState<'login' | 'forgot' | null>(null);
  const isLoading = loadingAction !== null;

  const [isResetSent, setIsResetSent] = useState(false);

  const LOGIN_API_URL = `${process.env.NEXT_PUBLIC_API_URL}/auth/login`;
  const FORGOT_PASSWORD_API_URL = `${process.env.NEXT_PUBLIC_API_URL}/auth/forgot-password`;
  
  const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  const handleForgotPassword = async () => {
    if (!email.trim()) {
      toast.error('Por favor, digite seu e-mail no campo acima primeiro.');
      setError('Digite seu e-mail no campo acima para recuperar a senha.');
      return;
    }

    if (!EMAIL_REGEX.test(email)) {
      toast.error('Por favor, digite um e-mail válido.');
      setError('Formato de e-mail inválido.');
      return;
    }

    setLoadingAction('forgot'); // Define que é a ação de "Esqueci a senha"
    setError(null);

    try {
      const res = await fetch(FORGOT_PASSWORD_API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (res.ok) {
        setIsResetSent(true);
        toast.success('Link de recuperação enviado com sucesso!');
      } else {
        const errorMsg = data.error || 'Erro ao enviar link de recuperação.';
        setError(errorMsg);
        toast.error(errorMsg);
      }
    } catch (err) {
      console.error(err);
      toast.error('Erro de rede ao tentar recuperar senha.');
    } finally {
      setLoadingAction(null);
    }
  };

  const handleLoginSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoadingAction('login'); // Define que é a ação de "Login"
    setError(null);

    try {
      const res = await fetch(LOGIN_API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (res.ok) {
        const data = await res.json();
        toast.success('Login realizado! Redirecionando...');

        await login(data.access_token);
        
        router.push('/dashboard'); 
        
      } else {
        const data = await res.json();
        const errorMessage = data.error || 'Falha no login. Verifique seus dados.';
        setError(errorMessage);
        toast.error(errorMessage);
        setLoadingAction(null);
      }
    } catch (error) {
      console.error(error);
      const networkError = 'Erro de rede. Não foi possível conectar ao servidor.';
      setError(networkError);
      toast.error(networkError);
      setLoadingAction(null);
    }
  };

  const resetState = () => {
    setIsResetSent(false);
    setError(null);
    setEmail('');
    setPassword('');
    setLoadingAction(null);
  };

  // Helper para o texto do botão
  const getButtonText = () => {
    if (loadingAction === 'forgot') return 'Enviando link...';
    if (loadingAction === 'login') return 'Entrando...';
    return 'Entrar';
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
        if(!open) resetState(); 
        onClose();
    }}>
      <DialogContent 
        className={
          isResetSent 
            ? "sm:max-w-md bg-slate-950 border-emerald-900 text-emerald-50 shadow-2xl shadow-emerald-900/20"
            : "sm:max-w-md bg-[#18181b] border-slate-800 text-slate-50 shadow-2xl"
        }
      >
        {isResetSent ? (
          <div className="animate-in fade-in zoom-in duration-300 text-left">
            <h3 className="text-lg font-bold text-emerald-400 mb-2 mt-4">
              E-mail enviado!
            </h3>
            <p className="text-sm text-emerald-200 mb-6 leading-relaxed">
              Se um usuário com este e-mail existir, um link de redefinição foi enviado.
            </p>
            <Button 
              className="bg-emerald-600 text-white hover:bg-emerald-500 font-medium w-fit px-6 rounded-full"
              onClick={() => setIsResetSent(false)}
            >
              Voltar para o Login
            </Button>
          </div>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold text-center text-white">
                Acesse sua conta
              </DialogTitle>
            </DialogHeader>

            <form onSubmit={handleLoginSubmit} className="space-y-5 px-4 pb-4 mt-2">
              {error && (
                <div className="rounded-lg bg-red-500/10 p-3 border border-red-500/20">
                    <p className="text-sm text-red-400 text-center">{error}</p>
                </div>
              )}

              <div className="space-y-2">
                <label
                  htmlFor="email-modal"
                  className="block text-sm font-medium text-slate-300"
                >
                  Email
                </label>
                <Input
                  type="email"
                  id="email-modal"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seu@email.com"
                  required
                  disabled={isLoading}
                  className="bg-slate-900 border-slate-700 text-white focus-visible:ring-blue-500 placeholder:text-slate-400 h-11 focus:bg-slate-800 transition-colors"
                />
              </div>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label
                    htmlFor="password-modal"
                    className="block text-sm font-medium text-slate-300"
                  >
                    Senha
                  </label>
                  <button
                    type="button"
                    onClick={handleForgotPassword}
                    className="text-xs font-medium text-blue-400 hover:text-blue-300 hover:underline disabled:opacity-50"
                    disabled={isLoading}
                  >
                    Esqueceu sua senha?
                  </button>
                </div>
                <Input
                  type="password"
                  id="password-modal"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  disabled={isLoading}
                  className="bg-slate-900 border-slate-700 text-white focus-visible:ring-blue-500 placeholder:text-slate-400 h-11 focus:bg-slate-800 transition-colors"
                />
              </div>

              <div className="pt-2">
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full gap-2 bg-blue-600 hover:bg-blue-500 text-white font-medium h-11 rounded-md transition-all shadow-[0_0_15px_rgba(37,99,235,0.2)]"
                  size="lg"
                >
                  {isLoading ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : loadingAction === 'forgot' ? (
                    <Mail className="h-5 w-5" /> 
                  ) : (
                    <LogIn className="h-5 w-5" />
                  )}
                  {getButtonText()}
                </Button>
              </div>
            </form>

            <p className="mt-4 text-center text-sm text-slate-500">
              Não tem uma conta?{' '}
              <Link
                href="/register"
                className="font-semibold text-blue-400 hover:text-blue-300 hover:underline"
                onClick={onClose}
              >
                Cadastre-se
              </Link>
            </p>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

// ... (Restante do arquivo permanece inalterado) ...
// Componente JobCard e FeatureCard continuam aqui embaixo...
// ...
function JobCard({ job }: { job: Job }) {
  const timeAgo = (date: string) => {
    const seconds = Math.floor((new Date().getTime() - new Date(date).getTime()) / 1000);
    let interval = seconds / 31536000;
    if (interval > 1) return `Há ${Math.floor(interval)} anos`;
    interval = seconds / 2592000;
    if (interval > 1) return `Há ${Math.floor(interval)} meses`;
    interval = seconds / 86400;
    if (interval > 1) return `Há ${Math.floor(interval)} dias`;
    interval = seconds / 3600;
    if (interval > 1) return `Há ${Math.floor(interval)} horas`;
    interval = seconds / 60;
    if (interval > 1) return `Há ${Math.floor(interval)} minutos`;
    return `Há ${Math.floor(seconds)} segundos`;
  };

  return (
    <div className="group bg-[#18181b] p-6 rounded-xl border border-white/5 hover:border-blue-500/50 hover:bg-slate-900/80 hover:shadow-[0_0_20px_rgba(59,130,246,0.1)] transition-all duration-300 flex flex-col justify-between h-full">
      <div>
        <h3 className="text-xl font-bold text-white group-hover:text-blue-400 transition-colors line-clamp-1 mb-3">
            {job.title}
        </h3>
        
        <div className="flex flex-col gap-2.5 text-sm text-slate-400 mb-4">
            <div className="flex items-center gap-2">
            <Briefcase className="h-4 w-4 text-blue-500" /> 
            <span className="font-medium text-slate-300 bg-blue-500/10 px-2 py-0.5 rounded text-blue-200 text-xs">
                {job.category.name}
            </span>
            </div>
            <div className="flex items-center gap-2">
            <Building className="h-4 w-4 text-slate-500" /> 
            <span className="truncate">{job.institution.name}</span>
            </div>
            <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-slate-500" />
            <span className="truncate">{job.area.name}</span>
            </div>
        </div>

        <p className="text-sm text-slate-500 line-clamp-2 leading-relaxed mb-4">
            {job.description.replace(/<[^>]*>?/gm, '')}
        </p>
      </div>

      <div className="pt-4 border-t border-white/5 flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <Clock className="h-3.5 w-3.5" />
            <span>{timeAgo(job.createdAt)}</span>
        </div>
        <span className="text-xs font-medium text-blue-500 group-hover:underline">Ver detalhes</span>
      </div>
    </div>
  );
}

// Componente Card de Feature
function FeatureCard({
  icon: Icon,
  title,
  description,
}: {
  icon: React.ElementType;
  title: string;
  description: string;
}) {
  return (
    <div className="flex flex-col items-center text-center p-6 rounded-2xl border border-transparent hover:border-white/5 hover:bg-white/[0.02] transition-colors">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-500/10 text-blue-400 mb-6 ring-1 ring-blue-500/20 shadow-[0_0_15px_rgba(59,130,246,0.15)]">
        <Icon className="h-7 w-7" />
      </div>
      <h3 className="text-xl font-bold text-white mb-3">{title}</h3>
      <p className="text-base text-slate-400 leading-relaxed max-w-xs mx-auto">{description}</p>
    </div>
  );
}