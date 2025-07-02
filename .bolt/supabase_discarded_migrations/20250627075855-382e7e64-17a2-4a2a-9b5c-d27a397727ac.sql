
-- Enable real-time updates for the leads table
ALTER TABLE public.leads REPLICA IDENTITY FULL;

-- Add the leads table to the realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.leads;

-- Also enable real-time for activities table to sync activity feed
ALTER TABLE public.activities REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.activities;
