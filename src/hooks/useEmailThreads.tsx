import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import type { EmailThread, EmailMessage } from "@/types/email";

interface ThreadFilters {
  status?: 'open' | 'snoozed' | 'closed';
  importance?: 'normal' | 'high';
  client_id?: string;
  is_read?: boolean;
  search?: string;
}

// Fetch email threads
export function useEmailThreads(filters?: ThreadFilters) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["email_threads", user?.id, filters],
    queryFn: async (): Promise<EmailThread[]> => {
      let query = supabase
        .from("email_threads")
        .select("*")
        .order("last_message_at", { ascending: false, nullsFirst: false });

      if (filters?.status) {
        query = query.eq("status", filters.status);
      }
      if (filters?.importance) {
        query = query.eq("importance", filters.importance);
      }
      if (filters?.client_id) {
        query = query.eq("client_id", filters.client_id);
      }
      if (filters?.is_read !== undefined) {
        query = query.eq("is_read", filters.is_read);
      }
      if (filters?.search) {
        query = query.ilike("subject", `%${filters.search}%`);
      }

      const { data, error } = await query.limit(50);

      if (error) throw error;
      return (data || []) as EmailThread[];
    },
    enabled: !!user,
  });
}

// Fetch single thread with messages
export function useEmailThread(threadId: string | undefined) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["email_threads", threadId],
    queryFn: async (): Promise<{ thread: EmailThread; messages: EmailMessage[] } | null> => {
      if (!threadId) return null;

      const { data: thread, error: threadError } = await supabase
        .from("email_threads")
        .select("*")
        .eq("id", threadId)
        .single();

      if (threadError) throw threadError;

      const { data: messages, error: messagesError } = await supabase
        .from("email_messages")
        .select("*")
        .eq("thread_id", threadId)
        .order("sent_at", { ascending: true });

      if (messagesError) throw messagesError;

      // Transform database types to our domain types
      const transformedMessages: EmailMessage[] = (messages || []).map((msg) => ({
        id: msg.id,
        thread_id: msg.thread_id,
        external_message_id: msg.external_message_id,
        from_name: msg.from_name,
        from_address: msg.from_address,
        to_addresses: Array.isArray(msg.to_addresses) ? msg.to_addresses as string[] : [],
        cc_addresses: Array.isArray(msg.cc_addresses) ? msg.cc_addresses as string[] : [],
        bcc_addresses: Array.isArray(msg.bcc_addresses) ? msg.bcc_addresses as string[] : [],
        subject: msg.subject,
        body_html: msg.body_html,
        body_text: msg.body_text,
        attachments: Array.isArray(msg.attachments) ? msg.attachments as unknown as EmailMessage["attachments"] : [],
        sent_at: msg.sent_at,
        direction: msg.direction as "inbound" | "outbound",
        created_at: msg.created_at || "",
      }));

      return {
        thread: thread as EmailThread,
        messages: transformedMessages,
      };
    },
    enabled: !!user && !!threadId,
  });
}

// Mark thread as read
export function useMarkThreadRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (threadId: string) => {
      const { error } = await supabase
        .from("email_threads")
        .update({ is_read: true, updated_at: new Date().toISOString() })
        .eq("id", threadId);

      if (error) throw error;
    },
    onSuccess: (_, threadId) => {
      queryClient.invalidateQueries({ queryKey: ["email_threads"] });
      queryClient.invalidateQueries({ queryKey: ["email_threads", threadId] });
    },
  });
}

// Snooze thread
export function useSnoozeThread() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ threadId, until }: { threadId: string; until: string }) => {
      const { error } = await supabase
        .from("email_threads")
        .update({
          status: "snoozed",
          snoozed_until: until,
          updated_at: new Date().toISOString(),
        })
        .eq("id", threadId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["email_threads"] });
      toast.success("Conversa adiada");
    },
    onError: (error) => {
      toast.error(`Erro ao adiar: ${error.message}`);
    },
  });
}

// Close thread
export function useCloseThread() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (threadId: string) => {
      const { error } = await supabase
        .from("email_threads")
        .update({
          status: "closed",
          updated_at: new Date().toISOString(),
        })
        .eq("id", threadId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["email_threads"] });
      toast.success("Conversa fechada");
    },
    onError: (error) => {
      toast.error(`Erro ao fechar: ${error.message}`);
    },
  });
}

// Reopen thread
export function useReopenThread() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (threadId: string) => {
      const { error } = await supabase
        .from("email_threads")
        .update({
          status: "open",
          snoozed_until: null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", threadId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["email_threads"] });
      toast.success("Conversa reaberta");
    },
    onError: (error) => {
      toast.error(`Erro ao reabrir: ${error.message}`);
    },
  });
}

// Set thread importance
export function useSetThreadImportance() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ threadId, importance }: { threadId: string; importance: 'normal' | 'high' }) => {
      const { error } = await supabase
        .from("email_threads")
        .update({
          importance,
          updated_at: new Date().toISOString(),
        })
        .eq("id", threadId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["email_threads"] });
      toast.success("Prioridade atualizada");
    },
    onError: (error) => {
      toast.error(`Erro ao atualizar prioridade: ${error.message}`);
    },
  });
}

// Link thread to client
export function useLinkThreadToClient() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ threadId, clientId }: { threadId: string; clientId: string | null }) => {
      const { error } = await supabase
        .from("email_threads")
        .update({
          client_id: clientId,
          updated_at: new Date().toISOString(),
        })
        .eq("id", threadId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["email_threads"] });
      toast.success("Cliente associado");
    },
    onError: (error) => {
      toast.error(`Erro ao associar cliente: ${error.message}`);
    },
  });
}
