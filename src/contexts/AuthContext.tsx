import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { Session } from '@supabase/supabase-js';

export type UserRole = 'coach' | 'client';

export interface AppUser {
  id: string;
  email: string;
  role: UserRole;
  fullName: string;
  mustChangePassword?: boolean;
}

interface AuthContextType {
  user: AppUser | null;
  session: Session | null;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
  isLoading: boolean;
  authError: string | null;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);

  const fetchProfile = useCallback(async (authUser: any) => {
    try {
      console.log("Fetching profile for:", authUser.id);
      const { data, error } = await supabase
        .from('profiles')
        .select('full_name, role, must_change_password')
        .eq('id', authUser.id)
        .maybeSingle();

      if (error) {
        console.error("Profile fetch error:", error);
        throw error;
      }

      let profileData = data;

      if (!data) {
        console.log("No profile found, creating one for:", authUser.id);
        const metadata = authUser.user_metadata || {};
        const newProfile = {
          id: authUser.id,
          full_name: metadata.full_name || authUser.email?.split('@')[0] || 'User',
          role: metadata.role || 'client' as UserRole,
          email: authUser.email,
        };

        const { data: created, error: createError } = await supabase
          .from('profiles')
          .insert(newProfile)
          .select()
          .single();

        if (createError) {
          console.error("Failed to auto-create profile:", createError);
          throw createError;
        }
        profileData = created;
      }

      if (profileData) {
        setUser({
          id: authUser.id,
          email: authUser.email ?? '',
          role: profileData.role as UserRole,
          fullName: profileData.full_name ?? '',
          mustChangePassword: profileData.must_change_password
        });
      } else {
        setUser(null);
      }
    } catch (err: any) {
      console.error("Auth flow error details:", err);
      setAuthError(err.message || "Der opstod en fejl under hentning af din profil.");
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const refreshUser = useCallback(async () => {
    const { data: { user: authUser } } = await supabase.auth.getUser();
    if (authUser) {
      await fetchProfile(authUser);
    }
  }, [fetchProfile]);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, newSession) => {
        setSession(newSession);
      }
    );

    supabase.auth.getSession().then(({ data: { session: existing } }) => {
      setSession(existing);
    }).catch(() => {
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!session?.user) {
      setUser(null);
      setIsLoading(false);
      return;
    }
    fetchProfile(session.user);
  }, [session, fetchProfile]);

  const signIn = async (email: string, password: string) => {
    setIsLoading(true);
    setAuthError(null);
    const normalizedEmail = email.trim().toLowerCase();
    const { error } = await supabase.auth.signInWithPassword({
      email: normalizedEmail,
      password
    });
    if (error) {
      setIsLoading(false);
      throw new Error(error.message);
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
  };

  return (
    <AuthContext.Provider value={{ user, session, signIn, signOut, refreshUser, isLoading, authError }}>
      {authError ? (
        <div className="min-h-screen flex flex-col items-center justify-center bg-black p-6 text-center">
          <h1 className="text-2xl font-black text-destructive uppercase tracking-widest mb-4">Auth Error</h1>
          <p className="text-muted-foreground mb-8 max-w-md">{authError}</p>
          <button
            onClick={() => { setAuthError(null); window.location.reload(); }}
            className="px-8 py-3 bg-white/5 border border-white/10 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-white/10"
          >
            Prøv igen
          </button>
        </div>
      ) : children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};

