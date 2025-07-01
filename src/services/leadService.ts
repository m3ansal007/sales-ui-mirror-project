
import { supabase } from '@/integrations/supabase/client';
import { User } from '@supabase/supabase-js';
import { Lead, CreateLeadData } from '@/types/leads';

export const fetchLeadsByRole = async (user: User, userRole: string) => {
  console.log('Fetching leads for user:', user.email, 'Role:', userRole);
  const normalizedRole = userRole?.toLowerCase();

  // Admin → See everything
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
    // Get manager's team member record
    const managerMemberRes = await supabase
      .from('team_members')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (!managerMemberRes.data || managerMemberRes.error) {
      return { leads: [], assignedLeads: [] };
    }

    const managerId = managerMemberRes.data.id;

    // Get leads created by manager
    const createdRes = await supabase
      .from('leads')
      .select('*')
      .eq('user_id', user.id);
    const createdLeads = createdRes.data || [];

    // Get leads assigned to manager
    const assignedRes = await supabase
      .from('leads')
      .select('*')
      .eq('assigned_team_member_id', managerId);
    const assignedToManager = assignedRes.data || [];

    // Get sales associates under this manager
    const teamRes = await supabase
      .from('team_members')
      .select('id')
      .eq('manager_id', managerId);
    const teamData = teamRes.data || [];
    const associateIds = teamData.map((tm: any) => tm.id);

    let leadsForTeam: any[] = [];

    if (associateIds.length > 0) {
      const leadsRes = await supabase
        .from('leads')
        .select('*')
        .in('assigned_team_member_id', associateIds);

      leadsForTeam = leadsRes.data || [];
    }

    // Manually combine arrays to avoid spread operator issues
    const allLeads: Lead[] = [];
    createdLeads.forEach(lead => allLeads.push(lead));
    assignedToManager.forEach(lead => allLeads.push(lead));
    leadsForTeam.forEach(lead => allLeads.push(lead));

    return {
      leads: allLeads,
      assignedLeads: assignedToManager
    };
  }

  // Sales Associate
  if (normalizedRole === 'sales_associate') {
    const associateMemberRes = await supabase
      .from('team_members')
      .select('id')
      .eq('user_id', user.id)
      .single();

    const associateId = associateMemberRes.data?.id;

    const createdRes = await supabase
      .from('leads')
      .select('*')
      .eq('user_id', user.id);
    const createdLeads = createdRes.data || [];

    let assignedLeads: any[] = [];

    if (associateId) {
      const assignedRes = await supabase
        .from('leads')
        .select('*')
        .eq('assigned_team_member_id', associateId)
        .neq('user_id', user.id);

      assignedLeads = assignedRes.data || [];
    }

    // Manually combine arrays
    const allLeads: Lead[] = [];
    createdLeads.forEach(lead => allLeads.push(lead));
    assignedLeads.forEach(lead => allLeads.push(lead));

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
