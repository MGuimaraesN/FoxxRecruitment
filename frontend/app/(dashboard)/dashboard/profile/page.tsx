"use client";

import { useState, useEffect, FormEvent } from 'react';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { 
  Mail, GraduationCap, CalendarIcon,
  Linkedin, Globe, Camera, Lock, Save, Loader2, 
  FileText, UploadCloud, Download, CheckCircle, BookOpen, Link as LinkIcon
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME;

export default function ProfilePage() {
  const { user, token, fetchUserProfile } = useAuth();

  // Estados do Formulário de Perfil
  const [profileData, setProfileData] = useState({
    bio: '',
    linkedinUrl: '',
    lattesUrl: '', // Usado para Lattes
    portfolioUrl: '',
    course: '', // Departamento / Área
    graduationYear: '',
    educationLevel: '', // Nova formação
    specialization: '', // Especialidade
  });

  // Estados de Senha
  const [passwordData, setPasswordData] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  
  // Estados de Carregamento
  const [isProfileLoading, setIsProfileLoading] = useState(false);
  const [isAvatarLoading, setIsAvatarLoading] = useState(false);
  const [isPasswordLoading, setIsPasswordLoading] = useState(false);
  
  // Estados de Currículo
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [isResumeLoading, setIsResumeLoading] = useState(false);

  useEffect(() => {
    document.title = `Perfil do Docente | ${ APP_NAME }`;
  }, []);
  
  useEffect(() => {
    if (user) {
      setProfileData({
        bio: user.bio || '',
        linkedinUrl: user.linkedinUrl || '',
        lattesUrl: user.lattesUrl || '',
        portfolioUrl: user.portfolioUrl || '',
        course: user.course || '',
        graduationYear: user.graduationYear?.toString() || '',
        educationLevel: user.educationLevel || '',
        specialization: user.specialization || '',
      });
    }
  }, [user]);

  // --- HANDLERS ---

  const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target;
    setProfileData((prev) => ({ ...prev, [id]: value }));
  };

  const handleSelectChange = (value: string, field: string) => {
    setProfileData((prev) => ({ ...prev, [field]: value }));
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
        toast.success('Perfil atualizado com sucesso!');
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

  const handleResumeUpload = async () => {
    if (!resumeFile || !token) return;
    setIsResumeLoading(true);
    
    const formData = new FormData();
    formData.append('resume', resumeFile);

    try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/profile/resume`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` },
            body: formData
        });

        if (res.ok) {
            toast.success('Currículo enviado com sucesso!');
            setResumeFile(null);
            fetchUserProfile();
        } else {
            const data = await res.json();
            toast.error(data.error || 'Erro ao enviar currículo.');
        }
    } catch(err) {
        toast.error('Erro de rede.');
    } finally {
        setIsResumeLoading(false);
    }
  };

  if (!user) return <div className="flex justify-center h-64 items-center"><Loader2 className="animate-spin text-blue-600"/></div>;

  return (
    <div className="container mx-auto pb-20 space-y-8 max-w-5xl">
      
      {/* 1. Header do Perfil */}
      <div className="relative bg-white p-8 rounded-2xl shadow-sm border border-neutral-200 overflow-hidden">
        {/* Background Decorativo */}
        <div className="absolute top-0 right-0 w-full h-32 bg-gradient-to-l from-blue-50 to-transparent pointer-events-none" />

        <div className="relative flex flex-col md:flex-row items-center gap-6 z-10">
            
            {/* Avatar */}
            <div className="relative group shrink-0">
                <div className="h-28 w-28 rounded-full border-4 border-white bg-neutral-100 overflow-hidden shadow-lg flex items-center justify-center ring-1 ring-neutral-200">
                    {user?.avatarUrl ? (
                        <img src={`${process.env.NEXT_PUBLIC_API_URL}${user?.avatarUrl}`} alt="Avatar" className="h-full w-full object-cover" />
                    ) : (
                        <span className="text-3xl font-bold text-neutral-400">{user.firstName[0]}{user.lastName[0]}</span>
                    )}
                    {isAvatarLoading && <div className="absolute inset-0 bg-black/50 flex items-center justify-center"><Loader2 className="text-white animate-spin"/></div>}
                </div>
                <label className="absolute bottom-0 right-0 bg-white p-2 rounded-full shadow-md cursor-pointer hover:bg-neutral-50 transition-colors border border-neutral-200 group-hover:border-blue-400 group-hover:text-blue-600">
                    <Camera className="h-4 w-4 text-neutral-600" />
                    <input type="file" className="hidden" accept="image/*" onChange={handleAvatarChange} disabled={isAvatarLoading} />
                </label>
            </div>

            {/* Informações Principais */}
            <div className="text-center md:text-left flex-1">
                <h1 className="text-2xl md:text-3xl font-bold text-neutral-900 leading-tight">
                    {user.firstName} {user.lastName}
                </h1>
                <div className="flex flex-col md:flex-row items-center gap-2 md:gap-4 mt-2 text-neutral-500 text-sm">
                    <div className="flex items-center">
                        <Mail className="h-4 w-4 mr-1.5" />
                        {user.email}
                    </div>
                    {/* Se tiver titulação e departamento, mostra aqui */}
                    {(profileData.educationLevel || profileData.course) && (
                         <>
                            <span className="hidden md:inline text-neutral-300">•</span>
                            <div className="flex items-center text-blue-600 font-medium">
                                <GraduationCap className="h-4 w-4 mr-1.5" />
                                {profileData.educationLevel && `${profileData.educationLevel} `}
                                {profileData.course && `em ${profileData.course}`}
                            </div>
                         </>
                    )}
                </div>
            </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* 2. Coluna Esquerda: Formulário Acadêmico */}
        <div className="lg:col-span-2 space-y-8">
            
            {/* Bloco: Dados Acadêmicos */}
            <form onSubmit={handleProfileSubmit} className="bg-white p-6 rounded-xl shadow-sm border border-neutral-200 space-y-6">
                <div className="flex items-center justify-between border-b border-neutral-100 pb-4">
                    <h2 className="text-lg font-bold text-neutral-900 flex items-center gap-2">
                        <GraduationCap className="h-5 w-5 text-blue-600" /> 
                        Dados Acadêmicos
                    </h2>
                </div>

                <div className="space-y-5">
                    
                    {/* Linha 1: Titulação e Ano */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div>
                            <label className="block text-sm font-medium text-neutral-700 mb-1">
                                Titulação Máxima
                            </label>
                            <Select 
                                value={profileData.educationLevel} 
                                onValueChange={(val) => handleSelectChange(val, 'educationLevel')}
                            >
                                <SelectTrigger className="bg-neutral-50">
                                    <SelectValue placeholder="Selecione sua formação" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Doutorado">Doutorado</SelectItem>
                                    <SelectItem value="Mestrado">Mestrado</SelectItem>
                                    <SelectItem value="Especialização">Especialização (Pós-graduação)</SelectItem>
                                    <SelectItem value="Graduação">Graduação</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div>
                            <label htmlFor="graduationYear" className="block text-sm font-medium text-neutral-700 mb-1">
                                Ano de Conclusão
                            </label>
                            <div className="relative">
                                <CalendarIcon className="absolute left-3 top-2.5 h-4 w-4 text-neutral-400" />
                                <Input 
                                    type="number" 
                                    id="graduationYear" 
                                    value={profileData.graduationYear} 
                                    onChange={handleProfileChange} 
                                    placeholder="Ex: 2023" 
                                    className="bg-neutral-50 pl-9" 
                                />
                            </div>
                        </div>
                    </div>

                    {/* Linha 2: Departamento e Especialização */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div>
                            <label htmlFor="course" className="block text-sm font-medium text-neutral-700 mb-1">
                                Departamento / Área
                            </label>
                            <Input 
                                id="course" 
                                value={profileData.course} 
                                onChange={handleProfileChange} 
                                placeholder="Ex: Ciência da Computação" 
                                className="bg-neutral-50" 
                            />
                        </div>
                         <div>
                            <label htmlFor="specialization" className="block text-sm font-medium text-neutral-700 mb-1">
                                Especialização (Opcional)
                            </label>
                            <Input 
                                id="specialization" 
                                value={profileData.specialization} 
                                onChange={handleProfileChange} 
                                placeholder="Ex: Inteligência Artificial" 
                                className="bg-neutral-50" 
                            />
                        </div>
                    </div>

                    <div>
                        <label htmlFor="bio" className="block text-sm font-medium text-neutral-700 mb-1">
                            Biografia & Linha de Pesquisa
                        </label>
                        <Textarea 
                            id="bio" 
                            value={profileData.bio} 
                            onChange={handleProfileChange} 
                            placeholder="Descreva brevemente sua trajetória acadêmica e interesses de pesquisa..." 
                            className="min-h-[120px] resize-none bg-neutral-50" 
                        />
                    </div>
                </div>

                <div className="pt-4 flex justify-end">
                    <Button type="submit" disabled={isProfileLoading} className="bg-blue-600 hover:bg-blue-700">
                        {isProfileLoading ? <Loader2 className="h-4 w-4 animate-spin"/> : <><Save className="h-4 w-4 mr-2"/> Salvar Alterações</>}
                    </Button>
                </div>
            </form>

            {/* Bloco: Documentação (Currículo) */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-neutral-200 space-y-6">
                <div className="border-b border-neutral-100 pb-4">
                    <h2 className="text-lg font-bold text-neutral-900 flex items-center gap-2">
                        <FileText className="h-5 w-5 text-orange-600" /> 
                        Documentação (CV/Portfólio)
                    </h2>
                </div>

                <div className="bg-neutral-50 rounded-lg p-5 border border-neutral-200">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                            <div className={`h-12 w-12 rounded-full flex items-center justify-center shrink-0 ${user.resumeUrl ? 'bg-green-100 text-green-600' : 'bg-neutral-200 text-neutral-400'}`}>
                                {user.resumeUrl ? <CheckCircle className="h-6 w-6" /> : <FileText className="h-6 w-6" />}
                            </div>
                            <div>
                                <p className="font-semibold text-neutral-900">
                                    {user.resumeUrl ? 'Documento PDF Anexado' : 'Nenhum documento enviado'}
                                </p>
                                <p className="text-xs text-neutral-500">
                                    {user.resumeUrl ? 'Disponível para download.' : 'Anexe seu Currículo em PDF para facilitar processos.'}
                                </p>
                            </div>
                        </div>

                        {user.resumeUrl && (
                             <Button variant="outline" size="sm" asChild className="shrink-0 gap-2">
                                <a href={`${process.env.NEXT_PUBLIC_API_URL}${user.resumeUrl}`} target="_blank" rel="noopener noreferrer">
                                    <Download className="h-4 w-4" /> Baixar
                                </a>
                             </Button>
                        )}
                    </div>

                    <div className="mt-6 pt-4 border-t border-neutral-200/50">
                        <label className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-2 block">
                            {user.resumeUrl ? 'Atualizar Arquivo' : 'Fazer Upload (PDF)'}
                        </label>
                        <div className="flex gap-2">
                            <Input 
                                type="file" 
                                accept="application/pdf" 
                                onChange={(e) => setResumeFile(e.target.files?.[0] || null)} 
                                className="bg-white text-sm file:text-blue-600 file:font-semibold cursor-pointer"
                            />
                            <Button 
                                onClick={handleResumeUpload} 
                                disabled={!resumeFile || isResumeLoading} 
                                className="bg-neutral-900 text-white shrink-0"
                            >
                                {isResumeLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <UploadCloud className="h-4 w-4" />}
                            </Button>
                        </div>
                    </div>
                </div>
            </div>

        </div>

        {/* 3. Coluna Direita: Links e Segurança */}
        <div className="space-y-8">
            
            {/* Redes Sociais / Acadêmicas */}
            <form onSubmit={handleProfileSubmit} className="bg-white p-6 rounded-xl shadow-sm border border-neutral-200 space-y-4">
                 <h3 className="text-sm font-bold text-neutral-900 uppercase tracking-wider mb-2 flex items-center gap-2">
                    <Globe className="h-4 w-4 text-blue-500" /> Links Acadêmicos
                </h3>
                
                <div className="space-y-3">
                    <div className="relative group">
                        <div className="absolute left-3 top-2.5 flex items-center justify-center h-5 w-5 rounded bg-[#0077b5]/10 text-[#0077b5]">
                            <Linkedin className="h-3.5 w-3.5" />
                        </div>
                        <Input className="pl-10 text-xs" id="linkedinUrl" value={profileData.linkedinUrl} onChange={handleProfileChange} placeholder="LinkedIn" />
                    </div>
                    
                    {/* Lattes (mapeado para lattesUrl no backend) */}
                    <div className="relative group">
                            <div className="absolute left-3 top-2.5 flex items-center justify-center h-5 w-5 rounded bg-blue-100 text-blue-800 border border-blue-200">
                            <BookOpen className="h-3.5 w-3.5" />
                        </div>
                        <Input 
                            className="pl-10 text-xs" 
                            id="lattesUrl" // Campo do DB é lattesUrl, mas visualmente é Lattes
                            value={profileData.lattesUrl} 
                            onChange={handleProfileChange} 
                            placeholder="Lattes" 
                        />
                    </div>

                    <div className="relative group">
                            <div className="absolute left-3 top-2.5 flex items-center justify-center h-5 w-5 rounded bg-emerald-600/10 text-emerald-600">
                            <LinkIcon className="h-3.5 w-3.5" />
                        </div>
                        <Input className="pl-10 text-xs" id="portfolioUrl" value={profileData.portfolioUrl} onChange={handleProfileChange} placeholder="Google Scholar / Site Pessoal" />
                    </div>
                </div>
                <div className="flex justify-end">
                     <Button size="sm" type="submit" variant="ghost" className="text-blue-600 hover:text-blue-700 h-8 text-xs">Salvar Links</Button>
                </div>
            </form>

            {/* Segurança */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-neutral-200">
                <h3 className="text-sm font-bold text-neutral-900 uppercase tracking-wider mb-4 flex items-center gap-2">
                    <Lock className="h-4 w-4 text-red-500" /> Segurança
                </h3>
                
                <form onSubmit={handlePasswordSubmit} className="space-y-3">
                    <Input type="password" placeholder="Senha Atual" id="oldPassword" value={passwordData.oldPassword} onChange={handlePasswordChange} required className="text-xs h-9 bg-neutral-50" />
                    <Input type="password" placeholder="Nova Senha" id="newPassword" value={passwordData.newPassword} onChange={handlePasswordChange} required className="text-xs h-9 bg-neutral-50"/>
                    <Input type="password" placeholder="Confirmar Nova Senha" id="confirmPassword" value={passwordData.confirmPassword} onChange={handlePasswordChange} required className="text-xs h-9 bg-neutral-50" />
                    
                    <Button type="submit" variant="outline" className="w-full text-xs h-9 border-neutral-300 hover:bg-neutral-50 mt-2" disabled={isPasswordLoading}>
                        {isPasswordLoading ? 'Alterando...' : 'Atualizar Senha'}
                    </Button>
                </form>
            </div>
        </div>

      </div>
    </div>
  );
}