"use client";

import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Building, LogIn, UserPlus, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { QuickApplyModal } from '@/components/QuickApplyModal';

const safeColor = (color: string | null | undefined, fallback = '#2563eb') => {
    if (!color) return fallback;
    return color.startsWith('#') ? color : `#${color}`;
};

export default function InstitutionPage({ params }: { params: Promise<{ slug: string }> }) {
  const resolvedParams = use(params);
  const slug = resolvedParams.slug;
  const router = useRouter();

  const [institution, setInstitution] = useState<any>(null);
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalView, setAuthModalView] = useState<'login' | 'register'>('login');

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

  const openAuthModal = (view: 'login' | 'register') => {
    setAuthModalView(view);
    setIsAuthModalOpen(true);
  };

  if (loading) return <div className="h-screen flex items-center justify-center bg-slate-50"><Loader2 className="animate-spin text-blue-600"/></div>;
  if (!institution) return null;

  const primaryColor = safeColor(institution.primaryColor);

  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      
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
                 <Button onClick={() => openAuthModal('login')} variant="ghost" className="hidden md:flex gap-2">
                    <LogIn className="h-4 w-4" /> Acessar Painel
                 </Button>
                 <Button onClick={() => openAuthModal('register')} className="bg-slate-900 text-white hover:bg-slate-800 gap-2">
                    <UserPlus className="h-4 w-4" /> Criar Conta
                 </Button>
            </div>
        </div>
      </header>

      <div className="relative py-20 px-4 text-center text-white" style={{ backgroundColor: primaryColor }}>
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="relative z-10 container mx-auto">
            <h2 className="text-4xl font-bold mb-4">Oportunidades Exclusivas</h2>
            <p className="text-lg opacity-90 max-w-2xl mx-auto">
                Confira as vagas de estágio, pesquisa e emprego selecionadas para alunos da {institution.name}.
            </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-16 max-w-5xl">
         <h3 className="text-2xl font-bold text-slate-900 mb-8 border-l-4 pl-4" style={{ borderColor: primaryColor }}>
            Vagas Disponíveis ({jobs.length})
         </h3>

         <div className="grid gap-4">
            {jobs.length > 0 ? jobs.map(job => (
                <div key={job.id} className="bg-white p-6 rounded-xl border border-slate-200 hover:shadow-md transition-all flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h4 className="text-lg font-bold text-slate-800">{job.title}</h4>
                        <div className="flex gap-4 mt-2 text-sm text-slate-500">
                            <span className="flex items-center"><Building className="w-4 h-4 mr-1"/> {job.companyName || institution.name}</span>
                            <span className="flex items-center"><MapPin className="w-4 h-4 mr-1"/> {job.area.name}</span>
                        </div>
                    </div>
                    <Button 
                        onClick={() => router.push(`/jobs/${job.id}`)}
                        style={{ backgroundColor: primaryColor }}
                        className="text-white hover:opacity-90 min-w-[140px]"
                    >
                        Ver Detalhes
                    </Button>
                </div>
            )) : (
                <p className="text-slate-500">Nenhuma vaga aberta no momento para esta instituição.</p>
            )}
         </div>
      </div>

      <footer className="bg-slate-900 text-slate-400 py-8 text-center text-sm">
        <p>Powered by <strong>Foxx Recruitment</strong> for {institution.name}</p>
      </footer>

      {/* PASSANDO O NOME DA INSTITUIÇÃO */}
      <QuickApplyModal
            isOpen={isAuthModalOpen}
            onClose={() => setIsAuthModalOpen(false)}
            institutionId={institution.id}
            institutionName={institution.name} // <--- Passando o nome
            initialView={authModalView} 
            onSuccess={() => setIsAuthModalOpen(false)}
      />
    </div>
  );
}