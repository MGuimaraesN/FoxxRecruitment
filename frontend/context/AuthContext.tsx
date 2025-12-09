"use client";

import { createContext, useState, useEffect, ReactNode, useContext, useMemo } from 'react';
import { useRouter } from 'next/navigation';

interface Institution {
  id: number;
  name: string;
  slug?: string;
  logoUrl?: string;
  primaryColor?: string;
  type: string;
}

interface UserInstitution {
  institutionId: number;
  roleId: number;
  institution: Institution;
  role: { name: string };
}

interface User {
  userId: number;
  firstName: string;
  lastName: string;
  email: string;
  institutions: any[]; 
  activeInstitutionId: number | null;
  avatarUrl?: string | null;
  resumeUrl?: string | null;
  linkedinUrl?: string | null;
  githubUrl?: string | null; // Usado para Lattes antigo ou Github mesmo
  lattesUrl?: string | null; // <--- NOVO
  portfolioUrl?: string | null;
  course?: string | null;
  graduationYear?: number | null;
  educationLevel?: string | null;
  specialization?: string | null;
  bio?: string | null;
  phone?: string | null; // <--- NOVO
  role?: { name: string }; 
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  activeInstitutionId: number | null;
  currentInstitution: Institution | null;
  login: (token: string, shouldRedirect?: boolean) => Promise<void>;
  logout: () => void;
  leaveInstitution: () => Promise<void>;
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

  // 1. Inicialização
  useEffect(() => {
    const initAuth = async () => {
      const storedToken = localStorage.getItem('access_token');
      if (storedToken) {
        setToken(storedToken);
        await fetchUserProfile(storedToken);
      } else {
        setLoading(false);
      }
    };
    initAuth();
  }, []);

  // 2. Computed Property para Instituição Atual
  const currentInstitution = useMemo(() => {
    if (!user || !activeInstitutionId) return null;
    const link = user.institutions.find(i => i.institutionId === activeInstitutionId);
    return link ? link.institution : null;
  }, [user, activeInstitutionId]);

  const fetchUserProfile = async (tokenOverride?: string) => {
    const currentToken = tokenOverride || token || localStorage.getItem('access_token');
    if (!currentToken) {
      setLoading(false);
      return;
    }

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/profile`, {
        headers: { 'Authorization': `Bearer ${currentToken}` },
        cache: 'no-store'
      });

      if (res.ok) {
        const userData = await res.json();
        
        const activeInst = userData.institutions?.find((i: any) => i.institutionId === userData.activeInstitutionId);
        if (activeInst) {
            userData.role = activeInst.role;
        } else if (userData.institutions?.length > 0) {
             const isSuperAdmin = userData.institutions.some((i: any) => i.role.name === 'superadmin');
             if (isSuperAdmin) userData.role = { name: 'superadmin' };
             else userData.role = userData.institutions[0]?.role;
        }

        setUser(userData);
        setActiveInstitutionId(userData.activeInstitutionId);
      } else {
        if (res.status === 401) logout();
      }
    } catch (error) {
      console.error('Failed to fetch user profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const login = async (newToken: string, shouldRedirect: boolean = true) => {
    localStorage.setItem('access_token', newToken);
    setToken(newToken);
    
    await fetchUserProfile(newToken);
    
    if (shouldRedirect) {
        router.push('/dashboard'); 
    }
  };

  const logout = () => {
    localStorage.removeItem('access_token');
    setUser(null);
    setToken(null);
    setActiveInstitutionId(null);
    setLoading(false);
    router.push('/');
  };

  const leaveInstitution = async () => {
    const currentToken = token || localStorage.getItem('access_token');
    if (!currentToken) return;

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/switch-institution`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${currentToken}`,
        },
        body: JSON.stringify({ institutionId: null }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.access_token) {
            localStorage.setItem('access_token', data.access_token);
            setToken(data.access_token);
            await fetchUserProfile(data.access_token); 
            router.refresh();
        }
      }
    } catch (error) {
      console.error('Error leaving institution:', error);
    }
  };

  const getActiveRole = () => {
    if (!user) return null;
    if (user.role?.name) return user.role.name;
    const activeInst = user.institutions?.find((i: any) => i.institutionId === user.activeInstitutionId);
    if (activeInst) return activeInst.role.name;
    if (user.institutions?.some((i:any) => i.role.name === 'superadmin')) return 'superadmin';
    return null;
  };

  const value = {
    user,
    token,
    loading,
    activeInstitutionId,
    currentInstitution, 
    login,
    logout,
    leaveInstitution,
    fetchUserProfile: () => fetchUserProfile(),
    setActiveInstitutionId,
    getActiveRole
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};