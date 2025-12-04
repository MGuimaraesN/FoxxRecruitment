'use client';

import { useState, useEffect, FormEvent } from 'react';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Shield, Plus, Search, Pencil, Trash2 } from 'lucide-react';

interface Role { id: number; name: string; }
const API_URL = `${process.env.NEXT_PUBLIC_API_URL}/roles`;

export default function RolesPage() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [filtered, setFiltered] = useState<Role[]>([]);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Role | null>(null);
  const [toDelete, setToDelete] = useState<Role | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [name, setName] = useState('');
  const { token } = useAuth();

  useEffect(() => {
    const fetchData = async () => {
        if (!token) return;
        try {
            const res = await fetch(API_URL, { headers: { Authorization: `Bearer ${token}` } });
            if (res.ok) { const data = await res.json(); setRoles(data); setFiltered(data); }
        } catch { toast.error('Erro de rede.'); } finally { setIsLoading(false); }
    };
    fetchData();
  }, [token]);

  useEffect(() => { setFiltered(roles.filter(r => r.name.toLowerCase().includes(search.toLowerCase()))); }, [search, roles]);

  const handleSave = async (e: FormEvent) => {
    e.preventDefault(); if (!token) return;
    const url = selected ? `${API_URL}/${selected.id}` : API_URL;
    const method = selected ? 'PUT' : 'POST';
    try {
        const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ name }) });
        if (res.ok) { toast.success('Salvo!'); setIsModalOpen(false); const r = await fetch(API_URL, { headers: { Authorization: `Bearer ${token}` } }); setRoles(await r.json()); } else { toast.error('Erro.'); }
    } catch { toast.error('Rede.'); }
  };

  const handleDelete = async () => {
    if (!token || !toDelete) return;
    try {
        const res = await fetch(`${API_URL}/${toDelete.id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
        if (res.ok) { toast.success('Excluído!'); setToDelete(null); const r = await fetch(API_URL, { headers: { Authorization: `Bearer ${token}` } }); setRoles(await r.json()); } else { toast.error('Erro.'); }
    } catch { toast.error('Rede.'); }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div><h1 className="text-2xl font-bold text-neutral-900">Cargos</h1><p className="text-neutral-500 text-sm">Definição de permissões do sistema.</p></div>
        <Button onClick={() => { setSelected(null); setName(''); setIsModalOpen(true); }} className="bg-blue-600 hover:bg-blue-700"><Plus className="mr-2 h-4 w-4" /> Novo Cargo</Button>
      </div>
      <div className="flex items-center gap-2 bg-white p-2 rounded-lg border border-neutral-200 shadow-sm max-w-md">
        <Search className="h-4 w-4 text-neutral-400 ml-2" /><Input placeholder="Buscar..." className="border-none shadow-none focus-visible:ring-0 h-9" value={search} onChange={e => setSearch(e.target.value)} />
      </div>
      <div className="bg-white rounded-xl shadow-sm border border-neutral-200 overflow-hidden">
        <Table>
          <TableHeader className="bg-neutral-50"><TableRow><TableHead>Nome</TableHead><TableHead className="text-right">Ações</TableHead></TableRow></TableHeader>
          <TableBody>{isLoading ? <TableRow><TableCell colSpan={2} className="text-center py-8">Carregando...</TableCell></TableRow> : filtered.map(r => (
            <TableRow key={r.id} className="hover:bg-neutral-50/50">
              <TableCell className="font-medium flex items-center gap-3"><div className="h-8 w-8 rounded-full bg-orange-50 text-orange-600 flex items-center justify-center"><Shield className="h-4 w-4"/></div>{r.name}</TableCell>
              <TableCell className="text-right space-x-2">
                <Button variant="ghost" size="icon" onClick={() => { setSelected(r); setName(r.name); setIsModalOpen(true); }} className="h-8 w-8 text-neutral-500 hover:text-blue-600"><Pencil className="h-4 w-4" /></Button>
                <Button variant="ghost" size="icon" onClick={() => setToDelete(r)} className="h-8 w-8 text-neutral-500 hover:text-red-600"><Trash2 className="h-4 w-4" /></Button>
              </TableCell>
            </TableRow>
          ))}</TableBody>
        </Table>
      </div>
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}><DialogContent><DialogHeader><DialogTitle>{selected ? 'Editar' : 'Novo'} Cargo</DialogTitle></DialogHeader><form onSubmit={handleSave} className="py-4"><Input value={name} onChange={e => setName(e.target.value)} required /><DialogFooter className="mt-4"><Button type="submit">Salvar</Button></DialogFooter></form></DialogContent></Dialog>
      <AlertDialog open={!!toDelete} onOpenChange={o => !o && setToDelete(null)}><AlertDialogContent><DialogHeader><DialogTitle>Excluir?</DialogTitle></DialogHeader><DialogFooter><AlertDialogCancel>Cancelar</AlertDialogCancel><AlertDialogAction onClick={handleDelete} className="bg-red-600">Excluir</AlertDialogAction></DialogFooter></AlertDialogContent></AlertDialog>
    </div>
  );
}