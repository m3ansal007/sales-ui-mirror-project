
-- Enable Row Level Security on team_members table
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;

-- Create policy that allows users to view team members in their organization
CREATE POLICY "Users can view team members" 
  ON public.team_members 
  FOR SELECT 
  USING (auth.uid() = user_id);

-- Create policy that allows users to insert team members
CREATE POLICY "Users can create team members" 
  ON public.team_members 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- Create policy that allows users to update team members
CREATE POLICY "Users can update team members" 
  ON public.team_members 
  FOR UPDATE 
  USING (auth.uid() = user_id);

-- Create policy that allows users to delete team members
CREATE POLICY "Users can delete team members" 
  ON public.team_members 
  FOR DELETE 
  USING (auth.uid() = user_id);
