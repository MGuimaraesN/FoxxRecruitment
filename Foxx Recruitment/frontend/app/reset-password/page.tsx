'use client';

import { useState, FormEvent, Suspense, useEffect } from 'react';
import { useSearchParams, notFound } from 'next/navigation'; // Import notFound
import Link from 'next/link';
import * as React from 'react';
import { Building, Lock, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { toast, Toaster } from 'sonner';

const API_URL = `${process.env.NEXT_PUBLIC_API_URL}/auth/reset-password`;

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Verificação de segurança: Se não houver token, retorna 404 imediatamente
  useEffect(() => {
    if (!token) {
      notFound();
    }
    document.title = 'Redefinir Senha | Decola Vagas';
  }, [token]);

  // Evita renderizar o formulário momentaneamente se não tiver token (enquanto redireciona)
  if (!token) return null;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      const msg = 'As senhas não coincidem.';
      setError(msg);
      toast.error(msg);
      return;
    }
    
    setLoading(true);
    setMessage('');
    setError('');

    try {
      const res = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, newPassword: password }),
      });

      const data = await res.json();

      if (res.ok) {
        setMessage(data.message);
        toast.success(data.message);
        // Limpa os campos
        setPassword('');
        setConfirmPassword('');
      } else {
        const errorMsg = data.error || 'Ocorreu um erro ao redefinir.';
        setError(errorMsg);
        toast.error(errorMsg);
      }
    } catch (err) {
      const errorMsg = 'Erro de rede. Tente novamente.';
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Toaster richColors theme="dark" />
      <div className="flex min-h-screen w-full bg-slate-950 text-slate-50 selection:bg-blue-600/30 selection:text-blue-100">
        
        {/* Lado Esquerdo (Branding - Igual ao Login) */}
        <div className="hidden min-h-screen w-1/2 flex-col justify-between bg-slate-900 p-10 text-white lg:flex border-r border-white/5 relative overflow-hidden">
          {/* Efeitos de Fundo */}
          <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-blue-600/10 rounded-full blur-[100px] pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-purple-600/10 rounded-full blur-[80px] pointer-events-none" />

          <Link href="/" className="flex items-center gap-2 z-10 group w-fit">
            <div className="p-1.5 rounded-lg bg-blue-600/10 group-hover:bg-blue-600/20 transition-colors">
               <Building className="h-6 w-6 text-blue-500" />
            </div>
            <span className="text-xl font-bold tracking-tight">Decola Vagas</span>
          </Link>
          <div className="z-10">
            <h2 className="text-3xl font-bold leading-tight mb-4">
              Segurança em primeiro lugar.
            </h2>
            <p className="text-lg text-slate-400 max-w-md">
              Crie uma senha forte para proteger sua conta e seus dados acadêmicos.
            </p>
          </div>
          <div className="text-sm text-slate-500 z-10">
            &copy; {new Date().getFullYear()} Decola Vagas
          </div>
        </div>

        {/* Lado Direito (Formulário) */}
        <div className="flex w-full items-center justify-center p-8 lg:w-1/2 relative">
           <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full max-w-md bg-blue-600/5 blur-[100px] pointer-events-none lg:hidden" />

          <div className="w-full max-w-md relative z-10">
            <Link href="/" className="mb-8 flex items-center justify-center gap-2 lg:hidden group">
              <div className="p-1.5 rounded-lg bg-blue-600/10 group-hover:bg-blue-600/20 transition-colors">
                <Building className="h-6 w-6 text-blue-500" />
              </div>
              <span className="text-2xl font-bold text-white">Decola Vagas</span>
            </Link>

            <div className="mb-8">
                <h1 className="text-3xl font-bold text-white text-center lg:text-left mb-2">
                Nova Senha
                </h1>
                <p className="text-slate-400 text-center lg:text-left">
                Defina sua nova credencial de acesso.
                </p>
            </div>

            {message ? (
              <div className="rounded-xl border border-emerald-900 bg-emerald-950 p-6 animate-in fade-in zoom-in duration-300 shadow-2xl shadow-emerald-900/20">
                <h3 className="font-bold text-emerald-400 text-lg mb-2">Senha alterada!</h3>
                <p className="text-emerald-200 mb-6 leading-relaxed text-sm">{message}</p>
                <Button asChild className="bg-emerald-600 hover:bg-emerald-500 text-white font-medium w-full rounded-full h-11">
                  <Link href="/login">Ir para o Login</Link>
                </Button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-slate-300 mb-1.5">
                    Nova Senha
                  </label>
                  <Input 
                    type="password" 
                    id="password" 
                    value={password} 
                    onChange={(e) => setPassword(e.target.value)} 
                    placeholder="••••••••" 
                    required 
                    minLength={6}
                    className="bg-slate-900 border-slate-700 text-white placeholder:text-slate-400 focus-visible:ring-blue-500 focus:bg-slate-800 transition-colors h-11"
                  />
                </div>
                <div>
                  <label htmlFor="confirmPassword" className="block text-sm font-medium text-slate-300 mb-1.5">
                    Confirmar Nova Senha
                  </label>
                  <Input 
                    type="password" 
                    id="confirmPassword" 
                    value={confirmPassword} 
                    onChange={(e) => setConfirmPassword(e.target.value)} 
                    placeholder="••••••••" 
                    required 
                    minLength={6}
                    className="bg-slate-900 border-slate-700 text-white placeholder:text-slate-400 focus-visible:ring-blue-500 focus:bg-slate-800 transition-colors h-11"
                  />
                </div>

                {error && (
                    <div className="rounded-lg bg-red-500/10 p-3 border border-red-500/20 animate-in fade-in">
                        <p className="text-sm text-red-400 text-center">{error}</p>
                    </div>
                )}

                <div>
                  <Button type="submit" className="w-full gap-2 bg-blue-600 hover:bg-blue-500 text-white font-medium h-11 text-base shadow-[0_0_15px_rgba(37,99,235,0.3)] transition-all rounded-md" disabled={loading}>
                    {loading ? (
                       <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      <>
                        <Lock className="h-5 w-5" />
                        Salvar Nova Senha
                      </>
                    )}
                  </Button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center bg-slate-950">
        <Loader2 className="h-10 w-10 animate-spin text-blue-500" />
      </div>
    }>
      <ResetPasswordForm />
    </Suspense>
  );
}