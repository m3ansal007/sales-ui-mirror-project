
-- Create leads table
CREATE TABLE public.leads (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  company TEXT,
  source TEXT,
  status TEXT NOT NULL DEFAULT 'New',
  assigned_to UUID REFERENCES auth.users(id),
  notes TEXT,
  value DECIMAL(10,2),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create tasks table
CREATE TABLE public.tasks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  lead_id UUID REFERENCES public.leads(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL DEFAULT 'Task',
  priority TEXT NOT NULL DEFAULT 'Medium',
  status TEXT NOT NULL DEFAULT 'Pending',
  due_date DATE,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create communications table
CREATE TABLE public.communications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  lead_id UUID REFERENCES public.leads(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  subject TEXT NOT NULL,
  content TEXT,
  duration INTEGER,
  status TEXT NOT NULL DEFAULT 'Completed',
  scheduled_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create appointments table
CREATE TABLE public.appointments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  lead_id UUID REFERENCES public.leads(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL DEFAULT 'Meeting',
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE NOT NULL,
  location TEXT,
  status TEXT NOT NULL DEFAULT 'Scheduled',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create team_members table
CREATE TABLE public.team_members (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  phone TEXT,
  role TEXT NOT NULL DEFAULT 'Sales Representative',
  status TEXT NOT NULL DEFAULT 'Active',
  hire_date DATE DEFAULT CURRENT_DATE,
  temp_password TEXT,
  auth_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create activities table for activity feed
CREATE TABLE public.activities (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  lead_id UUID REFERENCES public.leads(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create profiles table to store additional user information
CREATE TABLE public.profiles (
  id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT,
  full_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create user_roles enum and table
CREATE TYPE public.user_role AS ENUM ('Admin', 'Sales Manager', 'Sales Associate');

CREATE TABLE public.user_roles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role public.user_role NOT NULL DEFAULT 'Sales Associate',
  is_active BOOLEAN NOT NULL DEFAULT true,
  assigned_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, role)
);

-- Add assigned_team_member_id to leads table
ALTER TABLE public.leads 
ADD COLUMN IF NOT EXISTS assigned_team_member_id UUID REFERENCES public.team_members(id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_leads_assigned_team_member ON public.leads(assigned_team_member_id);
CREATE INDEX IF NOT EXISTS idx_team_members_auth_user_id ON public.team_members(auth_user_id);

-- Enable Row Level Security on all tables
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.communications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for leads
CREATE POLICY "Users can view their own leads" ON public.leads FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own leads" ON public.leads FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own leads" ON public.leads FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own leads" ON public.leads FOR DELETE USING (auth.uid() = user_id);

-- Create RLS policies for tasks
CREATE POLICY "Users can view their own tasks" ON public.tasks FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own tasks" ON public.tasks FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own tasks" ON public.tasks FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own tasks" ON public.tasks FOR DELETE USING (auth.uid() = user_id);

-- Create RLS policies for communications
CREATE POLICY "Users can view their own communications" ON public.communications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own communications" ON public.communications FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own communications" ON public.communications FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own communications" ON public.communications FOR DELETE USING (auth.uid() = user_id);

-- Create RLS policies for appointments
CREATE POLICY "Users can view their own appointments" ON public.appointments FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own appointments" ON public.appointments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own appointments" ON public.appointments FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own appointments" ON public.appointments FOR DELETE USING (auth.uid() = user_id);

-- Create RLS policies for team_members
CREATE POLICY "Users can view team members" ON public.team_members FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create team members" ON public.team_members FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update team members" ON public.team_members FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete team members" ON public.team_members FOR DELETE USING (auth.uid() = user_id);

-- Create RLS policies for activities
CREATE POLICY "Users can view their own activities" ON public.activities FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own activities" ON public.activities FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own activities" ON public.activities FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own activities" ON public.activities FOR DELETE USING (auth.uid() = user_id);

-- Create RLS policies for profiles
CREATE POLICY "Users can view their own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert their own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Create RLS policies for user_roles
CREATE POLICY "Users can view own role" ON public.user_roles FOR SELECT USING (user_id = auth.uid());

-- Function to handle new user profile creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to handle new user role creation
CREATE OR REPLACE FUNCTION public.handle_new_user_role()
RETURNS TRIGGER AS $$
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user role
CREATE OR REPLACE FUNCTION public.get_user_role(user_uuid uuid DEFAULT auth.uid())
RETURNS user_role
LANGUAGE sql
STABLE SECURITY DEFINER
AS $$
  SELECT role 
  FROM public.user_roles 
  WHERE user_id = user_uuid 
    AND is_active = true
  LIMIT 1;
$$;

-- Function to automatically create user accounts for team members
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

-- Function for activity logging
CREATE OR REPLACE FUNCTION public.log_leads_activity()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.activities (user_id, lead_id, type, title, description, metadata)
  VALUES (
    NEW.user_id,
    NEW.id,  -- For leads table, the lead_id should be the lead's own id
    CASE 
      WHEN TG_OP = 'INSERT' THEN 'created'
      WHEN TG_OP = 'UPDATE' THEN 'updated'
      ELSE 'action'
    END,
    CASE 
      WHEN TG_OP = 'INSERT' THEN 'New lead added'
      WHEN TG_OP = 'UPDATE' THEN 'Lead updated'
      ELSE 'Lead activity'
    END,
    NEW.name,
    to_jsonb(NEW)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to automatically create profile when user signs up
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Trigger to automatically create user role when user signs up
CREATE TRIGGER on_auth_user_role_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_role();

-- Trigger to automatically create user accounts when team members are added
CREATE TRIGGER on_team_member_created
  AFTER INSERT ON public.team_members
  FOR EACH ROW
  EXECUTE FUNCTION public.create_team_member_account();

-- Trigger for activity logging on leads
CREATE TRIGGER leads_activity_trigger 
  AFTER INSERT OR UPDATE ON public.leads 
  FOR EACH ROW EXECUTE FUNCTION public.log_leads_activity();

-- Make blindspotofficials@gmail.com an Admin (if exists)
UPDATE auth.users 
SET raw_user_meta_data = COALESCE(raw_user_meta_data, '{}'::jsonb) || '{"role": "Admin"}'::jsonb,
    updated_at = now()
WHERE email = 'blindspotofficials@gmail.com';
