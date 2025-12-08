"use client";
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { ChevronRight, Home } from 'lucide-react';
import { createContext, useContext, useState, ReactNode } from 'react';

// --- Contexto ---
interface BreadcrumbContextType {
    setCustomLabel: (segment: string, label: string) => void;
    customLabels: Record<string, string>;
}

const BreadcrumbContext = createContext<BreadcrumbContextType>({
    setCustomLabel: () => {},
    customLabels: {},
});

export const useBreadcrumb = () => useContext(BreadcrumbContext);

export const BreadcrumbProvider = ({ children }: { children: ReactNode }) => {
    const [customLabels, setCustomLabels] = useState<Record<string, string>>({});

    const setCustomLabel = (segment: string, label: string) => {
        setCustomLabels(prev => {
            if (prev[segment] === label) return prev;
            return { ...prev, [segment]: label };
        });
    };

    return (
        <BreadcrumbContext.Provider value={{ setCustomLabel, customLabels }}>
            {children}
        </BreadcrumbContext.Provider>
    );
};

// Traduções Estáticas
const pathTranslations: Record<string, string> = {
    admin: 'Admin',
    jobs: 'Vagas',
    users: 'Usuários',
    companies: 'Empresas',
    applications: 'Candidaturas',
    institutions: 'Instituições',
    categories: 'Categorias',
    areas: 'Áreas',
    roles: 'Cargos',
    new: 'Novo',
    edit: 'Editar'
};

export function Breadcrumbs() {
    const pathname = usePathname();
    const { customLabels } = useBreadcrumb();
    
    if (!pathname.startsWith('/admin')) return null;

    const paths = pathname.split('/').filter(Boolean);

    return (
        <nav className="flex items-center space-x-2 text-sm text-neutral-500 mb-4 px-6 pt-4 h-9">
            <Link href="/" className="hover:text-neutral-900"><Home className="h-4 w-4" /></Link>
            {paths.map((path, index) => {
                const href = `/${paths.slice(0, index + 1).join('/')}`;
                const isLast = index === paths.length - 1;
                
                // Verifica se é um ID numérico (ex: "4", "102")
                const isNumericID = /^\d+$/.test(path);
                
                // Determina se devemos mostrar o Skeleton (carregando)
                // Mostra carregando se for número E ainda não tivermos o nome customizado
                const isLoading = isNumericID && !customLabels[path];

                let label = path;
                if (customLabels[path]) {
                    label = customLabels[path];
                } else if (pathTranslations[path]) {
                    label = pathTranslations[path];
                } else {
                    // Fallback para capitalizar (ex: "detalhes" -> "Detalhes")
                    label = path.charAt(0).toUpperCase() + path.slice(1);
                }

                return (
                    <div key={path} className="flex items-center">
                        <ChevronRight className="h-4 w-4 mx-1 text-neutral-400" />
                        
                        {isLoading ? (
                            /* SKELETON: Barra cinza pulsante no lugar do ID */
                            <div className="h-4 w-32 bg-neutral-200 rounded animate-pulse" />
                        ) : isLast ? (
                            <span className="font-medium text-neutral-900 line-clamp-1 max-w-[200px] truncate" title={label}>
                                {label}
                            </span>
                        ) : (
                            <Link href={href} className="hover:text-neutral-900 transition-colors">
                                {label}
                            </Link>
                        )}
                    </div>
                );
            })}
        </nav>
    );
}