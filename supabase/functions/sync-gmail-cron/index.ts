import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const GOOGLE_CLIENT_ID = Deno.env.get("GOOGLE_CLIENT_ID");
const GOOGLE_CLIENT_SECRET = Deno.env.get("GOOGLE_CLIENT_SECRET");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
const ENCRYPTION_KEY = Deno.env.get("OAUTH_ENCRYPTION_KEY") || "default-key-change-me";

const EMAIL_SYNC_LOOKBACK_DAYS = parseInt(Deno.env.get("EMAIL_SYNC_LOOKBACK_DAYS") || "30");
const MAX_CONSECUTIVE_FAILURES = 3;

// Decrypt token
async function decryptToken(encryptedToken: string): Promise<string> {
  const encoder = new TextEncoder();
  const keyData = encoder.encode(ENCRYPTION_KEY.padEnd(32, "0").slice(0, 32));
  const key = await crypto.subtle.importKey(
    "raw",
    keyData,
    { name: "AES-GCM" },
    false,
    ["decrypt"]
  );
  
  const combined = Uint8Array.from(atob(encryptedToken), c => c.charCodeAt(0));
  const iv = combined.slice(0, 12);
  const encrypted = combined.slice(12);
  
  const decrypted = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv },
    key,
    encrypted
  );
  
  return new TextDecoder().decode(decrypted);
}

// Encrypt token
async function encryptToken(token: string): Promise<string> {
  const encoder = new TextEncoder();
  const keyData = encoder.encode(ENCRYPTION_KEY.padEnd(32, "0").slice(0, 32));
  const key = await crypto.subtle.importKey(
    "raw",
    keyData,
    { name: "AES-GCM" },
    false,
    ["encrypt"]
  );
  
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encrypted = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    encoder.encode(token)
  );
  
  const combined = new Uint8Array(iv.length + new Uint8Array(encrypted).length);
  combined.set(iv);
  combined.set(new Uint8Array(encrypted), iv.length);
  
  return btoa(String.fromCharCode(...combined));
}

function generateTraceId(): string {
  return crypto.randomUUID().slice(0, 8);
}

function log(traceId: string, level: string, message: string, data?: Record<string, unknown>) {
  console.log(JSON.stringify({
    timestamp: new Date().toISOString(),
    traceId,
    level,
    message,
    service: "sync-gmail-cron",
    ...data,
  }));
}

// Get valid access token (refresh if needed)
async function getValidAccessToken(
  supabase: ReturnType<typeof createClient>,
  account: { 
    id: string; 
    oauth_access_token_encrypted: string; 
    oauth_refresh_token_encrypted: string; 
    oauth_expiry: string;
    email_address: string;
  },
  traceId: string
): Promise<string | null> {
  const now = new Date();
  const expiry = new Date(account.oauth_expiry);
  
  if (expiry.getTime() - now.getTime() < 5 * 60 * 1000) {
    log(traceId, "info", "Refreshing token", { email: account.email_address });
    
    try {
      const refreshToken = await decryptToken(account.oauth_refresh_token_encrypted);
      
      const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          client_id: GOOGLE_CLIENT_ID!,
          client_secret: GOOGLE_CLIENT_SECRET!,
          refresh_token: refreshToken,
          grant_type: "refresh_token",
        }),
      });

      if (!tokenResponse.ok) {
        const errorData = await tokenResponse.text();
        log(traceId, "error", "Token refresh failed", { error: errorData, email: account.email_address });
        return null;
      }

      const tokens = await tokenResponse.json();
      const encryptedAccessToken = await encryptToken(tokens.access_token);
      const newExpiry = new Date(Date.now() + tokens.expires_in * 1000).toISOString();

      await supabase
        .from("email_accounts")
        .update({
          oauth_access_token_encrypted: encryptedAccessToken,
          oauth_expiry: newExpiry,
          updated_at: new Date().toISOString(),
        })
        .eq("id", account.id);

      return tokens.access_token;
    } catch (error) {
      log(traceId, "error", "Token refresh error", { 
        error: error instanceof Error ? error.message : "Unknown",
        email: account.email_address 
      });
      return null;
    }
  }

  try {
    return await decryptToken(account.oauth_access_token_encrypted);
  } catch {
    return null;
  }
}

// Sanitize HTML
function sanitizeHtml(html: string): string {
  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
    .replace(/on\w+="[^"]*"/gi, "")
    .replace(/on\w+='[^']*'/gi, "");
}

// Parse Gmail message
function parseGmailMessage(gmailMessage: Record<string, unknown>, threadId: string): Record<string, unknown> {
  const headers = (gmailMessage.payload as Record<string, unknown>)?.headers as Array<{ name: string; value: string }> || [];
  const getHeader = (name: string) => headers.find(h => h.name.toLowerCase() === name.toLowerCase())?.value || null;

  const fromHeader = getHeader("From") || "";
  const fromMatch = fromHeader.match(/^(?:"?([^"<]*)"?\s*)?<?([^>]*)>?$/);
  const fromName = fromMatch?.[1]?.trim() || null;
  const fromAddress = fromMatch?.[2]?.trim() || fromHeader;

  const toHeader = getHeader("To") || "";
  const toAddresses = toHeader.split(",").map(e => e.trim()).filter(Boolean);

  const ccHeader = getHeader("Cc") || "";
  const ccAddresses = ccHeader ? ccHeader.split(",").map(e => e.trim()).filter(Boolean) : [];

  let bodyHtml = "";
  let bodyText = "";
  const payload = gmailMessage.payload as Record<string, unknown>;
  
  if (payload) {
    const parts = payload.parts as Array<Record<string, unknown>> || [payload];
    for (const part of parts) {
      const mimeType = part.mimeType as string;
      const body = part.body as Record<string, unknown>;
      if (body?.data) {
        try {
          const decoded = atob((body.data as string).replace(/-/g, "+").replace(/_/g, "/"));
          if (mimeType === "text/html") {
            bodyHtml = decoded;
          } else if (mimeType === "text/plain") {
            bodyText = decoded;
          }
        } catch {
          // Ignore decode errors
        }
      }
    }
  }

  const attachments: Array<Record<string, unknown>> = [];
  if (payload?.parts) {
    for (const part of payload.parts as Array<Record<string, unknown>>) {
      if (part.filename && (part.body as Record<string, unknown>)?.attachmentId) {
        attachments.push({
          id: (part.body as Record<string, unknown>).attachmentId,
          filename: part.filename,
          mime_type: part.mimeType,
          size_bytes: (part.body as Record<string, unknown>).size || 0,
        });
      }
    }
  }

  const sentAt = getHeader("Date");
  const internalDate = gmailMessage.internalDate as string;

  return {
    external_message_id: gmailMessage.id,
    thread_id: threadId,
    from_name: fromName,
    from_address: fromAddress,
    to_addresses: toAddresses,
    cc_addresses: ccAddresses,
    bcc_addresses: [],
    subject: getHeader("Subject"),
    body_html: bodyHtml,
    body_text: bodyText,
    attachments,
    sent_at: sentAt ? new Date(sentAt).toISOString() : internalDate ? new Date(parseInt(internalDate)).toISOString() : null,
    direction: "inbound",
  };
}

async function syncAccount(
  supabase: any,
  account: {
    id: string;
    email_address: string;
    owner_id: string;
    oauth_access_token_encrypted: string;
    oauth_refresh_token_encrypted: string;
    oauth_expiry: string;
  },
  traceId: string
): Promise<{ success: boolean; threadsCount: number; messagesCount: number }> {
  const accessToken = await getValidAccessToken(supabase, account, traceId);
  
  if (!accessToken) {
    log(traceId, "error", "Failed to get access token", { email: account.email_address });
    return { success: false, threadsCount: 0, messagesCount: 0 };
  }

  const sinceDate = new Date(Date.now() - EMAIL_SYNC_LOOKBACK_DAYS * 24 * 60 * 60 * 1000);
  const gmailQuery = `after:${Math.floor(sinceDate.getTime() / 1000)}`;

  try {
    // List threads
    const threadsResponse = await fetch(
      `https://gmail.googleapis.com/gmail/v1/users/me/threads?maxResults=50&q=${encodeURIComponent(gmailQuery)}`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );

    if (!threadsResponse.ok) {
      const errorData = await threadsResponse.text();
      log(traceId, "error", "Gmail API error", { error: errorData, email: account.email_address });
      return { success: false, threadsCount: 0, messagesCount: 0 };
    }

    const threadsData = await threadsResponse.json();
    const gmailThreads = threadsData.threads || [];

    let syncedThreads = 0;
    let syncedMessages = 0;

    for (const gmailThread of gmailThreads) {
      try {
        const threadResponse = await fetch(
          `https://gmail.googleapis.com/gmail/v1/users/me/threads/${gmailThread.id}?format=full`,
          { headers: { Authorization: `Bearer ${accessToken}` } }
        );

        if (!threadResponse.ok) continue;

        const fullThread = await threadResponse.json();
        const messages = fullThread.messages?.map((msg: Record<string, unknown>) => 
          parseGmailMessage(msg, gmailThread.id)
        ) || [];

        if (messages.length === 0) continue;

        const lastMessage = messages[messages.length - 1];

        // Upsert thread
        const { data: existingThread } = await supabase
          .from("email_threads")
          .select("id")
          .eq("external_thread_id", gmailThread.id)
          .eq("account_id", account.id)
          .single();

        let threadId: string;

        if (existingThread) {
          await supabase
            .from("email_threads")
            .update({
              subject: lastMessage.subject,
              snippet: fullThread.snippet || "",
              message_count: messages.length,
              last_message_at: lastMessage.sent_at,
              updated_at: new Date().toISOString(),
            })
            .eq("id", existingThread.id);
          threadId = existingThread.id;
        } else {
          const { data: newThread, error: insertError } = await supabase
            .from("email_threads")
            .insert({
              external_thread_id: gmailThread.id,
              account_id: account.id,
              subject: lastMessage.subject,
              snippet: fullThread.snippet || "",
              message_count: messages.length,
              last_message_at: lastMessage.sent_at,
              owner_id: account.owner_id,
              tenant_id: account.owner_id,
              is_read: false,
              status: "open",
              importance: "normal",
            })
            .select("id")
            .single();

          if (insertError || !newThread) continue;
          threadId = newThread.id;
        }

        syncedThreads++;

        // Upsert messages
        for (const message of messages) {
          const { data: existingMessage } = await supabase
            .from("email_messages")
            .select("id")
            .eq("external_message_id", message.external_message_id)
            .eq("thread_id", threadId)
            .single();

          if (!existingMessage) {
            const { error: msgError } = await supabase
              .from("email_messages")
              .insert({
                ...message,
                thread_id: threadId,
                body_html: sanitizeHtml(message.body_html || ""),
              });

            if (!msgError) syncedMessages++;
          }
        }
      } catch (threadError) {
        log(traceId, "warn", "Failed to sync thread", { 
          threadId: gmailThread.id,
          error: threadError instanceof Error ? threadError.message : "Unknown"
        });
      }
    }

    return { success: true, threadsCount: syncedThreads, messagesCount: syncedMessages };
  } catch (error) {
    log(traceId, "error", "Sync error", { 
      email: account.email_address,
      error: error instanceof Error ? error.message : "Unknown"
    });
    return { success: false, threadsCount: 0, messagesCount: 0 };
  }
}

serve(async (req) => {
  const traceId = generateTraceId();
  
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  log(traceId, "info", "Cron sync started");

  try {
    if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
      log(traceId, "error", "Missing Google OAuth credentials");
      return new Response(
        JSON.stringify({ error: "Google OAuth não está configurado" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

    // Get all active Gmail accounts
    const { data: accounts, error: accountsError } = await supabase
      .from("email_accounts")
      .select("id, email_address, owner_id, oauth_access_token_encrypted, oauth_refresh_token_encrypted, oauth_expiry, sync_error")
      .eq("provider", "gmail")
      .eq("active", true);

    if (accountsError) {
      log(traceId, "error", "Failed to fetch accounts", { error: accountsError.message });
      return new Response(
        JSON.stringify({ error: "Falha ao obter contas" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!accounts || accounts.length === 0) {
      log(traceId, "info", "No active accounts to sync");
      return new Response(
        JSON.stringify({ message: "Sem contas ativas para sincronizar", syncedAccounts: 0 }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    log(traceId, "info", `Syncing ${accounts.length} accounts`);

    const results: Array<{ email: string; success: boolean; threadsCount: number; messagesCount: number }> = [];

    for (const account of accounts) {
      // Update status to syncing
      await supabase
        .from("email_accounts")
        .update({ sync_status: "syncing" })
        .eq("id", account.id);

      const result = await syncAccount(supabase, account, traceId);

      if (result.success) {
        // Reset error count, update last sync
        await supabase
          .from("email_accounts")
          .update({
            sync_status: "idle",
            sync_error: null,
            last_sync_at: new Date().toISOString(),
          })
          .eq("id", account.id);

        // Log activity
        await supabase.rpc("log_activity", {
          p_action: "email_sync_completed",
          p_entity_id: account.id,
          p_entity_type: "email_account",
          p_metadata: { 
            threads: result.threadsCount, 
            messages: result.messagesCount,
            email: account.email_address,
          },
        });
      } else {
        // Track consecutive failures
        const errorCount = (account.sync_error?.match(/\d+/) || ["0"])[0];
        const newErrorCount = parseInt(errorCount) + 1;

        if (newErrorCount >= MAX_CONSECUTIVE_FAILURES) {
          // Deactivate account after too many failures
          await supabase
            .from("email_accounts")
            .update({
              sync_status: "error",
              sync_error: `Desativado após ${MAX_CONSECUTIVE_FAILURES} falhas consecutivas`,
              active: false,
            })
            .eq("id", account.id);

          log(traceId, "warn", "Account deactivated after failures", { email: account.email_address });
        } else {
          await supabase
            .from("email_accounts")
            .update({
              sync_status: "error",
              sync_error: `Falha ${newErrorCount}/${MAX_CONSECUTIVE_FAILURES}`,
            })
            .eq("id", account.id);
        }
      }

      results.push({
        email: account.email_address,
        success: result.success,
        threadsCount: result.threadsCount,
        messagesCount: result.messagesCount,
      });
    }

    const successCount = results.filter(r => r.success).length;
    const totalThreads = results.reduce((sum, r) => sum + r.threadsCount, 0);
    const totalMessages = results.reduce((sum, r) => sum + r.messagesCount, 0);

    log(traceId, "info", "Cron sync completed", {
      accountsTotal: accounts.length,
      accountsSuccess: successCount,
      threadsTotal: totalThreads,
      messagesTotal: totalMessages,
    });

    return new Response(
      JSON.stringify({
        message: "Sincronização concluída",
        syncedAccounts: successCount,
        failedAccounts: accounts.length - successCount,
        totalThreads,
        totalMessages,
        results,
        timestamp: new Date().toISOString(),
        traceId,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    log(traceId, "error", "Cron sync failed", { error: error instanceof Error ? error.message : "Unknown" });
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Erro interno", traceId }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
