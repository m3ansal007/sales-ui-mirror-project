
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { User } from '@supabase/supabase-js';
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

export const useLeads = (user: User | null, userRole: string | null) => {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [assignedLeads, setAssignedLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchLeads = async () => {
    if (!user || !userRole) {
      setLoading(false);
      return;
    }

    try {
      console.log('Fetching leads for user:', user.email, 'Role:', userRole);
      
      let query = supabase.from('leads').select('*');
      const normalizedRole = userRole?.toLowerCase();

      if (normalizedRole === 'admin' || normalizedRole === 'sales_manager') {
        query = query.order('created_at', { ascending: false });
        
        const { data, error } = await query;
        if (error) throw error;
        
        setLeads(data || []);
        setAssignedLeads([]);
      } else if (normalizedRole === 'sales_associate') {
        const { data: teamMemberData, error: tmError } = await supabase
          .from('team_members')
          .select('id')
          .eq('user_id', user.id)
          .single();

        if (tmError || !teamMemberData) {
          console.log('No team member data found, fallback to user-created leads');
          // If no team member data, fallback to user-created leads
          query = query.eq('user_id', user.id).order('created_at', { ascending: false });
          
          const { data, error } = await query;
          if (error) throw error;
          
          setLeads(data || []);
          setAssignedLeads([]);
        } else {
          console.log('Found team member ID:', teamMemberData.id);
          
          // Get leads created by user
          const { data: createdLeads, error: createdError } = await supabase
            .from('leads')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false });
          
          if (createdError) throw createdError;
          
          // Get leads assigned to user (but not created by them)
          const { data: assignedLeadsData, error: assignedError } = await supabase
            .from('leads')
            .select('*')
            .eq('assigned_team_member_id', teamMemberData.id)
            .neq('user_id', user.id)
            .order('created_at', { ascending: false });
          
          if (assignedError) throw assignedError;
          
          setLeads(createdLeads || []);
          setAssignedLeads(assignedLeadsData || []);
        }
      }
      
      console.log('Fetched leads count:', leads.length, 'Assigned leads count:', assignedLeads.length);
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
    if (!user || !userRole) return;

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
          
          // For sales associates, check if it's their lead or assigned to them
          if (userRole?.toLowerCase() !== 'admin' && userRole?.toLowerCase() !== 'sales_manager') {
            fetchLeads(); // Refresh to properly categorize
          } else {
            setLeads(prev => {
              const exists = prev.some(lead => lead.id === newLead.id);
              if (exists) return prev;
              return [newLead, ...prev];
            });
          }
          
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
          fetchLeads(); // Always refresh on update to ensure proper categorization
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
          setAssignedLeads(prev => prev.filter(lead => lead.id !== payload.old.id));
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
      
      // Force refresh to ensure proper categorization
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
      setAssignedLeads(prev => prev.filter(lead => lead.id !== id));
      
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
    assignedLeads,
    loading,
    createLead,
    updateLead,
    deleteLead,
    refetch: fetchLeads,
  };
};
