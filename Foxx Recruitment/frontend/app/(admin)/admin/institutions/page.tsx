'use client';

import { useState, useEffect, FormEvent } from 'react';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription } from '@/components/ui/alert-dialog';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { 
    Building, Plus, Search, Trash2, User, Pencil, 
    Eye, Ban, CheckCircle, RotateCcw 
} from 'lucide-react';
import Link from 'next/link';

interface Institution { 
    id: number; 
    name: string; 
    isActive: boolean; 
}

const API_URL = `${process.env.NEXT_PUBLIC_API_URL}`;

export default function InstitutionsPage() {
  const [institutions, setInstitutions] = useState<Institution[]>([]);
  const [filtered, setFiltered] = useState<Institution[]>([]);
  const [search, setSearch] = useState('');
  
  // Modais e Seleções
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [institutionToDeactivate, setInstitutionToDeactivate] = useState<Institution | null>(null);
  const [institutionToReactivate, setInstitutionToReactivate] = useState<Institution | null>(null);
  const [editingInstitution, setEditingInstitution] = useState<Institution | null>(null);
  
  // Controle de Estado
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Formulário
  const [formData, setFormData] = useState({
    universityName: '',
    firstName: '',
    lastName: '',
    email: '',
    password: ''
  });

  const { token } = useAuth();

  // --- Buscar Dados ---
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

  // --- Filtro de Busca ---
  useEffect(() => {
    setFiltered(institutions.filter(i => i.name.toLowerCase().includes(search.toLowerCase())));
  }, [search, institutions]);

  // --- Handlers ---

  const openModal = (inst: Institution | null = null) => {
    setEditingInstitution(inst);
    if (inst) {
        // Modo Edição: Preenche apenas o nome
        setFormData({ 
            universityName: inst.name, 
            firstName: '', lastName: '', email: '', password: '' 
        });
    } else {
        // Modo Criação: Limpa tudo
        setFormData({ universityName: '', firstName: '', lastName: '', email: '', password: '' });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setIsSubmitting(true);

    try {
      if (editingInstitution) {
        // --- Edição (Apenas Nome) ---
        const res = await fetch(`${API_URL}/institutions/${editingInstitution.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify({ name: formData.universityName }),
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
        // --- Criação Completa (Tenant + Admin) ---
        const res = await fetch(`${API_URL}/admin/universities`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify(formData),
        });

        if (res.ok) {
            toast.success('Faculdade e Administrador criados com sucesso!');
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

  const handleDeactivate = async () => {
    if (!token || !institutionToDeactivate) return;
    try {
      // DELETE agora faz Soft Delete no backend (isActive = false)
      const res = await fetch(`${API_URL}/institutions/${institutionToDeactivate.id}`, { 
          method: 'DELETE', 
          headers: { Authorization: `Bearer ${token}` } 
      });
      
      if (res.ok) {
        toast.success('Faculdade desativada com sucesso!');
        setInstitutionToDeactivate(null);
        fetchData();
      } else { 
        toast.error('Erro ao desativar.'); 
      }
    } catch { toast.error('Erro de rede.'); }
  };

  const handleReactivate = async () => {
    if (!token || !institutionToReactivate) return;
    try {
      // Rota específica para reativar
      const res = await fetch(`${API_URL}/institutions/${institutionToReactivate.id}/reactivate`, { 
          method: 'PATCH', 
          headers: { Authorization: `Bearer ${token}` } 
      });
      
      if (res.ok) {
        toast.success('Instituição reativada com sucesso!');
        setInstitutionToReactivate(null);
        fetchData();
      } else { 
        toast.error('Erro ao reativar.'); 
      }
    } catch { toast.error('Erro de rede.'); }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
            <h1 className="text-2xl font-bold text-neutral-900">Faculdades (Tenants)</h1>
            <p className="text-neutral-500 text-sm">Gerencie as instituições e seus acessos.</p>
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
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
                <TableRow><TableCell colSpan={3} className="text-center py-8">Carregando...</TableCell></TableRow>
            ) : filtered.length > 0 ? (
                filtered.map((inst) => (
                <TableRow key={inst.id} className={`hover:bg-neutral-50/50 transition-colors ${!inst.isActive ? 'opacity-70 bg-neutral-50' : ''}`}>
                    <TableCell className="font-medium">
                        <div className="flex items-center gap-3">
                            <div className={`h-9 w-9 rounded-lg flex items-center justify-center font-bold shadow-sm ${inst.isActive ? 'bg-orange-100 text-orange-600' : 'bg-neutral-200 text-neutral-500'}`}>
                                {inst.name[0]}
                            </div>
                            <div>
                                {inst.name}
                                <div className="text-xs text-neutral-400 font-mono">ID: #{inst.id}</div>
                            </div>
                        </div>
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
                        {/* Ver Detalhes */}
                        <Button variant="ghost" size="icon" asChild className="h-8 w-8 text-neutral-500 hover:text-orange-600 hover:bg-orange-50" title="Ver Detalhes">
                            <Link href={`/admin/institutions/${inst.id}`}>
                                <Eye className="h-4 w-4" />
                            </Link>
                        </Button>

                        {/* Editar */}
                        <Button variant="ghost" size="icon" onClick={() => openModal(inst)} className="h-8 w-8 text-neutral-500 hover:text-blue-600 hover:bg-blue-50" title="Editar Nome">
                            <Pencil className="h-4 w-4" />
                        </Button>
                        
                        {/* Ação Condicional: Desativar ou Reativar */}
                        {inst.isActive ? (
                            <Button variant="ghost" size="icon" onClick={() => setInstitutionToDeactivate(inst)} className="h-8 w-8 text-neutral-500 hover:text-red-600 hover:bg-red-50" title="Desativar Acesso">
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        ) : (
                            <Button variant="ghost" size="icon" onClick={() => setInstitutionToReactivate(inst)} className="h-8 w-8 text-green-600 bg-green-50 hover:bg-green-100 hover:text-green-700" title="Reativar Acesso">
                                <RotateCcw className="h-4 w-4" />
                            </Button>
                        )}
                    </TableCell>
                </TableRow>
                ))
            ) : (
                <TableRow><TableCell colSpan={3} className="text-center py-12 text-neutral-500">Nenhuma faculdade encontrada.</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* --- MODAL DE CRIAÇÃO / EDIÇÃO --- */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-lg">
            <DialogHeader>
                <DialogTitle>{editingInstitution ? 'Editar Instituição' : 'Nova Faculdade & Administrador'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="py-2 space-y-4">
                
                {/* Dados da Faculdade */}
                <div className="space-y-2 p-4 bg-neutral-50 rounded-lg border border-neutral-100">
                    <h3 className="text-sm font-semibold text-neutral-900 flex items-center gap-2">
                        <Building className="h-4 w-4 text-orange-600" /> Dados da Instituição
                    </h3>
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
                </div>

                {/* Dados do Admin (Apenas na criação) */}
                {!editingInstitution && (
                    <div className="space-y-3 p-4 bg-neutral-50 rounded-lg border border-neutral-100">
                        <h3 className="text-sm font-semibold text-neutral-900 flex items-center gap-2">
                            <User className="h-4 w-4 text-orange-600" /> Dados do Admin Local
                        </h3>
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="text-xs font-medium text-neutral-500 mb-1 block">Nome</label>
                                <Input value={formData.firstName} onChange={e => setFormData({...formData, firstName: e.target.value})} required className="bg-white" placeholder="Nome" />
                            </div>
                            <div>
                                <label className="text-xs font-medium text-neutral-500 mb-1 block">Sobrenome</label>
                                <Input value={formData.lastName} onChange={e => setFormData({...formData, lastName: e.target.value})} required className="bg-white" placeholder="Sobrenome" />
                            </div>
                        </div>
                        <div>
                            <label className="text-xs font-medium text-neutral-500 mb-1 block">Email Corporativo</label>
                            <Input type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} placeholder="admin@faculdade.com" required className="bg-white" />
                        </div>
                        <div>
                            <label className="text-xs font-medium text-neutral-500 mb-1 block">Senha Inicial</label>
                            <Input type="password" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} placeholder="******" required minLength={6} className="bg-white" />
                        </div>
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

      {/* --- MODAL DE DESATIVAR --- */}
      <AlertDialog open={!!institutionToDeactivate} onOpenChange={(o) => !o && setInstitutionToDeactivate(null)}>
        <AlertDialogContent>
            <AlertDialogHeader>
                <AlertDialogTitle className="text-red-600 flex items-center gap-2">
                    <Ban className="h-5 w-5" /> Desativar Instituição?
                </AlertDialogTitle>
                <AlertDialogDescription>
                    Isso impedirá que administradores, professores e alunos da <strong>{institutionToDeactivate?.name}</strong> acessem o sistema. <br/><br/>
                    Os dados serão mantidos, mas o acesso será suspenso imediatamente.
                </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={handleDeactivate} className="bg-red-600 hover:bg-red-700 text-white">
                    Confirmar Desativação
                </AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* --- MODAL DE REATIVAR --- */}
      <AlertDialog open={!!institutionToReactivate} onOpenChange={(o) => !o && setInstitutionToReactivate(null)}>
        <AlertDialogContent>
            <AlertDialogHeader>
                <AlertDialogTitle className="text-green-600 flex items-center gap-2">
                    <CheckCircle className="h-5 w-5" /> Reativar Instituição?
                </AlertDialogTitle>
                <AlertDialogDescription>
                    Isso restaurará o acesso de todos os administradores, professores e alunos da <strong>{institutionToReactivate?.name}</strong> ao sistema.
                </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={handleReactivate} className="bg-green-600 hover:bg-green-700 text-white">
                    Confirmar Reativação
                </AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}