import { supabase } from "@/lib/supabase";

export type LogAction = 
  | "criar" 
  | "editar" 
  | "arquivar" 
  | "duplicar" 
  | "mudanca_estado" 
  | "upload"
  | "delete"
  | "soft_delete"
  | "restore"
  | "hard_delete";

export type LogEntityType = 
  | "projeto" 
  | "obrigacao" 
  | "tarefa" 
  | "lembrete" 
  | "template";

interface CreateLogParams {
  entidade_tipo: LogEntityType;
  entidade_id: string;
  acao: LogAction;
  detalhes?: string;
}

/**
 * Criar entrada de log para auditoria
 */
export async function createLog({
  entidade_tipo,
  entidade_id,
  acao,
  detalhes,
}: CreateLogParams): Promise<void> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      console.error("Usuário não autenticado para criar log");
      return;
    }

    await supabase.from("logs").insert({
      entidade_tipo,
      entidade_id,
      acao,
      user_id: user.id,
      detalhes: detalhes || null,
    });
  } catch (error) {
    console.error("Erro ao criar log:", error);
  }
}

/**
 * Buscar logs de uma entidade específica
 */
export async function getLogsForEntity(
  entidade_tipo: LogEntityType,
  entidade_id: string
) {
  try {
    const { data, error } = await supabase
      .from("logs")
      .select(`
        *,
        profile:profiles(nome, email)
      `)
      .eq("entidade_tipo", entidade_tipo)
      .eq("entidade_id", entidade_id)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error("Erro ao buscar logs:", error);
    return [];
  }
}

/**
 * Traduzir ação para PT-PT
 */
export function translateAction(acao: LogAction): string {
  const translations: Record<LogAction, string> = {
    criar: "Criou",
    editar: "Editou",
    arquivar: "Arquivou",
    duplicar: "Duplicou",
    mudanca_estado: "Alterou o estado",
    upload: "Carregou ficheiro",
    delete: "Eliminou",
    soft_delete: "Arquivou (soft delete)",
    restore: "Restaurou",
    hard_delete: "Eliminou permanentemente",
  };
  
  return translations[acao] || acao;
}

/**
 * Traduzir tipo de entidade para PT-PT
 */
export function translateEntityType(tipo: LogEntityType): string {
  const translations: Record<LogEntityType, string> = {
    projeto: "projeto",
    obrigacao: "obrigação",
    tarefa: "tarefa",
    lembrete: "lembrete",
    template: "template",
  };
  
  return translations[tipo] || tipo;
}
