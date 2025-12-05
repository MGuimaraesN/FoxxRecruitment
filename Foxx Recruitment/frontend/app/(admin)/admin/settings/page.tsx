"use client";

import { useState, useEffect, FormEvent } from 'react';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
    Building, Save, Loader2, Upload, Palette, 
    Image as ImageIcon, LayoutTemplate 
} from 'lucide-react';

const API_URL = `${process.env.NEXT_PUBLIC_API_URL}`;

export default function SettingsPage() {
    const { token, user, activeInstitutionId, fetchUserProfile } = useAuth();
    
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    
    const [institutionName, setInstitutionName] = useState('');
    const [primaryColor, setPrimaryColor] = useState('#2563eb');
    const [currentLogoUrl, setCurrentLogoUrl] = useState<string | null>(null);
    const [logoFile, setLogoFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);

    useEffect(() => {
        document.title = 'Configurações | FoxxRecruitment';
        
        const fetchInstitution = async () => {
            if (!token || !activeInstitutionId) return;
            try {
                const res = await fetch(`${API_URL}/institutions/${activeInstitutionId}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                if (res.ok) {
                    const data = await res.json();
                    setInstitutionName(data.name);
                    if (data.primaryColor) setPrimaryColor(data.primaryColor);
                    if (data.logoUrl) setCurrentLogoUrl(data.logoUrl);
                }
            } catch (error) {
                toast.error('Erro ao carregar configurações.');
            } finally {
                setIsLoading(false);
            }
        };
        fetchInstitution();
    }, [token, activeInstitutionId]);

    const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setLogoFile(file);
            const objectUrl = URL.createObjectURL(file);
            setPreviewUrl(objectUrl);
        }
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        if (!token || !activeInstitutionId) return;
        
        setIsSaving(true);
        try {
            const formData = new FormData();
            formData.append('name', institutionName);
            formData.append('primaryColor', primaryColor);
            if (logoFile) {
                formData.append('logo', logoFile);
            }

            const res = await fetch(`${API_URL}/institutions/${activeInstitutionId}`, {
                method: 'PUT',
                headers: { Authorization: `Bearer ${token}` },
                body: formData
            });

            if (res.ok) {
                toast.success('Configurações salvas com sucesso!');
                // Atualiza perfil para refletir mudanças globais se necessário
                fetchUserProfile();
                // Atualiza logo atual se houve upload
                if (logoFile) {
                    const data = await res.json();
                    setCurrentLogoUrl(data.logoUrl);
                    setPreviewUrl(null);
                    setLogoFile(null);
                }
            } else {
                toast.error('Erro ao salvar configurações.');
            }
        } catch (error) {
            toast.error('Erro de rede.');
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) return <div className="flex h-96 items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-blue-600"/></div>;

    if (!activeInstitutionId) return <div className="p-8 text-center text-neutral-500">Selecione uma instituição para configurar.</div>;

    return (
        <div className="max-w-4xl mx-auto space-y-8 pb-20">
            <div>
                <h1 className="text-2xl font-bold text-neutral-900 tracking-tight">Configurações da Instituição</h1>
                <p className="text-sm text-neutral-500 mt-1">Personalize a identidade visual do seu portal de vagas.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                
                {/* Coluna Esquerda: Formulário */}
                <div className="lg:col-span-2 space-y-6">
                    <form onSubmit={handleSubmit} className="bg-white p-6 rounded-xl shadow-sm border border-neutral-200 space-y-6">
                        
                        {/* Seção: Informações Básicas */}
                        <div className="space-y-4 border-b border-neutral-100 pb-6">
                            <h2 className="text-base font-semibold text-neutral-900 flex items-center gap-2">
                                <Building className="h-4 w-4 text-blue-600" /> Dados Gerais
                            </h2>
                            <div className="space-y-1.5">
                                <label className="text-sm font-medium text-neutral-700">Nome da Instituição</label>
                                <Input 
                                    value={institutionName} 
                                    onChange={(e) => setInstitutionName(e.target.value)} 
                                    className="bg-neutral-50"
                                />
                                <p className="text-xs text-neutral-500">Este nome será exibido em todas as vagas e e-mails.</p>
                            </div>
                        </div>

                        {/* Seção: Branding */}
                        <div className="space-y-6">
                            <h2 className="text-base font-semibold text-neutral-900 flex items-center gap-2">
                                <Palette className="h-4 w-4 text-purple-600" /> Identidade Visual (White-Label)
                            </h2>

                            {/* Cor Primária */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-1.5">
                                    <label className="text-sm font-medium text-neutral-700">Cor da Marca</label>
                                    <div className="flex gap-3 items-center">
                                        <div className="relative">
                                            <input 
                                                type="color" 
                                                value={primaryColor}
                                                onChange={(e) => setPrimaryColor(e.target.value)}
                                                className="h-10 w-10 p-0.5 rounded cursor-pointer border border-neutral-200"
                                            />
                                        </div>
                                        <Input 
                                            value={primaryColor} 
                                            onChange={(e) => setPrimaryColor(e.target.value)} 
                                            className="font-mono uppercase"
                                            maxLength={7}
                                        />
                                    </div>
                                    <p className="text-xs text-neutral-500">Usada em botões, links e destaques.</p>
                                </div>
                            </div>

                            {/* Upload de Logo */}
                            <div className="space-y-3">
                                <label className="text-sm font-medium text-neutral-700">Logotipo</label>
                                <div className="flex items-start gap-6">
                                    <div className="h-24 w-24 rounded-lg border-2 border-dashed border-neutral-200 bg-neutral-50 flex items-center justify-center overflow-hidden shrink-0 relative group">
                                        {previewUrl ? (
                                            <img src={previewUrl} alt="Preview" className="h-full w-full object-contain p-2" />
                                        ) : currentLogoUrl ? (
                                            <img src={`${API_URL}${currentLogoUrl}`} alt="Logo Atual" className="h-full w-full object-contain p-2" />
                                        ) : (
                                            <ImageIcon className="h-8 w-8 text-neutral-300" />
                                        )}
                                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors" />
                                    </div>
                                    
                                    <div className="flex-1 space-y-2">
                                        <div className="relative">
                                            <Input 
                                                type="file" 
                                                accept="image/*" 
                                                onChange={handleLogoChange}
                                                className="cursor-pointer file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                                            />
                                        </div>
                                        <p className="text-xs text-neutral-500">
                                            Recomendado: PNG ou SVG com fundo transparente. Tamanho máx: 2MB.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="pt-4 flex justify-end">
                            <Button type="submit" disabled={isSaving} className="bg-blue-600 hover:bg-blue-700 min-w-[140px]">
                                {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2"/> : <Save className="h-4 w-4 mr-2" />}
                                {isSaving ? 'Salvando...' : 'Salvar Alterações'}
                            </Button>
                        </div>
                    </form>
                </div>

                {/* Coluna Direita: Preview */}
                <div className="space-y-6">
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-neutral-200 sticky top-6">
                        <h3 className="text-sm font-bold text-neutral-900 mb-4 flex items-center gap-2 uppercase tracking-wider">
                            <LayoutTemplate className="h-4 w-4" /> Visualização
                        </h3>
                        
                        <div className="border border-neutral-200 rounded-lg overflow-hidden bg-neutral-50">
                            {/* Fake Header */}
                            <div className="bg-white border-b border-neutral-200 p-3 flex justify-between items-center">
                                <div className="h-6 w-20 bg-neutral-200 rounded flex items-center justify-center text-[8px] text-neutral-400 overflow-hidden">
                                    {(previewUrl || currentLogoUrl) ? (
                                        <img src={previewUrl || `${API_URL}${currentLogoUrl}`} className="h-full object-contain" alt="Logo" />
                                    ) : "LOGO"}
                                </div>
                                <div className="flex gap-2">
                                    <div className="h-2 w-10 bg-neutral-200 rounded"></div>
                                    <div className="h-2 w-6 bg-neutral-200 rounded"></div>
                                </div>
                            </div>
                            
                            {/* Fake Content */}
                            <div className="p-4 space-y-3">
                                <div className="h-4 w-3/4 bg-neutral-200 rounded"></div>
                                <div className="h-2 w-full bg-neutral-100 rounded"></div>
                                <div className="h-2 w-5/6 bg-neutral-100 rounded"></div>
                                <div className="h-2 w-4/6 bg-neutral-100 rounded"></div>
                                
                                <div className="mt-4 pt-2">
                                    {/* Botão com a cor escolhida */}
                                    <div 
                                        className="h-8 w-full rounded flex items-center justify-center text-white text-xs font-medium shadow-sm transition-colors"
                                        style={{ backgroundColor: primaryColor }}
                                    >
                                        Botão de Ação
                                    </div>
                                </div>
                            </div>
                        </div>
                        <p className="text-xs text-neutral-400 mt-3 text-center">
                            Exemplo de como sua marca aparecerá nas vagas.
                        </p>
                    </div>
                </div>

            </div>
        </div>
    );
}