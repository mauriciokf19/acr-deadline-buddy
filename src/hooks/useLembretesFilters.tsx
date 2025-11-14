import { useState, useEffect } from "react";

interface LembretesFilters {
  search: string;
  entidade_tipo: string; // "obrigacao" | "tarefa" | ""
  canal: string; // "email" | "push" | ""
  ativo: string; // "true" | "false" | ""
}

const STORAGE_KEY = "acr-lembretes-filters";

export function useLembretesFilters() {
  const [filters, setFilters] = useState<LembretesFilters>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : {
      search: "",
      entidade_tipo: "",
      canal: "",
      ativo: "",
    };
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filters));
  }, [filters]);

  const updateFilter = (key: keyof LembretesFilters, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({
      search: "",
      entidade_tipo: "",
      canal: "",
      ativo: "",
    });
  };

  return { filters, updateFilter, clearFilters };
}
