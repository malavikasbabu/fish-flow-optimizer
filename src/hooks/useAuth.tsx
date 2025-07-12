
import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signUp: (email: string, password: string, fullName?: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  profile: any;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          // Fetch user profile
          setTimeout(async () => {
            const { data: profileData } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', session.user.id)
              .single();
            setProfile(profileData);
          }, 0);
        } else {
          setProfile(null);
        }
        
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

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    if (error) {
      // Special handling for admin credentials
      if (error.message.includes('Invalid login credentials') && 
          email === 'admin@gmail.com' && password === 'admin') {
        const { error: signUpError } = await supabase.auth.signUp({
          email: 'admin@gmail.com',
          password: 'admin',
          options: {
            emailRedirectTo: `${window.location.origin}/`,
            data: {
              full_name: 'Administrator',
            },
          },
        });
        
        if (signUpError) {
          // If user already exists, try to sign in again
          if (signUpError.message.includes('already registered')) {
            const { error: retryError } = await supabase.auth.signInWithPassword({
              email: 'admin@gmail.com',
              password: 'admin',
            });
            if (retryError) {
              toast.error('Admin login failed. Please check credentials.');
              return { error: retryError };
            } else {
              toast.success('Admin signed in successfully!');
              return { error: null };
            }
          } else {
            toast.error(signUpError.message);
            return { error: signUpError };
          }
        } else {
          toast.success('Admin account created! Please check email to verify.');
          return { error: signUpError };
        }
      } else {
        toast.error(error.message);
      }
    } else {
      toast.success('Welcome back!');
    }
    
    return { error };
  };

  const signUp = async (email: string, password: string, fullName?: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/`,
        data: {
          full_name: fullName,
        },
      },
    });
    
    if (error) {
      if (error.message.includes('already registered')) {
        toast.error('User already exists. Please sign in instead.');
      } else {
        toast.error(error.message);
      }
    } else {
      toast.success('Account created! You can now sign in.');
    }
    
    return { error };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    toast.success('Signed out successfully');
  };

  return (
    <AuthContext.Provider value={{
      user,
      session,
      loading,
      signIn,
      signUp,
      signOut,
      profile,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
