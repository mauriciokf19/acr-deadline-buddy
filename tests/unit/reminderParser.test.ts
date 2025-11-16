import { describe, it, expect } from 'vitest';

/**
 * Helper to parse Portuguese reminder rules
 * Examples: "3d antes de deadline_interna", "48h após envio_senior sem feedback"
 */
function parseReminderRule(rule: string): { days?: number; hours?: number; type: string } {
  // Match patterns like "3d antes de", "3 dias antes de", "48h após"
  const daysMatch = rule.match(/(\d+)\s*(d|dias?)\s+antes\s+de\s+(\w+)/i);
  const hoursMatch = rule.match(/(\d+)\s*h\s+após\s+(\w+)/i);

  if (daysMatch) {
    return {
      days: parseInt(daysMatch[1]),
      type: daysMatch[3],
    };
  }

  if (hoursMatch) {
    return {
      hours: parseInt(hoursMatch[1]),
      type: hoursMatch[2],
    };
  }

  return { type: 'unknown' };
}

describe('Reminder Parser', () => {
  describe('Days before patterns', () => {
    it('should parse "3d antes de deadline_interna"', () => {
      const result = parseReminderRule('3d antes de deadline_interna');
      expect(result).toEqual({
        days: 3,
        type: 'deadline_interna',
      });
    });

    it('should parse "3 dias antes de deadline_interna"', () => {
      const result = parseReminderRule('3 dias antes de deadline_interna');
      expect(result).toEqual({
        days: 3,
        type: 'deadline_interna',
      });
    });

    it('should parse "5d antes de deadline_oficial"', () => {
      const result = parseReminderRule('5d antes de deadline_oficial');
      expect(result).toEqual({
        days: 5,
        type: 'deadline_oficial',
      });
    });

    it('should parse "2 dia antes de deadline_revisao_senior"', () => {
      const result = parseReminderRule('2 dia antes de deadline_revisao_senior');
      expect(result).toEqual({
        days: 2,
        type: 'deadline_revisao_senior',
      });
    });
  });

  describe('Hours after patterns', () => {
    it('should parse "48h após envio_senior"', () => {
      const result = parseReminderRule('48h após envio_senior sem feedback');
      expect(result).toEqual({
        hours: 48,
        type: 'envio_senior',
      });
    });

    it('should parse "72h após enviado_senior_em"', () => {
      const result = parseReminderRule('72h após enviado_senior_em');
      expect(result).toEqual({
        hours: 72,
        type: 'enviado_senior_em',
      });
    });
  });

  describe('Edge cases', () => {
    it('should handle case insensitive input', () => {
      const result = parseReminderRule('3D ANTES DE DEADLINE_OFICIAL');
      expect(result.days).toBe(3);
      expect(result.type).toBe('DEADLINE_OFICIAL');
    });

    it('should handle extra whitespace', () => {
      const result = parseReminderRule('  3d  antes  de  deadline_interna  ');
      expect(result.days).toBe(3);
    });

    it('should return unknown for invalid patterns', () => {
      const result = parseReminderRule('invalid rule format');
      expect(result.type).toBe('unknown');
    });
  });
});
