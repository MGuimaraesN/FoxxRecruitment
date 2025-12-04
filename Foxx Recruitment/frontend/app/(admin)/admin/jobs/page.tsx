'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table, TableHeader, TableBody, TableRow, TableHead, TableCell,
} from '@/components/ui/table';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Briefcase, Plus, Search, Pencil, Trash2 } from 'lucide-react';
import Link from 'next/link';

interface Job {
  id: number;
  title: string;
  status: string;
  institution: { name: string };
  author: { firstName: string; lastName: string };
  createdAt: string;
}

const API_URL = `${process.env.NEXT_PUBLIC_API_URL}/admin/jobs`;

export default function AdminJobsPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [filteredJobs, setFilteredJobs] = useState<Job[]>([]);
  const [search, setSearch] = useState('');
  const [jobToDelete, setJobToDelete] = useState<Job | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const { token } = useAuth();
  const router = useRouter();

  useEffect(() => {
    document.title = 'Admin: Vagas | Decola Vagas';
    const fetchData = async () => {
      if (!token) return;
      setIsLoading(true);
      try {
        const res = await fetch(API_URL, { headers: { Authorization: `Bearer ${token}` } });
        if (res.ok) {
          const data = await res.json();
          setJobs(data);
          setFilteredJobs(data);
        }
      } catch (error) { toast.error('Erro de rede.'); } 
      finally { setIsLoading(false); }
    };
    fetchData();
  }, [token]);

  useEffect(() => {
    const lower = search.toLowerCase();
    setFilteredJobs(jobs.filter(j => j.title.toLowerCase().includes(lower) || j.institution.name.toLowerCase().includes(lower)));
  }, [search, jobs]);

  const handleDelete = async () => {
    if (!token || !jobToDelete) return;
    try {
      const res = await fetch(`${API_URL}/${jobToDelete.id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
      if (res.ok || res.status === 204) {
        toast.success('Vaga excluída!');
        setJobs(jobs.filter(j => j.id !== jobToDelete.id));
        setJobToDelete(null);
      } else { toast.error('Erro ao excluir.'); }
    } catch (error) { toast.error('Erro de rede.'); }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
            <h1 className="text-2xl font-bold text-neutral-900">Gerenciar Vagas</h1>
            <p className="text-neutral-500 text-sm">Controle todas as vagas publicadas no sistema.</p>
        </div>
        <Button asChild className="bg-blue-600 hover:bg-blue-700">
          <Link href="/admin/jobs/new"><Plus className="mr-2 h-4 w-4" /> Criar Vaga</Link>
        </Button>
      </div>

      <div className="flex items-center gap-2 bg-white p-2 rounded-lg border border-neutral-200 shadow-sm max-w-md">
        <Search className="h-4 w-4 text-neutral-400 ml-2" />
        <Input 
            placeholder="Buscar por título ou instituição..." 
            className="border-none shadow-none focus-visible:ring-0 h-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-neutral-200 overflow-hidden">
        <Table>
          <TableHeader className="bg-neutral-50">
            <TableRow>
              <TableHead>Título</TableHead>
              <TableHead>Instituição</TableHead>
              <TableHead>Autor</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
                <TableRow><TableCell colSpan={5} className="text-center py-8">Carregando...</TableCell></TableRow>
            ) : filteredJobs.length > 0 ? (
                filteredJobs.map((job) => (
                <TableRow key={job.id} className="hover:bg-neutral-50/50">
                    <TableCell className="font-medium text-neutral-900">{job.title}</TableCell>
                    <TableCell className="text-neutral-500">{job.institution.name}</TableCell>
                    <TableCell className="text-neutral-500">{job.author.firstName} {job.author.lastName}</TableCell>
                    <TableCell>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            job.status === 'published' || job.status === 'open' 
                            ? 'bg-green-100 text-green-800' 
                            : job.status === 'closed' 
                                ? 'bg-neutral-100 text-neutral-800'
                                : 'bg-amber-100 text-amber-800'
                        }`}>
                            {job.status === 'rascunho' ? 'Rascunho' : (job.status === 'published' ? 'Publicado' : 'Fechado')}
                        </span>
                    </TableCell>
                    <TableCell className="text-right space-x-2">
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-neutral-500 hover:text-blue-600" onClick={() => router.push(`/admin/jobs/edit/${job.id}`)}>
                            <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-neutral-500 hover:text-red-600" onClick={() => setJobToDelete(job)}>
                            <Trash2 className="h-4 w-4" />
                        </Button>
                    </TableCell>
                </TableRow>
                ))
            ) : (
                <TableRow><TableCell colSpan={5} className="text-center py-8 text-neutral-500">Nenhuma vaga encontrada.</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <AlertDialog open={!!jobToDelete} onOpenChange={(o) => !o && setJobToDelete(null)}>
        <AlertDialogContent>
            <AlertDialogHeader>
                <AlertDialogTitle>Excluir vaga?</AlertDialogTitle>
                <AlertDialogDescription>Isso excluirá permanentemente a vaga "{jobToDelete?.title}".</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">Excluir</AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}