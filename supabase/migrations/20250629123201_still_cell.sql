/*
  # Reset Sales Pipeline Data and Change Currency to INR

  1. Data Reset
    - Clear all existing sales pipeline data (leads, tasks, communications, appointments)
    - Keep user accounts and team member structure intact
    - Reset all financial values to 0

  2. Currency Update
    - All financial displays will be updated to show INR (₹) instead of USD ($)
    - This is handled in the frontend components

  3. Security
    - Maintains all RLS policies
    - Preserves user authentication and roles
*/

-- Reset all sales pipeline data while preserving user accounts and team structure
TRUNCATE TABLE public.activities RESTART IDENTITY CASCADE;
TRUNCATE TABLE public.communications RESTART IDENTITY CASCADE;
TRUNCATE TABLE public.appointments RESTART IDENTITY CASCADE;
TRUNCATE TABLE public.tasks RESTART IDENTITY CASCADE;
TRUNCATE TABLE public.leads RESTART IDENTITY CASCADE;

-- Reset sequences to start fresh
ALTER SEQUENCE IF EXISTS activities_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS communications_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS appointments_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS tasks_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS leads_id_seq RESTART WITH 1;

-- Add a comment to track the reset
COMMENT ON TABLE public.leads IS 'Sales pipeline data reset on 2025-01-29 - Currency changed to INR';
COMMENT ON TABLE public.tasks IS 'Sales pipeline data reset on 2025-01-29 - Currency changed to INR';
COMMENT ON TABLE public.communications IS 'Sales pipeline data reset on 2025-01-29 - Currency changed to INR';
COMMENT ON TABLE public.appointments IS 'Sales pipeline data reset on 2025-01-29 - Currency changed to INR';
COMMENT ON TABLE public.activities IS 'Sales pipeline data reset on 2025-01-29 - Currency changed to INR';