/*
  # Make blindspotofficials@gmail.com an Admin

  1. Updates
    - Update user metadata to set role as 'Admin' for blindspotofficials@gmail.com
    - This will give them full access to all features including team management and settings

  2. Security
    - Only updates the specific user email provided
    - Maintains existing user data and permissions
*/

-- Update the user metadata to set role as Admin for blindspotofficials@gmail.com
UPDATE auth.users 
SET raw_user_meta_data = COALESCE(raw_user_meta_data, '{}'::jsonb) || '{"role": "Admin"}'::jsonb
WHERE email = 'blindspotofficials@gmail.com';

-- Also update the updated_at timestamp
UPDATE auth.users 
SET updated_at = now()
WHERE email = 'blindspotofficials@gmail.com';