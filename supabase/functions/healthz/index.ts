import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const traceId = crypto.randomUUID().slice(0, 8);

  try {
    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

    // Check email accounts
    const { data: accounts, error: accountsError } = await supabase
      .from("email_accounts")
      .select("id, provider, active, last_sync_at, sync_status, sync_error")
      .eq("provider", "gmail");

    if (accountsError) {
      console.log(JSON.stringify({
        timestamp: new Date().toISOString(),
        traceId,
        level: "error",
        message: "Failed to fetch email accounts",
        error: accountsError.message,
      }));
      
      return new Response(
        JSON.stringify({
          status: "fail",
          provider: "gmail",
          error: "Falha ao verificar contas de e-mail",
          timestamp: new Date().toISOString(),
          traceId,
        }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const activeAccounts = accounts?.filter(a => a.active) || [];
    const accountsWithErrors = accounts?.filter(a => a.sync_status === "error") || [];
    const lastSync = accounts
      ?.map(a => a.last_sync_at)
      .filter(Boolean)
      .sort()
      .reverse()[0] || null;

    // Get thread count
    const { count: threadsTotal } = await supabase
      .from("email_threads")
      .select("id", { count: "exact", head: true });

    // Get messages from last 24 hours
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const { count: messagesLast24h } = await supabase
      .from("email_messages")
      .select("id", { count: "exact", head: true })
      .gte("created_at", yesterday);

    // Determine status
    let status: "ok" | "degraded" | "fail" = "ok";
    
    if (accountsWithErrors.length > 0) {
      status = "degraded";
    }
    
    if (activeAccounts.length === 0 && accounts && accounts.length > 0) {
      status = "fail";
    }

    const healthData = {
      status,
      provider: "gmail",
      last_sync_at: lastSync,
      accounts_total: accounts?.length || 0,
      accounts_active: activeAccounts.length,
      accounts_with_errors: accountsWithErrors.length,
      threads_total: threadsTotal || 0,
      messages_last_24h: messagesLast24h || 0,
      timestamp: new Date().toISOString(),
      traceId,
    };

    console.log(JSON.stringify({
      level: "info",
      message: "Health check completed",
      data: healthData,
    }));

    return new Response(
      JSON.stringify(healthData),
      { 
        status: status === "fail" ? 503 : 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  } catch (error) {
    console.log(JSON.stringify({
      timestamp: new Date().toISOString(),
      traceId,
      level: "error",
      message: "Health check failed",
      error: error instanceof Error ? error.message : "Unknown error",
    }));

    return new Response(
      JSON.stringify({
        status: "fail",
        provider: "gmail",
        error: error instanceof Error ? error.message : "Erro interno",
        timestamp: new Date().toISOString(),
        traceId,
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
