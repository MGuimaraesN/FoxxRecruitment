'use client';

import { useState, FormEvent, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';
import { Building, UserPlus, Loader2 } from 'lucide-react';
import { Toaster, toast } from 'sonner';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const REGISTER_API_URL = `${process.env.NEXT_PUBLIC_API_URL}/auth/register`;
const INSTITUTIONS_API_URL = `${process.env.NEXT_PUBLIC_API_URL}/institutions/public`;

interface Institution {
  id: number;
  name: string;
}

export default function RegisterPage() {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [institutionId, setInstitutionId] = useState('');
  const [institutions, setInstitutions] = useState<Institution[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { login, user, loading } = useAuth();

  useEffect(() => {
    document.title = 'Cadastro | Decola Vagas';
  }, []);

  useEffect(() => {
    if (!loading && user) {
      router.push('/dashboard');
    }
  }, [user, loading, router]);

  useEffect(() => {
    const fetchInstitutions = async () => {
      try {
        const res = await fetch(INSTITUTIONS_API_URL);
        if (res.ok) {
          const data = await res.json();
          setInstitutions(data);
        }
      } catch (error) {
        console.error('Failed to fetch institutions', error);
        toast.error('Não foi possível carregar as instituições.');
      }
    };
    fetchInstitutions();
  }, []);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch(REGISTER_API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName,
          lastName,
          email,
          password,
          institutionId: parseInt(institutionId),
        }),
      });

      if (res.ok) {
        const data = await res.json();
        login(data.access_token);
        toast.success('Conta criada com sucesso!');
      } else {
        const data = await res.json();
        const errorMessage = data.error || 'Falha ao cadastrar. Tente novamente.';
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
                Criar sua conta
                </h1>
                <p className="text-slate-400 text-center lg:text-left">
                É rápido e fácil. Preencha os dados abaixo.
                </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="flex gap-4">
                <div className="w-1/2">
                  <label htmlFor="firstName" className="block text-sm font-medium text-slate-300 mb-1.5">Nome</label>
                  <Input type="text" id="firstName" value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="Seu nome" required className="bg-slate-900 border-slate-700 text-white placeholder:text-slate-400 focus-visible:ring-blue-500 focus:bg-slate-800 transition-colors h-11"/>
                </div>
                <div className="w-1/2">
                  <label htmlFor="lastName" className="block text-sm font-medium text-slate-300 mb-1.5">Sobrenome</label>
                  <Input type="text" id="lastName" value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder="Sobrenome" required className="bg-slate-900 border-slate-700 text-white placeholder:text-slate-400 focus-visible:ring-blue-500 focus:bg-slate-800 transition-colors h-11"/>
                </div>
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-slate-300 mb-1.5">Email</label>
                <Input type="email" id="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="seu@email.com" required className="bg-slate-900 border-slate-700 text-white placeholder:text-slate-400 focus-visible:ring-blue-500 focus:bg-slate-800 transition-colors h-11"/>
              </div>
              
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-slate-300 mb-1.5">Senha</label>
                <Input type="password" id="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" required minLength={6} className="bg-slate-900 border-slate-700 text-white placeholder:text-slate-400 focus-visible:ring-blue-500 focus:bg-slate-800 transition-colors h-11"/>
              </div>

              <div>
                <label htmlFor="institution" className="block text-sm font-medium text-slate-300 mb-1.5">Instituição</label>
                <Select value={institutionId} onValueChange={setInstitutionId} required>
                  <SelectTrigger className="w-full bg-slate-900 border-slate-700 text-white focus:ring-blue-500 focus:ring-offset-0 h-11 hover:bg-slate-800 transition-colors">
                    <SelectValue placeholder="Selecione sua instituição" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-900 border-slate-700 text-slate-200">
                    {institutions.map((institution) => (
                      <SelectItem key={institution.id} value={String(institution.id)} className="focus:bg-slate-800 focus:text-white cursor-pointer">
                        {institution.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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
                    <UserPlus className="h-5 w-5" />
                  )}
                  {isLoading ? 'Criando conta...' : 'Criar conta'}
                </Button>
              </div>
            </form>

            <p className="mt-8 text-center text-sm text-slate-400">
              Já tem uma conta?{' '}
              <Link href="/login" className="font-semibold text-blue-400 hover:text-blue-300 hover:underline transition-colors">
                Faça login
              </Link>
            </p>
          </div>
        </div>
      </div>
    </>
  );
}