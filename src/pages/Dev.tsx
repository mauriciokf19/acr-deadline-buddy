import { useState } from "react";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { AlertTriangle } from "lucide-react";

export default function Dev() {
  const [nomeProjeto, setNomeProjeto] = useState(() => {
    const timestamp = new Date().toISOString().slice(11, 19).replace(/:/g, "");
    return `Projeto Debug ${timestamp}`;
  });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

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
      <div className="container mx-auto max-w-2xl space-y-6 p-4">
        <div className="flex items-center gap-3">
          <AlertTriangle className="h-6 w-6 text-warning" />
          <div>
            <h1 className="text-2xl font-bold">Ferramentas de Debug</h1>
            <p className="text-sm text-muted-foreground">
              Apenas para desenvolvimento e testes
            </p>
          </div>
        </div>

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
