import { useEffect, useState } from "react";
import { Layout } from "@/components/Layout";
import { ObrigacaoCard } from "@/components/ObrigacaoCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/lib/supabase";
import { AlertCircle, CheckCircle, Clock, FileText } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

export default function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    total: 0,
    pendentes: 0,
    proximas: 0,
    atrasadas: 0,
  });
  const [obrigacoes, setObrigacoes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [user]);

  const loadData = async () => {
    try {
      // Load obrigacoes com projetos (excluir apagadas)
      const { data: obrigacoesData, error: obrigacoesError } = await supabase
        .from("obrigacoes")
        .select(`
          *,
          projeto:projetos(nome, cor)
        `)
        .is("deleted_at", null)
        .order("deadline_oficial", { ascending: true })
        .limit(5);

      if (obrigacoesError) throw obrigacoesError;

      setObrigacoes(obrigacoesData || []);

      // Calculate stats (excluir apagadas)
      const { data: allObrigacoes } = await supabase
        .from("obrigacoes")
        .select("estado, deadline_oficial")
        .is("deleted_at", null);

      if (allObrigacoes) {
        const now = new Date();
        const proxima7dias = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

        setStats({
          total: allObrigacoes.length,
          pendentes: allObrigacoes.filter(o => o.estado === "pendente").length,
          proximas: allObrigacoes.filter(o => 
            new Date(o.deadline_oficial) <= proxima7dias && 
            new Date(o.deadline_oficial) >= now &&
            o.estado !== "concluido"
          ).length,
          atrasadas: allObrigacoes.filter(o => 
            new Date(o.deadline_oficial) < now && 
            o.estado !== "concluido"
          ).length,
        });
      }
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto max-w-lg space-y-6 p-4">
        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-sm text-muted-foreground">
            Visão geral das suas obrigações fiscais
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 gap-3">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <FileText className="h-4 w-4" />
                Total
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <Clock className="h-4 w-4" />
                Pendentes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.pendentes}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm font-medium text-warning">
                <AlertCircle className="h-4 w-4" />
                Próximas 7d
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-warning">{stats.proximas}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm font-medium text-destructive">
                <AlertCircle className="h-4 w-4" />
                Atrasadas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-destructive">{stats.atrasadas}</div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Obrigacoes */}
        <div className="space-y-3">
          <h2 className="text-lg font-semibold">Próximas Obrigações</h2>
          {obrigacoes.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-8 text-center">
                <CheckCircle className="mb-2 h-12 w-12 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  Nenhuma obrigação registada
                </p>
              </CardContent>
            </Card>
          ) : (
            obrigacoes.map((obrigacao) => (
              <ObrigacaoCard
                key={obrigacao.id}
                obrigacao={obrigacao}
                onQuickAction={() => {}}
              />
            ))
          )}
        </div>
      </div>
    </Layout>
  );
}
