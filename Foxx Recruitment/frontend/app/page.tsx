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
} from '@/components/ui/dialog';
import {
  Building,
  Loader2,
  LogIn,
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
  Globe
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
  const [totalJobs, setTotalJobs] = useState(0); // Contagem real
  const [partners, setPartners] = useState<Institution[]>([]); // Instituições reais

  // Filter States
  const [filters, setFilters] = useState({ search: '', areaId: '', categoryId: '' });
  const [areas, setAreas] = useState<Area[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  
  // UI States
  const [showLoginModal, setShowLoginModal] = useState(false);
  
  // Auth
  const { login, user, loading } = useAuth();
  const router = useRouter();

  // Redirect if logged
  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
    if (token || user) router.push('/dashboard');
  }, [user, router]);

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
        // 1. Buscar Vagas (Com filtros)
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

        // 2. Buscar Metadados (Apenas se ainda não carregou)
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

  if (loading || user) {
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
            
            {/* Backgrounds */}
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
                    <Link href="/register">
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

            {/* Live Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-16 mt-20 pt-10 border-t border-white/5">
                <StatItem value={totalJobs > 0 ? `${totalJobs}+` : "Carregando..."} label="Vagas Ativas" />
                <StatItem value={partners.length > 0 ? `${partners.length}` : "Diversas"} label="Instituições" />
                <StatItem value="100%" label="Gratuito" />
                <StatItem value="24h" label="Disponibilidade" />
            </div>
        </section>

        {/* --- PARCEIROS (NOVO) --- */}
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

        {/* --- LISTAGEM DE VAGAS --- */}
        <section id="vagas" className="py-20 md:py-32 relative">
          <div className="container mx-auto max-w-7xl px-4">
            
            <div className="text-center mb-12">
                <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Mural de Oportunidades</h2>
                <p className="text-slate-400">Filtre, encontre e decole na sua carreira.</p>
            </div>

            {/* Filtros Flutuantes */}
            <div className="sticky top-20 z-30 mb-12 -mx-4 md:mx-auto max-w-5xl">
              <div className="bg-slate-900/80 backdrop-blur-xl border border-white/10 rounded-2xl p-2 shadow-2xl shadow-black/50 mx-4 ring-1 ring-white/5">
                <div className="flex flex-col md:flex-row gap-2">
                  
                  <div className="relative flex-1">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 h-5 w-5" />
                    <Input
                        placeholder="Busque por cargo, empresa ou tag..."
                        value={filters.search}
                        onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                        className="w-full bg-transparent border-0 text-white placeholder:text-slate-500 focus-visible:ring-0 h-12 pl-12 rounded-xl"
                    />
                  </div>

                  <div className="flex gap-2 overflow-x-auto md:overflow-visible pb-2 md:pb-0 px-1 md:px-0 scrollbar-hide">
                    <Select value={filters.areaId} onValueChange={(value) => setFilters(prev => ({ ...prev, areaId: value === 'all' ? '' : value }))}>
                        <SelectTrigger className="w-[160px] bg-white/5 border-0 text-slate-300 h-12 rounded-xl hover:bg-white/10 transition-all">
                            <SelectValue placeholder="Área" />
                        </SelectTrigger>
                        <SelectContent className="bg-[#0f172a] border-slate-800 text-slate-200">
                            <SelectItem value="all">Todas as Áreas</SelectItem>
                            {areas.map(area => <SelectItem key={area.id} value={String(area.id)}>{area.name}</SelectItem>)}
                        </SelectContent>
                    </Select>

                    <Select value={filters.categoryId} onValueChange={(value) => setFilters(prev => ({ ...prev, categoryId: value === 'all' ? '' : value }))}>
                        <SelectTrigger className="w-[160px] bg-white/5 border-0 text-slate-300 h-12 rounded-xl hover:bg-white/10 transition-all">
                            <SelectValue placeholder="Nível" />
                        </SelectTrigger>
                        <SelectContent className="bg-[#0f172a] border-slate-800 text-slate-200">
                            <SelectItem value="all">Todos os Níveis</SelectItem>
                            {categories.map(cat => <SelectItem key={cat.id} value={String(cat.id)}>{cat.name}</SelectItem>)}
                        </SelectContent>
                    </Select>
                    
                    <Button className="h-12 px-6 bg-blue-600 hover:bg-blue-500 text-white rounded-xl shadow-lg">
                        Buscar
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            {/* Grid de Cards */}
            {loadingJobs ? (
              <div className="flex flex-col items-center justify-center py-20 text-slate-500">
                <Loader2 className="h-10 w-10 animate-spin mb-4 text-blue-500" />
                <p>Carregando vagas...</p>
              </div>
            ) : jobs.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {jobs.map((job) => (
                  <JobCard key={job.id} job={job} />
                ))}
              </div>
            ) : (
              <div className="text-center py-24 bg-white/5 rounded-3xl border border-white/5 border-dashed">
                  <div className="bg-white/5 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Briefcase className="h-8 w-8 text-slate-500" />
                  </div>
                  <h3 className="text-xl font-semibold text-white">Nenhuma vaga encontrada</h3>
                  <p className="text-slate-400 mt-2">Tente ajustar seus filtros de busca.</p>
              </div>
            )}

            {jobs.length > 0 && (
                <div className="mt-16 text-center">
                     <Button asChild size="lg" variant="secondary" className="rounded-full px-8">
                        <Link href="/register">Cadastre-se para ver tudo</Link>
                    </Button>
                </div>
            )}
          </div>
        </section>

        {/* --- FEATURES --- */}
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

// --- COMPONENTES ---

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

  // Branding Color (Fallback to blue if undefined)
  const accentColor = job.institution.primaryColor || '#2563eb';

  return (
    <div className="group relative bg-[#0f172a] rounded-2xl border border-white/5 hover:border-white/10 p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl hover:shadow-black/50 flex flex-col h-full">
      
      {/* Top: Institution Info */}
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

      {/* Middle: Job Title & Meta */}
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

      {/* Bottom: Footer */}
      <div className="pt-4 border-t border-white/5 flex items-center justify-between mt-auto">
        <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <Clock className="h-3.5 w-3.5" />
            <span>{timeAgo(job.createdAt)}</span>
        </div>
        <Link href="/register" className="text-xs font-medium text-blue-400 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all translate-x-2 group-hover:translate-x-0">
            Candidatar-se <ArrowRight className="h-3 w-3" />
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

// --- LOGIN MODAL (Code maintained for functionality) ---
interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  login: (token: string) => Promise<any>;
  router: any;
}
function LoginModal({ isOpen, onClose, login, router }: LoginModalProps) {
  // ... (Lógica de login inalterada, apenas replicando para manter o arquivo funcional)
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
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
    setLoadingAction('forgot');
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
    setLoadingAction('login');
    setError(null);
    try {
      const res = await fetch(LOGIN_API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      if (res.ok) {
        const data = await res.json();
        toast.success('Login realizado!');
        await login(data.access_token);
        router.push('/dashboard');
      } else {
        const data = await res.json();
        setError(data.error || 'Falha no login.');
        toast.error(data.error || 'Falha no login.');
      }
    } catch (err) { setError('Erro de conexão.'); toast.error('Erro de conexão.'); }
    finally { setLoadingAction(null); }
  };

  const resetState = () => {
    setIsResetSent(false);
    setError(null);
    setEmail('');
    setPassword('');
    setLoadingAction(null);
  };

  const getButtonText = () => {
    if (loadingAction === 'forgot') return 'Enviando link...';
    if (loadingAction === 'login') return 'Entrando...';
    return 'Entrar';
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if(!open) resetState(); onClose(); }}>
      <DialogContent className="sm:max-w-md bg-[#18181b] border-slate-800 text-slate-50">
        {isResetSent ? (
          <div className="animate-in fade-in zoom-in duration-300 text-left">
            <h3 className="text-lg font-bold text-emerald-400 mb-2 mt-4">E-mail enviado!</h3>
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
            <DialogHeader><DialogTitle className="text-center text-white">Login</DialogTitle></DialogHeader>
            <form onSubmit={handleLoginSubmit} className="space-y-4 mt-2">
                <Input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="Email" required className="bg-slate-900 border-slate-700 text-white" />
                <Input type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="Senha" required className="bg-slate-900 border-slate-700 text-white" />
                
                <div className="flex justify-end">
                  <button type="button" onClick={handleForgotPassword} className="text-xs font-medium text-blue-400 hover:text-blue-300 hover:underline disabled:opacity-50" disabled={isLoading}>
                    Esqueceu sua senha?
                  </button>
                </div>

                {error && <p className="text-red-400 text-sm text-center">{error}</p>}
                
                <Button type="submit" disabled={isLoading} className="w-full bg-blue-600 hover:bg-blue-500 text-white">
                    {isLoading ? <Loader2 className="h-4 w-4 animate-spin"/> : getButtonText()}
                </Button>
            </form>
            <p className="mt-4 text-center text-sm text-slate-500">
              Não tem uma conta?{' '}
              <Link href="/register" className="font-semibold text-blue-400 hover:text-blue-300 hover:underline" onClick={onClose}>
                Cadastre-se
              </Link>
            </p>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}