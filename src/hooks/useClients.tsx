import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import type { Client, Contact, ClientWithContacts } from "@/types/clients";

// Fetch all clients
export function useClients() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["clients", user?.id],
    queryFn: async (): Promise<Client[]> => {
      const { data, error } = await supabase
        .from("clients")
        .select("*")
        .is("deleted_at", null)
        .order("name", { ascending: true });

      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
  });
}

// Fetch single client with contacts
export function useClient(clientId: string | undefined) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["clients", clientId],
    queryFn: async (): Promise<ClientWithContacts | null> => {
      if (!clientId) return null;

      const { data: client, error: clientError } = await supabase
        .from("clients")
        .select("*")
        .eq("id", clientId)
        .is("deleted_at", null)
        .single();

      if (clientError) throw clientError;
      if (!client) return null;

      const { data: contacts, error: contactsError } = await supabase
        .from("contacts")
        .select("*")
        .eq("client_id", clientId)
        .is("deleted_at", null)
        .order("is_primary", { ascending: false });

      if (contactsError) throw contactsError;

      return {
        ...client,
        contacts: contacts || [],
      };
    },
    enabled: !!user && !!clientId,
  });
}

// Create client
export function useCreateClient() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (params: Omit<Client, "id" | "created_at" | "updated_at" | "deleted_at" | "owner_id" | "tenant_id">) => {
      if (!user) throw new Error("Utilizador não autenticado");

      const { data, error } = await supabase
        .from("clients")
        .insert({
          ...params,
          owner_id: user.id,
          tenant_id: user.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clients"] });
      toast.success("Cliente criado com sucesso");
    },
    onError: (error) => {
      toast.error(`Erro ao criar cliente: ${error.message}`);
    },
  });
}

// Update client
export function useUpdateClient() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...params }: Partial<Client> & { id: string }) => {
      const { data, error } = await supabase
        .from("clients")
        .update({ ...params, updated_at: new Date().toISOString() })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["clients"] });
      queryClient.invalidateQueries({ queryKey: ["clients", data.id] });
      toast.success("Cliente atualizado com sucesso");
    },
    onError: (error) => {
      toast.error(`Erro ao atualizar cliente: ${error.message}`);
    },
  });
}

// Soft delete client
export function useDeleteClient() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("clients")
        .update({ deleted_at: new Date().toISOString() })
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clients"] });
      toast.success("Cliente eliminado com sucesso");
    },
    onError: (error) => {
      toast.error(`Erro ao eliminar cliente: ${error.message}`);
    },
  });
}

// Create contact
export function useCreateContact() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (params: { client_id: string; name: string; email?: string; phone?: string; role?: string; is_primary?: boolean }) => {
      if (!user) throw new Error("Utilizador não autenticado");

      const { data, error } = await supabase
        .from("contacts")
        .insert({
          client_id: params.client_id,
          name: params.name,
          email: params.email || null,
          phone: params.phone || null,
          role: params.role || null,
          is_primary: params.is_primary ?? false,
          owner_id: user.id,
          tenant_id: user.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["clients", data.client_id] });
      queryClient.invalidateQueries({ queryKey: ["client_contacts", data.client_id] });
      toast.success("Contacto criado com sucesso");
    },
    onError: (error) => {
      toast.error(`Erro ao criar contacto: ${error.message}`);
    },
  });
}

// List contacts for a client
export function useClientContacts(clientId: string | undefined) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["client_contacts", clientId],
    queryFn: async (): Promise<Contact[]> => {
      if (!clientId) return [];

      const { data, error } = await supabase
        .from("contacts")
        .select("*")
        .eq("client_id", clientId)
        .is("deleted_at", null)
        .order("is_primary", { ascending: false })
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!user && !!clientId,
  });
}

// Update contact
export function useUpdateContact() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...params }: { id: string; name?: string; email?: string; phone?: string; role?: string; is_primary?: boolean }) => {
      const { data, error } = await supabase
        .from("contacts")
        .update({ ...params, updated_at: new Date().toISOString() })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["clients", data.client_id] });
      queryClient.invalidateQueries({ queryKey: ["client_contacts", data.client_id] });
      toast.success("Contacto atualizado com sucesso");
    },
    onError: (error) => {
      toast.error(`Erro ao atualizar contacto: ${error.message}`);
    },
  });
}

// Delete contact (soft delete)
export function useDeleteContact() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (contactId: string) => {
      const { data, error } = await supabase
        .from("contacts")
        .update({ deleted_at: new Date().toISOString() })
        .eq("id", contactId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["clients", data.client_id] });
      queryClient.invalidateQueries({ queryKey: ["client_contacts", data.client_id] });
      toast.success("Contacto eliminado com sucesso");
    },
    onError: (error) => {
      toast.error(`Erro ao eliminar contacto: ${error.message}`);
    },
  });
}
