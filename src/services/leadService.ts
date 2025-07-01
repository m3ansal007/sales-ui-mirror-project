import { supabase } from '@/integrations/supabase/client';
import { User } from '@supabase/supabase-js';
import { Lead, CreateLeadData } from '@/types/leads';

export const fetchLeadsByRole = async (user: User, userRole: string) => {
  console.log('Fetching leads for user:', user.email, 'Role:', userRole);
  
  let query = supabase.from('leads').select('*');
  const normalizedRole = userRole?.toLowerCase();

  if (normalizedRole === 'admin') {
    query = query.order('created_at', { ascending: false });
    
    const { data, error } = await query;
    if (error) throw error;
    
    return { leads: data || [], assignedLeads: [] };
  } else if (normalizedRole === 'sales_manager') {
    // Step 1: Get team member record
    const { data: teamMemberData, error: tmError } = await supabase
      .from('team_members')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (!teamMemberData || tmError) {
      return { leads: [], assignedLeads: [] };
    }

    // Step 2: Leads assigned to the manager directly
    const { data: assignedToManager } = await supabase
      .from('leads')
      .select('*')
      .eq('assigned_team_member_id', teamMemberData.id);

    // Step 3: Leads created by manager
    const { data: createdByManager } = await supabase
      .from('leads')
      .select('*')
      .eq('user_id', user.id);

    // Step 4: Leads assigned to manager's associates
    const { data: teamAssociates } = await supabase
      .from('team_members')
      .select('id')
      .eq('manager_id', teamMemberData.id);

    const leadsForTeam: any[] = [];

    if (teamAssociates && teamAssociates.length > 0) {
      const associateIds: string[] = teamAssociates.map((tm: { id: string }) => tm.id);
      
      if (associateIds.length > 0) {
        const { data: leadsForAssociates } = await supabase
          .from('leads')
          .select('*')
          .in('assigned_team_member_id', associateIds);

        leadsForTeam.push(...(leadsForAssociates || []));
      }
    }

    return {
      leads: [...(createdByManager || []), ...(assignedToManager || []), ...leadsForTeam],
      assignedLeads: assignedToManager || []
    };
  } else if (normalizedRole === 'sales_associate') {
    // First, try to get team member by user_id
    const { data: teamMemberData, error: tmError } = await supabase
      .from('team_members')
      .select('id')
      .eq('user_id', user.id)
      .single();

    // Get leads created by user
    const { data: createdLeads, error: createdError } = await supabase
      .from('leads')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    
    if (createdError) throw createdError;
    
    // Get leads assigned to user - try multiple approaches
    let assignedLeadsData: any[] = [];
    
    if (teamMemberData && !tmError) {
      // Method 1: Using team member ID
      console.log('Found team member ID:', teamMemberData.id);
      const { data: assignedByTeamId, error: assignedError1 } = await supabase
        .from('leads')
        .select('*')
        .eq('assigned_team_member_id', teamMemberData.id)
        .neq('user_id', user.id)
        .order('created_at', { ascending: false });
      
      if (!assignedError1 && assignedByTeamId) {
        assignedLeadsData = assignedByTeamId;
      }
    }
    
    // Method 2: If no team member record, try by user email in team_members
    if (assignedLeadsData.length === 0) {
      console.log('Trying to find assignments by email:', user.email);
      const { data: teamMemberByEmail, error: tmEmailError } = await supabase
        .from('team_members')
        .select('id')
        .eq('email', user.email)
        .single();
      
      if (!tmEmailError && teamMemberByEmail) {
        console.log('Found team member by email:', teamMemberByEmail.id);
        const { data: assignedByEmail, error: assignedError2 } = await supabase
          .from('leads')
          .select('*')
          .eq('assigned_team_member_id', teamMemberByEmail.id)
          .neq('user_id', user.id)
          .order('created_at', { ascending: false });
        
        if (!assignedError2 && assignedByEmail) {
          assignedLeadsData = assignedByEmail;
        }
      }
    }
    
    // Method 3: Try using the old assigned_to field as fallback
    if (assignedLeadsData.length === 0) {
      console.log('Trying fallback: assigned_to field');
      const { data: assignedByUserId, error: assignedError3 } = await supabase
        .from('leads')
        .select('*')
        .eq('assigned_to', user.id)
        .neq('user_id', user.id)
        .order('created_at', { ascending: false });
      
      if (!assignedError3 && assignedByUserId) {
        assignedLeadsData = assignedByUserId;
      }
    }
    
    console.log('Final assigned leads count:', assignedLeadsData.length);
    return { leads: createdLeads || [], assignedLeads: assignedLeadsData || [] };
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
