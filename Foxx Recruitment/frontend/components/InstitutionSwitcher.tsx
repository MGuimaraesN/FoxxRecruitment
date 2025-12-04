"use client";

import { useAuth } from '@/context/AuthContext';
import { ChangeEvent } from 'react';
import { ChevronsUpDown, Building2 } from 'lucide-react';

const InstitutionSwitcher = () => {
  const { user, activeInstitutionId, login } = useAuth();

  const handleSwitch = async (e: ChangeEvent<HTMLSelectElement>) => {
    const newInstitutionId = parseInt(e.target.value, 10);
    const token = localStorage.getItem('access_token');

    if (!token || isNaN(newInstitutionId)) return;

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/switch-institution`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
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

  return (
    <div className="relative group">
      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
        <Building2 className="h-4 w-4 text-neutral-500 group-hover:text-blue-600 transition-colors" />
      </div>
      <select
        value={activeInstitutionId || ''}
        onChange={handleSwitch}
        className="block w-full min-w-[240px] max-w-[300px] appearance-none rounded-lg border border-neutral-200 bg-neutral-50 py-2.5 pl-10 pr-10 text-sm font-medium text-neutral-700 shadow-sm hover:border-blue-300 focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-500/10 transition-all cursor-pointer truncate"
      >
        {user.institutions.map((inst: any) => {
            // --- LÓGICA DE EXIBIÇÃO MELHORADA ---
            let label = `${inst.institution.name}`;
            
            if (inst.role.name === 'superadmin') {
                label = 'Super Administrador (Global)';
            } else if (inst.role.name === 'admin') {
                // Se for admin, mostra o cargo + nome da instituição para saber onde está logado
                label = `Admin - ${inst.institution.name}`;
            } else {
                // Para outros, mantém o padrão ou personaliza
                label = `${inst.institution.name} (${inst.role.name})`;
            }
            // -------------------------------------

            return (
              <option key={inst.institutionId} value={inst.institutionId}>
                {label}
              </option>
            );
        })}
      </select>
      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-neutral-500">
        <ChevronsUpDown className="h-4 w-4 opacity-50" />
      </div>
    </div>
  );
};

export default InstitutionSwitcher;