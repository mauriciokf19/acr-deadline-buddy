import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import type { Task, TaskWithRelations, CreateTaskParams, UpdateTaskParams } from "@/types/tasks";
import { isDemoMode } from "@/lib/demoData";
import { useDemoStore } from "@/lib/demoStore";

// Fetch all tasks
export function useTasks(filters?: {
  status?: string;
  assignee_id?: string;
  client_id?: string;
  due_from?: string;
  due_to?: string;
}) {
  const { user } = useAuth();
  const demoTasks = useDemoStore((state) => state.tasks);

  return useQuery({
    queryKey: ["tasks", user?.id, filters, isDemoMode()],
    queryFn: async (): Promise<TaskWithRelations[]> => {
      // DEMO MODE: Return filtered demo tasks
      if (isDemoMode()) {
        let filtered = demoTasks.filter((t) => !t.deleted_at);
        
        if (filters?.status) {
          filtered = filtered.filter((t) => t.status === filters.status);
        }
        if (filters?.assignee_id) {
          filtered = filtered.filter((t) => t.assignee_id === filters.assignee_id);
        }
        if (filters?.client_id) {
          filtered = filtered.filter((t) => t.client_id === filters.client_id);
        }
        if (filters?.due_from) {
          filtered = filtered.filter((t) => t.due_date && t.due_date >= filters.due_from!);
        }
        if (filters?.due_to) {
          filtered = filtered.filter((t) => t.due_date && t.due_date <= filters.due_to!);
        }
        
        return filtered.sort((a, b) => 
          (b.created_at || "").localeCompare(a.created_at || "")
        );
      }

      // PRODUCTION MODE: Use Supabase
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
    enabled: !!user || isDemoMode(),
  });
}

// Fetch single task
export function useTask(taskId: string | undefined) {
  const { user } = useAuth();
  const demoTasks = useDemoStore((state) => state.tasks);

  return useQuery({
    queryKey: ["tasks", taskId, isDemoMode()],
    queryFn: async (): Promise<TaskWithRelations | null> => {
      if (!taskId) return null;

      // DEMO MODE
      if (isDemoMode()) {
        return demoTasks.find((t) => t.id === taskId && !t.deleted_at) || null;
      }

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
    enabled: (!!user || isDemoMode()) && !!taskId,
  });
}

// Create task
export function useCreateTask() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const createTask = useDemoStore((state) => state.createTask);

  return useMutation({
    mutationFn: async (params: CreateTaskParams) => {
      // DEMO MODE
      if (isDemoMode()) {
        createTask({
          ...params,
          status: params.status || "todo",
          priority: params.priority || "medium",
          owner_id: "demo-user-id",
          tenant_id: "demo-user-id",
          assignee_id: params.assignee_id || "demo-user-id",
          completed_at: null,
          deleted_at: null,
        } as any);
        return { id: `demo-${Date.now()}` };
      }

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
  const updateTask = useDemoStore((state) => state.updateTask);

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

      // DEMO MODE
      if (isDemoMode()) {
        updateTask(id, updateData as any);
        return { id, ...updateData };
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
      if (data?.id) {
        queryClient.invalidateQueries({ queryKey: ["tasks", data.id] });
      }
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
  const updateTask = useDemoStore((state) => state.updateTask);

  return useMutation({
    mutationFn: async (id: string) => {
      // DEMO MODE
      if (isDemoMode()) {
        updateTask(id, { deleted_at: new Date().toISOString() } as any);
        return;
      }

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
  const updateTaskMutation = useUpdateTask();
  const completeTask = useDemoStore((state) => state.completeTask);

  return useMutation({
    mutationFn: async (id: string) => {
      if (isDemoMode()) {
        completeTask(id);
        return { id };
      }
      return updateTaskMutation.mutateAsync({ id, status: "done" });
    },
  });
}
