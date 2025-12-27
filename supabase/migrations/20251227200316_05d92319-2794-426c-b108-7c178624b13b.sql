-- Fix security: Ensure owner_id and tenant_id are always set on contacts table
CREATE TRIGGER set_contacts_owner_id
BEFORE INSERT ON public.contacts
FOR EACH ROW
EXECUTE FUNCTION public.set_owner_id();

-- Create trigger to set tenant_id on contacts if not provided
CREATE OR REPLACE FUNCTION public.set_tenant_id()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.tenant_id IS NULL THEN
    NEW.tenant_id := auth.uid();
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER set_contacts_tenant_id
BEFORE INSERT ON public.contacts
FOR EACH ROW
EXECUTE FUNCTION public.set_tenant_id();

-- Fix security: Ensure owner_id is always set on email_accounts table
CREATE TRIGGER set_email_accounts_owner_id
BEFORE INSERT ON public.email_accounts
FOR EACH ROW
EXECUTE FUNCTION public.set_owner_id();

-- Ensure tenant_id is set on email_accounts too
CREATE TRIGGER set_email_accounts_tenant_id
BEFORE INSERT ON public.email_accounts
FOR EACH ROW
EXECUTE FUNCTION public.set_tenant_id();