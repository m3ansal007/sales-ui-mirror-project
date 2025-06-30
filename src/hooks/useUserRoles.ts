
import { useState, useEffect } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

export type UserRole = 'Admin' | 'Sales Manager' | 'Sales Associate';

interface UserRoleData {
  id: string;
  user_id: string;
  role: UserRole;
  assigned_by: string | null;
  created_at: string;
  updated_at: string;
  is_active: boolean;
}

export const useUserRoles = (user: User | null) => {
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [allUserRoles, setAllUserRoles] = useState<UserRoleData[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchUserRole = async () => {
    if (!user) {
      setUserRole(null);
      setLoading(false);
      return;
    }

    try {
      // Get current user's role using the database function
      const { data, error } = await supabase.rpc('get_user_role');
      
      if (error) {
        console.error('Error fetching user role:', error);
        // Fallback to metadata if database role doesn't exist
        const fallbackRole = user.user_metadata?.role || user.user_metadata?.authorized_role || 'Sales Associate';
        setUserRole(fallbackRole as UserRole);
      } else {
        setUserRole(data as UserRole);
      }
    } catch (error) {
      console.error('Error in fetchUserRole:', error);
      // Fallback to metadata
      const fallbackRole = user.user_metadata?.role || user.user_metadata?.authorized_role || 'Sales Associate';
      setUserRole(fallbackRole as UserRole);
    } finally {
      setLoading(false);
    }
  };

  const fetchAllUserRoles = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('user_roles')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching all user roles:', error);
      } else {
        setAllUserRoles(data || []);
      }
    } catch (error) {
      console.error('Error in fetchAllUserRoles:', error);
    }
  };

  const updateUserRole = async (userId: string, newRole: UserRole) => {
    try {
      const { error } = await supabase
        .from('user_roles')
        .update({ 
          role: newRole, 
          updated_at: new Date().toISOString(),
          assigned_by: user?.id 
        })
        .eq('user_id', userId);

      if (error) {
        console.error('Error updating user role:', error);
        return false;
      }

      // Refresh the roles
      await fetchAllUserRoles();
      return true;
    } catch (error) {
      console.error('Error in updateUserRole:', error);
      return false;
    }
  };

  useEffect(() => {
    fetchUserRole();
    fetchAllUserRoles();
  }, [user]);

  return {
    userRole,
    allUserRoles,
    loading,
    refreshRoles: () => {
      fetchUserRole();
      fetchAllUserRoles();
    },
    updateUserRole
  };
};
