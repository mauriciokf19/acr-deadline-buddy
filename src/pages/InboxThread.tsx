import { Layout } from "@/components/Layout";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useEmailThread, useMarkThreadRead, useSnoozeThread, useCloseThread, useReopenThread, useSetThreadImportance, useLinkThreadToClient } from "@/hooks/useEmailThreads";
import { useClients } from "@/hooks/useClients";
import { formatDateTimePT, formatRelativeTimePT } from "@/lib/gmailProvider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  ArrowLeft,
  Reply,
  Forward,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  User,
  Paperclip,
  MessageSquare,
  ListTodo,
  Link as LinkIcon,
  Send,
  RotateCcw
} from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";

export default function InboxThread() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const { data: threadData, isLoading, refetch } = useEmailThread(id!);
  const { data: clients } = useClients();
  
  const markRead = useMarkThreadRead();
  const snoozeThread = useSnoozeThread();
  const closeThread = useCloseThread();
  const reopenThread = useReopenThread();
  const setImportance = useSetThreadImportance();
  const linkToClient = useLinkThreadToClient();

  // Dialog states
  const [replyOpen, setReplyOpen] = useState(false);
  const [forwardOpen, setForwardOpen] = useState(false);
  const [snoozeOpen, setSnoozeOpen] = useState(false);
  const [taskOpen, setTaskOpen] = useState(false);
  const [linkClientOpen, setLinkClientOpen] = useState(false);
  const [commentOpen, setCommentOpen] = useState(false);

  // Form states
  const [replyBody, setReplyBody] = useState("");
  const [forwardTo, setForwardTo] = useState("");
  const [forwardBody, setForwardBody] = useState("");
  const [snoozeUntil, setSnoozeUntil] = useState("");
  const [taskTitle, setTaskTitle] = useState("");
  const [taskDueDate, setTaskDueDate] = useState("");
  const [selectedClientId, setSelectedClientId] = useState("");
  const [commentBody, setCommentBody] = useState("");
  const [sending, setSending] = useState(false);

  const thread = threadData?.thread;
  const messages = threadData?.messages || [];

  // Mark as read when opening
  useEffect(() => {
    if (thread && !thread.is_read) {
      markRead.mutate(id!);
    }
  }, [thread, id]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      
      switch (e.key.toLowerCase()) {
        case "r":
          if (!e.ctrlKey && !e.metaKey) setReplyOpen(true);
          break;
        case "f":
          setForwardOpen(true);
          break;
        case "t":
          setTaskOpen(true);
          break;
        case "a":
          setLinkClientOpen(true);
          break;
        case "s":
          setSnoozeOpen(true);
          break;
      }
      
      if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
        if (commentOpen && commentBody.trim()) {
          handleAddComment();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [commentOpen, commentBody]);

  const handleReply = async () => {
    if (!replyBody.trim()) return;
    setSending(true);
    
    try {
      const { error } = await supabase.functions.invoke("gmail-sync", {
        body: {
          action: "reply",
          account_id: thread?.account_id,
          thread_id: thread?.external_thread_id,
          body_html: replyBody,
        },
      });

      if (error) throw error;
      
      toast.success("Resposta enviada!");
      setReplyOpen(false);
      setReplyBody("");
      refetch();
    } catch (error: any) {
      toast.error(error.message || "Erro ao enviar resposta");
    } finally {
      setSending(false);
    }
  };

  const handleForward = async () => {
    if (!forwardTo.trim() || !forwardBody.trim()) return;
    setSending(true);
    
    try {
      const { error } = await supabase.functions.invoke("gmail-sync", {
        body: {
          action: "forward",
          account_id: thread?.account_id,
          thread_id: thread?.external_thread_id,
          to: forwardTo.split(",").map(e => e.trim()),
          body_html: forwardBody,
        },
      });

      if (error) throw error;
      
      toast.success("E-mail reencaminhado!");
      setForwardOpen(false);
      setForwardTo("");
      setForwardBody("");
    } catch (error: any) {
      toast.error(error.message || "Erro ao reencaminhar");
    } finally {
      setSending(false);
    }
  };

  const handleSnooze = async () => {
    if (!snoozeUntil) return;
    
    try {
      await snoozeThread.mutateAsync({ threadId: id!, until: snoozeUntil });
      toast.success("E-mail em pausa até " + new Date(snoozeUntil).toLocaleDateString("pt-PT"));
      setSnoozeOpen(false);
      setSnoozeUntil("");
    } catch (error: any) {
      toast.error(error.message || "Erro ao adormecer");
    }
  };

  const handleClose = async () => {
    try {
      await closeThread.mutateAsync(id!);
      toast.success("Conversa fechada");
    } catch (error: any) {
      toast.error(error.message || "Erro ao fechar");
    }
  };

  const handleReopen = async () => {
    try {
      await reopenThread.mutateAsync(id!);
      toast.success("Conversa reaberta");
    } catch (error: any) {
      toast.error(error.message || "Erro ao reabrir");
    }
  };

  const handleCreateTask = async () => {
    if (!taskTitle.trim()) return;
    setSending(true);
    
    try {
      const { error } = await supabase.from("tasks").insert({
        title: taskTitle,
        description: `Criada a partir do e-mail: ${thread?.subject}`,
        due_date: taskDueDate || null,
        linked_email_thread_id: id,
        client_id: thread?.client_id || null,
        owner_id: user?.id,
        tenant_id: user?.id,
        status: "todo",
        priority: "medium",
      });

      if (error) throw error;
      
      toast.success("Tarefa criada!");
      setTaskOpen(false);
      setTaskTitle("");
      setTaskDueDate("");
    } catch (error: any) {
      toast.error(error.message || "Erro ao criar tarefa");
    } finally {
      setSending(false);
    }
  };

  const handleLinkClient = async () => {
    if (!selectedClientId) return;
    
    try {
      await linkToClient.mutateAsync({ threadId: id!, clientId: selectedClientId });
      toast.success("Cliente associado!");
      setLinkClientOpen(false);
      setSelectedClientId("");
      refetch();
    } catch (error: any) {
      toast.error(error.message || "Erro ao associar cliente");
    }
  };

  const handleAddComment = async () => {
    if (!commentBody.trim()) return;
    setSending(true);
    
    try {
      const { error } = await supabase.from("comments").insert({
        entity_type: "email_thread",
        entity_id: id,
        author_id: user?.id,
        body: commentBody,
        is_internal: true,
      });

      if (error) throw error;
      
      toast.success("Comentário adicionado!");
      setCommentOpen(false);
      setCommentBody("");
    } catch (error: any) {
      toast.error(error.message || "Erro ao adicionar comentário");
    } finally {
      setSending(false);
    }
  };

  const handleTogglePriority = async () => {
    const newImportance = thread?.importance === "high" ? "normal" : "high";
    try {
      await setImportance.mutateAsync({ threadId: id!, importance: newImportance });
      toast.success(newImportance === "high" ? "Marcado como prioritário" : "Prioridade removida");
      refetch();
    } catch (error: any) {
      toast.error(error.message || "Erro ao alterar prioridade");
    }
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="container mx-auto p-4 space-y-4">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-64 w-full" />
        </div>
      </Layout>
    );
  }

  if (!thread) {
    return (
      <Layout>
        <div className="container mx-auto p-4 text-center py-16">
          <p className="text-muted-foreground">E-mail não encontrado</p>
          <Button variant="link" onClick={() => navigate("/inbox")}>
            Voltar à Inbox
          </Button>
        </div>
      </Layout>
    );
  }

  const isClosed = thread.status === "closed";
  const isSnoozed = thread.status === "snoozed";
  const isHighPriority = thread.importance === "high";

  return (
    <Layout>
      <div className="container mx-auto p-4 space-y-4">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/inbox")} aria-label="Voltar">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1 min-w-0">
            <h1 className="text-lg font-semibold truncate">{thread.subject || "(Sem assunto)"}</h1>
            <p className="text-sm text-muted-foreground">
              {messages.length} mensagens · {formatRelativeTimePT(thread.last_message_at)}
            </p>
          </div>
        </div>

        {/* Status badges */}
        <div className="flex items-center gap-2 flex-wrap">
          {thread.client_id && (
            <Badge variant="outline">
              <User className="h-3 w-3 mr-1" />
              Cliente associado
            </Badge>
          )}
          {isHighPriority && (
            <Badge variant="destructive">
              <AlertCircle className="h-3 w-3 mr-1" />
              Prioritário
            </Badge>
          )}
          {isSnoozed && (
            <Badge variant="secondary">
              <Clock className="h-3 w-3 mr-1" />
              Em pausa até {formatDateTimePT(thread.snoozed_until)}
            </Badge>
          )}
          {isClosed && (
            <Badge variant="outline" className="text-muted-foreground">
              <CheckCircle className="h-3 w-3 mr-1" />
              Fechada
            </Badge>
          )}
        </div>

        {/* Actions */}
        <div className="flex flex-wrap gap-2">
          <Button size="sm" onClick={() => setReplyOpen(true)} className="gap-1">
            <Reply className="h-4 w-4" />
            Responder
          </Button>
          <Button size="sm" variant="outline" onClick={() => setForwardOpen(true)} className="gap-1">
            <Forward className="h-4 w-4" />
            Reencaminhar
          </Button>
          <Button size="sm" variant="outline" onClick={() => setTaskOpen(true)} className="gap-1">
            <ListTodo className="h-4 w-4" />
            Criar tarefa
          </Button>
          <Button size="sm" variant="outline" onClick={() => setLinkClientOpen(true)} className="gap-1">
            <LinkIcon className="h-4 w-4" />
            Associar cliente
          </Button>
          <Button size="sm" variant="outline" onClick={() => setCommentOpen(true)} className="gap-1">
            <MessageSquare className="h-4 w-4" />
            Comentar
          </Button>
          <Button size="sm" variant="outline" onClick={() => setSnoozeOpen(true)} className="gap-1">
            <Clock className="h-4 w-4" />
            Adormecer
          </Button>
          <Button 
            size="sm" 
            variant={isHighPriority ? "destructive" : "outline"} 
            onClick={handleTogglePriority}
            className="gap-1"
          >
            <AlertCircle className="h-4 w-4" />
            {isHighPriority ? "Remover prioridade" : "Prioritário"}
          </Button>
          {isClosed ? (
            <Button size="sm" variant="outline" onClick={handleReopen} className="gap-1">
              <RotateCcw className="h-4 w-4" />
              Reabrir
            </Button>
          ) : (
            <Button size="sm" variant="outline" onClick={handleClose} className="gap-1">
              <XCircle className="h-4 w-4" />
              Fechar
            </Button>
          )}
        </div>

        {/* Messages */}
        <div className="space-y-4">
          {messages.map((message: any, index: number) => (
            <Card key={message.id || index} className={cn(
              message.direction === "outbound" && "border-l-4 border-l-primary"
            )}>
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-sm font-medium">
                      {message.from_name || message.from_address}
                    </CardTitle>
                    <p className="text-xs text-muted-foreground">
                      {message.from_address}
                    </p>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {formatDateTimePT(message.sent_at)}
                  </span>
                </div>
                {message.to_addresses?.length > 0 && (
                  <p className="text-xs text-muted-foreground">
                    Para: {message.to_addresses.join(", ")}
                  </p>
                )}
              </CardHeader>
              <CardContent>
                {message.body_html ? (
                  <div 
                    className="prose prose-sm max-w-none text-sm"
                    dangerouslySetInnerHTML={{ __html: message.body_html }}
                  />
                ) : (
                  <p className="text-sm whitespace-pre-wrap">{message.body_text || "(Sem conteúdo)"}</p>
                )}
                
                {message.attachments?.length > 0 && (
                  <div className="flex items-center gap-2 mt-4 pt-4 border-t">
                    <Paperclip className="h-4 w-4 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">
                      {message.attachments.length} anexo(s)
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Keyboard shortcuts hint */}
        <div className="text-xs text-muted-foreground text-center pt-4 space-x-4">
          <span><kbd className="px-1 py-0.5 bg-muted rounded">R</kbd> Responder</span>
          <span><kbd className="px-1 py-0.5 bg-muted rounded">F</kbd> Reencaminhar</span>
          <span><kbd className="px-1 py-0.5 bg-muted rounded">T</kbd> Tarefa</span>
          <span><kbd className="px-1 py-0.5 bg-muted rounded">A</kbd> Associar</span>
          <span><kbd className="px-1 py-0.5 bg-muted rounded">S</kbd> Adormecer</span>
        </div>

        {/* Reply Dialog */}
        <Dialog open={replyOpen} onOpenChange={setReplyOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Responder</DialogTitle>
              <DialogDescription>
                Responder ao e-mail via Gmail
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <Textarea
                placeholder="Escreve a tua resposta..."
                value={replyBody}
                onChange={(e) => setReplyBody(e.target.value)}
                rows={6}
              />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setReplyOpen(false)}>Cancelar</Button>
              <Button onClick={handleReply} disabled={sending || !replyBody.trim()}>
                <Send className="h-4 w-4 mr-2" />
                {sending ? "A enviar..." : "Enviar"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Forward Dialog */}
        <Dialog open={forwardOpen} onOpenChange={setForwardOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Reencaminhar</DialogTitle>
              <DialogDescription>
                Reencaminhar e-mail para outro destinatário
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Para (separar por vírgula)</Label>
                <Input
                  placeholder="email@exemplo.com"
                  value={forwardTo}
                  onChange={(e) => setForwardTo(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Mensagem</Label>
                <Textarea
                  placeholder="Adicionar mensagem..."
                  value={forwardBody}
                  onChange={(e) => setForwardBody(e.target.value)}
                  rows={4}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setForwardOpen(false)}>Cancelar</Button>
              <Button onClick={handleForward} disabled={sending || !forwardTo.trim() || !forwardBody.trim()}>
                <Forward className="h-4 w-4 mr-2" />
                {sending ? "A enviar..." : "Reencaminhar"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Snooze Dialog */}
        <Dialog open={snoozeOpen} onOpenChange={setSnoozeOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Adormecer (Snooze)</DialogTitle>
              <DialogDescription>
                O e-mail voltará a aparecer na data selecionada
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Voltar a mostrar em</Label>
                <Input
                  type="datetime-local"
                  value={snoozeUntil}
                  onChange={(e) => setSnoozeUntil(e.target.value)}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setSnoozeOpen(false)}>Cancelar</Button>
              <Button onClick={handleSnooze} disabled={!snoozeUntil}>
                <Clock className="h-4 w-4 mr-2" />
                Adormecer
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Create Task Dialog */}
        <Dialog open={taskOpen} onOpenChange={setTaskOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Transformar e-mail em tarefa</DialogTitle>
              <DialogDescription>
                Cria uma tarefa a partir deste e-mail
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Título da tarefa</Label>
                <Input
                  placeholder="Título..."
                  value={taskTitle}
                  onChange={(e) => setTaskTitle(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Data limite (opcional)</Label>
                <Input
                  type="date"
                  value={taskDueDate}
                  onChange={(e) => setTaskDueDate(e.target.value)}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setTaskOpen(false)}>Cancelar</Button>
              <Button onClick={handleCreateTask} disabled={sending || !taskTitle.trim()}>
                <ListTodo className="h-4 w-4 mr-2" />
                {sending ? "A criar..." : "Criar tarefa"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Link Client Dialog */}
        <Dialog open={linkClientOpen} onOpenChange={setLinkClientOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Associar a cliente</DialogTitle>
              <DialogDescription>
                Associa este e-mail a um cliente existente
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <Select value={selectedClientId} onValueChange={setSelectedClientId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecionar cliente..." />
                </SelectTrigger>
                <SelectContent>
                  {clients?.map((client) => (
                    <SelectItem key={client.id} value={client.id}>
                      {client.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setLinkClientOpen(false)}>Cancelar</Button>
              <Button onClick={handleLinkClient} disabled={!selectedClientId}>
                <LinkIcon className="h-4 w-4 mr-2" />
                Associar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Comment Dialog */}
        <Dialog open={commentOpen} onOpenChange={setCommentOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Comentário interno</DialogTitle>
              <DialogDescription>
                Adiciona uma nota interna (não será enviada por e-mail)
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <Textarea
                placeholder="Escreve o teu comentário..."
                value={commentBody}
                onChange={(e) => setCommentBody(e.target.value)}
                rows={4}
              />
              <p className="text-xs text-muted-foreground">
                Dica: <kbd className="px-1 py-0.5 bg-muted rounded">Ctrl+Enter</kbd> para enviar
              </p>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setCommentOpen(false)}>Cancelar</Button>
              <Button onClick={handleAddComment} disabled={sending || !commentBody.trim()}>
                <MessageSquare className="h-4 w-4 mr-2" />
                {sending ? "A guardar..." : "Adicionar"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
}
