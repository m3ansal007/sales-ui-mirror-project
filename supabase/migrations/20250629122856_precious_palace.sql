/*
  # Reset Sales Associate Data and Fix Admin Sync

  1. Data Cleanup
    - Remove all existing data for sales associates
    - Keep only admin data intact

  2. Sync Fixes
    - Update team member assignment logic
    - Fix activity tracking for hierarchical reporting
    - Ensure proper data flow from associates to admin dashboard

  3. Security
    - Maintain RLS policies
    - Ensure data integrity
*/

-- First, let's identify and clean up sales associate data
-- We'll keep admin data (blindspotofficials@gmail.com) but reset associate data

-- Delete leads created by non-admin users (sales associates)
DELETE FROM public.leads 
WHERE user_id IN (
  SELECT id FROM auth.users 
  WHERE email != 'blindspotofficials@gmail.com'
);

-- Delete tasks created by non-admin users
DELETE FROM public.tasks 
WHERE user_id IN (
  SELECT id FROM auth.users 
  WHERE email != 'blindspotofficials@gmail.com'
);

-- Delete communications created by non-admin users
DELETE FROM public.communications 
WHERE user_id IN (
  SELECT id FROM auth.users 
  WHERE email != 'blindspotofficials@gmail.com'
);

-- Delete appointments created by non-admin users
DELETE FROM public.appointments 
WHERE user_id IN (
  SELECT id FROM auth.users 
  WHERE email != 'blindspotofficials@gmail.com'
);

-- Delete activities created by non-admin users
DELETE FROM public.activities 
WHERE user_id IN (
  SELECT id FROM auth.users 
  WHERE email != 'blindspotofficials@gmail.com'
);

-- Reset team members table (keep only admin-created team members)
DELETE FROM public.team_members 
WHERE user_id IN (
  SELECT id FROM auth.users 
  WHERE email != 'blindspotofficials@gmail.com'
);

-- Update the team member creation function to properly link data
CREATE OR REPLACE FUNCTION public.create_team_member_account()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  provided_password text;
  new_user_id uuid;
  admin_user_id uuid;
BEGIN
  -- Get the admin user ID (the one creating the team member)
  admin_user_id := NEW.user_id;
  
  -- Use the provided password from temp_password column, or generate a default
  provided_password := COALESCE(NEW.temp_password, substring(md5(random()::text) from 1 for 8) || 'A1!');
  
  -- Create the user account with the provided password
  INSERT INTO auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at,
    confirmation_token,
    email_change,
    email_change_token_new,
    recovery_token
  ) VALUES (
    '00000000-0000-0000-0000-000000000000',
    gen_random_uuid(),
    'authenticated',
    'authenticated',
    NEW.email,
    crypt(provided_password, gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}',
    jsonb_build_object(
      'full_name', NEW.name, 
      'role', NEW.role,
      'authorized_role', NEW.role,
      'temp_password', provided_password,
      'created_by_admin', admin_user_id,
      'admin_email', (SELECT email FROM auth.users WHERE id = admin_user_id)
    ),
    now(),
    now(),
    '',
    '',
    '',
    ''
  ) RETURNING id INTO new_user_id;

  -- Clear the temp_password for security and update the team member
  UPDATE public.team_members 
  SET temp_password = null, updated_at = now()
  WHERE id = NEW.id;

  RETURN NEW;
END;
$$;

-- Create a function to track all sales associate activities under admin account
CREATE OR REPLACE FUNCTION public.log_associate_activity_to_admin()
RETURNS TRIGGER AS $$
DECLARE
  admin_user_id uuid;
  team_member_record record;
BEGIN
  -- Get the admin user ID for this sales associate
  SELECT tm.user_id, tm.* INTO admin_user_id, team_member_record
  FROM public.team_members tm
  WHERE tm.email = (SELECT email FROM auth.users WHERE id = NEW.user_id)
  LIMIT 1;

  -- If we found the admin user, log the activity under admin account
  IF admin_user_id IS NOT NULL THEN
    INSERT INTO public.activities (user_id, lead_id, type, title, description, metadata)
    VALUES (
      admin_user_id,  -- Log under admin account
      CASE 
        WHEN TG_TABLE_NAME = 'leads' THEN NEW.id
        WHEN TG_TABLE_NAME = 'tasks' THEN NEW.lead_id
        WHEN TG_TABLE_NAME = 'communications' THEN NEW.lead_id
        WHEN TG_TABLE_NAME = 'appointments' THEN NEW.lead_id
        ELSE NULL
      END,
      CASE 
        WHEN TG_OP = 'INSERT' THEN 'created'
        WHEN TG_OP = 'UPDATE' THEN 'updated'
        ELSE 'action'
      END,
      CASE 
        WHEN TG_TABLE_NAME = 'leads' AND TG_OP = 'INSERT' THEN 'New lead added by ' || team_member_record.name
        WHEN TG_TABLE_NAME = 'leads' AND TG_OP = 'UPDATE' THEN 'Lead updated by ' || team_member_record.name
        WHEN TG_TABLE_NAME = 'tasks' AND TG_OP = 'INSERT' THEN 'Task created by ' || team_member_record.name
        WHEN TG_TABLE_NAME = 'tasks' AND TG_OP = 'UPDATE' THEN 'Task updated by ' || team_member_record.name
        WHEN TG_TABLE_NAME = 'communications' AND TG_OP = 'INSERT' THEN 'Communication logged by ' || team_member_record.name
        WHEN TG_TABLE_NAME = 'appointments' AND TG_OP = 'INSERT' THEN 'Appointment scheduled by ' || team_member_record.name
        ELSE 'Activity by ' || team_member_record.name
      END,
      CASE 
        WHEN TG_TABLE_NAME = 'leads' THEN NEW.name || ' (by ' || team_member_record.name || ')'
        WHEN TG_TABLE_NAME = 'tasks' THEN NEW.title || ' (by ' || team_member_record.name || ')'
        WHEN TG_TABLE_NAME = 'communications' THEN NEW.subject || ' (by ' || team_member_record.name || ')'
        WHEN TG_TABLE_NAME = 'appointments' THEN NEW.title || ' (by ' || team_member_record.name || ')'
        ELSE 'Activity by ' || team_member_record.name
      END,
      jsonb_build_object(
        'original_data', to_jsonb(NEW),
        'performed_by', team_member_record.name,
        'performed_by_email', team_member_record.email,
        'performed_by_role', team_member_record.role,
        'admin_user_id', admin_user_id
      )
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing triggers and create new ones that log to admin account
DROP TRIGGER IF EXISTS leads_activity_trigger ON public.leads;
DROP TRIGGER IF EXISTS tasks_activity_trigger ON public.tasks;
DROP TRIGGER IF EXISTS communications_activity_trigger ON public.communications;
DROP TRIGGER IF EXISTS appointments_activity_trigger ON public.appointments;

-- Create new triggers that log associate activities to admin account
CREATE TRIGGER leads_admin_activity_trigger 
  AFTER INSERT OR UPDATE ON public.leads 
  FOR EACH ROW EXECUTE FUNCTION public.log_associate_activity_to_admin();

CREATE TRIGGER tasks_admin_activity_trigger 
  AFTER INSERT OR UPDATE ON public.tasks 
  FOR EACH ROW EXECUTE FUNCTION public.log_associate_activity_to_admin();

CREATE TRIGGER communications_admin_activity_trigger 
  AFTER INSERT OR UPDATE ON public.communications 
  FOR EACH ROW EXECUTE FUNCTION public.log_associate_activity_to_admin();

CREATE TRIGGER appointments_admin_activity_trigger 
  AFTER INSERT OR UPDATE ON public.appointments 
  FOR EACH ROW EXECUTE FUNCTION public.log_associate_activity_to_admin();

-- Update the leads table to automatically assign team member when created
CREATE OR REPLACE FUNCTION public.auto_assign_team_member()
RETURNS TRIGGER AS $$
DECLARE
  team_member_id uuid;
BEGIN
  -- Find the team member record for this user
  SELECT id INTO team_member_id
  FROM public.team_members tm
  WHERE tm.email = (SELECT email FROM auth.users WHERE id = NEW.user_id)
  LIMIT 1;

  -- If found, assign the team member
  IF team_member_id IS NOT NULL THEN
    NEW.assigned_team_member_id := team_member_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to auto-assign team member to leads
CREATE TRIGGER auto_assign_team_member_trigger
  BEFORE INSERT ON public.leads
  FOR EACH ROW EXECUTE FUNCTION public.auto_assign_team_member();