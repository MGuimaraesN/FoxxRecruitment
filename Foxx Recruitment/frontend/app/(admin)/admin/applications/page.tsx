'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Table, TableHeader, TableBody, TableRow, TableHead, TableCell,
} from '@/components/ui/table';
import { 
  FileText, CheckCircle, XCircle, Search, 
  Loader2, User, Eye, Filter 
} from 'lucide-react';

interface Application {
  id: number;
  status: 'PENDING' | 'REVIEWING' | 'ACCEPTED' | 'REJECTED';
  createdAt: string;
  resumeUrl: string | null;
  user: {
    firstName: string;
    lastName: string;
    email: string;
    avatarUrl: string | null;
    resumeUrl: string | null;
    course: string | null;
  };
  job: {
    title: string;
    institution: { name: string };
  };
}

const API_URL = `${process.env.NEXT_PUBLIC_API_URL}/applications/manage`;

export default function AdminApplicationsPage() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [filtered, setFiltered] = useState<Application[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [isLoading, setIsLoading] = useState(true);
  const { token } = useAuth();

  const fetchApplications = async () => {
    if (!token) return;
    setIsLoading(true);
    try {
      const res = await fetch(`${API_URL}/all`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setApplications(data);
        setFiltered(data);
      }
    } catch (error) {
      toast.error('Erro ao buscar candidaturas.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    document.title = 'Admin: Candidaturas | Decola Vagas';
    fetchApplications();
  }, [token]);

  // Filtragem local
  useEffect(() => {
    let result = applications;

    if (search) {
      const lower = search.toLowerCase();
      result = result.filter(app => 
        app.user.firstName.toLowerCase().includes(lower) ||
        app.user.lastName.toLowerCase().includes(lower) ||
        app.job.title.toLowerCase().includes(lower)
      );
    }

    if (statusFilter !== 'ALL') {
      result = result.filter(app => app.status === statusFilter);
    }

    setFiltered(result);
  }, [search, statusFilter, applications]);

  const handleStatusChange = async (id: number, newStatus: string) => {
    try {
      const res = await fetch(`${API_URL}/${id}/status`, {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({ status: newStatus })
      });

      if (res.ok) {
        toast.success(`Status atualizado para ${newStatus}`);
        // Atualização otimista
        setApplications(prev => prev.map(app => 
          app.id === id ? { ...app, status: newStatus as any } : app
        ));
      } else {
        toast.error('Erro ao atualizar status.');
      }
    } catch (error) {
      toast.error('Erro de rede.');
    }
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      PENDING: "bg-yellow-50 text-yellow-700 border-yellow-200",
      REVIEWING: "bg-blue-50 text-blue-700 border-blue-200",
      ACCEPTED: "bg-green-50 text-green-700 border-green-200",
      REJECTED: "bg-red-50 text-red-700 border-red-200"
    };
    const labels = {
      PENDING: "Pendente", REVIEWING: "Em Análise", ACCEPTED: "Aprovado", REJECTED: "Rejeitado"
    };
    return (
      <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium border ${styles[status as keyof typeof styles] || styles.PENDING}`}>
        {labels[status as keyof typeof labels] || status}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Candidaturas</h1>
          <p className="text-neutral-500 text-sm">Gerencie todas as aplicações recebidas.</p>
        </div>
      </div>

      {/* --- BARRA DE FILTROS PADRONIZADA --- */}
      <div className="bg-white p-4 rounded-lg border border-neutral-200 shadow-sm mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          
          {/* Busca (Input Composto) */}
          <div className="flex items-center gap-2 flex-1 border border-neutral-200 rounded-md px-3 bg-neutral-50 focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:border-blue-500 transition-all">
            <Search className="h-4 w-4 text-neutral-400 shrink-0" />
            <Input 
                placeholder="Buscar por candidato ou vaga..." 
                className="border-none shadow-none focus-visible:ring-0 h-9 bg-transparent w-full text-sm placeholder:text-neutral-400"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {/* Select Status */}
          <div className="w-full md:w-[200px]">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="bg-white border-neutral-200 h-9 md:h-full">
                <div className="flex items-center gap-2 text-neutral-600">
                    <Filter className="h-3.5 w-3.5 text-neutral-400" />
                    <SelectValue placeholder="Status" />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Todos os Status</SelectItem>
                <SelectItem value="PENDING">Pendente</SelectItem>
                <SelectItem value="REVIEWING">Em Análise</SelectItem>
                <SelectItem value="ACCEPTED">Aprovado</SelectItem>
                <SelectItem value="REJECTED">Rejeitado</SelectItem>
              </SelectContent>
            </Select>
          </div>

        </div>
      </div>

      {/* Tabela */}
      <div className="bg-white rounded-xl shadow-sm border border-neutral-200 overflow-hidden">
        <Table>
          <TableHeader className="bg-neutral-50">
            <TableRow>
              <TableHead>Candidato</TableHead>
              <TableHead>Vaga / Instituição</TableHead>
              <TableHead>Data</TableHead>
              <TableHead>CV</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={6} className="text-center py-8"><Loader2 className="h-6 w-6 animate-spin mx-auto text-blue-600"/></TableCell></TableRow>
            ) : filtered.length > 0 ? (
              filtered.map((app) => (
                <TableRow key={app.id} className="hover:bg-neutral-50/50">
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-full bg-neutral-100 flex items-center justify-center overflow-hidden border border-neutral-200">
                        {app.user.avatarUrl ? (
                           <img src={`${process.env.NEXT_PUBLIC_API_URL}${app.user.avatarUrl}`} alt="Avatar" className="h-full w-full object-cover" />
                        ) : (
                           <User className="h-4 w-4 text-neutral-400" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-neutral-900">{app.user.firstName} {app.user.lastName}</p>
                        <p className="text-xs text-neutral-500">{app.user.course || 'Sem curso'}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <p className="font-medium text-neutral-900 text-sm">{app.job.title}</p>
                    <p className="text-xs text-neutral-500">{app.job.institution.name}</p>
                  </TableCell>
                  <TableCell className="text-xs text-neutral-500">
                    {new Date(app.createdAt).toLocaleDateString()}
                  </TableCell>
                  
                  {/* CV com fallback */}
                  <TableCell>
                    {(app.resumeUrl || app.user.resumeUrl) ? (
                      <Button variant="outline" size="sm" asChild className="h-7 text-xs border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100">
                        <a href={`${process.env.NEXT_PUBLIC_API_URL}${app.resumeUrl || app.user.resumeUrl}`} target="_blank" rel="noopener noreferrer">
                          <FileText className="h-3 w-3 mr-1" /> PDF
                        </a>
                      </Button>
                    ) : <span className="text-neutral-400 text-xs">-</span>}
                  </TableCell>

                  <TableCell>{getStatusBadge(app.status)}</TableCell>
                  
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      {/* Botão Ver Detalhes */}
                      <Button size="icon" variant="ghost" asChild className="h-8 w-8 text-neutral-500 hover:text-blue-600" title="Ver Detalhes">
                        <Link href={`/admin/applications/${app.id}`}>
                            <Eye className="h-4 w-4" />
                        </Link>
                      </Button>

                      <Button 
                        size="icon" variant="ghost" 
                        className="h-8 w-8 text-green-600 hover:bg-green-50"
                        title="Aprovar"
                        onClick={() => handleStatusChange(app.id, 'ACCEPTED')}
                      >
                        <CheckCircle className="h-4 w-4" />
                      </Button>
                      <Button 
                        size="icon" variant="ghost" 
                        className="h-8 w-8 text-red-600 hover:bg-red-50"
                        title="Rejeitar"
                        onClick={() => handleStatusChange(app.id, 'REJECTED')}
                      >
                        <XCircle className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow><TableCell colSpan={6} className="text-center py-10 text-neutral-500">Nenhuma candidatura encontrada.</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}