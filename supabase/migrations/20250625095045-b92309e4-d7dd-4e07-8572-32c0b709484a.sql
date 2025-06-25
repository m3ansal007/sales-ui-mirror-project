
-- Drop all existing triggers to start completely fresh
DROP TRIGGER IF EXISTS leads_activity_trigger ON public.leads;
DROP TRIGGER IF EXISTS tasks_activity_trigger ON public.tasks; 
DROP TRIGGER IF EXISTS communications_activity_trigger ON public.communications;
DROP TRIGGER IF EXISTS appointments_activity_trigger ON public.appointments;

-- Drop all activity logging functions
DROP FUNCTION IF EXISTS public.log_activity();
DROP FUNCTION IF EXISTS public.log_leads_activity();
DROP FUNCTION IF EXISTS public.log_tasks_activity();
DROP FUNCTION IF EXISTS public.log_communications_activity();
DROP FUNCTION IF EXISTS public.log_appointments_activity();

-- Create a simple leads-only activity logging function first
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

-- Create ONLY the leads trigger for now to test
CREATE TRIGGER leads_activity_trigger 
  AFTER INSERT OR UPDATE ON public.leads 
  FOR EACH ROW EXECUTE FUNCTION public.log_leads_activity();
