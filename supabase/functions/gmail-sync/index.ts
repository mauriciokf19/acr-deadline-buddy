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
const EMAIL_MAX_ATTACHMENT_MB = parseInt(Deno.env.get("EMAIL_MAX_ATTACHMENT_MB") || "15");

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

// Generate trace ID for logging
function generateTraceId(): string {
  return crypto.randomUUID().slice(0, 8);
}

// Structured logging
function log(traceId: string, level: string, message: string, data?: Record<string, unknown>) {
  console.log(JSON.stringify({
    ts: new Date().toISOString(),
    trace: traceId,
    level,
    message,
    ...data,
  }));
}

// Get valid access token (refresh if needed)
async function getValidAccessToken(
  supabase: any,
  account: { id: string; oauth_access_token_encrypted: string; oauth_refresh_token_encrypted: string; oauth_expiry: string },
  traceId: string
): Promise<string> {
  const now = new Date();
  const expiry = new Date(account.oauth_expiry);
  
  // Check if token is expired or about to expire (5 min buffer)
  if (expiry.getTime() - now.getTime() < 5 * 60 * 1000) {
    log(traceId, "info", "Access token expired, refreshing", { accountId: account.id });
    
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
      log(traceId, "error", "Token refresh failed", { error: errorData });
      throw new Error("Falha ao renovar token de acesso");
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
  }

  return await decryptToken(account.oauth_access_token_encrypted);
}

// Parse Gmail message to our format
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

  const bccHeader = getHeader("Bcc") || "";
  const bccAddresses = bccHeader ? bccHeader.split(",").map(e => e.trim()).filter(Boolean) : [];

  // Get body
  let bodyHtml = "";
  let bodyText = "";
  const payload = gmailMessage.payload as Record<string, unknown>;
  
  if (payload) {
    const parts = payload.parts as Array<Record<string, unknown>> || [payload];
    for (const part of parts) {
      const mimeType = part.mimeType as string;
      const body = part.body as Record<string, unknown>;
      if (body?.data) {
        const decoded = atob((body.data as string).replace(/-/g, "+").replace(/_/g, "/"));
        if (mimeType === "text/html") {
          bodyHtml = decoded;
        } else if (mimeType === "text/plain") {
          bodyText = decoded;
        }
      }
    }
  }

  // Get attachments
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
    bcc_addresses: bccAddresses,
    subject: getHeader("Subject"),
    body_html: bodyHtml,
    body_text: bodyText,
    attachments,
    sent_at: sentAt ? new Date(sentAt).toISOString() : internalDate ? new Date(parseInt(internalDate)).toISOString() : null,
    direction: "inbound",
  };
}

// Sanitize HTML (basic - remove script tags)
function sanitizeHtml(html: string): string {
  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
    .replace(/on\w+="[^"]*"/gi, "")
    .replace(/on\w+='[^']*'/gi, "");
}

serve(async (req) => {
  const traceId = generateTraceId();
  
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    log(traceId, "info", "Gmail sync request received");

    // Validate configuration
    if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
      log(traceId, "error", "Missing Google OAuth credentials");
      return new Response(
        JSON.stringify({ error: "Google OAuth não está configurado" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get authenticated user
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Não autorizado" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: "Utilizador não autenticado" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const body = await req.json();
    const { action, account_id } = body;

    // Get account
    const { data: account, error: accountError } = await supabase
      .from("email_accounts")
      .select("*")
      .eq("id", account_id)
      .eq("owner_id", user.id)
      .eq("provider", "gmail")
      .single();

    if (accountError || !account) {
      log(traceId, "error", "Account not found", { accountId: account_id });
      return new Response(
        JSON.stringify({ error: "Conta de e-mail não encontrada" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const accessToken = await getValidAccessToken(supabase, account, traceId);

    switch (action) {
      case "list_threads": {
        const { since, page = 1, pageSize = 20, query } = body;
        
        let gmailQuery = "";
        if (since) {
          const sinceDate = new Date(since);
          gmailQuery = `after:${Math.floor(sinceDate.getTime() / 1000)}`;
        }
        if (query) {
          gmailQuery += ` ${query}`;
        }

        const params = new URLSearchParams({
          maxResults: pageSize.toString(),
          q: gmailQuery.trim(),
        });

        const response = await fetch(
          `https://gmail.googleapis.com/gmail/v1/users/me/threads?${params}`,
          { headers: { Authorization: `Bearer ${accessToken}` } }
        );

        if (!response.ok) {
          const errorData = await response.text();
          log(traceId, "error", "Gmail API error", { error: errorData });
          throw new Error("Falha ao listar threads do Gmail");
        }

        const data = await response.json();
        log(traceId, "info", "Listed threads", { count: data.threads?.length || 0 });

        return new Response(
          JSON.stringify({
            threads: data.threads || [],
            nextPageToken: data.nextPageToken,
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case "get_thread": {
        const { thread_id } = body;

        const response = await fetch(
          `https://gmail.googleapis.com/gmail/v1/users/me/threads/${thread_id}?format=full`,
          { headers: { Authorization: `Bearer ${accessToken}` } }
        );

        if (!response.ok) {
          throw new Error("Falha ao obter thread do Gmail");
        }

        const gmailThread = await response.json();
        const messages = gmailThread.messages?.map((msg: Record<string, unknown>) => 
          parseGmailMessage(msg, thread_id)
        ) || [];

        const lastMessage = messages[messages.length - 1];
        const snippet = gmailThread.snippet || "";

        return new Response(
          JSON.stringify({
            thread: {
              external_thread_id: thread_id,
              subject: lastMessage?.subject,
              snippet,
              message_count: messages.length,
              last_message_at: lastMessage?.sent_at,
            },
            messages,
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case "sync": {
        const { since } = body;
        const sinceDate = since ? new Date(since) : new Date(Date.now() - EMAIL_SYNC_LOOKBACK_DAYS * 24 * 60 * 60 * 1000);

        log(traceId, "info", "Starting sync", { accountId: account_id, since: sinceDate.toISOString() });

        // Update account status
        await supabase
          .from("email_accounts")
          .update({ sync_status: "syncing" })
          .eq("id", account_id);

        try {
          // List all threads since date
          const gmailQuery = `after:${Math.floor(sinceDate.getTime() / 1000)}`;
          const threadsResponse = await fetch(
            `https://gmail.googleapis.com/gmail/v1/users/me/threads?maxResults=100&q=${encodeURIComponent(gmailQuery)}`,
            { headers: { Authorization: `Bearer ${accessToken}` } }
          );

          if (!threadsResponse.ok) {
            throw new Error("Falha ao listar threads");
          }

          const threadsData = await threadsResponse.json();
          const gmailThreads = threadsData.threads || [];

          const syncedThreads: Array<Record<string, unknown>> = [];
          const syncedMessages: Array<Record<string, unknown>> = [];

          for (const gmailThread of gmailThreads) {
            // Get full thread
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
            const { data: upsertedThread, error: threadError } = await supabase
              .from("email_threads")
              .upsert({
                external_thread_id: gmailThread.id,
                account_id: account_id,
                subject: lastMessage.subject,
                snippet: fullThread.snippet || "",
                message_count: messages.length,
                last_message_at: lastMessage.sent_at,
                owner_id: user.id,
                tenant_id: user.id,
                is_read: false,
              }, {
                onConflict: "external_thread_id,account_id",
              })
              .select()
              .single();

            if (threadError) {
              log(traceId, "error", "Failed to upsert thread", { error: threadError.message });
              continue;
            }

            syncedThreads.push(upsertedThread);

            // Upsert messages
            for (const message of messages) {
              const { error: msgError } = await supabase
                .from("email_messages")
                .upsert({
                  ...message,
                  thread_id: upsertedThread.id,
                  body_html: sanitizeHtml(message.body_html || ""),
                }, {
                  onConflict: "external_message_id,thread_id",
                });

              if (!msgError) {
                syncedMessages.push(message);
              }
            }
          }

          // Update account status
          await supabase
            .from("email_accounts")
            .update({
              sync_status: "idle",
              sync_error: null,
              last_sync_at: new Date().toISOString(),
            })
            .eq("id", account_id);

          log(traceId, "info", "Sync completed", {
            accountId: account_id,
            threadsCount: syncedThreads.length,
            messagesCount: syncedMessages.length,
          });

          return new Response(
            JSON.stringify({
              threads: syncedThreads,
              messages: syncedMessages,
              syncedAt: new Date().toISOString(),
            }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        } catch (syncError) {
          await supabase
            .from("email_accounts")
            .update({
              sync_status: "error",
              sync_error: syncError instanceof Error ? syncError.message : "Erro desconhecido",
            })
            .eq("id", account_id);
          throw syncError;
        }
      }

      case "send": {
        const { to, cc, bcc, subject, body_html, attachments } = body;

        // Validate attachment sizes
        if (attachments?.length) {
          const totalSize = attachments.reduce((sum: number, a: { size_bytes: number }) => sum + (a.size_bytes || 0), 0);
          if (totalSize > EMAIL_MAX_ATTACHMENT_MB * 1024 * 1024) {
            return new Response(
              JSON.stringify({ error: `Anexos excedem ${EMAIL_MAX_ATTACHMENT_MB}MB` }),
              { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
          }
        }

        // Build RFC 2822 message
        const boundary = `boundary_${Date.now()}`;
        const messageParts = [
          `To: ${to.join(", ")}`,
          cc?.length ? `Cc: ${cc.join(", ")}` : "",
          bcc?.length ? `Bcc: ${bcc.join(", ")}` : "",
          `Subject: =?UTF-8?B?${btoa(unescape(encodeURIComponent(subject)))}?=`,
          `MIME-Version: 1.0`,
          `Content-Type: text/html; charset=UTF-8`,
          "",
          body_html,
        ].filter(Boolean).join("\r\n");

        const raw = btoa(unescape(encodeURIComponent(messageParts)))
          .replace(/\+/g, "-")
          .replace(/\//g, "_")
          .replace(/=+$/, "");

        const response = await fetch(
          "https://gmail.googleapis.com/gmail/v1/users/me/messages/send",
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${accessToken}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ raw }),
          }
        );

        if (!response.ok) {
          const errorData = await response.text();
          log(traceId, "error", "Failed to send email", { error: errorData });
          throw new Error("Falha ao enviar e-mail");
        }

        const sentMessage = await response.json();
        log(traceId, "info", "Email sent", { messageId: sentMessage.id });

        return new Response(
          JSON.stringify({ messageId: sentMessage.id }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case "reply": {
        const { thread_id, body_html, cc, bcc } = body;

        // Get original thread to get message ID and subject
        const threadResponse = await fetch(
          `https://gmail.googleapis.com/gmail/v1/users/me/threads/${thread_id}?format=metadata`,
          { headers: { Authorization: `Bearer ${accessToken}` } }
        );

        if (!threadResponse.ok) {
          throw new Error("Falha ao obter thread original");
        }

        const originalThread = await threadResponse.json();
        const lastMessage = originalThread.messages?.[originalThread.messages.length - 1];
        const headers = lastMessage?.payload?.headers || [];
        const getHeader = (name: string) => headers.find((h: { name: string; value: string }) => h.name.toLowerCase() === name.toLowerCase())?.value || "";

        const originalFrom = getHeader("From");
        const originalSubject = getHeader("Subject");
        const messageId = getHeader("Message-ID");
        const references = getHeader("References") || messageId;

        const replySubject = originalSubject.startsWith("Re:") ? originalSubject : `Re: ${originalSubject}`;

        const messageParts = [
          `To: ${originalFrom}`,
          cc?.length ? `Cc: ${cc.join(", ")}` : "",
          bcc?.length ? `Bcc: ${bcc.join(", ")}` : "",
          `Subject: =?UTF-8?B?${btoa(unescape(encodeURIComponent(replySubject)))}?=`,
          `In-Reply-To: ${messageId}`,
          `References: ${references}`,
          `MIME-Version: 1.0`,
          `Content-Type: text/html; charset=UTF-8`,
          "",
          body_html,
        ].filter(Boolean).join("\r\n");

        const raw = btoa(unescape(encodeURIComponent(messageParts)))
          .replace(/\+/g, "-")
          .replace(/\//g, "_")
          .replace(/=+$/, "");

        const response = await fetch(
          `https://gmail.googleapis.com/gmail/v1/users/me/messages/send`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${accessToken}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ raw, threadId: thread_id }),
          }
        );

        if (!response.ok) {
          throw new Error("Falha ao responder e-mail");
        }

        const sentMessage = await response.json();
        log(traceId, "info", "Reply sent", { messageId: sentMessage.id, threadId: thread_id });

        // Store outbound message in our database
        const { data: dbThread } = await supabase
          .from("email_threads")
          .select("id")
          .eq("external_thread_id", thread_id)
          .eq("account_id", account_id)
          .single();

        if (dbThread) {
          await supabase.from("email_messages").insert({
            thread_id: dbThread.id,
            external_message_id: sentMessage.id,
            from_address: account.email_address,
            from_name: account.display_name,
            to_addresses: [originalFrom],
            cc_addresses: cc || [],
            bcc_addresses: bcc || [],
            subject: replySubject,
            body_html: sanitizeHtml(body_html),
            direction: "outbound",
            sent_at: new Date().toISOString(),
          });
        }

        return new Response(
          JSON.stringify({ messageId: sentMessage.id }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case "forward": {
        const { thread_id, to, body_html } = body;

        // Get original thread
        const threadResponse = await fetch(
          `https://gmail.googleapis.com/gmail/v1/users/me/threads/${thread_id}?format=full`,
          { headers: { Authorization: `Bearer ${accessToken}` } }
        );

        if (!threadResponse.ok) {
          throw new Error("Falha ao obter thread original");
        }

        const originalThread = await threadResponse.json();
        const lastMessage = originalThread.messages?.[originalThread.messages.length - 1];
        const headers = lastMessage?.payload?.headers || [];
        const getHeader = (name: string) => headers.find((h: { name: string; value: string }) => h.name.toLowerCase() === name.toLowerCase())?.value || "";

        const originalSubject = getHeader("Subject");
        const forwardSubject = originalSubject.startsWith("Fwd:") ? originalSubject : `Fwd: ${originalSubject}`;

        // Build forward with original message
        const originalBody = lastMessage?.snippet || "";
        const forwardBody = `
          ${body_html}
          <br/><br/>
          <hr/>
          <p>---------- Mensagem reencaminhada ----------</p>
          <p>De: ${getHeader("From")}</p>
          <p>Data: ${getHeader("Date")}</p>
          <p>Assunto: ${originalSubject}</p>
          <br/>
          ${originalBody}
        `;

        const messageParts = [
          `To: ${to.join(", ")}`,
          `Subject: =?UTF-8?B?${btoa(unescape(encodeURIComponent(forwardSubject)))}?=`,
          `MIME-Version: 1.0`,
          `Content-Type: text/html; charset=UTF-8`,
          "",
          forwardBody,
        ].join("\r\n");

        const raw = btoa(unescape(encodeURIComponent(messageParts)))
          .replace(/\+/g, "-")
          .replace(/\//g, "_")
          .replace(/=+$/, "");

        const response = await fetch(
          "https://gmail.googleapis.com/gmail/v1/users/me/messages/send",
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${accessToken}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ raw }),
          }
        );

        if (!response.ok) {
          throw new Error("Falha ao reencaminhar e-mail");
        }

        const sentMessage = await response.json();
        log(traceId, "info", "Forward sent", { messageId: sentMessage.id });

        return new Response(
          JSON.stringify({ messageId: sentMessage.id }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      default:
        return new Response(
          JSON.stringify({ error: "Ação não suportada" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    }
  } catch (error) {
    log(traceId, "error", "Gmail sync error", { error: error instanceof Error ? error.message : "Unknown error" });
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Erro interno" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
