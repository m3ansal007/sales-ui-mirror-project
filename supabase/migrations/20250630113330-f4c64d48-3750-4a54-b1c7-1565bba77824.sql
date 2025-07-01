
-- Create an enum for user roles
CREATE TYPE public.user_role AS ENUM ('Admin', 'Sales Manager', 'Sales Associate');

-- Create a user_roles table to manage role assignments and hierarchy
CREATE TABLE public.user_roles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role user_role NOT NULL,
  assigned_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  is_active BOOLEAN NOT NULL DEFAULT true,
  UNIQUE(user_id)
);

-- Enable RLS on user_roles table
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create policies for user_roles table
-- Admins can see all user roles
CREATE POLICY "Admins can view all user roles" 
  ON public.user_roles 
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur 
      WHERE ur.user_id = auth.uid() 
      AND ur.role = 'Admin' 
      AND ur.is_active = true
    )
  );

-- Sales Managers can see their own role and Sales Associates
CREATE POLICY "Sales Managers can view relevant user roles" 
  ON public.user_roles 
  FOR SELECT 
  USING (
    user_id = auth.uid() 
    OR (
      EXISTS (
        SELECT 1 FROM public.user_roles ur 
        WHERE ur.user_id = auth.uid() 
        AND ur.role = 'Sales Manager' 
        AND ur.is_active = true
      ) 
      AND role = 'Sales Associate'
    )
  );

-- Sales Associates can only see their own role
CREATE POLICY "Sales Associates can view own role" 
  ON public.user_roles 
  FOR SELECT 
  USING (user_id = auth.uid());

-- Only Admins can insert/update user roles
CREATE POLICY "Admins can manage user roles" 
  ON public.user_roles 
  FOR ALL 
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur 
      WHERE ur.user_id = auth.uid() 
      AND ur.role = 'Admin' 
      AND ur.is_active = true
    )
  );

-- Create a function to get user role
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

-- Create a function to check if user has specific role
CREATE OR REPLACE FUNCTION public.has_role(check_role user_role, user_uuid UUID DEFAULT auth.uid())
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM public.user_roles 
    WHERE user_id = user_uuid 
    AND role = check_role 
    AND is_active = true
  );
$$;

-- Create a trigger function to automatically create user role on signup
CREATE OR REPLACE FUNCTION public.handle_new_user_role()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_role_from_metadata text;
BEGIN
  -- Get role from user metadata, default to 'Sales Associate'
  user_role_from_metadata := COALESCE(
    NEW.raw_user_meta_data->>'role',
    NEW.raw_user_meta_data->>'authorized_role',
    'Sales Associate'
  );
  
  -- Insert user role
  INSERT INTO public.user_roles (user_id, role, created_at, updated_at)
  VALUES (
    NEW.id,
    user_role_from_metadata::user_role,
    now(),
    now()
  );
  
  RETURN NEW;
END;
$$;

-- Create trigger to automatically assign role on user creation
CREATE TRIGGER on_auth_user_created_role
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_role();

-- Migrate existing users to the new role system
INSERT INTO public.user_roles (user_id, role, created_at, updated_at)
SELECT 
  id,
  COALESCE(
    (raw_user_meta_data->>'role')::user_role,
    (raw_user_meta_data->>'authorized_role')::user_role,
    'Sales Associate'::user_role
  ),
  created_at,
  updated_at
FROM auth.users
WHERE id NOT IN (SELECT user_id FROM public.user_roles);
