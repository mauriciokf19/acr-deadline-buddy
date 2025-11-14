import { useState, useEffect } from "react";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Plus, Search, Filter, X, Bell, Mail, Smartphone } from "lucide-react";
import { LembreteForm } from "@/components/LembreteForm";
import { useLembretesFilters } from "@/hooks/useLembretesFilters";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { createLog } from "@/lib/logUtils";
import { formatDatePT } from "@/lib/dateUtils";

export default function Lembretes() {
  const [lembretes, setLembretes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingLembrete, setEditingLembrete] = useState<any>(null);
  const [showFilters, setShowFilters] = useState(false);
  const { filters, updateFilter, clearFilters } = useLembretesFilters();

  useEffect(() => {
    loadLembretes();
  }, [filters]);

  const loadLembretes = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from("lembretes")
        .select(`
          *,
          obrigacao:obrigacoes(titulo),
          tarefa:tarefas(titulo)
        `)
        .order("created_at", { ascending: false });

      if (filters.search) {
        query = (query as any).or(`regra.ilike.%${filters.search}%,mensagem.ilike.%${filters.search}%`);
      }
      if (filters.entidade_tipo) {
        query = (query as any).eq("entidade_tipo", filters.entidade_tipo);
      }
      if (filters.canal) {
        query = (query as any).eq("canal", filters.canal);
      }
      if (filters.ativo) {
        query = (query as any).eq("ativo", filters.ativo === "true");
      }

      const { data, error } = await query;
      if (error) throw error;

      setLembretes(data || []);
    } catch (error: any) {
      console.error("Erro ao carregar lembretes:", error);
      toast.error("Erro ao carregar lembretes");
    } finally {
      setLoading(false);
    }
  };

  const toggleAtivo = async (lembreteId: string, ativo: boolean) => {
    try {
      const { error } = await supabase
        .from("lembretes")
        .update({ ativo: !ativo } as any)
        .eq("id", lembreteId);

      if (error) throw error;

      await createLog({
        entidade_tipo: "lembrete",
        entidade_id: lembreteId,
        acao: "editar",
        detalhes: `Lembrete ${!ativo ? "ativado" : "desativado"}`,
      });

      toast.success(`Lembrete ${!ativo ? "ativado" : "desativado"}`);
      loadLembretes();
    } catch (error: any) {
      console.error("Erro ao atualizar lembrete:", error);
      toast.error("Erro ao atualizar lembrete");
    }
  };

  const hasActiveFilters = filters.search || filters.entidade_tipo || 
                          filters.canal || filters.ativo;

  const getEntidadeNome = (lembrete: any) => {
    if (lembrete.entidade_tipo === "obrigacao") {
      return lembrete.obrigacao?.titulo || "Obrigação";
    } else if (lembrete.entidade_tipo === "tarefa") {
      return lembrete.tarefa?.titulo || "Tarefa";
    }
    return "—";
  };

  return (
    <Layout>
      <div className="container mx-auto max-w-lg space-y-4 p-4">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h1 className="text-2xl font-bold">Lembretes</h1>
            <p className="text-sm text-muted-foreground">
              Gerir lembretes e notificações
            </p>
          </div>
          <Button 
            size="icon" 
            className="rounded-full"
            onClick={() => {
              setEditingLembrete(null);
              setShowForm(true);
            }}
          >
            <Plus className="h-5 w-5" />
          </Button>
        </div>

        <div className="space-y-3">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Pesquisar lembretes..."
                value={filters.search}
                onChange={(e) => updateFilter("search", e.target.value)}
                className="pl-9"
              />
            </div>
            <Button
              variant={showFilters ? "default" : "outline"}
              size="icon"
              onClick={() => setShowFilters(!showFilters)}
            >
              <Filter className="h-4 w-4" />
            </Button>
          </div>

          {showFilters && (
            <div className="space-y-2 rounded-lg border p-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium">Filtros</h3>
                {hasActiveFilters && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearFilters}
                    className="h-8 px-2"
                  >
                    <X className="mr-1 h-3 w-3" />
                    Limpar
                  </Button>
                )}
              </div>

              <Select
                value={filters.entidade_tipo}
                onValueChange={(value) => updateFilter("entidade_tipo", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Tipo de Entidade" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Todos</SelectItem>
                  <SelectItem value="obrigacao">Obrigação</SelectItem>
                  <SelectItem value="tarefa">Tarefa</SelectItem>
                </SelectContent>
              </Select>

              <Select
                value={filters.canal}
                onValueChange={(value) => updateFilter("canal", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Canal" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Todos</SelectItem>
                  <SelectItem value="email">Email</SelectItem>
                  <SelectItem value="push">Push</SelectItem>
                </SelectContent>
              </Select>

              <Select
                value={filters.ativo}
                onValueChange={(value) => updateFilter("ativo", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Todos</SelectItem>
                  <SelectItem value="true">Ativos</SelectItem>
                  <SelectItem value="false">Inativos</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        {loading ? (
          <div className="text-center text-sm text-muted-foreground py-8">
            A carregar lembretes...
          </div>
        ) : lembretes.length === 0 ? (
          <div className="text-center text-sm text-muted-foreground py-8">
            Nenhum lembrete encontrado
          </div>
        ) : (
          <div className="space-y-3">
            {lembretes.map((lembrete) => (
              <Card 
                key={lembrete.id}
                className="cursor-pointer hover:border-primary transition-colors"
                onClick={() => {
                  setEditingLembrete(lembrete);
                  setShowForm(true);
                }}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2">
                        <Bell className="h-4 w-4 text-muted-foreground" />
                        <Badge variant="outline" className="text-xs">
                          {lembrete.entidade_tipo === "obrigacao" ? "Obrigação" : "Tarefa"}
                        </Badge>
                        <Badge 
                          variant={lembrete.canal === "email" ? "default" : "secondary"}
                          className="text-xs"
                        >
                          {lembrete.canal === "email" ? (
                            <><Mail className="mr-1 h-3 w-3" />Email</>
                          ) : (
                            <><Smartphone className="mr-1 h-3 w-3" />Push</>
                          )}
                        </Badge>
                      </div>
                      <h3 className="font-semibold">{getEntidadeNome(lembrete)}</h3>
                      <p className="text-sm text-muted-foreground">{lembrete.regra}</p>
                      {lembrete.proximo_disparo_em && (
                        <p className="text-xs text-muted-foreground">
                          Próximo: {formatDatePT(lembrete.proximo_disparo_em)}
                        </p>
                      )}
                    </div>
                    <Switch
                      checked={lembrete.ativo}
                      onCheckedChange={() => toggleAtivo(lembrete.id, lembrete.ativo)}
                      onClick={(e) => e.stopPropagation()}
                    />
                  </div>
                </CardHeader>
              </Card>
            ))}
          </div>
        )}
      </div>

      <LembreteForm
        open={showForm}
        onOpenChange={setShowForm}
        lembrete={editingLembrete}
        onSuccess={loadLembretes}
      />
    </Layout>
  );
}
