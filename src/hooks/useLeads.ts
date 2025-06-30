
import { useState, useEffect, useCallback } from 'react';
import { User } from '@supabase/supabase-js';
import { useToast } from '@/hooks/use-toast';
import { Lead, CreateLeadData } from '@/types/leads';
import { fetchLeadsByRole, createLead as createLeadService, updateLead as updateLeadService, deleteLead as deleteLeadService } from '@/services/leadService';
import { useLeadRealtime } from '@/hooks/useLeadRealtime';

export const useLeads = (user: User | null, userRole: string | null) => {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [assignedLeads, setAssignedLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchLeads = useCallback(async () => {
    if (!user || !userRole) {
      setLoading(false);
      return;
    }

    try {
      const { leads: fetchedLeads, assignedLeads: fetchedAssignedLeads } = await fetchLeadsByRole(user, userRole);
      setLeads(fetchedLeads);
      setAssignedLeads(fetchedAssignedLeads);
      
      console.log('Fetched leads count:', fetchedLeads.length, 'Assigned leads count:', fetchedAssignedLeads.length);
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
  }, [user, userRole, toast]);

  const handleLeadAdded = useCallback((newLead: Lead) => {
    setLeads(prev => {
      const exists = prev.some(lead => lead.id === newLead.id);
      if (exists) return prev;
      return [newLead, ...prev];
    });
  }, []);

  const handleLeadDeleted = useCallback((id: string) => {
    setLeads(prev => prev.filter(lead => lead.id !== id));
    setAssignedLeads(prev => prev.filter(lead => lead.id !== id));
  }, []);

  useLeadRealtime({
    user,
    userRole,
    onLeadAdded: handleLeadAdded,
    onLeadUpdated: fetchLeads,
    onLeadDeleted: handleLeadDeleted,
    toast
  });

  useEffect(() => {
    fetchLeads();
  }, [fetchLeads]);

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
      await createLeadService(leadData, user);
      
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
      await updateLeadService(id, updates);
      
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
      await deleteLeadService(id);
      
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

// Re-export types for backward compatibility
export type { Lead, CreateLeadData };
