import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import type { EmailAccount, EmailProvider } from "@/types/email";

// Fetch user's email accounts
export function useEmailAccounts() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["email_accounts", user?.id],
    queryFn: async (): Promise<EmailAccount[]> => {
      const { data, error } = await supabase
        .from("email_accounts")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      
      // Filter to only gmail for MVP
      const gmailAccounts = (data || []).filter(
        (account) => account.provider === "gmail"
      );
      
      return gmailAccounts as EmailAccount[];
    },
    enabled: !!user,
  });
}

// Get OAuth URL for connecting account
export function useGetOAuthUrl() {
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (provider: EmailProvider): Promise<string> => {
      if (!user) throw new Error("Utilizador não autenticado");
      
      // Only gmail supported in MVP
      if (provider !== "gmail") {
        throw new Error("Apenas Gmail é suportado neste momento");
      }

      const { data, error } = await supabase.functions.invoke("google-oauth", {
        body: { action: "get_auth_url" },
      });

      if (error) throw error;
      if (!data?.url) throw new Error("URL de autenticação não disponível");
      
      return data.url;
    },
    onError: (error) => {
      toast.error(`Erro ao iniciar autenticação: ${error.message}`);
    },
  });
}

// Exchange OAuth code for tokens
export function useExchangeOAuthCode() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (code: string) => {
      const { data, error } = await supabase.functions.invoke("google-oauth", {
        body: { action: "exchange_code", code },
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["email_accounts"] });
      toast.success("Conta Gmail conectada com sucesso");
    },
    onError: (error) => {
      toast.error(`Erro ao conectar conta: ${error.message}`);
    },
  });
}

// Disconnect email account
export function useDisconnectEmailAccount() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (accountId: string) => {
      const { error } = await supabase
        .from("email_accounts")
        .delete()
        .eq("id", accountId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["email_accounts"] });
      toast.success("Conta desconectada com sucesso");
    },
    onError: (error) => {
      toast.error(`Erro ao desconectar conta: ${error.message}`);
    },
  });
}

// Trigger manual sync
export function useSyncEmailAccount() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (accountId: string) => {
      const { data, error } = await supabase.functions.invoke("sync-gmail", {
        body: { account_id: accountId },
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["email_accounts"] });
      queryClient.invalidateQueries({ queryKey: ["email_threads"] });
      toast.success("Sincronização iniciada");
    },
    onError: (error) => {
      toast.error(`Erro ao sincronizar: ${error.message}`);
    },
  });
}
