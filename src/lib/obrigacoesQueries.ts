import { supabase } from "@/lib/supabase";

/**
 * Aplicar filtro de soft delete (excluir deleted_at IS NOT NULL)
 */
export function excludeSoftDeleted<T>(query: T): T {
  // @ts-ignore - Supabase query builder type workaround
  return query.is("deleted_at", null);
}

/**
 * Base query para obrigações ativas (não soft-deleted)
 */
export function getActiveObrigacoesQuery() {
  return excludeSoftDeleted(
    supabase.from("obrigacoes").select("*")
  );
}

/**
 * Query para obrigações com filtros adicionais
 */
export function getFilteredObrigacoesQuery(filters: {
  projetos?: string[];
  tipos?: string[];
  estados?: string[];
  paises?: string[];
}) {
  let query = getActiveObrigacoesQuery();

  if (filters.projetos && filters.projetos.length > 0) {
    // @ts-ignore
    query = query.in("projeto_id", filters.projetos);
  }

  if (filters.tipos && filters.tipos.length > 0) {
    // @ts-ignore
    query = query.in("tipo", filters.tipos as any);
  }

  if (filters.estados && filters.estados.length > 0) {
    // @ts-ignore
    query = query.in("estado", filters.estados as any);
  }

  return query;
}
