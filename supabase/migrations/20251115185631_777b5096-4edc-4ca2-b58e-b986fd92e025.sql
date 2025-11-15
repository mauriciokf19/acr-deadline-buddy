-- ========================================
-- LEMBRETES: Reestruturação completa
-- ========================================

-- Criar nova tabela lembretes_new com estrutura atualizada
CREATE TABLE IF NOT EXISTS lembretes_new (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID,
  entidade_tipo TEXT NOT NULL CHECK (entidade_tipo IN ('obrigacao', 'tarefa')),
  entidade_id UUID NOT NULL,
  regra TEXT NOT NULL,
  canal TEXT NOT NULL CHECK (canal IN ('email', 'push')),
  ativo BOOLEAN DEFAULT true,
  proximo_disparo_em TIMESTAMPTZ,
  ultimo_disparo_em TIMESTAMPTZ,
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Migrar dados existentes (se houver)
INSERT INTO lembretes_new (id, owner_id, entidade_tipo, entidade_id, regra, canal, ativo, created_at)
SELECT 
  id,
  owner_id,
  'obrigacao' as entidade_tipo,
  obrigacao_id as entidade_id,
  COALESCE(mensagem, '3d antes de deadline_interna') as regra,
  COALESCE(tipo, 'email') as canal,
  NOT COALESCE(enviado, false) as ativo,
  created_at
FROM lembretes
WHERE obrigacao_id IS NOT NULL
ON CONFLICT (id) DO NOTHING;

-- Drop old table and rename new one
DROP TABLE IF EXISTS lembretes CASCADE;
ALTER TABLE lembretes_new RENAME TO lembretes;

-- RLS
ALTER TABLE lembretes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS lembretes_per_user ON lembretes;
CREATE POLICY lembretes_per_user ON lembretes
FOR ALL TO authenticated
USING (owner_id = auth.uid())
WITH CHECK (owner_id = auth.uid());

-- Trigger para owner_id
DROP TRIGGER IF EXISTS lembretes_set_owner ON lembretes;
CREATE TRIGGER lembretes_set_owner
BEFORE INSERT ON lembretes
FOR EACH ROW
EXECUTE FUNCTION set_owner_id();

-- Trigger para updated_at
DROP TRIGGER IF EXISTS lembretes_updated_at ON lembretes;
CREATE TRIGGER lembretes_updated_at
BEFORE UPDATE ON lembretes
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Índices
CREATE INDEX IF NOT EXISTS idx_lembretes_ativo ON lembretes(ativo) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_lembretes_proximo_disparo ON lembretes(proximo_disparo_em) WHERE ativo = true AND deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_lembretes_entidade ON lembretes(entidade_tipo, entidade_id);

-- ========================================
-- ALERTAS: Feed de notificações
-- ========================================

CREATE TABLE IF NOT EXISTS alertas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  entidade_tipo TEXT NOT NULL CHECK (entidade_tipo IN ('obrigacao', 'tarefa')),
  entidade_id UUID NOT NULL,
  canal TEXT NOT NULL CHECK (canal IN ('push', 'email')),
  titulo TEXT NOT NULL,
  mensagem TEXT NOT NULL,
  disparado_em TIMESTAMPTZ NOT NULL DEFAULT now(),
  visto BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE alertas ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS alertas_per_user ON alertas;
CREATE POLICY alertas_per_user ON alertas
FOR ALL TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

CREATE INDEX IF NOT EXISTS idx_alertas_user_time ON alertas(user_id, disparado_em DESC);
CREATE INDEX IF NOT EXISTS idx_alertas_nao_vistos ON alertas(user_id, visto) WHERE NOT visto;

-- ========================================
-- PROFILES: Defaults de lembretes e janela de silêncio
-- ========================================

ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS lembrete_interna_dias INTEGER DEFAULT 3,
ADD COLUMN IF NOT EXISTS lembrete_oficial_dias INTEGER DEFAULT 5,
ADD COLUMN IF NOT EXISTS lembrete_followup_horas INTEGER DEFAULT 48,
ADD COLUMN IF NOT EXISTS janela_silencio_inicio TIME,
ADD COLUMN IF NOT EXISTS janela_silencio_fim TIME;

-- ========================================
-- OBRIGACOES: Tracking de envio ao senior
-- ========================================

ALTER TABLE obrigacoes
ADD COLUMN IF NOT EXISTS data_envio_senior TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS data_feedback_senior TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_obrigacoes_envio_senior ON obrigacoes(data_envio_senior) WHERE data_envio_senior IS NOT NULL AND data_feedback_senior IS NULL;