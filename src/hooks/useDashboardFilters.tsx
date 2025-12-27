import { useState, useEffect } from "react";

interface DashboardFilters {
  clientes: string[];
  tipos: string[];
  estados: string[];
  prioridades: string[];
  paises: string[];
}

const STORAGE_KEY = "acr-dashboard-filters-v2";

export function useDashboardFilters() {
  const [filters, setFilters] = useState<DashboardFilters>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : {
      clientes: [],
      tipos: [],
      estados: [],
      prioridades: [],
      paises: [],
    };
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filters));
  }, [filters]);

  const updateFilter = <K extends keyof DashboardFilters>(
    key: K,
    value: DashboardFilters[K]
  ) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({
      clientes: [],
      tipos: [],
      estados: [],
      prioridades: [],
      paises: [],
    });
  };

  return { filters, updateFilter, clearFilters };
}