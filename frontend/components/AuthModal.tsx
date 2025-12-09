"use client";

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';
import { Loader2, LogIn, UserPlus, Mail, Lock, User } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  defaultTab?: 'login' | 'register';
  institutionId?: number; // Para vincular automaticamente no cadastro
}

export function AuthModal({ isOpen, onClose, onSuccess, defaultTab = 'login', institutionId }: AuthModalProps) {
  const { login } = useAuth();
  const [activeTab, setActiveTab] = useState<'login' | 'register'>(defaultTab);
  const [isLoading, setIsLoading] = useState(false);

  // Estados do Formulário
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      if (res.ok) {
        toast.success('Bem-vindo de volta!');
        await login(data.access_token, false); // false = não redirecionar
        onSuccess(); // Callback de sucesso (ex: abrir modal de vaga)
        onClose();
      } else {
        toast.error(data.error || 'Credenciais inválidas.');
      }
    } catch (error) {
      toast.error('Erro de conexão.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      // Se não tiver institutionId, usa 1 como fallback ou trata no backend
      const targetInstId = institutionId || 1; 

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName,
          lastName,
          email,
          password,
          institutionId: targetInstId
        }),
      });

      const data = await res.json();
      if (res.ok) {
        toast.success('Conta criada com sucesso!');
        await login(data.access_token, false);
        onSuccess();
        onClose();
      } else {
        toast.error(data.error || 'Erro ao criar conta.');
      }
    } catch (error) {
      toast.error('Erro de conexão.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[420px] p-0 overflow-hidden border-0 shadow-2xl bg-white">
        
        {/* Header com Abas Visuais */}
        <div className="flex border-b border-neutral-100">
          <button
            onClick={() => setActiveTab('login')}
            className={`flex-1 py-4 text-sm font-semibold transition-colors flex items-center justify-center gap-2 ${
              activeTab === 'login' 
                ? 'border-b-2 border-blue-600 text-blue-600 bg-blue-50/30' 
                : 'text-neutral-500 hover:text-neutral-800'
            }`}
          >
            <LogIn size={16} /> Entrar
          </button>
          <button
            onClick={() => setActiveTab('register')}
            className={`flex-1 py-4 text-sm font-semibold transition-colors flex items-center justify-center gap-2 ${
              activeTab === 'register' 
                ? 'border-b-2 border-blue-600 text-blue-600 bg-blue-50/30' 
                : 'text-neutral-500 hover:text-neutral-800'
            }`}
          >
            <UserPlus size={16} /> Cadastrar
          </button>
        </div>

        <div className="p-6">
          <DialogHeader className="mb-6">
            <DialogTitle className="text-xl font-bold text-center text-neutral-800">
              {activeTab === 'login' ? 'Acesse sua conta' : 'Crie sua conta grátis'}
            </DialogTitle>
            <DialogDescription className="text-center">
              {activeTab === 'login' 
                ? 'Entre para se candidatar às vagas.' 
                : 'Preencha seus dados para começar.'}
            </DialogDescription>
          </DialogHeader>

          {activeTab === 'login' ? (
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <div className="relative">
                    <Mail className="absolute left-3 top-2.5 h-4 w-4 text-neutral-400" />
                    <Input 
                        type="email" 
                        placeholder="E-mail" 
                        className="pl-9 bg-neutral-50" 
                        value={email} 
                        onChange={e => setEmail(e.target.value)} 
                        required 
                    />
                </div>
                <div className="relative">
                    <Lock className="absolute left-3 top-2.5 h-4 w-4 text-neutral-400" />
                    <Input 
                        type="password" 
                        placeholder="Senha" 
                        className="pl-9 bg-neutral-50" 
                        value={password} 
                        onChange={e => setPassword(e.target.value)} 
                        required 
                    />
                </div>
              </div>
              
              <div className="flex justify-end">
                <button type="button" className="text-xs text-blue-600 hover:underline font-medium">
                  Esqueceu a senha?
                </button>
              </div>

              <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 font-semibold h-10" disabled={isLoading}>
                {isLoading ? <Loader2 className="animate-spin" /> : 'Entrar na Plataforma'}
              </Button>
            </form>
          ) : (
            <form onSubmit={handleRegister} className="space-y-4">
              <div className="flex gap-3">
                 <div className="relative flex-1">
                    <User className="absolute left-3 top-2.5 h-4 w-4 text-neutral-400" />
                    <Input placeholder="Nome" className="pl-9 bg-neutral-50" value={firstName} onChange={e => setFirstName(e.target.value)} required />
                 </div>
                 <div className="relative flex-1">
                    <Input placeholder="Sobrenome" className="bg-neutral-50" value={lastName} onChange={e => setLastName(e.target.value)} required />
                 </div>
              </div>
              <div className="relative">
                 <Mail className="absolute left-3 top-2.5 h-4 w-4 text-neutral-400" />
                 <Input type="email" placeholder="E-mail" className="pl-9 bg-neutral-50" value={email} onChange={e => setEmail(e.target.value)} required />
              </div>
              <div className="relative">
                 <Lock className="absolute left-3 top-2.5 h-4 w-4 text-neutral-400" />
                 <Input type="password" placeholder="Senha" className="pl-9 bg-neutral-50" value={password} onChange={e => setPassword(e.target.value)} required minLength={6} />
              </div>

              <Button type="submit" className="w-full bg-green-600 hover:bg-green-700 font-semibold h-10" disabled={isLoading}>
                {isLoading ? <Loader2 className="animate-spin" /> : 'Criar Conta e Continuar'}
              </Button>
            </form>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}