import { useState, useEffect } from "react";

interface ProjetosFilters {
  search: string;
  cliente: string;
  pais: string;
  ano_fiscal: string;
  status: string;
}

const STORAGE_KEY = "acr-projetos-filters";

export function useProjetosFilters() {
  const [filters, setFilters] = useState<ProjetosFilters>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : {
      search: "",
      cliente: "",
      pais: "",
      ano_fiscal: "",
      status: "ativo",
    };
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filters));
  }, [filters]);

  const updateFilter = (key: keyof ProjetosFilters, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({
      search: "",
      cliente: "",
      pais: "",
      ano_fiscal: "",
      status: "ativo",
    });
  };

  return { filters, updateFilter, clearFilters };
}
