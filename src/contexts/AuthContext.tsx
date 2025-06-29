import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  userRole: string | null;
  signUp: (email: string, password: string, fullName?: string, role?: string) => Promise<{ error: any }>;
  signIn: (email: string, password: string, selectedRole: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  updateUserRole: (role: string) => Promise<void>;
  checkUserRole: (email: string) => Promise<{ role: string | null; error: any }>;
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
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Set up auth state listener first
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, session?.user?.email);
        setSession(session);
        setUser(session?.user ?? null);
        
        // Get user role from metadata
        if (session?.user) {
          const role = session.user.user_metadata?.role || session.user.user_metadata?.authorized_role || 'Sales Associate';
          setUserRole(role);
          console.log('User role:', role);
        } else {
          setUserRole(null);
        }
        
        setLoading(false);
        
        // Only redirect to auth page after sign out, not on failed login
        if (event === 'SIGNED_OUT') {
          window.location.href = '/auth';
        }
      }
    );

    // Then check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        const role = session.user.user_metadata?.role || session.user.user_metadata?.authorized_role || 'Sales Associate';
        setUserRole(role);
      }
      
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const checkUserRole = async (email: string) => {
    try {
      // Use Supabase function to check user role without authentication
      const { data, error } = await supabase.functions.invoke('check-user-role', {
        body: { email }
      });

      if (error) {
        console.error('Error checking user role:', error);
        
        // Check if this is an environment configuration error
        if (error.message?.includes('Missing required environment variables') || 
            error.message?.includes('configuration error')) {
          return { 
            role: null, 
            error: {
              message: 'Role verification is temporarily unavailable. Please contact your administrator.',
              type: 'CONFIG_ERROR',
              details: error.message
            }
          };
        }
        
        // For other errors, allow authentication to proceed
        console.log('Role check failed, but allowing authentication to proceed:', error);
        return { role: null, error: null };
      }

      return { role: data?.role || null, error: null };
    } catch (error) {
      console.error('Error in checkUserRole:', error);
      
      // If it's a network error or fetch failure, allow authentication to proceed
      if (error instanceof TypeError && error.message.includes('fetch')) {
        console.log('Network error during role check, allowing authentication to proceed');
        return { role: null, error: null };
      }
      
      return { role: null, error };
    }
  };

  const signUp = async (email: string, password: string, fullName?: string, role?: string) => {
    const redirectUrl = `${window.location.origin}/`;
    
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          full_name: fullName || '',
          role: role || 'Sales Associate',
          authorized_role: role || 'Sales Associate' // Store the authorized role
        }
      }
    });
    
    return { error };
  };

  const signIn = async (email: string, password: string, selectedRole: string) => {
    try {
      // At this point, role verification should have already been done in the Auth component
      // So we can proceed directly with authentication
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) {
        return { error };
      }

      // Double-check role after successful authentication (safety check)
      const userAuthorizedRole = data.user?.user_metadata?.authorized_role || data.user?.user_metadata?.role;
      
      if (userAuthorizedRole && userAuthorizedRole !== selectedRole) {
        // This should not happen if pre-auth check worked, but just in case
        await supabase.auth.signOut();
        
        return { 
          error: { 
            message: `Access denied. This account is registered as ${userAuthorizedRole}, not ${selectedRole}.`,
            code: 'ROLE_MISMATCH',
            actualRole: userAuthorizedRole,
            attemptedRole: selectedRole
          } 
        };
      }

      // If role matches, update the current session role
      const { error: updateError } = await supabase.auth.updateUser({
        data: { 
          role: selectedRole,
          last_login_role: selectedRole,
          last_login_at: new Date().toISOString()
        }
      });

      if (updateError) {
        console.error('Error updating user role:', updateError);
        // Don't fail login for this, just log the error
      }
      
      return { error: null };
    } catch (error) {
      console.error('Sign in error:', error);
      return { error: { message: 'An unexpected error occurred during login' } };
    }
  };

  const updateUserRole = async (role: string) => {
    try {
      // Check if user is authorized for this role
      const currentUser = user;
      if (!currentUser) {
        throw new Error('No user logged in');
      }

      const authorizedRole = currentUser.user_metadata?.authorized_role || currentUser.user_metadata?.role;
      
      if (authorizedRole !== role) {
        throw new Error(`You are not authorized to access the ${role} role. Your account is registered as ${authorizedRole}.`);
      }

      const { error } = await supabase.auth.updateUser({
        data: { 
          role,
          last_role_change: new Date().toISOString()
        }
      });
      
      if (error) {
        console.error('Error updating user role:', error);
        throw error;
      }
      
      // Update local state immediately
      setUserRole(role);
      console.log('User role updated to:', role);
    } catch (error) {
      console.error('Failed to update user role:', error);
      throw error;
    }
  };

  const signOut = async () => {
    try {
      console.log('Starting sign out process...');
      
      // Clear local state immediately to prevent UI issues
      setUser(null);
      setSession(null);
      setUserRole(null);
      
      // Attempt to sign out from Supabase
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        console.error('Sign out error:', error);
        // Even if there's an error, we've already cleared local state
        // This handles cases where the session might be stale
      } else {
        console.log('Sign out successful');
      }
      
      // Force redirect to auth page regardless of error
      // This ensures user is logged out from the UI perspective
      setTimeout(() => {
        window.location.href = '/auth';
      }, 100);
      
    } catch (error) {
      console.error('Unexpected sign out error:', error);
      
      // Even on unexpected errors, clear state and redirect
      setUser(null);
      setSession(null);
      setUserRole(null);
      
      setTimeout(() => {
        window.location.href = '/auth';
      }, 100);
    }
  };

  const value = {
    user,
    session,
    loading,
    userRole,
    signUp,
    signIn,
    signOut,
    updateUserRole,
    checkUserRole,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};