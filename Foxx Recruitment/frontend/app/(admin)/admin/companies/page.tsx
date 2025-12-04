'use client';

// ... (imports existentes)
import { useState, useEffect, FormEvent } from 'react';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';
// ... outros imports de UI ...
import { Button } from '@/components/ui/button';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose,
} from '@/components/ui/dialog';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import {
  Table, TableHeader, TableBody, TableRow, TableHead, TableCell,
} from '@/components/ui/table';
import { Building2, Plus, Pencil, Trash2, Search, MoreHorizontal } from 'lucide-react'; // Novos ícones

// Interface
interface Institution {
  id: number;
  name: string;
}

const API_BASE_URL = `${process.env.NEXT_PUBLIC_API_URL}`;

export default function CompaniesPage() {
  const [companies, setCompanies] = useState<Institution[]>([]);
  const [filteredCompanies, setFilteredCompanies] = useState<Institution[]>([]); // Filtro
  const [search, setSearch] = useState(''); // Busca
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ... (estados de modal e formData mantidos iguais ao anterior) ...
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAlertDialogOpen, setIsAlertDialogOpen] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState<Institution | null>(null);
  const [companyToDelete, setCompanyToDelete] = useState<Institution | null>(null);
  const [formData, setFormData] = useState({
    companyName: '', firstName: '', lastName: '', email: '', password: ''
  });

  const { token } = useAuth();

  const fetchCompanies = async () => {
    if (!token) return;
    try {
      const res = await fetch(`${API_BASE_URL}/institutions?type=company`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setCompanies(data);
        setFilteredCompanies(data); // Inicializa o filtro
      }
    } catch (error) {
      toast.error('Erro ao buscar empresas.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    document.title = 'Admin: Empresas | Decola Vagas';
    fetchCompanies();
  }, [token]);

  // Efeito de busca em tempo real
  useEffect(() => {
    const lowerSearch = search.toLowerCase();
    setFilteredCompanies(
        companies.filter(c => c.name.toLowerCase().includes(lowerSearch))
    );
  }, [search, companies]);

  // ... (manter funções openCreateModal, openEditModal, openDeleteDialog, handleSubmit, handleDelete IGUAIS ao código anterior) ...
  const openCreateModal = () => {
    setSelectedCompany(null);
    setFormData({ companyName: '', firstName: '', lastName: '', email: '', password: '' });
    setIsModalOpen(true);
  };

  const openEditModal = (company: Institution) => {
    setSelectedCompany(company);
    setFormData({ companyName: company.name, firstName: '', lastName: '', email: '', password: '' });
    setIsModalOpen(true);
  };

  const openDeleteDialog = (company: Institution) => {
    setCompanyToDelete(company);
    setIsAlertDialogOpen(true);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setIsSubmitting(true);

    try {
      if (selectedCompany) {
        const res = await fetch(`${API_BASE_URL}/institutions/${selectedCompany.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ name: formData.companyName }),
        });
        if (res.ok) {
          toast.success('Empresa atualizada com sucesso!');
          setIsModalOpen(false);
          fetchCompanies();
        } else {
            const data = await res.json();
            toast.error(data.error || 'Erro ao atualizar.');
        }
      } else {
        const res = await fetch(`${API_BASE_URL}/admin/companies`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify(formData),
        });
        if (res.ok) {
          toast.success('Empresa cadastrada!');
          setIsModalOpen(false);
          fetchCompanies();
        } else {
            const data = await res.json();
            toast.error(data.error || 'Erro ao cadastrar.');
        }
      }
    } catch (error) { toast.error('Erro de rede.'); } finally { setIsSubmitting(false); }
  };

  const handleDelete = async () => {
    if (!token || !companyToDelete) return;
    try {
      const res = await fetch(`${API_BASE_URL}/institutions/${companyToDelete.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        toast.success('Empresa excluída!');
        setIsAlertDialogOpen(false);
        setCompanyToDelete(null);
        fetchCompanies();
      } else {
        if (res.status === 500) toast.error('Impossível excluir: existem vínculos ativos.');
        else toast.error('Erro ao excluir.');
      }
    } catch (error) { toast.error('Erro de rede.'); }
  };

  return (
    <div className="space-y-6">
      {/* Header com Busca */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
            <h1 className="text-2xl font-bold text-neutral-900">Empresas</h1>
            <p className="text-neutral-500 text-sm">Gerencie os parceiros e recrutadores.</p>
        </div>
        <Button onClick={openCreateModal} className="bg-blue-600 hover:bg-blue-700 shadow-sm">
          <Plus className="mr-2 h-4 w-4" /> Nova Empresa
        </Button>
      </div>

      {/* Barra de Ferramentas */}
      <div className="flex items-center gap-2 bg-white p-2 rounded-lg border border-neutral-200 shadow-sm max-w-md">
        <Search className="h-4 w-4 text-neutral-400 ml-2" />
        <Input 
            placeholder="Buscar empresa..." 
            className="border-none shadow-none focus-visible:ring-0 h-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Tabela Estilizada */}
      <div className="bg-white rounded-xl shadow-sm border border-neutral-200 overflow-hidden">
        <Table>
          <TableHeader className="bg-neutral-50">
            <TableRow>
              <TableHead className="w-[300px]">Empresa</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Código</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
                <TableRow><TableCell colSpan={4} className="text-center py-8">Carregando...</TableCell></TableRow>
            ) : filteredCompanies.length > 0 ? (
                filteredCompanies.map((company) => (
                <TableRow key={company.id} className="hover:bg-neutral-50/50 transition-colors">
                    <TableCell>
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-lg">
                                {company.name.charAt(0).toUpperCase()}
                            </div>
                            <div className="flex flex-col">
                                <span className="font-semibold text-neutral-900">{company.name}</span>
                                <span className="text-xs text-neutral-500">Parceiro</span>
                            </div>
                        </div>
                    </TableCell>
                    <TableCell>
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            Ativo
                        </span>
                    </TableCell>
                    <TableCell className="text-right text-xs font-mono text-neutral-500">
                        #{String(company.id).padStart(4, '0')}
                    </TableCell>
                    <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-neutral-500 hover:text-blue-600" onClick={() => openEditModal(company)}>
                                <Pencil className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-neutral-500 hover:text-red-600" onClick={() => openDeleteDialog(company)}>
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        </div>
                    </TableCell>
                </TableRow>
                ))
            ) : (
                <TableRow>
                    <TableCell colSpan={4} className="text-center py-12 text-neutral-500">
                        Nenhuma empresa encontrada com este nome.
                    </TableCell>
                </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* --- MANTENHA O RESTANTE DOS MODAIS (DIALOG E ALERT) EXATAMENTE IGUAIS AO CÓDIGO ANTERIOR --- */}
      {/* ... Código dos modais aqui ... */}
      
      {/* --- MODAL (Criação e Edição) --- */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{selectedCompany ? 'Editar Empresa' : 'Cadastrar Nova Empresa'}</DialogTitle>
            <DialogDescription>
              {selectedCompany 
                ? 'Atualize o nome da empresa abaixo.' 
                : 'Isso criará a instituição e o usuário responsável.'
              }
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleSubmit} className="space-y-4 py-2">
            <div className="space-y-2">
                <h3 className="text-sm font-semibold text-neutral-900">Dados da Empresa</h3>
                <div>
                    <label className="text-sm font-medium mb-1 block">Nome Fantasia</label>
                    <Input 
                        value={formData.companyName}
                        onChange={e => setFormData({...formData, companyName: e.target.value})}
                        placeholder="Ex: Tech Solutions"
                        required
                    />
                </div>
            </div>

            {!selectedCompany && (
                <div className="space-y-2 pt-2 border-t">
                    <h3 className="text-sm font-semibold text-neutral-900">Dados do Responsável</h3>
                    <div className="grid grid-cols-2 gap-2">
                        <div>
                            <label className="text-sm font-medium mb-1 block">Nome</label>
                            <Input value={formData.firstName} onChange={e => setFormData({...formData, firstName: e.target.value})} required />
                        </div>
                        <div>
                            <label className="text-sm font-medium mb-1 block">Sobrenome</label>
                            <Input value={formData.lastName} onChange={e => setFormData({...formData, lastName: e.target.value})} required />
                        </div>
                    </div>
                    <div>
                        <label className="text-sm font-medium mb-1 block">E-mail</label>
                        <Input type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} required />
                    </div>
                    <div>
                        <label className="text-sm font-medium mb-1 block">Senha</label>
                        <Input type="password" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} required minLength={6} />
                    </div>
                </div>
            )}

            <DialogFooter className="mt-4">
                <DialogClose asChild><Button type="button" variant="outline">Cancelar</Button></DialogClose>
                <Button type="submit" disabled={isSubmitting}>{isSubmitting ? 'Salvando...' : 'Salvar'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={isAlertDialogOpen} onOpenChange={setIsAlertDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir empresa?</AlertDialogTitle>
            <AlertDialogDescription>Esta ação é irreversível.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setCompanyToDelete(null)}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}