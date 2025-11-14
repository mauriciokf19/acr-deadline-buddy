import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getLogsForEntity, translateAction, translateEntityType, LogEntityType } from "@/lib/logUtils";
import { formatDateTimePT } from "@/lib/dateUtils";
import { History } from "lucide-react";

interface LogTimelineProps {
  entidade_tipo: LogEntityType;
  entidade_id: string;
}

export function LogTimeline({ entidade_tipo, entidade_id }: LogTimelineProps) {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLogs();
  }, [entidade_tipo, entidade_id]);

  const loadLogs = async () => {
    setLoading(true);
    const data = await getLogsForEntity(entidade_tipo, entidade_id);
    setLogs(data);
    setLoading(false);
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <History className="h-5 w-5" />
            Histórico
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (logs.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <History className="h-5 w-5" />
            Histórico
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-center text-sm text-muted-foreground py-4">
            Sem histórico disponível
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <History className="h-5 w-5" />
          Histórico
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {logs.map((log) => (
            <div key={log.id} className="border-l-2 border-muted pl-3 pb-3">
              <div className="flex flex-col gap-1">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm font-medium">
                    {translateAction(log.acao)} {translateEntityType(entidade_tipo)}
                  </p>
                  <span className="text-xs text-muted-foreground whitespace-nowrap">
                    {formatDateTimePT(log.created_at)}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">
                  por {log.profile?.nome || log.profile?.email || "Sistema"}
                </p>
                {log.detalhes && (
                  <p className="text-xs text-muted-foreground mt-1">
                    {log.detalhes}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
