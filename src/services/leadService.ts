
import { supabase } from '@/integrations/supabase/client';
import { User } from '@supabase/supabase-js';
import { Lead, CreateLeadData, TeamMember } from '@/types/leads';

export const fetchLeadsByRole = async (userTeamMember: TeamMember): Promise<Lead[]> => {
  console.log('Fetching leads for team member:', userTeamMember.email, 'Role:', userTeamMember.role);

  const { data, error } = await supabase
    .from('leads')
    .select('*, created_by:user_id')
    .order('created_at', { ascending: false });

  if (error) throw error;
  
  // Transform the data to match our Lead type
  return (data || []).map(lead => ({
    ...lead,
    created_by: lead.user_id
  })) as Lead[];
};

export const createLead = async (leadData: CreateLeadData, user: User): Promise<Lead> => {
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
    user_id: user.id, // Keep using user_id for database insert
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
  // Transform response to match our Lead type
  return {
    ...data,
    created_by: data.user_id
  } as Lead;
};

export const updateLead = async (id: string, updates: Partial<Lead>): Promise<Lead> => {
  const updateData = { 
    ...updates, 
    updated_at: new Date().toISOString() 
  };

  // Remove created_by from updates if present, as we store user_id in database
  if ('created_by' in updateData) {
    delete updateData.created_by;
  }

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
  return {
    ...data,
    created_by: data.user_id
  } as Lead;
};

export const deleteLead = async (id: string): Promise<boolean> => {
  const { error } = await supabase
    .from('leads')
    .delete()
    .eq('id', id);

  if (error) throw error;
  return true;
};

export const assignLead = async (
  leadId: string, 
  assigneeId: string, 
  assignerId: string
): Promise<Lead> => {
  const { data, error } = await supabase
    .from('leads')
    .update({
      assigned_team_member_id: assigneeId,
      assigned_by: assignerId,
      updated_at: new Date().toISOString()
    })
    .eq('id', leadId)
    .select()
    .single();

  if (error) throw error;
  return {
    ...data,
    created_by: data.user_id
  } as Lead;
};
