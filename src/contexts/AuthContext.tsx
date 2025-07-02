
import React, { createContext, useContext, useEffect, useState } from 'react';
import { User } from '@supabase/supabase-js';
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
  userRole: string | null;
  teamMember: TeamMember | null;
  loading: boolean;
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

  useEffect(() => {
    let mounted = true;

    const initializeAuth = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Error getting session:', error);
          if (mounted) {
            setUser(null);
            setUserRole(null);
            setTeamMember(null);
            setLoading(false);
          }
          return;
        }

        if (session?.user) {
          if (mounted) {
            setUser(session.user);
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
            setUserRole(null);
            setTeamMember(null);
          }
        }
      } catch (error) {
        console.error('Error in initializeAuth:', error);
        if (mounted) {
          setUser(null);
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
      setUserRole(null);
      setTeamMember(null);
      setLoading(false);
      navigate('/auth');
    }
  };

  const value = {
    user,
    userRole,
    teamMember,
    loading,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
