import { useState, useEffect } from "react";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { AlertTriangle, Bell, PlayCircle, RefreshCw } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { formatDateTimePT } from "@/lib/dateUtils";

interface Lembrete {
  id: string;
  entidade_tipo: string;
  entidade_id: string;
  regra: string;
  canal: string;
  ativo: boolean;
  proximo_disparo_em: string | null;
  ultimo_disparo_em: string | null;
  deleted_at: string | null;
}

interface Alerta {
  id: string;
  titulo: string;
  mensagem: string;
  disparado_em: string;
  visto: boolean;
  canal: string;
  entidade_tipo: string;
  entidade_id: string;
}

export default function Dev() {
  const [nomeProjeto, setNomeProjeto] = useState(() => {
    const timestamp = new Date().toISOString().slice(11, 19).replace(/:/g, "");
    return `Projeto Debug ${timestamp}`;
  });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  
  // Lembretes state
  const [projetos, setProjetos] = useState<Array<{ id: string; nome: string }>>([]);
  const [obrigacoes, setObrigacoes] = useState<Array<{ id: string; titulo: string }>>([]);
  const [selectedProjeto, setSelectedProjeto] = useState<string>("");
  const [selectedObrigacao, setSelectedObrigacao] = useState<string>("");
  const [lembretes, setLembretes] = useState<Lembrete[]>([]);
  const [alertas, setAlertas] = useState<Alerta[]>([]);
  const [selectedLembretes, setSelectedLembretes] = useState<Set<string>>(new Set());
  const [loadingLembretes, setLoadingLembretes] = useState(false);

  useEffect(() => {
    loadProjetos();
    loadLembretes();
    loadAlertas();
  }, []);

  useEffect(() => {
    if (selectedProjeto) {
      loadObrigacoes(selectedProjeto);
    }
  }, [selectedProjeto]);

  const loadProjetos = async () => {
    const { data } = await supabase
      .from("projetos")
      .select("id, nome")
      .eq("ativo", true)
      .order("nome");
    if (data) setProjetos(data);
  };

  const loadObrigacoes = async (projetoId: string) => {
    const { data } = await supabase
      .from("obrigacoes")
      .select("id, titulo")
      .eq("projeto_id", projetoId)
      .is("deleted_at", null)
      .order("titulo");
    if (data) setObrigacoes(data);
  };

  const loadLembretes = async () => {
    setLoadingLembretes(true);
    const { data } = await supabase
      .from("lembretes")
      .select("*")
      .is("deleted_at", null)
      .order("created_at", { ascending: false });
    if (data) setLembretes(data);
    setLoadingLembretes(false);
  };

  const loadAlertas = async () => {
    const { data } = await supabase
      .from("alertas")
      .select("*")
      .order("disparado_em", { ascending: false })
      .limit(50);
    if (data) setAlertas(data);
  };

  const handleRecalcularSelecionados = async () => {
    if (selectedLembretes.size === 0) {
      toast.error("Selecione pelo menos um lembrete");
      return;
    }
    
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('calculate-reminders');
      if (error) throw error;
      toast.success(`Recalculados: ${data.processados} lembretes`);
      await loadLembretes();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDispararSelecionados = async () => {
    if (selectedLembretes.size === 0) {
      toast.error("Selecione pelo menos um lembrete");
      return;
    }
    
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('dispatch-reminders');
      if (error) throw error;
      toast.success(`Disparados: ${data.disparados} lembretes`);
      await loadLembretes();
      await loadAlertas();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCriarDefaultsObrigacao = async () => {
    if (!selectedObrigacao) {
      toast.error("Selecione uma obrigação");
      return;
    }
    
    setLoading(true);
    try {
      const { data: session } = await supabase.auth.getSession();
      const { data, error } = await supabase.functions.invoke('backfill-reminders', {
        headers: {
          Authorization: `Bearer ${session.session?.access_token}`,
        },
      });
      if (error) throw error;
      toast.success(`Criados: ${data.criados} lembretes`);
      await loadLembretes();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRecalcularTodos = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('calculate-reminders');
      if (error) throw error;
      toast.success(`✅ Recalculados: ${data.processados} lembretes, ${data.erros} erros`);
      await loadLembretes();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDespacharTodos = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('dispatch-reminders');
      if (error) throw error;
      toast.success(`✅ Disparados: ${data.disparados} lembretes, ${data.erros} erros`);
      await loadLembretes();
      await loadAlertas();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleMarcarVisto = async (alertaId: string) => {
    const { error } = await supabase
      .from("alertas")
      .update({ visto: true })
      .eq("id", alertaId);
    
    if (!error) {
      toast.success("Marcado como visto");
      await loadAlertas();
    }
  };

  const handleDebugInsert = async () => {
    setLoading(true);
    try {
      console.log("[DEBUG] Tentando inserir projeto com payload:", { nome: nomeProjeto });

      const { data, error } = await supabase
        .from("projetos")
        .insert({
          nome: nomeProjeto,
          // Não enviar ano_fiscal, pais, ativo - deixar DB aplicar defaults
        })
        .select()
        .single();

      if (error) {
        console.error("[DEBUG] Erro ao criar projeto:", error);
        toast.error(`Erro: ${error.message}`);
        return;
      }

      console.log("[DEBUG] Projeto criado com sucesso:", data);
      toast.success("Projeto criado com sucesso (debug)");
      navigate(`/projetos`);
    } catch (error: any) {
      console.error("[DEBUG] Exceção ao criar projeto:", error);
      toast.error(error.message || "Erro desconhecido");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="container mx-auto max-w-7xl space-y-6 p-4">
        <div className="flex items-center gap-3">
          <AlertTriangle className="h-6 w-6 text-warning" />
          <div>
            <h1 className="text-2xl font-bold">Ferramentas de Debug</h1>
            <p className="text-sm text-muted-foreground">
              Apenas para desenvolvimento e testes
            </p>
          </div>
        </div>

        {/* Debug Lembretes */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Debug Lembretes
            </CardTitle>
            <CardDescription>
              Diagnóstico e gestão de lembretes automáticos
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Filtros */}
            <div className="flex gap-3">
              <div className="flex-1">
                <Select value={selectedProjeto} onValueChange={setSelectedProjeto}>
                  <SelectTrigger>
                    <SelectValue placeholder="Filtrar por Projeto" />
                  </SelectTrigger>
                  <SelectContent>
                    {projetos.map(p => (
                      <SelectItem key={p.id} value={p.id}>{p.nome}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex-1">
                <Select 
                  value={selectedObrigacao} 
                  onValueChange={setSelectedObrigacao}
                  disabled={!selectedProjeto}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Filtrar por Obrigação" />
                  </SelectTrigger>
                  <SelectContent>
                    {obrigacoes.map(o => (
                      <SelectItem key={o.id} value={o.id}>{o.titulo}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Ações globais */}
            <div className="flex gap-2 flex-wrap">
              <Button 
                onClick={handleRecalcularTodos} 
                disabled={loading}
                variant="outline"
                size="sm"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Recalcular TODOS
              </Button>
              <Button 
                onClick={handleDespacharTodos} 
                disabled={loading}
                variant="outline"
                size="sm"
              >
                <PlayCircle className="h-4 w-4 mr-2" />
                Despachar TODOS
              </Button>
              <Button 
                onClick={handleCriarDefaultsObrigacao} 
                disabled={loading || !selectedObrigacao}
                variant="outline"
                size="sm"
              >
                Criar defaults (obrigação)
              </Button>
            </div>

            {/* Tabela de lembretes */}
            <div className="border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">Sel.</TableHead>
                    <TableHead>Regra</TableHead>
                    <TableHead>Canal</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Próximo Disparo</TableHead>
                    <TableHead>Último Disparo</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loadingLembretes ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center">
                        A carregar...
                      </TableCell>
                    </TableRow>
                  ) : lembretes.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-muted-foreground">
                        Nenhum lembrete encontrado
                      </TableCell>
                    </TableRow>
                  ) : (
                    lembretes
                      .filter(l => !selectedObrigacao || l.entidade_id === selectedObrigacao)
                      .map(l => (
                        <TableRow key={l.id}>
                          <TableCell>
                            <input 
                              type="checkbox" 
                              checked={selectedLembretes.has(l.id)}
                              onChange={(e) => {
                                const newSet = new Set(selectedLembretes);
                                if (e.target.checked) {
                                  newSet.add(l.id);
                                } else {
                                  newSet.delete(l.id);
                                }
                                setSelectedLembretes(newSet);
                              }}
                            />
                          </TableCell>
                          <TableCell className="font-mono text-xs">{l.regra}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{l.canal}</Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant={l.ativo ? "default" : "secondary"}>
                              {l.ativo ? "Ativo" : "Inativo"}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-xs">
                            {l.proximo_disparo_em ? formatDateTimePT(l.proximo_disparo_em) : "-"}
                          </TableCell>
                          <TableCell className="text-xs">
                            {l.ultimo_disparo_em ? formatDateTimePT(l.ultimo_disparo_em) : "-"}
                          </TableCell>
                        </TableRow>
                      ))
                  )}
                </TableBody>
              </Table>
            </div>

            {/* Alertas recentes */}
            <div className="space-y-2">
              <h3 className="font-medium">Alertas Recentes (últimos 50)</h3>
              <div className="space-y-2 max-h-[300px] overflow-y-auto">
                {alertas.map(a => (
                  <div 
                    key={a.id} 
                    className={`p-3 rounded-lg border ${a.visto ? 'bg-muted/50' : 'bg-background'}`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <Badge variant={a.visto ? "secondary" : "default"} className="text-xs">
                            {a.canal}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {formatDateTimePT(a.disparado_em)}
                          </span>
                        </div>
                        <p className="font-medium mt-1">{a.titulo}</p>
                        <p className="text-sm text-muted-foreground mt-1">{a.mensagem}</p>
                      </div>
                      {!a.visto && (
                        <Button 
                          size="sm" 
                          variant="ghost"
                          onClick={() => handleMarcarVisto(a.id)}
                        >
                          Marcar visto
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Criar Projeto (original) */}
        <Card>
          <CardHeader>
            <CardTitle>Criar Projeto Básico</CardTitle>
            <CardDescription>
              Insere um projeto com apenas o nome, deixando o DB aplicar os defaults
              (ano_fiscal = ano atual, pais = PT, ativo = true)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Nome do Projeto</label>
              <Input
                value={nomeProjeto}
                onChange={(e) => setNomeProjeto(e.target.value)}
                placeholder="Nome do projeto para teste"
              />
            </div>

            <Button 
              onClick={handleDebugInsert} 
              disabled={loading || !nomeProjeto}
              className="w-full"
            >
              {loading ? "A criar..." : "Inserir Projeto (Debug)"}
            </Button>

            <div className="rounded-lg bg-muted p-3 text-xs">
              <p className="font-medium mb-1">Payload que será enviado:</p>
              <pre className="text-muted-foreground">
                {JSON.stringify({ nome: nomeProjeto }, null, 2)}
              </pre>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
