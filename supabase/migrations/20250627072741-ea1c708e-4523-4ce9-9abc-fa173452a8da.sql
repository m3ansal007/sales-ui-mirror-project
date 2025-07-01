
-- Create a function to automatically create user accounts for team members
CREATE OR REPLACE FUNCTION public.create_team_member_account()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  provided_password text;
  new_user_id uuid;
BEGIN
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
    jsonb_build_object('full_name', NEW.name, 'temp_password', provided_password),
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

-- Create trigger to automatically create user accounts when team members are added
CREATE TRIGGER on_team_member_created
  AFTER INSERT ON public.team_members
  FOR EACH ROW
  EXECUTE FUNCTION public.create_team_member_account();

-- Add a column to store assigned user ID for leads
ALTER TABLE public.leads 
ADD COLUMN IF NOT EXISTS assigned_team_member_id uuid REFERENCES public.team_members(id);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_leads_assigned_team_member ON public.leads(assigned_team_member_id);

-- Add temporary column to store password during insertion
ALTER TABLE public.team_members ADD COLUMN IF NOT EXISTS temp_password text;
