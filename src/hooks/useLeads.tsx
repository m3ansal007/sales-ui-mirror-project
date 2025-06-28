
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
      console.log('Fetched leads:', data?.length || 0);
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

    console.log('Setting up leads real-time subscription...');
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
          console.log('Real-time: New lead added:', payload.new);
          const newLead = payload.new as Lead;
          setLeads(prev => {
            // Check if lead already exists to avoid duplicates
            const exists = prev.some(lead => lead.id === newLead.id);
            if (exists) {
              console.log('Lead already exists, skipping duplicate');
              return prev;
            }
            console.log('Adding new lead to state in real-time:', newLead.name);
            return [newLead, ...prev];
          });
          
          // Show toast notification for new leads
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
      supabase.removeChannel(leadsChannel);
    };
  }, [user, toast]);

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
      const cleanData = {
        name: leadData.name,
        email: leadData.email || null,
        phone: leadData.phone || null,
        company: leadData.company || null,
        source: leadData.source || null,
        status: leadData.status || 'New',
        notes: leadData.notes || null,
        value: leadData.value ? Number(leadData.value) : null,
        user_id: user.id
      };

      console.log('Creating lead:', cleanData);

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
      
      // Immediately add to state for instant UI feedback
      setLeads(prev => {
        // Check if it already exists to avoid duplicates
        if (prev.some(lead => lead.id === data.id)) {
          console.log('Lead already exists in state');
          return prev;
        }
        console.log('Adding lead immediately to state:', data.name);
        return [data, ...prev];
      });
      
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
      
      // Manual update for immediate UI response
      setLeads(prev => prev.map(lead => 
        lead.id === id ? { ...lead, ...updates } : lead
      ));
      
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
      
      // Manual update for immediate UI response
      setLeads(prev => prev.filter(lead => lead.id !== id));
      
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
