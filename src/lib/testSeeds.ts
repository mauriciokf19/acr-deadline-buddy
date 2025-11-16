import { supabase } from "@/lib/supabase";
import { addDays, subDays, startOfWeek } from "date-fns";

export interface SeedResult {
  success: boolean;
  message: string;
  data?: any;
}

/**
 * Seeds deterministic test data for QA
 * Creates projects and obligations covering all test scenarios
 */
export async function seedTestData(): Promise<SeedResult> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, message: "User not authenticated" };
    }

    // Clean existing test data (marked with prefix "TEST_")
    await supabase.from("obrigacoes").delete().ilike("titulo", "TEST_%");
    await supabase.from("projetos").delete().ilike("nome", "TEST_%");

    const today = new Date();
    const yesterday = subDays(today, 1);
    const tomorrow = addDays(today, 1);
    const nextWeek = addDays(startOfWeek(today), 9);
    const nextMonth = addDays(today, 35);

    // Create test projects
    const { data: projects, error: projectError } = await supabase
      .from("projetos")
      .insert([
        {
          nome: "TEST_Projeto A",
          cor: "#ef4444",
          ano_fiscal: new Date().getFullYear(),
          pais: "PT",
        },
        {
          nome: "TEST_Projeto B",
          cor: "#3b82f6",
          ano_fiscal: new Date().getFullYear(),
          pais: "PT",
        },
      ])
      .select();

    if (projectError) throw projectError;

    const projeto1 = projects[0];
    const projeto2 = projects[1];

    // Create test obligations covering all scenarios
    const { data: obrigacoes, error: obrigacoesError } = await supabase
      .from("obrigacoes")
      .insert([
        // 1. ATRASADA - oficial deadline is yesterday
        {
          titulo: "TEST_Atrasada",
          projeto_id: projeto1.id,
          tipo: "iva",
          periodicidade: "mensal",
          periodo_referencia: "11/2024",
          deadline_revisao_senior: subDays(yesterday, 5).toISOString(),
          deadline_interna: subDays(yesterday, 3).toISOString(),
          deadline_oficial: yesterday.toISOString(),
          estado: "pendente",
        },
        // 2. VENCE HOJE - interna deadline is today
        {
          titulo: "TEST_Vence_Hoje",
          projeto_id: projeto1.id,
          tipo: "saft",
          periodicidade: "mensal",
          periodo_referencia: "12/2024",
          deadline_revisao_senior: subDays(today, 2).toISOString(),
          deadline_interna: today.toISOString(),
          deadline_oficial: addDays(today, 3).toISOString(),
          estado: "pendente",
        },
        // 3. ESTA SEMANA - revisao deadline within this week
        {
          titulo: "TEST_Esta_Semana",
          projeto_id: projeto2.id,
          tipo: "modelo_22",
          periodicidade: "anual",
          periodo_referencia: "2024",
          deadline_revisao_senior: addDays(today, 2).toISOString(),
          deadline_interna: addDays(today, 5).toISOString(),
          deadline_oficial: addDays(today, 8).toISOString(),
          estado: "pendente",
        },
        // 4. NO PRAZO - all deadlines in next month
        {
          titulo: "TEST_No_Prazo",
          projeto_id: projeto2.id,
          tipo: "ies",
          periodicidade: "anual",
          periodo_referencia: "2024",
          deadline_revisao_senior: addDays(nextMonth, -5).toISOString(),
          deadline_interna: addDays(nextMonth, -3).toISOString(),
          deadline_oficial: nextMonth.toISOString(),
          estado: "pendente",
        },
        // 5. FOLLOW-UP - enviado ao senior há 47h (quase 48h)
        {
          titulo: "TEST_Follow_Up",
          projeto_id: projeto1.id,
          tipo: "dmr",
          periodicidade: "mensal",
          periodo_referencia: "01/2025",
          deadline_revisao_senior: subDays(today, 10).toISOString(),
          deadline_interna: subDays(today, 7).toISOString(),
          deadline_oficial: addDays(today, 3).toISOString(),
          estado: "em_revisao",
          enviado_senior_em: subDays(today, 2).toISOString(), // 47h ago
        },
        // 6. UPLOAD TEST - ready for comprovativo test
        {
          titulo: "TEST_Upload_Obrigatorio",
          projeto_id: projeto2.id,
          tipo: "iva",
          periodicidade: "mensal",
          periodo_referencia: "02/2025",
          deadline_revisao_senior: today.toISOString(),
          deadline_interna: addDays(today, 2).toISOString(),
          deadline_oficial: addDays(today, 5).toISOString(),
          estado: "aprovado",
          aprovado_em: today.toISOString(),
          submetido_em: today.toISOString(), // Has submission date but no file
        },
        // 7. SOFT DELETED - should not appear in any view
        {
          titulo: "TEST_Soft_Deleted",
          projeto_id: projeto1.id,
          tipo: "outro",
          periodicidade: "pontual",
          deadline_revisao_senior: today.toISOString(),
          deadline_interna: addDays(today, 2).toISOString(),
          deadline_oficial: addDays(today, 5).toISOString(),
          estado: "pendente",
          deleted_at: today.toISOString(),
        },
      ])
      .select();

    if (obrigacoesError) throw obrigacoesError;

    // Create test templates
    const { error: templatesError } = await supabase
      .from("templates")
      .insert([
        {
          nome: "TEST_IVA Mensal PT",
          tipo_obrigacao: "iva",
          periodicidade: "mensal",
          pais: "PT",
          regra_deadline_oficial: "dia 10 do próximo mês",
          offset_interna: 3,
          offset_revisao: 2,
          notas: "Template de teste para IVA mensal",
        },
        {
          nome: "TEST_IES Anual PT",
          tipo_obrigacao: "ies",
          periodicidade: "anual",
          pais: "PT",
          regra_deadline_oficial: "31/05",
          offset_interna: 5,
          offset_revisao: 3,
          notas: "Template de teste para IES anual",
        },
      ]);

    if (templatesError) throw templatesError;

    return {
      success: true,
      message: `Dados de teste criados: ${projects.length} projetos, ${obrigacoes.length} obrigações`,
      data: { projects, obrigacoes },
    };
  } catch (error: any) {
    console.error("Erro ao criar seeds:", error);
    return {
      success: false,
      message: `Erro: ${error.message}`,
    };
  }
}

/**
 * Cleans all test data
 */
export async function cleanTestData(): Promise<SeedResult> {
  try {
    // Delete test data
    await supabase.from("template_instancias").delete().ilike("parametros_json", "%TEST_%");
    await supabase.from("tarefas").delete().ilike("titulo", "TEST_%");
    await supabase.from("lembretes").delete().eq("entidade_tipo", "obrigacao");
    await supabase.from("obrigacoes").delete().ilike("titulo", "TEST_%");
    await supabase.from("templates").delete().ilike("nome", "TEST_%");
    await supabase.from("projetos").delete().ilike("nome", "TEST_%");

    return {
      success: true,
      message: "Dados de teste removidos com sucesso",
    };
  } catch (error: any) {
    console.error("Erro ao limpar seeds:", error);
    return {
      success: false,
      message: `Erro: ${error.message}`,
    };
  }
}
