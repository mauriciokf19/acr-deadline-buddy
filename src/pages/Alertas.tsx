import { Layout } from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Bell, Check, Filter, Mail, X } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { formatDateTimePT } from "@/lib/dateUtils";
import { toast } from "@/hooks/use-toast";

interface Alerta {
  id: string;
  entidade_tipo: string;
  entidade_id: string;
  canal: string;
  titulo: string;
  mensagem: string;
  disparado_em: string;
  visto: boolean;
}

export default function Alertas() {
  const [alertas, setAlertas] = useState<Alerta[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtroVisto, setFiltroVisto] = useState<string>("todos");
  const navigate = useNavigate();

  useEffect(() => {
    loadAlertas();
  }, [filtroVisto]);

  async function loadAlertas() {
    try {
      setLoading(true);
      let query = supabase
        .from("alertas")
        .select("*")
        .order("disparado_em", { ascending: false });

      if (filtroVisto === "visto") {
        query = query.eq("visto", true);
      } else if (filtroVisto === "nao_visto") {
        query = query.eq("visto", false);
      }

      const { data, error } = await query;
      if (error) throw error;
      setAlertas(data || []);
    } catch (error) {
      console.error("Erro ao carregar alertas:", error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os alertas.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }

  async function marcarComoVisto(id: string, visto: boolean) {
    try {
      const { error } = await supabase
        .from("alertas")
        .update({ visto })
        .eq("id", id);

      if (error) throw error;

      setAlertas((prev) =>
        prev.map((a) => (a.id === id ? { ...a, visto } : a))
      );

      toast({
        title: visto ? "Marcado como visto" : "Marcado como não visto",
      });
    } catch (error) {
      console.error("Erro ao atualizar alerta:", error);
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o alerta.",
        variant: "destructive",
      });
    }
  }

  async function eliminarAlerta(id: string) {
    try {
      const { error } = await supabase
        .from("alertas")
        .delete()
        .eq("id", id);

      if (error) throw error;

      setAlertas((prev) => prev.filter((a) => a.id !== id));

      toast({
        title: "Alerta eliminado",
      });
    } catch (error) {
      console.error("Erro ao eliminar alerta:", error);
      toast({
        title: "Erro",
        description: "Não foi possível eliminar o alerta.",
        variant: "destructive",
      });
    }
  }

  async function limparTodos() {
    if (!confirm("Eliminar todos os alertas?")) return;

    try {
      const { error } = await supabase
        .from("alertas")
        .delete()
        .not("id", "is", null);

      if (error) throw error;

      setAlertas([]);

      toast({
        title: "Todos os alertas eliminados",
      });
    } catch (error) {
      console.error("Erro ao eliminar alertas:", error);
      toast({
        title: "Erro",
        description: "Não foi possível eliminar os alertas.",
        variant: "destructive",
      });
    }
  }

  function handleAlertaClick(alerta: Alerta) {
    if (!alerta.visto) {
      marcarComoVisto(alerta.id, true);
    }
    
    if (alerta.entidade_tipo === "obrigacao") {
      navigate(`/obrigacoes?id=${alerta.entidade_id}`);
    } else if (alerta.entidade_tipo === "tarefa") {
      navigate(`/tarefas?id=${alerta.entidade_id}`);
    }
  }

  const naoVistos = alertas.filter((a) => !a.visto).length;

  return (
    <Layout>
      <div className="container mx-auto max-w-4xl space-y-6 p-4">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h1 className="text-2xl font-bold">Alertas</h1>
            <p className="text-sm text-muted-foreground">
              Gerir os seus lembretes e notificações
              {naoVistos > 0 && (
                <Badge variant="destructive" className="ml-2">
                  {naoVistos} não {naoVistos === 1 ? "visto" : "vistos"}
                </Badge>
              )}
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {alertas.length > 0 && (
              <Button
                variant="destructive"
                size="sm"
                onClick={limparTodos}
                className="btn-compact"
              >
                Limpar todos
              </Button>
            )}
            <Filter className="h-4 w-4 text-muted-foreground" />
            <Select value={filtroVisto} onValueChange={setFiltroVisto}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos</SelectItem>
                <SelectItem value="nao_visto">Não vistos</SelectItem>
                <SelectItem value="visto">Vistos</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {loading ? (
          <Card>
            <CardContent className="flex items-center justify-center py-12">
              <p className="text-muted-foreground">A carregar...</p>
            </CardContent>
          </Card>
        ) : alertas.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <Bell className="mb-4 h-16 w-16 text-muted-foreground" />
              <h3 className="mb-2 font-semibold">Sem alertas</h3>
              <p className="text-sm text-muted-foreground">
                {filtroVisto === "nao_visto"
                  ? "Não tem alertas não vistos"
                  : "Os seus lembretes aparecerão aqui"}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {alertas.map((alerta) => (
              <Card
                key={alerta.id}
                className={`cursor-pointer transition-all hover:shadow-md ${
                  !alerta.visto ? "border-primary/50 bg-primary/5" : ""
                }`}
                onClick={() => handleAlertaClick(alerta)}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-2">
                        <CardTitle className="text-base">
                          {alerta.titulo}
                        </CardTitle>
                        {!alerta.visto && (
                          <Badge variant="default" className="text-xs">
                            Novo
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        {alerta.canal === "email" && (
                          <Mail className="h-3 w-3" />
                        )}
                        <span>{formatDateTimePT(alerta.disparado_em)}</span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          marcarComoVisto(alerta.id, !alerta.visto);
                        }}
                        aria-label={alerta.visto ? "Marcar como não visto" : "Marcar como visto"}
                      >
                        <Check
                          className={`h-4 w-4 ${
                            alerta.visto ? "text-primary" : "text-muted-foreground"
                          }`}
                        />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          eliminarAlerta(alerta.id);
                        }}
                        aria-label="Eliminar alerta"
                        className="text-destructive hover:text-destructive"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <p className="whitespace-pre-line text-sm text-muted-foreground">
                    {alerta.mensagem}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
