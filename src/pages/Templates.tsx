import { useState, useEffect } from "react";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TemplateForm } from "@/components/TemplateForm";
import { GenerateObrigacoesForm } from "@/components/GenerateObrigacoesForm";
import { Plus, FileText, Sparkles } from "lucide-react";
import { supabase } from "@/lib/supabase";

export default function Templates() {
  const [templates, setTemplates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [generateOpen, setGenerateOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<any>(null);

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("templates" as any)
      .select("*")
      .order("nome");
    setTemplates(data || []);
    setLoading(false);
  };

  return (
    <Layout>
      <div className="container mx-auto max-w-lg space-y-6 p-4">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h1 className="text-2xl font-bold">Templates</h1>
            <p className="text-sm text-muted-foreground">
              Gerir templates de obrigações fiscais
            </p>
          </div>
          <Button size="icon" className="rounded-full" onClick={() => { setSelectedTemplate(null); setFormOpen(true); }}>
            <Plus className="h-5 w-5" />
          </Button>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          </div>
        ) : templates.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <FileText className="mb-4 h-16 w-16 text-muted-foreground" />
              <h3 className="mb-2 font-semibold">Nenhum template criado</h3>
              <p className="mb-4 text-sm text-muted-foreground">
                Crie o seu primeiro template
              </p>
              <Button onClick={() => { setSelectedTemplate(null); setFormOpen(true); }}>
                <Plus className="mr-2 h-4 w-4" />
                Criar Template
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {templates.map((template) => (
              <Card key={template.id} className="hover:border-primary">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 cursor-pointer" onClick={() => { setSelectedTemplate(template); setFormOpen(true); }}>
                      <CardTitle className="text-base">{template.nome}</CardTitle>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedTemplate(template);
                        setGenerateOpen(true);
                      }}
                    >
                      <Sparkles className="h-4 w-4 mr-1" />
                      Gerar
                    </Button>
                  </div>
                </CardHeader>
                <CardContent onClick={() => { setSelectedTemplate(template); setFormOpen(true); }} className="cursor-pointer">
                  <div className="text-sm text-muted-foreground space-y-1">
                    <p>{template.tipo_obrigacao.toUpperCase()} • {template.periodicidade}</p>
                    <p className="text-xs">{template.regra_deadline_oficial}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <TemplateForm
          open={formOpen}
          onOpenChange={setFormOpen}
          template={selectedTemplate}
          onSuccess={loadTemplates}
        />

        <GenerateObrigacoesForm
          open={generateOpen}
          onOpenChange={setGenerateOpen}
          template={selectedTemplate}
          onSuccess={() => {
            setGenerateOpen(false);
            setSelectedTemplate(null);
          }}
        />
      </div>
    </Layout>
  );
}
