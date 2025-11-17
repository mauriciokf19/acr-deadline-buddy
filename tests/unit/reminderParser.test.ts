import { describe, it, expect } from 'vitest';
import { parseReminderRule, isValidReminderRule, REMINDER_EXAMPLES } from '@/lib/reminderParser';

describe('Reminder Parser', () => {
  describe('parseReminderRule', () => {
    it('should parse "dias antes de deadline interna"', () => {
      const result = parseReminderRule('3 dias antes de deadline interna');
      expect(result.type).toBe('INTERNA');
      expect(result.days).toBe(3);
    });

    it('should parse "d antes de deadline oficial"', () => {
      const result = parseReminderRule('5d antes de deadline oficial');
      expect(result.type).toBe('OFICIAL');
      expect(result.days).toBe(5);
    });

    it('should parse "horas após envio_senior"', () => {
      const result = parseReminderRule('48h após envio_senior sem feedback');
      expect(result.type).toBe('FOLLOWUP');
      expect(result.hours).toBe(48);
    });

    it('should parse "horas após envio senior"', () => {
      const result = parseReminderRule('72 horas após envio senior');
      expect(result.type).toBe('FOLLOWUP');
      expect(result.hours).toBe(72);
    });

    it('should be case insensitive', () => {
      const result = parseReminderRule('3 DIAS ANTES DE DEADLINE INTERNA');
      expect(result.type).toBe('INTERNA');
      expect(result.days).toBe(3);
    });

    it('should handle multiple spaces', () => {
      const result = parseReminderRule('3   dias   antes   de   deadline   interna');
      expect(result.type).toBe('INTERNA');
      expect(result.days).toBe(3);
    });

    it('should return UNKNOWN for invalid patterns', () => {
      const result = parseReminderRule('invalid rule');
      expect(result.type).toBe('UNKNOWN');
    });

    it('should validate all example rules', () => {
      REMINDER_EXAMPLES.forEach(example => {
        const result = parseReminderRule(example);
        expect(result.type).not.toBe('UNKNOWN');
      });
    });
  });

  describe('isValidReminderRule', () => {
    it('should return true for valid rules', () => {
      expect(isValidReminderRule('3 dias antes de deadline interna')).toBe(true);
      expect(isValidReminderRule('48h após envio_senior')).toBe(true);
    });

    it('should return false for invalid rules', () => {
      expect(isValidReminderRule('invalid')).toBe(false);
      expect(isValidReminderRule('')).toBe(false);
    });
  });
});
