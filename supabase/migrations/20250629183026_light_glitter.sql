/*
  # Add auth_user_id to team_members table

  1. Changes
    - Add auth_user_id column to store the auth.users.id directly
    - This eliminates the need for admin API calls from the frontend
    - Allows secure access to user data without privileged operations

  2. Security
    - Maintains RLS policies
    - Stores auth user ID for direct reference
*/

-- Add auth_user_id column to team_members table
ALTER TABLE public.team_members 
ADD COLUMN IF NOT EXISTS auth_user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_team_members_auth_user_id ON public.team_members(auth_user_id);

-- Update existing team members to populate auth_user_id where possible
UPDATE public.team_members 
SET auth_user_id = (
  SELECT id FROM auth.users 
  WHERE auth.users.email = public.team_members.email
  LIMIT 1
)
WHERE auth_user_id IS NULL;