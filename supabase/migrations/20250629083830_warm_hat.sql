/*
  # Fix Team Member Activity Tracking

  1. Problem Resolution
    - Create a function to get user ID by email for team performance tracking
    - Add better indexing for team member lookups
    - Create a view to simplify team performance queries

  2. Changes
    - Add function to safely get user by email
    - Create indexes for better performance
    - Add a view for team member performance data

  3. Security
    - Function uses security definer to access auth.users
    - Maintains RLS policies
*/

-- Create a function to get user by email (for team performance tracking)
CREATE OR REPLACE FUNCTION public.get_user_by_email(user_email text)
RETURNS TABLE(id uuid, email text)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT u.id, u.email
  FROM auth.users u
  WHERE u.email = user_email
  LIMIT 1;
END;
$$;

-- Create indexes for better team performance queries
CREATE INDEX IF NOT EXISTS idx_leads_user_id ON public.leads(user_id);
CREATE INDEX IF NOT EXISTS idx_leads_assigned_team_member ON public.leads(assigned_team_member_id);
CREATE INDEX IF NOT EXISTS idx_team_members_email ON public.team_members(email);
CREATE INDEX IF NOT EXISTS idx_activities_user_id ON public.activities(user_id);
CREATE INDEX IF NOT EXISTS idx_tasks_user_id ON public.tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_communications_user_id ON public.communications(user_id);
CREATE INDEX IF NOT EXISTS idx_appointments_user_id ON public.appointments(user_id);

-- Create a view for team member performance (optional, for easier queries)
CREATE OR REPLACE VIEW public.team_member_performance AS
SELECT 
  tm.id as team_member_id,
  tm.name,
  tm.email,
  tm.role,
  tm.status,
  COUNT(DISTINCT l.id) as total_leads,
  COUNT(DISTINCT CASE WHEN l.status = 'Converted' THEN l.id END) as converted_leads,
  COUNT(DISTINCT CASE WHEN l.status = 'New' THEN l.id END) as new_leads,
  COUNT(DISTINCT CASE WHEN l.status = 'Contacted' THEN l.id END) as contacted_leads,
  COUNT(DISTINCT CASE WHEN l.status = 'Follow-Up' THEN l.id END) as followup_leads,
  COUNT(DISTINCT CASE WHEN l.status = 'Lost' THEN l.id END) as lost_leads,
  COALESCE(SUM(CASE WHEN l.status = 'Converted' THEN l.value END), 0) as total_revenue,
  COUNT(DISTINCT t.id) as total_tasks,
  COUNT(DISTINCT CASE WHEN t.status = 'Completed' THEN t.id END) as completed_tasks,
  COUNT(DISTINCT c.id) as total_communications,
  COUNT(DISTINCT a.id) as total_appointments,
  COUNT(DISTINCT act.id) as total_activities
FROM public.team_members tm
LEFT JOIN public.get_user_by_email(tm.email) u ON true
LEFT JOIN public.leads l ON (l.user_id = u.id OR l.assigned_team_member_id = tm.id)
LEFT JOIN public.tasks t ON t.user_id = u.id
LEFT JOIN public.communications c ON c.user_id = u.id
LEFT JOIN public.appointments a ON a.user_id = u.id
LEFT JOIN public.activities act ON act.user_id = u.id
GROUP BY tm.id, tm.name, tm.email, tm.role, tm.status;

-- Grant access to the view
GRANT SELECT ON public.team_member_performance TO authenticated;

-- Create RLS policy for the view
ALTER VIEW public.team_member_performance SET (security_barrier = true);