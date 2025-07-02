import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { TeamMember } from '@/types/leads';
import { getCurrentUserTeamMember } from '@/services/teamService';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  teamMember: TeamMember | null;
  userRole: string | null;
  loading: boolean;
  signUp: (email: string, password: string, fullName: string, role: string) => Promise<{ error: any }>;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [teamMember, setTeamMember] = useState<TeamMember | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, session?.user?.email);
        
        if (!mounted) return;
        
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          try {
            const memberData = await getCurrentUserTeamMember(session.user);
            if (mounted) {
              setTeamMember(memberData);
            }
          } catch (error) {
            console.error('Error fetching team member:', error);
            if (mounted) {
              setTeamMember(null);
            }
          }
        } else {
          if (mounted) {
            setTeamMember(null);
          }
        }
        
        // Always set loading to false after processing auth state change
        if (mounted) {
          setLoading(false);
        }
      }
    );

    // Check for existing session
    const initializeAuth = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Error getting session:', error);
          if (mounted) {
            setLoading(false);
          }
          return;
        }
        
        console.log('Initial session check:', session?.user?.email);
        
        if (mounted) {
          setSession(session);
          setUser(session?.user ?? null);
        }
        
        if (session?.user && mounted) {
          try {
            const memberData = await getCurrentUserTeamMember(session.user);
            if (mounted) {
              setTeamMember(memberData);
            }
          } catch (error) {
            console.error('Error in initial team member fetch:', error);
            if (mounted) {
              setTeamMember(null);
            }
          }
        }
        
        if (mounted) {
          setLoading(false);
        }
      } catch (error) {
        console.error('Error in initializeAuth:', error);
        if (mounted) {
          setLoading(false);
        }
      }
    };

    initializeAuth();

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signUp = async (email: string, password: string, fullName: string, role: string) => {
    const redirectUrl = `${window.location.origin}/`;
    
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          full_name: fullName,
          role: role
        }
      }
    });
    
    return { error };
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    return { error };
  };

  const signOut = async () => {
    console.log('AuthContext: Starting sign out...');
    
    // Clear state immediately
    setUser(null);
    setSession(null);
    setTeamMember(null);
    setLoading(false); // Ensure loading is false during sign out
    
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('Sign out error:', error);
    } else {
      console.log('Sign out successful');
    }
    
    // Navigate to auth page
    window.location.href = '/auth';
  };

  const value = {
    user,
    session,
    teamMember,
    userRole: teamMember?.role || null,
    loading,
    signUp,
    signIn,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};