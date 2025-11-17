import { format, parseISO, startOfWeek, endOfWeek } from "date-fns";
import { toZonedTime, fromZonedTime } from "date-fns-tz";
import { pt } from "date-fns/locale";

const TIMEZONE = "Europe/Lisbon";

/**
 * Formatar data para exibição em PT-PT (dd/MM/yyyy)
 */
export function formatDatePT(date: Date | string | null | undefined): string {
  if (!date) return "-";
  
  try {
    const dateObj = typeof date === "string" ? parseISO(date) : date;
    const zonedDate = toZonedTime(dateObj, TIMEZONE);
    return format(zonedDate, "dd/MM/yyyy", { locale: pt });
  } catch {
    return "-";
  }
}

/**
 * Formatar data e hora para exibição em PT-PT (dd/MM/yyyy HH:mm)
 */
export function formatDateTimePT(date: Date | string | null | undefined): string {
  if (!date) return "-";
  
  try {
    const dateObj = typeof date === "string" ? parseISO(date) : date;
    const zonedDate = toZonedTime(dateObj, TIMEZONE);
    return format(zonedDate, "dd/MM/yyyy HH:mm", { locale: pt });
  } catch {
    return "-";
  }
}

/**
 * Converter data local para UTC para armazenamento
 */
export function toUTC(date: Date): Date {
  return fromZonedTime(date, TIMEZONE);
}

/**
 * Converter UTC para timezone local
 */
export function fromUTC(date: Date | string): Date {
  const dateObj = typeof date === "string" ? parseISO(date) : date;
  return toZonedTime(dateObj, TIMEZONE);
}

/**
 * Obter data de hoje em timezone local
 */
export function getTodayInTimezone(): Date {
  return toZonedTime(new Date(), TIMEZONE);
}

/**
 * Verificar se uma data está atrasada
 */
export function isOverdue(deadline: Date | string | null | undefined): boolean {
  if (!deadline) return false;
  
  try {
    const deadlineDate = typeof deadline === "string" ? parseISO(deadline) : deadline;
    const today = getTodayInTimezone();
    return deadlineDate < today;
  } catch {
    return false;
  }
}

/**
 * Verificar se uma data é hoje
 */
export function isToday(date: Date | string | null | undefined): boolean {
  if (!date) return false;
  
  try {
    const dateObj = typeof date === "string" ? parseISO(date) : date;
    const zonedDate = toZonedTime(dateObj, TIMEZONE);
    const today = getTodayInTimezone();
    
    return format(zonedDate, "yyyy-MM-dd") === format(today, "yyyy-MM-dd");
  } catch {
    return false;
  }
}

/**
 * Verificar se uma data está na próxima semana
 */
export function isNextWeek(date: Date | string | null | undefined): boolean {
  if (!date) return false;
  
  try {
    const dateObj = typeof date === "string" ? parseISO(date) : date;
    const zonedDate = toZonedTime(dateObj, TIMEZONE);
    const today = getTodayInTimezone();
    const nextWeek = new Date(today);
    nextWeek.setDate(today.getDate() + 7);
    
    return zonedDate >= today && zonedDate <= nextWeek;
  } catch {
    return false;
  }
}

/**
 * Obter início do dia de hoje em Europe/Lisbon (normalizado para 00:00:00)
 */
export function getTodayPT(): Date {
  const today = getTodayInTimezone();
  today.setHours(0, 0, 0, 0);
  return today;
}

/**
 * Verificar se uma data está na semana ISO atual (Europe/Lisbon)
 */
export function isThisWeekPT(date: Date | string | null | undefined): boolean {
  if (!date) return false;
  
  try {
    const dateObj = typeof date === "string" ? parseISO(date) : date;
    const zonedDate = toZonedTime(dateObj, TIMEZONE);
    const today = getTodayInTimezone();
    
    // Semana ISO: segunda a domingo
    const weekStart = startOfWeek(today, { weekStartsOn: 1 });
    const weekEnd = endOfWeek(today, { weekStartsOn: 1 });
    
    return zonedDate >= weekStart && zonedDate <= weekEnd;
  } catch {
    return false;
  }
}

/**
 * Aplicar janela de silêncio aos lembretes
 * Se o horário cair entre inicio e fim, reagendar para o fim do período
 */
export function applySilenceWindow(
  date: Date,
  silenceStart: string | null | undefined, // "HH:mm" format
  silenceEnd: string | null | undefined
): Date {
  if (!silenceStart || !silenceEnd) return date;

  try {
    const [startHour, startMin] = silenceStart.split(':').map(Number);
    const [endHour, endMin] = silenceEnd.split(':').map(Number);
    
    const dateHour = date.getHours();
    const dateMin = date.getMinutes();
    const dateTime = dateHour * 60 + dateMin;
    const startTime = startHour * 60 + startMin;
    const endTime = endHour * 60 + endMin;

    // Check if date falls within silence window
    // Handle overnight windows (e.g., 20:00-08:00)
    const inSilence = startTime > endTime 
      ? (dateTime >= startTime || dateTime < endTime)
      : (dateTime >= startTime && dateTime < endTime);

    if (inSilence) {
      // Reschedule to end of silence window
      const rescheduled = new Date(date);
      rescheduled.setHours(endHour, endMin, 0, 0);
      
      // If we're past midnight and the window ends tomorrow
      if (startTime > endTime && dateTime >= startTime) {
        rescheduled.setDate(rescheduled.getDate() + 1);
      }
      
      return rescheduled;
    }

    return date;
  } catch {
    return date;
  }
}

/**
 * Calcular próximo disparo para lembretes "antes de deadline"
 * Hora-alvo: 08:00 local time
 */
export function calculateReminderBeforeDeadline(
  deadline: Date | string,
  daysBefore: number,
  silenceStart?: string | null,
  silenceEnd?: string | null
): Date {
  const deadlineDate = typeof deadline === "string" ? parseISO(deadline) : deadline;
  const zonedDeadline = toZonedTime(deadlineDate, TIMEZONE);
  
  // Subtract days
  const reminderDate = new Date(zonedDeadline);
  reminderDate.setDate(reminderDate.getDate() - daysBefore);
  
  // Set to 08:00 local time
  reminderDate.setHours(8, 0, 0, 0);
  
  // Apply silence window
  return applySilenceWindow(reminderDate, silenceStart, silenceEnd);
}

/**
 * Calcular próximo disparo para lembretes "após envio"
 * Mantém hora original do envio
 */
export function calculateReminderAfterSend(
  sendDate: Date | string,
  hoursAfter: number,
  silenceStart?: string | null,
  silenceEnd?: string | null
): Date {
  const sendDateTime = typeof sendDate === "string" ? parseISO(sendDate) : sendDate;
  const zonedSend = toZonedTime(sendDateTime, TIMEZONE);
  
  // Add hours
  const reminderDate = new Date(zonedSend);
  reminderDate.setHours(reminderDate.getHours() + hoursAfter);
  
  // Apply silence window
  return applySilenceWindow(reminderDate, silenceStart, silenceEnd);
}
