/**
 * Parser PT para regras de lembretes
 * Suporta:
 * - "3 dias antes de deadline interna"
 * - "5d antes de deadline oficial"
 * - "48h após envio_senior sem feedback"
 * - Case-insensitive, tolerante a acentos e espaços múltiplos
 */

export type ReminderType = 'INTERNA' | 'OFICIAL' | 'FOLLOWUP' | 'UNKNOWN';

export interface ParsedReminder {
  type: ReminderType;
  days?: number;
  hours?: number;
}

/**
 * Remove acentos e normaliza string
 */
function normalize(str: string): string {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove diacríticos
    .replace(/\s+/g, ' ') // Normaliza espaços
    .trim();
}

/**
 * Parse regra de lembrete em português
 */
export function parseReminderRule(regra: string): ParsedReminder {
  const normalized = normalize(regra);

  // Pattern: "N dias/d antes de deadline interna/oficial"
  const beforePattern = /(\d+)\s*(d|dia|dias)\s*antes\s+d[ea]\s*deadline[_\s]*(interna|oficial)/;
  const beforeMatch = normalized.match(beforePattern);
  
  if (beforeMatch) {
    const days = parseInt(beforeMatch[1], 10);
    const type = beforeMatch[3] === 'interna' ? 'INTERNA' : 'OFICIAL';
    return { type, days };
  }

  // Pattern: "N horas/h após envio_senior (sem feedback)"
  const afterPattern = /(\d+)\s*(h|hora|horas)\s*apos\s+envio[_\s]*senior/;
  const afterMatch = normalized.match(afterPattern);
  
  if (afterMatch) {
    const hours = parseInt(afterMatch[1], 10);
    return { type: 'FOLLOWUP', hours };
  }

  return { type: 'UNKNOWN' };
}

/**
 * Valida se a regra é suportada
 */
export function isValidReminderRule(regra: string): boolean {
  const parsed = parseReminderRule(regra);
  return parsed.type !== 'UNKNOWN';
}

/**
 * Exemplos de regras válidas
 */
export const REMINDER_EXAMPLES = [
  '3 dias antes de deadline interna',
  '5d antes de deadline oficial',
  '48h após envio_senior sem feedback',
  '72 horas após envio senior',
];
