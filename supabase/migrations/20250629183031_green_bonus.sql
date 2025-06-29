/*
  # Update team member creation function to store auth_user_id

  1. Changes
    - Modify create_team_member_account function to store the created user ID
    - This allows frontend to access user data without admin privileges

  2. Security
    - Maintains security definer for user creation
    - Stores auth_user_id for future reference
*/

-- Update the trigger function to store auth_user_id
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

  -- Update the team member with the created auth_user_id and clear temp_password
  UPDATE public.team_members 
  SET 
    auth_user_id = new_user_id,
    temp_password = null, 
    updated_at = now()
  WHERE id = NEW.id;

  RETURN NEW;
END;
$$;