import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { Session } from '@supabase/supabase-js';

export type UserRole = 'coach' | 'client';

export interface AppUser {
  id: string;
  email: string;
  role: UserRole;
  fullName: string;
}

interface AuthContextType {
  user: AppUser | null;
  session: Session | null;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Listen for auth state changes - only update session, no async work
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, newSession) => {
        setSession(newSession);
      }
    );

    // Check existing session on mount
    supabase.auth.getSession().then(({ data: { session: existing } }) => {
      setSession(existing);
    }).catch(() => {
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Fetch profile whenever session changes
  useEffect(() => {
    if (!session?.user) {
      setUser(null);
      setIsLoading(false);
      return;
    }

    let cancelled = false;
    const authUser = session.user;

    const fetchProfile = async () => {
      try {
        const { data } = await supabase
          .from('profiles')
          .select('full_name, role')
          .eq('id', authUser.id)
          .maybeSingle();

        if (cancelled) return;
        if (data) {
          setUser({
            id: authUser.id,
            email: authUser.email ?? '',
            role: data.role as UserRole,
            fullName: data.full_name ?? '',
          });
        } else {
          setUser(null);
        }
      } catch {
        if (!cancelled) setUser(null);
      }
      if (!cancelled) setIsLoading(false);
    };

    fetchProfile();

    return () => { cancelled = true; };
  }, [session]);

  const signIn = async (email: string, password: string) => {
    setIsLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setIsLoading(false);
      throw new Error(error.message);
    }
    // onAuthStateChange will update session → triggers profile fetch
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
  };

  return (
    <AuthContext.Provider value={{ user, session, signIn, signOut, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
