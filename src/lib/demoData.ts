// Demo Mode - Dados fictícios para testes sem OAuth
// Activar com VITE_SEED_ENABLED=true no .env

import { addDays, subDays, format } from "date-fns";
import type { EmailThread, EmailMessage, EmailAccount, EmailAttachment } from "@/types/email";
import type { Client, Contact, ActivityLogEntry, Comment, WorkItemLink } from "@/types/clients";
import type { TaskWithRelations } from "@/types/tasks";

// ============================================
// HELPER: IDs determinísticos para demo
// ============================================
const DEMO_IDS = {
  account: "demo-account-001",
  client: "demo-client-001",
  contact1: "demo-contact-001",
  contact2: "demo-contact-002",
  thread1: "demo-thread-001",
  thread2: "demo-thread-002",
  thread3: "demo-thread-003",
  task1: "demo-task-001",
  task2: "demo-task-002",
  task3: "demo-task-003",
  task4: "demo-task-004",
  task5: "demo-task-005",
  obrigacao1: "demo-obrigacao-001",
  obrigacao2: "demo-obrigacao-002",
  workItemLink1: "demo-wil-001",
  workItemLink2: "demo-wil-002",
} as const;

const now = new Date();

// ============================================
// CONTA DE EMAIL DEMO
// ============================================
export const demoEmailAccount: EmailAccount = {
  id: DEMO_IDS.account,
  provider: "gmail",
  display_name: "Demo User",
  email_address: "demo@empresa-exemplo.pt",
  oauth_provider: "google",
  oauth_expiry: addDays(now, 30).toISOString(),
  active: true,
  last_sync_at: now.toISOString(),
  sync_status: "idle",
  sync_error: null,
  owner_id: "demo-user-id",
  tenant_id: "demo-user-id",
  created_at: subDays(now, 30).toISOString(),
  updated_at: now.toISOString(),
};

// ============================================
// CLIENTE DEMO
// ============================================
export const demoClient: Client = {
  id: DEMO_IDS.client,
  name: "Empresa Exemplo Lda",
  vat_number: "PT123456789",
  email: "geral@empresa-exemplo.pt",
  phone: "+351 21 123 4567",
  address: "Av. da Liberdade, 100, 1250-145 Lisboa",
  notes: "Cliente demo para testes. Contrato anual renovado em Janeiro.",
  legacy_cliente_id: null,
  owner_id: "demo-user-id",
  tenant_id: "demo-user-id",
  created_at: subDays(now, 365).toISOString(),
  updated_at: now.toISOString(),
  deleted_at: null,
};

// ============================================
// CONTACTOS DEMO
// ============================================
export const demoContacts: Contact[] = [
  {
    id: DEMO_IDS.contact1,
    client_id: DEMO_IDS.client,
    name: "Maria Santos",
    role: "Directora Financeira",
    email: "maria.santos@empresa-exemplo.pt",
    phone: "+351 91 234 5678",
    is_primary: true,
    owner_id: "demo-user-id",
    tenant_id: "demo-user-id",
    created_at: subDays(now, 300).toISOString(),
    updated_at: now.toISOString(),
    deleted_at: null,
  },
  {
    id: DEMO_IDS.contact2,
    client_id: DEMO_IDS.client,
    name: "João Ferreira",
    role: "Contabilista",
    email: "joao.ferreira@empresa-exemplo.pt",
    phone: "+351 92 345 6789",
    is_primary: false,
    owner_id: "demo-user-id",
    tenant_id: "demo-user-id",
    created_at: subDays(now, 200).toISOString(),
    updated_at: now.toISOString(),
    deleted_at: null,
  },
];

// ============================================
// THREADS DE EMAIL DEMO
// ============================================
export const demoEmailThreads: EmailThread[] = [
  {
    id: DEMO_IDS.thread1,
    account_id: DEMO_IDS.account,
    external_thread_id: "ext-thread-001",
    subject: "IVA do 4º Trimestre - Documentação em falta",
    snippet: "Bom dia, junto envio a lista de documentos necessários para a declaração de IVA...",
    client_id: DEMO_IDS.client,
    status: "open",
    importance: "high",
    is_read: false,
    last_message_at: subDays(now, 0).toISOString(),
    message_count: 3,
    snoozed_until: null,
    owner_id: "demo-user-id",
    tenant_id: "demo-user-id",
    created_at: subDays(now, 2).toISOString(),
    updated_at: now.toISOString(),
  },
  {
    id: DEMO_IDS.thread2,
    account_id: DEMO_IDS.account,
    external_thread_id: "ext-thread-002",
    subject: "Re: Modelo 22 - Confirmação de valores",
    snippet: "Agradeço a confirmação dos valores. Vou proceder à submissão hoje...",
    client_id: DEMO_IDS.client,
    status: "open",
    importance: "normal",
    is_read: true,
    last_message_at: subDays(now, 1).toISOString(),
    message_count: 2,
    snoozed_until: null,
    owner_id: "demo-user-id",
    tenant_id: "demo-user-id",
    created_at: subDays(now, 5).toISOString(),
    updated_at: subDays(now, 1).toISOString(),
  },
  {
    id: DEMO_IDS.thread3,
    account_id: DEMO_IDS.account,
    external_thread_id: "ext-thread-003",
    subject: "Reunião de fecho de contas - Março",
    snippet: "Boa tarde, gostaria de agendar uma reunião para discutir o fecho...",
    client_id: null,
    status: "snoozed",
    importance: "normal",
    is_read: true,
    last_message_at: subDays(now, 3).toISOString(),
    message_count: 2,
    snoozed_until: addDays(now, 2).toISOString(),
    owner_id: "demo-user-id",
    tenant_id: "demo-user-id",
    created_at: subDays(now, 7).toISOString(),
    updated_at: subDays(now, 3).toISOString(),
  },
];

// ============================================
// MENSAGENS DE EMAIL DEMO
// ============================================
export const demoEmailMessages: Record<string, EmailMessage[]> = {
  [DEMO_IDS.thread1]: [
    {
      id: "demo-msg-001",
      thread_id: DEMO_IDS.thread1,
      external_message_id: "ext-msg-001",
      from_name: "Maria Santos",
      from_address: "maria.santos@empresa-exemplo.pt",
      to_addresses: ["demo@empresa-exemplo.pt"],
      cc_addresses: [],
      bcc_addresses: [],
      subject: "IVA do 4º Trimestre - Documentação em falta",
      body_html: `
        <p>Bom dia,</p>
        <p>Junto envio a lista de documentos necessários para a declaração de IVA do 4º trimestre:</p>
        <ul>
          <li>Facturas de fornecedores (já enviadas)</li>
          <li>Extracto bancário de Dezembro (em falta)</li>
          <li>Recibos de pagamento a colaboradores</li>
        </ul>
        <p>Podem confirmar a recepção?</p>
        <p>Cumprimentos,<br/>Maria Santos</p>
      `,
      body_text: "Bom dia, junto envio a lista de documentos necessários para a declaração de IVA...",
      attachments: [
        {
          id: "demo-attach-001",
          filename: "lista_documentos.pdf",
          mime_type: "application/pdf",
          size_bytes: 245760,
        },
      ],
      sent_at: subDays(now, 2).toISOString(),
      direction: "inbound",
      created_at: subDays(now, 2).toISOString(),
    },
    {
      id: "demo-msg-002",
      thread_id: DEMO_IDS.thread1,
      external_message_id: "ext-msg-002",
      from_name: "Demo User",
      from_address: "demo@empresa-exemplo.pt",
      to_addresses: ["maria.santos@empresa-exemplo.pt"],
      cc_addresses: [],
      bcc_addresses: [],
      subject: "Re: IVA do 4º Trimestre - Documentação em falta",
      body_html: `
        <p>Bom dia Maria,</p>
        <p>Confirmamos a recepção da lista. Iremos proceder à análise e contactamos assim que possível.</p>
        <p>Cumprimentos</p>
      `,
      body_text: "Bom dia Maria, confirmamos a recepção da lista...",
      attachments: [],
      sent_at: subDays(now, 1).toISOString(),
      direction: "outbound",
      created_at: subDays(now, 1).toISOString(),
    },
    {
      id: "demo-msg-003",
      thread_id: DEMO_IDS.thread1,
      external_message_id: "ext-msg-003",
      from_name: "Maria Santos",
      from_address: "maria.santos@empresa-exemplo.pt",
      to_addresses: ["demo@empresa-exemplo.pt"],
      cc_addresses: ["joao.ferreira@empresa-exemplo.pt"],
      bcc_addresses: [],
      subject: "Re: IVA do 4º Trimestre - Documentação em falta",
      body_html: `
        <p>Obrigada pela confirmação.</p>
        <p>Junto também o extracto bancário que estava em falta.</p>
        <p>Cumprimentos,<br/>Maria</p>
      `,
      body_text: "Obrigada pela confirmação. Junto também o extracto bancário...",
      attachments: [
        {
          id: "demo-attach-002",
          filename: "extracto_dez_2024.pdf",
          mime_type: "application/pdf",
          size_bytes: 512000,
        },
      ],
      sent_at: now.toISOString(),
      direction: "inbound",
      created_at: now.toISOString(),
    },
  ],
  [DEMO_IDS.thread2]: [
    {
      id: "demo-msg-004",
      thread_id: DEMO_IDS.thread2,
      external_message_id: "ext-msg-004",
      from_name: "João Ferreira",
      from_address: "joao.ferreira@empresa-exemplo.pt",
      to_addresses: ["demo@empresa-exemplo.pt"],
      cc_addresses: [],
      bcc_addresses: [],
      subject: "Modelo 22 - Confirmação de valores",
      body_html: `
        <p>Boa tarde,</p>
        <p>Confirmo os seguintes valores para o Modelo 22:</p>
        <ul>
          <li>Volume de negócios: €1.250.000</li>
          <li>Resultado líquido: €85.000</li>
        </ul>
        <p>Agradeço confirmação.</p>
      `,
      body_text: "Boa tarde, confirmo os seguintes valores para o Modelo 22...",
      attachments: [],
      sent_at: subDays(now, 5).toISOString(),
      direction: "inbound",
      created_at: subDays(now, 5).toISOString(),
    },
    {
      id: "demo-msg-005",
      thread_id: DEMO_IDS.thread2,
      external_message_id: "ext-msg-005",
      from_name: "Demo User",
      from_address: "demo@empresa-exemplo.pt",
      to_addresses: ["joao.ferreira@empresa-exemplo.pt"],
      cc_addresses: ["maria.santos@empresa-exemplo.pt"],
      bcc_addresses: [],
      subject: "Re: Modelo 22 - Confirmação de valores",
      body_html: `
        <p>João,</p>
        <p>Agradeço a confirmação dos valores. Vou proceder à submissão hoje.</p>
        <p>Enviarei o comprovativo assim que estiver disponível.</p>
      `,
      body_text: "Agradeço a confirmação dos valores. Vou proceder à submissão hoje...",
      attachments: [],
      sent_at: subDays(now, 1).toISOString(),
      direction: "outbound",
      created_at: subDays(now, 1).toISOString(),
    },
  ],
  [DEMO_IDS.thread3]: [
    {
      id: "demo-msg-006",
      thread_id: DEMO_IDS.thread3,
      external_message_id: "ext-msg-006",
      from_name: "António Costa",
      from_address: "antonio.costa@outra-empresa.pt",
      to_addresses: ["demo@empresa-exemplo.pt"],
      cc_addresses: [],
      bcc_addresses: [],
      subject: "Reunião de fecho de contas - Março",
      body_html: `
        <p>Boa tarde,</p>
        <p>Gostaria de agendar uma reunião para discutir o fecho de contas do primeiro trimestre.</p>
        <p>Têm disponibilidade na próxima semana?</p>
        <p>Cumprimentos,<br/>António</p>
      `,
      body_text: "Boa tarde, gostaria de agendar uma reunião para discutir o fecho...",
      attachments: [],
      sent_at: subDays(now, 7).toISOString(),
      direction: "inbound",
      created_at: subDays(now, 7).toISOString(),
    },
    {
      id: "demo-msg-007",
      thread_id: DEMO_IDS.thread3,
      external_message_id: "ext-msg-007",
      from_name: "Demo User",
      from_address: "demo@empresa-exemplo.pt",
      to_addresses: ["antonio.costa@outra-empresa.pt"],
      cc_addresses: [],
      bcc_addresses: [],
      subject: "Re: Reunião de fecho de contas - Março",
      body_html: `
        <p>António,</p>
        <p>Temos disponibilidade na próxima terça ou quarta à tarde.</p>
        <p>Qual prefere?</p>
      `,
      body_text: "Temos disponibilidade na próxima terça ou quarta à tarde...",
      attachments: [],
      sent_at: subDays(now, 3).toISOString(),
      direction: "outbound",
      created_at: subDays(now, 3).toISOString(),
    },
  ],
};

// ============================================
// TAREFAS DEMO
// ============================================
export const demoTasks: TaskWithRelations[] = [
  {
    id: DEMO_IDS.task1,
    title: "Rever documentação IVA 4º Trimestre",
    description: "Verificar facturas e extractos bancários enviados pela Empresa Exemplo",
    client_id: DEMO_IDS.client,
    linked_email_thread_id: DEMO_IDS.thread1,
    status: "in_progress",
    priority: "high",
    due_date: subDays(now, 2).toISOString().split("T")[0], // ATRASADA
    assignee_id: "demo-user-id",
    completed_at: null,
    owner_id: "demo-user-id",
    tenant_id: "demo-user-id",
    created_at: subDays(now, 5).toISOString(),
    updated_at: now.toISOString(),
    deleted_at: null,
    client: { id: DEMO_IDS.client, name: "Empresa Exemplo Lda" },
    email_thread: { id: DEMO_IDS.thread1, subject: "IVA do 4º Trimestre - Documentação em falta" },
  },
  {
    id: DEMO_IDS.task2,
    title: "Submeter Modelo 22",
    description: "Valores confirmados pelo cliente. Submeter na AT.",
    client_id: DEMO_IDS.client,
    linked_email_thread_id: DEMO_IDS.thread2,
    status: "todo",
    priority: "high",
    due_date: subDays(now, 1).toISOString().split("T")[0], // ATRASADA
    assignee_id: "demo-user-id",
    completed_at: null,
    owner_id: "demo-user-id",
    tenant_id: "demo-user-id",
    created_at: subDays(now, 3).toISOString(),
    updated_at: now.toISOString(),
    deleted_at: null,
    client: { id: DEMO_IDS.client, name: "Empresa Exemplo Lda" },
    email_thread: { id: DEMO_IDS.thread2, subject: "Modelo 22 - Confirmação de valores" },
  },
  {
    id: DEMO_IDS.task3,
    title: "Preparar declaração IES",
    description: "Recolher dados para declaração anual IES",
    client_id: DEMO_IDS.client,
    linked_email_thread_id: null,
    status: "todo",
    priority: "medium",
    due_date: format(now, "yyyy-MM-dd"), // VENCE HOJE
    assignee_id: "demo-user-id",
    completed_at: null,
    owner_id: "demo-user-id",
    tenant_id: "demo-user-id",
    created_at: subDays(now, 10).toISOString(),
    updated_at: now.toISOString(),
    deleted_at: null,
    client: { id: DEMO_IDS.client, name: "Empresa Exemplo Lda" },
    email_thread: null,
  },
  {
    id: DEMO_IDS.task4,
    title: "Enviar recibo de vencimento",
    description: "Enviar recibos de vencimento de Janeiro para assinatura",
    client_id: DEMO_IDS.client,
    linked_email_thread_id: null,
    status: "todo",
    priority: "medium",
    due_date: addDays(now, 3).toISOString().split("T")[0], // PRÓXIMOS 7 DIAS
    assignee_id: "demo-user-id",
    completed_at: null,
    owner_id: "demo-user-id",
    tenant_id: "demo-user-id",
    created_at: subDays(now, 2).toISOString(),
    updated_at: now.toISOString(),
    deleted_at: null,
    client: { id: DEMO_IDS.client, name: "Empresa Exemplo Lda" },
    email_thread: null,
  },
  {
    id: DEMO_IDS.task5,
    title: "Actualizar dados cadastrais",
    description: "Actualizar morada fiscal no portal das Finanças",
    client_id: DEMO_IDS.client,
    linked_email_thread_id: null,
    status: "todo",
    priority: "low",
    due_date: addDays(now, 5).toISOString().split("T")[0], // PRÓXIMOS 7 DIAS
    assignee_id: "demo-user-id",
    completed_at: null,
    owner_id: "demo-user-id",
    tenant_id: "demo-user-id",
    created_at: subDays(now, 1).toISOString(),
    updated_at: now.toISOString(),
    deleted_at: null,
    client: { id: DEMO_IDS.client, name: "Empresa Exemplo Lda" },
    email_thread: null,
  },
];

// ============================================
// OBRIGAÇÕES DEMO (via work_item_links)
// ============================================
export const demoObrigacoes = [
  {
    id: DEMO_IDS.obrigacao1,
    titulo: "IVA - 4º Trimestre 2024",
    tipo: "iva",
    periodicidade: "trimestral",
    periodo_referencia: "4T 2024",
    estado: "pendente",
    deadline_oficial: addDays(now, 10).toISOString(),
    deadline_interna: addDays(now, 5).toISOString(),
    deadline_revisao_senior: addDays(now, 3).toISOString(),
    projeto_id: null,
    owner_id: "demo-user-id",
    created_at: subDays(now, 30).toISOString(),
    updated_at: now.toISOString(),
    deleted_at: null,
  },
  {
    id: DEMO_IDS.obrigacao2,
    titulo: "IES - Ano Fiscal 2023",
    tipo: "ies",
    periodicidade: "anual",
    periodo_referencia: "2023",
    estado: "em_revisao",
    deadline_oficial: addDays(now, 30).toISOString(),
    deadline_interna: addDays(now, 20).toISOString(),
    deadline_revisao_senior: addDays(now, 15).toISOString(),
    projeto_id: null,
    owner_id: "demo-user-id",
    created_at: subDays(now, 60).toISOString(),
    updated_at: now.toISOString(),
    deleted_at: null,
  },
];

// ============================================
// WORK ITEM LINKS DEMO
// ============================================
export const demoWorkItemLinks: WorkItemLink[] = [
  {
    id: DEMO_IDS.workItemLink1,
    external_table: "obrigacoes",
    external_id: DEMO_IDS.obrigacao1,
    client_id: DEMO_IDS.client,
    thread_id: DEMO_IDS.thread1,
    task_id: DEMO_IDS.task1,
    link_type: "related",
    owner_id: "demo-user-id",
    tenant_id: "demo-user-id",
    created_at: subDays(now, 5).toISOString(),
  },
  {
    id: DEMO_IDS.workItemLink2,
    external_table: "obrigacoes",
    external_id: DEMO_IDS.obrigacao2,
    client_id: DEMO_IDS.client,
    thread_id: null,
    task_id: DEMO_IDS.task3,
    link_type: "related",
    owner_id: "demo-user-id",
    tenant_id: "demo-user-id",
    created_at: subDays(now, 10).toISOString(),
  },
];

// ============================================
// ACTIVITY LOG DEMO
// ============================================
export const demoActivityLog: ActivityLogEntry[] = [
  {
    id: "demo-activity-001",
    actor_id: "demo-user-id",
    action: "created",
    entity_type: "task",
    entity_id: DEMO_IDS.task1,
    metadata: { task_title: "Rever documentação IVA 4º Trimestre" },
    tenant_id: "demo-user-id",
    created_at: subDays(now, 5).toISOString(),
  },
  {
    id: "demo-activity-002",
    actor_id: "demo-user-id",
    action: "email_received",
    entity_type: "email_thread",
    entity_id: DEMO_IDS.thread1,
    metadata: { subject: "IVA do 4º Trimestre - Documentação em falta" },
    tenant_id: "demo-user-id",
    created_at: subDays(now, 2).toISOString(),
  },
  {
    id: "demo-activity-003",
    actor_id: "demo-user-id",
    action: "linked",
    entity_type: "work_item_link",
    entity_id: DEMO_IDS.workItemLink1,
    metadata: { client_name: "Empresa Exemplo Lda", linked_to: "obrigacao" },
    tenant_id: "demo-user-id",
    created_at: subDays(now, 1).toISOString(),
  },
  {
    id: "demo-activity-004",
    actor_id: "demo-user-id",
    action: "status_updated",
    entity_type: "task",
    entity_id: DEMO_IDS.task1,
    metadata: { old_status: "todo", new_status: "in_progress" },
    tenant_id: "demo-user-id",
    created_at: now.toISOString(),
  },
];

// ============================================
// COMMENTS DEMO
// ============================================
export const demoComments: Comment[] = [
  {
    id: "demo-comment-001",
    entity_type: "task",
    entity_id: DEMO_IDS.task1,
    author_id: "demo-user-id",
    body: "Faltam os extractos bancários de Dezembro. Aguardar envio do cliente.",
    mentions: [],
    is_internal: true,
    created_at: subDays(now, 3).toISOString(),
    updated_at: subDays(now, 3).toISOString(),
  },
  {
    id: "demo-comment-002",
    entity_type: "email_thread",
    entity_id: DEMO_IDS.thread1,
    author_id: "demo-user-id",
    body: "Cliente enviou extracto em falta. Podemos prosseguir.",
    mentions: [],
    is_internal: true,
    created_at: now.toISOString(),
    updated_at: now.toISOString(),
  },
];

// ============================================
// DOCUMENTOS DEMO
// ============================================
export const demoDocuments = [
  {
    id: "demo-doc-001",
    client_id: DEMO_IDS.client,
    file_name: "Contrato_2024.pdf",
    file_type: "contract",
    mime_type: "application/pdf",
    size_bytes: 1024000,
    storage_key: "demo/contrato_2024.pdf",
    is_proof: false,
    uploaded_by: "demo-user-id",
    tenant_id: "demo-user-id",
    uploaded_at: subDays(now, 60).toISOString(),
  },
  {
    id: "demo-doc-002",
    client_id: DEMO_IDS.client,
    file_name: "Comprovativo_IVA_3T_2024.pdf",
    file_type: "proof",
    mime_type: "application/pdf",
    size_bytes: 256000,
    storage_key: "demo/comprovativo_iva_3t.pdf",
    is_proof: true,
    uploaded_by: "demo-user-id",
    tenant_id: "demo-user-id",
    uploaded_at: subDays(now, 30).toISOString(),
  },
];

// ============================================
// FUNÇÃO DE VERIFICAÇÃO
// ============================================
export function isDemoMode(): boolean {
  return import.meta.env.VITE_SEED_ENABLED === "true";
}

// ============================================
// EXPORT IDS PARA USO EXTERNO
// ============================================
export { DEMO_IDS };
