import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import type { Task, TaskWithRelations, CreateTaskParams, UpdateTaskParams } from "@/types/tasks";

// Fetch all tasks
export function useTasks(filters?: {
  status?: string;
  assignee_id?: string;
  client_id?: string;
  due_from?: string;
  due_to?: string;
}) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["tasks", user?.id, filters],
    queryFn: async (): Promise<TaskWithRelations[]> => {
      let query = supabase
        .from("tasks")
        .select(`
          *,
          client:clients(id, name),
          email_thread:email_threads(id, subject)
        `)
        .is("deleted_at", null)
        .order("created_at", { ascending: false });

      if (filters?.status) {
        query = query.eq("status", filters.status);
      }
      if (filters?.assignee_id) {
        query = query.eq("assignee_id", filters.assignee_id);
      }
      if (filters?.client_id) {
        query = query.eq("client_id", filters.client_id);
      }
      if (filters?.due_from) {
        query = query.gte("due_date", filters.due_from);
      }
      if (filters?.due_to) {
        query = query.lte("due_date", filters.due_to);
      }

      const { data, error } = await query;

      if (error) throw error;
      return (data || []) as TaskWithRelations[];
    },
    enabled: !!user,
  });
}

// Fetch single task
export function useTask(taskId: string | undefined) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["tasks", taskId],
    queryFn: async (): Promise<TaskWithRelations | null> => {
      if (!taskId) return null;

      const { data, error } = await supabase
        .from("tasks")
        .select(`
          *,
          client:clients(id, name),
          email_thread:email_threads(id, subject)
        `)
        .eq("id", taskId)
        .is("deleted_at", null)
        .single();

      if (error) throw error;
      return data as TaskWithRelations;
    },
    enabled: !!user && !!taskId,
  });
}

// Create task
export function useCreateTask() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (params: CreateTaskParams) => {
      if (!user) throw new Error("Utilizador não autenticado");

      const { data, error } = await supabase
        .from("tasks")
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
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      toast.success("Tarefa criada com sucesso");
    },
    onError: (error) => {
      toast.error(`Erro ao criar tarefa: ${error.message}`);
    },
  });
}

// Update task
export function useUpdateTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...params }: UpdateTaskParams & { id: string }) => {
      const updateData: Record<string, unknown> = {
        ...params,
        updated_at: new Date().toISOString(),
      };

      // If status changes to done, set completed_at
      if (params.status === "done" && !params.completed_at) {
        updateData.completed_at = new Date().toISOString();
      } else if (params.status && params.status !== "done") {
        updateData.completed_at = null;
      }

      const { data, error } = await supabase
        .from("tasks")
        .update(updateData)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      queryClient.invalidateQueries({ queryKey: ["tasks", data.id] });
      toast.success("Tarefa atualizada com sucesso");
    },
    onError: (error) => {
      toast.error(`Erro ao atualizar tarefa: ${error.message}`);
    },
  });
}

// Delete task (soft delete)
export function useDeleteTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("tasks")
        .update({ deleted_at: new Date().toISOString() })
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      toast.success("Tarefa eliminada com sucesso");
    },
    onError: (error) => {
      toast.error(`Erro ao eliminar tarefa: ${error.message}`);
    },
  });
}

// Quick action: Complete task
export function useCompleteTask() {
  const updateTask = useUpdateTask();

  return useMutation({
    mutationFn: async (id: string) => {
      return updateTask.mutateAsync({ id, status: "done" });
    },
  });
}
