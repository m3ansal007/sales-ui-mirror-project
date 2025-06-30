
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export interface Lead {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  company?: string;
  source?: string;
  status: string;
  assigned_to?: string;
  assigned_team_member_id?: string;
  notes?: string;
  value?: number;
  created_at: string;
  updated_at: string;
  user_id: string;
}

export interface CreateLeadData {
  name: string;
  email?: string;
  phone?: string;
  company?: string;
  source?: string;
  status: string;
  assigned_team_member_id?: string;
  notes?: string;
  value?: number;
}

export const useLeads = () => {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const { user, userRole } = useAuth();
  const { toast } = useToast();

  const fetchLeads = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      console.log('Fetching leads for user:', user.email, 'Role:', userRole);
      
      let query = supabase.from('leads').select('*');
      
      if (userRole === 'Admin' || userRole === 'Sales Manager') {
        console.log('Admin/Manager - fetching all leads');
        const { data, error } = await query.order('created_at', { ascending: false });
        
        if (error) throw error;
        setLeads(data || []);
      } else {
        console.log('Sales Associate - fetching user and assigned leads');
        
        // Get team member record for current user
        const { data: teamMemberData, error: teamError } = await supabase
          .from('team_members')
          .select('id')
          .eq('user_id', user.id)
          .single();

        if (teamError) {
          console.error('Error fetching team member:', teamError);
          // Fallback: get leads created by user only
          const { data, error } = await query
            .eq('user_id', user.id)
            .order('created_at', { ascending: false });
          
          if (error) throw error;
          setLeads(data || []);
        } else {
          console.log('Found team member ID:', teamMemberData.id);
          // Get leads created by user OR assigned to user
          const { data, error } = await query
            .or(`user_id.eq.${user.id},assigned_team_member_id.eq.${teamMemberData.id}`)
            .order('created_at', { ascending: false });
          
          if (error) throw error;
          setLeads(data || []);
        }
      }
      
      console.log('Fetched leads count:', leads.length);
    } catch (error) {
      console.error('Error fetching leads:', error);
      toast({
        title: "Error",
        description: "Failed to fetch leads",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!user) return;

    console.log('Setting up leads fetch and real-time subscription...');
    fetchLeads();

    const channel = supabase
      .channel('leads-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'leads'
        },
        (payload) => {
          console.log('Real-time: New lead added:', payload.new);
          const newLead = payload.new as Lead;
          setLeads(prev => {
            const exists = prev.some(lead => lead.id === newLead.id);
            if (exists) return prev;
            return [newLead, ...prev];
          });
          
          toast({
            title: "New Lead Added",
            description: `${newLead.name} has been added to your leads`,
          });
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'leads'
        },
        (payload) => {
          console.log('Real-time: Lead updated:', payload.new);
          const updatedLead = payload.new as Lead;
          setLeads(prev => prev.map(lead => 
            lead.id === updatedLead.id ? updatedLead : lead
          ));
          
          // Refresh for sales associates to ensure proper filtering
          if (userRole !== 'Admin' && userRole !== 'Sales Manager') {
            fetchLeads();
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'leads'
        },
        (payload) => {
          console.log('Real-time: Lead deleted:', payload.old);
          setLeads(prev => prev.filter(lead => lead.id !== payload.old.id));
        }
      )
      .subscribe((status) => {
        console.log('Leads subscription status:', status);
      });

    return () => {
      console.log('Cleaning up leads subscription...');
      supabase.removeChannel(channel);
    };
  }, [user, userRole, toast]);

  const createLead = async (leadData: CreateLeadData) => {
    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in to create leads",
        variant: "destructive",
      });
      return false;
    }

    try {
      console.log('Creating lead for user:', user.email);
      
      const cleanData = {
        name: leadData.name || '',
        email: leadData.email || null,
        phone: leadData.phone || null,
        company: leadData.company || null,
        source: leadData.source || null,
        status: leadData.status || 'New',
        notes: leadData.notes || null,
        value: leadData.value ? Number(leadData.value) : null,
        user_id: user.id,
        assigned_team_member_id: leadData.assigned_team_member_id || null
      };

      console.log('Creating lead with data:', cleanData);

      const { data, error } = await supabase
        .from('leads')
        .insert(cleanData)
        .select()
        .single();

      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }
      
      console.log('Lead created successfully:', data);
      
      toast({
        title: "Success",
        description: "Lead created successfully",
      });
      return true;
    } catch (error: any) {
      console.error('Error creating lead:', error);
      toast({
        title: "Error",
        description: `Failed to create lead: ${error.message}`,
        variant: "destructive",
      });
      return false;
    }
  };

  const updateLead = async (id: string, updates: Partial<Lead>) => {
    if (!user) return false;

    try {
      const updateData = { 
        ...updates, 
        updated_at: new Date().toISOString() 
      };

      console.log(`Updating lead ${id} with:`, updateData);

      const { data, error } = await supabase
        .from('leads')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Error updating lead:', error);
        throw error;
      }
      
      console.log('Lead updated successfully:', data);
      
      // Force refresh to ensure proper filtering
      await fetchLeads();
      
      return true;
    } catch (error: any) {
      console.error('Error updating lead:', error);
      toast({
        title: "Error",
        description: "Failed to update lead",
        variant: "destructive",
      });
      return false;
    }
  };

  const deleteLead = async (id: string) => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('leads')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      setLeads(prev => prev.filter(lead => lead.id !== id));
      
      toast({
        title: "Success",
        description: "Lead deleted successfully",
      });
      return true;
    } catch (error: any) {
      console.error('Error deleting lead:', error);
      toast({
        title: "Error",
        description: "Failed to delete lead",
        variant: "destructive",
      });
      return false;
    }
  };

  return {
    leads,
    loading,
    createLead,
    updateLead,
    deleteLead,
    refetch: fetchLeads,
  };
};
