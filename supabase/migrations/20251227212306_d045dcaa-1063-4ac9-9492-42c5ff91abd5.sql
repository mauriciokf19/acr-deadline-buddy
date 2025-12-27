-- ============================================
-- MIGRAÇÃO: Adicionar client_id a obrigacoes
-- ============================================

-- 1. Adicionar coluna client_id a obrigacoes (nullable inicialmente)
ALTER TABLE public.obrigacoes 
ADD COLUMN IF NOT EXISTS client_id UUID REFERENCES public.clients(id);

-- 2. Criar índice para queries por cliente
CREATE INDEX IF NOT EXISTS idx_obrigacoes_client_id 
ON public.obrigacoes(client_id) 
WHERE deleted_at IS NULL;

-- 3. Índice composto para queries tenant + cliente + deadline
CREATE INDEX IF NOT EXISTS idx_obrigacoes_tenant_client_deadline 
ON public.obrigacoes(owner_id, client_id, deadline_oficial) 
WHERE deleted_at IS NULL;

-- 4. Adicionar client_id a template_instancias
ALTER TABLE public.template_instancias 
ADD COLUMN IF NOT EXISTS client_id UUID REFERENCES public.clients(id);

-- 5. Criar constraint para bloquear novos work_item_links com projeto
-- (Comentado: será aplicada depois de migrar dados existentes)
-- ALTER TABLE public.work_item_links 
-- ADD CONSTRAINT chk_external_table_no_projeto 
-- CHECK (external_table != 'projeto');

-- 6. Deprecar tabela projetos via feature_flag
-- (Inserir flag para cada tenant - será feito via código)

-- 7. Adicionar coluna deprecated_at a work_item_links
ALTER TABLE public.work_item_links 
ADD COLUMN IF NOT EXISTS deprecated_at TIMESTAMP WITH TIME ZONE;