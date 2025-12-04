"use client";

import { useState, FormEvent, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { RichTextEditor } from '@/components/ui/rich-text-editor';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { ChevronLeft } from 'lucide-react';

interface Category { id: number; name: string; }
interface Area { id: number; name: string; }
interface Institution { id: number; name: string; }

export default function AdminNewJobPage() {
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
  const [isLoading, setIsLoading] = useState(false);

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
      const body: any = { title, description, email, telephone, areaId: parseInt(areaId), categoryId: parseInt(categoryId), companyName, status, institutionId: institutionId ? parseInt(institutionId) : undefined };
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/jobs/create`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }, body: JSON.stringify(body) });
      if (res.ok) { toast.success('Vaga criada!'); router.push('/admin/jobs'); } else { const data = await res.json(); toast.error(data.error || 'Erro.'); }
    } catch (err) { toast.error('Erro de rede.'); } finally { setIsLoading(false); }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-10">
      <div className="flex items-center gap-2 mb-4">
        <Button variant="ghost" size="sm" onClick={() => router.back()} className="text-neutral-500 hover:text-neutral-900 px-0">
            <ChevronLeft className="h-4 w-4 mr-1" /> Voltar
        </Button>
      </div>

      <h1 className="text-2xl font-bold text-neutral-900">Nova Oportunidade</h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Card 1: Informações Principais */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-neutral-200">
            <h2 className="text-base font-semibold text-neutral-900 mb-4 pb-2 border-b">Sobre a Vaga</h2>
            <div className="space-y-4">
                <div className="space-y-1">
                    <label className="text-sm font-medium text-neutral-700">Título do Cargo</label>
                    <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="Ex: Desenvolvedor Front-end Júnior" required />
                </div>
                <div className="space-y-1">
                    <label className="text-sm font-medium text-neutral-700">Descrição Detalhada</label>
                    <div className="prose-sm"><RichTextEditor value={description} onChange={setDescription} placeholder="Descreva as responsabilidades e requisitos..." /></div>
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
                    <label className="text-sm font-medium text-neutral-700">Email de Contato</label>
                    <Input type="email" value={email} onChange={e => setEmail(e.target.value)} required />
                </div>
                <div className="space-y-1">
                    <label className="text-sm font-medium text-neutral-700">Telefone</label>
                    <Input type="tel" value={telephone} onChange={e => setTelephone(e.target.value)} required />
                </div>
                <div className="space-y-1">
                    <label className="text-sm font-medium text-neutral-700">Empresa (Opcional)</label>
                    <Input value={companyName} onChange={e => setCompanyName(e.target.value)} placeholder="Nome da empresa contratante" />
                </div>
            </div>
        </div>

        {/* Card 3: Configurações */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-neutral-200">
            <h2 className="text-base font-semibold text-neutral-900 mb-4 pb-2 border-b">Configurações de Publicação</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-1">
                    <label className="text-sm font-medium text-neutral-700">Status Inicial</label>
                    <Select value={status} onValueChange={setStatus} required>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="rascunho">Rascunho (Oculto)</SelectItem>
                            <SelectItem value="published">Publicado (Visível)</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                {canSelectInstitution && (
                    <div className="space-y-1">
                        <label className="text-sm font-medium text-neutral-700">Vincular a Instituição</label>
                        <Select value={institutionId} onValueChange={setInstitutionId}>
                            <SelectTrigger><SelectValue placeholder="Padrão (Minha Instituição)" /></SelectTrigger>
                            <SelectContent>{institutions.map(i => <SelectItem key={i.id} value={String(i.id)}>{i.name}</SelectItem>)}</SelectContent>
                        </Select>
                    </div>
                )}
            </div>
        </div>

        <div className="flex justify-end gap-3">
           <Button type="button" variant="outline" onClick={() => router.push('/admin/jobs')} disabled={isLoading}>Cancelar</Button>
           <Button type="submit" disabled={isLoading} className="bg-blue-600 hover:bg-blue-700 px-8">
            {isLoading ? 'Salvando...' : 'Publicar Vaga'}
           </Button>
        </div>
      </form>
    </div>
  );
}