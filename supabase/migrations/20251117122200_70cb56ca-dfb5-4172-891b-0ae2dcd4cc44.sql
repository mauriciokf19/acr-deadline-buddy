-- Lembretes: Add validation and triggers

-- Validation function for lembretes
CREATE OR REPLACE FUNCTION public.validate_lembrete_ref()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Validate entidade_tipo
  IF NEW.entidade_tipo NOT IN ('obrigacao', 'tarefa') THEN
    RAISE EXCEPTION 'Tipo de entidade inválido. Use "obrigacao" ou "tarefa".';
  END IF;

  -- Validate obrigacao exists and belongs to user
  IF NEW.entidade_tipo = 'obrigacao' THEN
    IF NOT EXISTS (
      SELECT 1 FROM public.obrigacoes 
      WHERE id = NEW.entidade_id::uuid 
      AND owner_id = auth.uid()
      AND deleted_at IS NULL
    ) THEN
      RAISE EXCEPTION 'Obrigação não encontrada ou não pertence ao utilizador.';
    END IF;
  END IF;

  -- Validate tarefa exists and belongs to user
  IF NEW.entidade_tipo = 'tarefa' THEN
    IF NOT EXISTS (
      SELECT 1 FROM public.tarefas 
      WHERE id = NEW.entidade_id::uuid 
      AND owner_id = auth.uid()
      AND deleted_at IS NULL
    ) THEN
      RAISE EXCEPTION 'Tarefa não encontrada ou não pertence ao utilizador.';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

-- Create trigger for validation
DROP TRIGGER IF EXISTS validate_lembrete_trigger ON public.lembretes;
CREATE TRIGGER validate_lembrete_trigger
  BEFORE INSERT OR UPDATE ON public.lembretes
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_lembrete_ref();

-- Trigger to auto-populate owner_id
DROP TRIGGER IF EXISTS set_owner_lembrete_trigger ON public.lembretes;
CREATE TRIGGER set_owner_lembrete_trigger
  BEFORE INSERT ON public.lembretes
  FOR EACH ROW
  EXECUTE FUNCTION public.set_owner_id();

-- Trigger to update updated_at
DROP TRIGGER IF EXISTS update_lembretes_updated_at ON public.lembretes;
CREATE TRIGGER update_lembretes_updated_at
  BEFORE UPDATE ON public.lembretes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Template Generation: Add unique index for idempotency
CREATE UNIQUE INDEX IF NOT EXISTS idx_obrigacoes_unique_generation
  ON public.obrigacoes(projeto_id, tipo, periodo_referencia)
  WHERE deleted_at IS NULL;