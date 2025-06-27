
-- Create a function to automatically create user accounts for team members
CREATE OR REPLACE FUNCTION public.create_team_member_account()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  temp_password text;
  new_user_id uuid;
BEGIN
  -- Generate a temporary password
  temp_password := substring(md5(random()::text) from 1 for 8) || 'A1!';
  
  -- Create the user account
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
    crypt(temp_password, gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}',
    jsonb_build_object('full_name', NEW.name, 'temp_password', temp_password),
    now(),
    now(),
    '',
    '',
    '',
    ''
  ) RETURNING id INTO new_user_id;

  -- Update the team member with the created user_id for reference
  UPDATE public.team_members 
  SET updated_at = now()
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
