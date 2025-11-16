-- ============================================
-- Security Fixes for ACR Deadlines
-- ============================================

-- 1. Fix logs table RLS policies
-- Remove overly permissive policies
DROP POLICY IF EXISTS "Authenticated users can insert logs" ON public.logs;
DROP POLICY IF EXISTS "Authenticated users can view logs" ON public.logs;

-- Create restrictive policies for logs
CREATE POLICY "Users can insert their own logs"
  ON public.logs
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can view their own logs"
  ON public.logs
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- 2. Create user_roles system
CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');

CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL DEFAULT 'user',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create security definer function for role checks
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- RLS policies for user_roles table
CREATE POLICY "Users can view their own roles"
  ON public.user_roles
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Only admins can manage roles"
  ON public.user_roles
  FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Migrate existing role data from profiles to user_roles
INSERT INTO public.user_roles (user_id, role)
SELECT id, 
  CASE 
    WHEN role = 'admin' THEN 'admin'::app_role
    WHEN role = 'moderator' THEN 'moderator'::app_role
    ELSE 'user'::app_role
  END
FROM public.profiles
WHERE role IS NOT NULL
ON CONFLICT (user_id, role) DO NOTHING;

-- Remove role column from profiles (keeping for backwards compatibility initially)
-- ALTER TABLE public.profiles DROP COLUMN IF EXISTS role;

-- 3. Fix handle_new_user function search path
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, nome, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'nome', 'Utilizador'),
    NEW.email
  );
  
  -- Assign default 'user' role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user')
  ON CONFLICT (user_id, role) DO NOTHING;
  
  RETURN NEW;
END;
$$;

-- 4. Fix storage bucket RLS policies
DROP POLICY IF EXISTS "Allow authenticated uploads" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated reads" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated deletes" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated updates" ON storage.objects;

-- Create path-based storage policies
CREATE POLICY "Users can upload own comprovativos"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'comprovativos' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Users can view own comprovativos"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'comprovativos' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Users can update own comprovativos"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'comprovativos' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Users can delete own comprovativos"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'comprovativos' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON public.user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role ON public.user_roles(role);