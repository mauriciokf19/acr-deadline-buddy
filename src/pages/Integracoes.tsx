import { Layout } from "@/components/Layout";
import { useEmailAccounts, useGetOAuthUrl, useDisconnectEmailAccount, useSyncEmailAccount } from "@/hooks/useEmailAccounts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Mail, 
  CheckCircle, 
  XCircle, 
  RefreshCw, 
  AlertCircle,
  ExternalLink,
  Trash2,
  Clock
} from "lucide-react";
import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { formatDateTimePT } from "@/lib/gmailProvider";

export default function Integracoes() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { data: accounts, isLoading, refetch } = useEmailAccounts();
  const getOAuthUrl = useGetOAuthUrl();
  const disconnectAccount = useDisconnectEmailAccount();
  const syncAccount = useSyncEmailAccount();

  const [connecting, setConnecting] = useState(false);
  const [syncing, setSyncing] = useState<string | null>(null);

  // Handle OAuth callback
  useEffect(() => {
    const code = searchParams.get("code");
    const error = searchParams.get("error");

    if (error) {
      toast.error("Erro na autenticação: " + error);
      navigate("/definicoes/integracoes", { replace: true });
      return;
    }

    if (code) {
      handleOAuthCallback(code);
    }
  }, [searchParams]);

  const handleOAuthCallback = async (code: string) => {
    setConnecting(true);
    try {
      const { error } = await supabase.functions.invoke("google-oauth", {
        body: {
          action: "exchange_code",
          code,
          redirect_uri: `${window.location.origin}/definicoes/integracoes`,
        },
      });

      if (error) throw error;

      toast.success("Gmail conectado com sucesso!");
      refetch();
      navigate("/definicoes/integracoes", { replace: true });
    } catch (error: any) {
      toast.error(error.message || "Erro ao conectar Gmail");
    } finally {
      setConnecting(false);
    }
  };

  const handleConnectGmail = async () => {
    setConnecting(true);
    try {
      const url = await getOAuthUrl.mutateAsync({
        redirectUri: `${window.location.origin}/definicoes/integracoes`,
      });
      
      // Redirect to Google OAuth
      window.location.href = url;
    } catch (error: any) {
      toast.error(error.message || "Erro ao iniciar autenticação");
      setConnecting(false);
    }
  };

  const handleDisconnect = async (accountId: string) => {
    if (!confirm("Tens a certeza que queres desconectar esta conta? Os e-mails sincronizados serão mantidos.")) {
      return;
    }

    try {
      await disconnectAccount.mutateAsync(accountId);
      toast.success("Conta desconectada");
      refetch();
    } catch (error: any) {
      toast.error(error.message || "Erro ao desconectar");
    }
  };

  const handleSync = async (accountId: string) => {
    setSyncing(accountId);
    try {
      await syncAccount.mutateAsync(accountId);
      toast.success("Sincronização iniciada");
      refetch();
    } catch (error: any) {
      toast.error(error.message || "Erro ao sincronizar");
    } finally {
      setSyncing(null);
    }
  };

  const gmailAccounts = accounts?.filter(a => a.provider === "gmail") || [];
  const hasActiveGmail = gmailAccounts.some(a => a.active);

  return (
    <Layout>
      <div className="container mx-auto p-4 space-y-6 max-w-2xl">
        <div>
          <h1 className="text-2xl font-bold">Integrações</h1>
          <p className="text-sm text-muted-foreground">
            Conecta as tuas contas de e-mail para gerir tudo num só lugar
          </p>
        </div>

        {/* Gmail Integration */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-lg bg-destructive/10 flex items-center justify-center">
                  <Mail className="h-6 w-6 text-destructive" />
                </div>
                <div>
                  <CardTitle className="text-lg">Gmail</CardTitle>
                  <CardDescription>
                    Sincroniza e responde a e-mails diretamente
                  </CardDescription>
                </div>
              </div>
              {hasActiveGmail && (
                <Badge variant="default" className="gap-1">
                  <CheckCircle className="h-3 w-3" />
                  Conectado
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {isLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-16 w-full" />
              </div>
            ) : gmailAccounts.length > 0 ? (
              <div className="space-y-3">
                {gmailAccounts.map((account) => (
                  <div
                    key={account.id}
                    className="flex items-center justify-between p-4 rounded-lg border bg-muted/30"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`h-10 w-10 rounded-full flex items-center justify-center ${
                        account.active ? "bg-success/20 text-success" : "bg-muted text-muted-foreground"
                      }`}>
                        <Mail className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="font-medium text-sm">{account.email_address}</p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          {account.display_name && <span>{account.display_name}</span>}
                          {account.last_sync_at && (
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              Última sync: {formatDateTimePT(account.last_sync_at)}
                            </span>
                          )}
                        </div>
                        {account.sync_status === "error" && account.sync_error && (
                          <p className="text-xs text-destructive mt-1 flex items-center gap-1">
                            <AlertCircle className="h-3 w-3" />
                            {account.sync_error}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={
                        account.sync_status === "syncing" ? "secondary" :
                        account.sync_status === "error" ? "destructive" : "outline"
                      }>
                        {account.sync_status === "syncing" ? "A sincronizar..." :
                         account.sync_status === "error" ? "Erro" : "Idle"}
                      </Badge>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => handleSync(account.id)}
                        disabled={syncing === account.id}
                        title="Sincronizar agora"
                      >
                        <RefreshCw className={`h-4 w-4 ${syncing === account.id ? "animate-spin" : ""}`} />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => handleDisconnect(account.id)}
                        title="Desconectar"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6">
                <Mail className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground mb-4">
                  Nenhuma conta Gmail conectada
                </p>
              </div>
            )}

            <Button
              onClick={handleConnectGmail}
              disabled={connecting}
              className="w-full gap-2"
              variant={hasActiveGmail ? "outline" : "default"}
            >
              <ExternalLink className="h-4 w-4" />
              {connecting ? "A conectar..." : hasActiveGmail ? "Conectar outra conta" : "Conectar Gmail"}
            </Button>

            <div className="text-xs text-muted-foreground space-y-1">
              <p>Permissões necessárias:</p>
              <ul className="list-disc list-inside pl-2">
                <li>Ler e-mails (gmail.readonly)</li>
                <li>Enviar e-mails (gmail.send)</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* Future integrations - hidden for MVP */}
        <Card className="opacity-50">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-lg bg-muted flex items-center justify-center">
                <Mail className="h-6 w-6 text-muted-foreground" />
              </div>
              <div>
                <CardTitle className="text-lg text-muted-foreground">Outlook / Microsoft 365</CardTitle>
                <CardDescription>
                  Em breve
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              A integração com Microsoft está planeada para uma versão futura.
            </p>
          </CardContent>
        </Card>

        {/* Health check info */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Estado do Sistema</CardTitle>
          </CardHeader>
          <CardContent>
            <HealthCheck />
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}

function HealthCheck() {
  const [health, setHealth] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkHealth = async () => {
      try {
        const { data, error } = await supabase.functions.invoke("healthz");
        if (!error && data) {
          setHealth(data);
        }
      } catch {
        // Ignore errors
      } finally {
        setLoading(false);
      }
    };

    checkHealth();
  }, []);

  if (loading) {
    return <Skeleton className="h-20 w-full" />;
  }

  if (!health) {
    return (
      <p className="text-sm text-muted-foreground">
        Não foi possível verificar o estado do sistema
      </p>
    );
  }

  return (
    <div className="space-y-2 text-sm">
      <div className="flex items-center justify-between">
        <span>Estado</span>
        <Badge variant={
          health.status === "ok" ? "default" :
          health.status === "degraded" ? "secondary" : "destructive"
        }>
          {health.status === "ok" ? "OK" :
           health.status === "degraded" ? "Degradado" : "Erro"}
        </Badge>
      </div>
      <div className="flex items-center justify-between text-muted-foreground">
        <span>Provider</span>
        <span>{health.provider}</span>
      </div>
      <div className="flex items-center justify-between text-muted-foreground">
        <span>Contas ativas</span>
        <span>{health.accounts_active || 0}</span>
      </div>
      <div className="flex items-center justify-between text-muted-foreground">
        <span>Total de threads</span>
        <span>{health.threads_total || 0}</span>
      </div>
      <div className="flex items-center justify-between text-muted-foreground">
        <span>Mensagens (24h)</span>
        <span>{health.messages_last_24h || 0}</span>
      </div>
      {health.last_sync_at && (
        <div className="flex items-center justify-between text-muted-foreground">
          <span>Última sync</span>
          <span>{formatDateTimePT(health.last_sync_at)}</span>
        </div>
      )}
    </div>
  );
}
