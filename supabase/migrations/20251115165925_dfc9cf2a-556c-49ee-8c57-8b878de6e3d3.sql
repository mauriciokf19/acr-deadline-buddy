-- Adicionar deleted_at às tabelas para soft delete
ALTER TABLE obrigacoes ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE tarefas ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE lembretes ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

-- Índices para queries de ativos (excluindo soft-deleted)
CREATE INDEX IF NOT EXISTS idx_obrigacoes_ativas ON obrigacoes (owner_id, deleted_at) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_tarefas_ativas ON tarefas (owner_id, deleted_at) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_lembretes_ativos ON lembretes (owner_id, deleted_at) WHERE deleted_at IS NULL;

-- Comentários para documentação
COMMENT ON COLUMN obrigacoes.deleted_at IS 'Soft delete: quando não NULL, obrigação está arquivada';
COMMENT ON COLUMN tarefas.deleted_at IS 'Soft delete: quando não NULL, tarefa está arquivada';
COMMENT ON COLUMN lembretes.deleted_at IS 'Soft delete: quando não NULL, lembrete está arquivado';