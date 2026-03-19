
-- Admin can delete any post
CREATE POLICY "Admins can delete any post" ON public.posts
FOR DELETE TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Admin can update any post
CREATE POLICY "Admins can update any post" ON public.posts
FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Admin can delete any comment
CREATE POLICY "Admins can delete any comment" ON public.comments
FOR DELETE TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Admin can update any comment
CREATE POLICY "Admins can update any comment" ON public.comments
FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Admin can update any profile (to assign company identifiers)
CREATE POLICY "Admins can update any profile" ON public.profiles
FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Admin can manage user_roles
CREATE POLICY "Admins can insert roles" ON public.user_roles
FOR INSERT TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete roles" ON public.user_roles
FOR DELETE TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Admin can insert categories
CREATE POLICY "Admins can insert categories" ON public.categories
FOR INSERT TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update categories" ON public.categories
FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Admin can post in staff-only categories (override the normal post insert)
-- The existing insert policy already allows any authenticated user to insert posts.
-- We just need to handle staff_only check in the frontend.

-- Admin can award badges to users
CREATE POLICY "Admins can insert user badges" ON public.user_badges
FOR INSERT TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Admin can manage missions progress
CREATE POLICY "Admins can update user missions" ON public.user_missions
FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Function to check if current user is admin (convenience)
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'
  )
$$;
