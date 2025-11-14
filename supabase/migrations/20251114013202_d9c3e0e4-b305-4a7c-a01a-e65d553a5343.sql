-- Adicionar coluna owner_id nas tabelas principais
ALTER TABLE projetos ADD COLUMN IF NOT EXISTS owner_id UUID;
ALTER TABLE obrigacoes ADD COLUMN IF NOT EXISTS owner_id UUID;
ALTER TABLE tarefas ADD COLUMN IF NOT EXISTS owner_id UUID;

-- Preencher owner_id retroativo com created_by quando possível
UPDATE projetos SET owner_id = created_by WHERE owner_id IS NULL AND created_by IS NOT NULL;
UPDATE obrigacoes SET owner_id = created_by WHERE owner_id IS NULL AND created_by IS NOT NULL;

-- Remover políticas antigas permissivas
DROP POLICY IF EXISTS "Authenticated users can view projetos" ON projetos;
DROP POLICY IF EXISTS "Authenticated users can insert projetos" ON projetos;
DROP POLICY IF EXISTS "Authenticated users can update projetos" ON projetos;
DROP POLICY IF EXISTS "Authenticated users can delete projetos" ON projetos;

DROP POLICY IF EXISTS "Authenticated users can view obrigacoes" ON obrigacoes;
DROP POLICY IF EXISTS "Authenticated users can insert obrigacoes" ON obrigacoes;
DROP POLICY IF EXISTS "Authenticated users can update obrigacoes" ON obrigacoes;
DROP POLICY IF EXISTS "Authenticated users can delete obrigacoes" ON obrigacoes;

DROP POLICY IF EXISTS "Authenticated users can view tarefas" ON tarefas;
DROP POLICY IF EXISTS "Authenticated users can insert tarefas" ON tarefas;
DROP POLICY IF EXISTS "Authenticated users can update tarefas" ON tarefas;
DROP POLICY IF EXISTS "Authenticated users can delete tarefas" ON tarefas;

-- Políticas baseadas em owner_id (cada utilizador só vê/edita os seus registos)
CREATE POLICY "Users can view their own projetos" ON projetos
  FOR SELECT TO authenticated
  USING (owner_id = auth.uid());

CREATE POLICY "Users can insert their own projetos" ON projetos
  FOR INSERT TO authenticated
  WITH CHECK (owner_id = auth.uid() OR owner_id IS NULL);

CREATE POLICY "Users can update their own projetos" ON projetos
  FOR UPDATE TO authenticated
  USING (owner_id = auth.uid());

CREATE POLICY "Users can delete their own projetos" ON projetos
  FOR DELETE TO authenticated
  USING (owner_id = auth.uid());

CREATE POLICY "Users can view their own obrigacoes" ON obrigacoes
  FOR SELECT TO authenticated
  USING (owner_id = auth.uid());

CREATE POLICY "Users can insert their own obrigacoes" ON obrigacoes
  FOR INSERT TO authenticated
  WITH CHECK (owner_id = auth.uid() OR owner_id IS NULL);

CREATE POLICY "Users can update their own obrigacoes" ON obrigacoes
  FOR UPDATE TO authenticated
  USING (owner_id = auth.uid());

CREATE POLICY "Users can delete their own obrigacoes" ON obrigacoes
  FOR DELETE TO authenticated
  USING (owner_id = auth.uid());

CREATE POLICY "Users can view their own tarefas" ON tarefas
  FOR SELECT TO authenticated
  USING (owner_id = auth.uid());

CREATE POLICY "Users can insert their own tarefas" ON tarefas
  FOR INSERT TO authenticated
  WITH CHECK (owner_id = auth.uid() OR owner_id IS NULL);

CREATE POLICY "Users can update their own tarefas" ON tarefas
  FOR UPDATE TO authenticated
  USING (owner_id = auth.uid());

CREATE POLICY "Users can delete their own tarefas" ON tarefas
  FOR DELETE TO authenticated
  USING (owner_id = auth.uid());

-- Função para preencher owner_id automaticamente
CREATE OR REPLACE FUNCTION public.set_owner_id()
RETURNS trigger AS $$
BEGIN
  IF NEW.owner_id IS NULL THEN
    NEW.owner_id := auth.uid();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Triggers para auto-preencher owner_id
DROP TRIGGER IF EXISTS projetos_set_owner ON projetos;
CREATE TRIGGER projetos_set_owner
  BEFORE INSERT ON projetos
  FOR EACH ROW EXECUTE FUNCTION set_owner_id();

DROP TRIGGER IF EXISTS obrigacoes_set_owner ON obrigacoes;
CREATE TRIGGER obrigacoes_set_owner
  BEFORE INSERT ON obrigacoes
  FOR EACH ROW EXECUTE FUNCTION set_owner_id();

DROP TRIGGER IF EXISTS tarefas_set_owner ON tarefas;
CREATE TRIGGER tarefas_set_owner
  BEFORE INSERT ON tarefas
  FOR EACH ROW EXECUTE FUNCTION set_owner_id();