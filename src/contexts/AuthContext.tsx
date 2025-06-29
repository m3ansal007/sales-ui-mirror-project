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
  const [isSigningOut, setIsSigningOut] = useState(false);

  useEffect(() => {
    // Set up auth state listener first
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, session?.user?.email);
        
        // If we're in the middle of signing out, ignore state changes temporarily
        if (isSigningOut && event === 'SIGNED_IN') {
          console.log('Ignoring sign in event during sign out process');
          return;
        }
        
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
        if (event === 'SIGNED_OUT' && !isSigningOut) {
          console.log('User signed out, redirecting to auth page');
          setTimeout(() => {
            window.location.href = '/auth';
          }, 100);
        }
      }
    );

    // Then check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!isSigningOut) {
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          const role = session.user.user_metadata?.role || session.user.user_metadata?.authorized_role || 'Sales Associate';
          setUserRole(role);
        }
      }
      
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [isSigningOut]);

  const checkUserRole = async (email: string) => {
    try {
      console.log('Checking user role for:', email);
      
      // Use Supabase function to check user role without authentication
      const { data, error } = await supabase.functions.invoke('check-user-role', {
        body: { email }
      });

      if (error) {
        console.error('Error from Edge Function:', error);
        
        // Handle different types of errors from the Edge Function
        if (error.context?.body) {
          const errorBody = error.context.body;
          
          // Check if this is a configuration error
          if (errorBody.type === 'CONFIG_ERROR') {
            return { 
              role: null, 
              error: {
                message: 'Role verification is temporarily unavailable. Please contact your administrator.',
                type: 'CONFIG_ERROR',
                details: errorBody.details || errorBody.error
              }
            };
          }
          
          // Check if this is a network error
          if (errorBody.type === 'NETWORK_ERROR') {
            console.log('Network error during role check, allowing authentication to proceed');
            return { role: null, error: null };
          }
          
          // Check if user was not found
          if (errorBody.type === 'USER_NOT_FOUND') {
            console.log('User not found in role check, allowing authentication to proceed');
            return { role: null, error: null };
          }
          
          // For other specific errors, return them
          return { 
            role: null, 
            error: {
              message: errorBody.error || 'Role verification failed',
              type: errorBody.type || 'UNKNOWN_ERROR',
              details: errorBody.details
            }
          };
        }
        
        // Handle generic function invocation errors
        if (error.message?.includes('Failed to send a request to the Edge Function')) {
          console.log('Edge Function request failed, allowing authentication to proceed');
          return { role: null, error: null };
        }
        
        // For other errors, allow authentication to proceed
        console.log('Role check failed, but allowing authentication to proceed:', error);
        return { role: null, error: null };
      }

      console.log('Role check response:', data);
      return { role: data?.role || null, error: null };
    } catch (error) {
      console.error('Error in checkUserRole:', error);
      
      // If it's a network error or fetch failure, allow authentication to proceed
      if (error instanceof TypeError && error.message.includes('fetch')) {
        console.log('Network error during role check, allowing authentication to proceed');
        return { role: null, error: null };
      }
      
      // For any other unexpected errors, allow authentication to proceed
      console.log('Unexpected error during role check, allowing authentication to proceed:', error);
      return { role: null, error: null };
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
      setIsSigningOut(true);
      
      // Clear local state immediately to prevent UI issues
      setUser(null);
      setSession(null);
      setUserRole(null);
      
      // Clear any stored session data in localStorage
      localStorage.removeItem('supabase.auth.token');
      localStorage.removeItem('sb-uuymgkqkvwixukutvabw-auth-token');
      
      // Attempt to sign out from Supabase
      const { error } = await supabase.auth.signOut({
        scope: 'global' // This ensures all sessions are cleared
      });
      
      if (error) {
        console.error('Sign out error from Supabase:', error);
        // Even if there's an error, continue with cleanup
      } else {
        console.log('Supabase sign out successful');
      }
      
      // Force clear the session by refreshing the page after a short delay
      setTimeout(() => {
        setIsSigningOut(false);
        window.location.href = '/auth';
      }, 500);
      
    } catch (error) {
      console.error('Unexpected sign out error:', error);
      
      // Even on unexpected errors, clear state and redirect
      setUser(null);
      setSession(null);
      setUserRole(null);
      setIsSigningOut(false);
      
      // Clear localStorage as fallback
      localStorage.clear();
      
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