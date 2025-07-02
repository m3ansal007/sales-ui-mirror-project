/*
  # Fix Mayan Bansal2 Data Synchronization Issue

  1. Diagnosis
    - Check if team member exists but auth_user_id is missing
    - Check if user account exists but not linked to team member
    - Fix any data mismatches

  2. Resolution
    - Update auth_user_id for existing team members
    - Ensure proper linking between team members and user accounts
    - Add debugging information

  3. Security
    - Maintains all RLS policies
    - Ensures data integrity
*/

-- First, let's check and fix any team members without auth_user_id
UPDATE public.team_members 
SET auth_user_id = (
  SELECT id FROM auth.users 
  WHERE LOWER(TRIM(auth.users.email)) = LOWER(TRIM(public.team_members.email))
  LIMIT 1
)
WHERE auth_user_id IS NULL;

-- Create a function to manually sync team member data
CREATE OR REPLACE FUNCTION public.sync_team_member_data()
RETURNS TABLE(
  team_member_name text,
  team_member_email text,
  auth_user_found boolean,
  auth_user_id uuid,
  sync_status text
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    tm.name as team_member_name,
    tm.email as team_member_email,
    (au.id IS NOT NULL) as auth_user_found,
    au.id as auth_user_id,
    CASE 
      WHEN tm.auth_user_id IS NOT NULL AND au.id IS NOT NULL THEN 'SYNCED'
      WHEN tm.auth_user_id IS NULL AND au.id IS NOT NULL THEN 'NEEDS_UPDATE'
      WHEN au.id IS NULL THEN 'USER_NOT_FOUND'
      ELSE 'UNKNOWN'
    END as sync_status
  FROM public.team_members tm
  LEFT JOIN auth.users au ON LOWER(TRIM(au.email)) = LOWER(TRIM(tm.email))
  ORDER BY tm.created_at DESC;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.sync_team_member_data() TO authenticated;

-- Create a function to force sync a specific team member
CREATE OR REPLACE FUNCTION public.force_sync_team_member(member_email text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  found_user_id uuid;
  updated_count integer;
BEGIN
  -- Find the user by email (case insensitive)
  SELECT id INTO found_user_id
  FROM auth.users 
  WHERE LOWER(TRIM(email)) = LOWER(TRIM(member_email))
  LIMIT 1;
  
  IF found_user_id IS NULL THEN
    RETURN 'ERROR: No user account found for email: ' || member_email;
  END IF;
  
  -- Update the team member with the found auth_user_id
  UPDATE public.team_members 
  SET auth_user_id = found_user_id, updated_at = now()
  WHERE LOWER(TRIM(email)) = LOWER(TRIM(member_email));
  
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  
  IF updated_count = 0 THEN
    RETURN 'ERROR: No team member found for email: ' || member_email;
  END IF;
  
  RETURN 'SUCCESS: Synced team member ' || member_email || ' with auth_user_id: ' || found_user_id::text;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.force_sync_team_member(text) TO authenticated;

-- Add a debug function to check team member performance data
CREATE OR REPLACE FUNCTION public.debug_team_member_data(member_email text)
RETURNS TABLE(
  info_type text,
  info_value text
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  tm_record record;
  user_record record;
  lead_count bigint;
  task_count bigint;
  comm_count bigint;
  appt_count bigint;
BEGIN
  -- Get team member info
  SELECT * INTO tm_record FROM public.team_members WHERE LOWER(TRIM(email)) = LOWER(TRIM(member_email)) LIMIT 1;
  
  IF tm_record IS NULL THEN
    RETURN QUERY SELECT 'ERROR'::text, 'Team member not found for email: ' || member_email;
    RETURN;
  END IF;
  
  RETURN QUERY SELECT 'team_member_id'::text, tm_record.id::text;
  RETURN QUERY SELECT 'team_member_name'::text, tm_record.name;
  RETURN QUERY SELECT 'team_member_email'::text, tm_record.email;
  RETURN QUERY SELECT 'team_member_role'::text, tm_record.role;
  RETURN QUERY SELECT 'auth_user_id'::text, COALESCE(tm_record.auth_user_id::text, 'NULL');
  
  -- Get user account info
  SELECT * INTO user_record FROM auth.users WHERE LOWER(TRIM(email)) = LOWER(TRIM(member_email)) LIMIT 1;
  
  IF user_record IS NOT NULL THEN
    RETURN QUERY SELECT 'auth_user_found'::text, 'YES';
    RETURN QUERY SELECT 'auth_user_actual_id'::text, user_record.id::text;
    RETURN QUERY SELECT 'auth_user_role'::text, COALESCE(user_record.raw_user_meta_data->>'role', 'NULL');
  ELSE
    RETURN QUERY SELECT 'auth_user_found'::text, 'NO';
  END IF;
  
  -- Count data if auth_user_id exists
  IF tm_record.auth_user_id IS NOT NULL THEN
    SELECT COUNT(*) INTO lead_count FROM public.leads WHERE user_id = tm_record.auth_user_id;
    SELECT COUNT(*) INTO task_count FROM public.tasks WHERE user_id = tm_record.auth_user_id;
    SELECT COUNT(*) INTO comm_count FROM public.communications WHERE user_id = tm_record.auth_user_id;
    SELECT COUNT(*) INTO appt_count FROM public.appointments WHERE user_id = tm_record.auth_user_id;
    
    RETURN QUERY SELECT 'leads_count'::text, lead_count::text;
    RETURN QUERY SELECT 'tasks_count'::text, task_count::text;
    RETURN QUERY SELECT 'communications_count'::text, comm_count::text;
    RETURN QUERY SELECT 'appointments_count'::text, appt_count::text;
  ELSE
    RETURN QUERY SELECT 'data_counts'::text, 'Cannot count - no auth_user_id';
  END IF;
  
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.debug_team_member_data(text) TO authenticated;

-- Update any team members that might have been missed
DO $$
DECLARE
  tm_record record;
  user_id_found uuid;
BEGIN
  FOR tm_record IN SELECT * FROM public.team_members WHERE auth_user_id IS NULL LOOP
    SELECT id INTO user_id_found 
    FROM auth.users 
    WHERE LOWER(TRIM(email)) = LOWER(TRIM(tm_record.email))
    LIMIT 1;
    
    IF user_id_found IS NOT NULL THEN
      UPDATE public.team_members 
      SET auth_user_id = user_id_found, updated_at = now()
      WHERE id = tm_record.id;
      
      RAISE NOTICE 'Updated team member % with auth_user_id %', tm_record.name, user_id_found;
    ELSE
      RAISE NOTICE 'No user account found for team member %', tm_record.email;
    END IF;
  END LOOP;
END $$;