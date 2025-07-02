
-- First, let's create the team_members table with proper hierarchy
CREATE TABLE public.team_members (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'sales_manager', 'sales_associate')),
  manager_id UUID REFERENCES public.team_members(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  phone TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Update the leads table structure
ALTER TABLE public.leads 
DROP COLUMN IF EXISTS assigned_to,
ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS assigned_by UUID REFERENCES public.team_members(id) ON DELETE SET NULL;

-- Update user_id to created_by for consistency
UPDATE public.leads SET created_by = user_id WHERE created_by IS NULL;

-- Enable RLS on team_members
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;

-- RLS Policies for team_members
-- Admins can see everyone
CREATE POLICY "Admins can view all team members" 
  ON public.team_members 
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.team_members tm 
      WHERE tm.user_id = auth.uid() 
      AND tm.role = 'admin'
    )
  );

-- Sales Managers can see their team and themselves
CREATE POLICY "Sales Managers can view their team" 
  ON public.team_members 
  FOR SELECT 
  USING (
    user_id = auth.uid() 
    OR manager_id = (
      SELECT id FROM public.team_members 
      WHERE user_id = auth.uid() 
      AND role = 'sales_manager'
    )
    OR EXISTS (
      SELECT 1 FROM public.team_members tm 
      WHERE tm.user_id = auth.uid() 
      AND tm.role = 'sales_manager'
      AND public.team_members.role = 'sales_associate'
    )
  );

-- Sales Associates can only see themselves
CREATE POLICY "Sales Associates can view themselves" 
  ON public.team_members 
  FOR SELECT 
  USING (user_id = auth.uid());

-- Insert/Update/Delete policies for team_members
CREATE POLICY "Admins can manage all team members" 
  ON public.team_members 
  FOR ALL 
  USING (
    EXISTS (
      SELECT 1 FROM public.team_members tm 
      WHERE tm.user_id = auth.uid() 
      AND tm.role = 'admin'
    )
  );

CREATE POLICY "Sales Managers can create Sales Associates" 
  ON public.team_members 
  FOR INSERT 
  WITH CHECK (
    role = 'sales_associate' 
    AND EXISTS (
      SELECT 1 FROM public.team_members tm 
      WHERE tm.user_id = auth.uid() 
      AND tm.role = 'sales_manager'
    )
  );

-- Update RLS policies for leads to use new structure
DROP POLICY IF EXISTS "Users can view their own leads" ON public.leads;
DROP POLICY IF EXISTS "Users can create their own leads" ON public.leads;
DROP POLICY IF EXISTS "Users can update their own leads" ON public.leads;
DROP POLICY IF EXISTS "Users can delete their own leads" ON public.leads;

-- New lead policies based on roles
CREATE POLICY "Admins can view all leads" 
  ON public.leads 
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.team_members tm 
      WHERE tm.user_id = auth.uid() 
      AND tm.role = 'admin'
    )
  );

CREATE POLICY "Sales Managers can view relevant leads" 
  ON public.leads 
  FOR SELECT 
  USING (
    created_by = auth.uid() 
    OR assigned_team_member_id = (
      SELECT id FROM public.team_members 
      WHERE user_id = auth.uid()
    )
    OR assigned_team_member_id IN (
      SELECT id FROM public.team_members 
      WHERE manager_id = (
        SELECT id FROM public.team_members 
        WHERE user_id = auth.uid() 
        AND role = 'sales_manager'
      )
    )
  );

CREATE POLICY "Sales Associates can view their leads" 
  ON public.leads 
  FOR SELECT 
  USING (
    created_by = auth.uid() 
    OR assigned_team_member_id = (
      SELECT id FROM public.team_members 
      WHERE user_id = auth.uid()
    )
  );

-- Lead management policies
CREATE POLICY "Users can create leads" 
  ON public.leads 
  FOR INSERT 
  WITH CHECK (created_by = auth.uid());

CREATE POLICY "Admins can manage all leads" 
  ON public.leads 
  FOR ALL 
  USING (
    EXISTS (
      SELECT 1 FROM public.team_members tm 
      WHERE tm.user_id = auth.uid() 
      AND tm.role = 'admin'
    )
  );

CREATE POLICY "Sales Managers can update relevant leads" 
  ON public.leads 
  FOR UPDATE 
  USING (
    created_by = auth.uid() 
    OR assigned_team_member_id = (
      SELECT id FROM public.team_members 
      WHERE user_id = auth.uid()
    )
    OR assigned_team_member_id IN (
      SELECT id FROM public.team_members 
      WHERE manager_id = (
        SELECT id FROM public.team_members 
        WHERE user_id = auth.uid() 
        AND role = 'sales_manager'
      )
    )
  );

CREATE POLICY "Sales Associates can update their leads" 
  ON public.leads 
  FOR UPDATE 
  USING (
    created_by = auth.uid() 
    OR assigned_team_member_id = (
      SELECT id FROM public.team_members 
      WHERE user_id = auth.uid()
    )
  );

-- Function to automatically create team member on user signup
CREATE OR REPLACE FUNCTION public.handle_new_team_member()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_role_from_metadata text;
BEGIN
  -- Get role from user metadata, default to 'sales_associate'
  user_role_from_metadata := COALESCE(
    NEW.raw_user_meta_data->>'role',
    'sales_associate'
  );
  
  -- Insert team member record
  INSERT INTO public.team_members (
    user_id, 
    role, 
    name, 
    email
  )
  VALUES (
    NEW.id,
    user_role_from_metadata,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    NEW.email
  );
  
  RETURN NEW;
END;
$$;

-- Create trigger to automatically create team member on user creation
CREATE TRIGGER on_auth_user_created_team_member
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_team_member();
