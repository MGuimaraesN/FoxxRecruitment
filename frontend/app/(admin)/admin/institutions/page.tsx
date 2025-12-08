'use client';

import { useState, useEffect, FormEvent } from 'react';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch'; // Importando Switch
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription } from '@/components/ui/alert-dialog';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { 
    Building, Plus, Search, Trash2, User, Pencil, 
    Eye, Ban, CheckCircle, RotateCcw, Upload, Palette, Globe, Link as LinkIcon 
} from 'lucide-react';
import Link from 'next/link';

interface Institution { 
    id: number; 
    name: string; 
    isActive: boolean; 
    primaryColor?: string;
    logoUrl?: string;
    slug?: string; // Adicionado Slug na interface
}

const API_URL = `${process.env.NEXT_PUBLIC_API_URL}`;
const ROOT_DOMAIN = process.env.NEXT_PUBLIC_ROOT_DOMAIN || 'localhost:3000';

export default function InstitutionsPage() {
  const [institutions, setInstitutions] = useState<Institution[]>([]);
  const [filtered, setFiltered] = useState<Institution[]>([]);
  const [search, setSearch] = useState('');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [institutionToDeactivate, setInstitutionToDeactivate] = useState<Institution | null>(null);
  const [institutionToReactivate, setInstitutionToReactivate] = useState<Institution | null>(null);
  const [editingInstitution, setEditingInstitution] = useState<Institution | null>(null);
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Estado do Formulário Atualizado
  const [formData, setFormData] = useState({
    universityName: '',
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    primaryColor: '#2563eb',
    slug: '',     // Novo campo
    isActive: true // Novo campo
  });
  const [logoFile, setLogoFile] = useState<File | null>(null);

  const { token } = useAuth();

  const fetchData = async () => {
    if (!token) return;
    setIsLoading(true);
    try {
      const res = await fetch(`${API_URL}/institutions?type=university`, { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) {
        const data = await res.json();
        setInstitutions(data);
        setFiltered(data);
      }
    } catch { toast.error('Erro de rede.'); } 
    finally { setIsLoading(false); }
  };

  useEffect(() => {
    document.title = 'Foxx | Gestão de Faculdades';
    fetchData();
  }, [token]);

  useEffect(() => {
    setFiltered(institutions.filter(i => i.name.toLowerCase().includes(search.toLowerCase())));
  }, [search, institutions]);

  // Função para formatar Slug (sem espaços, minúsculo)
  const handleSlugChange = (value: string) => {
    const formatted = value
        .toLowerCase()
        .normalize('NFD').replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9-]/g, "");
    setFormData(prev => ({ ...prev, slug: formatted }));
  };

  const openModal = (inst: Institution | null = null) => {
    setEditingInstitution(inst);
    setLogoFile(null);
    if (inst) {
        // Preenche dados existentes para edição
        setFormData({ 
            universityName: inst.name, 
            firstName: '', lastName: '', email: '', password: '',
            primaryColor: inst.primaryColor || '#2563eb',
            slug: inst.slug || '',
            isActive: inst.isActive
        });
    } else {
        // Limpa para nova criação
        setFormData({ 
            universityName: '', firstName: '', lastName: '', email: '', password: '',
            primaryColor: '#2563eb',
            slug: '',
            isActive: true
        });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setIsSubmitting(true);

    try {
      if (editingInstitution) {
        // --- EDIÇÃO (PUT) ---
        const data = new FormData();
        data.append('name', formData.universityName);
        data.append('primaryColor', formData.primaryColor);
        data.append('slug', formData.slug); // Envia Slug
        data.append('isActive', String(formData.isActive)); // Envia Status
        if (logoFile) data.append('logo', logoFile);

        const res = await fetch(`${API_URL}/institutions/${editingInstitution.id}`, {
            method: 'PUT',
            headers: { Authorization: `Bearer ${token}` },
            body: data,
        });

        if (res.ok) {
            toast.success('Instituição atualizada!');
            setIsModalOpen(false);
            fetchData();
        } else {
            const err = await res.json();
            toast.error(err.error || 'Erro ao atualizar.');
        }
      } else {
        // --- CRIAÇÃO (POST) ---
        // Se a criação inicial não suportar slug/logo via JSON, criamos primeiro e editamos depois,
        // ou ajustamos o backend. Assumindo criação simples por enquanto:
        const res = await fetch(`${API_URL}/admin/universities`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify(formData),
        });

        if (res.ok) {
            toast.success('Faculdade criada! (Edite para adicionar logo/slug)');
            setIsModalOpen(false);
            fetchData();
        } else {
            const err = await res.json();
            toast.error(err.error || 'Erro ao criar.');
        }
      }
    } catch { toast.error('Erro de rede.'); } 
    finally { setIsSubmitting(false); }
  };

  // Funções de Desativar/Reativar Rápidas (Botões da Tabela)
  const handleDeactivate = async () => {
    if (!token || !institutionToDeactivate) return;
    try {
      const res = await fetch(`${API_URL}/institutions/${institutionToDeactivate.id}`, { 
          method: 'DELETE', 
          headers: { Authorization: `Bearer ${token}` } 
      });
      if (res.ok) {
        toast.success('Faculdade desativada!');
        setInstitutionToDeactivate(null);
        fetchData();
      } else { toast.error('Erro ao desativar.'); }
    } catch { toast.error('Erro de rede.'); }
  };

  const handleReactivate = async () => {
    if (!token || !institutionToReactivate) return;
    try {
      const res = await fetch(`${API_URL}/institutions/${institutionToReactivate.id}/reactivate`, { 
          method: 'PATCH', 
          headers: { Authorization: `Bearer ${token}` } 
      });
      if (res.ok) {
        toast.success('Instituição reativada!');
        setInstitutionToReactivate(null);
        fetchData();
      } else { toast.error('Erro ao reativar.'); }
    } catch { toast.error('Erro de rede.'); }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
            <h1 className="text-2xl font-bold text-neutral-900">Faculdades (Tenants)</h1>
            <p className="text-neutral-500 text-sm">Gerencie as instituições e sua identidade visual.</p>
        </div>
        <Button onClick={() => openModal(null)} className="bg-orange-600 hover:bg-orange-700 shadow-sm">
            <Plus className="mr-2 h-4 w-4" /> Nova Faculdade
        </Button>
      </div>

      {/* Busca */}
      <div className="flex items-center gap-2 bg-white p-2 rounded-lg border border-neutral-200 shadow-sm max-w-md">
        <Search className="h-4 w-4 text-neutral-400 ml-2" />
        <Input 
            placeholder="Buscar faculdade..." 
            className="border-none shadow-none focus-visible:ring-0 h-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Tabela */}
      <div className="bg-white rounded-xl shadow-sm border border-neutral-200 overflow-hidden">
        <Table>
          <TableHeader className="bg-neutral-50">
            <TableRow>
              <TableHead>Instituição</TableHead>
              <TableHead>Branding</TableHead>
              <TableHead>Slug (Domínio)</TableHead> {/* Nova Coluna */}
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
                <TableRow><TableCell colSpan={5} className="text-center py-8">Carregando...</TableCell></TableRow>
            ) : filtered.length > 0 ? (
                filtered.map((inst) => (
                <TableRow key={inst.id} className={`hover:bg-neutral-50/50 transition-colors ${!inst.isActive ? 'opacity-70 bg-neutral-50' : ''}`}>
                    <TableCell className="font-medium">
                        <div className="flex items-center gap-3">
                            <div className="h-9 w-9 rounded-lg overflow-hidden bg-neutral-100 flex items-center justify-center font-bold border border-neutral-200">
                                {inst.logoUrl ? (
                                    <img src={`${API_URL}${inst.logoUrl}`} alt="Logo" className="h-full w-full object-contain p-1" />
                                ) : (
                                    <span className="text-orange-600">{inst.name[0]}</span>
                                )}
                            </div>
                            <div>
                                {inst.name}
                                <div className="text-xs text-neutral-400 font-mono">ID: #{inst.id}</div>
                            </div>
                        </div>
                    </TableCell>
                    <TableCell>
                         <div className="flex items-center gap-2">
                            <div className="w-4 h-4 rounded-full border border-neutral-200 shadow-sm" style={{ backgroundColor: inst.primaryColor || '#2563eb' }} />
                            <span className="text-xs text-neutral-500 uppercase">{inst.primaryColor || '#2563eb'}</span>
                         </div>
                    </TableCell>
                    <TableCell>
                        {inst.slug ? (
                            <span className="text-xs font-mono text-blue-600 bg-blue-50 px-2 py-1 rounded">{inst.slug}.{ROOT_DOMAIN}</span>
                        ) : <span className="text-xs text-neutral-400">-</span>}
                    </TableCell>
                    <TableCell>
                        {inst.isActive ? (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700 border border-green-200">
                                <CheckCircle className="w-3 h-3 mr-1" /> Ativo
                            </span>
                        ) : (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700 border border-red-200">
                                <Ban className="w-3 h-3 mr-1" /> Desativado
                            </span>
                        )}
                    </TableCell>
                    <TableCell className="text-right space-x-2">
                        <Button variant="ghost" size="icon" asChild className="h-8 w-8 text-neutral-500 hover:text-orange-600">
                            <Link href={`/admin/institutions/${inst.id}`}><Eye className="h-4 w-4" /></Link>
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => openModal(inst)} className="h-8 w-8 text-neutral-500 hover:text-blue-600">
                            <Pencil className="h-4 w-4" />
                        </Button>
                        {inst.isActive ? (
                            <Button variant="ghost" size="icon" onClick={() => setInstitutionToDeactivate(inst)} className="h-8 w-8 text-neutral-500 hover:text-red-600">
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        ) : (
                            <Button variant="ghost" size="icon" onClick={() => setInstitutionToReactivate(inst)} className="h-8 w-8 text-green-600 bg-green-50 hover:bg-green-100">
                                <RotateCcw className="h-4 w-4" />
                            </Button>
                        )}
                    </TableCell>
                </TableRow>
                ))
            ) : (
                <TableRow><TableCell colSpan={5} className="text-center py-12 text-neutral-500">Nenhuma faculdade encontrada.</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* MODAL DE EDIÇÃO / CRIAÇÃO */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-lg">
            <DialogHeader>
                <DialogTitle>{editingInstitution ? 'Editar Branding e Dados' : 'Nova Faculdade'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="py-2 space-y-4">
                
                {/* Dados Principais */}
                <div className="space-y-4 p-4 bg-neutral-50 rounded-lg border border-neutral-100">
                    <h3 className="text-sm font-semibold text-neutral-900 flex items-center gap-2">
                        <Building className="h-4 w-4 text-orange-600" /> Instituição
                    </h3>
                    
                    {/* Nome */}
                    <div>
                        <label className="text-xs font-medium text-neutral-500 mb-1 block">Nome da Faculdade</label>
                        <Input 
                            value={formData.universityName} 
                            onChange={e => setFormData({...formData, universityName: e.target.value})} 
                            placeholder="Ex: Universidade Foxx" 
                            required 
                            className="bg-white"
                        />
                    </div>
                    
                    {/* Campos Extras (Apenas Edição) */}
                    {editingInstitution && (
                        <>
                            {/* SLUG */}
                            <div>
                                <label className="text-xs font-medium text-neutral-500 mb-1 flex items-center gap-1">
                                    <Globe className="h-3 w-3" /> Domínio Personalizado (Slug)
                                </label>
                                <div className="relative">
                                    <LinkIcon className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-neutral-400" />
                                    <Input 
                                        value={formData.slug} 
                                        onChange={e => handleSlugChange(e.target.value)} 
                                        className="pl-8 bg-white font-mono text-sm"
                                        placeholder="ex: usp"
                                    />
                                </div>
                                {formData.slug && (
                                    <p className="text-[10px] text-green-600 mt-1 pl-1">
                                        Preview: {formData.slug}.{ROOT_DOMAIN}
                                    </p>
                                )}
                            </div>

                            {/* Branding */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs font-medium text-neutral-500 mb-1 flex items-center gap-1">
                                        <Palette className="h-3 w-3" /> Cor Primária
                                    </label>
                                    <div className="flex gap-2">
                                        <Input 
                                            type="color" 
                                            value={formData.primaryColor} 
                                            onChange={e => setFormData({...formData, primaryColor: e.target.value})} 
                                            className="w-10 h-9 p-1 bg-white cursor-pointer"
                                        />
                                        <Input 
                                            value={formData.primaryColor} 
                                            onChange={e => setFormData({...formData, primaryColor: e.target.value})} 
                                            className="bg-white text-xs font-mono uppercase"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="text-xs font-medium text-neutral-500 mb-1 flex items-center gap-1">
                                        <Upload className="h-3 w-3" /> Logo
                                    </label>
                                    <Input 
                                        type="file" 
                                        accept="image/*"
                                        onChange={e => setLogoFile(e.target.files?.[0] || null)}
                                        className="bg-white text-xs cursor-pointer file:text-blue-600 file:font-semibold"
                                    />
                                </div>
                            </div>

                            {/* Status */}
                            <div className="flex items-center justify-between bg-white p-3 rounded border border-neutral-200">
                                <span className="text-xs font-medium text-neutral-700">Status do Portal</span>
                                <div className="flex items-center gap-2">
                                    <span className={`text-xs ${formData.isActive ? 'text-green-600' : 'text-red-500'}`}>
                                        {formData.isActive ? 'Ativo' : 'Inativo'}
                                    </span>
                                    <Switch 
                                        checked={formData.isActive} 
                                        onCheckedChange={(checked) => setFormData(prev => ({...prev, isActive: checked}))} 
                                    />
                                </div>
                            </div>
                        </>
                    )}
                </div>

                {/* Campos de Admin Inicial (Apenas na Criação) */}
                {!editingInstitution && (
                    <div className="space-y-3 p-4 bg-neutral-50 rounded-lg border border-neutral-100">
                        <h3 className="text-sm font-semibold text-neutral-900 flex items-center gap-2">
                            <User className="h-4 w-4 text-orange-600" /> Admin Inicial
                        </h3>
                        <div className="grid grid-cols-2 gap-3">
                            <Input value={formData.firstName} onChange={e => setFormData({...formData, firstName: e.target.value})} required className="bg-white" placeholder="Nome" />
                            <Input value={formData.lastName} onChange={e => setFormData({...formData, lastName: e.target.value})} required className="bg-white" placeholder="Sobrenome" />
                        </div>
                        <Input type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} placeholder="admin@faculdade.com" required className="bg-white" />
                        <Input type="password" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} placeholder="******" required minLength={6} className="bg-white" />
                    </div>
                )}

                <DialogFooter className="mt-2">
                    <DialogClose asChild><Button type="button" variant="outline">Cancelar</Button></DialogClose>
                    <Button type="submit" disabled={isSubmitting} className="bg-orange-600 hover:bg-orange-700">
                        {isSubmitting ? 'Salvando...' : (editingInstitution ? 'Salvar Alterações' : 'Criar Ambiente')}
                    </Button>
                </DialogFooter>
            </form>
        </DialogContent>
      </Dialog>

      {/* Alertas de Desativação / Reativação */}
      <AlertDialog open={!!institutionToDeactivate} onOpenChange={(o) => !o && setInstitutionToDeactivate(null)}>
        <AlertDialogContent>
            <AlertDialogHeader>
                <AlertDialogTitle className="text-red-600">Desativar Instituição?</AlertDialogTitle>
                <AlertDialogDescription>O acesso será suspenso imediatamente.</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={handleDeactivate} className="bg-red-600 hover:bg-red-700">Confirmar</AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!institutionToReactivate} onOpenChange={(o) => !o && setInstitutionToReactivate(null)}>
        <AlertDialogContent>
            <AlertDialogHeader>
                <AlertDialogTitle className="text-green-600">Reativar Instituição?</AlertDialogTitle>
                <AlertDialogDescription>O acesso será restaurado imediatamente.</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={handleReactivate} className="bg-green-600 hover:bg-green-700">Confirmar</AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}