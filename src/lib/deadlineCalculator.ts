import { addDays, addMonths, setDate, parse, format } from "date-fns";

/**
 * Calcula o deadline oficial baseado na regra do template
 * Suporta 3 padrões:
 * a) "dia N do mês seguinte" - ex: "dia 20 do mês seguinte"
 * b) "dia N do mês seguinte ao trimestre" - ex: "dia 15 do mês seguinte ao trimestre"
 * c) "data fixa dd/MM" - ex: "31/05"
 */
export function calculateDeadlineOficial(
  regra: string,
  periodicidade: string,
  periodo: number,
  anoFiscal: number
): Date {
  const regraLower = regra.toLowerCase().trim();

  // Padrão: "dia N do mês seguinte"
  const matchMensal = regraLower.match(/dia\s+(\d+)\s+do\s+m[eê]s\s+seguinte/);
  if (matchMensal) {
    const dia = parseInt(matchMensal[1]);
    let dataBase: Date;

    if (periodicidade === "mensal") {
      // Para mensal, período é o mês (1-12)
      dataBase = new Date(anoFiscal, periodo - 1, 1); // Mês de referência
      const proximoMes = addMonths(dataBase, 1);
      return setDate(proximoMes, Math.min(dia, 31));
    } else if (periodicidade === "trimestral") {
      // Para trimestral, usar o último mês do trimestre
      const ultimoMes = periodo * 3; // T1=3, T2=6, T3=9, T4=12
      dataBase = new Date(anoFiscal, ultimoMes - 1, 1);
      const proximoMes = addMonths(dataBase, 1);
      return setDate(proximoMes, Math.min(dia, 31));
    }
  }

  // Padrão: "dia N do mês seguinte ao trimestre"
  const matchTrimestral = regraLower.match(/dia\s+(\d+)\s+do\s+m[eê]s\s+seguinte\s+ao\s+trimestre/);
  if (matchTrimestral) {
    const dia = parseInt(matchTrimestral[1]);
    const ultimoMes = periodo * 3; // T1=3, T2=6, T3=9, T4=12
    const dataBase = new Date(anoFiscal, ultimoMes - 1, 1);
    const proximoMes = addMonths(dataBase, 1);
    return setDate(proximoMes, Math.min(dia, 31));
  }

  // Padrão: "data fixa dd/MM"
  const matchFixa = regraLower.match(/(\d{1,2})\/(\d{1,2})/);
  if (matchFixa) {
    const dia = parseInt(matchFixa[1]);
    const mes = parseInt(matchFixa[2]);
    return new Date(anoFiscal, mes - 1, dia);
  }

  // Fallback: retorna último dia do ano
  console.warn(`Regra de deadline não reconhecida: ${regra}`);
  return new Date(anoFiscal, 11, 31);
}

/**
 * Calcula deadline interna subtraindo offset_interna do deadline oficial
 */
export function calculateDeadlineInterna(
  deadlineOficial: Date,
  offsetInterna: number
): Date {
  return addDays(deadlineOficial, -offsetInterna);
}

/**
 * Calcula deadline de revisão senior subtraindo offset_revisao do deadline interna
 */
export function calculateDeadlineRevisao(
  deadlineInterna: Date,
  offsetRevisao: number
): Date {
  return addDays(deadlineInterna, -offsetRevisao);
}

/**
 * Formata período de referência conforme periodicidade
 */
export function formatPeriodoReferencia(
  periodicidade: string,
  periodo: number,
  anoFiscal: number
): string {
  if (periodicidade === "mensal") {
    const mes = periodo.toString().padStart(2, "0");
    return `${anoFiscal}-${mes}`;
  } else if (periodicidade === "trimestral") {
    return `${anoFiscal}-T${periodo}`;
  } else if (periodicidade === "anual") {
    return `${anoFiscal}`;
  }
  return `${anoFiscal}`;
}
