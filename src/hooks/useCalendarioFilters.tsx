import { useState, useEffect } from "react";

interface CalendarioFilters {
  projetos: string[]; // array de IDs
  tipos: string[]; // array de tipos de obrigação
  estados: string[]; // array de estados
  prioridades: string[]; // array de prioridades
  intervalo: "hoje" | "semana" | "mes" | "30dias" | "personalizado" | "todos";
  dataInicio?: Date;
  dataFim?: Date;
  apenasOficiais: boolean;
}

const STORAGE_KEY = "acr-calendario-filters";

export function useCalendarioFilters() {
  const [filters, setFilters] = useState<CalendarioFilters>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : {
      projetos: [],
      tipos: [],
      estados: [],
      prioridades: [],
      intervalo: "todos",
      apenasOficiais: false,
    };
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filters));
  }, [filters]);

  const updateFilter = <K extends keyof CalendarioFilters>(
    key: K,
    value: CalendarioFilters[K]
  ) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({
      projetos: [],
      tipos: [],
      estados: [],
      prioridades: [],
      intervalo: "todos",
      apenasOficiais: false,
    });
  };

  return { filters, updateFilter, clearFilters };
}
