-- 1. Adicionar novos tipos de obrigação ao enum
ALTER TYPE public.tipo_obrigacao ADD VALUE IF NOT EXISTS 'retencoes';
ALTER TYPE public.tipo_obrigacao ADD VALUE IF NOT EXISTS 'modelo_30';
ALTER TYPE public.tipo_obrigacao ADD VALUE IF NOT EXISTS 'cope';
ALTER TYPE public.tipo_obrigacao ADD VALUE IF NOT EXISTS 'recapitulativa';
ALTER TYPE public.tipo_obrigacao ADD VALUE IF NOT EXISTS 'dmis';
ALTER TYPE public.tipo_obrigacao ADD VALUE IF NOT EXISTS 'iuc';

-- 2. Backfill client_id a partir de projeto_id onde aplicável
UPDATE public.obrigacoes o
SET client_id = p.cliente_id
FROM public.projetos p
WHERE o.projeto_id = p.id
  AND o.client_id IS NULL
  AND p.cliente_id IS NOT NULL;

-- 3. Criar índices para performance (se não existirem)
CREATE INDEX IF NOT EXISTS idx_obrigacoes_client_deadline ON public.obrigacoes(client_id, deadline_oficial);
CREATE INDEX IF NOT EXISTS idx_obrigacoes_tipo ON public.obrigacoes(tipo);