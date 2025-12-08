"use client";

import { createContext, useState, useEffect, ReactNode, useContext } from 'react';
import { useRouter } from 'next/navigation';

// Interface atualizada do Usuário
interface User {
  userId: number;
  firstName: string;
  lastName: string;
  email: string;
  institutions: any[]; 
  activeInstitutionId: number | null;
  avatarUrl?: string | null;
  resumeUrl?: string | null;
  bio?: string | null;
  linkedinUrl?: string | null;
  githubUrl?: string | null;
  portfolioUrl?: string | null;
  course?: string | null;
  graduationYear?: number | null;
  role?: { name: string }; 
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  activeInstitutionId: number | null;
  login: (token: string) => Promise<User | null>;
  logout: () => void;
  leaveInstitution: () => Promise<void>; // Nova função para desvincular
  fetchUserProfile: () => Promise<void>;
  setActiveInstitutionId: (id: number | null) => void;
  getActiveRole: () => string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [activeInstitutionId, setActiveInstitutionId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const storedToken = localStorage.getItem('access_token');
    if (storedToken) {
      setToken(storedToken);
    } else {
      setLoading(false);
    }
  }, []);

  const fetchUserProfile = async () => {
    const storedToken = localStorage.getItem('access_token');
    if (!storedToken) {
      logout();
      setLoading(false);
      return;
    }

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/profile`, {
        headers: {
          'Authorization': `Bearer ${storedToken}`,
        },
      });

      if (res.ok) {
        const userData = await res.json();
        
        // Tenta encontrar a role na instituição ativa
        const activeInst = userData.institutions.find((i: any) => i.institutionId === userData.activeInstitutionId);
        
        if (activeInst) {
            userData.role = activeInst.role;
        } else {
             // Se não encontrou vínculo direto (ex: Super Admin navegando em outro tenant),
             // verifica se é Super Admin global para manter o privilégio no frontend
             const isSuperAdmin = userData.institutions.some((i: any) => i.role.name === 'superadmin');
             if (isSuperAdmin) {
                 userData.role = { name: 'superadmin' };
             } else if (userData.institutions.length > 0) {
                 // Fallback para o primeiro cargo encontrado se não houver ativo
                 userData.role = userData.institutions[0].role;
             }
        }

        setUser(userData);
        setActiveInstitutionId(userData.activeInstitutionId);
      } else {
        logout();
      }
    } catch (error) {
      console.error('Failed to fetch user profile:', error);
      logout();
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchUserProfile();
    }
  }, [token]);

  const login = async (newToken: string): Promise<User | null> => {
    setLoading(true); 
    localStorage.setItem('access_token', newToken);
    setToken(newToken);
    return null; 
  };

  const logout = () => {
    // 1. Ativa o loading para mostrar o spinner imediatamente
    setLoading(true);
    
    // 2. Limpa os dados
    localStorage.removeItem('access_token');
    setUser(null);
    setToken(null);
    setActiveInstitutionId(null);
    
    // 3. Redireciona
    router.push('/');

    // 4. Desativa o loading após um breve delay
    setTimeout(() => {
      setLoading(false);
    }, 500);
  };

  // Nova função para sair da instituição atual (definir activeInstitutionId como null)
  const leaveInstitution = async () => {
    const storedToken = localStorage.getItem('access_token');
    if (!storedToken) return;

    try {
      // Envia null para o backend para limpar a activeInstitutionId
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/switch-institution`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${storedToken}`,
        },
        body: JSON.stringify({ institutionId: null }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.access_token) {
          // Atualiza o token com o novo estado (sem instituição ativa)
          await login(data.access_token);
        }
      }
    } catch (error) {
      console.error('Error leaving institution:', error);
    }
  };

  const getActiveRole = () => {
    if (!user) return null;
    if (user.role?.name) return user.role.name;
    
    // Tenta buscar novamente nos vínculos
    const activeInst = user.institutions.find((i: any) => i.institutionId === user.activeInstitutionId);
    if (activeInst) return activeInst.role.name;
    
    // Último recurso: verifica se é superadmin global
    if (user.institutions.some((i:any) => i.role.name === 'superadmin')) return 'superadmin';
    
    return null;
  };

  const value = {
    user,
    token,
    loading,
    activeInstitutionId,
    login,
    logout,
    leaveInstitution, // Exportando a nova função
    fetchUserProfile,
    setActiveInstitutionId,
    getActiveRole
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};