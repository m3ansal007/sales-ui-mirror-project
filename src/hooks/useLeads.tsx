
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

type DatabaseLead = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  company: string | null;
  source: string | null;
  status: string;
  assigned_to: string | null;
  assigned_team_member_id: string | null;
  notes: string | null;
  value: number | null;
  created_at: string;
  updated_at: string;
  user_id: string;
};

export const useLeads = () => {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const { user, userRole } = useAuth();
  const { toast } = useToast();

  const transformLead = (dbLead: DatabaseLead): Lead => ({
    id: dbLead.id,
    name: dbLead.name,
    email: dbLead.email || undefined,
    phone: dbLead.phone || undefined,
    company: dbLead.company || undefined,
    source: dbLead.source || undefined,
    status: dbLead.status,
    assigned_to: dbLead.assigned_to || undefined,
    assigned_team_member_id: dbLead.assigned_team_member_id || undefined,
    notes: dbLead.notes || undefined,
    value: dbLead.value || undefined,
    created_at: dbLead.created_at,
    updated_at: dbLead.updated_at,
    user_id: dbLead.user_id,
  });

  const fetchLeads = async (): Promise<void> => {
    if (!user) return;
    
    try {
      let allLeads: Lead[] = [];
      
      if (userRole === 'Admin' || userRole === 'Sales Manager') {
        const response = await supabase
          .from('leads')
          .select('*')
          .order('created_at', { ascending: false });
        
        if (response.error) throw response.error;
        allLeads = (response.data as DatabaseLead[])?.map(transformLead) || [];
      } else {
        // Sales associates see their own leads + leads assigned to them
        const teamMemberResponse = await supabase
          .from('team_members')
          .select('id')
          .eq('user_id', user.id)
          .limit(1);

        if (teamMemberResponse.error) {
          console.error('Error fetching team member:', teamMemberResponse.error);
          // Fallback to just their own leads
          const ownLeadsResponse = await supabase
            .from('leads')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false });
          
          if (ownLeadsResponse.error) throw ownLeadsResponse.error;
          allLeads = (ownLeadsResponse.data as DatabaseLead[])?.map(transformLead) || [];
        } else if (teamMemberResponse.data && teamMemberResponse.data.length > 0) {
          const teamMemberId = teamMemberResponse.data[0].id;
          
          // Get own leads
          const ownLeadsResponse = await supabase
            .from('leads')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false });

          // Get assigned leads
          const assignedLeadsResponse = await supabase
            .from('leads')
            .select('*')
            .eq('assigned_team_member_id', teamMemberId)
            .order('created_at', { ascending: false });

          if (ownLeadsResponse.error) throw ownLeadsResponse.error;
          if (assignedLeadsResponse.error) throw assignedLeadsResponse.error;

          const ownLeads = (ownLeadsResponse.data as DatabaseLead[])?.map(transformLead) || [];
          const assignedLeads = (assignedLeadsResponse.data as DatabaseLead[])?.map(transformLead) || [];

          // Combine and deduplicate
          const combined = [...ownLeads, ...assignedLeads];
          const unique = combined.filter((lead, index, self) => 
            index === self.findIndex(l => l.id === lead.id)
          );
          allLeads = unique.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        } else {
          // No team member record, just show own leads
          const ownLeadsResponse = await supabase
            .from('leads')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false });
          
          if (ownLeadsResponse.error) throw ownLeadsResponse.error;
          allLeads = (ownLeadsResponse.data as DatabaseLead[])?.map(transformLead) || [];
        }
      }

      console.log('Fetched leads:', allLeads?.length || 0);
      setLeads(allLeads || []);
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

  // Set up real-time subscription
  useEffect(() => {
    if (!user) return;

    console.log('Setting up leads real-time subscription...');
    fetchLeads();

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
          const newLead = transformLead(payload.new as DatabaseLead);
          setLeads(prev => {
            const exists = prev.some(lead => lead.id === newLead.id);
            if (exists) {
              console.log('Lead already exists, skipping duplicate');
              return prev;
            }
            console.log('Adding new lead to state:', newLead.name);
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
          const updatedLead = transformLead(payload.new as DatabaseLead);
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
  }, [user, userRole, toast]);

  const checkForDuplicate = (leadData: CreateLeadData) => {
    const { name, email, phone } = leadData;
    
    if (!name) return { isDuplicate: false };
    
    const duplicates = leads.filter(lead => 
      lead.name.toLowerCase().trim() === name.toLowerCase().trim()
    );

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

  const createLead = async (leadData: CreateLeadData) => {
    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in to create leads",
        variant: "destructive",
      });
      return false;
    }

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

      const response = await supabase
        .from('leads')
        .insert(cleanData)
        .select()
        .single();

      if (response.error) {
        console.error('Supabase error:', response.error);
        
        if (response.error.message.includes('duplicate') || response.error.code === '23505') {
          toast({
            title: "Duplicate Lead",
            description: "A lead with this information already exists.",
            variant: "destructive",
          });
          return false;
        }
        
        throw response.error;
      }
      
      console.log('Lead created successfully:', response.data);
      
      const assignmentMessage = response.data.assigned_team_member_id 
        ? "Lead created and assigned successfully"
        : "Lead created successfully";
      
      toast({
        title: "Success",
        description: assignmentMessage,
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

    if (updates.name || updates.email || updates.phone) {
      const currentLead = leads.find(lead => lead.id === id);
      if (currentLead) {
        const updatedLeadData = { ...currentLead, ...updates };
        const otherLeads = leads.filter(lead => lead.id !== id);
        const tempLeads = leads;
        setLeads(otherLeads);
        
        const duplicateCheck = checkForDuplicate(updatedLeadData);
        setLeads(tempLeads);
        
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
      const updateData = { 
        ...updates, 
        updated_at: new Date().toISOString() 
      };

      console.log(`Updating lead ${id} with:`, updateData);

      const response = await supabase
        .from('leads')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (response.error) {
        console.error('Error updating lead:', response.error);
        if (response.error.message.includes('duplicate') || response.error.code === '23505') {
          toast({
            title: "Duplicate Lead",
            description: "A lead with this information already exists.",
            variant: "destructive",
          });
          return false;
        }
        throw response.error;
      }
      
      console.log('Lead updated successfully:', response.data);
      
      setLeads(prev => prev.map(lead => 
        lead.id === id ? { ...lead, ...updates } : lead
      ));
      
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
      const response = await supabase
        .from('leads')
        .delete()
        .eq('id', id);

      if (response.error) throw response.error;
      
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
