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

// Simple encryption/decryption for tokens (production should use proper vault)
const ENCRYPTION_KEY = Deno.env.get("OAUTH_ENCRYPTION_KEY") || "default-key-change-me";

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

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Validate configuration
    if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
      console.error("Missing Google OAuth credentials");
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

    const { action, code, redirect_uri } = await req.json();

    // Build redirect URI (use provided or construct from origin)
    const origin = req.headers.get("origin") || "https://lovable.dev";
    const callbackUri = redirect_uri || `${origin}/settings/integrations/callback`;

    switch (action) {
      case "get_auth_url": {
        const scopes = [
          "https://www.googleapis.com/auth/gmail.readonly",
          "https://www.googleapis.com/auth/gmail.send",
          "https://www.googleapis.com/auth/gmail.modify",
          "https://www.googleapis.com/auth/userinfo.email",
          "https://www.googleapis.com/auth/userinfo.profile",
        ];

        const state = btoa(JSON.stringify({
          user_id: user.id,
          tenant_id: user.id,
          redirect_uri: callbackUri,
        }));

        const authUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");
        authUrl.searchParams.set("client_id", GOOGLE_CLIENT_ID);
        authUrl.searchParams.set("redirect_uri", callbackUri);
        authUrl.searchParams.set("response_type", "code");
        authUrl.searchParams.set("scope", scopes.join(" "));
        authUrl.searchParams.set("access_type", "offline");
        authUrl.searchParams.set("prompt", "consent");
        authUrl.searchParams.set("state", state);

        console.log(`[google-oauth] Generated auth URL for user ${user.id}`);

        return new Response(
          JSON.stringify({ url: authUrl.toString() }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case "exchange_code": {
        if (!code) {
          return new Response(
            JSON.stringify({ error: "Código de autorização em falta" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        // Exchange code for tokens
        const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: new URLSearchParams({
            client_id: GOOGLE_CLIENT_ID,
            client_secret: GOOGLE_CLIENT_SECRET,
            code,
            grant_type: "authorization_code",
            redirect_uri: callbackUri,
          }),
        });

        if (!tokenResponse.ok) {
          const errorData = await tokenResponse.text();
          console.error("[google-oauth] Token exchange failed:", errorData);
          return new Response(
            JSON.stringify({ error: "Falha na troca de tokens" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        const tokens = await tokenResponse.json();

        // Get user info from Google
        const userInfoResponse = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
          headers: { Authorization: `Bearer ${tokens.access_token}` },
        });

        if (!userInfoResponse.ok) {
          console.error("[google-oauth] Failed to get user info");
          return new Response(
            JSON.stringify({ error: "Falha ao obter informações do utilizador" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        const googleUser = await userInfoResponse.json();

        // Encrypt tokens
        const encryptedAccessToken = await encryptToken(tokens.access_token);
        const encryptedRefreshToken = tokens.refresh_token 
          ? await encryptToken(tokens.refresh_token) 
          : null;

        // Calculate expiry
        const expiresAt = new Date(Date.now() + tokens.expires_in * 1000).toISOString();

        // Check if account already exists
        const { data: existingAccount } = await supabase
          .from("email_accounts")
          .select("id")
          .eq("email_address", googleUser.email)
          .eq("owner_id", user.id)
          .single();

        if (existingAccount) {
          // Update existing account
          const { error: updateError } = await supabase
            .from("email_accounts")
            .update({
              oauth_access_token_encrypted: encryptedAccessToken,
              oauth_refresh_token_encrypted: encryptedRefreshToken || undefined,
              oauth_expiry: expiresAt,
              display_name: googleUser.name,
              active: true,
              sync_status: "idle",
              sync_error: null,
              updated_at: new Date().toISOString(),
            })
            .eq("id", existingAccount.id);

          if (updateError) {
            console.error("[google-oauth] Failed to update account:", updateError);
            throw updateError;
          }

          console.log(`[google-oauth] Updated account for ${googleUser.email}`);
        } else {
          // Create new account
          const { error: insertError } = await supabase
            .from("email_accounts")
            .insert({
              provider: "gmail",
              email_address: googleUser.email,
              display_name: googleUser.name,
              oauth_provider: "google",
              oauth_access_token_encrypted: encryptedAccessToken,
              oauth_refresh_token_encrypted: encryptedRefreshToken,
              oauth_expiry: expiresAt,
              owner_id: user.id,
              tenant_id: user.id,
              active: true,
            });

          if (insertError) {
            console.error("[google-oauth] Failed to create account:", insertError);
            throw insertError;
          }

          console.log(`[google-oauth] Created account for ${googleUser.email}`);
        }

        // Log activity
        await supabase.rpc("log_activity", {
          p_action: "email_account_connected",
          p_entity_id: googleUser.email,
          p_entity_type: "email_account",
          p_metadata: { provider: "gmail", email: googleUser.email },
        });

        return new Response(
          JSON.stringify({ 
            success: true, 
            email: googleUser.email,
            name: googleUser.name,
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case "refresh_token": {
        const { account_id } = await req.json();

        if (!account_id) {
          return new Response(
            JSON.stringify({ error: "ID da conta em falta" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        // Get account
        const { data: account, error: accountError } = await supabase
          .from("email_accounts")
          .select("*")
          .eq("id", account_id)
          .eq("owner_id", user.id)
          .single();

        if (accountError || !account) {
          return new Response(
            JSON.stringify({ error: "Conta não encontrada" }),
            { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        if (!account.oauth_refresh_token_encrypted) {
          return new Response(
            JSON.stringify({ error: "Refresh token não disponível" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        // Decrypt refresh token
        const refreshToken = await decryptToken(account.oauth_refresh_token_encrypted);

        // Refresh access token
        const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: new URLSearchParams({
            client_id: GOOGLE_CLIENT_ID,
            client_secret: GOOGLE_CLIENT_SECRET,
            refresh_token: refreshToken,
            grant_type: "refresh_token",
          }),
        });

        if (!tokenResponse.ok) {
          const errorData = await tokenResponse.text();
          console.error("[google-oauth] Token refresh failed:", errorData);
          
          // Mark account as having sync error
          await supabase
            .from("email_accounts")
            .update({
              sync_status: "error",
              sync_error: "Falha ao renovar token - reautenticação necessária",
              active: false,
            })
            .eq("id", account_id);

          return new Response(
            JSON.stringify({ error: "Falha ao renovar token" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        const tokens = await tokenResponse.json();

        // Encrypt new access token
        const encryptedAccessToken = await encryptToken(tokens.access_token);
        const expiresAt = new Date(Date.now() + tokens.expires_in * 1000).toISOString();

        // Update account
        await supabase
          .from("email_accounts")
          .update({
            oauth_access_token_encrypted: encryptedAccessToken,
            oauth_expiry: expiresAt,
            sync_status: "idle",
            sync_error: null,
            updated_at: new Date().toISOString(),
          })
          .eq("id", account_id);

        console.log(`[google-oauth] Refreshed token for account ${account_id}`);

        return new Response(
          JSON.stringify({ success: true }),
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
    console.error("[google-oauth] Error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Erro interno" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
