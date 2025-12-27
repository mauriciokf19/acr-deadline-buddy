import { Layout } from "@/components/Layout";
import { useEmailThreads, useMarkThreadRead, useSnoozeThread, useCloseThread, useReopenThread } from "@/hooks/useEmailThreads";
import { useEmailAccounts } from "@/hooks/useEmailAccounts";
import { formatRelativeTimePT } from "@/lib/gmailProvider";
import { DemoModeBanner } from "@/components/DemoModeBanner";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Mail, 
  Search, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  User,
  Filter,
  RefreshCw,
  Inbox as InboxIcon
} from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type FilterType = "all" | "mine" | "snoozed" | "closed" | "priority";

const filterLabels: Record<FilterType, string> = {
  all: "Todas",
  mine: "Atribuídas a mim",
  snoozed: "Em pausa",
  closed: "Fechadas",
  priority: "Alta prioridade",
};

export default function Inbox() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [filter, setFilter] = useState<FilterType>((searchParams.get("filter") as FilterType) || "all");
  const [searchQuery, setSearchQuery] = useState(searchParams.get("q") || "");
  const [debouncedQuery, setDebouncedQuery] = useState(searchQuery);

  const { data: accounts, isLoading: accountsLoading } = useEmailAccounts();
  const activeAccount = accounts?.find(a => a.active);

  const { data: threads, isLoading: threadsLoading, refetch } = useEmailThreads({
    status: filter === "closed" ? "closed" : filter === "snoozed" ? "snoozed" : "open",
    importance: filter === "priority" ? "high" : undefined,
    search: debouncedQuery || undefined,
  });

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Update URL params
  useEffect(() => {
    const params = new URLSearchParams();
    if (filter !== "all") params.set("filter", filter);
    if (debouncedQuery) params.set("q", debouncedQuery);
    setSearchParams(params, { replace: true });
  }, [filter, debouncedQuery, setSearchParams]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      
      switch (e.key.toLowerCase()) {
        case "r":
          refetch();
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [refetch]);

  const hasNoAccount = !accountsLoading && (!accounts || accounts.length === 0);
  const hasInactiveAccount = !accountsLoading && accounts && accounts.length > 0 && !activeAccount;

  if (hasNoAccount || hasInactiveAccount) {
    return (
      <Layout>
        <div className="container mx-auto p-4">
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Mail className="h-16 w-16 text-muted-foreground mb-4" />
            <h2 className="text-xl font-semibold mb-2">Nenhuma conta de e-mail conectada</h2>
            <p className="text-muted-foreground mb-6 max-w-md">
              Conecta a tua conta Gmail para começar a gerir os teus e-mails diretamente aqui.
            </p>
            <Button asChild>
              <Link to="/definicoes/integracoes">
                Conectar Gmail
              </Link>
            </Button>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto p-4 space-y-4">
        <DemoModeBanner />

        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <InboxIcon className="h-6 w-6" />
              Inbox
            </h1>
            <p className="text-sm text-muted-foreground">
              Triagem e gestão de e-mails
            </p>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              className="gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              <span className="hidden sm:inline">Atualizar</span>
            </Button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Pesquisar e-mails..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
              aria-label="Pesquisar e-mails"
            />
          </div>
          
          <Select value={filter} onValueChange={(v) => setFilter(v as FilterType)}>
            <SelectTrigger className="w-full sm:w-48" aria-label="Filtrar por">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(filterLabels).map(([key, label]) => (
                <SelectItem key={key} value={key}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Thread List */}
        <div className="space-y-2">
          {threadsLoading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <Card key={i}>
                <CardContent className="p-4">
                  <div className="flex gap-4">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-3 w-1/2" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : threads && threads.length > 0 ? (
            threads.map((thread) => (
              <ThreadCard key={thread.id} thread={thread} />
            ))
          ) : (
            <div className="text-center py-12">
              <Mail className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">
                {debouncedQuery
                  ? "Nenhum e-mail encontrado para esta pesquisa"
                  : "Nenhum e-mail nesta categoria"}
              </p>
            </div>
          )}
        </div>

        {/* Keyboard shortcuts hint */}
        <div className="text-xs text-muted-foreground text-center pt-4">
          Atalhos: <kbd className="px-1 py-0.5 bg-muted rounded">R</kbd> Atualizar
        </div>
      </div>
    </Layout>
  );
}

function ThreadCard({ thread }: { thread: any }) {
  const isUnread = !thread.is_read;
  const isSnoozed = thread.status === "snoozed";
  const isClosed = thread.status === "closed";
  const isHighPriority = thread.importance === "high";

  return (
    <Link to={`/inbox/${thread.id}`}>
      <Card className={cn(
        "transition-colors hover:bg-accent/50 cursor-pointer",
        isUnread && "border-l-4 border-l-primary bg-primary/5"
      )}>
        <CardContent className="p-4">
          <div className="flex gap-3">
            <div className="flex-shrink-0">
              <div className={cn(
                "h-10 w-10 rounded-full flex items-center justify-center text-sm font-medium",
                isUnread ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
              )}>
                <User className="h-5 w-5" />
              </div>
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <h3 className={cn(
                  "text-sm truncate",
                  isUnread ? "font-semibold" : "font-medium"
                )}>
                  {thread.subject || "(Sem assunto)"}
                </h3>
                <span className="text-xs text-muted-foreground whitespace-nowrap">
                  {formatRelativeTimePT(thread.last_message_at)}
                </span>
              </div>
              
              <p className="text-xs text-muted-foreground truncate mt-1">
                {thread.snippet || "Sem pré-visualização"}
              </p>
              
              <div className="flex items-center gap-2 mt-2 flex-wrap">
                {thread.client_id && (
                  <Badge variant="outline" className="text-xs">
                    <User className="h-3 w-3 mr-1" />
                    Cliente
                  </Badge>
                )}
                
                {isHighPriority && (
                  <Badge variant="destructive" className="text-xs">
                    <AlertCircle className="h-3 w-3 mr-1" />
                    Prioritário
                  </Badge>
                )}
                
                {isSnoozed && (
                  <Badge variant="secondary" className="text-xs">
                    <Clock className="h-3 w-3 mr-1" />
                    Em pausa
                  </Badge>
                )}
                
                {isClosed && (
                  <Badge variant="outline" className="text-xs text-muted-foreground">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Fechada
                  </Badge>
                )}
                
                <span className="text-xs text-muted-foreground">
                  {thread.message_count || 1} msg
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
