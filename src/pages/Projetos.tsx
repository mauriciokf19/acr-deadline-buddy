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
import { Plus, Search, Filter, X } from "lucide-react";
import { ProjetoCard } from "@/components/ProjetoCard";
import { ProjetoForm } from "@/components/ProjetoForm";
import { useProjetosFilters } from "@/hooks/useProjetosFilters";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { createLog } from "@/lib/logUtils";

export default function Projetos() {
  const [projetos, setProjetos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingProjeto, setEditingProjeto] = useState<any>(null);
  const [showFilters, setShowFilters] = useState(false);
  const { filters, updateFilter, clearFilters } = useProjetosFilters();

  useEffect(() => {
    loadProjetos();
  }, [filters]);

  const loadProjetos = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from("projetos")
        .select(`
          *,
          cliente:clientes(nome),
          obrigacoes_count:obrigacoes(count)
        `)
        .order("ativo", { ascending: false })
        .order("nome");

      if (filters.search) {
        query = query.ilike("nome", `%${filters.search}%`);
      }
      if (filters.cliente) {
        query = (query as any).eq("cliente_id", filters.cliente);
      }
      if (filters.pais) {
        query = (query as any).eq("pais", filters.pais);
      }
      if (filters.ano_fiscal) {
        query = (query as any).eq("ano_fiscal", filters.ano_fiscal);
      }
      if (filters.status === "ativo") {
        query = query.eq("ativo", true);
      } else if (filters.status === "arquivado") {
        query = query.eq("ativo", false);
      }

      const { data, error } = await query;
      if (error) throw error;

      setProjetos(data || []);
    } catch (error: any) {
      console.error("Erro ao carregar projetos:", error);
      toast.error("Erro ao carregar projetos");
    } finally {
      setLoading(false);
    }
  };

  const handleArchive = async (projeto: any) => {
    try {
      const newStatus = !projeto.ativo;
      const { error } = await supabase
        .from("projetos")
        .update({ ativo: newStatus })
        .eq("id", projeto.id);

      if (error) throw error;

      await createLog({
        entidade_tipo: "projeto",
        entidade_id: projeto.id,
        acao: "arquivar",
        detalhes: `Projeto ${newStatus ? "ativado" : "arquivado"}`,
      });

      toast.success(`Projeto ${newStatus ? "ativado" : "arquivado"} com sucesso`);
      loadProjetos();
    } catch (error: any) {
      console.error("Erro ao arquivar projeto:", error);
      toast.error("Erro ao arquivar projeto");
    }
  };

  const handleDuplicate = async (projeto: any) => {
    try {
      const { error } = await supabase.from("projetos").insert({
        nome: `${projeto.nome} (Cópia)`,
        cliente_id: projeto.cliente_id,
        pais: projeto.pais,
        ano_fiscal: projeto.ano_fiscal,
        descricao: projeto.descricao,
        cor: projeto.cor,
      });

      if (error) throw error;

      await createLog({
        entidade_tipo: "projeto",
        entidade_id: projeto.id,
        acao: "duplicar",
        detalhes: `Projeto duplicado`,
      });

      toast.success("Projeto duplicado com sucesso");
      loadProjetos();
    } catch (error: any) {
      console.error("Erro ao duplicar projeto:", error);
      toast.error("Erro ao duplicar projeto");
    }
  };

  const hasActiveFilters = filters.search || filters.cliente || filters.pais || 
                          filters.ano_fiscal || (filters.status && filters.status !== "ativo");

  return (
    <Layout>
      <div className="container mx-auto max-w-lg space-y-4 p-4">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h1 className="text-2xl font-bold">Projetos</h1>
            <p className="text-sm text-muted-foreground">
              Gerir os seus projetos ACR
            </p>
          </div>
          <Button 
            size="icon" 
            className="rounded-full"
            onClick={() => {
              setEditingProjeto(null);
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
                placeholder="Pesquisar projetos..."
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
                value={filters.status}
                onValueChange={(value) => updateFilter("status", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ativo">Ativos</SelectItem>
                  <SelectItem value="arquivado">Arquivados</SelectItem>
                  <SelectItem value="">Todos</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        {loading ? (
          <div className="text-center text-sm text-muted-foreground py-8">
            A carregar projetos...
          </div>
        ) : projetos.length === 0 ? (
          <div className="text-center text-sm text-muted-foreground py-8">
            Nenhum projeto encontrado
          </div>
        ) : (
          <div className="space-y-3">
            {projetos.map((projeto) => (
              <ProjetoCard
                key={projeto.id}
                projeto={projeto}
                onEdit={() => {
                  setEditingProjeto(projeto);
                  setShowForm(true);
                }}
                onArchive={() => handleArchive(projeto)}
                onDuplicate={() => handleDuplicate(projeto)}
              />
            ))}
          </div>
        )}
      </div>

      <ProjetoForm
        open={showForm}
        onOpenChange={setShowForm}
        projeto={editingProjeto}
        onSuccess={loadProjetos}
      />
    </Layout>
  );
}
