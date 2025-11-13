import { Layout } from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, FolderKanban } from "lucide-react";

export default function Projetos() {
  return (
    <Layout>
      <div className="container mx-auto max-w-lg space-y-6 p-4">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h1 className="text-2xl font-bold">Projetos</h1>
            <p className="text-sm text-muted-foreground">
              Gerir os seus projetos ACR
            </p>
          </div>
          <Button size="icon" className="rounded-full">
            <Plus className="h-5 w-5" />
          </Button>
        </div>

        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <FolderKanban className="mb-4 h-16 w-16 text-muted-foreground" />
            <h3 className="mb-2 font-semibold">Nenhum projeto criado</h3>
            <p className="mb-4 text-sm text-muted-foreground">
              Crie o seu primeiro projeto para começar
            </p>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Criar Projeto
            </Button>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
