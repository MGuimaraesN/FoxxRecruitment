"use client";

import { useEffect, useState, FormEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

// UI Components
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
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Building,
  Loader2,
  Briefcase,
  Waypoints,
  MapPin,
  Clock,
  Search,
  Mail,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  GraduationCap,
  Globe,
  Lock,
  AlertCircle
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

interface Institution {
  id: number;
  name: string;
  logoUrl?: string;
  primaryColor?: string;
}

interface Job {
  id: number;
  title: string;
  description: string;
  createdAt: string;
  area: { name: string };
  category: { name: string };
  institution: Institution;
  companyName?: string;
}

// --- CONSTANTE DO NOME DO SISTEMA ---
const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME || "Foxx Recruitment";

export default function LandingPage() {
  // Data States
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loadingJobs, setLoadingJobs] = useState(true);
  const [totalJobs, setTotalJobs] = useState(0); 
  const [partners, setPartners] = useState<Institution[]>([]); 

  // Filter States
  const [filters, setFilters] = useState({ search: '', areaId: '', categoryId: '' });
  const [areas, setAreas] = useState<Area[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  
  // UI States
  const [showLoginModal, setShowLoginModal] = useState(false);
  
  // Auth
  const { login, user, loading } = useAuth();
  const router = useRouter();

  // --- CORREÇÃO: Redirecionamento seguro ---
  // Só redireciona se o carregamento terminou E temos um usuário válido.
  useEffect(() => {
      if (!loading && user) {
          router.push('/dashboard');
      }
  }, [user, loading, router]);

  // Init Title
  useEffect(() => {
    document.title = `${ APP_NAME } - Oportunidades Acadêmicas`;
  }, []);

  // Fetch Data Logic
  useEffect(() => {
    const fetchData = async () => {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
      
      setLoadingJobs(true);
      try {
        const query = new URLSearchParams({
          search: filters.search,
          areaId: filters.areaId,
          categoryId: filters.categoryId,
          limit: '9' 
        }).toString();
        
        const jobRes = await fetch(`${apiUrl}/jobs/public?${query}`);
        if (jobRes.ok) {
          const json = await jobRes.json();
          setJobs(json.data || []);
          setTotalJobs(json.meta?.total || 0);
        }

        if (areas.length === 0) {
             const [areaRes, catRes, instRes] = await Promise.all([
                fetch(`${apiUrl}/areas/public`),
                fetch(`${apiUrl}/categories/public`),
                fetch(`${apiUrl}/institutions/public`)
             ]);

             if (areaRes.ok) setAreas(await areaRes.json());
             if (catRes.ok) setCategories(await catRes.json());
             if (instRes.ok) setPartners(await instRes.json());
        }

      } catch (error) {
        console.error("Erro ao carregar dados:", error);
      } finally {
        setLoadingJobs(false);
      }
    };

    fetchData();
  }, [filters, areas.length]);

  // Loader de inicialização para evitar piscada da tela de login
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#020617]">
        <Loader2 className="h-10 w-10 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-[#020617] text-slate-50 selection:bg-blue-500/30 selection:text-blue-100 font-sans overflow-x-hidden">
      
      {/* Header Flutuante */}
      <header className="fixed top-0 z-50 w-full border-b border-white/5 bg-[#020617]/80 backdrop-blur-xl">
        <div className="container mx-auto flex h-16 items-center justify-between px-4 md:px-6">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-900/20 transition-transform group-hover:scale-105">
              <Building className="h-5 w-5" />
              <div className="absolute inset-0 rounded-xl ring-1 ring-inset ring-white/20" />
            </div>
            <span className="text-xl font-bold text-white tracking-tight">{ APP_NAME }</span>
          </Link>
          <nav className="flex items-center gap-3">
            <Button 
                onClick={() => setShowLoginModal(true)} 
                variant="ghost"
                className="text-slate-300 hover:text-white hover:bg-white/5 rounded-full px-5"
            >
              Login
            </Button>
            <Button asChild className="hidden md:flex bg-blue-600 hover:bg-blue-500 text-white rounded-full px-6 shadow-lg shadow-blue-900/20">
                <Link href="/register">Criar Conta</Link>
            </Button>
          </nav>
        </div>
      </header>

      <main className="flex-1 pt-16">
        
        {/* --- HERO SECTION --- */}
        <section className="relative w-full py-24 md:py-32 lg:py-40 overflow-hidden flex flex-col items-center justify-center text-center px-4">
            
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1200px] h-[600px] bg-blue-600/15 rounded-[100%] blur-[120px] -z-10 pointer-events-none" />
            <div className="absolute bottom-0 right-0 w-[800px] h-[800px] bg-purple-600/10 rounded-full blur-[130px] -z-10 pointer-events-none" />
            <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))]" />

            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-800/50 border border-slate-700/50 text-blue-300 text-xs font-medium mb-8 animate-in fade-in slide-in-from-bottom-4 duration-1000 backdrop-blur-sm">
                <Sparkles className="h-3 w-3 text-yellow-400" />
                <span>A plataforma oficial das universidades</span>
            </div>

            <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-white mb-6 max-w-5xl leading-[1.1] drop-shadow-sm">
                Sua carreira começa na <br className="hidden md:block" />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400">
                    velocidade certa.
                </span>
            </h1>
            
            <p className="max-w-2xl text-lg md:text-xl text-slate-400 leading-relaxed mb-10">
                O hub centralizado para estágios, iniciação científica e oportunidades exclusivas da sua rede universitária.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-200">
                <Button asChild size="lg" className="h-14 px-8 text-lg bg-blue-600 hover:bg-blue-500 text-white rounded-full shadow-[0_0_30px_-5px_rgba(37,99,235,0.4)] transition-all hover:scale-105">
                    <Link href="#vagas">
                        Ver Vagas Agora
                        <ArrowRight className="ml-2 h-5 w-5" />
                    </Link>
                </Button>
                <Button 
                    variant="outline" 
                    size="lg" 
                    className="h-14 px-8 text-lg bg-transparent border-slate-700 text-slate-300 hover:bg-slate-800/50 hover:text-white rounded-full transition-all"
                    onClick={() => setShowLoginModal(true)}
                >
                    Acessar Painel
                </Button>
            </div>

        </section>

        {partners.length > 0 && (
            <section className="py-10 border-y border-white/5 bg-slate-900/30 overflow-hidden">
                <div className="container mx-auto px-4">
                    <p className="text-center text-slate-500 text-sm font-medium uppercase tracking-widest mb-8">Instituições Participantes</p>
                    <div className="flex flex-wrap justify-center gap-8 md:gap-16 items-center opacity-70 grayscale hover:grayscale-0 transition-all duration-500">
                        {partners.slice(0, 6).map(p => (
                            <div key={p.id} className="flex items-center gap-2 group">
                                {p.logoUrl ? (
                                    <img 
                                        src={`${process.env.NEXT_PUBLIC_API_URL}${p.logoUrl}`} 
                                        alt={p.name} 
                                        className="h-8 md:h-10 object-contain brightness-0 invert group-hover:brightness-100 group-hover:invert-0 transition-all"
                                    />
                                ) : (
                                    <div className="flex items-center gap-2 text-slate-400 group-hover:text-white transition-colors">
                                        <GraduationCap className="h-6 w-6" />
                                        <span className="font-bold text-lg">{p.name}</span>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </section>
        )}

        <section className="py-24 bg-slate-900 border-t border-white/5 relative overflow-hidden">
           <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(59,130,246,0.1),transparent_70%)]" />
           <div className="container mx-auto max-w-6xl px-4 relative z-10">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <FeatureCard
                icon={Briefcase}
                title="Centralizado"
                description="Todas as vagas da sua faculdade e parceiros em um único dashboard intuitivo."
              />
              <FeatureCard
                icon={Waypoints}
                title="Conexão Real"
                description="Sistema integrado com as coordenações de curso para validar oportunidades."
              />
              <FeatureCard
                icon={CheckCircle2}
                title="Transparência"
                description="Acompanhe o status da sua candidatura em tempo real. Sem vácuo."
              />
            </div>
          </div>
        </section>
      </main>

      <footer className="bg-[#020617] py-12 border-t border-white/5 text-sm text-slate-500">
        <div className="container mx-auto px-4 flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-2 text-white font-bold">
                <div className="h-6 w-6 bg-blue-600 rounded flex items-center justify-center"><Building className="h-3 w-3" /></div>
                { APP_NAME }
            </div>
            <div className="flex flex-col md:flex-row items-center gap-4">
                 <p>&copy; {new Date().getFullYear()} { APP_NAME }. Todos os direitos reservados.</p>
            </div>
        </div>
      </footer>

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

// --- COMPONENTES AUXILIARES ---

function StatItem({ value, label }: { value: string | number, label: string }) {
    return (
        <div className="flex flex-col items-center">
            <span className="text-3xl md:text-5xl font-bold text-white mb-2 bg-clip-text text-transparent bg-gradient-to-b from-white to-white/60">{value}</span>
            <span className="text-blue-400/80 text-xs md:text-sm uppercase tracking-widest font-medium">{label}</span>
        </div>
    );
}

function JobCard({ job }: { job: Job }) {
  const timeAgo = (date: string) => {
    const seconds = Math.floor((new Date().getTime() - new Date(date).getTime()) / 1000);
    if (seconds > 86400) return `Há ${Math.floor(seconds/86400)} dias`;
    if (seconds > 3600) return `Há ${Math.floor(seconds/3600)}h`;
    return 'Recente';
  };

  const accentColor = job.institution.primaryColor || '#2563eb';

  return (
    <div className="group relative bg-[#0f172a] rounded-2xl border border-white/5 hover:border-white/10 p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl hover:shadow-black/50 flex flex-col h-full">
      <div className="flex justify-between items-start mb-4">
         <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-white p-1 flex items-center justify-center overflow-hidden shadow-sm">
                {job.institution.logoUrl ? (
                    <img src={`${process.env.NEXT_PUBLIC_API_URL}${job.institution.logoUrl}`} alt={job.institution.name} className="w-full h-full object-contain" />
                ) : (
                    <Building className="h-5 w-5 text-slate-800" />
                )}
            </div>
            <div>
                <p className="text-xs text-slate-400 font-medium line-clamp-1">{job.companyName || job.institution.name}</p>
                <span 
                    className="text-[10px] px-2 py-0.5 rounded-full border font-semibold uppercase tracking-wide"
                    style={{ 
                        color: accentColor, 
                        borderColor: `${accentColor}40`, 
                        backgroundColor: `${accentColor}10` 
                    }}
                >
                    {job.category.name}
                </span>
            </div>
         </div>
      </div>

      <div className="flex-1 mb-6">
        <h3 className="text-lg font-bold text-white mb-2 line-clamp-2 group-hover:text-blue-400 transition-colors">
            {job.title}
        </h3>
        <div className="flex flex-col gap-2 mt-3">
            <div className="flex items-center text-sm text-slate-400">
                <MapPin className="h-4 w-4 mr-2 text-slate-500" />
                <span className="truncate">{job.area.name}</span>
            </div>
            <div className="flex items-center text-sm text-slate-400">
                <Globe className="h-4 w-4 mr-2 text-slate-500" />
                <span>{job.institution.name}</span>
            </div>
        </div>
      </div>

      <div className="pt-4 border-t border-white/5 flex items-center justify-between mt-auto">
        <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <Clock className="h-3.5 w-3.5" />
            <span>{timeAgo(job.createdAt)}</span>
        </div>
        <Link href={`/jobs/${job.id}`} className="text-xs font-medium text-blue-400 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all translate-x-2 group-hover:translate-x-0 hover:text-blue-300 cursor-pointer">
            Ver Vaga <ArrowRight className="h-3 w-3" />
        </Link>
      </div>
    </div>
  );
}

function FeatureCard({ icon: Icon, title, description }: { icon: any, title: string, description: string }) {
  return (
    <div className="group p-8 rounded-3xl bg-white/5 border border-white/5 hover:bg-white/10 transition-all">
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-600/20 text-blue-400 mb-6 group-hover:bg-blue-600 group-hover:text-white transition-colors">
        <Icon className="h-6 w-6" />
      </div>
      <h3 className="text-xl font-bold text-white mb-3">{title}</h3>
      <p className="text-base text-slate-400 leading-relaxed">{description}</p>
    </div>
  );
}

// ============================================
// MODAL DE LOGIN ATUALIZADO
// ============================================
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
  const [isLoading, setIsLoading] = useState(false);

  const handleLoginSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      if (res.ok) {
        const data = await res.json();
        toast.success('Login realizado!');
        await login(data.access_token);
        // O redirecionamento é tratado pelo login() ou pelo useEffect da página
      } else {
        const data = await res.json();
        setError(data.error || 'Falha no login.');
        toast.error(data.error || 'Falha no login.');
      }
    } catch (err) {
      setError('Erro de conexão.');
      toast.error('Erro de conexão.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px] bg-[#0f172a] border-white/10 text-slate-50 p-0 overflow-hidden shadow-2xl shadow-black">
        
        {/* Cabeçalho Visual */}
        <div className="bg-slate-950 p-6 pb-4 border-b border-white/5">
            <div className="mx-auto w-12 h-12 bg-blue-600/10 rounded-xl flex items-center justify-center mb-4 text-blue-500">
                <Building className="h-6 w-6" />
            </div>
            <DialogHeader className="space-y-2">
                <DialogTitle className="text-2xl font-bold text-center text-white">Acesse sua conta</DialogTitle>
                <DialogDescription className="text-center text-slate-400">
                    Entre com suas credenciais para continuar sua jornada.
                </DialogDescription>
            </DialogHeader>
        </div>

        <div className="p-6 pt-4">
            <form onSubmit={handleLoginSubmit} className="space-y-4">
                
                {/* Inputs com Ícones */}
                <div className="space-y-2">
                    <div className="relative">
                        <Mail className="absolute left-3 top-3 h-4 w-4 text-slate-500" />
                        <Input 
                            type="email" 
                            value={email} 
                            onChange={e=>setEmail(e.target.value)} 
                            placeholder="seu@email.com" 
                            required 
                            className="bg-slate-900/50 border-slate-800 text-white pl-10 focus:border-blue-500/50 focus:ring-blue-500/20 transition-all h-11" 
                        />
                    </div>
                    
                    <div className="space-y-1">
                        <div className="relative">
                            <Lock className="absolute left-3 top-3 h-4 w-4 text-slate-500" />
                            <Input 
                                type="password" 
                                value={password} 
                                onChange={e=>setPassword(e.target.value)} 
                                placeholder="Sua senha" 
                                required 
                                className="bg-slate-900/50 border-slate-800 text-white pl-10 focus:border-blue-500/50 focus:ring-blue-500/20 transition-all h-11" 
                            />
                        </div>
                        
                        {/* Link Esqueceu Senha */}
                        <div className="flex justify-end">
                            <Link 
                                href="/forgot-password" 
                                className="text-xs text-blue-400 hover:text-blue-300 transition-colors pt-1 font-medium"
                                onClick={onClose}
                            >
                                Esqueceu a senha?
                            </Link>
                        </div>
                    </div>
                </div>
                
                {/* Display de Erro */}
                {error && (
                    <div className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                        <AlertCircle className="h-4 w-4 shrink-0" />
                        <p>{error}</p>
                    </div>
                )}
                
                <Button 
                    type="submit" 
                    disabled={isLoading} 
                    className="w-full h-11 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-medium rounded-xl shadow-lg shadow-blue-900/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
                >
                    {isLoading ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin"/>
                            Entrando...
                        </>
                    ) : 'Entrar na Plataforma'}
                </Button>
            </form>

            {/* Rodapé do Modal */}
            <div className="mt-6 text-center text-sm text-slate-400">
                Não tem uma conta?{' '}
                <Link href="/register" className="text-blue-400 hover:text-blue-300 font-semibold hover:underline transition-all" onClick={onClose}>
                    Crie agora
                </Link>
            </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}