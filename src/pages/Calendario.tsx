import { Layout } from "@/components/Layout";
import { Calendar } from "@/components/ui/calendar";
import { Card } from "@/components/ui/card";
import { useState } from "react";

export default function Calendario() {
  const [date, setDate] = useState<Date | undefined>(new Date());

  return (
    <Layout>
      <div className="container mx-auto max-w-lg space-y-6 p-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold">Calendário</h1>
          <p className="text-sm text-muted-foreground">
            Visualizar todas as suas deadlines
          </p>
        </div>

        <Card className="p-4">
          <Calendar
            mode="single"
            selected={date}
            onSelect={setDate}
            className="rounded-md"
          />
        </Card>

        <div className="space-y-2">
          <h2 className="font-semibold">Legenda</h2>
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-info" />
              <span>Revisão Senior</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-warning" />
              <span>Deadline Interna</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-destructive" />
              <span>Deadline Oficial</span>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
