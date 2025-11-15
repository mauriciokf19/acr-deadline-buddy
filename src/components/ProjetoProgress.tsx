import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";

interface ProjetoProgressData {
  id: string;
  nome: string;
  cor: string;
  total: number;
  concluidas: number;
  eventosSemana: number;
}

interface ProjetoProgressProps {
  projetos: ProjetoProgressData[];
}

export function ProjetoProgress({ projetos }: ProjetoProgressProps) {
  const navigate = useNavigate();

  if (projetos.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-8 text-center">
          <p className="text-sm text-muted-foreground">
            Nenhum projeto com entregas esta semana
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {projetos.map((projeto) => {
        const progresso = projeto.total > 0 
          ? Math.round((projeto.concluidas / projeto.total) * 100) 
          : 0;

        return (
          <Card
            key={projeto.id}
            className="cursor-pointer transition-all hover:shadow-md active:scale-98"
            onClick={() => navigate(`/obrigacoes?projeto_id=${projeto.id}`)}
          >
            <CardContent className="p-4">
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <div
                        className="h-3 w-3 rounded-full flex-shrink-0"
                        style={{ backgroundColor: projeto.cor }}
                      />
                      <h4 className="text-sm font-semibold truncate">
                        {projeto.nome}
                      </h4>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {projeto.eventosSemana} {projeto.eventosSemana === 1 ? 'evento' : 'eventos'} esta semana
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-sm font-bold">{progresso}%</p>
                    <p className="text-xs text-muted-foreground">
                      {projeto.concluidas}/{projeto.total}
                    </p>
                  </div>
                </div>
                <Progress value={progresso} className="h-2" />
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
