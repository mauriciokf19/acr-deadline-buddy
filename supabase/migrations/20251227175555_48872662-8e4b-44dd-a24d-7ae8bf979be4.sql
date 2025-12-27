-- ============================================================
-- MVP KARBON-LIKE: MIGRAÇÕES ADITIVAS (MULTI-TENANT)
-- ============================================================

-- 1) CLIENTS (expandir clientes existente ou criar nova)
-- Nota: tabela "clientes" já existe; criamos "clients" como alias/extensão
CREATE TABLE IF NOT EXISTS public.clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  vat_number TEXT NULL,
  email TEXT NULL,
  phone TEXT NULL,
  address TEXT NULL,
  notes TEXT NULL,
  owner_id UUID NOT NULL,
  tenant_id UUID NOT NULL,
  legacy_cliente_id UUID NULL, -- link para tabela clientes existente
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  deleted_at TIMESTAMPTZ NULL
);

ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;

CREATE POLICY "clients_tenant_owner" ON public.clients
  FOR ALL USING (tenant_id = auth.uid() OR owner_id = auth.uid())
  WITH CHECK (tenant_id = auth.uid() OR owner_id = auth.uid());

CREATE INDEX idx_clients_tenant ON public.clients(tenant_id);
CREATE INDEX idx_clients_owner ON public.clients(owner_id);
CREATE INDEX idx_clients_deleted ON public.clients(deleted_at) WHERE deleted_at IS NULL;

-- 2) CONTACTS
CREATE TABLE IF NOT EXISTS public.contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  role TEXT NULL,
  email TEXT NULL,
  phone TEXT NULL,
  is_primary BOOLEAN DEFAULT false,
  owner_id UUID NOT NULL,
  tenant_id UUID NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  deleted_at TIMESTAMPTZ NULL
);

ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "contacts_tenant_owner" ON public.contacts
  FOR ALL USING (tenant_id = auth.uid() OR owner_id = auth.uid())
  WITH CHECK (tenant_id = auth.uid() OR owner_id = auth.uid());

CREATE INDEX idx_contacts_client ON public.contacts(client_id);
CREATE INDEX idx_contacts_tenant ON public.contacts(tenant_id);

-- 3) EMAIL ACCOUNTS
CREATE TABLE IF NOT EXISTS public.email_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider TEXT NOT NULL CHECK (provider IN ('gmail', 'outlook', 'nylas')),
  display_name TEXT,
  email_address TEXT NOT NULL,
  oauth_provider TEXT,
  oauth_access_token_encrypted TEXT,
  oauth_refresh_token_encrypted TEXT,
  oauth_expiry TIMESTAMPTZ,
  sync_status TEXT DEFAULT 'idle' CHECK (sync_status IN ('idle', 'syncing', 'error')),
  last_sync_at TIMESTAMPTZ,
  sync_error TEXT,
  active BOOLEAN DEFAULT true,
  owner_id UUID NOT NULL,
  tenant_id UUID NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.email_accounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "email_accounts_owner" ON public.email_accounts
  FOR ALL USING (owner_id = auth.uid())
  WITH CHECK (owner_id = auth.uid());

CREATE UNIQUE INDEX idx_email_accounts_unique ON public.email_accounts(email_address, tenant_id);
CREATE INDEX idx_email_accounts_tenant ON public.email_accounts(tenant_id);

-- 4) EMAIL THREADS
CREATE TABLE IF NOT EXISTS public.email_threads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID NOT NULL REFERENCES public.email_accounts(id) ON DELETE CASCADE,
  external_thread_id TEXT,
  subject TEXT,
  snippet TEXT,
  client_id UUID NULL REFERENCES public.clients(id) ON DELETE SET NULL,
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'snoozed', 'closed')),
  snoozed_until TIMESTAMPTZ NULL,
  importance TEXT DEFAULT 'normal' CHECK (importance IN ('normal', 'high')),
  is_read BOOLEAN DEFAULT false,
  last_message_at TIMESTAMPTZ,
  message_count INTEGER DEFAULT 0,
  owner_id UUID NOT NULL,
  tenant_id UUID NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.email_threads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "email_threads_owner" ON public.email_threads
  FOR ALL USING (owner_id = auth.uid())
  WITH CHECK (owner_id = auth.uid());

CREATE UNIQUE INDEX idx_email_threads_external ON public.email_threads(account_id, external_thread_id);
CREATE INDEX idx_email_threads_tenant_last ON public.email_threads(tenant_id, last_message_at DESC);
CREATE INDEX idx_email_threads_status ON public.email_threads(status) WHERE status != 'closed';
CREATE INDEX idx_email_threads_client ON public.email_threads(client_id) WHERE client_id IS NOT NULL;

-- 5) EMAIL MESSAGES
CREATE TABLE IF NOT EXISTS public.email_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id UUID NOT NULL REFERENCES public.email_threads(id) ON DELETE CASCADE,
  external_message_id TEXT,
  from_name TEXT,
  from_address TEXT,
  to_addresses JSONB DEFAULT '[]'::jsonb,
  cc_addresses JSONB DEFAULT '[]'::jsonb,
  bcc_addresses JSONB DEFAULT '[]'::jsonb,
  subject TEXT,
  body_html TEXT,
  body_text TEXT,
  attachments JSONB DEFAULT '[]'::jsonb,
  direction TEXT NOT NULL CHECK (direction IN ('inbound', 'outbound')),
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.email_messages ENABLE ROW LEVEL SECURITY;

-- Messages inherit access from thread
CREATE POLICY "email_messages_via_thread" ON public.email_messages
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.email_threads t 
      WHERE t.id = thread_id AND t.owner_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.email_threads t 
      WHERE t.id = thread_id AND t.owner_id = auth.uid()
    )
  );

CREATE UNIQUE INDEX idx_email_messages_external ON public.email_messages(thread_id, external_message_id);
CREATE INDEX idx_email_messages_thread_sent ON public.email_messages(thread_id, sent_at DESC);

-- 6) GENERIC TASKS
CREATE TABLE IF NOT EXISTS public.tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT NULL,
  client_id UUID NULL REFERENCES public.clients(id) ON DELETE SET NULL,
  linked_email_thread_id UUID NULL REFERENCES public.email_threads(id) ON DELETE SET NULL,
  status TEXT DEFAULT 'todo' CHECK (status IN ('todo', 'in_progress', 'blocked', 'done')),
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
  due_date DATE NULL,
  assignee_id UUID NULL,
  completed_at TIMESTAMPTZ NULL,
  owner_id UUID NOT NULL,
  tenant_id UUID NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  deleted_at TIMESTAMPTZ NULL
);

ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tasks_tenant_owner" ON public.tasks
  FOR ALL USING (tenant_id = auth.uid() OR owner_id = auth.uid() OR assignee_id = auth.uid())
  WITH CHECK (tenant_id = auth.uid() OR owner_id = auth.uid());

CREATE INDEX idx_tasks_tenant_assignee ON public.tasks(tenant_id, assignee_id, due_date);
CREATE INDEX idx_tasks_status ON public.tasks(status) WHERE status != 'done';
CREATE INDEX idx_tasks_client ON public.tasks(client_id) WHERE client_id IS NOT NULL;
CREATE INDEX idx_tasks_deleted ON public.tasks(deleted_at) WHERE deleted_at IS NULL;

-- 7) WORK ITEM LINKS (ligação neutra a obrigações/projetos existentes)
CREATE TABLE IF NOT EXISTS public.work_item_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  external_table TEXT NOT NULL, -- 'obrigacao', 'projeto', 'tarefa' (existente)
  external_id UUID NOT NULL,
  client_id UUID NULL REFERENCES public.clients(id) ON DELETE SET NULL,
  thread_id UUID NULL REFERENCES public.email_threads(id) ON DELETE SET NULL,
  task_id UUID NULL REFERENCES public.tasks(id) ON DELETE SET NULL,
  link_type TEXT DEFAULT 'related' CHECK (link_type IN ('related', 'source', 'parent')),
  owner_id UUID NOT NULL,
  tenant_id UUID NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.work_item_links ENABLE ROW LEVEL SECURITY;

CREATE POLICY "work_item_links_owner" ON public.work_item_links
  FOR ALL USING (owner_id = auth.uid())
  WITH CHECK (owner_id = auth.uid());

CREATE INDEX idx_work_item_links_external ON public.work_item_links(tenant_id, external_table, external_id);
CREATE INDEX idx_work_item_links_client ON public.work_item_links(client_id) WHERE client_id IS NOT NULL;
CREATE INDEX idx_work_item_links_thread ON public.work_item_links(thread_id) WHERE thread_id IS NOT NULL;

-- 8) COMMENTS (comentários internos em qualquer entidade)
CREATE TABLE IF NOT EXISTS public.comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type TEXT NOT NULL CHECK (entity_type IN ('email_thread', 'task', 'work_item', 'client', 'obrigacao')),
  entity_id UUID NOT NULL,
  author_id UUID NOT NULL,
  body TEXT NOT NULL,
  mentions JSONB DEFAULT '[]'::jsonb,
  is_internal BOOLEAN DEFAULT true, -- não envia ao cliente
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;

-- Users can see comments on entities they own
CREATE POLICY "comments_author_or_entity_owner" ON public.comments
  FOR ALL USING (author_id = auth.uid())
  WITH CHECK (author_id = auth.uid());

CREATE INDEX idx_comments_entity ON public.comments(entity_type, entity_id);
CREATE INDEX idx_comments_author ON public.comments(author_id);

-- 9) ACTIVITY LOG (auditoria unificada)
CREATE TABLE IF NOT EXISTS public.activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id UUID,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID,
  metadata JSONB DEFAULT '{}'::jsonb,
  ip_address TEXT,
  user_agent TEXT,
  tenant_id UUID NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.activity_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "activity_log_tenant" ON public.activity_log
  FOR SELECT USING (tenant_id = auth.uid() OR actor_id = auth.uid());

CREATE POLICY "activity_log_insert" ON public.activity_log
  FOR INSERT WITH CHECK (actor_id = auth.uid());

CREATE INDEX idx_activity_log_tenant_created ON public.activity_log(tenant_id, created_at DESC);
CREATE INDEX idx_activity_log_entity ON public.activity_log(entity_type, entity_id);
CREATE INDEX idx_activity_log_actor ON public.activity_log(actor_id);

-- 10) FILES (documentos/comprovativos com links)
CREATE TABLE IF NOT EXISTS public.files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NULL REFERENCES public.clients(id) ON DELETE SET NULL,
  work_item_link_id UUID NULL REFERENCES public.work_item_links(id) ON DELETE SET NULL,
  file_name TEXT NOT NULL,
  file_type TEXT,
  mime_type TEXT,
  storage_key TEXT NOT NULL,
  size_bytes INTEGER,
  is_proof BOOLEAN DEFAULT false,
  uploaded_by UUID NOT NULL,
  tenant_id UUID NOT NULL,
  uploaded_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.files ENABLE ROW LEVEL SECURITY;

CREATE POLICY "files_owner" ON public.files
  FOR ALL USING (uploaded_by = auth.uid() OR tenant_id = auth.uid())
  WITH CHECK (uploaded_by = auth.uid());

CREATE INDEX idx_files_client ON public.files(client_id, uploaded_at DESC);
CREATE INDEX idx_files_work_item ON public.files(work_item_link_id) WHERE work_item_link_id IS NOT NULL;
CREATE INDEX idx_files_tenant ON public.files(tenant_id);

-- 11) FEATURE FLAGS
CREATE TABLE IF NOT EXISTS public.feature_flags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  flag_name TEXT NOT NULL,
  enabled BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.feature_flags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "feature_flags_tenant" ON public.feature_flags
  FOR ALL USING (tenant_id = auth.uid())
  WITH CHECK (tenant_id = auth.uid());

CREATE UNIQUE INDEX idx_feature_flags_unique ON public.feature_flags(tenant_id, flag_name);

-- 12) EMAIL TEMPLATES (respostas rápidas)
CREATE TABLE IF NOT EXISTS public.email_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  subject TEXT,
  body_html TEXT NOT NULL,
  category TEXT DEFAULT 'general',
  owner_id UUID NOT NULL,
  tenant_id UUID NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.email_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "email_templates_owner" ON public.email_templates
  FOR ALL USING (owner_id = auth.uid() OR tenant_id = auth.uid())
  WITH CHECK (owner_id = auth.uid());

CREATE INDEX idx_email_templates_tenant ON public.email_templates(tenant_id);

-- 13) TRIGGERS para updated_at
CREATE OR REPLACE FUNCTION public.trigger_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER set_updated_at_clients BEFORE UPDATE ON public.clients
  FOR EACH ROW EXECUTE FUNCTION public.trigger_set_updated_at();

CREATE TRIGGER set_updated_at_contacts BEFORE UPDATE ON public.contacts
  FOR EACH ROW EXECUTE FUNCTION public.trigger_set_updated_at();

CREATE TRIGGER set_updated_at_email_accounts BEFORE UPDATE ON public.email_accounts
  FOR EACH ROW EXECUTE FUNCTION public.trigger_set_updated_at();

CREATE TRIGGER set_updated_at_email_threads BEFORE UPDATE ON public.email_threads
  FOR EACH ROW EXECUTE FUNCTION public.trigger_set_updated_at();

CREATE TRIGGER set_updated_at_tasks BEFORE UPDATE ON public.tasks
  FOR EACH ROW EXECUTE FUNCTION public.trigger_set_updated_at();

CREATE TRIGGER set_updated_at_comments BEFORE UPDATE ON public.comments
  FOR EACH ROW EXECUTE FUNCTION public.trigger_set_updated_at();

CREATE TRIGGER set_updated_at_feature_flags BEFORE UPDATE ON public.feature_flags
  FOR EACH ROW EXECUTE FUNCTION public.trigger_set_updated_at();

CREATE TRIGGER set_updated_at_email_templates BEFORE UPDATE ON public.email_templates
  FOR EACH ROW EXECUTE FUNCTION public.trigger_set_updated_at();

-- 14) Função helper para logging de atividade
CREATE OR REPLACE FUNCTION public.log_activity(
  p_action TEXT,
  p_entity_type TEXT,
  p_entity_id UUID,
  p_metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_id UUID;
BEGIN
  INSERT INTO public.activity_log (actor_id, action, entity_type, entity_id, metadata, tenant_id)
  VALUES (auth.uid(), p_action, p_entity_type, p_entity_id, p_metadata, auth.uid())
  RETURNING id INTO v_id;
  RETURN v_id;
END;
$$;