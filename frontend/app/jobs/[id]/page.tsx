"use client";

import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { 
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription 
} from '@/components/ui/dialog';
import { 
    Loader2, MapPin, Building, Calendar, ArrowLeft, 
    CheckCircle2, Share2, Globe, DollarSign, Eye, Briefcase
} from 'lucide-react';
import { toast } from 'sonner';

const safeColor = (color: string | null | undefined, fallback = '#2563eb') => {
    if (!color) return fallback;
    return color.startsWith('#') ? color : `#${color}`;
};

export default function JobDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const { id } = resolvedParams;
  const { token } = useAuth();
  const router = useRouter();

  const [job, setJob] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  useEffect(() => {
    const fetchJob = async () => {
      try {
        const headers: any = {};
        if (token) headers['Authorization'] = `Bearer ${token}`;
        
        // Adicionando cache: 'no-store' para garantir dados frescos
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/jobs/${id}`, { 
            headers,
            cache: 'no-store'
        });

        if (res.ok) {
            const data = await res.json();
            setJob(data);
        } else {
            // Se não encontrar, redireciona ou mostra erro (aqui redirecionando para home por simplicidade)
            router.push('/');
        }
      } catch (error) {
        console.error(error);
        toast.error("Erro ao carregar a vaga.");
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchJob();
  }, [id, router, token]);

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    toast.success("Link copiado para a área de transferência!");
  };

  const handleGoToCheckout = () => {
      router.push(`/jobs/${id}/apply`);
  };

  if (loading) return (
      <div className="h-screen flex items-center justify-center bg-slate-50">
          <Loader2 className="animate-spin text-blue-800 h-8 w-8" />
      </div>
  );
  
  if (!job) return null;

  const primaryColor = safeColor(job.institution.primaryColor);
  const logoUrl = job.institution.logoUrl ? `${process.env.NEXT_PUBLIC_API_URL}${job.institution.logoUrl}` : null;

  return (
    <div className="min-h-screen bg-white font-sans flex flex-col">
      {/* Header Minimalista */}
      <header className="bg-white/80 backdrop-blur-md border-b border-slate-100 sticky top-0 z-40">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
            <Button variant="ghost" size="sm" onClick={() => router.back()} className="text-slate-500 hover:text-slate-900 gap-2 pl-0">
                <ArrowLeft className="h-4 w-4" /> Voltar
            </Button>
            <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-slate-700 hidden sm:inline-block">{job.institution.name}</span>
                {logoUrl && <img src={logoUrl} alt="Logo" className="h-8 w-8 object-contain rounded-full border border-slate-100" />}
            </div>
        </div>
      </header>

      {/* --- HERO SECTION --- */}
      <section className="relative pt-12 pb-20 px-4 overflow-hidden bg-slate-50">
         {/* Background Decorativo */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-full pointer-events-none">
             <div className="absolute top-20 right-0 w-96 h-96 bg-blue-200/20 rounded-full blur-3xl mix-blend-multiply filter opacity-70 animate-blob"></div>
             <div className="absolute top-20 left-0 w-96 h-96 bg-purple-200/20 rounded-full blur-3xl mix-blend-multiply filter opacity-70 animate-blob animation-delay-2000"></div>
        </div>

        <div className="container mx-auto max-w-4xl relative z-10 text-center">
            
            {/* Badge Instituição */}
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white border border-slate-200 shadow-sm mb-6">
                <Building className="h-3 w-3 text-slate-400" />
                <span className="text-xs font-semibold text-slate-600 uppercase tracking-wider">{job.companyName || job.institution.name}</span>
            </div>

            {/* Título da Vaga */}
            <h1 className="text-4xl md:text-6xl font-extrabold text-slate-900 tracking-tight mb-6 leading-tight">
                {job.title}
            </h1>

            {/* Salário e Local */}
            <div className="flex flex-wrap items-center justify-center gap-4 mb-10">
                 <div className="flex items-center gap-2 px-4 py-2 bg-green-50 text-green-700 rounded-lg border border-green-100 font-medium">
                    <DollarSign className="h-5 w-5" />
                    <span>Salário a combinar</span> {/* Placeholder visual, já que não temos no banco ainda */}
                 </div>
                 <div className="flex items-center gap-2 px-4 py-2 bg-white text-slate-600 rounded-lg border border-slate-200">
                    <MapPin className="h-4 w-4" />
                    <span>{job.area.name}</span>
                 </div>
                 <div className="flex items-center gap-2 px-4 py-2 bg-white text-slate-600 rounded-lg border border-slate-200">
                    <Briefcase className="h-4 w-4" />
                    <span>{job.category.name}</span>
                 </div>
            </div>

            {/* CTA Principal */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Button 
                    size="lg" 
                    className="h-14 px-8 text-lg font-bold rounded-full shadow-xl shadow-blue-500/20 hover:scale-105 transition-transform text-white"
                    style={{ backgroundColor: primaryColor }}
                    onClick={() => setIsDetailModalOpen(true)}
                >
                    <Eye className="mr-2 h-5 w-5" />
                    Ver Detalhes da Vaga
                </Button>
                <Button 
                    size="lg" 
                    variant="outline" 
                    className="h-14 px-8 text-lg rounded-full bg-white hover:bg-slate-50 border-slate-200"
                    onClick={handleShare}
                >
                    <Share2 className="mr-2 h-5 w-5" />
                    Compartilhar
                </Button>
            </div>

            <p className="mt-6 text-sm text-slate-500 flex items-center justify-center gap-2">
                <Calendar className="h-4 w-4" />
                Publicado em {new Date(job.createdAt).toLocaleDateString()}
            </p>
        </div>
      </section>

      {/* --- PREVIEW SECTION (Teaser) --- */}
      <section className="py-16 bg-white">
          <div className="container mx-auto max-w-3xl px-4">
              <div className="text-center mb-8">
                  <h2 className="text-2xl font-bold text-slate-900">O que você vai fazer?</h2>
                  <p className="text-slate-500">Confira um resumo das responsabilidades.</p>
              </div>
              
              {/* Renderização limitada do HTML para teaser */}
              <div className="prose prose-slate prose-lg mx-auto text-center line-clamp-4 opacity-70">
                  <div dangerouslySetInnerHTML={{ __html: job.description }} />
              </div>
              
              <div className="flex justify-center mt-8">
                  <Button variant="link" onClick={() => setIsDetailModalOpen(true)} className="text-blue-600 font-semibold">
                      Ler descrição completa &rarr;
                  </Button>
              </div>
          </div>
      </section>

      {/* --- MODAL DE DETALHES --- */}
      <Dialog open={isDetailModalOpen} onOpenChange={setIsDetailModalOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto flex flex-col p-0 gap-0 border-0 shadow-2xl">
            
            {/* Header Modal */}
            <div className="p-6 border-b border-slate-100 bg-slate-50/50 sticky top-0 z-10 backdrop-blur-md">
                <DialogHeader>
                    <DialogTitle className="text-xl font-bold text-slate-900 leading-tight">{job.title}</DialogTitle>
                    <DialogDescription className="flex items-center gap-2 mt-1">
                        <Building className="h-3.5 w-3.5" /> {job.companyName || job.institution.name}
                    </DialogDescription>
                </DialogHeader>
            </div>

            {/* Corpo Modal (Scrollável) */}
            <div className="p-6 md:p-8 bg-white">
                <div className="prose prose-sm md:prose-base prose-slate max-w-none">
                     <div dangerouslySetInnerHTML={{ __html: job.description }} />
                </div>
                
                {/* Informações Extras */}
                <div className="mt-8 pt-8 border-t border-slate-100 grid grid-cols-2 gap-4">
                    <div>
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Contato</span>
                        <p className="text-sm font-medium text-slate-900 mt-1 truncate" title={job.email}>{job.email}</p>
                        <p className="text-sm text-slate-500">{job.telephone}</p>
                    </div>
                    <div>
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Website</span>
                        <p className="text-sm font-medium text-blue-600 mt-1 cursor-pointer hover:underline flex items-center gap-1">
                            <Globe className="h-3 w-3" /> {job.institution.slug ? `${job.institution.slug}.foxx.com` : 'Website Oficial'}
                        </p>
                    </div>
                </div>
            </div>

            {/* Footer Fixo (CTA) */}
            <div className="p-4 border-t border-slate-100 bg-slate-50 sticky bottom-0 z-10 flex flex-col sm:flex-row gap-3 items-center justify-between">
                <div className="text-xs text-slate-500 hidden sm:block leading-tight">
                    Ao clicar, você iniciará<br/>o processo de candidatura.
                </div>
                <Button 
                    size="lg" 
                    className="w-full sm:w-auto px-8 font-bold shadow-lg shadow-green-500/20 text-white hover:scale-105 transition-transform"
                    style={{ backgroundColor: '#16a34a' }} // Verde para conversão
                    onClick={handleGoToCheckout}
                >
                    <CheckCircle2 className="mr-2 h-5 w-5" />
                    Quero me Candidatar
                </Button>
            </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}