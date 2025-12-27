// Gmail Provider Service - Google/Gmail Only (MVP)
// Architecture prepared for future providers

import { supabase } from "@/integrations/supabase/client";
import type { EmailThread, EmailMessage, EmailAttachment } from "@/types/email";

export interface ListThreadsOptions {
  since?: Date;
  page?: number;
  pageSize?: number;
  query?: string;
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
  body_html: string;
  cc?: string[];
  bcc?: string[];
  attachments?: EmailAttachment[];
}

export interface ForwardEmailParams {
  to: string[];
  body_html: string;
  attachments?: EmailAttachment[];
}

export interface SyncResult {
  threads: EmailThread[];
  messages: EmailMessage[];
  syncedAt: string;
}

// Format date to DD/MM/YYYY (pt-PT)
export function formatDatePT(date: Date | string | null): string {
  if (!date) return "-";
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("pt-PT", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: "Europe/Lisbon",
  });
}

// Format datetime to DD/MM/YYYY HH:mm (pt-PT)
export function formatDateTimePT(date: Date | string | null): string {
  if (!date) return "-";
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("pt-PT", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Europe/Lisbon",
  });
}

// Relative time in pt-PT
export function formatRelativeTimePT(date: Date | string | null): string {
  if (!date) return "-";
  const d = typeof date === "string" ? new Date(date) : date;
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return "agora";
  if (diffMins < 60) return `há ${diffMins} min`;
  if (diffHours < 24) return `há ${diffHours}h`;
  if (diffDays < 7) return `há ${diffDays} dias`;
  return formatDatePT(d);
}

// Gmail Provider class
class GmailProvider {
  private accountId: string;
  private accessToken: string | null = null;

  constructor(accountId: string) {
    this.accountId = accountId;
  }

  // Get OAuth URL for connecting Gmail
  static async getAuthUrl(redirectUri?: string): Promise<string> {
    const { data, error } = await supabase.functions.invoke("google-oauth", {
      body: { action: "get_auth_url", redirect_uri: redirectUri },
    });

    if (error) throw new Error(error.message);
    return data.url;
  }

  // Exchange OAuth code for tokens
  static async exchangeCode(code: string, redirectUri?: string): Promise<{ email: string; name: string }> {
    const { data, error } = await supabase.functions.invoke("google-oauth", {
      body: { action: "exchange_code", code, redirect_uri: redirectUri },
    });

    if (error) throw new Error(error.message);
    return { email: data.email, name: data.name };
  }

  // Refresh access token
  async refreshToken(): Promise<void> {
    const { error } = await supabase.functions.invoke("google-oauth", {
      body: { action: "refresh_token", account_id: this.accountId },
    });

    if (error) throw new Error(error.message);
  }

  // List threads from Gmail
  async listThreads(options: ListThreadsOptions = {}): Promise<{ threads: EmailThread[]; nextPageToken?: string }> {
    const { data, error } = await supabase.functions.invoke("gmail-sync", {
      body: {
        action: "list_threads",
        account_id: this.accountId,
        ...options,
      },
    });

    if (error) throw new Error(error.message);
    return data;
  }

  // Get a single thread with messages
  async getThread(threadId: string): Promise<{ thread: EmailThread; messages: EmailMessage[] }> {
    const { data, error } = await supabase.functions.invoke("gmail-sync", {
      body: {
        action: "get_thread",
        account_id: this.accountId,
        thread_id: threadId,
      },
    });

    if (error) throw new Error(error.message);
    return data;
  }

  // Send a new email
  async send(params: SendEmailParams): Promise<{ messageId: string }> {
    const { data, error } = await supabase.functions.invoke("gmail-sync", {
      body: {
        action: "send",
        account_id: this.accountId,
        ...params,
      },
    });

    if (error) throw new Error(error.message);
    return data;
  }

  // Reply to a thread
  async reply(threadId: string, params: ReplyEmailParams): Promise<{ messageId: string }> {
    const { data, error } = await supabase.functions.invoke("gmail-sync", {
      body: {
        action: "reply",
        account_id: this.accountId,
        thread_id: threadId,
        ...params,
      },
    });

    if (error) throw new Error(error.message);
    return data;
  }

  // Forward a thread
  async forward(threadId: string, params: ForwardEmailParams): Promise<{ messageId: string }> {
    const { data, error } = await supabase.functions.invoke("gmail-sync", {
      body: {
        action: "forward",
        account_id: this.accountId,
        thread_id: threadId,
        ...params,
      },
    });

    if (error) throw new Error(error.message);
    return data;
  }

  // Sync threads since a given date
  async syncSince(since: Date): Promise<SyncResult> {
    const { data, error } = await supabase.functions.invoke("gmail-sync", {
      body: {
        action: "sync",
        account_id: this.accountId,
        since: since.toISOString(),
      },
    });

    if (error) throw new Error(error.message);
    return data;
  }
}

export default GmailProvider;
