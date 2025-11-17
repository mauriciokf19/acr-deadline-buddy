import { describe, it, expect } from 'vitest';
import { 
  formatDatePT, 
  formatDateTimePT, 
  isOverdue, 
  isToday, 
  isNextWeek,
  applySilenceWindow,
  calculateReminderBeforeDeadline,
  calculateReminderAfterSend
} from '@/lib/dateUtils';

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

  describe('applySilenceWindow', () => {
    it('should reschedule if within silence window', () => {
      const date = new Date('2024-12-15T22:00:00'); // 22:00
      const result = applySilenceWindow(date, '20:00', '08:00');
      
      // Should be rescheduled to 08:00 next day
      expect(result.getHours()).toBe(8);
      expect(result.getMinutes()).toBe(0);
    });

    it('should not reschedule if outside silence window', () => {
      const date = new Date('2024-12-15T10:00:00'); // 10:00
      const result = applySilenceWindow(date, '20:00', '08:00');
      
      expect(result.getTime()).toBe(date.getTime());
    });

    it('should return original date if no silence window', () => {
      const date = new Date('2024-12-15T22:00:00');
      const result = applySilenceWindow(date, null, null);
      
      expect(result.getTime()).toBe(date.getTime());
    });
  });

  describe('calculateReminderBeforeDeadline', () => {
    it('should calculate reminder 3 days before at 08:00', () => {
      const deadline = new Date('2024-12-20T15:00:00');
      const result = calculateReminderBeforeDeadline(deadline, 3);
      
      expect(result.getDate()).toBe(17); // 3 days before 20th
      expect(result.getHours()).toBe(8);
      expect(result.getMinutes()).toBe(0);
    });

    it('should apply silence window', () => {
      const deadline = new Date('2024-12-20T15:00:00');
      // This would normally be 08:00 on the 17th, but with silence window it stays at 08:00
      const result = calculateReminderBeforeDeadline(deadline, 3, '20:00', '08:00');
      
      expect(result.getHours()).toBe(8);
    });
  });

  describe('calculateReminderAfterSend', () => {
    it('should add hours to send date', () => {
      const sendDate = new Date('2024-12-15T10:00:00');
      const result = calculateReminderAfterSend(sendDate, 48);
      
      expect(result.getDate()).toBe(17); // 2 days later
      expect(result.getHours()).toBe(10); // Same hour
    });

    it('should apply silence window', () => {
      const sendDate = new Date('2024-12-15T20:00:00');
      const result = calculateReminderAfterSend(sendDate, 2, '20:00', '08:00');
      
      // 20:00 + 2h = 22:00, which is in silence window, should reschedule to 08:00 next day
      expect(result.getHours()).toBe(8);
    });
  });
});

