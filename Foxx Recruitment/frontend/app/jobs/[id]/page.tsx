"use client";

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { 
  ArrowLeft, Building2, MapPin, Calendar, 
  CheckCircle2, Loader2, Share2, Mail, Phone,
  Briefcase, Globe, AlertCircle
} from 'lucide-react';
import Link from 'next/link';

interface Job {
    id: number;
    title: string;
    description: string;
    status: string;
    createdAt: string;
    email: string;
    telephone: string;
    area: { name: string };
    category: { name: string };
    author: { firstName: string; lastName: string };
    companyName?: string | null;
    institution: { name: string };
    isPublic: boolean;
}

export default function JobDetailsPage() {
    const { id } = useParams();
    const router = useRouter();
    const { token } = useAuth();
    
    const [job, setJob] = useState<Job | null>(null);
    const [loading, setLoading] = useState(true);
    const [applying, setApplying] = useState(false);
    const [hasApplied, setHasApplied] = useState(false);

    // 1. Busca os detalhes da vaga
    useEffect(() => {
        const fetchJob = async () => {
            try {
                const headers: any = {};
                if (token) headers['Authorization'] = `Bearer ${token}`;

                const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/jobs/${id}`, { headers });
                if (res.ok) {
                    setJob(await res.json());
                } else {
                    toast.error("Vaga não encontrada ou acesso restrito.");
                    router.push('/dashboard');
                }
            } catch (error) {
                console.error(error);
                toast.error("Erro ao carregar vaga.");
            } finally {
                setLoading(false);
            }
        };
        
        if (id) fetchJob();
    }, [id, token, router]);

    // 2. Verifica se o usuário JÁ se candidatou
    useEffect(() => {
        const checkApplicationStatus = async () => {
            if (!token || !id) return;

            try {
                const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/applications/my-applications`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });

                if (res.ok) {
                    const myApplications = await res.json();
                    const alreadyApplied = myApplications.some((app: any) => app.jobId === Number(id));
                    if (alreadyApplied) {
                        setHasApplied(true);
                    }
                }
            } catch (error) {
                console.error("Erro ao verificar status da candidatura", error);
            }
        };

        checkApplicationStatus();
    }, [id, token]);

    const handleApply = async () => {
        if (!token) {
            toast.error("Você precisa entrar na sua conta para se candidatar.");
            // Salva a intenção de ir para esta vaga após login (opcional, lógica de redirect)
            router.push('/login');
            return;
        }

        setApplying(true);
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/applications/apply`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ jobId: id })
            });

            const json = await res.json();

            if (res.ok) {
                toast.success("Candidatura realizada com sucesso! Boa sorte.");
                setHasApplied(true);
            } else if (res.status === 409) {
                toast.info("Você já se candidatou para esta vaga.");
                setHasApplied(true);
            } else {
                toast.error(json.error || "Erro ao se candidatar.");
            }
        } catch (error) {
            toast.error("Erro de rede. Tente novamente.");
        } finally {
            setApplying(false);
        }
    };

    const handleShare = () => {
        navigator.clipboard.writeText(window.location.href);
        toast.success("Link copiado para a área de transferência!");
    };

    if (loading) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-neutral-50">
                <div className="flex flex-col items-center gap-2">
                    <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                    <p className="text-sm text-neutral-500">Carregando oportunidade...</p>
                </div>
            </div>
        );
    }

    if (!job) return null;

    const isOpen = ['published', 'open'].includes(job.status);

    return (
        <div className="min-h-screen bg-neutral-50 pb-20">
            {/* Header / Banner */}
            <div className="bg-white border-b border-neutral-200">
                <div className="container mx-auto px-4 py-8 max-w-6xl">
                    <Button 
                        variant="ghost" 
                        onClick={() => router.back()} 
                        className="mb-6 pl-0 text-neutral-500 hover:bg-transparent hover:text-blue-600 transition-colors group"
                    >
                        <ArrowLeft className="mr-2 h-4 w-4 group-hover:-translate-x-1 transition-transform" /> Voltar
                    </Button>

                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                        <div>
                            <div className="flex flex-wrap gap-2 mb-4">
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-100">
                                    {job.category.name}
                                </span>
                                {isOpen ? (
                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-100 flex gap-1">
                                        <span className="relative flex h-2 w-2 mr-1">
                                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                                        </span>
                                        Candidaturas Abertas
                                    </span>
                                ) : (
                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-neutral-100 text-neutral-600 border border-neutral-200">
                                        Fechada
                                    </span>
                                )}
                            </div>
                            
                            <h1 className="text-3xl md:text-4xl font-bold text-neutral-900 tracking-tight mb-3">
                                {job.title}
                            </h1>
                            
                            <div className="flex flex-wrap items-center gap-4 text-sm text-neutral-500">
                                <div className="flex items-center gap-1.5">
                                    <Building2 className="h-4 w-4 text-blue-600" />
                                    <span className="font-medium text-neutral-900">
                                        {job.companyName || job.institution.name}
                                    </span>
                                </div>
                                <span className="hidden md:inline text-neutral-300">|</span>
                                <div className="flex items-center gap-1.5">
                                    <MapPin className="h-4 w-4" /> 
                                    {job.area.name}
                                </div>
                                <span className="hidden md:inline text-neutral-300">|</span>
                                <div className="flex items-center gap-1.5">
                                    <Calendar className="h-4 w-4" /> 
                                    Publicado em {new Date(job.createdAt).toLocaleDateString('pt-BR')}
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-3">
                            <Button variant="outline" size="icon" onClick={handleShare} title="Compartilhar Vaga">
                                <Share2 className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                </div>
            </div>

            <div className="container mx-auto px-4 py-8 max-w-6xl">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    
                    {/* COLUNA PRINCIPAL: Descrição */}
                    <div className="lg:col-span-2 space-y-8">
                        <div className="bg-white rounded-xl p-6 md:p-8 shadow-sm border border-neutral-200">
                            <h2 className="text-xl font-bold text-neutral-900 mb-6 flex items-center gap-2">
                                <Briefcase className="h-5 w-5 text-blue-600" />
                                Descrição da Vaga
                            </h2>
                            
                            <div 
                                className="prose prose-neutral max-w-none text-neutral-600 leading-relaxed 
                                prose-headings:font-bold prose-headings:text-neutral-900 
                                prose-a:text-blue-600 prose-a:no-underline hover:prose-a:underline
                                prose-strong:text-neutral-900 prose-ul:list-disc prose-li:marker:text-neutral-400"
                                dangerouslySetInnerHTML={{ __html: job.description }} 
                            />
                        </div>

                        {/* Card de Segurança/Aviso */}
                        <div className="bg-blue-50/50 rounded-xl p-4 border border-blue-100 flex gap-3 items-start">
                            <AlertCircle className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
                            <div className="text-sm text-blue-900/80">
                                <p className="font-semibold mb-1">Dica de Segurança</p>
                                Nunca pague para se candidatar a uma vaga ou forneça dados bancários antes da contratação. 
                                Esta vaga foi verificada pela instituição {job.institution.name}.
                            </div>
                        </div>
                    </div>

                    {/* COLUNA LATERAL: Ações e Detalhes */}
                    <div className="space-y-6">
                        
                        {/* Card de Ação (Sticky) */}
                        <div className="bg-white rounded-xl p-6 shadow-sm border border-neutral-200 lg:sticky lg:top-24">
                            <div className="mb-6">
                                <h3 className="text-lg font-bold text-neutral-900 mb-2">Interessado?</h3>
                                <p className="text-sm text-neutral-500">
                                    {hasApplied 
                                        ? "Você já enviou sua candidatura para esta oportunidade." 
                                        : "Envie seu perfil agora mesmo para análise do recrutador."}
                                </p>
                            </div>

                            {hasApplied ? (
                                <div className="p-4 bg-green-50 border border-green-100 rounded-lg flex items-center justify-center gap-2 text-green-700 font-medium mb-4">
                                    <CheckCircle2 className="h-5 w-5" />
                                    Candidatura Enviada
                                </div>
                            ) : (
                                isOpen ? (
                                    <Button 
                                        size="lg" 
                                        onClick={handleApply} 
                                        disabled={applying}
                                        className="w-full bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-600/20 text-base h-12 mb-4 transition-all hover:scale-[1.02]"
                                    >
                                        {applying ? (
                                            <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Processando...</>
                                        ) : (
                                            "Quero me Candidatar"
                                        )}
                                    </Button>
                                ) : (
                                    <Button disabled className="w-full bg-neutral-100 text-neutral-400 border border-neutral-200 mb-4 cursor-not-allowed">
                                        Vaga Encerrada
                                    </Button>
                                )
                            )}

                            {!token && !hasApplied && isOpen && (
                                <p className="text-xs text-center text-neutral-400">
                                    É necessário fazer login.
                                </p>
                            )}

                            <hr className="my-6 border-neutral-100" />

                            <h4 className="text-xs font-bold text-neutral-900 uppercase tracking-wider mb-4">
                                Contato do Recrutador
                            </h4>
                            
                            <div className="space-y-3">
                                <div className="flex items-center gap-3 text-sm text-neutral-600">
                                    <div className="bg-neutral-50 p-2 rounded-md">
                                        <Mail className="h-4 w-4 text-neutral-500" />
                                    </div>
                                    <span className="truncate">{job.email}</span>
                                </div>
                                {job.telephone && (
                                    <div className="flex items-center gap-3 text-sm text-neutral-600">
                                        <div className="bg-neutral-50 p-2 rounded-md">
                                            <Phone className="h-4 w-4 text-neutral-500" />
                                        </div>
                                        <span>{job.telephone}</span>
                                    </div>
                                )}
                                {job.isPublic && (
                                    <div className="flex items-center gap-3 text-sm text-neutral-600">
                                        <div className="bg-neutral-50 p-2 rounded-md">
                                            <Globe className="h-4 w-4 text-neutral-500" />
                                        </div>
                                        <span>Vaga Pública</span>
                                    </div>
                                )}
                            </div>
                        </div>

                    </div>
                </div>
            </div>
        </div>
    );
}