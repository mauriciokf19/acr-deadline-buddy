-- Fix trigger functions missing search_path
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.check_obrigacao_atrasada()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.deadline_oficial < now() AND NEW.estado != 'concluido' THEN
    NEW.estado = 'atrasado';
  END IF;
  RETURN NEW;
END;
$$;

-- Remove legacy role column from profiles
ALTER TABLE public.profiles DROP COLUMN IF EXISTS role;