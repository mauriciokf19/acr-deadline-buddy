import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import type { ActivityLogEntry } from "@/types/clients";

interface ActivityFilters {
  entity_type?: string;
  entity_id?: string;
  actor_id?: string;
  limit?: number;
}

// Fetch activity log
export function useActivityLog(filters?: ActivityFilters) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["activity_log", user?.id, filters],
    queryFn: async (): Promise<ActivityLogEntry[]> => {
      let query = supabase
        .from("activity_log")
        .select("*")
        .order("created_at", { ascending: false });

      if (filters?.entity_type) {
        query = query.eq("entity_type", filters.entity_type);
      }
      if (filters?.entity_id) {
        query = query.eq("entity_id", filters.entity_id);
      }
      if (filters?.actor_id) {
        query = query.eq("actor_id", filters.actor_id);
      }

      const limit = filters?.limit || 50;
      query = query.limit(limit);

      const { data, error } = await query;

      if (error) throw error;
      return (data || []) as ActivityLogEntry[];
    },
    enabled: !!user,
  });
}

// Fetch activity for a specific client (all related entities)
export function useClientActivity(clientId: string | undefined) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["client_activity", clientId],
    queryFn: async (): Promise<ActivityLogEntry[]> => {
      if (!clientId) return [];

      // Get activities directly related to client
      const { data: clientActivities, error: clientError } = await supabase
        .from("activity_log")
        .select("*")
        .eq("entity_type", "client")
        .eq("entity_id", clientId)
        .order("created_at", { ascending: false })
        .limit(100);

      if (clientError) throw clientError;

      // Get activities related to client's tasks
      const { data: tasks } = await supabase
        .from("tasks")
        .select("id")
        .eq("client_id", clientId);

      const taskIds = tasks?.map((t) => t.id) || [];
      
      let taskActivities: ActivityLogEntry[] = [];
      if (taskIds.length > 0) {
        const { data, error } = await supabase
          .from("activity_log")
          .select("*")
          .eq("entity_type", "task")
          .in("entity_id", taskIds)
          .order("created_at", { ascending: false })
          .limit(50);
        
        if (!error) {
          taskActivities = (data || []) as ActivityLogEntry[];
        }
      }

      // Get activities related to client's email threads
      const { data: threads } = await supabase
        .from("email_threads")
        .select("id")
        .eq("client_id", clientId);

      const threadIds = threads?.map((t) => t.id) || [];
      
      let threadActivities: ActivityLogEntry[] = [];
      if (threadIds.length > 0) {
        const { data, error } = await supabase
          .from("activity_log")
          .select("*")
          .eq("entity_type", "email_thread")
          .in("entity_id", threadIds)
          .order("created_at", { ascending: false })
          .limit(50);
        
        if (!error) {
          threadActivities = (data || []) as ActivityLogEntry[];
        }
      }

      // Combine and sort all activities
      const allActivities = [
        ...(clientActivities || []),
        ...taskActivities,
        ...threadActivities,
      ].sort((a, b) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );

      return allActivities.slice(0, 100) as ActivityLogEntry[];
    },
    enabled: !!user && !!clientId,
  });
}

// Log an activity
export function useLogActivity() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (params: {
      action: string;
      entity_type: string;
      entity_id: string;
      metadata?: Record<string, string | number | boolean | null>;
    }) => {
      if (!user) throw new Error("Utilizador não autenticado");

      const { data, error } = await supabase.rpc("log_activity", {
        p_action: params.action,
        p_entity_id: params.entity_id,
        p_entity_type: params.entity_type,
        p_metadata: params.metadata || {},
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["activity_log"] });
      queryClient.invalidateQueries({ queryKey: ["client_activity"] });
    },
  });
}
