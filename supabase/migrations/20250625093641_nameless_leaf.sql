/*
  # Fix Activity Trigger Functions

  1. Problem Resolution
    - Drop existing generic trigger function that causes column access errors
    - Create table-specific trigger functions to avoid column conflicts
    - Recreate triggers with appropriate functions for each table

  2. Changes
    - Remove generic log_activity function and triggers
    - Add log_leads_activity function for leads table
    - Add log_tasks_activity function for tasks table  
    - Add log_communications_activity function for communications table
    - Add log_appointments_activity function for appointments table
    - Create new triggers pointing to specific functions

  3. Security
    - All functions maintain RLS and security definer properties
    - Each function only accesses columns that exist in its target table
*/

-- Drop existing triggers
DROP TRIGGER IF EXISTS leads_activity_trigger ON public.leads;
DROP TRIGGER IF EXISTS tasks_activity_trigger ON public.tasks;
DROP TRIGGER IF EXISTS communications_activity_trigger ON public.communications;
DROP TRIGGER IF EXISTS appointments_activity_trigger ON public.appointments;

-- Drop the problematic generic function
DROP FUNCTION IF EXISTS public.log_activity();

-- Create table-specific trigger functions

-- Function for leads table
CREATE OR REPLACE FUNCTION public.log_leads_activity()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.activities (user_id, lead_id, type, title, description, metadata)
  VALUES (
    NEW.user_id,
    NEW.id,  -- For leads table, use the lead's own ID
    CASE TG_OP
      WHEN 'INSERT' THEN 'created'
      WHEN 'UPDATE' THEN 'updated'
      ELSE 'action'
    END,
    CASE TG_OP
      WHEN 'INSERT' THEN 'New lead added'
      WHEN 'UPDATE' THEN 'Lead updated'
      ELSE 'Lead activity'
    END,
    NEW.name,
    to_jsonb(NEW)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function for tasks table
CREATE OR REPLACE FUNCTION public.log_tasks_activity()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.activities (user_id, lead_id, type, title, description, metadata)
  VALUES (
    NEW.user_id,
    NEW.lead_id,  -- Tasks have lead_id column
    CASE TG_OP
      WHEN 'INSERT' THEN 'created'
      WHEN 'UPDATE' THEN 'updated'
      ELSE 'action'
    END,
    CASE TG_OP
      WHEN 'INSERT' THEN 'Task created'
      WHEN 'UPDATE' THEN 'Task updated'
      ELSE 'Task activity'
    END,
    NEW.title,
    to_jsonb(NEW)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function for communications table
CREATE OR REPLACE FUNCTION public.log_communications_activity()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.activities (user_id, lead_id, type, title, description, metadata)
  VALUES (
    NEW.user_id,
    NEW.lead_id,  -- Communications have lead_id column
    CASE TG_OP
      WHEN 'INSERT' THEN 'created'
      WHEN 'UPDATE' THEN 'updated'
      ELSE 'action'
    END,
    CASE TG_OP
      WHEN 'INSERT' THEN 'Communication logged'
      WHEN 'UPDATE' THEN 'Communication updated'
      ELSE 'Communication activity'
    END,
    NEW.subject,
    to_jsonb(NEW)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function for appointments table
CREATE OR REPLACE FUNCTION public.log_appointments_activity()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.activities (user_id, lead_id, type, title, description, metadata)
  VALUES (
    NEW.user_id,
    NEW.lead_id,  -- Appointments have lead_id column
    CASE TG_OP
      WHEN 'INSERT' THEN 'created'
      WHEN 'UPDATE' THEN 'updated'
      ELSE 'action'
    END,
    CASE TG_OP
      WHEN 'INSERT' THEN 'Appointment scheduled'
      WHEN 'UPDATE' THEN 'Appointment updated'
      ELSE 'Appointment activity'
    END,
    NEW.title,
    to_jsonb(NEW)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create new triggers with table-specific functions
CREATE TRIGGER leads_activity_trigger 
  AFTER INSERT OR UPDATE ON public.leads 
  FOR EACH ROW EXECUTE FUNCTION public.log_leads_activity();

CREATE TRIGGER tasks_activity_trigger 
  AFTER INSERT OR UPDATE ON public.tasks 
  FOR EACH ROW EXECUTE FUNCTION public.log_tasks_activity();

CREATE TRIGGER communications_activity_trigger 
  AFTER INSERT OR UPDATE ON public.communications 
  FOR EACH ROW EXECUTE FUNCTION public.log_communications_activity();

CREATE TRIGGER appointments_activity_trigger 
  AFTER INSERT OR UPDATE ON public.appointments 
  FOR EACH ROW EXECUTE FUNCTION public.log_appointments_activity();