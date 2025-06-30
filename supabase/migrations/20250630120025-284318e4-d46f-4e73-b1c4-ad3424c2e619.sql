
-- Check the current state of the user_roles table
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'user_roles' AND table_schema = 'public'
ORDER BY ordinal_position;

-- Drop everything and rebuild from scratch
DROP TRIGGER IF EXISTS on_auth_user_created_role ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user_role();

-- Check if the enum exists and drop it
DROP TYPE IF EXISTS public.user_role CASCADE;

-- Recreate the enum
CREATE TYPE public.user_role AS ENUM ('Admin', 'Sales Manager', 'Sales Associate');

-- Check if role column exists and drop it if it does
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'user_roles' 
        AND column_name = 'role' 
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.user_roles DROP COLUMN role;
    END IF;
END $$;

-- Add the role column with proper type
ALTER TABLE public.user_roles ADD COLUMN role user_role NOT NULL DEFAULT 'Sales Associate'::user_role;

-- Create the trigger function with proper error handling
CREATE OR REPLACE FUNCTION public.handle_new_user_role()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_role_from_metadata text;
  final_role user_role;
BEGIN
  -- Get role from user metadata, default to 'Sales Associate'
  user_role_from_metadata := COALESCE(
    NEW.raw_user_meta_data->>'role',
    NEW.raw_user_meta_data->>'authorized_role',
    'Sales Associate'
  );
  
  -- Validate and convert to enum type
  CASE user_role_from_metadata
    WHEN 'Admin' THEN final_role := 'Admin'::user_role;
    WHEN 'Sales Manager' THEN final_role := 'Sales Manager'::user_role;
    WHEN 'Sales Associate' THEN final_role := 'Sales Associate'::user_role;
    ELSE final_role := 'Sales Associate'::user_role;
  END CASE;
  
  -- Insert user role
  INSERT INTO public.user_roles (user_id, role, created_at, updated_at)
  VALUES (
    NEW.id,
    final_role,
    now(),
    now()
  );
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log the error but don't block user creation
    RAISE WARNING 'Failed to create user role for user %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$;

-- Create the trigger
CREATE TRIGGER on_auth_user_created_role
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_role();

-- Update the get_user_role function
CREATE OR REPLACE FUNCTION public.get_user_role(user_uuid UUID DEFAULT auth.uid())
RETURNS user_role
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT role 
  FROM public.user_roles 
  WHERE user_id = user_uuid 
  AND is_active = true;
$$;
