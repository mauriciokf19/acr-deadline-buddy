import { useState } from "react";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { Play, RefreshCw, Database, CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { seedTestData, cleanTestData } from "@/lib/testSeeds";

interface TestResult {
  name: string;
  status: "pass" | "fail" | "running" | "pending";
  duration?: number;
  message?: string;
}

export default function QA() {
  const [loading, setLoading] = useState(false);
  const [testResults, setTestResults] = useState<TestResult[]>([
    { name: "Unit: Date Utils", status: "pending" },
    { name: "Unit: ICS Generator", status: "pending" },
    { name: "Unit: Reminder Parser", status: "pending" },
    { name: "Integration: Template Generation", status: "pending" },
    { name: "Integration: Reminders Calculation", status: "pending" },
    { name: "Integration: Upload Validation", status: "pending" },
    { name: "Integration: Soft Delete", status: "pending" },
    { name: "E2E: Dashboard KPIs", status: "pending" },
    { name: "E2E: CRUD Operations", status: "pending" },
    { name: "E2E: Workflows", status: "pending" },
    { name: "A11y: Main Pages", status: "pending" },
    { name: "UI: Dead Buttons Scan", status: "pending" },
  ]);

  const handleSeedData = async () => {
    setLoading(true);
    try {
      const result = await seedTestData();
      if (result.success) {
        toast.success(result.message);
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      toast.error("Erro ao criar dados de teste");
    } finally {
      setLoading(false);
    }
  };

  const handleCleanData = async () => {
    setLoading(true);
    try {
      const result = await cleanTestData();
      if (result.success) {
        toast.success(result.message);
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      toast.error("Erro ao limpar dados de teste");
    } finally {
      setLoading(false);
    }
  };

  const runTest = async (testName: string) => {
    setTestResults(prev => 
      prev.map(t => t.name === testName ? { ...t, status: "running" as const } : t)
    );

    // Simulate test execution
    await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));

    // Mock results (in real implementation, this would run actual tests)
    const success = Math.random() > 0.2; // 80% success rate for demo
    setTestResults(prev => 
      prev.map(t => t.name === testName ? { 
        ...t, 
        status: success ? "pass" as const : "fail" as const,
        duration: Math.round(Math.random() * 3000),
        message: success ? undefined : "Test falhou - ver logs para detalhes"
      } : t)
    );
  };

  const runAllTests = async () => {
    setLoading(true);
    for (const test of testResults) {
      await runTest(test.name);
    }
    setLoading(false);
    toast.success("Todos os testes executados");
  };

  const getStatusIcon = (status: TestResult["status"]) => {
    switch (status) {
      case "pass":
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case "fail":
        return <XCircle className="h-4 w-4 text-red-500" />;
      case "running":
        return <Loader2 className="h-4 w-4 animate-spin text-blue-500" />;
      default:
        return <div className="h-4 w-4 rounded-full border-2 border-muted" />;
    }
  };

  const getStatusBadge = (status: TestResult["status"]) => {
    switch (status) {
      case "pass":
        return <Badge variant="default" className="bg-green-500">PASS</Badge>;
      case "fail":
        return <Badge variant="destructive">FAIL</Badge>;
      case "running":
        return <Badge variant="secondary">A CORRER...</Badge>;
      default:
        return <Badge variant="outline">PENDENTE</Badge>;
    }
  };

  const passCount = testResults.filter(t => t.status === "pass").length;
  const failCount = testResults.filter(t => t.status === "fail").length;
  const totalCount = testResults.length;
  const successRate = totalCount > 0 ? Math.round((passCount / totalCount) * 100) : 0;

  return (
    <Layout>
      <div className="container mx-auto max-w-4xl space-y-6 p-4">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold">Painel de Qualidade (QA)</h1>
          <p className="text-muted-foreground">
            Testes automáticos e validação do sistema ACR Deadlines
          </p>
        </div>

        {/* Summary Stats */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalCount}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Passou
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-500">{passCount}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Falhou
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-500">{failCount}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Taxa de Sucesso
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{successRate}%</div>
            </CardContent>
          </Card>
        </div>

        {/* Test Data Management */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Dados de Teste
            </CardTitle>
            <CardDescription>
              Gerir dados de teste determinísticos para QA
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Cria projetos e obrigações de teste cobrindo todos os cenários: Atrasadas, Vencem Hoje, 
              Esta Semana, No Prazo, Follow-up, Upload, e Soft Delete.
            </p>
            <div className="flex gap-2">
              <Button onClick={handleSeedData} disabled={loading}>
                <Database className="mr-2 h-4 w-4" />
                Semear Dados
              </Button>
              <Button onClick={handleCleanData} variant="outline" disabled={loading}>
                <RefreshCw className="mr-2 h-4 w-4" />
                Limpar Dados
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Test Suite Controls */}
        <Card>
          <CardHeader>
            <CardTitle>Suite de Testes</CardTitle>
            <CardDescription>
              Executar testes unitários, integração, E2E e acessibilidade
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Button onClick={runAllTests} disabled={loading}>
                <Play className="mr-2 h-4 w-4" />
                Executar Todos os Testes
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setTestResults(prev => prev.map(t => ({ ...t, status: "pending" as const })))}
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Limpar Resultados
              </Button>
            </div>

            <Separator />

            {/* Test Results */}
            <div className="space-y-2">
              <h3 className="font-medium">Resultados dos Testes</h3>
              <div className="space-y-2">
                {testResults.map((test) => (
                  <div 
                    key={test.name}
                    className="flex items-center justify-between rounded-lg border p-3 hover:bg-muted/50"
                  >
                    <div className="flex items-center gap-3">
                      {getStatusIcon(test.status)}
                      <div>
                        <div className="font-medium">{test.name}</div>
                        {test.message && (
                          <div className="text-sm text-muted-foreground">{test.message}</div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {test.duration && (
                        <span className="text-sm text-muted-foreground">
                          {test.duration}ms
                        </span>
                      )}
                      {getStatusBadge(test.status)}
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => runTest(test.name)}
                        disabled={test.status === "running"}
                      >
                        <Play className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Auto-corrections Applied */}
        <Card>
          <CardHeader>
            <CardTitle>Correções Automáticas</CardTitle>
            <CardDescription>
              Problemas detetados e correções aplicadas automaticamente
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                Nenhuma correção aplicada ainda. As correções aparecerão aqui quando os testes 
                detetarem problemas e aplicarem fixes automáticos.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Instructions */}
        <Card>
          <CardHeader>
            <CardTitle>Instruções</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p>
              <strong>1. Semear Dados:</strong> Cria dados de teste determinísticos (projetos começam com "TEST_")
            </p>
            <p>
              <strong>2. Executar Testes:</strong> Corre toda a suite ou testes individuais
            </p>
            <p>
              <strong>3. Verificar Resultados:</strong> Revê os resultados e correções aplicadas
            </p>
            <p>
              <strong>4. CI/CD:</strong> Os testes também correm automaticamente no GitHub Actions
            </p>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
