import { useState, useEffect } from "react";

interface TarefasFilters {
  search: string;
  estado: string; // "concluida" | "nao_concluida" | "todas"
  responsavel_id: string;
  projeto_id: string;
  obrigacao_id: string;
  deadline: string; // "atrasadas" | "hoje" | "semana" | "todas"
}

const STORAGE_KEY = "acr-tarefas-filters";

export function useTarefasFilters() {
  const [filters, setFilters] = useState<TarefasFilters>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : {
      search: "",
      estado: "todas",
      responsavel_id: "",
      projeto_id: "",
      obrigacao_id: "",
      deadline: "",
    };
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filters));
  }, [filters]);

  const updateFilter = (key: keyof TarefasFilters, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({
      search: "",
      estado: "todas",
      responsavel_id: "",
      projeto_id: "",
      obrigacao_id: "",
      deadline: "",
    });
  };

  return { filters, updateFilter, clearFilters };
}
