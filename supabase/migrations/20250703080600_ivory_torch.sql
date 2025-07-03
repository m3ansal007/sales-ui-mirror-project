/*
  # Prevent Duplicate Leads

  1. Database Constraints
    - Add unique constraints to prevent duplicate leads
    - Create partial unique indexes for email and phone (ignoring nulls)
    - Add constraint to prevent duplicate name + email combinations
    - Add constraint to prevent duplicate name + phone combinations

  2. Security
    - Maintains existing RLS policies
    - Ensures data integrity at database level
*/

-- Create partial unique index for email (ignoring nulls)
CREATE UNIQUE INDEX IF NOT EXISTS idx_leads_unique_email 
ON public.leads (user_id, LOWER(email)) 
WHERE email IS NOT NULL AND email != '';

-- Create partial unique index for phone (ignoring nulls)
CREATE UNIQUE INDEX IF NOT EXISTS idx_leads_unique_phone 
ON public.leads (user_id, phone) 
WHERE phone IS NOT NULL AND phone != '';

-- Create unique index for name + email combination (ignoring null emails)
CREATE UNIQUE INDEX IF NOT EXISTS idx_leads_unique_name_email 
ON public.leads (user_id, LOWER(name), LOWER(email)) 
WHERE email IS NOT NULL AND email != '';

-- Create unique index for name + phone combination (ignoring null phones)
CREATE UNIQUE INDEX IF NOT EXISTS idx_leads_unique_name_phone 
ON public.leads (user_id, LOWER(name), phone) 
WHERE phone IS NOT NULL AND phone != '';

-- Function to check for duplicate leads before insert/update
CREATE OR REPLACE FUNCTION public.check_lead_duplicates()
RETURNS TRIGGER AS $$
BEGIN
  -- Check for duplicate email (case insensitive)
  IF NEW.email IS NOT NULL AND NEW.email != '' THEN
    IF EXISTS (
      SELECT 1 FROM public.leads 
      WHERE user_id = NEW.user_id 
        AND LOWER(email) = LOWER(NEW.email) 
        AND id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid)
    ) THEN
      RAISE EXCEPTION 'A lead with this email address already exists';
    END IF;
  END IF;

  -- Check for duplicate phone
  IF NEW.phone IS NOT NULL AND NEW.phone != '' THEN
    IF EXISTS (
      SELECT 1 FROM public.leads 
      WHERE user_id = NEW.user_id 
        AND phone = NEW.phone 
        AND id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid)
    ) THEN
      RAISE EXCEPTION 'A lead with this phone number already exists';
    END IF;
  END IF;

  -- Check for duplicate name + email combination
  IF NEW.name IS NOT NULL AND NEW.email IS NOT NULL AND NEW.email != '' THEN
    IF EXISTS (
      SELECT 1 FROM public.leads 
      WHERE user_id = NEW.user_id 
        AND LOWER(name) = LOWER(NEW.name) 
        AND LOWER(email) = LOWER(NEW.email)
        AND id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid)
    ) THEN
      RAISE EXCEPTION 'A lead with this name and email combination already exists';
    END IF;
  END IF;

  -- Check for duplicate name + phone combination
  IF NEW.name IS NOT NULL AND NEW.phone IS NOT NULL AND NEW.phone != '' THEN
    IF EXISTS (
      SELECT 1 FROM public.leads 
      WHERE user_id = NEW.user_id 
        AND LOWER(name) = LOWER(NEW.name) 
        AND phone = NEW.phone
        AND id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid)
    ) THEN
      RAISE EXCEPTION 'A lead with this name and phone combination already exists';
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to check for duplicates before insert or update
DROP TRIGGER IF EXISTS check_lead_duplicates_trigger ON public.leads;
CREATE TRIGGER check_lead_duplicates_trigger
  BEFORE INSERT OR UPDATE ON public.leads
  FOR EACH ROW EXECUTE FUNCTION public.check_lead_duplicates();