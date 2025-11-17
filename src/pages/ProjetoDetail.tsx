import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Edit, Archive, Copy, FolderKanban } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { ProjetoForm } from "@/components/ProjetoForm";
import { TarefasProjetoTab } from "@/components/TarefasProjetoTab";
import { createLog } from "@/lib/logUtils";

export default function ProjetoDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [projeto, setProjeto] = useState<any>(null);
  const [obrigacoes, setObrigacoes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [permissionError, setPermissionError] = useState(false);

  useEffect(() => {
    if (id) {
      loadProjeto();
      loadObrigacoes();
    }
  }, [id]);

  const loadProjeto = async () => {
    if (!id) return;
    
    setLoading(true);
    setPermissionError(false);
    
    try {
      const { data, error } = await supabase
        .from("projetos")
        .select(`
          *,
          cliente:clientes(nome)
        `)
        .eq("id", id)
        .single();

      if (error) {
        if (error.code === "PGRST116") {
          // No rows returned
          toast.error("Projeto não encontrado");
          navigate("/projetos");
          return;
        }
        if (error.message.includes("permission") || error.message.includes("RLS")) {
          setPermissionError(true);
          toast.error("Sem permissão para aceder a este projeto");
          return;
        }
        throw error;
      }

      setProjeto(data);
    } catch (error: any) {
      console.error("Erro ao carregar projeto:", error);
      toast.error("Erro ao carregar projeto");
    } finally {
      setLoading(false);
    }
  };

  const loadObrigacoes = async () => {
    if (!id) return;

    try {
      const { data, error } = await supabase
        .from("obrigacoes")
        .select("id, titulo, tipo, estado, deadline_oficial")
        .eq("projeto_id", id)
        .is("deleted_at", null)
        .order("deadline_oficial");

      if (error) throw error;
      setObrigacoes(data || []);
    } catch (error: any) {
      console.error("Erro ao carregar obrigações:", error);
    }
  };

  const handleArchive = async () => {
    if (!projeto) return;

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
      loadProjeto();
    } catch (error: any) {
      console.error("Erro ao arquivar projeto:", error);
      toast.error("Erro ao arquivar projeto");
    }
  };

  const handleDuplicate = async () => {
    if (!projeto) return;

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
        detalhes: "Projeto duplicado",
      });

      toast.success("Projeto duplicado com sucesso");
      navigate("/projetos");
    } catch (error: any) {
      console.error("Erro ao duplicar projeto:", error);
      toast.error("Erro ao duplicar projeto");
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">Carregando...</div>
        </div>
      </Layout>
    );
  }

  if (permissionError) {
    return (
      <Layout>
        <div className="container mx-auto p-6">
          <Card className="max-w-md mx-auto">
            <CardHeader>
              <CardTitle className="text-destructive">Sem Permissão</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p>Não tens permissão para aceder a este projeto.</p>
              <Button onClick={() => navigate("/projetos")}>
                Voltar à Lista
              </Button>
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }

  if (!projeto) {
    return null;
  }

  return (
    <Layout>
      <div className="container mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/projetos")}
              className="mb-2"
              aria-label="Voltar à lista de projetos"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar
            </Button>
            <div className="flex items-center gap-3">
              <div
                className="h-6 w-6 rounded-full"
                style={{ backgroundColor: projeto.cor }}
              />
              <h1 className="text-2xl font-bold">{projeto.nome}</h1>
            </div>
            <p className="text-muted-foreground">
              {projeto.cliente?.nome || "Sem cliente"} • {projeto.pais} • {projeto.ano_fiscal}
            </p>
          </div>
          
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setShowForm(true)} aria-label="Editar projeto">
              <Edit className="h-4 w-4 mr-2" />
              Editar
            </Button>
            <Button variant="outline" size="sm" onClick={handleDuplicate} aria-label="Duplicar projeto">
              <Copy className="h-4 w-4 mr-2" />
              Duplicar
            </Button>
            <Button
              variant={projeto.ativo ? "destructive" : "default"}
              size="sm"
              onClick={handleArchive}
              aria-label={projeto.ativo ? "Arquivar projeto" : "Restaurar projeto"}
            >
              <Archive className="h-4 w-4 mr-2" />
              {projeto.ativo ? "Arquivar" : "Restaurar"}
            </Button>
          </div>
        </div>

        {/* Status Badge */}
        {!projeto.ativo && (
          <Card className="bg-muted/50 border-dashed">
            <CardContent className="py-3">
              <div className="flex items-center gap-2">
                <Archive className="h-4 w-4" />
                <span className="font-medium">Este projeto está arquivado</span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Tabs */}
        <Tabs defaultValue="info" className="space-y-4">
          <TabsList>
            <TabsTrigger value="info">Informações</TabsTrigger>
            <TabsTrigger value="obrigacoes">
              Obrigações ({obrigacoes.length})
            </TabsTrigger>
            <TabsTrigger value="tarefas">Tarefas</TabsTrigger>
          </TabsList>

          <TabsContent value="info" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Detalhes do Projeto</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Cliente</label>
                    <p className="mt-1">{projeto.cliente?.nome || "Sem cliente"}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">País</label>
                    <p className="mt-1">{projeto.pais}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Ano Fiscal</label>
                    <p className="mt-1">{projeto.ano_fiscal}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Estado</label>
                    <div className="mt-1">
                      <Badge variant={projeto.ativo ? "default" : "secondary"}>
                        {projeto.ativo ? "Ativo" : "Arquivado"}
                      </Badge>
                    </div>
                  </div>
                </div>

                {projeto.descricao && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Descrição</label>
                    <p className="mt-1 text-sm">{projeto.descricao}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="obrigacoes" className="space-y-4">
            {obrigacoes.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center text-muted-foreground">
                  <FolderKanban className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Sem obrigações neste projeto</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-2">
                {obrigacoes.map((obr) => (
                  <Card
                    key={obr.id}
                    className="cursor-pointer hover:border-primary transition-colors"
                    onClick={() => navigate(`/obrigacoes?id=${obr.id}`)}
                  >
                    <CardContent className="py-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">{obr.titulo}</p>
                          <p className="text-sm text-muted-foreground">
                            {obr.tipo.toUpperCase()} • {new Date(obr.deadline_oficial).toLocaleDateString('pt-PT')}
                          </p>
                        </div>
                        <Badge>{obr.estado.replace("_", " ")}</Badge>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="tarefas" className="space-y-4">
            <TarefasProjetoTab projetoId={id!} />
          </TabsContent>
        </Tabs>

        {/* Edit Form Dialog */}
        <ProjetoForm
          open={showForm}
          onOpenChange={setShowForm}
          projeto={projeto}
          onSuccess={() => {
            setShowForm(false);
            loadProjeto();
          }}
        />
      </div>
    </Layout>
  );
}
