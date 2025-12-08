"use client";

import { useAuth } from '@/context/AuthContext';
import { ChangeEvent, useEffect, useState } from 'react';
import { ChevronsUpDown, Building2 } from 'lucide-react';

const InstitutionSwitcher = () => {
  const { user, activeInstitutionId, login, token, leaveInstitution } = useAuth();
  const [allInstitutions, setAllInstitutions] = useState<{ id: number, name: string }[]>([]);
  
  // Verifica se é Super Admin global
  const isSuperAdmin = user?.institutions?.some((i: any) => i.role.name === 'superadmin');

  // Se for super admin, carrega todas as instituições
  useEffect(() => {
    const fetchAllInstitutions = async () => {
        if (isSuperAdmin && token) {
            try {
                const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/institutions?type=university`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                const companiesRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/institutions?type=company`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });

                if (res.ok && companiesRes.ok) {
                    const unis = await res.json();
                    const comps = await companiesRes.json();
                    // Ordena tudo alfabeticamente
                    setAllInstitutions([...unis, ...comps].sort((a: any, b: any) => a.name.localeCompare(b.name)));
                }
            } catch (error) {
                console.error("Erro ao carregar todas as instituições para Super Admin", error);
            }
        }
    };

    fetchAllInstitutions();
  }, [isSuperAdmin, token]);

  const handleSwitch = async (e: ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;

    // --- LÓGICA PARA DESVINCULAR (SAIR DO CONTEXTO) ---
    if (value === 'leave') {
        if (leaveInstitution) {
            await leaveInstitution();
        }
        return;
    }
    // --------------------------------------------------

    const newInstitutionId = parseInt(value, 10);
    const currentToken = localStorage.getItem('access_token');

    if (!currentToken || isNaN(newInstitutionId)) return;

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/switch-institution`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${currentToken}`,
        },
        body: JSON.stringify({ institutionId: newInstitutionId }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.access_token) {
          login(data.access_token);
        }
      }
    } catch (error) {
      console.error('Error switching institution:', error);
    }
  };

  if (!user || !user.institutions) return null;

  // Se for Super Admin, usa a lista completa. Se não, usa os vínculos do usuário.
  const options = isSuperAdmin 
      ? allInstitutions.map(inst => ({ 
          id: inst.id, 
          label: inst.name 
      })) 
      : user.institutions.map((inst: any) => {
            let label = `${inst.institution.name}`;
            if (inst.role.name === 'superadmin') {
                label = 'Super Administrador (Global)';
            } else if (inst.role.name === 'admin') {
                label = `Admin - ${inst.institution.name}`;
            } else {
                label = `${inst.institution.name} (${inst.role.name})`;
            }
            return { id: inst.institutionId, label };
      });

  return (
    <div className="relative group">
      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
        <Building2 className="h-4 w-4 text-neutral-500 group-hover:text-blue-600 transition-colors" />
      </div>
      <select
        value={activeInstitutionId || 'leave'}
        onChange={handleSwitch}
        className="block w-full min-w-[240px] max-w-[300px] appearance-none rounded-lg border border-neutral-200 bg-neutral-50 py-2.5 pl-10 pr-10 text-sm font-medium text-neutral-700 shadow-sm hover:border-blue-300 focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-500/10 transition-all cursor-pointer truncate"
      >
        {/* --- OPÇÃO PARA DESVINCULAR --- */}
        <option value="leave" className="text-neutral-500 font-semibold">
            Global (Sair da Instituição)
        </option>
        <hr />
        {/* ------------------------------ */}

        {options.map((opt) => (
          <option key={opt.id} value={opt.id}>
            {opt.label}
          </option>
        ))}
      </select>
      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-neutral-500">
        <ChevronsUpDown className="h-4 w-4 opacity-50" />
      </div>
    </div>
  );
};

export default InstitutionSwitcher;