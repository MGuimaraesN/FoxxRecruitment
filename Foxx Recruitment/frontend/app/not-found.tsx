import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { FileQuestion, ArrowLeft } from 'lucide-react';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Página não encontrada | Decola Vagas',
};

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-950 px-4 text-center relative overflow-hidden text-slate-50 font-sans selection:bg-blue-600/30 selection:text-blue-100">
      
      {/* Efeitos de Fundo (Glow) */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[120px] -z-10 pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-[300px] h-[300px] bg-purple-600/10 rounded-full blur-[100px] -z-10 pointer-events-none" />

      <div className="relative z-10 flex flex-col items-center animate-in fade-in zoom-in duration-500">
        
        {/* Ícone com estilo Glassmorphism */}
        <div className="mb-8 flex h-28 w-28 items-center justify-center rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl shadow-blue-900/20">
          <div className="relative">
            <div className="absolute inset-0 bg-blue-500 blur-xl opacity-20 rounded-full"></div>
            <FileQuestion className="h-12 w-12 text-blue-500 relative z-10" />
          </div>
        </div>
        
        <h1 className="mb-4 text-4xl font-bold tracking-tight text-white sm:text-6xl drop-shadow-sm">
          Página não encontrada
        </h1>
        
        <p className="mb-10 max-w-lg text-lg text-slate-400 leading-relaxed">
          Desculpe, não conseguimos encontrar o que você está procurando. A página pode ter sido movida, excluída ou o link pode estar incorreto.
        </p>
        
        <div className="flex flex-col gap-4 sm:flex-row">
          <Button 
            asChild 
            size="lg" 
            className="gap-2 bg-blue-600 hover:bg-blue-500 text-white font-medium h-12 px-8 rounded-full shadow-[0_0_20px_rgba(37,99,235,0.3)] transition-all duration-300 border-0"
          >
            <Link href="/">
              <ArrowLeft className="h-4 w-4" />
              Voltar ao Início
            </Link>
          </Button>
        </div>
      </div>
      
      <div className="absolute bottom-8 text-sm text-slate-600">
        &copy; {new Date().getFullYear()} Decola Vagas
      </div>
    </div>
  );
}