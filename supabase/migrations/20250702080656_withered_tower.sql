/*
  # Complete Database Schema Setup

  1. New Tables
    - `leads` - Lead management with assignments
    - `tasks` - Task and follow-up management
    - `communications` - Communication logs
    - `appointments` - Meeting and appointment scheduling
    - `team_members` - Team member management
    - `activities` - Activity feed and logging
    - `profiles` - User profile information
    - `user_roles` - Role-based access control

  2. Security
    - Enable RLS on all tables
    - Create comprehensive policies for data access
    - User-based data isolation

  3. Features
    - Activity logging with triggers
    - User role management
    - Team member assignment system
    - Performance indexes
*/

-- Create leads table
CREATE TABLE IF NOT EXISTS public.leads (
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

-- Add missing columns to leads table if they don't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'leads' AND column_name = 'assigned_team_member_id'
  ) THEN
    ALTER TABLE public.leads ADD COLUMN assigned_team_member_id UUID;
  END IF;
END $$;

-- Create tasks table
CREATE TABLE IF NOT EXISTS public.tasks (
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
CREATE TABLE IF NOT EXISTS public.communications (
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
CREATE TABLE IF NOT EXISTS public.appointments (
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
CREATE TABLE IF NOT EXISTS public.team_members (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  phone TEXT,
  role TEXT NOT NULL DEFAULT 'Sales Representative',
  status TEXT NOT NULL DEFAULT 'Active',
  hire_date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Add missing columns to team_members table if they don't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'team_members' AND column_name = 'temp_password'
  ) THEN
    ALTER TABLE public.team_members ADD COLUMN temp_password TEXT;
  END IF;
END $$;

-- Create activities table for activity feed
CREATE TABLE IF NOT EXISTS public.activities (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  lead_id UUID REFERENCES public.leads(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create profiles table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT,
  full_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create user_roles enum if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
    CREATE TYPE user_role AS ENUM ('Admin', 'Sales Manager', 'Sales Associate');
  END IF;
END $$;

-- Create user_roles table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.user_roles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  role user_role NOT NULL DEFAULT 'Sales Associate',
  assigned_by UUID,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Enable Row Level Security on all tables
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.communications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Function to safely create or replace policies
CREATE OR REPLACE FUNCTION create_policy_if_not_exists(
  policy_name TEXT,
  table_name TEXT,
  policy_type TEXT,
  policy_using TEXT DEFAULT NULL,
  policy_check TEXT DEFAULT NULL
) RETURNS VOID AS $$
BEGIN
  -- Drop policy if it exists
  EXECUTE format('DROP POLICY IF EXISTS %I ON %I', policy_name, table_name);
  
  -- Create the policy
  IF policy_check IS NOT NULL THEN
    EXECUTE format('CREATE POLICY %I ON %I FOR %s USING (%s) WITH CHECK (%s)', 
                   policy_name, table_name, policy_type, policy_using, policy_check);
  ELSIF policy_using IS NOT NULL THEN
    EXECUTE format('CREATE POLICY %I ON %I FOR %s USING (%s)', 
                   policy_name, table_name, policy_type, policy_using);
  ELSE
    EXECUTE format('CREATE POLICY %I ON %I FOR %s', 
                   policy_name, table_name, policy_type);
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Create RLS policies for leads
SELECT create_policy_if_not_exists('Users can view their own leads', 'public.leads', 'SELECT', 'auth.uid() = user_id');
SELECT create_policy_if_not_exists('Users can create their own leads', 'public.leads', 'INSERT', NULL, 'auth.uid() = user_id');
SELECT create_policy_if_not_exists('Users can update their own leads', 'public.leads', 'UPDATE', 'auth.uid() = user_id');
SELECT create_policy_if_not_exists('Users can delete their own leads', 'public.leads', 'DELETE', 'auth.uid() = user_id');

-- Create RLS policies for tasks
SELECT create_policy_if_not_exists('Users can view their own tasks', 'public.tasks', 'SELECT', 'auth.uid() = user_id');
SELECT create_policy_if_not_exists('Users can create their own tasks', 'public.tasks', 'INSERT', NULL, 'auth.uid() = user_id');
SELECT create_policy_if_not_exists('Users can update their own tasks', 'public.tasks', 'UPDATE', 'auth.uid() = user_id');
SELECT create_policy_if_not_exists('Users can delete their own tasks', 'public.tasks', 'DELETE', 'auth.uid() = user_id');

-- Create RLS policies for communications
SELECT create_policy_if_not_exists('Users can view their own communications', 'public.communications', 'SELECT', 'auth.uid() = user_id');
SELECT create_policy_if_not_exists('Users can create their own communications', 'public.communications', 'INSERT', NULL, 'auth.uid() = user_id');
SELECT create_policy_if_not_exists('Users can update their own communications', 'public.communications', 'UPDATE', 'auth.uid() = user_id');
SELECT create_policy_if_not_exists('Users can delete their own communications', 'public.communications', 'DELETE', 'auth.uid() = user_id');

-- Create RLS policies for appointments
SELECT create_policy_if_not_exists('Users can view their own appointments', 'public.appointments', 'SELECT', 'auth.uid() = user_id');
SELECT create_policy_if_not_exists('Users can create their own appointments', 'public.appointments', 'INSERT', NULL, 'auth.uid() = user_id');
SELECT create_policy_if_not_exists('Users can update their own appointments', 'public.appointments', 'UPDATE', 'auth.uid() = user_id');
SELECT create_policy_if_not_exists('Users can delete their own appointments', 'public.appointments', 'DELETE', 'auth.uid() = user_id');

-- Create RLS policies for team_members
SELECT create_policy_if_not_exists('Users can view their own team members', 'public.team_members', 'SELECT', 'auth.uid() = user_id');
SELECT create_policy_if_not_exists('Users can create their own team members', 'public.team_members', 'INSERT', NULL, 'auth.uid() = user_id');
SELECT create_policy_if_not_exists('Users can update their own team members', 'public.team_members', 'UPDATE', 'auth.uid() = user_id');
SELECT create_policy_if_not_exists('Users can delete their own team members', 'public.team_members', 'DELETE', 'auth.uid() = user_id');

-- Create additional team member policies for better access control
SELECT create_policy_if_not_exists('Users can view team members', 'public.team_members', 'SELECT', 'auth.uid() = user_id');
SELECT create_policy_if_not_exists('Users can create team members', 'public.team_members', 'INSERT', NULL, 'auth.uid() = user_id');
SELECT create_policy_if_not_exists('Users can update team members', 'public.team_members', 'UPDATE', 'auth.uid() = user_id');
SELECT create_policy_if_not_exists('Users can delete team members', 'public.team_members', 'DELETE', 'auth.uid() = user_id');

-- Create RLS policies for activities
SELECT create_policy_if_not_exists('Users can view their own activities', 'public.activities', 'SELECT', 'auth.uid() = user_id');
SELECT create_policy_if_not_exists('Users can create their own activities', 'public.activities', 'INSERT', NULL, 'auth.uid() = user_id');
SELECT create_policy_if_not_exists('Users can update their own activities', 'public.activities', 'UPDATE', 'auth.uid() = user_id');
SELECT create_policy_if_not_exists('Users can delete their own activities', 'public.activities', 'DELETE', 'auth.uid() = user_id');

-- Create RLS policies for profiles
SELECT create_policy_if_not_exists('Users can view their own profile', 'public.profiles', 'SELECT', 'auth.uid() = id');
SELECT create_policy_if_not_exists('Users can insert their own profile', 'public.profiles', 'INSERT', NULL, 'auth.uid() = id');
SELECT create_policy_if_not_exists('Users can update their own profile', 'public.profiles', 'UPDATE', 'auth.uid() = id');

-- Create RLS policies for user_roles
SELECT create_policy_if_not_exists('Users can view own role', 'public.user_roles', 'SELECT', 'user_id = auth.uid()');

-- Drop the helper function
DROP FUNCTION create_policy_if_not_exists(TEXT, TEXT, TEXT, TEXT, TEXT);

-- Create function to automatically log activities
CREATE OR REPLACE FUNCTION public.log_activity()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.activities (user_id, lead_id, type, title, description, metadata)
  VALUES (
    NEW.user_id,
    CASE 
      WHEN TG_TABLE_NAME = 'leads' THEN NEW.id
      ELSE NEW.lead_id
    END,
    CASE 
      WHEN TG_OP = 'INSERT' THEN 'created'
      WHEN TG_OP = 'UPDATE' THEN 'updated'
      ELSE 'action'
    END,
    CASE 
      WHEN TG_TABLE_NAME = 'leads' AND TG_OP = 'INSERT' THEN 'New lead added'
      WHEN TG_TABLE_NAME = 'leads' AND TG_OP = 'UPDATE' THEN 'Lead updated'
      WHEN TG_TABLE_NAME = 'tasks' AND TG_OP = 'INSERT' THEN 'Task created'
      WHEN TG_TABLE_NAME = 'tasks' AND TG_OP = 'UPDATE' THEN 'Task updated'
      WHEN TG_TABLE_NAME = 'communications' AND TG_OP = 'INSERT' THEN 'Communication logged'
      WHEN TG_TABLE_NAME = 'appointments' AND TG_OP = 'INSERT' THEN 'Appointment scheduled'
      ELSE 'Activity logged'
    END,
    CASE 
      WHEN TG_TABLE_NAME = 'leads' THEN NEW.name
      WHEN TG_TABLE_NAME = 'tasks' THEN NEW.title
      WHEN TG_TABLE_NAME = 'communications' THEN NEW.subject
      WHEN TG_TABLE_NAME = 'appointments' THEN NEW.title
      ELSE 'Activity'
    END,
    to_jsonb(NEW)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create special function for leads activity logging
CREATE OR REPLACE FUNCTION public.log_leads_activity()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.activities (user_id, lead_id, type, title, description, metadata)
  VALUES (
    NEW.user_id,
    NEW.id,
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

-- Create function to get user role
CREATE OR REPLACE FUNCTION public.get_user_role(user_uuid UUID DEFAULT auth.uid())
RETURNS user_role AS $$
BEGIN
  RETURN (
    SELECT role 
    FROM public.user_roles 
    WHERE user_id = user_uuid AND is_active = true
    LIMIT 1
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to handle new user registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'full_name');
  
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'Sales Associate'));
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to handle new user role assignment
CREATE OR REPLACE FUNCTION public.handle_new_user_role()
RETURNS TRIGGER AS $$
BEGIN
  -- Create a team member record for the new user
  INSERT INTO public.team_members (user_id, name, email, role, status)
  VALUES (
    NEW.user_id,
    COALESCE((SELECT full_name FROM public.profiles WHERE id = NEW.user_id), 'Unknown'),
    COALESCE((SELECT email FROM public.profiles WHERE id = NEW.user_id), 'unknown@example.com'),
    CASE 
      WHEN NEW.role = 'Admin' THEN 'admin'
      WHEN NEW.role = 'Sales Manager' THEN 'sales_manager'
      WHEN NEW.role = 'Sales Associate' THEN 'sales_associate'
      ELSE 'sales_associate'
    END,
    'active'
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to create team member account
CREATE OR REPLACE FUNCTION public.create_team_member_account()
RETURNS TRIGGER AS $$
DECLARE
  new_user_id UUID;
BEGIN
  -- This function will be called by the application layer
  -- For now, just return the NEW record
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing triggers if they exist
DROP TRIGGER IF EXISTS leads_activity_trigger ON public.leads;
DROP TRIGGER IF EXISTS tasks_activity_trigger ON public.tasks;
DROP TRIGGER IF EXISTS communications_activity_trigger ON public.communications;
DROP TRIGGER IF EXISTS appointments_activity_trigger ON public.appointments;
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS on_user_role_created ON public.user_roles;
DROP TRIGGER IF EXISTS on_team_member_created ON public.team_members;

-- Create triggers to log activities
CREATE TRIGGER leads_activity_trigger AFTER INSERT OR UPDATE ON public.leads FOR EACH ROW EXECUTE FUNCTION public.log_leads_activity();
CREATE TRIGGER tasks_activity_trigger AFTER INSERT OR UPDATE ON public.tasks FOR EACH ROW EXECUTE FUNCTION public.log_activity();
CREATE TRIGGER communications_activity_trigger AFTER INSERT OR UPDATE ON public.communications FOR EACH ROW EXECUTE FUNCTION public.log_activity();
CREATE TRIGGER appointments_activity_trigger AFTER INSERT OR UPDATE ON public.appointments FOR EACH ROW EXECUTE FUNCTION public.log_activity();

-- Create trigger for new user registration
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create trigger for new user role assignment
CREATE TRIGGER on_user_role_created
  AFTER INSERT ON public.user_roles
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_role();

-- Create trigger for team member creation
CREATE TRIGGER on_team_member_created
  AFTER INSERT ON public.team_members
  FOR EACH ROW EXECUTE FUNCTION public.create_team_member_account();

-- Add foreign key constraints if they don't exist
DO $$
BEGIN
  -- Add foreign key for assigned_team_member_id in leads table
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'leads_assigned_team_member_id_fkey'
  ) THEN
    ALTER TABLE public.leads 
    ADD CONSTRAINT leads_assigned_team_member_id_fkey 
    FOREIGN KEY (assigned_team_member_id) REFERENCES public.team_members(id);
  END IF;
END $$;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_leads_user_id ON public.leads(user_id);
CREATE INDEX IF NOT EXISTS idx_leads_assigned_team_member ON public.leads(assigned_team_member_id);
CREATE INDEX IF NOT EXISTS idx_tasks_user_id ON public.tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_tasks_lead_id ON public.tasks(lead_id);
CREATE INDEX IF NOT EXISTS idx_communications_user_id ON public.communications(user_id);
CREATE INDEX IF NOT EXISTS idx_communications_lead_id ON public.communications(lead_id);
CREATE INDEX IF NOT EXISTS idx_appointments_user_id ON public.appointments(user_id);
CREATE INDEX IF NOT EXISTS idx_appointments_lead_id ON public.appointments(lead_id);
CREATE INDEX IF NOT EXISTS idx_team_members_user_id ON public.team_members(user_id);
CREATE INDEX IF NOT EXISTS idx_activities_user_id ON public.activities(user_id);
CREATE INDEX IF NOT EXISTS idx_activities_lead_id ON public.activities(lead_id);