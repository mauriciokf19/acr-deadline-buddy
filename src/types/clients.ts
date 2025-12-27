// Client 360 Types

export interface Client {
  id: string;
  name: string;
  vat_number: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  notes: string | null;
  legacy_cliente_id: string | null;
  owner_id: string;
  tenant_id: string;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface Contact {
  id: string;
  client_id: string;
  name: string;
  role: string | null;
  email: string | null;
  phone: string | null;
  is_primary: boolean;
  owner_id: string;
  tenant_id: string;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface ClientWithContacts extends Client {
  contacts: Contact[];
}

// Activity Timeline
export interface ActivityLogEntry {
  id: string;
  actor_id: string | null;
  action: string;
  entity_type: string;
  entity_id: string | null;
  metadata: Record<string, unknown>;
  tenant_id: string;
  created_at: string;
  ip_address?: string;
  user_agent?: string;
}

// Comments
export interface Comment {
  id: string;
  entity_type: 'email_thread' | 'task' | 'work_item' | 'client';
  entity_id: string;
  author_id: string;
  body: string;
  mentions: string[];
  is_internal: boolean;
  created_at: string;
  updated_at: string;
}

// Work Item Links
export interface WorkItemLink {
  id: string;
  external_table: string;
  external_id: string;
  client_id: string | null;
  thread_id: string | null;
  task_id: string | null;
  link_type: string;
  owner_id: string;
  tenant_id: string;
  created_at: string;
}
