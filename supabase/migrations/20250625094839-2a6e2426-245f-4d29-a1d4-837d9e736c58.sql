
-- First, let's drop all existing triggers and functions to start fresh
DROP TRIGGER IF EXISTS leads_activity_trigger ON public.leads;
DROP TRIGGER IF EXISTS tasks_activity_trigger ON public.tasks;
DROP TRIGGER IF EXISTS communications_activity_trigger ON public.communications;
DROP TRIGGER IF EXISTS appointments_activity_trigger ON public.appointments;

-- Drop all versions of the activity logging functions
DROP FUNCTION IF EXISTS public.log_activity();
DROP FUNCTION IF EXISTS public.log_leads_activity();
DROP FUNCTION IF EXISTS public.log_tasks_activity();
DROP FUNCTION IF EXISTS public.log_communications_activity();
DROP FUNCTION IF EXISTS public.log_appointments_activity();

-- Create a single, robust activity logging function
CREATE OR REPLACE FUNCTION public.log_activity()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.activities (user_id, lead_id, type, title, description, metadata)
  VALUES (
    NEW.user_id,
    CASE 
      WHEN TG_TABLE_NAME = 'leads' THEN NEW.id
      WHEN TG_TABLE_NAME = 'tasks' THEN NEW.lead_id
      WHEN TG_TABLE_NAME = 'communications' THEN NEW.lead_id
      WHEN TG_TABLE_NAME = 'appointments' THEN NEW.lead_id
      ELSE NULL
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

-- Create the trigger for leads table only (since that's where the error is occurring)
CREATE TRIGGER leads_activity_trigger 
  AFTER INSERT OR UPDATE ON public.leads 
  FOR EACH ROW EXECUTE FUNCTION public.log_activity();

-- Optionally, create triggers for other tables if needed
CREATE TRIGGER tasks_activity_trigger 
  AFTER INSERT OR UPDATE ON public.tasks 
  FOR EACH ROW EXECUTE FUNCTION public.log_activity();

CREATE TRIGGER communications_activity_trigger 
  AFTER INSERT OR UPDATE ON public.communications 
  FOR EACH ROW EXECUTE FUNCTION public.log_activity();

CREATE TRIGGER appointments_activity_trigger 
  AFTER INSERT OR UPDATE ON public.appointments 
  FOR EACH ROW EXECUTE FUNCTION public.log_activity();
