'use client';

import * as React from 'react';
import { useState, FormEvent, useEffect } from 'react';
import Link from 'next/link';
import { Building, Mail, Loader2, ArrowLeft } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { toast, Toaster } from 'sonner';

const API_URL = `${process.env.NEXT_PUBLIC_API_URL}/auth/forgot-password`;

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    document.title = 'Esqueceu a Senha? | Decola Vagas';
  }, []);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    setError('');

    try {
      const res = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (res.ok) {
        setMessage(data.message);
        toast.success(data.message);
      } else {
        const errorMsg = data.error || 'Ocorreu um erro.';
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
        
        {/* Lado Esquerdo (Branding) */}
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
              Recuperação de Acesso
            </h2>
            <p className="text-lg text-slate-400 max-w-md">
              Não se preocupe, vamos ajudar você a retomar o acesso à sua conta.
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
                <Link href="/login" className="inline-flex items-center text-sm text-slate-400 hover:text-white transition-colors mb-6 group">
                    <ArrowLeft className="h-4 w-4 mr-1 group-hover:-translate-x-1 transition-transform" /> Voltar para o login
                </Link>
                <h1 className="text-3xl font-bold text-white text-center lg:text-left mb-2">
                Redefinir Senha
                </h1>
                <p className="text-slate-400 text-center lg:text-left">
                Digite seu e-mail e enviaremos um link de recuperação.
                </p>
            </div>

            {message ? (
              <div className="rounded-xl border border-emerald-900 bg-emerald-950 p-6 animate-in fade-in zoom-in duration-300">
                <h3 className="font-bold text-emerald-400 text-lg mb-2">E-mail enviado!</h3>
                <p className="text-emerald-200 mb-6 leading-relaxed text-sm">{message}</p>
                <Button asChild className="bg-emerald-600 hover:bg-emerald-500 text-white font-medium w-full">
                  <Link href="/login">Voltar para o Login</Link>
                </Button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-slate-300 mb-1.5">
                    E-mail
                  </label>
                  <Input 
                    type="email" 
                    id="email" 
                    value={email} 
                    onChange={(e) => setEmail(e.target.value)} 
                    placeholder="seu@email.com" 
                    required 
                    className="bg-slate-900 border-slate-700 text-white placeholder:text-slate-400 focus-visible:ring-blue-500 focus:bg-slate-800 transition-colors h-11"
                  />
                </div>

                {error && (
                    <div className="rounded-lg bg-red-500/10 p-3 border border-red-500/20">
                        <p className="text-sm text-red-400 text-center">{error}</p>
                    </div>
                )}

                <div>
                  <Button type="submit" disabled={loading} className="w-full gap-2 bg-blue-600 hover:bg-blue-500 text-white font-medium h-11 text-base shadow-[0_0_15px_rgba(37,99,235,0.3)] transition-all">
                    {loading ? (
                        <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      <>
                        <Mail className="h-5 w-5" />
                        Enviar link
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