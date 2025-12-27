// Demo Mode State Management
// Gestão de estado local para ações simuladas em Demo Mode

import { create } from "zustand";
import { 
  demoEmailThreads, 
  demoTasks, 
  demoEmailMessages,
  demoClient,
  demoContacts,
  demoActivityLog,
  demoComments,
  demoDocuments,
  demoObrigacoes,
  demoWorkItemLinks,
  demoEmailAccount,
  isDemoMode,
  enableDemoMode,
  disableDemoMode,
  toggleDemoMode
} from "./demoData";
import type { EmailThread, EmailMessage } from "@/types/email";
import type { TaskWithRelations } from "@/types/tasks";
import type { Client, Contact, ActivityLogEntry, Comment, WorkItemLink } from "@/types/clients";
import { addDays, format } from "date-fns";

interface DemoState {
  // Data
  threads: EmailThread[];
  messages: Record<string, EmailMessage[]>;
  tasks: TaskWithRelations[];
  clients: Client[];
  contacts: Contact[];
  activityLog: ActivityLogEntry[];
  comments: Comment[];
  documents: any[];
  obrigacoes: any[];
  workItemLinks: WorkItemLink[];
  
  // Thread actions
  markThreadRead: (threadId: string) => void;
  snoozeThread: (threadId: string, until: string) => void;
  closeThread: (threadId: string) => void;
  reopenThread: (threadId: string) => void;
  setThreadImportance: (threadId: string, importance: "normal" | "high") => void;
  linkThreadToClient: (threadId: string, clientId: string | null) => void;
  
  // Task actions
  updateTask: (taskId: string, updates: Partial<TaskWithRelations>) => void;
  completeTask: (taskId: string) => void;
  rescheduleTask: (taskId: string, newDate: string) => void;
  createTask: (task: Omit<TaskWithRelations, "id" | "created_at" | "updated_at">) => void;
  
  // Client actions
  updateClient: (clientId: string, updates: Partial<Client>) => void;
  
  // Contact actions
  createContact: (contact: Omit<Contact, "id" | "created_at" | "updated_at">) => void;
  updateContact: (contactId: string, updates: Partial<Contact>) => void;
  deleteContact: (contactId: string) => void;
  
  // Comment actions
  addComment: (comment: Omit<Comment, "id" | "created_at" | "updated_at">) => void;
  
  // Activity log
  logActivity: (entry: Omit<ActivityLogEntry, "id" | "created_at">) => void;
  
  // Reset
  resetDemoData: () => void;
}

const generateId = () => `demo-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

export const useDemoStore = create<DemoState>((set, get) => ({
  // Initial data
  threads: [...demoEmailThreads],
  messages: { ...demoEmailMessages },
  tasks: [...demoTasks],
  clients: [demoClient],
  contacts: [...demoContacts],
  activityLog: [...demoActivityLog],
  comments: [...demoComments],
  documents: [...demoDocuments],
  obrigacoes: [...demoObrigacoes],
  workItemLinks: [...demoWorkItemLinks],
  
  // Thread actions
  markThreadRead: (threadId) => {
    set((state) => ({
      threads: state.threads.map((t) =>
        t.id === threadId ? { ...t, is_read: true, updated_at: new Date().toISOString() } : t
      ),
    }));
  },
  
  snoozeThread: (threadId, until) => {
    set((state) => ({
      threads: state.threads.map((t) =>
        t.id === threadId
          ? { ...t, status: "snoozed" as const, snoozed_until: until, updated_at: new Date().toISOString() }
          : t
      ),
    }));
    get().logActivity({
      actor_id: "demo-user-id",
      action: "snoozed",
      entity_type: "email_thread",
      entity_id: threadId,
      metadata: { until },
      tenant_id: "demo-user-id",
    });
  },
  
  closeThread: (threadId) => {
    set((state) => ({
      threads: state.threads.map((t) =>
        t.id === threadId
          ? { ...t, status: "closed" as const, updated_at: new Date().toISOString() }
          : t
      ),
    }));
    get().logActivity({
      actor_id: "demo-user-id",
      action: "closed",
      entity_type: "email_thread",
      entity_id: threadId,
      metadata: {},
      tenant_id: "demo-user-id",
    });
  },
  
  reopenThread: (threadId) => {
    set((state) => ({
      threads: state.threads.map((t) =>
        t.id === threadId
          ? { ...t, status: "open" as const, snoozed_until: null, updated_at: new Date().toISOString() }
          : t
      ),
    }));
  },
  
  setThreadImportance: (threadId, importance) => {
    set((state) => ({
      threads: state.threads.map((t) =>
        t.id === threadId ? { ...t, importance, updated_at: new Date().toISOString() } : t
      ),
    }));
  },
  
  linkThreadToClient: (threadId, clientId) => {
    set((state) => ({
      threads: state.threads.map((t) =>
        t.id === threadId ? { ...t, client_id: clientId, updated_at: new Date().toISOString() } : t
      ),
    }));
    if (clientId) {
      get().logActivity({
        actor_id: "demo-user-id",
        action: "linked_to_client",
        entity_type: "email_thread",
        entity_id: threadId,
        metadata: { client_id: clientId },
        tenant_id: "demo-user-id",
      });
    }
  },
  
  // Task actions
  updateTask: (taskId, updates) => {
    const now = new Date().toISOString();
    set((state) => ({
      tasks: state.tasks.map((t) =>
        t.id === taskId ? { ...t, ...updates, updated_at: now } : t
      ),
    }));
  },
  
  completeTask: (taskId) => {
    const task = get().tasks.find((t) => t.id === taskId);
    if (!task) return;
    
    const now = new Date().toISOString();
    const newStatus = task.status === "done" ? "todo" : "done";
    
    set((state) => ({
      tasks: state.tasks.map((t) =>
        t.id === taskId
          ? { 
              ...t, 
              status: newStatus as any, 
              completed_at: newStatus === "done" ? now : null,
              updated_at: now 
            }
          : t
      ),
    }));
    
    get().logActivity({
      actor_id: "demo-user-id",
      action: newStatus === "done" ? "completed" : "reopened",
      entity_type: "task",
      entity_id: taskId,
      metadata: { task_title: task.title },
      tenant_id: "demo-user-id",
    });
  },
  
  rescheduleTask: (taskId, newDate) => {
    const task = get().tasks.find((t) => t.id === taskId);
    if (!task) return;
    
    set((state) => ({
      tasks: state.tasks.map((t) =>
        t.id === taskId ? { ...t, due_date: newDate, updated_at: new Date().toISOString() } : t
      ),
    }));
    
    get().logActivity({
      actor_id: "demo-user-id",
      action: "rescheduled",
      entity_type: "task",
      entity_id: taskId,
      metadata: { new_date: newDate, task_title: task.title },
      tenant_id: "demo-user-id",
    });
  },
  
  createTask: (task) => {
    const now = new Date().toISOString();
    const newTask: TaskWithRelations = {
      ...task,
      id: generateId(),
      created_at: now,
      updated_at: now,
    };
    
    set((state) => ({
      tasks: [...state.tasks, newTask],
    }));
    
    get().logActivity({
      actor_id: "demo-user-id",
      action: "created",
      entity_type: "task",
      entity_id: newTask.id,
      metadata: { task_title: newTask.title },
      tenant_id: "demo-user-id",
    });
  },
  
  // Client actions
  updateClient: (clientId, updates) => {
    set((state) => ({
      clients: state.clients.map((c) =>
        c.id === clientId ? { ...c, ...updates, updated_at: new Date().toISOString() } : c
      ),
    }));
  },
  
  // Contact actions
  createContact: (contact) => {
    const now = new Date().toISOString();
    const newContact: Contact = {
      ...contact,
      id: generateId(),
      created_at: now,
      updated_at: now,
    };
    
    set((state) => ({
      contacts: [...state.contacts, newContact],
    }));
  },
  
  updateContact: (contactId, updates) => {
    set((state) => ({
      contacts: state.contacts.map((c) =>
        c.id === contactId ? { ...c, ...updates, updated_at: new Date().toISOString() } : c
      ),
    }));
  },
  
  deleteContact: (contactId) => {
    set((state) => ({
      contacts: state.contacts.map((c) =>
        c.id === contactId ? { ...c, deleted_at: new Date().toISOString() } : c
      ),
    }));
  },
  
  // Comment actions
  addComment: (comment) => {
    const now = new Date().toISOString();
    const newComment: Comment = {
      ...comment,
      id: generateId(),
      created_at: now,
      updated_at: now,
    };
    
    set((state) => ({
      comments: [...state.comments, newComment],
    }));
  },
  
  // Activity log
  logActivity: (entry) => {
    const newEntry: ActivityLogEntry = {
      ...entry,
      id: generateId(),
      created_at: new Date().toISOString(),
    };
    
    set((state) => ({
      activityLog: [newEntry, ...state.activityLog],
    }));
  },
  
  // Reset
  resetDemoData: () => {
    set({
      threads: [...demoEmailThreads],
      messages: { ...demoEmailMessages },
      tasks: [...demoTasks],
      clients: [demoClient],
      contacts: [...demoContacts],
      activityLog: [...demoActivityLog],
      comments: [...demoComments],
      documents: [...demoDocuments],
      obrigacoes: [...demoObrigacoes],
      workItemLinks: [...demoWorkItemLinks],
    });
  },
}));

// Re-export demo mode utilities for convenience
export { isDemoMode, enableDemoMode, disableDemoMode, toggleDemoMode };
