-- Adicionar owner_id às tabelas restantes
ALTER TABLE lembretes ADD COLUMN IF NOT EXISTS owner_id UUID;
ALTER TABLE clientes ADD COLUMN IF NOT EXISTS owner_id UUID;
ALTER TABLE templates ADD COLUMN IF NOT EXISTS owner_id UUID;
ALTER TABLE template_instancias ADD COLUMN IF NOT EXISTS owner_id UUID;

-- Preencher owner_id nas lembretes através das obrigações
UPDATE lembretes l
SET owner_id = o.owner_id
FROM obrigacoes o
WHERE l.obrigacao_id = o.id AND l.owner_id IS NULL;

-- Remover políticas antigas de lembretes
DROP POLICY IF EXISTS "Authenticated users can view lembretes" ON lembretes;
DROP POLICY IF EXISTS "Authenticated users can insert lembretes" ON lembretes;
DROP POLICY IF EXISTS "Authenticated users can update lembretes" ON lembretes;

DROP POLICY IF EXISTS "Authenticated users can view clientes" ON clientes;
DROP POLICY IF EXISTS "Authenticated users can insert clientes" ON clientes;
DROP POLICY IF EXISTS "Authenticated users can update clientes" ON clientes;
DROP POLICY IF EXISTS "Authenticated users can delete clientes" ON clientes;

DROP POLICY IF EXISTS "Authenticated users can view templates" ON templates;
DROP POLICY IF EXISTS "Authenticated users can create templates" ON templates;
DROP POLICY IF EXISTS "Authenticated users can update templates" ON templates;
DROP POLICY IF EXISTS "Authenticated users can delete templates" ON templates;

DROP POLICY IF EXISTS "Authenticated users can view template_instancias" ON template_instancias;
DROP POLICY IF EXISTS "Authenticated users can create template_instancias" ON template_instancias;
DROP POLICY IF EXISTS "Authenticated users can update template_instancias" ON template_instancias;

-- Políticas baseadas em owner_id para lembretes
CREATE POLICY "Users can view their own lembretes" ON lembretes
  FOR SELECT TO authenticated
  USING (owner_id = auth.uid());

CREATE POLICY "Users can insert their own lembretes" ON lembretes
  FOR INSERT TO authenticated
  WITH CHECK (owner_id = auth.uid() OR owner_id IS NULL);

CREATE POLICY "Users can update their own lembretes" ON lembretes
  FOR UPDATE TO authenticated
  USING (owner_id = auth.uid());

CREATE POLICY "Users can delete their own lembretes" ON lembretes
  FOR DELETE TO authenticated
  USING (owner_id = auth.uid());

-- Políticas baseadas em owner_id para clientes
CREATE POLICY "Users can view their own clientes" ON clientes
  FOR SELECT TO authenticated
  USING (owner_id = auth.uid());

CREATE POLICY "Users can insert their own clientes" ON clientes
  FOR INSERT TO authenticated
  WITH CHECK (owner_id = auth.uid() OR owner_id IS NULL);

CREATE POLICY "Users can update their own clientes" ON clientes
  FOR UPDATE TO authenticated
  USING (owner_id = auth.uid());

CREATE POLICY "Users can delete their own clientes" ON clientes
  FOR DELETE TO authenticated
  USING (owner_id = auth.uid());

-- Políticas baseadas em owner_id para templates
CREATE POLICY "Users can view their own templates" ON templates
  FOR SELECT TO authenticated
  USING (owner_id = auth.uid());

CREATE POLICY "Users can insert their own templates" ON templates
  FOR INSERT TO authenticated
  WITH CHECK (owner_id = auth.uid() OR owner_id IS NULL);

CREATE POLICY "Users can update their own templates" ON templates
  FOR UPDATE TO authenticated
  USING (owner_id = auth.uid());

CREATE POLICY "Users can delete their own templates" ON templates
  FOR DELETE TO authenticated
  USING (owner_id = auth.uid());

-- Políticas baseadas em owner_id para template_instancias
CREATE POLICY "Users can view their own template_instancias" ON template_instancias
  FOR SELECT TO authenticated
  USING (owner_id = auth.uid());

CREATE POLICY "Users can insert their own template_instancias" ON template_instancias
  FOR INSERT TO authenticated
  WITH CHECK (owner_id = auth.uid() OR owner_id IS NULL);

CREATE POLICY "Users can update their own template_instancias" ON template_instancias
  FOR UPDATE TO authenticated
  USING (owner_id = auth.uid());

CREATE POLICY "Users can delete their own template_instancias" ON template_instancias
  FOR DELETE TO authenticated
  USING (owner_id = auth.uid());

-- Triggers para auto-preencher owner_id
DROP TRIGGER IF EXISTS lembretes_set_owner ON lembretes;
CREATE TRIGGER lembretes_set_owner
  BEFORE INSERT ON lembretes
  FOR EACH ROW EXECUTE FUNCTION set_owner_id();

DROP TRIGGER IF EXISTS clientes_set_owner ON clientes;
CREATE TRIGGER clientes_set_owner
  BEFORE INSERT ON clientes
  FOR EACH ROW EXECUTE FUNCTION set_owner_id();

DROP TRIGGER IF EXISTS templates_set_owner ON templates;
CREATE TRIGGER templates_set_owner
  BEFORE INSERT ON templates
  FOR EACH ROW EXECUTE FUNCTION set_owner_id();

DROP TRIGGER IF EXISTS template_instancias_set_owner ON template_instancias;
CREATE TRIGGER template_instancias_set_owner
  BEFORE INSERT ON template_instancias
  FOR EACH ROW EXECUTE FUNCTION set_owner_id();