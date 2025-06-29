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

  // Check for duplicate leads
  const checkForDuplicate = (leadData: Omit<Lead, 'id' | 'created_at' | 'updated_at'>) => {
    const { name, email, phone } = leadData;
    
    // Find leads with the same name
    const duplicates = leads.filter(lead => 
      lead.name.toLowerCase().trim() === name.toLowerCase().trim()
    );

    // Check if any of these leads also have the same email or phone
    for (const duplicate of duplicates) {
      const sameEmail = email && duplicate.email && 
        email.toLowerCase().trim() === duplicate.email.toLowerCase().trim();
      const samePhone = phone && duplicate.phone && 
        phone.trim() === duplicate.phone.trim();

      if (sameEmail && samePhone) {
        return {
          isDuplicate: true,
          message: `A lead with the name "${name}", email "${email}", and phone "${phone}" already exists.`
        };
      } else if (sameEmail) {
        return {
          isDuplicate: true,
          message: `A lead with the name "${name}" and email "${email}" already exists.`
        };
      } else if (samePhone) {
        return {
          isDuplicate: true,
          message: `A lead with the name "${name}" and phone "${phone}" already exists.`
        };
      }
    }

    return { isDuplicate: false };
  };

  const createLead = async (leadData: Omit<Lead, 'id' | 'created_at' | 'updated_at'>) => {
    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in to create leads",
        variant: "destructive",
      });
      return false;
    }

    // Check for duplicates before creating
    const duplicateCheck = checkForDuplicate(leadData);
    if (duplicateCheck.isDuplicate) {
      toast({
        title: "Duplicate Lead",
        description: duplicateCheck.message,
        variant: "destructive",
      });
      return false;
    }

    try {
      // Get current user's team member record to link the lead
      const { data: teamMember } = await supabase
        .from('team_members')
        .select('id')
        .eq('email', user.email)
        .single();

      const cleanData = {
        name: leadData.name,
        email: leadData.email || null,
        phone: leadData.phone || null,
        company: leadData.company || null,
        source: leadData.source || null,
        status: leadData.status || 'New',
        notes: leadData.notes || null,
        value: leadData.value ? Number(leadData.value) : null,
        user_id: user.id,
        assigned_to: user.email, // Assign to current user's email
        assigned_team_member_id: teamMember?.id || null // Link to team member if exists
      };

      console.log('Creating lead with team member assignment:', cleanData);

      const { data, error } = await supabase
        .from('leads')
        .insert(cleanData)
        .select()
        .single();

      if (error) {
        console.error('Supabase error:', error);
        
        // Check if it's a duplicate error from the database
        if (error.message.includes('duplicate') || error.code === '23505') {
          toast({
            title: "Duplicate Lead",
            description: "A lead with this information already exists.",
            variant: "destructive",
          });
          return false;
        }
        
        throw error;
      }
      
      console.log('Lead created successfully:', data);
      
      // Don't immediately add to state - let the real-time subscription handle it
      // This prevents duplicate entries and ensures proper real-time behavior
      
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

    // If updating name, email, or phone, check for duplicates
    if (updates.name || updates.email || updates.phone) {
      const currentLead = leads.find(lead => lead.id === id);
      if (currentLead) {
        const updatedLeadData = {
          ...currentLead,
          ...updates
        };
        
        // Check for duplicates excluding the current lead
        const otherLeads = leads.filter(lead => lead.id !== id);
        const tempLeads = leads;
        setLeads(otherLeads); // Temporarily exclude current lead from duplicate check
        
        const duplicateCheck = checkForDuplicate(updatedLeadData);
        setLeads(tempLeads); // Restore original leads array
        
        if (duplicateCheck.isDuplicate) {
          toast({
            title: "Duplicate Lead",
            description: duplicateCheck.message,
            variant: "destructive",
          });
          return false;
        }
      }
    }

    try {
      const { data, error } = await supabase
        .from('leads')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        // Check if it's a duplicate error from the database
        if (error.message.includes('duplicate') || error.code === '23505') {
          toast({
            title: "Duplicate Lead",
            description: "A lead with this information already exists.",
            variant: "destructive",
          });
          return false;
        }
        throw error;
      }
      
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