import { createContext, useContext, useEffect, useState } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import { useNavigate } from "react-router-dom";
import { isDemoMode } from "@/lib/demoData";

// Demo user for Demo Mode
const DEMO_USER: User = {
  id: "demo-user-id",
  aud: "authenticated",
  role: "authenticated",
  email: "demo@exemplo.pt",
  email_confirmed_at: new Date().toISOString(),
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  app_metadata: {},
  user_metadata: { nome: "Utilizador Demo" },
} as User;

const DEMO_SESSION: Session = {
  access_token: "demo-access-token",
  token_type: "bearer",
  expires_in: 3600,
  refresh_token: "demo-refresh-token",
  user: DEMO_USER,
  expires_at: Math.floor(Date.now() / 1000) + 3600,
} as Session;

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signUp: (email: string, password: string, nome: string) => Promise<{ error: any }>;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(isDemoMode() ? DEMO_USER : null);
  const [session, setSession] = useState<Session | null>(isDemoMode() ? DEMO_SESSION : null);
  const [loading, setLoading] = useState(!isDemoMode());
  const navigate = useNavigate();

  useEffect(() => {
    // Skip auth setup in demo mode
    if (isDemoMode()) {
      return;
    }

    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email: string, password: string, nome: string) => {
    const redirectUrl = `${window.location.origin}/`;
    
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          nome
        }
      }
    });
    
    if (!error) {
      navigate("/");
    }
    
    return { error };
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    if (!error) {
      navigate("/");
    }
    
    return { error };
  };

  const signOut = async () => {
    if (isDemoMode()) {
      // In demo mode, just redirect to auth page (simulated)
      navigate("/auth");
      return;
    }
    await supabase.auth.signOut();
    navigate("/auth");
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, signUp, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
