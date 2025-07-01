
import { supabase } from '@/integrations/supabase/client';
import { User } from '@supabase/supabase-js';
import { Lead, CreateLeadData } from '@/types/leads';

export const fetchLeadsByRole = async (user: User, userRole: string) => {
  console.log('Fetching leads for user:', user.email, 'Role:', userRole);
  const normalizedRole = userRole?.toLowerCase();

  // Admin: See all leads
  if (normalizedRole === 'admin') {
    const { data, error } = await supabase
      .from('leads')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return { leads: data || [], assignedLeads: [] };
  }

  // Sales Manager
  if (normalizedRole === 'sales_manager') {
    // Get team member ID for manager
    const { data: managerMember, error: tmError } = await supabase
      .from('team_members')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (!managerMember || tmError) {
      return { leads: [], assignedLeads: [] };
    }

    // 1. Leads created by the manager
    const createdLeadsRes = await supabase
      .from('leads')
      .select('*')
      .eq('user_id', user.id);

    const createdLeads: Lead[] = createdLeadsRes.data || [];

    // 2. Leads assigned to the manager
    const assignedToManagerRes = await supabase
      .from('leads')
      .select('*')
      .eq('assigned_team_member_id', managerMember.id);

    const assignedToManager: Lead[] = assignedToManagerRes.data || [];

    // 3. Leads assigned to the manager's team (sales associates)
    const teamAssociatesRes = await supabase
      .from('team_members')
      .select('id')
      .eq('manager_id', managerMember.id);

    const associateIds: string[] = (teamAssociatesRes.data || []).map((tm: { id: string }) => tm.id);

    let leadsForTeam: Lead[] = [];
    if (associateIds.length > 0) {
      const teamLeadsRes = await supabase
        .from('leads')
        .select('*')
        .in('assigned_team_member_id', associateIds);

      leadsForTeam = teamLeadsRes.data || [];
    }

    // Combine leads using concat instead of spread to avoid type issues
    const allLeads: Lead[] = createdLeads.concat(assignedToManager, leadsForTeam);

    return {
      leads: allLeads,
      assignedLeads: assignedToManager
    };
  }

  // Sales Associate
  if (normalizedRole === 'sales_associate') {
    // Get their team member ID
    const { data: associateMember, error: assocError } = await supabase
      .from('team_members')
      .select('id')
      .eq('user_id', user.id)
      .single();

    const createdRes = await supabase
      .from('leads')
      .select('*')
      .eq('user_id', user.id);

    const createdLeads: Lead[] = createdRes.data || [];

    let assignedLeads: Lead[] = [];

    if (associateMember && !assocError) {
      const assignedRes = await supabase
        .from('leads')
        .select('*')
        .eq('assigned_team_member_id', associateMember.id)
        .neq('user_id', user.id);

      assignedLeads = assignedRes.data || [];
    }

    // Combine leads using concat instead of spread
    const allLeads: Lead[] = createdLeads.concat(assignedLeads);

    return {
      leads: allLeads,
      assignedLeads
    };
  }

  return { leads: [], assignedLeads: [] };
};

export const createLead = async (leadData: CreateLeadData, user: User) => {
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
  return data;
};

export const updateLead = async (id: string, updates: Partial<Lead>) => {
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
  return data;
};

export const deleteLead = async (id: string) => {
  const { error } = await supabase
    .from('leads')
    .delete()
    .eq('id', id);

  if (error) throw error;
  return true;
};
