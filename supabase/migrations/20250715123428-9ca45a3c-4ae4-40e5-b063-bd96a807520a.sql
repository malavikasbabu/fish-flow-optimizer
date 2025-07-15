
-- Add the admin user to profiles table
INSERT INTO public.profiles (id, full_name, role, region, organization)
VALUES (
  'admin-user-id-12345678-1234-1234-1234-123456789012',
  'System Administrator',
  'admin',
  'all_regions',
  'Fish Supply Chain System'
)
ON CONFLICT (id) DO UPDATE SET
  full_name = EXCLUDED.full_name,
  role = EXCLUDED.role,
  region = EXCLUDED.region,
  organization = EXCLUDED.organization;

-- Note: The actual user creation in auth.users table needs to be done through Supabase Auth
-- This profile will be linked when the admin user signs up with email: admin@321
