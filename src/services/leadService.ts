
import { supabase } from '@/integrations/supabase/client';
import { User } from '@supabase/supabase-js';
import { Lead, CreateLeadData } from '@/types/leads';

export const fetchLeadsByRole = async (user: User, userRole: string) => {
  console.log('Fetching leads for user:', user.email, 'Role:', userRole);
  
  let query = supabase.from('leads').select('*');
  const normalizedRole = userRole?.toLowerCase();

  if (normalizedRole === 'admin' || normalizedRole === 'sales_manager') {
    query = query.order('created_at', { ascending: false });
    
    const { data, error } = await query;
    if (error) throw error;
    
    return { leads: data || [], assignedLeads: [] };
  } else if (normalizedRole === 'sales_associate') {
    const { data: teamMemberData, error: tmError } = await supabase
      .from('team_members')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (tmError || !teamMemberData) {
      console.log('No team member data found, fallback to user-created leads');
      query = query.eq('user_id', user.id).order('created_at', { ascending: false });
      
      const { data, error } = await query;
      if (error) throw error;
      
      return { leads: data || [], assignedLeads: [] };
    } else {
      console.log('Found team member ID:', teamMemberData.id);
      
      // Get leads created by user
      const { data: createdLeads, error: createdError } = await supabase
        .from('leads')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      
      if (createdError) throw createdError;
      
      // Get leads assigned to user (but not created by them)
      const { data: assignedLeadsData, error: assignedError } = await supabase
        .from('leads')
        .select('*')
        .eq('assigned_team_member_id', teamMemberData.id)
        .neq('user_id', user.id)
        .order('created_at', { ascending: false });
      
      if (assignedError) throw assignedError;
      
      return { leads: createdLeads || [], assignedLeads: assignedLeadsData || [] };
    }
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
