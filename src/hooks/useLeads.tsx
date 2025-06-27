
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
  notes?: string;
  value?: number;
  created_at: string;
  updated_at: string;
}

export const useLeads = () => {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchLeads = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('leads')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setLeads(data || []);
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

  // Set up real-time subscription for leads
  useEffect(() => {
    if (!user) return;

    fetchLeads();

    // Subscribe to real-time changes
    const leadsChannel = supabase
      .channel('leads-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'leads'
        },
        (payload) => {
          console.log('New lead added:', payload.new);
          setLeads(prev => [payload.new as Lead, ...prev]);
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
          console.log('Lead updated:', payload.new);
          setLeads(prev => prev.map(lead => 
            lead.id === payload.new.id ? payload.new as Lead : lead
          ));
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
          console.log('Lead deleted:', payload.old);
          setLeads(prev => prev.filter(lead => lead.id !== payload.old.id));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(leadsChannel);
    };
  }, [user]);

  const createLead = async (leadData: Omit<Lead, 'id' | 'created_at' | 'updated_at'>) => {
    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in to create leads",
        variant: "destructive",
      });
      return false;
    }

    try {
      // Clean the data before insertion
      const cleanData = {
        name: leadData.name,
        email: leadData.email || null,
        phone: leadData.phone || null,
        company: leadData.company || null,
        source: leadData.source || null,
        status: leadData.status || 'New',
        notes: leadData.notes || null,
        value: leadData.value || null,
        user_id: user.id
      };

      console.log('Inserting lead data:', cleanData);

      const { data, error } = await supabase
        .from('leads')
        .insert(cleanData)
        .select()
        .single();

      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }
      
      // No need to manually update state here - real-time will handle it
      toast({
        title: "Success",
        description: "Lead created successfully",
      });
      return true;
    } catch (error) {
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
      const { data, error } = await supabase
        .from('leads')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      
      // No need to manually update state here - real-time will handle it
      toast({
        title: "Success",
        description: "Lead updated successfully",
      });
      return true;
    } catch (error) {
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
      
      // No need to manually update state here - real-time will handle it
      toast({
        title: "Success",
        description: "Lead deleted successfully",
      });
      return true;
    } catch (error) {
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
