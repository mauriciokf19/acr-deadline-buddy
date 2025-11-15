import { Layout } from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { LogOut, User, Trash2, AlertTriangle } from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { hardDeleteObrigacao, restoreObrigacao } from "@/lib/obrigacoesService";

export default function Definicoes() {
  const { user, signOut } = useAuth();
  const [deletedObrigacoes, setDeletedObrigacoes] = useState<any[]>([]);
  const [selectedObrigacao, setSelectedObrigacao] = useState<any>(null);
  const [confirmationText, setConfirmationText] = useState("");
  const [hardDeleteDialogOpen, setHardDeleteDialogOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [restoringId, setRestoringId] = useState<string | null>(null);

  useEffect(() => {
    loadDeletedObrigacoes();
  }, []);

  const loadDeletedObrigacoes = async () => {
    const { data, error } = await supabase
      .from("obrigacoes")
      .select("id, titulo, tipo, deleted_at")
      .not("deleted_at", "is", null)
      .order("deleted_at", { ascending: false });

    if (error) {
      console.error("Erro ao carregar obrigações arquivadas:", error);
    } else {
      setDeletedObrigacoes(data || []);
    }
  };

  const handleRestore = async (obrigacao: any) => {
    setRestoringId(obrigacao.id);
    const result = await restoreObrigacao({ obrigacaoId: obrigacao.id });
    setRestoringId(null);

    if (result.success) {
      const message = `Obrigação recuperada. ${result.affectedTarefas} tarefas e ${result.affectedLembretes} lembretes foram restaurados.`;
      
      // Snackbar com opção "Desfazer" (10s)
      toast.success(message, {
        duration: 10000,
        action: {
          label: "Desfazer",
          onClick: async () => {
            // Re-aplicar soft delete
            await supabase
              .from("obrigacoes")
              .update({ deleted_at: new Date().toISOString() })
              .eq("id", obrigacao.id);
            
            await supabase
              .from("tarefas")
              .update({ deleted_at: new Date().toISOString() })
              .eq("obrigacao_id", obrigacao.id)
              .is("deleted_at", null);
            
            await supabase
              .from("lembretes")
              .update({ ativo: false, deleted_at: new Date().toISOString() })
              .eq("obrigacao_id", obrigacao.id)
              .is("deleted_at", null);
            
            toast.success("Recuperação desfeita.");
            loadDeletedObrigacoes();
          },
        },
      });
      
      loadDeletedObrigacoes();
    } else {
      toast.error(`Erro ao recuperar: ${result.error}`);
    }
  };

  const handleHardDelete = async () => {
    if (!selectedObrigacao || confirmationText !== selectedObrigacao.titulo) {
      toast.error("O nome não corresponde. Por favor, confirma o nome da obrigação.");
      return;
    }

    setLoading(true);
    const result = await hardDeleteObrigacao({ obrigacaoId: selectedObrigacao.id });
    setLoading(false);

    if (result.success) {
      toast.success(
        `Obrigação eliminada permanentemente. ${result.affectedTarefas} tarefas e ${result.affectedLembretes} lembretes também foram apagados.`
      );
      setHardDeleteDialogOpen(false);
      setSelectedObrigacao(null);
      setConfirmationText("");
      loadDeletedObrigacoes();
    } else {
      toast.error(`Erro ao apagar: ${result.error}`);
    }
  };

  return (
    <Layout>
      <div className="container mx-auto max-w-lg space-y-6 p-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold">Definições</h1>
          <p className="text-sm text-muted-foreground">
            Gerir a sua conta e preferências
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <User className="h-5 w-5" />
              Perfil
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="text-sm">
              <span className="text-muted-foreground">Email: </span>
              <span className="font-medium">{user?.email}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Trash2 className="h-5 w-5 text-destructive" />
              Manutenção e Limpeza
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <h3 className="text-sm font-medium">Limpeza Permanente</h3>
              <p className="text-xs text-muted-foreground">
                Apaga definitivamente obrigações arquivadas. Esta ação é irreversível.
              </p>
            </div>

            {deletedObrigacoes.length === 0 ? (
              <p className="text-sm text-muted-foreground italic">
                Não há obrigações arquivadas para apagar.
              </p>
            ) : (
              <div className="space-y-2">
                {deletedObrigacoes.map((obrigacao) => (
                  <div
                    key={obrigacao.id}
                    className="flex items-center justify-between rounded-lg border bg-muted/30 p-3"
                  >
                    <div className="flex-1">
                      <p className="text-sm font-medium">{obrigacao.titulo}</p>
                      <p className="text-xs text-muted-foreground">
                        Arquivada em{" "}
                        {new Date(obrigacao.deleted_at).toLocaleDateString("pt-PT")}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleRestore(obrigacao)}
                        disabled={restoringId === obrigacao.id}
                      >
                        {restoringId === obrigacao.id ? "A recuperar..." : "Recuperar"}
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => {
                          setSelectedObrigacao(obrigacao);
                          setHardDeleteDialogOpen(true);
                        }}
                      >
                        <Trash2 className="mr-1 h-3 w-3" />
                        Apagar Definitivamente
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Button
          variant="destructive"
          className="w-full"
          onClick={signOut}
        >
          <LogOut className="mr-2 h-4 w-4" />
          Terminar Sessão
        </Button>

        <AlertDialog open={hardDeleteDialogOpen} onOpenChange={setHardDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2 text-destructive">
                <AlertTriangle className="h-5 w-5" />
                Apagar Definitivamente
              </AlertDialogTitle>
              <AlertDialogDescription className="space-y-4">
                <p>
                  <strong>ATENÇÃO:</strong> Esta ação é <strong>irreversível</strong>.
                </p>
                <p>
                  Vais apagar permanentemente a obrigação{" "}
                  <strong className="text-foreground">
                    "{selectedObrigacao?.titulo}"
                  </strong>
                  , incluindo todas as tarefas e lembretes associados.
                </p>
                <div className="space-y-2 rounded-lg bg-destructive/10 p-3">
                  <Label htmlFor="confirm-name" className="text-sm font-medium">
                    Para confirmar, escreve o nome exato da obrigação:
                  </Label>
                  <Input
                    id="confirm-name"
                    value={confirmationText}
                    onChange={(e) => setConfirmationText(e.target.value)}
                    placeholder={selectedObrigacao?.titulo}
                    className="font-mono text-sm"
                  />
                </div>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel
                onClick={() => {
                  setConfirmationText("");
                  setSelectedObrigacao(null);
                }}
              >
                Cancelar
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={handleHardDelete}
                disabled={
                  loading || confirmationText !== selectedObrigacao?.titulo
                }
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {loading ? "A apagar..." : "Apagar Definitivamente"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </Layout>
  );
}
