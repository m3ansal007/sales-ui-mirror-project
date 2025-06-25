-- Fix the log_activity function to handle leads table correctly
CREATE OR REPLACE FUNCTION public.log_activity()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.activities (user_id, lead_id, type, title, description, metadata)
  VALUES (
    NEW.user_id,
    CASE TG_TABLE_NAME
      WHEN 'leads' THEN NEW.id
      WHEN 'tasks' THEN NEW.lead_id
      WHEN 'communications' THEN NEW.lead_id
      WHEN 'appointments' THEN NEW.lead_id
      ELSE NULL
    END,
    CASE TG_OP
      WHEN 'INSERT' THEN 'created'
      WHEN 'UPDATE' THEN 'updated'
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
    CASE TG_TABLE_NAME
      WHEN 'leads' THEN NEW.name
      WHEN 'tasks' THEN NEW.title
      WHEN 'communications' THEN NEW.subject
      WHEN 'appointments' THEN NEW.title
      ELSE 'Activity'
    END,
    to_jsonb(NEW)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;