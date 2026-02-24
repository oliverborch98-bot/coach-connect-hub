import { createContext, useContext, useState, ReactNode } from 'react';

export type UserRole = 'coach' | 'client';

export interface AppUser {
  id: string;
  email: string;
  role: UserRole;
  fullName: string;
}

interface AuthContextType {
  user: AppUser | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

const MOCK_USERS: Record<string, AppUser> = {
  'coach@buildmethod.dk': { id: 'coach-1', email: 'coach@buildmethod.dk', role: 'coach', fullName: 'Marcus Jensen' },
  'client@buildmethod.dk': { id: 'client-1', email: 'client@buildmethod.dk', role: 'client', fullName: 'Thomas Andersen' },
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const login = async (email: string, _password: string) => {
    setIsLoading(true);
    await new Promise(r => setTimeout(r, 600));
    const found = MOCK_USERS[email.toLowerCase()];
    if (!found) throw new Error('Ugyldige loginoplysninger');
    setUser(found);
    setIsLoading(false);
  };

  const logout = () => setUser(null);

  return (
    <AuthContext.Provider value={{ user, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
