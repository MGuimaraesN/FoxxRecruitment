"use client";

import { useState, FormEvent, useEffect, useMemo } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { RichTextEditor } from '@/components/ui/rich-text-editor';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { ChevronLeft, Loader2, Copy, ExternalLink, Globe } from 'lucide-react';
import { useBreadcrumb } from '@/components/ui/breadcrumbs';

interface Category { id: number; name: string; }
interface Area { id: number; name: string; }
interface Institution { id: number; name: string; }

export default function AdminEditJobPage() {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [email, setEmail] = useState('');
  const [telephone, setTelephone] = useState('');
  const [areaId, setAreaId] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [status, setStatus] = useState('rascunho');
  const [institutionId, setInstitutionId] = useState('');
  const [visibility, setVisibility] = useState('private');

  const [categories, setCategories] = useState<Category[]>([]);
  const [areas, setAreas] = useState<Area[]>([]);
  const [institutions, setInstitutions] = useState<Institution[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const { token, user } = useAuth();
  const router = useRouter();
  const params = useParams();
  const id = Array.isArray(params.id) ? params.id[0] : params.id;
  
  const { setCustomLabel } = useBreadcrumb();

  const canEditInstitution = useMemo(() => {
    return user?.institutions.some((inst: any) => ['admin', 'superadmin'].includes(inst.role.name));
  }, [user]);

  const [publicJobUrl, setPublicJobUrl] = useState('');

  useEffect(() => {
    if (typeof window !== 'undefined' && id) {
      setPublicJobUrl(`${window.location.origin}/jobs/${id}`);
    }
  }, [id]);

  useEffect(() => {
    if (!token || !id) return;

    const fetchData = async () => {
      setIsLoading(true);
      try {
        // 1. Fetch Dependencies
        const [catRes, areaRes] = await Promise.all([
          fetch(`${process.env.NEXT_PUBLIC_API_URL}/categories`, { headers: { 'Authorization': `Bearer ${token}` } }),
          fetch(`${process.env.NEXT_PUBLIC_API_URL}/areas`, { headers: { 'Authorization': `Bearer ${token}` } })
        ]);

        if (catRes.ok) setCategories(await catRes.json());
        if (areaRes.ok) setAreas(await areaRes.json());
        
        if (canEditInstitution) {
             try {
                const instRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/institutions`, { headers: { 'Authorization': `Bearer ${token}` } });
                if (instRes.ok) setInstitutions(await instRes.json());
             } catch (e) { console.error('Erro ao carregar instituições', e); }
        }

        // 2. Fetch Job Data
        const jobRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/jobs/${id}`, { 
            headers: { 'Authorization': `Bearer ${token}` } 
        });

        if (jobRes.ok) {
          const job = await jobRes.json();
          
          // Populate Form
          setTitle(job.title); 
          setDescription(job.description); 
          setEmail(job.email); 
          setTelephone(job.telephone);
          setAreaId(String(job.areaId)); 
          setCategoryId(String(job.categoryId)); 
          setCompanyName(job.companyName || '');
          setStatus(job.status);
          setVisibility(job.isPublic ? 'public' : 'private');
          
          if (job.institutionId) setInstitutionId(String(job.institutionId));
          
          // Update Breadcrumb
          if (setCustomLabel) setCustomLabel(String(id), job.title);
          
        } else { 
            // Error Handling
            if (jobRes.status === 404) {
                toast.error('Vaga não encontrada.');
            } else if (jobRes.status === 403) {
                toast.error('Sem permissão para editar esta vaga.');
            } else {
                toast.error('Erro ao carregar vaga.');
            }
            router.push('/admin/jobs');
        }
      } catch (err) { 
          console.error(err);
          toast.error('Erro de conexão.'); 
      } finally { 
          setIsLoading(false); 
      }
    };
    fetchData();
  }, [token, id, canEditInstitution, router, setCustomLabel]); 

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setIsSaving(true);
    try {
      const body: any = { 
          title, description, email, telephone, 
          areaId: parseInt(areaId), categoryId: parseInt(categoryId), 
          companyName, status, 
          institutionId: canEditInstitution && institutionId ? parseInt(institutionId) : undefined,
          isPublic: visibility === 'public'
      };
      
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/jobs/edit/${id}`, { 
          method: 'PUT', 
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }, 
          body: JSON.stringify(body) 
      });

      if (res.ok) { 
          if(setCustomLabel) setCustomLabel(String(id), title);
          toast.success('Vaga atualizada com sucesso!'); 
      } else { 
          const data = await res.json();
          toast.error(data.error || 'Erro ao atualizar.'); 
      }
    } catch (err) { 
        toast.error('Erro de rede.'); 
    } finally { 
        setIsSaving(false); 
    }
  };

  const copyLink = () => {
      if (!publicJobUrl) return;
      navigator.clipboard.writeText(publicJobUrl);
      toast.success('Link copiado!');
  };

  const openLink = () => {
      if (!publicJobUrl) return;
      window.open(publicJobUrl, '_blank');
  }

  if (isLoading) return (
      <div className="flex h-[calc(100vh-200px)] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600"/>
      </div>
  );

  return (
    <div className="max-w-[1200px] mx-auto space-y-6 pb-20 px-4 md:px-6">
      {/* Header */}
      <div className="flex items-center gap-2 pt-6 mb-2">
        <Button variant="ghost" size="sm" onClick={() => router.push('/admin/jobs')} className="text-neutral-500 hover:text-neutral-900 px-0">
            <ChevronLeft className="h-4 w-4 mr-1" /> Voltar para Lista
        </Button>
      </div>

      <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 border-b border-neutral-200 pb-6">
        <div>
            <h1 className="text-3xl font-bold text-neutral-900 tracking-tight">Editar Vaga</h1>
            <p className="text-sm text-neutral-500 mt-1">Atualize as informações e configurações de visibilidade.</p>
        </div>
        <div className="px-3 py-1 bg-neutral-100 rounded-md border border-neutral-200 text-xs font-mono text-neutral-500">
            REF: {id}
        </div>
      </div>

      {/* Layout de Grid Assimétrico para melhor uso do espaço */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-8">
        
        {/* Coluna Esquerda (Formulário Principal) */}
        <div className="space-y-8">
            <form id="edit-job-form" onSubmit={handleSubmit} className="space-y-8">
                
                {/* Card 1: Sobre a Vaga */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-neutral-200">
                    <h2 className="text-lg font-semibold text-neutral-900 mb-5 pb-3 border-b border-neutral-100">
                        Informações da Vaga
                    </h2>
                    <div className="space-y-5">
                        <div className="space-y-1.5">
                            <label className="text-sm font-medium text-neutral-700">Título do Cargo</label>
                            <Input value={title} onChange={e => setTitle(e.target.value)} required className="bg-white" />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-sm font-medium text-neutral-700">Descrição Completa</label>
                            <div className="bg-white rounded-md border border-neutral-200 min-h-[300px]">
                                <RichTextEditor value={description} onChange={setDescription} />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Card 2: Detalhes e Contato */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-neutral-200">
                    <h2 className="text-lg font-semibold text-neutral-900 mb-5 pb-3 border-b border-neutral-100">
                        Classificação & Contato
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-1.5">
                            <label className="text-sm font-medium text-neutral-700">Área de Atuação</label>
                            <Select value={areaId} onValueChange={setAreaId} required>
                                <SelectTrigger className="bg-white"><SelectValue placeholder="Selecione..." /></SelectTrigger>
                                <SelectContent>{areas.map(a => <SelectItem key={a.id} value={String(a.id)}>{a.name}</SelectItem>)}</SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-sm font-medium text-neutral-700">Categoria</label>
                            <Select value={categoryId} onValueChange={setCategoryId} required>
                                <SelectTrigger className="bg-white"><SelectValue placeholder="Selecione..." /></SelectTrigger>
                                <SelectContent>{categories.map(c => <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>)}</SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-sm font-medium text-neutral-700">Email de Contato</label>
                            <Input type="email" value={email} onChange={e => setEmail(e.target.value)} required className="bg-white" />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-sm font-medium text-neutral-700">Telefone</label>
                            <Input type="tel" value={telephone} onChange={e => setTelephone(e.target.value)} required className="bg-white" />
                        </div>
                        <div className="space-y-1.5 md:col-span-2">
                            <label className="text-sm font-medium text-neutral-700">Nome da Empresa (Opcional)</label>
                            <Input value={companyName} onChange={e => setCompanyName(e.target.value)} placeholder="Ex: Empresa Parceira S.A." className="bg-white" />
                            <p className="text-xs text-neutral-500">Deixe em branco para usar o nome da instituição.</p>
                        </div>
                    </div>
                </div>
            </form>
        </div>

        {/* Coluna Direita (Sidebar de Ações) */}
        <div className="space-y-6 flex flex-col">
            
            {/* Card 3: Publicação */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-neutral-200 sticky top-6 z-10">
                <h2 className="text-base font-semibold text-neutral-900 mb-4 pb-2 border-b border-neutral-100">
                    Configurações de Publicação
                </h2>
                
                <div className="space-y-5">
                    <div className="space-y-1.5">
                        <label className="text-sm font-medium text-neutral-700">Status Atual</label>
                        <Select value={status} onValueChange={setStatus} required>
                            <SelectTrigger className="bg-white"><SelectValue /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="rascunho">Rascunho (Oculto)</SelectItem>
                                <SelectItem value="published">Publicado (Ativo)</SelectItem>
                                <SelectItem value="closed">Encerrado</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-sm font-medium text-neutral-700">Visibilidade</label>
                        <Select value={visibility} onValueChange={setVisibility} required>
                            <SelectTrigger className="bg-white"><SelectValue /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="public">Pública (Aberta a todos)</SelectItem>
                                <SelectItem value="private">Privada (Requer Login)</SelectItem>
                            </SelectContent>
                        </Select>
                        <div className={`text-xs mt-2 p-2 rounded border ${visibility === 'public' ? 'bg-blue-50 border-blue-100 text-blue-700' : 'bg-yellow-50 border-yellow-100 text-yellow-700'}`}>
                            {visibility === 'private' 
                                ? 'Apenas usuários cadastrados no sistema poderão ver esta vaga.' 
                                : 'Qualquer pessoa com o link poderá visualizar e se candidatar.'}
                        </div>
                    </div>

                    {canEditInstitution && (
                        <div className="space-y-1.5">
                            <label className="text-sm font-medium text-neutral-700">Instituição</label>
                            <Select value={institutionId} onValueChange={setInstitutionId}>
                                <SelectTrigger className="bg-white"><SelectValue /></SelectTrigger>
                                <SelectContent>{institutions.map(i => <SelectItem key={i.id} value={String(i.id)}>{i.name}</SelectItem>)}</SelectContent>
                            </Select>
                        </div>
                    )}

                    <Button type="submit" form="edit-job-form" disabled={isSaving} className="w-full bg-blue-600 hover:bg-blue-700 h-11 mt-4 shadow-md shadow-blue-200">
                        {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2"/> : null}
                        {isSaving ? 'Salvando...' : 'Salvar Alterações'}
                    </Button>
                </div>
            </div>

            {/* Card 4: Link Público (Divulgação) */}
            {status === 'published' && visibility === 'public' && (
                <div className="bg-gradient-to-b from-emerald-50 to-white p-5 rounded-xl border border-emerald-200 shadow-sm mt-4">
                    <h2 className="text-sm font-bold text-emerald-900 mb-3 flex items-center gap-2">
                        <Globe className="h-4 w-4" /> Link de Divulgação
                    </h2>
                    <p className="text-xs text-emerald-800/80 mb-3 leading-relaxed">
                        Sua vaga está pública! Use este link para compartilhar.
                    </p>
                    
                    <div className="flex items-center gap-2 mb-3">
                        <div className="relative flex-1">
                             <Input 
                                readOnly 
                                value={publicJobUrl} 
                                className="bg-white border-emerald-200 text-xs h-9 pr-2 text-neutral-600 font-mono truncate focus-visible:ring-emerald-200" 
                            />
                        </div>
                        <Button size="icon" variant="outline" className="h-9 w-9 shrink-0 bg-white border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700 shadow-sm" onClick={copyLink} title="Copiar">
                            <Copy className="h-4 w-4" />
                        </Button>
                    </div>

                    <Button variant="ghost" size="sm" className="w-full text-emerald-700 hover:bg-emerald-50 hover:text-emerald-800 text-xs h-8 justify-center border border-transparent hover:border-emerald-100" onClick={openLink}>
                        <ExternalLink className="h-3 w-3 mr-2" /> Visualizar página da vaga
                    </Button>
                </div>
            )}

        </div>
      </div>
    </div>
  );
}