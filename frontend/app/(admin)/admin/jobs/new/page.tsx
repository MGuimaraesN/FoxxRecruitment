"use client";

import { useState, FormEvent, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { RichTextEditor } from '@/components/ui/rich-text-editor';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { ChevronLeft, Loader2, Info, CheckCircle, Copy, ExternalLink, Globe } from 'lucide-react';

interface Category { id: number; name: string; }
interface Area { id: number; name: string; }
interface Institution { id: number; name: string; }
interface Job { id: number; title: string; }

export default function AdminNewJobPage() {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [email, setEmail] = useState('');
  const [telephone, setTelephone] = useState('');
  const [areaId, setAreaId] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [companyName, setCompanyName] = useState('');
  
  // Valores padrão: Publicado e Público
  const [status, setStatus] = useState('published'); 
  const [visibility, setVisibility] = useState('public'); 
  
  const [institutionId, setInstitutionId] = useState('');

  const [categories, setCategories] = useState<Category[]>([]);
  const [areas, setAreas] = useState<Area[]>([]);
  const [institutions, setInstitutions] = useState<Institution[]>([]);
  
  const [isLoading, setIsLoading] = useState(false);
  const [createdJob, setCreatedJob] = useState<Job | null>(null); // Estado para o modal de sucesso

  const { token, user } = useAuth();
  const router = useRouter();

  const canSelectInstitution = useMemo(() => {
    return user?.institutions.some((inst: any) => ['admin', 'superadmin'].includes(inst.role.name));
  }, [user]);

  useEffect(() => {
    const fetchData = async () => {
      if (!token) return;
      try {
        const [catRes, areaRes] = await Promise.all([
          fetch(`${process.env.NEXT_PUBLIC_API_URL}/categories`, { headers: { 'Authorization': `Bearer ${token}` } }),
          fetch(`${process.env.NEXT_PUBLIC_API_URL}/areas`, { headers: { 'Authorization': `Bearer ${token}` } })
        ]);
        if (catRes.ok) setCategories(await catRes.json());
        if (areaRes.ok) setAreas(await areaRes.json());
        if (canSelectInstitution) {
          const instRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/institutions`, { headers: { 'Authorization': `Bearer ${token}` } });
          if (instRes.ok) setInstitutions(await instRes.json());
        }
      } catch (err) { toast.error('Falha ao carregar dados.'); }
    };
    fetchData();
  }, [token, canSelectInstitution]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setIsLoading(true);
    try {
      const body: any = { 
          title, 
          description, 
          email, 
          telephone, 
          areaId: parseInt(areaId), 
          categoryId: parseInt(categoryId), 
          companyName, 
          status, 
          institutionId: institutionId ? parseInt(institutionId) : undefined,
          isPublic: visibility === 'public'
      };
      
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/jobs/create`, { 
          method: 'POST', 
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }, 
          body: JSON.stringify(body) 
      });
      
      if (res.ok) { 
          const newJob = await res.json();
          setCreatedJob(newJob); // Abre o modal com o link
          toast.success('Vaga criada com sucesso!'); 
      } else { 
          const data = await res.json(); 
          toast.error(data.error || 'Erro ao criar vaga.'); 
      }
    } catch (err) { toast.error('Erro de rede.'); } finally { setIsLoading(false); }
  };

  const copyLink = () => {
    if (!createdJob) return;
    const url = `${window.location.origin}/jobs/${createdJob.id}`;
    navigator.clipboard.writeText(url);
    toast.success('Link copiado!');
  };

  const handleCloseSuccess = () => {
      setCreatedJob(null);
      router.push('/admin/jobs');
  };

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
            <h1 className="text-3xl font-bold text-neutral-900 tracking-tight">Nova Oportunidade</h1>
            <p className="text-sm text-neutral-500 mt-1">Preencha as informações para publicar uma nova vaga.</p>
        </div>
      </div>

      {/* Grid Layout Assimétrico (Idêntico ao Edit) */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-8">
        
        {/* Coluna Esquerda (Formulário Principal) */}
        <div className="space-y-8">
            <form id="create-job-form" onSubmit={handleSubmit} className="space-y-8">
                
                {/* Card 1: Sobre a Vaga */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-neutral-200">
                    <h2 className="text-lg font-semibold text-neutral-900 mb-5 pb-3 border-b border-neutral-100">
                        Informações da Vaga
                    </h2>
                    <div className="space-y-5">
                        <div className="space-y-1.5">
                            <label className="text-sm font-medium text-neutral-700">Título do Cargo</label>
                            <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="Ex: Desenvolvedor Front-end Júnior" required className="bg-white" />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-sm font-medium text-neutral-700">Descrição Completa</label>
                            <div className="bg-white rounded-md border border-neutral-200 min-h-[300px] overflow-hidden">
                                <RichTextEditor value={description} onChange={setDescription} placeholder="Descreva as responsabilidades e requisitos..." />
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

        {/* Coluna Direita (Sidebar) */}
        <div className="space-y-6 flex flex-col">
             
             {/* Card 3: Configurações */}
             <div className="bg-white p-6 rounded-xl shadow-sm border border-neutral-200 sticky top-6 z-10">
                <h2 className="text-base font-semibold text-neutral-900 mb-4 pb-2 border-b border-neutral-100">
                    Configurações de Publicação
                </h2>
                <div className="space-y-5">
                    <div className="space-y-1.5">
                        <label className="text-sm font-medium text-neutral-700">Status Inicial</label>
                        <Select value={status} onValueChange={setStatus} required>
                            <SelectTrigger className="bg-white"><SelectValue /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="published">Publicado (Ativo)</SelectItem>
                                <SelectItem value="rascunho">Rascunho (Oculto)</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    
                    <div className="space-y-1.5">
                        <label className="text-sm font-medium text-neutral-700">Visibilidade</label>
                        <Select value={visibility} onValueChange={setVisibility} required>
                            <SelectTrigger className="bg-white"><SelectValue /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="public">Pública (Aberta)</SelectItem>
                                <SelectItem value="private">Privada (Requer Login)</SelectItem>
                            </SelectContent>
                        </Select>
                        <div className={`text-xs mt-2 p-2 rounded border leading-tight ${visibility === 'public' ? 'bg-blue-50 border-blue-100 text-blue-700' : 'bg-yellow-50 border-yellow-100 text-yellow-700'}`}>
                            {visibility === 'private' 
                                ? 'Apenas usuários cadastrados no sistema poderão ver esta vaga.' 
                                : 'Qualquer pessoa com o link poderá visualizar.'}
                        </div>
                    </div>

                    {canSelectInstitution && (
                        <div className="space-y-1.5">
                            <label className="text-sm font-medium text-neutral-700">Vincular a Instituição</label>
                            <Select value={institutionId} onValueChange={setInstitutionId}>
                                <SelectTrigger className="bg-white"><SelectValue placeholder="Padrão (Minha Instituição)" /></SelectTrigger>
                                <SelectContent>{institutions.map(i => <SelectItem key={i.id} value={String(i.id)}>{i.name}</SelectItem>)}</SelectContent>
                            </Select>
                        </div>
                    )}

                    <Button type="submit" form="create-job-form" disabled={isLoading} className="w-full bg-blue-600 hover:bg-blue-700 h-10 mt-4 shadow-sm">
                        {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2"/> : null}
                        {isLoading ? 'Salvando...' : 'Publicar Vaga'}
                    </Button>
                </div>
            </div>

            {/* Aviso sobre o Link (Estilo consistente com Edit) */}
            <div className="bg-blue-50 p-5 rounded-xl border border-blue-100 shadow-sm text-blue-800 text-xs leading-relaxed">
                <div className="flex items-center gap-2 font-bold mb-2">
                    <Globe className="h-4 w-4 text-blue-600" />
                    <span>Link de Divulgação</span>
                </div>
                <p>
                    O link público para compartilhamento será gerado automaticamente assim que a vaga for criada com sucesso.
                </p>
            </div>
        </div>
      </div>

      {/* --- MODAL DE SUCESSO COM LINK --- */}
      <Dialog open={!!createdJob} onOpenChange={handleCloseSuccess}>
        <DialogContent className="sm:max-w-md">
            <DialogHeader>
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-100 mb-3">
                    <CheckCircle className="h-6 w-6 text-green-600" />
                </div>
                <DialogTitle className="text-center text-xl">Vaga Publicada com Sucesso!</DialogTitle>
                <DialogDescription className="text-center">
                    Sua vaga já está ativa. Utilize o link abaixo para começar a divulgação.
                </DialogDescription>
            </DialogHeader>
            
            <div className="bg-neutral-50 p-4 rounded-lg border border-neutral-200 mt-2">
                <label className="text-xs font-semibold text-neutral-500 mb-1.5 block">Link de Divulgação</label>
                <div className="flex items-center gap-2">
                    <Input 
                        readOnly 
                        value={createdJob ? `${window.location.origin}/jobs/${createdJob.id}` : ''} 
                        className="bg-white h-9 text-xs font-mono text-neutral-600 truncate" 
                    />
                    <Button size="icon" onClick={copyLink} className="h-9 w-9 shrink-0 bg-blue-600 hover:bg-blue-700 text-white shadow-sm" title="Copiar Link">
                        <Copy className="h-4 w-4" />
                    </Button>
                </div>
            </div>

            <DialogFooter className="sm:justify-center gap-2 mt-2">
                <Button variant="outline" onClick={handleCloseSuccess} className="w-full sm:w-auto">
                    Voltar para Lista
                </Button>
                <Button className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700" onClick={() => {
                    if (createdJob) window.open(`${window.location.origin}/jobs/${createdJob.id}`, '_blank');
                }}>
                    <ExternalLink className="mr-2 h-4 w-4" />
                    Visualizar Vaga
                </Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}