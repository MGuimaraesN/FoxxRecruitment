'use client';

import { useState, FormEvent, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Building, LogIn, Loader2 } from 'lucide-react';
import { Toaster, toast } from 'sonner';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

const LOGIN_API_URL = `${process.env.NEXT_PUBLIC_API_URL}/auth/login`;

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { login, user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    document.title = 'Login | Decola Vagas';
  }, []);

  useEffect(() => {
    if (!loading && user) {
      router.push('/dashboard');
    }
  }, [user, loading, router]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch(LOGIN_API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (res.ok) {
        const data = await res.json();
        toast.success('Login realizado com sucesso!');
        await login(data.access_token);
        router.push('/dashboard'); 
      } else {
        const data = await res.json();
        const errorMessage = data.error || 'Falha no login. Verifique seus dados.';
        setError(errorMessage);
        toast.error(errorMessage);
      }
    } catch (error) {
      console.error(error);
      const networkError = 'Erro de rede. Não foi possível conectar ao servidor.';
      setError(networkError);
      toast.error(networkError);
    } finally {
      setIsLoading(false);
    }
  };

  if (loading || user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }

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
          <div className="z-10 relative">
            <h2 className="text-4xl font-bold leading-tight mb-4">
              Sua jornada profissional <br/>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400">começa aqui.</span>
            </h2>
            <p className="text-lg text-slate-400 max-w-md">
              Acesse as melhores oportunidades exclusivas da sua instituição de ensino.
            </p>
          </div>
          <div className="text-sm text-slate-500 z-10">
            &copy; {new Date().getFullYear()} Decola Vagas
          </div>
        </div>

        {/* Lado Direito (Formulário) */}
        <div className="flex w-full items-center justify-center p-8 lg:w-1/2 relative">
           {/* Efeito de Fundo Mobile */}
           <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full max-w-md bg-blue-600/5 blur-[100px] pointer-events-none lg:hidden" />

          <div className="w-full max-w-md relative z-10">
            <Link
              href="/"
              className="mb-8 flex items-center justify-center gap-2 lg:hidden group"
            >
              <div className="p-1.5 rounded-lg bg-blue-600/10 group-hover:bg-blue-600/20 transition-colors">
                <Building className="h-6 w-6 text-blue-500" />
              </div>
              <span className="text-2xl font-bold text-white">Decola Vagas</span>
            </Link>

            <div className="mb-8">
              <h1 className="text-3xl font-bold text-white text-center lg:text-left mb-2">
                Entrar na sua conta
              </h1>
              <p className="text-slate-400 text-center lg:text-left">
                Bem-vindo de volta! Digite seus dados para continuar.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-slate-300 mb-1.5">Email</label>
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
              <div>
                <div className="flex justify-between items-center mb-1.5">
                    <label htmlFor="password" className="block text-sm font-medium text-slate-300">Senha</label>
                    <Link href="/forgot-password" className="text-sm font-medium text-blue-400 hover:text-blue-300 hover:underline transition-colors">
                      Esqueceu sua senha?
                    </Link>
                </div>
                <Input 
                    type="password" 
                    id="password" 
                    value={password} 
                    onChange={(e) => setPassword(e.target.value)} 
                    placeholder="••••••••" 
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
                <Button type="submit" disabled={isLoading} className="w-full gap-2 bg-blue-600 hover:bg-blue-500 text-white font-medium h-11 text-base shadow-[0_0_15px_rgba(37,99,235,0.3)] transition-all">
                  {isLoading ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                      <LogIn className="h-5 w-5" />
                  )}
                  {isLoading ? 'Entrando...' : 'Entrar'}
                </Button>
              </div>
            </form>

            <p className="mt-8 text-center text-sm text-slate-400">
              Não tem uma conta?{' '}
              <Link href="/register" className="font-semibold text-blue-400 hover:text-blue-300 hover:underline transition-colors">
                Cadastre-se
              </Link>
            </p>
          </div>
        </div>
      </div>
    </>
  );
}