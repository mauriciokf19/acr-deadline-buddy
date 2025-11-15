import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { X, Filter } from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

interface CalendarioFiltersProps {
  projetos: string[];
  tipos: string[];
  estados: string[];
  intervalo: string;
  apenasOficiais: boolean;
  onProjetosChange: (ids: string[]) => void;
  onTiposChange: (tipos: string[]) => void;
  onEstadosChange: (estados: string[]) => void;
  onIntervaloChange: (intervalo: string) => void;
  onApenasOficiaisChange: (value: boolean) => void;
  onClear: () => void;
}

export function CalendarioFilters({
  projetos,
  tipos,
  estados,
  intervalo,
  apenasOficiais,
  onProjetosChange,
  onTiposChange,
  onEstadosChange,
  onIntervaloChange,
  onApenasOficiaisChange,
  onClear,
}: CalendarioFiltersProps) {
  const [showFilters, setShowFilters] = useState(false);
  const [projetosDisponiveis, setProjetosDisponiveis] = useState<any[]>([]);

  useEffect(() => {
    loadProjetos();
  }, []);

  const loadProjetos = async () => {
    const { data } = await supabase
      .from("projetos")
      .select("id, nome")
      .eq("ativo", true)
      .order("nome");
    if (data) setProjetosDisponiveis(data);
  };

  const tiposDisponiveis = [
    { value: "iva", label: "IVA" },
    { value: "ies", label: "IES" },
    { value: "saft", label: "SAF-T" },
    { value: "modelo_10", label: "Modelo 10" },
    { value: "modelo_22", label: "Modelo 22" },
    { value: "dmr", label: "DMR" },
    { value: "ifs", label: "IFS" },
    { value: "outro", label: "Outro" },
  ];

  const estadosDisponiveis = [
    { value: "pendente", label: "Pendente" },
    { value: "em_revisao", label: "Em Revisão" },
    { value: "aprovado", label: "Aprovado" },
    { value: "submetido", label: "Submetido" },
    { value: "concluido", label: "Concluído" },
    { value: "atrasado", label: "Atrasado" },
  ];

  const hasActiveFilters = 
    projetos.length > 0 ||
    tipos.length > 0 ||
    estados.length > 0 ||
    intervalo !== "todos" ||
    apenasOficiais;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowFilters(!showFilters)}
        >
          <Filter className="h-4 w-4 mr-2" />
          Filtros
          {hasActiveFilters && (
            <span className="ml-2 bg-primary text-primary-foreground rounded-full px-2 py-0.5 text-xs">
              {[projetos, tipos, estados].filter(arr => arr.length > 0).length}
            </span>
          )}
        </Button>

        {hasActiveFilters && (
          <Button variant="ghost" size="sm" onClick={onClear}>
            <X className="h-4 w-4 mr-2" />
            Limpar filtros
          </Button>
        )}
      </div>

      {showFilters && (
        <div className="grid gap-4 p-4 border rounded-lg bg-card">
          <div className="grid gap-2">
            <Label>Intervalo</Label>
            <Select value={intervalo} onValueChange={onIntervaloChange}>
              <SelectTrigger>
                <SelectValue placeholder="Selecionar intervalo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos</SelectItem>
                <SelectItem value="hoje">Hoje</SelectItem>
                <SelectItem value="semana">Esta semana</SelectItem>
                <SelectItem value="mes">Este mês</SelectItem>
                <SelectItem value="30dias">Próximos 30 dias</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label>Projeto</Label>
            <div className="flex gap-2">
              <Select
                value={projetos[0] || undefined}
                onValueChange={(v) => onProjetosChange(v ? [v] : [])}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Todos os projetos" />
                </SelectTrigger>
                <SelectContent>
                  {projetosDisponiveis.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {projetos.length > 0 && (
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => onProjetosChange([])}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>

          <div className="grid gap-2">
            <Label>Tipo de Obrigação</Label>
            <div className="flex gap-2">
              <Select
                value={tipos[0] || undefined}
                onValueChange={(v) => onTiposChange(v ? [v] : [])}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Todos os tipos" />
                </SelectTrigger>
                <SelectContent>
                  {tiposDisponiveis.map((t) => (
                    <SelectItem key={t.value} value={t.value}>
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {tipos.length > 0 && (
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => onTiposChange([])}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>

          <div className="grid gap-2">
            <Label>Estado</Label>
            <div className="flex gap-2">
              <Select
                value={estados[0] || undefined}
                onValueChange={(v) => onEstadosChange(v ? [v] : [])}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Todos os estados" />
                </SelectTrigger>
                <SelectContent>
                  {estadosDisponiveis.map((e) => (
                    <SelectItem key={e.value} value={e.value}>
                      {e.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {estados.length > 0 && (
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => onEstadosChange([])}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="apenas-oficiais">Mostrar apenas deadlines oficiais</Label>
            <Switch
              id="apenas-oficiais"
              checked={apenasOficiais}
              onCheckedChange={onApenasOficiaisChange}
            />
          </div>
        </div>
      )}
    </div>
  );
}
