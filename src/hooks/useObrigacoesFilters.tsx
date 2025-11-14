import { useState, useEffect } from "react";

interface ObrigacoesFilters {
  search: string;
  tipo: string;
  periodo: string;
  estado: string;
  prioridade: string;
  projeto_id: string;
  prazo: string; // "atrasadas" | "hoje" | "semana" | ""
}

const STORAGE_KEY = "acr-obrigacoes-filters";

export function useObrigacoesFilters() {
  const [filters, setFilters] = useState<ObrigacoesFilters>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : {
      search: "",
      tipo: "",
      periodo: "",
      estado: "",
      prioridade: "",
      projeto_id: "",
      prazo: "",
    };
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filters));
  }, [filters]);

  const updateFilter = (key: keyof ObrigacoesFilters, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({
      search: "",
      tipo: "",
      periodo: "",
      estado: "",
      prioridade: "",
      projeto_id: "",
      prazo: "",
    });
  };

  return { filters, updateFilter, clearFilters };
}
