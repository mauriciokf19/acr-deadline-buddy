import { CalendarioEvent } from "@/hooks/useCalendarioEvents";
import { format } from "date-fns";

/**
 * Gera ficheiro .ICS (iCalendar RFC 5545) com eventos de obrigações
 * Eventos são all-day para compatibilidade máxima
 */
export function generateICS(events: CalendarioEvent[], baseUrl: string): string {
  const now = new Date();
  const dtstamp = formatToICS(now);
  
  let ics = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//ACR Deadlines//PT",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "X-WR-CALNAME:ACR Deadlines",
    "X-WR-TIMEZONE:Europe/Lisbon",
    "X-WR-CALDESC:Obrigações fiscais e deadlines",
  ].join("\r\n");

  events.forEach(event => {
    const uid = `${event.id}@acr-deadlines`;
    const dtstart = formatDateOnly(event.data);
    const summary = event.titulo;
    
    const description = [
      `Projeto: ${event.projetoNome}`,
      `Tipo: ${getTipoLabel(event.tipoObrigacao)}`,
      event.periodoReferencia ? `Período: ${event.periodoReferencia}` : "",
      event.estado ? `Estado: ${getEstadoLabel(event.estado)}` : "",
      `Categoria: ${getTipoEventoLabel(event.tipo)}`,
    ].filter(Boolean).join("\\n");

    const url = `${baseUrl}/obrigacoes/${event.obrigacaoId}`;
    const category = event.tipo;

    ics += "\r\n" + [
      "BEGIN:VEVENT",
      `UID:${uid}`,
      `DTSTAMP:${dtstamp}`,
      `DTSTART;VALUE=DATE:${dtstart}`,
      `SUMMARY:${escapeICS(summary)}`,
      `DESCRIPTION:${escapeICS(description)}`,
      `CATEGORIES:${category}`,
      `URL:${url}`,
      `STATUS:CONFIRMED`,
      `TRANSP:TRANSPARENT`,
      "END:VEVENT",
    ].join("\r\n");
  });

  ics += "\r\n" + "END:VCALENDAR";

  return ics;
}

/**
 * Formata Date para formato ICS timestamp: YYYYMMDDTHHmmssZ
 */
function formatToICS(date: Date): string {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");
  const hours = String(date.getUTCHours()).padStart(2, "0");
  const minutes = String(date.getUTCMinutes()).padStart(2, "0");
  const seconds = String(date.getUTCSeconds()).padStart(2, "0");
  return `${year}${month}${day}T${hours}${minutes}${seconds}Z`;
}

/**
 * Formata Date para formato ICS date-only: YYYYMMDD
 */
function formatDateOnly(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}${month}${day}`;
}

/**
 * Escapa caracteres especiais para formato ICS
 */
function escapeICS(text: string): string {
  return text
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\n/g, "\\n");
}

/**
 * Download do ficheiro .ICS
 */
export function downloadICS(icsContent: string, filename: string = `acr-deadlines-${format(new Date(), "yyyy-MM-dd")}.ics`) {
  const blob = new Blob([icsContent], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function getTipoLabel(tipo: string): string {
  const labels: Record<string, string> = {
    iva: "IVA",
    ies: "IES",
    saft: "SAF-T",
    modelo_10: "Modelo 10",
    modelo_22: "Modelo 22",
    dmr: "DMR",
    ifs: "IFS",
    outro: "Outro",
  };
  return labels[tipo] || tipo.toUpperCase();
}

function getEstadoLabel(estado: string): string {
  const labels: Record<string, string> = {
    pendente: "Pendente",
    em_revisao: "Em Revisão",
    aprovado: "Aprovado",
    submetido: "Submetido",
    concluido: "Concluído",
    atrasado: "Atrasado",
  };
  return labels[estado] || estado;
}

function getTipoEventoLabel(tipo: string): string {
  const labels: Record<string, string> = {
    REVISAO: "Revisão Senior",
    INTERNA: "Deadline Interna",
    OFICIAL: "Deadline Oficial",
  };
  return labels[tipo] || tipo;
}
