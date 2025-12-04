"use client";

import { useState, FormEvent, useEffect, useMemo } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { RichTextEditor } from '@/components/ui/rich-text-editor';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { ChevronLeft, Loader2 } from 'lucide-react';
// IMPORTAÇÃO DO HOOK
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

  const [categories, setCategories] = useState<Category[]>([]);
  const [areas, setAreas] = useState<Area[]>([]);
  const [institutions, setInstitutions] = useState<Institution[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const { token, user } = useAuth();
  const router = useRouter();
  const params = useParams();
  const { id } = params; // Ex: "4"
  
  // USO DO HOOK
  const { setCustomLabel } = useBreadcrumb();

  const canEditInstitution = useMemo(() => {
    return user?.institutions.some((inst: any) => ['admin', 'superadmin'].includes(inst.role.name));
  }, [user]);

  useEffect(() => {
    if (!token || !id) return;
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const [jobRes, catRes, areaRes] = await Promise.all([
          fetch(`${process.env.NEXT_PUBLIC_API_URL}/jobs/${id}`, { headers: { 'Authorization': `Bearer ${token}` } }),
          fetch(`${process.env.NEXT_PUBLIC_API_URL}/categories`, { headers: { 'Authorization': `Bearer ${token}` } }),
          fetch(`${process.env.NEXT_PUBLIC_API_URL}/areas`, { headers: { 'Authorization': `Bearer ${token}` } })
        ]);

        if (catRes.ok) setCategories(await catRes.json());
        if (areaRes.ok) setAreas(await areaRes.json());
        if (canEditInstitution) {
            const instRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/institutions`, { headers: { 'Authorization': `Bearer ${token}` } });
            if (instRes.ok) setInstitutions(await instRes.json());
        }

        if (jobRes.ok) {
          const job = await jobRes.json();
          setTitle(job.title); setDescription(job.description); setEmail(job.email); setTelephone(job.telephone);
          setAreaId(String(job.areaId)); setCategoryId(String(job.categoryId)); setCompanyName(job.companyName || '');
          setStatus(job.status);
          if (job.institutionId) setInstitutionId(String(job.institutionId));
          
          // --- AQUI É ONDE O NOME É ENVIADO PARA O BREADCRUMB ---
          // Diz ao breadcrumb: "Quando ver o segmento '4', mostre 'Desenvolvedor...'"
          setCustomLabel(String(id), job.title);
          
        } else { toast.error('Vaga não encontrada.'); router.push('/admin/jobs'); }
      } catch (err) { toast.error('Erro de rede.'); } finally { setIsLoading(false); }
    };
    fetchData();
  }, [token, id, canEditInstitution, router, setCustomLabel]); 

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setIsSaving(true);
    try {
      const body: any = { title, description, email, telephone, areaId: parseInt(areaId), categoryId: parseInt(categoryId), companyName, status, institutionId: canEditInstitution && institutionId ? parseInt(institutionId) : undefined };
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/jobs/edit/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }, body: JSON.stringify(body) });
      if (res.ok) { 
          // Atualiza o breadcrumb se o título mudou ao salvar
          setCustomLabel(String(id), title);
          toast.success('Atualizado!'); 
          router.push('/admin/jobs'); 
      } else { toast.error('Erro ao atualizar.'); }
    } catch (err) { toast.error('Erro de rede.'); } finally { setIsSaving(false); }
  };

  if (isLoading) return <div className="flex h-64 items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-blue-600"/></div>;

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-10">
      <div className="flex items-center gap-2 mb-4">
        <Button variant="ghost" size="sm" onClick={() => router.back()} className="text-neutral-500 hover:text-neutral-900 px-0">
            <ChevronLeft className="h-4 w-4 mr-1" /> Voltar
        </Button>
      </div>

      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-neutral-900">Editar Vaga</h1>
        <span className="text-sm text-neutral-500 font-mono">ID: #{id}</span>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Card 1: Informações Principais */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-neutral-200">
            <h2 className="text-base font-semibold text-neutral-900 mb-4 pb-2 border-b">Sobre a Vaga</h2>
            <div className="space-y-4">
                <div className="space-y-1">
                    <label className="text-sm font-medium text-neutral-700">Título do Cargo</label>
                    <Input value={title} onChange={e => setTitle(e.target.value)} required />
                </div>
                <div className="space-y-1">
                    <label className="text-sm font-medium text-neutral-700">Descrição Detalhada</label>
                    <div className="prose-sm"><RichTextEditor value={description} onChange={setDescription} /></div>
                </div>
            </div>
        </div>

        {/* Card 2: Classificação e Contato */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-neutral-200">
            <h2 className="text-base font-semibold text-neutral-900 mb-4 pb-2 border-b">Detalhes e Contato</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-1">
                    <label className="text-sm font-medium text-neutral-700">Área de Atuação</label>
                    <Select value={areaId} onValueChange={setAreaId} required>
                        <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                        <SelectContent>{areas.map(a => <SelectItem key={a.id} value={String(a.id)}>{a.name}</SelectItem>)}</SelectContent>
                    </Select>
                </div>
                <div className="space-y-1">
                    <label className="text-sm font-medium text-neutral-700">Categoria</label>
                    <Select value={categoryId} onValueChange={setCategoryId} required>
                        <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                        <SelectContent>{categories.map(c => <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>)}</SelectContent>
                    </Select>
                </div>
                <div className="space-y-1">
                    <label className="text-sm font-medium text-neutral-700">Email</label>
                    <Input type="email" value={email} onChange={e => setEmail(e.target.value)} required />
                </div>
                <div className="space-y-1">
                    <label className="text-sm font-medium text-neutral-700">Telefone</label>
                    <Input type="tel" value={telephone} onChange={e => setTelephone(e.target.value)} required />
                </div>
                <div className="space-y-1">
                    <label className="text-sm font-medium text-neutral-700">Empresa (Opcional)</label>
                    <Input value={companyName} onChange={e => setCompanyName(e.target.value)} />
                </div>
            </div>
        </div>

        {/* Card 3: Status */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-neutral-200">
            <h2 className="text-base font-semibold text-neutral-900 mb-4 pb-2 border-b">Status e Publicação</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-1">
                    <label className="text-sm font-medium text-neutral-700">Status Atual</label>
                    <Select value={status} onValueChange={setStatus} required>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="rascunho">Rascunho (Oculto)</SelectItem>
                            <SelectItem value="published">Publicado (Visível)</SelectItem>
                            <SelectItem value="closed">Fechado</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                {canEditInstitution && (
                    <div className="space-y-1">
                        <label className="text-sm font-medium text-neutral-700">Instituição Vinculada</label>
                        <Select value={institutionId} onValueChange={setInstitutionId}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>{institutions.map(i => <SelectItem key={i.id} value={String(i.id)}>{i.name}</SelectItem>)}</SelectContent>
                        </Select>
                    </div>
                )}
            </div>
        </div>

        <div className="flex justify-end gap-3">
           <Button type="button" variant="outline" onClick={() => router.push('/admin/jobs')}>Cancelar</Button>
           <Button type="submit" disabled={isSaving} className="bg-blue-600 hover:bg-blue-700 px-8">
            {isSaving ? 'Salvando...' : 'Salvar Alterações'}
           </Button>
        </div>
      </form>
    </div>
  );
}