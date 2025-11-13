import { Layout } from "@/components/Layout";
import { Card, CardContent } from "@/components/ui/card";
import { Bell } from "lucide-react";

export default function Alertas() {
  return (
    <Layout>
      <div className="container mx-auto max-w-lg space-y-6 p-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold">Alertas</h1>
          <p className="text-sm text-muted-foreground">
            Gerir os seus lembretes e notificações
          </p>
        </div>

        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Bell className="mb-4 h-16 w-16 text-muted-foreground" />
            <h3 className="mb-2 font-semibold">Sem alertas</h3>
            <p className="text-sm text-muted-foreground">
              Os seus lembretes aparecerão aqui
            </p>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
