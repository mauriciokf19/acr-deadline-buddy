// Task Types

export type TaskStatus = 'todo' | 'in_progress' | 'blocked' | 'done';
export type TaskPriority = 'low' | 'medium' | 'high';

export interface Task {
  id: string;
  title: string;
  description: string | null;
  client_id: string | null;
  linked_email_thread_id: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  due_date: string | null;
  assignee_id: string | null;
  completed_at: string | null;
  owner_id: string;
  tenant_id: string;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface TaskWithRelations extends Task {
  client?: {
    id: string;
    name: string;
  } | null;
  email_thread?: {
    id: string;
    subject: string | null;
  } | null;
}

export interface CreateTaskParams {
  title: string;
  description?: string;
  client_id?: string;
  linked_email_thread_id?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  due_date?: string;
  assignee_id?: string;
}

export interface UpdateTaskParams {
  title?: string;
  description?: string | null;
  client_id?: string | null;
  linked_email_thread_id?: string | null;
  status?: TaskStatus;
  priority?: TaskPriority;
  due_date?: string | null;
  assignee_id?: string | null;
  completed_at?: string | null;
}
