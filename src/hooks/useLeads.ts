
import { useState, useEffect, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Lead, CreateLeadData } from '@/types/leads';
import { fetchLeadsByRole, createLead as createLeadService, updateLead as updateLeadService, deleteLead as deleteLeadService } from '@/services/leadService';
import { useAuth } from '@/contexts/AuthContext';

export const useLeads = () => {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const { user, teamMember } = useAuth();
  const { toast } = useToast();

  const fetchLeads = useCallback(async () => {
    if (!user || !teamMember) {
      setLoading(false);
      return;
    }

    try {
      const fetchedLeads = await fetchLeadsByRole(teamMember);
      setLeads(fetchedLeads);
      
      console.log('Fetched leads count:', fetchedLeads.length);
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
  }, [user, teamMember, toast]);

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
      
      // Refresh leads
      await fetchLeads();
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
      
      // Refresh leads
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

  // Categorize leads based on user role and relationship
  const categorizedLeads = {
    myLeads: leads.filter(lead => lead.created_by === user?.id),
    assignedToMe: leads.filter(lead => lead.assigned_team_member_id === teamMember?.id && lead.created_by !== user?.id),
    teamLeads: leads.filter(lead => 
      lead.created_by !== user?.id && 
      lead.assigned_team_member_id !== teamMember?.id
    ),
    allLeads: leads
  };

  return {
    leads,
    categorizedLeads,
    loading,
    createLead,
    updateLead,
    deleteLead,
    refetch: fetchLeads,
  };
};
