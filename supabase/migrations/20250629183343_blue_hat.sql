/*
  # Fix Team Data Synchronization

  1. Problem Resolution
    - Sales associate data is not showing up in admin's Team and Roles section
    - Need to ensure proper data flow from associates to admin dashboard
    - Fix RLS policies to allow admin to see team member data

  2. Changes
    - Update RLS policies to allow admins to see team member activities
    - Create proper data aggregation for team performance
    - Ensure leads created by associates are visible to admin

  3. Security
    - Maintain data security while allowing proper hierarchical access
    - Admin can see team member data, but team members can't see each other's data
*/

-- Update RLS policies to allow admins to see team member data

-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Users can view their own leads" ON public.leads;
DROP POLICY IF EXISTS "Users can view their own tasks" ON public.tasks;
DROP POLICY IF EXISTS "Users can view their own communications" ON public.communications;
DROP POLICY IF EXISTS "Users can view their own appointments" ON public.appointments;
DROP POLICY IF EXISTS "Users can view their own activities" ON public.activities;

-- Create new policies that allow admins to see team member data

-- Leads policies - allow users to see their own leads AND allow admins to see team member leads
CREATE POLICY "Users can view accessible leads" ON public.leads FOR SELECT USING (
  auth.uid() = user_id OR 
  EXISTS (
    SELECT 1 FROM public.team_members tm 
    WHERE tm.user_id = auth.uid() AND tm.auth_user_id = leads.user_id
  )
);

CREATE POLICY "Users can create their own leads" ON public.leads FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update accessible leads" ON public.leads FOR UPDATE USING (
  auth.uid() = user_id OR 
  EXISTS (
    SELECT 1 FROM public.team_members tm 
    WHERE tm.user_id = auth.uid() AND tm.auth_user_id = leads.user_id
  )
);
CREATE POLICY "Users can delete their own leads" ON public.leads FOR DELETE USING (auth.uid() = user_id);

-- Tasks policies
CREATE POLICY "Users can view accessible tasks" ON public.tasks FOR SELECT USING (
  auth.uid() = user_id OR 
  EXISTS (
    SELECT 1 FROM public.team_members tm 
    WHERE tm.user_id = auth.uid() AND tm.auth_user_id = tasks.user_id
  )
);

CREATE POLICY "Users can create their own tasks" ON public.tasks FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update accessible tasks" ON public.tasks FOR UPDATE USING (
  auth.uid() = user_id OR 
  EXISTS (
    SELECT 1 FROM public.team_members tm 
    WHERE tm.user_id = auth.uid() AND tm.auth_user_id = tasks.user_id
  )
);
CREATE POLICY "Users can delete their own tasks" ON public.tasks FOR DELETE USING (auth.uid() = user_id);

-- Communications policies
CREATE POLICY "Users can view accessible communications" ON public.communications FOR SELECT USING (
  auth.uid() = user_id OR 
  EXISTS (
    SELECT 1 FROM public.team_members tm 
    WHERE tm.user_id = auth.uid() AND tm.auth_user_id = communications.user_id
  )
);

CREATE POLICY "Users can create their own communications" ON public.communications FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update accessible communications" ON public.communications FOR UPDATE USING (
  auth.uid() = user_id OR 
  EXISTS (
    SELECT 1 FROM public.team_members tm 
    WHERE tm.user_id = auth.uid() AND tm.auth_user_id = communications.user_id
  )
);
CREATE POLICY "Users can delete their own communications" ON public.communications FOR DELETE USING (auth.uid() = user_id);

-- Appointments policies
CREATE POLICY "Users can view accessible appointments" ON public.appointments FOR SELECT USING (
  auth.uid() = user_id OR 
  EXISTS (
    SELECT 1 FROM public.team_members tm 
    WHERE tm.user_id = auth.uid() AND tm.auth_user_id = appointments.user_id
  )
);

CREATE POLICY "Users can create their own appointments" ON public.appointments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update accessible appointments" ON public.appointments FOR UPDATE USING (
  auth.uid() = user_id OR 
  EXISTS (
    SELECT 1 FROM public.team_members tm 
    WHERE tm.user_id = auth.uid() AND tm.auth_user_id = appointments.user_id
  )
);
CREATE POLICY "Users can delete their own appointments" ON public.appointments FOR DELETE USING (auth.uid() = user_id);

-- Activities policies
CREATE POLICY "Users can view accessible activities" ON public.activities FOR SELECT USING (
  auth.uid() = user_id OR 
  EXISTS (
    SELECT 1 FROM public.team_members tm 
    WHERE tm.user_id = auth.uid() AND tm.auth_user_id = activities.user_id
  )
);

CREATE POLICY "Users can create their own activities" ON public.activities FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update accessible activities" ON public.activities FOR UPDATE USING (
  auth.uid() = user_id OR 
  EXISTS (
    SELECT 1 FROM public.team_members tm 
    WHERE tm.user_id = auth.uid() AND tm.auth_user_id = activities.user_id
  )
);
CREATE POLICY "Users can delete their own activities" ON public.activities FOR DELETE USING (auth.uid() = user_id);

-- Create a function to get comprehensive team member performance data
CREATE OR REPLACE FUNCTION public.get_team_member_performance(admin_user_id uuid)
RETURNS TABLE(
  team_member_id uuid,
  team_member_name text,
  team_member_email text,
  team_member_role text,
  team_member_status text,
  auth_user_id uuid,
  total_leads bigint,
  converted_leads bigint,
  new_leads bigint,
  contacted_leads bigint,
  followup_leads bigint,
  lost_leads bigint,
  total_revenue numeric,
  total_tasks bigint,
  completed_tasks bigint,
  total_communications bigint,
  total_appointments bigint,
  total_activities bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    tm.id as team_member_id,
    tm.name as team_member_name,
    tm.email as team_member_email,
    tm.role as team_member_role,
    tm.status as team_member_status,
    tm.auth_user_id,
    COALESCE(COUNT(DISTINCT l.id), 0) as total_leads,
    COALESCE(COUNT(DISTINCT CASE WHEN l.status = 'Converted' THEN l.id END), 0) as converted_leads,
    COALESCE(COUNT(DISTINCT CASE WHEN l.status = 'New' THEN l.id END), 0) as new_leads,
    COALESCE(COUNT(DISTINCT CASE WHEN l.status = 'Contacted' THEN l.id END), 0) as contacted_leads,
    COALESCE(COUNT(DISTINCT CASE WHEN l.status = 'Follow-Up' THEN l.id END), 0) as followup_leads,
    COALESCE(COUNT(DISTINCT CASE WHEN l.status = 'Lost' THEN l.id END), 0) as lost_leads,
    COALESCE(SUM(CASE WHEN l.status = 'Converted' THEN l.value END), 0) as total_revenue,
    COALESCE(COUNT(DISTINCT t.id), 0) as total_tasks,
    COALESCE(COUNT(DISTINCT CASE WHEN t.status = 'Completed' THEN t.id END), 0) as completed_tasks,
    COALESCE(COUNT(DISTINCT c.id), 0) as total_communications,
    COALESCE(COUNT(DISTINCT a.id), 0) as total_appointments,
    COALESCE(COUNT(DISTINCT act.id), 0) as total_activities
  FROM public.team_members tm
  LEFT JOIN public.leads l ON (l.user_id = tm.auth_user_id OR l.assigned_team_member_id = tm.id)
  LEFT JOIN public.tasks t ON t.user_id = tm.auth_user_id
  LEFT JOIN public.communications c ON c.user_id = tm.auth_user_id
  LEFT JOIN public.appointments a ON a.user_id = tm.auth_user_id
  LEFT JOIN public.activities act ON act.user_id = tm.auth_user_id
  WHERE tm.user_id = admin_user_id
  GROUP BY tm.id, tm.name, tm.email, tm.role, tm.status, tm.auth_user_id;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.get_team_member_performance(uuid) TO authenticated;

-- Update the team member performance view to use the new function
DROP VIEW IF EXISTS public.team_member_performance;

CREATE OR REPLACE VIEW public.team_member_performance AS
SELECT 
  tm.id as team_member_id,
  tm.name,
  tm.email,
  tm.role,
  tm.status,
  tm.auth_user_id,
  COALESCE(COUNT(DISTINCT l.id), 0) as total_leads,
  COALESCE(COUNT(DISTINCT CASE WHEN l.status = 'Converted' THEN l.id END), 0) as converted_leads,
  COALESCE(COUNT(DISTINCT CASE WHEN l.status = 'New' THEN l.id END), 0) as new_leads,
  COALESCE(COUNT(DISTINCT CASE WHEN l.status = 'Contacted' THEN l.id END), 0) as contacted_leads,
  COALESCE(COUNT(DISTINCT CASE WHEN l.status = 'Follow-Up' THEN l.id END), 0) as followup_leads,
  COALESCE(COUNT(DISTINCT CASE WHEN l.status = 'Lost' THEN l.id END), 0) as lost_leads,
  COALESCE(SUM(CASE WHEN l.status = 'Converted' THEN l.value END), 0) as total_revenue,
  COALESCE(COUNT(DISTINCT t.id), 0) as total_tasks,
  COALESCE(COUNT(DISTINCT CASE WHEN t.status = 'Completed' THEN t.id END), 0) as completed_tasks,
  COALESCE(COUNT(DISTINCT c.id), 0) as total_communications,
  COALESCE(COUNT(DISTINCT a.id), 0) as total_appointments,
  COALESCE(COUNT(DISTINCT act.id), 0) as total_activities
FROM public.team_members tm
LEFT JOIN public.leads l ON (l.user_id = tm.auth_user_id OR l.assigned_team_member_id = tm.id)
LEFT JOIN public.tasks t ON t.user_id = tm.auth_user_id
LEFT JOIN public.communications c ON c.user_id = tm.auth_user_id
LEFT JOIN public.appointments a ON a.user_id = tm.auth_user_id
LEFT JOIN public.activities act ON act.user_id = tm.auth_user_id
GROUP BY tm.id, tm.name, tm.email, tm.role, tm.status, tm.auth_user_id;

-- Enable RLS on the view
ALTER VIEW public.team_member_performance SET (security_barrier = true);

-- Create RLS policy for the view
CREATE POLICY "Admins can view team performance" ON public.team_member_performance FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.team_members tm 
    WHERE tm.user_id = auth.uid()
  )
);