
import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase, authService, userService, UserProfile } from '@/lib/supabase';
import { toast } from '@/components/ui/sonner';

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  session: Session | null;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signInWithGithub: () => Promise<void>;
  signOut: () => Promise<void>;
  updateProfile: (data: Partial<UserProfile>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Try to restore session on component mount
    const initAuth = async () => {
      const session = await authService.getSession();
      setSession(session);
      
      if (session?.user) {
        setUser(session.user);
        
        // Fetch profile data
        const { data } = await userService.getProfile(session.user.id);
        setProfile(data as UserProfile);
      }
      
      setIsLoading(false);
    };
    
    initAuth();

    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        setUser(session?.user || null);
        
        if (session?.user) {
          const { data } = await userService.getProfile(session.user.id);
          setProfile(data as UserProfile);
        } else {
          setProfile(null);
        }
        
        setIsLoading(false);
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      setIsLoading(true);
      const { error } = await authService.signIn(email, password);
      
      if (error) throw error;
      toast.success("Signed in successfully!");
    } catch (error: any) {
      toast.error(`Error signing in: ${error.message}`);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const signUp = async (email: string, password: string) => {
    try {
      setIsLoading(true);
      const { error } = await authService.signUp(email, password);
      
      if (error) throw error;
      toast.success("Account created! Check your email for verification.");
    } catch (error: any) {
      toast.error(`Error creating account: ${error.message}`);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const signInWithGoogle = async () => {
    try {
      const { error } = await authService.signInWithOAuth('google');
      if (error) throw error;
    } catch (error: any) {
      toast.error(`Error signing in with Google: ${error.message}`);
      throw error;
    }
  };

  const signInWithGithub = async () => {
    try {
      const { error } = await authService.signInWithOAuth('github');
      if (error) throw error;
    } catch (error: any) {
      toast.error(`Error signing in with GitHub: ${error.message}`);
      throw error;
    }
  };

  const signOut = async () => {
    try {
      setIsLoading(true);
      const { error } = await authService.signOut();
      
      if (error) throw error;
      toast.success("Signed out successfully");
    } catch (error: any) {
      toast.error(`Error signing out: ${error.message}`);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const updateProfile = async (data: Partial<UserProfile>) => {
    try {
      setIsLoading(true);
      
      if (!user) throw new Error("User not authenticated");
      
      const profileData = {
        id: user.id,
        ...data
      };
      
      const { error } = await userService.upsertProfile(profileData);
      if (error) throw error;
      
      // Refresh profile data
      const { data: updatedProfile } = await userService.getProfile(user.id);
      setProfile(updatedProfile as UserProfile);
      
      toast.success("Profile updated successfully");
    } catch (error: any) {
      toast.error(`Error updating profile: ${error.message}`);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const value = {
    user,
    profile,
    session,
    isLoading,
    signIn,
    signUp,
    signInWithGoogle,
    signInWithGithub,
    signOut,
    updateProfile
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
