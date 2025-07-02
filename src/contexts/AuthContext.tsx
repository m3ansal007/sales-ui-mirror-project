
import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';

interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: string;
  status: string;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  userRole: string | null;
  teamMember: TeamMember | null;
  loading: boolean;
  signIn: (email: string, password: string, role?: string) => Promise<{ error?: any }>;
  signUp: (email: string, password: string, fullName: string, role?: string) => Promise<{ error?: any }>;
  signOut: () => Promise<void>;
  checkUserRole: (email: string) => Promise<{ role?: string; error?: any }>;
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
  const [userRole, setUserRole] = useState<string | null>(null);
  const [teamMember, setTeamMember] = useState<TeamMember | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const fetchUserRole = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .eq('is_active', true)
        .single();

      if (error) {
        console.error('Error fetching user role:', error);
        return null;
      }

      return data?.role || null;
    } catch (error) {
      console.error('Error in fetchUserRole:', error);
      return null;
    }
  };

  const fetchTeamMember = async (userEmail: string) => {
    try {
      const { data, error } = await supabase
        .from('team_members')
        .select('*')
        .eq('email', userEmail)
        .single();

      if (error) {
        console.error('Error fetching team member:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error in fetchTeamMember:', error);
      return null;
    }
  };

  const signIn = async (email: string, password: string, role?: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        return { error };
      }

      return { error: null };
    } catch (error) {
      return { error };
    }
  };

  const signUp = async (email: string, password: string, fullName: string, role?: string) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            role: role || 'Sales Associate',
          },
          emailRedirectTo: `${window.location.origin}/`,
        },
      });

      if (error) {
        return { error };
      }

      return { error: null };
    } catch (error) {
      return { error };
    }
  };

  const checkUserRole = async (email: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('check-user-role', {
        body: { email },
      });

      if (error) {
        return { error };
      }

      return { role: data?.role };
    } catch (error) {
      return { error };
    }
  };

  useEffect(() => {
    let mounted = true;

    const initializeAuth = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Error getting session:', error);
          if (mounted) {
            setUser(null);
            setSession(null);
            setUserRole(null);
            setTeamMember(null);
            setLoading(false);
          }
          return;
        }

        if (session?.user) {
          if (mounted) {
            setUser(session.user);
            setSession(session);
          }

          // Fetch user role
          const role = await fetchUserRole(session.user.id);
          if (mounted) {
            setUserRole(role);
          }

          // Fetch team member info if user has email
          if (session.user.email) {
            const member = await fetchTeamMember(session.user.email);
            if (mounted) {
              setTeamMember(member);
            }
          }
        } else {
          if (mounted) {
            setUser(null);
            setSession(null);
            setUserRole(null);
            setTeamMember(null);
          }
        }
      } catch (error) {
        console.error('Error in initializeAuth:', error);
        if (mounted) {
          setUser(null);
          setSession(null);
          setUserRole(null);
          setTeamMember(null);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    initializeAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return;

        console.log('Auth state changed:', event, session);

        if (event === 'SIGNED_IN' && session?.user) {
          setUser(session.user);
          setSession(session);
          
          // Fetch user role
          const role = await fetchUserRole(session.user.id);
          setUserRole(role);

          // Fetch team member info
          if (session.user.email) {
            const member = await fetchTeamMember(session.user.email);
            setTeamMember(member);
          }

          setLoading(false);
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
          setSession(null);
          setUserRole(null);
          setTeamMember(null);
          setLoading(false);
          navigate('/auth');
        } else {
          setLoading(false);
        }
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [navigate]);

  const signOut = async () => {
    try {
      // Clear state immediately
      setUser(null);
      setSession(null);
      setUserRole(null);
      setTeamMember(null);
      setLoading(false);
      
      // Sign out from Supabase
      await supabase.auth.signOut();
      
      // Navigate to auth page
      navigate('/auth');
    } catch (error) {
      console.error('Error signing out:', error);
      // Even if there's an error, clear the state and navigate
      setUser(null);
      setSession(null);
      setUserRole(null);
      setTeamMember(null);
      setLoading(false);
      navigate('/auth');
    }
  };

  const value = {
    user,
    session,
    userRole,
    teamMember,
    loading,
    signIn,
    signUp,
    signOut,
    checkUserRole,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
