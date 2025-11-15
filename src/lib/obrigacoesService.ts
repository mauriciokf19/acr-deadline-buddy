import { supabase } from "@/lib/supabase";
import { createLog } from "@/lib/logUtils";

interface SoftDeleteObrigacaoParams {
  obrigacaoId: string;
}

interface SoftDeleteResult {
  success: boolean;
  error?: string;
  affectedTarefas?: number;
  affectedLembretes?: number;
}

/**
 * Soft delete de uma obrigação com cascatas para tarefas e lembretes
 */
export async function softDeleteObrigacao({
  obrigacaoId,
}: SoftDeleteObrigacaoParams): Promise<SoftDeleteResult> {
  try {
    const now = new Date().toISOString();

    // 1. Soft delete da obrigação
    const { error: obrigacaoError } = await supabase
      .from("obrigacoes")
      .update({ deleted_at: now })
      .eq("id", obrigacaoId);

    if (obrigacaoError) throw obrigacaoError;

    // 2. Soft delete das tarefas associadas
    const { data: tarefas, error: tarefasError } = await supabase
      .from("tarefas")
      .update({ deleted_at: now })
      .eq("obrigacao_id", obrigacaoId)
      .is("deleted_at", null)
      .select("id");

    if (tarefasError) throw tarefasError;

    // 3. Desativar e soft delete dos lembretes associados
    const { data: lembretes, error: lembretesError } = await supabase
      .from("lembretes")
      .update({ ativo: false, deleted_at: now })
      .eq("entidade_tipo", "obrigacao")
      .eq("entidade_id", obrigacaoId)
      .is("deleted_at", null)
      .select("id");

    if (lembretesError) throw lembretesError;

    // 4. Criar logs
    await createLog({
      entidade_tipo: "obrigacao",
      entidade_id: obrigacaoId,
      acao: "soft_delete",
      detalhes: JSON.stringify({
        cascade: {
          tarefas_afetadas: tarefas?.length || 0,
          lembretes_desativados: lembretes?.length || 0,
        },
      }),
    });

    // Log para cada tarefa afetada
    if (tarefas && tarefas.length > 0) {
      for (const tarefa of tarefas) {
        await createLog({
          entidade_tipo: "tarefa",
          entidade_id: tarefa.id,
          acao: "soft_delete",
          detalhes: JSON.stringify({ cascaded_from: obrigacaoId }),
        });
      }
    }

    // Log para cada lembrete afetado
    if (lembretes && lembretes.length > 0) {
      for (const lembrete of lembretes) {
        await createLog({
          entidade_tipo: "lembrete",
          entidade_id: lembrete.id,
          acao: "soft_delete",
          detalhes: JSON.stringify({ cascaded_from: obrigacaoId }),
        });
      }
    }

    return {
      success: true,
      affectedTarefas: tarefas?.length || 0,
      affectedLembretes: lembretes?.length || 0,
    };
  } catch (error) {
    console.error("Erro ao apagar obrigação:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Erro desconhecido",
    };
  }
}

/**
 * Restaurar uma obrigação soft-deleted
 */
export async function restoreObrigacao({
  obrigacaoId,
}: SoftDeleteObrigacaoParams): Promise<SoftDeleteResult> {
  try {
    // 1. Restaurar obrigação
    const { error: obrigacaoError } = await supabase
      .from("obrigacoes")
      .update({ deleted_at: null })
      .eq("id", obrigacaoId);

    if (obrigacaoError) throw obrigacaoError;

    // 2. Restaurar tarefas
    const { data: tarefas, error: tarefasError } = await supabase
      .from("tarefas")
      .update({ deleted_at: null })
      .eq("obrigacao_id", obrigacaoId)
      .not("deleted_at", "is", null)
      .select("id");

    if (tarefasError) throw tarefasError;

    // 3. Reativar lembretes
    const { data: lembretes, error: lembretesError } = await supabase
      .from("lembretes")
      .update({ ativo: true, deleted_at: null })
      .eq("entidade_tipo", "obrigacao")
      .eq("entidade_id", obrigacaoId)
      .not("deleted_at", "is", null)
      .select("id");

    if (lembretesError) throw lembretesError;

    // 4. Criar logs
    await createLog({
      entidade_tipo: "obrigacao",
      entidade_id: obrigacaoId,
      acao: "restore",
      detalhes: JSON.stringify({
        cascade: {
          tarefas_restauradas: tarefas?.length || 0,
          lembretes_reativados: lembretes?.length || 0,
        },
      }),
    });

    return {
      success: true,
      affectedTarefas: tarefas?.length || 0,
      affectedLembretes: lembretes?.length || 0,
    };
  } catch (error) {
    console.error("Erro ao restaurar obrigação:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Erro desconhecido",
    };
  }
}

/**
 * Hard delete permanente (apenas admin)
 */
export async function hardDeleteObrigacao({
  obrigacaoId,
}: SoftDeleteObrigacaoParams): Promise<SoftDeleteResult> {
  try {
    // 1. Contar registos antes de apagar
    const { data: tarefas } = await supabase
      .from("tarefas")
      .select("id")
      .eq("obrigacao_id", obrigacaoId);

    const { data: lembretes } = await supabase
      .from("lembretes")
      .select("id")
      .eq("entidade_tipo", "obrigacao")
      .eq("entidade_id", obrigacaoId);

    // 2. Apagar tarefas
    const { error: tarefasError } = await supabase
      .from("tarefas")
      .delete()
      .eq("obrigacao_id", obrigacaoId);

    if (tarefasError) throw tarefasError;

    // 3. Apagar lembretes
    const { error: lembretesError } = await supabase
      .from("lembretes")
      .delete()
      .eq("entidade_tipo", "obrigacao")
      .eq("entidade_id", obrigacaoId);

    if (lembretesError) throw lembretesError;

    // 4. Apagar obrigação
    const { error: obrigacaoError } = await supabase
      .from("obrigacoes")
      .delete()
      .eq("id", obrigacaoId);

    if (obrigacaoError) throw obrigacaoError;

    // 5. Criar log (antes de apagar)
    await createLog({
      entidade_tipo: "obrigacao",
      entidade_id: obrigacaoId,
      acao: "hard_delete",
      detalhes: JSON.stringify({
        cascade: {
          tarefas_apagadas: tarefas?.length || 0,
          lembretes_apagados: lembretes?.length || 0,
        },
      }),
    });

    return {
      success: true,
      affectedTarefas: tarefas?.length || 0,
      affectedLembretes: lembretes?.length || 0,
    };
  } catch (error) {
    console.error("Erro ao apagar obrigação permanentemente:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Erro desconhecido",
    };
  }
}
