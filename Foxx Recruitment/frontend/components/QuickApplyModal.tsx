"use client";

import { useState, FormEvent } from 'react';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Loader2, Rocket, LogIn, UserPlus } from 'lucide-react';

interface QuickApplyModalProps {
  isOpen: boolean;
  onClose: () => void;
  jobTitle: string;
  jobInstitutionId: number;
  onSuccess: () => void; // Callback para quando o login/cadastro for sucesso
}

export function QuickApplyModal({ isOpen, onClose, jobTitle, jobInstitutionId, onSuccess }: QuickApplyModalProps) {
  const { login } = useAuth();
  const [mode, setMode] = useState<'register' | 'login'>('register');
  const [isLoading, setIsLoading] = useState(false);
  
  // Campos de Formulário
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [specialization, setSpecialization] = useState('');
  const [educationLevel, setEducationLevel] = useState('');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
        let url = '';
        let body = {};

        if (mode === 'register') {
            url = `${process.env.NEXT_PUBLIC_API_URL}/auth/register`;
            body = {
                firstName, lastName, email, password, 
                institutionId: jobInstitutionId, // Vincula à instituição da vaga
                specialization, educationLevel
            };
        } else {
            url = `${process.env.NEXT_PUBLIC_API_URL}/auth/login`;
            body = { email, password };
        }

        const res = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        });

        const data = await res.json();

        if (res.ok) {
            await login(data.access_token); // Salva o token e atualiza o contexto
            toast.success(mode === 'register' ? 'Conta criada!' : 'Bem-vindo de volta!');
            onSuccess(); // Chama o callback para aplicar à vaga
            onClose();
        } else {
            toast.error(data.error || 'Erro na operação.');
        }
    } catch (error) {
        toast.error('Erro de rede.');
    } finally {
        setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[450px]">
        <DialogHeader>
            <DialogTitle className="text-center text-xl flex flex-col items-center gap-2">
                {mode === 'register' ? <Rocket className="h-8 w-8 text-blue-600" /> : <LogIn className="h-8 w-8 text-blue-600" />}
                {mode === 'register' ? 'Candidatura Rápida' : 'Acesse sua conta'}
            </DialogTitle>
            <DialogDescription className="text-center">
                {mode === 'register' 
                    ? `Crie seu perfil em segundos para se candidatar a "${jobTitle}".` 
                    : `Faça login para finalizar sua candidatura a "${jobTitle}".`
                }
            </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
            {mode === 'register' && (
                <>
                    <div className="grid grid-cols-2 gap-3">
                        <Input placeholder="Nome" value={firstName} onChange={e => setFirstName(e.target.value)} required disabled={isLoading} />
                        <Input placeholder="Sobrenome" value={lastName} onChange={e => setLastName(e.target.value)} required disabled={isLoading} />
                    </div>
                    <Input type="email" placeholder="Seu melhor e-mail" value={email} onChange={e => setEmail(e.target.value)} required disabled={isLoading} />
                    <Input type="password" placeholder="Crie uma senha segura" value={password} onChange={e => setPassword(e.target.value)} required minLength={6} disabled={isLoading} />
                    
                    <div className="grid grid-cols-2 gap-3">
                        <Input placeholder="Especialização (Ex: Front-end)" value={specialization} onChange={e => setSpecialization(e.target.value)} disabled={isLoading} />
                        
                        <Select onValueChange={setEducationLevel} value={educationLevel} disabled={isLoading}>
                            <SelectTrigger><SelectValue placeholder="Formação" /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="Ensino Médio">Ensino Médio</SelectItem>
                                <SelectItem value="Graduação">Graduação</SelectItem>
                                <SelectItem value="Pós-graduação">Pós-graduação</SelectItem>
                                <SelectItem value="Mestrado">Mestrado</SelectItem>
                                <SelectItem value="Doutorado">Doutorado</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </>
            )}

            {mode === 'login' && (
                <>
                    <Input type="email" placeholder="Seu e-mail" value={email} onChange={e => setEmail(e.target.value)} required disabled={isLoading} />
                    <Input type="password" placeholder="Sua senha" value={password} onChange={e => setPassword(e.target.value)} required disabled={isLoading} />
                </>
            )}

            <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700" disabled={isLoading}>
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : (mode === 'register' ? 'Criar Conta e Candidatar' : 'Entrar e Candidatar')}
            </Button>

            <div className="text-center text-sm text-neutral-500 mt-4">
                {mode === 'register' ? 'Já possui conta? ' : 'Não tem conta? '}
                <button 
                    type="button" 
                    onClick={() => setMode(mode === 'register' ? 'login' : 'register')}
                    className="text-blue-600 font-semibold hover:underline"
                >
                    {mode === 'register' ? 'Fazer Login' : 'Cadastre-se grátis'}
                </button>
            </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}