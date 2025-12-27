// Email Provider Types - Google Only (MVP)
// Architecture prepared for future providers (outlook, nylas)

export type EmailProvider = 'gmail';

export interface EmailAccount {
  id: string;
  provider: EmailProvider;
  display_name: string | null;
  email_address: string;
  oauth_provider: string | null;
  oauth_expiry: string | null;
  active: boolean;
  last_sync_at: string | null;
  sync_status: 'idle' | 'syncing' | 'error';
  sync_error: string | null;
  owner_id: string;
  tenant_id: string;
  created_at: string;
  updated_at: string;
}

export interface EmailThread {
  id: string;
  account_id: string;
  external_thread_id: string | null;
  subject: string | null;
  snippet: string | null;
  client_id: string | null;
  status: 'open' | 'snoozed' | 'closed';
  importance: 'normal' | 'high';
  is_read: boolean;
  last_message_at: string | null;
  message_count: number;
  snoozed_until: string | null;
  owner_id: string;
  tenant_id: string;
  created_at: string;
  updated_at: string;
}

export interface EmailMessage {
  id: string;
  thread_id: string;
  external_message_id: string | null;
  from_name: string | null;
  from_address: string | null;
  to_addresses: string[];
  cc_addresses: string[];
  bcc_addresses: string[];
  subject: string | null;
  body_html: string | null;
  body_text: string | null;
  attachments: EmailAttachment[];
  sent_at: string | null;
  direction: 'inbound' | 'outbound';
  created_at: string;
}

export interface EmailAttachment {
  id: string;
  filename: string;
  mime_type: string;
  size_bytes: number;
  url?: string;
}

// OAuth types
export interface OAuthState {
  provider: EmailProvider;
  redirect_uri: string;
  user_id: string;
  tenant_id: string;
}

export interface OAuthTokenResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  token_type: string;
  scope: string;
}

// Provider abstraction interface (prepared for future providers)
export interface IEmailProvider {
  provider: EmailProvider;
  getAuthUrl(state: string, redirectUri: string): string;
  exchangeCodeForTokens(code: string, redirectUri: string): Promise<OAuthTokenResponse>;
  refreshAccessToken(refreshToken: string): Promise<OAuthTokenResponse>;
  listThreads(accessToken: string, options?: ListThreadsOptions): Promise<EmailThread[]>;
  getThread(accessToken: string, threadId: string): Promise<EmailThread>;
  listMessages(accessToken: string, threadId: string): Promise<EmailMessage[]>;
  sendEmail(accessToken: string, message: SendEmailParams): Promise<{ messageId: string }>;
  replyToThread(accessToken: string, threadId: string, message: ReplyEmailParams): Promise<{ messageId: string }>;
}

export interface ListThreadsOptions {
  maxResults?: number;
  pageToken?: string;
  query?: string;
  labelIds?: string[];
}

export interface SendEmailParams {
  to: string[];
  cc?: string[];
  bcc?: string[];
  subject: string;
  body_html: string;
  attachments?: EmailAttachment[];
}

export interface ReplyEmailParams {
  to: string[];
  cc?: string[];
  bcc?: string[];
  body_html: string;
  in_reply_to: string;
  references: string[];
}
