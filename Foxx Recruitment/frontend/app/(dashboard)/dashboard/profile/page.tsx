"use client";

import { useState, useEffect, FormEvent } from 'react';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { 
  Mail, Building, GraduationCap, 
  Github, Linkedin, Globe, Camera, Lock, Save, Loader2, 
  ShieldCheck,
  CalendarIcon
} from 'lucide-react';

// Componente de Badge simples para o cargo
const RoleBadge = ({ role }: { role: string }) => {
    const colors: Record<string, string> = {
        superadmin: "bg-purple-100 text-purple-700 border-purple-200",
        admin: "bg-blue-100 text-blue-700 border-blue-200",
        professor: "bg-emerald-100 text-emerald-700 border-emerald-200",
        coordenador: "bg-amber-100 text-amber-700 border-amber-200",
        empresa: "bg-indigo-100 text-indigo-700 border-indigo-200",
    };
    const style = colors[role] || "bg-neutral-100 text-neutral-700 border-neutral-200";

    return (
        <span className={`inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-xs font-medium border capitalize ${style}`}>
            <ShieldCheck className="h-3 w-3" />
            {role}
        </span>
    );
};

const initialProfileState = {
  bio: '',
  linkedinUrl: '',
  githubUrl: '',
  portfolioUrl: '',
  course: '',
  graduationYear: '',
};

export default function ProfilePage() {
  const { user, token, fetchUserProfile } = useAuth();

  const [profileData, setProfileData] = useState(initialProfileState);
  const [isProfileLoading, setIsProfileLoading] = useState(false);
  const [isAvatarLoading, setIsAvatarLoading] = useState(false);

  const [passwordData, setPasswordData] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [isPasswordLoading, setIsPasswordLoading] = useState(false);

  useEffect(() => {
    document.title = 'Meu Perfil | Decola Vagas';
  }, []);
  
  useEffect(() => {
    if (user) {
      setProfileData({
        bio: user.bio || '',
        linkedinUrl: user.linkedinUrl || '',
        githubUrl: user.githubUrl || '',
        portfolioUrl: user.portfolioUrl || '',
        course: user.course || '',
        graduationYear: user.graduationYear?.toString() || '',
      });
    }
  }, [user]);

  const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target;
    setProfileData((prev) => ({ ...prev, [id]: value }));
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setPasswordData((prev) => ({ ...prev, [id]: value }));
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.[0] || !token) return;

    setIsAvatarLoading(true);
    const formData = new FormData();
    formData.append('avatar', e.target.files[0]);

    try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/profile/avatar`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` },
            body: formData
        });

        if (res.ok) {
            toast.success('Foto atualizada!');
            fetchUserProfile();
        } else {
            toast.error('Erro ao atualizar foto.');
        }
    } catch (err) {
        toast.error('Erro de rede.');
    } finally {
        setIsAvatarLoading(false);
    }
  };

  const handleProfileSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setIsProfileLoading(true);

    const body = {
      ...profileData,
      graduationYear: profileData.graduationYear ? parseInt(profileData.graduationYear, 10) : null,
    };

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/profile`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        toast.success('Perfil salvo!');
        fetchUserProfile();
      } else {
        const data = await res.json();
        toast.error(data.error || 'Erro ao salvar.');
      }
    } catch (err) {
      toast.error('Erro de rede.');
    } finally {
      setIsProfileLoading(false);
    }
  };

  const handlePasswordSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('As senhas não coincidem.');
      return;
    }
    if (!token) return;
    setIsPasswordLoading(true);

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/change-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ oldPassword: passwordData.oldPassword, newPassword: passwordData.newPassword }),
      });

      const data = await res.json();
      if (res.ok) {
        toast.success('Senha alterada!');
        setPasswordData({ oldPassword: '', newPassword: '', confirmPassword: '' });
      } else {
        toast.error(data.error || 'Erro ao alterar senha.');
      }
    } catch (err) {
      toast.error('Erro de rede.');
    } finally {
        setIsPasswordLoading(false);
    }
  };

  if (!user) return <div className="flex justify-center h-64 items-center"><Loader2 className="animate-spin text-blue-600"/></div>;

  const activeInst = user.institutions.find((i: any) => i.institutionId === user.activeInstitutionId);
  const institutionName = activeInst ? activeInst.institution.name : 'Sem vínculo ativo';
  const roleName = activeInst ? activeInst.role.name : '';

  return (
    <div className="container mx-auto pb-20 space-y-8">
      
      {/* 1. Header do Perfil (Novo Design Clean) */}
      <div className="relative bg-white p-8 rounded-xl shadow-sm border border-neutral-200 overflow-hidden">
        
        {/* Elemento decorativo de fundo (Luz suave) */}
        <div className="absolute top-0 right-0 -mt-16 -mr-16 h-64 w-64 rounded-full bg-blue-500/10 blur-3xl pointer-events-none" aria-hidden="true"></div>

        <div className="relative flex flex-col md:flex-row items-center md:items-start gap-8 z-10">
            
            {/* Avatar */}
            <div className="relative group shrink-0">
                <div className="h-32 w-32 rounded-full border-[3px] border-white bg-neutral-100 overflow-hidden shadow-md flex items-center justify-center ring-1 ring-neutral-200/50">
                    {user?.avatarUrl ? (
                        <img src={`${process.env.NEXT_PUBLIC_API_URL}${user?.avatarUrl}`} alt="Avatar" className="h-full w-full object-cover" />
                    ) : (
                        <span className="text-4xl font-bold text-neutral-400">{user.firstName[0]}{user.lastName[0]}</span>
                    )}
                    {isAvatarLoading && <div className="absolute inset-0 bg-black/50 flex items-center justify-center"><Loader2 className="text-white animate-spin"/></div>}
                </div>
                <label className="absolute bottom-1 right-1 bg-white p-2 rounded-full shadow-md cursor-pointer hover:bg-neutral-50 transition-colors border border-neutral-200 group-hover:border-blue-200">
                    <Camera className="h-4 w-4 text-neutral-600 group-hover:text-blue-600 transition-colors" />
                    <input type="file" className="hidden" accept="image/*" onChange={handleAvatarChange} disabled={isAvatarLoading} />
                </label>
            </div>

            {/* Informações Básicas (Read-Only) */}
            <div className="flex-1 pt-2 space-y-3 text-center md:text-left">
                <div>
                    {roleName && <div className="mb-2 flex justify-center md:justify-start"><RoleBadge role={roleName} /></div>}
                    <h1 className="text-3xl font-bold text-neutral-900 leading-tight">{user.firstName} {user.lastName}</h1>
                </div>

                <div className="flex flex-col gap-2 items-center md:items-start">
                    <div className="flex items-center text-sm font-medium text-neutral-700">
                        <Building className="h-4 w-4 mr-2 text-blue-600" />
                        {institutionName}
                    </div>

                    <div className="flex items-center text-sm text-neutral-500">
                        <Mail className="h-4 w-4 mr-2 text-neutral-400" />
                        <span>{user.email}</span>
                    </div>
                </div>
            </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* 2. Coluna Esquerda: Dados Acadêmicos & Redes */}
        <div className="space-y-8 lg:col-span-2">
            <form onSubmit={handleProfileSubmit} className="bg-white p-6 rounded-xl shadow-sm border border-neutral-200 space-y-8">
                <div className="flex items-center justify-between border-b border-neutral-100 pb-5">
                    <div>
                        <h2 className="text-lg font-bold text-neutral-900">Informações do Perfil</h2>
                        <p className="text-sm text-neutral-500">Mantenha seus dados acadêmicos e profissionais atualizados.</p>
                    </div>
                    <Button type="submit" disabled={isProfileLoading} className="bg-blue-600 hover:bg-blue-700 shadow-sm">
                        {isProfileLoading ? <Loader2 className="h-4 w-4 animate-spin"/> : <><Save className="h-4 w-4 mr-2"/> Salvar Alterações</>}
                    </Button>
                </div>

                <div className="space-y-6">
                    <div>
                        <label htmlFor="bio" className="block text-sm font-medium text-neutral-700 mb-1">Biografia / Resumo Profissional</label>
                        <Textarea id="bio" value={profileData.bio} onChange={handleProfileChange} placeholder="Conte um pouco sobre sua trajetória, interesses e objetivos..." className="min-h-[120px] resize-none bg-neutral-50/50 border-neutral-200 focus-visible:ring-blue-500" />
                        <p className="text-xs text-neutral-500 mt-1 text-right">{profileData.bio.length}/500 caracteres</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label htmlFor="course" className="block text-sm font-medium text-neutral-700 mb-1 flex items-center gap-2">
                                <GraduationCap className="h-4 w-4 text-blue-600"/> Curso Atual
                            </label>
                            <Input id="course" value={profileData.course} onChange={handleProfileChange} placeholder="Ex: Engenharia de Software" className="bg-neutral-50/50 border-neutral-200 focus-visible:ring-blue-500" />
                        </div>
                        <div>
                            <label htmlFor="graduationYear" className="block text-sm font-medium text-neutral-700 mb-1 flex items-center gap-2">
                                <CalendarIcon className="h-4 w-4 text-blue-600"/> Ano de Formatura Previsto
                            </label>
                            <Input type="number" id="graduationYear" value={profileData.graduationYear} onChange={handleProfileChange} placeholder="Ex: 2026" className="bg-neutral-50/50 border-neutral-200 focus-visible:ring-blue-500" />
                        </div>
                    </div>
                </div>

                <div className="pt-6 border-t border-neutral-100 space-y-5">
                    <h3 className="text-sm font-semibold text-neutral-900 flex items-center gap-2">
                        <Globe className="h-4 w-4 text-blue-600" /> Presença Online & Portfólio
                    </h3>
                    <div className="grid grid-cols-1 gap-4">
                        <div className="relative group">
                            <div className="absolute left-3 top-2.5 flex items-center justify-center h-5 w-5 rounded bg-[#0077b5]/10 text-[#0077b5] transition-colors group-focus-within:bg-[#0077b5] group-focus-within:text-white">
                                <Linkedin className="h-3.5 w-3.5" />
                            </div>
                            <Input className="pl-10 bg-neutral-50/50 border-neutral-200 focus-visible:ring-blue-500" id="linkedinUrl" value={profileData.linkedinUrl} onChange={handleProfileChange} placeholder="URL do LinkedIn" />
                        </div>
                        <div className="relative group">
                             <div className="absolute left-3 top-2.5 flex items-center justify-center h-5 w-5 rounded bg-[#333]/10 text-[#333] transition-colors group-focus-within:bg-[#333] group-focus-within:text-white">
                                <Github className="h-3.5 w-3.5" />
                            </div>
                            <Input className="pl-10 bg-neutral-50/50 border-neutral-200 focus-visible:ring-blue-500" id="githubUrl" value={profileData.githubUrl} onChange={handleProfileChange} placeholder="URL do GitHub" />
                        </div>
                        <div className="relative group">
                             <div className="absolute left-3 top-2.5 flex items-center justify-center h-5 w-5 rounded bg-emerald-600/10 text-emerald-600 transition-colors group-focus-within:bg-emerald-600 group-focus-within:text-white">
                                <Globe className="h-3.5 w-3.5" />
                            </div>
                            <Input className="pl-10 bg-neutral-50/50 border-neutral-200 focus-visible:ring-blue-500" id="portfolioUrl" value={profileData.portfolioUrl} onChange={handleProfileChange} placeholder="URL do Portfólio / Site Pessoal" />
                        </div>
                    </div>
                </div>
            </form>
        </div>

        {/* 3. Coluna Direita: Segurança */}
        <div className="space-y-8">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-neutral-200">
                <div className="flex items-center gap-3 mb-4">
                    <div className="h-10 w-10 rounded-full bg-red-50 flex items-center justify-center">
                        <Lock className="h-5 w-5 text-red-600" />
                    </div>
                    <div>
                        <h2 className="text-lg font-bold text-neutral-900">Segurança</h2>
                        <p className="text-xs text-neutral-500">Acesso e credenciais.</p>
                    </div>
                </div>
                
                <p className="text-sm text-neutral-600 mb-6 leading-relaxed">
                    Recomendamos usar uma senha forte e única para proteger sua conta.
                </p>
                
                <form onSubmit={handlePasswordSubmit} className="space-y-4">
                    <div>
                        <label className="block text-xs font-medium text-neutral-700 mb-1">Senha Atual</label>
                        <Input type="password" id="oldPassword" value={passwordData.oldPassword} onChange={handlePasswordChange} required className="bg-neutral-50/50" />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-neutral-700 mb-1">Nova Senha</label>
                        <Input type="password" id="newPassword" value={passwordData.newPassword} onChange={handlePasswordChange} required className="bg-neutral-50/50"/>
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-neutral-700 mb-1">Confirmar Nova Senha</label>
                        <Input type="password" id="confirmPassword" value={passwordData.confirmPassword} onChange={handlePasswordChange} required className="bg-neutral-50/50" />
                    </div>
                    <Button type="submit" variant="outline" className="w-full border-neutral-300 text-neutral-700 hover:bg-neutral-50 hover:text-neutral-900 mt-2" disabled={isPasswordLoading}>
                        {isPasswordLoading ? 'Alterando...' : 'Atualizar Senha'}
                    </Button>
                </form>
            </div>
        </div>

      </div>
    </div>
  );
}