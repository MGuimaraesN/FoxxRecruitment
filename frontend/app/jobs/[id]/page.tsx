"use client";

import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { QuickApplyModal } from '@/components/QuickApplyModal';
import { Button } from '@/components/ui/button';
import { 
    Loader2, MapPin, Building, Calendar, ArrowLeft, 
    CheckCircle, BookOpen, Mail, Share2, Globe, Phone, School 
} from 'lucide-react';
import { toast } from 'sonner';

const safeColor = (color: string | null | undefined, fallback = '#1e3a8a') => {
    if (!color) return fallback;
    return color.startsWith('#') ? color : `#${color}`;
};

export default function JobDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const { id } = resolvedParams;
  const { user, token } = useAuth();
  const router = useRouter();

  const [job, setJob] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [hasApplied, setHasApplied] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    const fetchJob = async () => {
      try {
        const headers: any = {};
        if (token) headers['Authorization'] = `Bearer ${token}`;
        
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/jobs/${id}`, { 
            headers,
            cache: 'no-store'
        });

        if (res.ok) {
            const data = await res.json();
            setJob(data);
        } else {
            router.push('/');
        }
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchJob();
  }, [id, router, token]);

  useEffect(() => {
    const checkApplication = async () => {
        if (!token || !id) return;
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/applications/check/${id}`, {
                headers: { Authorization: `Bearer ${token}` },
                cache: 'no-store'
            });
            if (res.ok) {
                const { hasApplied } = await res.json();
                setHasApplied(hasApplied);
            }
        } catch (e) { console.error(e); }
    };
    if (!loading && job) checkApplication();
  }, [token, id, loading, job]);

  const handleApplyClick = () => {
      // Abre o modal para todos: 
      // - Se logado: Pede para confirmar dados/CV
      // - Se não logado: Pede login/cadastro
      setIsModalOpen(true);
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    toast.success("Link do edital copiado!");
  };

  if (loading) return <div className="h-screen flex items-center justify-center bg-slate-50"><Loader2 className="animate-spin text-blue-800" /></div>;
  if (!job) return null;

  const primaryColor = safeColor(job.institution.primaryColor);
  const logoUrl = job.institution.logoUrl ? `${process.env.NEXT_PUBLIC_API_URL}${job.institution.logoUrl}` : null;

  return (
    <div className="min-h-screen bg-slate-50 font-sans flex flex-col">
      <header className="bg-white border-b border-slate-200 shadow-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 h-20 flex items-center justify-between">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={() => router.back()} className="text-slate-500 hover:text-slate-800">
                    <ArrowLeft className="h-5 w-5" />
                </Button>
                <div className="h-8 w-px bg-slate-200 hidden md:block"></div>
                <div className="flex items-center gap-3">
                    {logoUrl ? (
                        <img src={logoUrl} alt={job.institution.name} className="h-10 w-auto object-contain" />
                    ) : (
                        <div className="h-10 w-10 bg-slate-100 rounded flex items-center justify-center text-slate-400">
                            <School className="h-5 w-5" />
                        </div>
                    )}
                    <div>
                        <span className="text-sm font-bold text-slate-800 block leading-tight">{job.institution.name}</span>
                        <span className="text-xs text-slate-500 block">Portal de Oportunidades</span>
                    </div>
                </div>
            </div>
            <div>
                 <Button variant="outline" size="sm" onClick={handleShare} className="gap-2 text-slate-600 border-slate-300">
                    <Share2 className="h-4 w-4" /> <span className="hidden sm:inline">Compartilhar</span>
                 </Button>
            </div>
        </div>
      </header>

      <div className="relative py-16 px-4 text-white" style={{ backgroundColor: primaryColor }}>
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="relative z-10 container mx-auto max-w-5xl">
            <div className="inline-flex items-center px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-xs font-medium mb-6 border border-white/20">
                <BookOpen className="h-3 w-3 mr-2" />
                {job.category.name}
            </div>
            <h1 className="text-3xl md:text-5xl font-bold mb-4 leading-tight">{job.title}</h1>
            <div className="flex flex-wrap gap-6 text-sm md:text-base opacity-90 font-medium">
                <span className="flex items-center"><Building className="w-4 h-4 mr-2"/> {job.companyName || job.institution.name}</span>
                <span className="flex items-center"><MapPin className="w-4 h-4 mr-2"/> {job.area.name}</span>
                <span className="flex items-center"><Calendar className="w-4 h-4 mr-2"/> Publicado em: {new Date(job.createdAt).toLocaleDateString()}</span>
            </div>
        </div>
      </div>

      <div className="flex-1 container mx-auto px-4 py-12 max-w-5xl">
         <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            <div className="lg:col-span-2 space-y-8">
                <div className="bg-white p-8 rounded-xl shadow-sm border border-slate-200">
                    <h3 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2 pb-4 border-b border-slate-100">
                        Detalhes do Edital
                    </h3>
                    <div 
                        className="prose prose-slate max-w-none text-slate-700 leading-relaxed" 
                        dangerouslySetInnerHTML={{ __html: job.description }} 
                    />
                </div>
            </div>

            <div className="lg:col-span-1">
                <div className="sticky top-24 space-y-6">
                    
                    <div className="bg-white p-6 rounded-xl shadow-lg shadow-slate-200/50 border border-slate-100">
                        <div className="mb-6">
                            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Situação da Inscrição</span>
                            <div className="flex items-center justify-between mt-1">
                                <span className="text-slate-900 font-semibold">Inscrições Abertas</span>
                                <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse"></div>
                            </div>
                        </div>

                        {hasApplied ? (
                            <div className="w-full bg-green-50 border border-green-200 text-green-700 font-bold py-4 px-4 rounded-xl flex flex-col items-center justify-center gap-2 text-center">
                                <CheckCircle className="h-8 w-8" />
                                <span>Inscrição Confirmada!</span>
                                <Button variant="link" onClick={() => router.push('/dashboard')} className="text-green-800 h-auto p-0">
                                    Ver no Painel
                                </Button>
                            </div>
                        ) : (
                            <Button 
                                onClick={handleApplyClick} 
                                className="w-full h-14 text-lg font-bold text-white rounded-xl shadow-xl transition-all hover:scale-[1.02] active:scale-[0.98]"
                                style={{ 
                                    backgroundColor: primaryColor,
                                    boxShadow: `0 10px 30px -10px ${primaryColor}80` 
                                }}
                            >
                                Quero me Inscrever
                            </Button>
                        )}

                        <p className="text-xs text-slate-400 text-center mt-4 leading-relaxed">
                            A inscrição implica na aceitação das normas da instituição.
                        </p>
                    </div>

                    <div className="bg-white p-6 rounded-xl border border-slate-200">
                        <h4 className="text-sm font-bold text-slate-900 mb-4">Suporte</h4>
                        <div className="space-y-3">
                            <div className="flex items-center gap-3 text-sm text-slate-600">
                                <Mail className="h-4 w-4 text-slate-400" /><span className="truncate">{job.email}</span>
                            </div>
                            {job.telephone && (
                                <div className="flex items-center gap-3 text-sm text-slate-600">
                                    <Phone className="h-4 w-4 text-slate-400" /><span>{job.telephone}</span>
                                </div>
                            )}
                        </div>
                    </div>

                </div>
            </div>

         </div>
      </div>

      <footer className="bg-slate-900 text-slate-400 py-8 text-center text-sm mt-auto">
        <div className="container mx-auto px-4">
            <p>Sistema de Processos Seletivos - {job.institution.name}</p>
        </div>
      </footer>

      <QuickApplyModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        jobTitle={job.title}
        jobId={job.id} 
        jobInstitutionId={job.institution.id}
        institutionName={job.institution.name}
        onSuccess={() => setHasApplied(true)}
      />
    </div>
  );
}