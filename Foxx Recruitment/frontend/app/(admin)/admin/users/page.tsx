'use client';

import { useEffect, useState, FormEvent } from 'react';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose,
} from '@/components/ui/dialog';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Table, TableHeader, TableBody, TableRow, TableHead, TableCell,
} from '@/components/ui/table';
import { Plus, Search, Trash2, Settings, Pencil, Building, ShieldCheck, X, Filter } from 'lucide-react';

// Interfaces
interface Role { id: number; name: string; }
interface Institution { id: number; name: string; }
interface UserInstitutionRole { id: number; institution: Institution; role: Role; }
interface User { id: number; firstName: string; lastName: string; email: string; institutions: UserInstitutionRole[]; }

const API_BASE_URL = `${process.env.NEXT_PUBLIC_API_URL}`;

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  
  // Filtros
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all'); // NOVO: Estado do filtro

  // Estados de Seleção
  const [selectedUserPermissions, setSelectedUserPermissions] = useState<User | null>(null);
  const [userToEdit, setUserToEdit] = useState<User | null>(null);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);

  // Dados auxiliares
  const [roles, setRoles] = useState<Role[]>([]);
  const [institutions, setInstitutions] = useState<Institution[]>([]);
  
  // Form de Permissões
  const [assignInstitutionId, setAssignInstitutionId] = useState('');
  const [assignRoleId, setAssignRoleId] = useState('');
  
  // Controle Geral
  const [isLoading, setIsLoading] = useState(true);
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);

  // Form de Usuário
  const [userForm, setUserForm] = useState({
    firstName: '', lastName: '', email: '', password: '', institutionId: '', roleId: '',
  });

  const { token } = useAuth();

  const fetchData = async () => {
    if (!token) return;
    setIsLoading(true);
    try {
      const [usersRes, institutionsRes, rolesRes] = await Promise.all([
        fetch(`${API_BASE_URL}/admin/users`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API_BASE_URL}/institutions`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API_BASE_URL}/roles`, { headers: { Authorization: `Bearer ${token}` } }),
      ]);

      if (usersRes.ok) {
        const data = await usersRes.json();
        setUsers(data);
        setFilteredUsers(data);
      }
      if (institutionsRes.ok) setInstitutions(await institutionsRes.json());
      if (rolesRes.ok) setRoles(await rolesRes.json());

    } catch (error) { toast.error('Erro de rede.'); } 
    finally { setIsLoading(false); }
  };

  useEffect(() => {
    document.title = 'Admin: Usuários | Decola Vagas';
    fetchData();
  }, [token]);

  // --- LÓGICA DE FILTRO ATUALIZADA ---
  useEffect(() => {
    const lowerSearch = search.toLowerCase();
    
    setFilteredUsers(users.filter(u => {
        // 1. Filtro de Texto
        const matchesSearch = 
            u.firstName.toLowerCase().includes(lowerSearch) || 
            u.lastName.toLowerCase().includes(lowerSearch) ||
            u.email.toLowerCase().includes(lowerSearch);

        // 2. Filtro de Cargo (Vínculo)
        const matchesRole = roleFilter === 'all' 
            ? true 
            : u.institutions.some(inst => inst.role.name === roleFilter);

        return matchesSearch && matchesRole;
    }));
  }, [search, roleFilter, users]);

  // --- Handlers de Modal ---

  const openCreateModal = () => {
    setUserToEdit(null);
    setUserForm({ firstName: '', lastName: '', email: '', password: '', institutionId: '', roleId: '' });
    setIsUserModalOpen(true);
  };

  const openEditModal = (user: User) => {
    setUserToEdit(user);
    setUserForm({ 
        firstName: user.firstName, 
        lastName: user.lastName, 
        email: user.email, 
        password: '', 
        institutionId: '', 
        roleId: '' 
    });
    setIsUserModalOpen(true);
  };

  // --- Ações do CRUD ---

  const handleSaveUser = async (e: FormEvent) => {
    e.preventDefault();
    if (!token) return;

    try {
        if (userToEdit) {
            const res = await fetch(`${API_BASE_URL}/admin/users/${userToEdit.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({ 
                    firstName: userForm.firstName, 
                    lastName: userForm.lastName, 
                    email: userForm.email 
                }),
            });

            if (res.ok) {
                toast.success('Usuário atualizado!');
                setIsUserModalOpen(false);
                fetchData();
            } else {
                const data = await res.json();
                toast.error(data.error || 'Erro ao atualizar.');
            }
        } else {
            const res = await fetch(`${API_BASE_URL}/admin/users/create`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({ 
                    ...userForm, 
                    institutionId: parseInt(userForm.institutionId), 
                    roleId: parseInt(userForm.roleId) 
                }),
            });

            if (res.ok) {
                toast.success('Usuário criado!');
                setIsUserModalOpen(false);
                fetchData();
            } else { 
                const data = await res.json();
                toast.error(data.error || 'Erro ao criar.'); 
            }
        }
    } catch (error) { toast.error('Erro de rede.'); }
  };

  const handleAssignRole = async (e: FormEvent) => {
    e.preventDefault();
    if (!token || !selectedUserPermissions || !assignInstitutionId || !assignRoleId) return;
    try {
      const res = await fetch(`${API_BASE_URL}/admin/users/assign-role`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ userId: selectedUserPermissions.id, institutionId: parseInt(assignInstitutionId), roleId: parseInt(assignRoleId) }),
      });
      if (res.ok) {
        toast.success('Cargo atribuído!');
        const updatedRes = await fetch(`${API_BASE_URL}/admin/users/${selectedUserPermissions.id}`, { headers: { Authorization: `Bearer ${token}` } });
        if(updatedRes.ok) {
          const updated = await updatedRes.json();
          setSelectedUserPermissions(updated);
          setUsers(users.map(u => u.id === updated.id ? updated : u));
        }
        setAssignInstitutionId(''); setAssignRoleId('');
      } else { toast.error('Erro ao atribuir.'); }
    } catch (error) { toast.error('Erro de rede.'); }
  };

  const handleRemoveRole = async (id: number) => {
    if (!token || !selectedUserPermissions) return;
    try {
      const res = await fetch(`${API_BASE_URL}/admin/users/remove-role/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) {
        toast.success('Cargo removido!');
        const updatedInsts = selectedUserPermissions.institutions.filter(i => i.id !== id);
        const updatedUser = { ...selectedUserPermissions, institutions: updatedInsts };
        setSelectedUserPermissions(updatedUser);
        setUsers(users.map(u => u.id === selectedUserPermissions.id ? updatedUser : u));
      } else { toast.error('Erro ao remover.'); }
    } catch (error) { toast.error('Erro de rede.'); }
  };

  const handleDeleteUser = async () => {
    if (!token || !userToDelete) return;
    try {
      const res = await fetch(`${API_BASE_URL}/admin/users/${userToDelete.id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
      if (res.ok || res.status === 204) {
        toast.success('Usuário excluído!');
        setUserToDelete(null);
        fetchData();
      } else { toast.error('Erro ao excluir.'); }
    } catch (error) { toast.error('Erro de rede.'); }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
            <h1 className="text-2xl font-bold text-neutral-900">Usuários</h1>
            <p className="text-neutral-500 text-sm">Gerencie o acesso e permissões.</p>
        </div>
        <Button onClick={openCreateModal} className="bg-blue-600 hover:bg-blue-700 shadow-sm">
            <Plus className="mr-2 h-4 w-4" /> Novo Usuário
        </Button>
      </div>

      {/* --- ÁREA DE FILTROS --- */}
      <div className="flex flex-col md:flex-row gap-4 bg-white p-4 rounded-xl border border-neutral-200 shadow-sm">
        {/* Busca */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-neutral-400" />
            <Input 
                placeholder="Buscar por nome ou email..." 
                className="pl-9 bg-neutral-50 border-neutral-200"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
            />
        </div>

        {/* Filtro de Cargo (Select) */}
        <div className="w-full md:w-48">
            <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger className="w-full h-9 rounded-md border border-neutral-200 bg-neutral-50 px-3 text-sm outline-none focus:ring-2 focus:ring-blue-500">
                    <div className="flex items-center gap-2">
                        <Filter className="h-3.5 w-3.5 text-neutral-500" />
                        <SelectValue placeholder="Filtrar por Vínculo" />
                    </div>
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">Todos os Vínculos</SelectItem>
                    {roles.map((role) => (
                        <SelectItem key={role.id} value={role.name} className="capitalize">
                            {role.name}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-neutral-200 overflow-hidden">
        <Table>
          <TableHeader className="bg-neutral-50">
            <TableRow>
              <TableHead>Usuário</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Vínculos</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
                <TableRow><TableCell colSpan={4} className="text-center py-8">Carregando...</TableCell></TableRow>
            ) : filteredUsers.length > 0 ? (
                filteredUsers.map((user) => (
                <TableRow key={user.id} className="hover:bg-neutral-50/50 transition-colors">
                    <TableCell>
                        <div className="flex items-center gap-3">
                            <div className="h-9 w-9 rounded-full bg-indigo-100 flex items-center justify-center text-sm font-bold text-indigo-600">
                                {user.firstName[0]?.toUpperCase()}{user.lastName[0]?.toUpperCase()}
                            </div>
                            <span className="font-medium text-neutral-900">{user.firstName} {user.lastName}</span>
                        </div>
                    </TableCell>
                    <TableCell className="text-neutral-500">{user.email}</TableCell>
                    <TableCell>
                        <div className="flex flex-wrap gap-1">
                            {user.institutions.map(inst => (
                                <span key={inst.id} className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-neutral-100 text-neutral-700 border border-neutral-200">
                                    {inst.role.name}
                                </span>
                            ))}
                        </div>
                    </TableCell>
                    <TableCell className="text-right space-x-1">
                        <div className="flex justify-end gap-1">
                            <Button variant="ghost" size="icon" onClick={() => setSelectedUserPermissions(user)} className="h-8 w-8 text-neutral-500 hover:text-purple-600" title="Gerenciar Cargos">
                                <Settings className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => openEditModal(user)} className="h-8 w-8 text-neutral-500 hover:text-blue-600" title="Editar Dados">
                                <Pencil className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => setUserToDelete(user)} className="h-8 w-8 text-neutral-500 hover:text-red-600" title="Excluir Usuário">
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        </div>
                    </TableCell>
                </TableRow>
                ))
            ) : (
                <TableRow><TableCell colSpan={4} className="text-center py-8 text-neutral-500">Nenhum usuário encontrado.</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* --- MODAL UNIFICADO (CRIAR / EDITAR) --- */}
      <Dialog open={isUserModalOpen} onOpenChange={setIsUserModalOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{userToEdit ? 'Editar Usuário' : 'Novo Usuário'}</DialogTitle>
            <DialogDescription>
                {userToEdit ? 'Atualize os dados básicos do usuário.' : 'Preencha os dados para cadastrar um novo membro.'}
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleSaveUser} className="py-2 space-y-5">
            <div className="space-y-3">
                <h4 className="text-sm font-medium text-neutral-900 border-b pb-1">Dados Pessoais</h4>
                <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                        <label className="text-xs font-medium text-neutral-500">Nome</label>
                        <Input placeholder="Ex: Maria" value={userForm.firstName} onChange={e => setUserForm({...userForm, firstName: e.target.value})} required />
                    </div>
                    <div className="space-y-1">
                        <label className="text-xs font-medium text-neutral-500">Sobrenome</label>
                        <Input placeholder="Ex: Silva" value={userForm.lastName} onChange={e => setUserForm({...userForm, lastName: e.target.value})} required />
                    </div>
                </div>
            </div>

            <div className="space-y-3">
                <h4 className="text-sm font-medium text-neutral-900 border-b pb-1">Credenciais & Acesso</h4>
                <div className="space-y-1">
                    <label className="text-xs font-medium text-neutral-500">Email</label>
                    <Input type="email" placeholder="email@exemplo.com" value={userForm.email} onChange={e => setUserForm({...userForm, email: e.target.value})} required />
                </div>
                
                {!userToEdit && (
                    <>
                        <div className="space-y-1">
                            <label className="text-xs font-medium text-neutral-500">Senha Provisória</label>
                            <Input type="password" placeholder="******" value={userForm.password} onChange={e => setUserForm({...userForm, password: e.target.value})} required />
                        </div>
                        
                        <div className="grid grid-cols-2 gap-3 pt-2">
                            <div className="space-y-1">
                                <label className="text-xs font-medium text-neutral-500">Instituição</label>
                                <Select value={userForm.institutionId} onValueChange={v => setUserForm({...userForm, institutionId: v})} required>
                                    <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                                    <SelectContent>{institutions.map(i => <SelectItem key={i.id} value={String(i.id)}>{i.name}</SelectItem>)}</SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-medium text-neutral-500">Cargo Inicial</label>
                                <Select value={userForm.roleId} onValueChange={v => setUserForm({...userForm, roleId: v})} required>
                                    <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                                    <SelectContent>{roles.map(r => <SelectItem key={r.id} value={String(r.id)}>{r.name}</SelectItem>)}</SelectContent>
                                </Select>
                            </div>
                        </div>
                    </>
                )}
            </div>

            <DialogFooter className="pt-2">
                <DialogClose asChild><Button type="button" variant="outline">Cancelar</Button></DialogClose>
                <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
                    {userToEdit ? 'Salvar Alterações' : 'Criar Usuário'}
                </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* --- MODAL DE PERMISSÕES (CORRIGIDO) --- */}
      <Dialog open={!!selectedUserPermissions} onOpenChange={(isOpen) => !isOpen && setSelectedUserPermissions(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Gerenciar Permissões</DialogTitle>
            <DialogDescription>
                Usuário: <span className="font-semibold text-neutral-900">{selectedUserPermissions?.firstName} {selectedUserPermissions?.lastName}</span>
            </DialogDescription>
          </DialogHeader>

          <div className="py-2 space-y-6">
            
            {/* Lista de Cargos */}
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-neutral-900 border-b pb-2 flex items-center justify-between">
                Cargos Ativos
                <span className="text-xs font-normal text-neutral-500 bg-neutral-100 px-2 py-0.5 rounded-full">
                    {selectedUserPermissions?.institutions.length}
                </span>
              </h4>
              
              <div className="space-y-2 max-h-[200px] overflow-y-auto pr-2 custom-scrollbar">
                {selectedUserPermissions?.institutions.length === 0 ? (
                    <div className="text-center py-6 bg-neutral-50 rounded-lg border border-dashed border-neutral-200">
                        <p className="text-sm text-neutral-500">Este usuário ainda não possui cargos atribuídos.</p>
                    </div>
                ) : (
                    selectedUserPermissions?.institutions.map((instRole) => (
                        <div key={instRole.id} className="group flex justify-between items-center p-3 rounded-lg border border-neutral-100 bg-white hover:border-blue-100 hover:shadow-sm transition-all">
                            <div className="flex flex-col gap-1 w-full mr-2">
                                <div className="flex items-center gap-2 text-sm font-medium text-neutral-900 break-words">
                                    <Building className="h-3.5 w-3.5 text-neutral-400 shrink-0" />
                                    <span className="truncate">{instRole.institution.name}</span>
                                </div>
                                <div className="flex items-center gap-2 text-xs text-blue-600">
                                    <ShieldCheck className="h-3.5 w-3.5" />
                                    {instRole.role.name}
                                </div>
                            </div>
                            <Button 
                                variant="ghost" 
                                size="sm" 
                                onClick={() => handleRemoveRole(instRole.id)} 
                                className="text-neutral-400 hover:text-red-600 hover:bg-red-50 h-8 w-8 p-0"
                                title="Remover permissão"
                            >
                                <X className="h-4 w-4" />
                            </Button>
                        </div>
                    ))
                )}
              </div>
            </div>

            {/* Adicionar Novo Cargo (LAYOUT CORRIGIDO) */}
            <div className="space-y-4 bg-neutral-50 p-4 rounded-lg border border-neutral-100">
                <h4 className="text-sm font-medium text-neutral-900 flex items-center gap-2">
                    <Plus className="h-4 w-4 text-blue-600" /> Atribuir Novo Cargo
                </h4>
                <form onSubmit={handleAssignRole} className="flex flex-col gap-4">
                    {/* Linha dos Selects em Grid responsivo */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <label className="text-xs font-medium text-neutral-500 pl-1">Instituição</label>
                            <Select value={assignInstitutionId} onValueChange={setAssignInstitutionId}>
                                <SelectTrigger className="bg-white w-full"><SelectValue placeholder="Selecione..." /></SelectTrigger>
                                <SelectContent className="max-h-[200px]">
                                    {institutions.map(i => (
                                        <SelectItem key={i.id} value={String(i.id)}>{i.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-xs font-medium text-neutral-500 pl-1">Cargo</label>
                            <Select value={assignRoleId} onValueChange={setAssignRoleId}>
                                <SelectTrigger className="bg-white w-full"><SelectValue placeholder="Selecione..." /></SelectTrigger>
                                <SelectContent>
                                    {roles.map(r => (
                                        <SelectItem key={r.id} value={String(r.id)}>{r.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    
                    {/* Botão abaixo */}
                    <Button type="submit" disabled={!assignInstitutionId || !assignRoleId} className="bg-blue-600 hover:bg-blue-700 text-white shadow-sm w-full sm:w-auto self-end">
                        Adicionar
                    </Button>
                </form>
            </div>

          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedUserPermissions(null)}>Concluir</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ALERT DIALOG DE EXCLUSÃO */}
      <AlertDialog open={!!userToDelete} onOpenChange={(o) => !o && setUserToDelete(null)}>
        <AlertDialogContent>
            <AlertDialogHeader>
                <AlertDialogTitle>Excluir usuário?</AlertDialogTitle>
                <AlertDialogDescription>Esta ação é permanente e removerá todos os dados deste usuário do sistema.</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={handleDeleteUser} className="bg-red-600 hover:bg-red-700">Excluir Definitivamente</AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}