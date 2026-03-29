-- Create missing profiles for existing users who don't have one
INSERT INTO public.profiles (user_id, company_name)
SELECT u.id, COALESCE(u.raw_user_meta_data->>'company_name', 'Empresa')
FROM auth.users u
WHERE NOT EXISTS (SELECT 1 FROM public.profiles p WHERE p.user_id = u.id);

-- Create missing user_roles for existing users
INSERT INTO public.user_roles (user_id, role)
SELECT u.id, 'user'::app_role
FROM auth.users u
WHERE NOT EXISTS (SELECT 1 FROM public.user_roles r WHERE r.user_id = u.id)
ON CONFLICT DO NOTHING;