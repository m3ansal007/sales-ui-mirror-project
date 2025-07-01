/*
  # Add unique constraint to prevent duplicate leads

  1. Changes
    - Add unique constraint on (user_id, name, email, phone) combination
    - This prevents duplicate leads with same name, email, and phone for the same user
    - Allows same name with different email/phone combinations

  2. Security
    - Constraint only applies within the same user's leads
    - Maintains data integrity at database level
*/

-- Add unique constraint to prevent duplicate leads
-- This constraint allows:
-- - Same name with different email
-- - Same name with different phone
-- - Same name with different email AND phone
-- But prevents:
-- - Same name with same email AND same phone
CREATE UNIQUE INDEX CONCURRENTLY idx_leads_unique_name_email_phone 
ON public.leads (user_id, LOWER(TRIM(name)), LOWER(TRIM(COALESCE(email, ''))), TRIM(COALESCE(phone, '')))
WHERE email IS NOT NULL AND phone IS NOT NULL;

-- Add partial unique constraint for name + email (when phone is null)
CREATE UNIQUE INDEX CONCURRENTLY idx_leads_unique_name_email 
ON public.leads (user_id, LOWER(TRIM(name)), LOWER(TRIM(email)))
WHERE email IS NOT NULL AND phone IS NULL;

-- Add partial unique constraint for name + phone (when email is null)
CREATE UNIQUE INDEX CONCURRENTLY idx_leads_unique_name_phone 
ON public.leads (user_id, LOWER(TRIM(name)), TRIM(phone))
WHERE phone IS NOT NULL AND email IS NULL;