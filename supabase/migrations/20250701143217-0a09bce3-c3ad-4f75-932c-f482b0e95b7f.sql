
-- First, let's ensure we're working with a clean slate
-- Drop all existing objects that might reference the old type
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS on_auth_user_created_role ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS public.handle_new_user_role() CASCADE;
DROP FUNCTION IF EXISTS public.get_user_role(uuid) CASCADE;

-- Drop the enum and all dependent objects
DROP TYPE IF EXISTS public.user_role CASCADE;

-- Drop and recreate the user_roles table to ensure no schema conflicts
DROP TABLE IF EXISTS public.user_roles CASCADE;

-- Recreate the enum type
CREATE TYPE public.user_role AS ENUM ('Admin', 'Sales Manager', 'Sales Associate');

-- Recreate the user_roles table with the new enum
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  role public.user_role NOT NULL DEFAULT 'Sales Associate',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  assigned_by UUID,
  is_active BOOLEAN NOT NULL DEFAULT true
);

-- Enable RLS
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create RLS policy
CREATE POLICY "Users can view own role" ON public.user_roles
  FOR SELECT USING (user_id = auth.uid());

-- Create the profiles trigger function (simple, no role dependency)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', '')
  );
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log error but don't block user creation
    RAISE WARNING 'Failed to create profile for user %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$;

-- Create the user role trigger function with explicit type casting
CREATE OR REPLACE FUNCTION public.handle_new_user_role()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_role_text text;
  final_role public.user_role;
BEGIN
  -- Get role from metadata, default to Sales Associate
  user_role_text := COALESCE(
    NEW.raw_user_meta_data->>'role',
    NEW.raw_user_meta_data->>'authorized_role',
    'Sales Associate'
  );
  
  -- Safely cast to enum type
  BEGIN
    final_role := user_role_text::public.user_role;
  EXCEPTION
    WHEN invalid_text_representation THEN
      final_role := 'Sales Associate'::public.user_role;
  END;
  
  -- Insert the role record
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, final_role);
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log error but don't block user creation
    RAISE WARNING 'Failed to create role for user %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$;

-- Create the get_user_role function
CREATE OR REPLACE FUNCTION public.get_user_role(user_uuid UUID DEFAULT auth.uid())
RETURNS public.user_role
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT role 
  FROM public.user_roles 
  WHERE user_id = user_uuid 
    AND is_active = true
  LIMIT 1;
$$;

-- Create triggers (profiles first, then roles)
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

CREATE TRIGGER on_auth_user_created_role
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_role();

-- Force a schema refresh by updating the schema version
NOTIFY pgrst, 'reload schema';
