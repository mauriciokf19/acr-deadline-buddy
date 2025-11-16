import { describe, it, expect } from 'vitest';
import { formatDatePT, formatDateTimePT, isOverdue, isToday, isNextWeek } from '@/lib/dateUtils';

describe('Date Utils', () => {
  describe('formatDatePT', () => {
    it('should format date in dd/MM/yyyy format', () => {
      const date = new Date('2024-12-15T10:30:00Z');
      expect(formatDatePT(date)).toMatch(/^\d{2}\/\d{2}\/\d{4}$/);
    });

    it('should handle null values', () => {
      expect(formatDatePT(null)).toBe('-');
    });

    it('should handle undefined values', () => {
      expect(formatDatePT(undefined)).toBe('-');
    });

    it('should handle string dates', () => {
      const result = formatDatePT('2024-12-15');
      expect(result).toMatch(/^\d{2}\/\d{2}\/\d{4}$/);
    });
  });

  describe('formatDateTimePT', () => {
    it('should format datetime in dd/MM/yyyy HH:mm format', () => {
      const date = new Date('2024-12-15T10:30:00Z');
      expect(formatDateTimePT(date)).toMatch(/^\d{2}\/\d{2}\/\d{4} \d{2}:\d{2}$/);
    });

    it('should handle null values', () => {
      expect(formatDateTimePT(null)).toBe('-');
    });
  });

  describe('isOverdue', () => {
    it('should return true for past dates', () => {
      const pastDate = new Date('2020-01-01');
      expect(isOverdue(pastDate)).toBe(true);
    });

    it('should return false for future dates', () => {
      const futureDate = new Date('2099-12-31');
      expect(isOverdue(futureDate)).toBe(false);
    });

    it('should handle null values', () => {
      expect(isOverdue(null)).toBe(false);
    });
  });

  describe('isToday', () => {
    it('should return true for today', () => {
      const today = new Date();
      expect(isToday(today)).toBe(true);
    });

    it('should return false for yesterday', () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      expect(isToday(yesterday)).toBe(false);
    });

    it('should return false for null', () => {
      expect(isToday(null)).toBe(false);
    });
  });

  describe('isNextWeek', () => {
    it('should return true for dates within next 7 days', () => {
      const nextWeek = new Date();
      nextWeek.setDate(nextWeek.getDate() + 3);
      expect(isNextWeek(nextWeek)).toBe(true);
    });

    it('should return false for dates beyond 7 days', () => {
      const farFuture = new Date();
      farFuture.setDate(farFuture.getDate() + 10);
      expect(isNextWeek(farFuture)).toBe(false);
    });

    it('should return false for null', () => {
      expect(isNextWeek(null)).toBe(false);
    });
  });
});
