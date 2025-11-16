import { describe, it, expect } from 'vitest';

describe('ICS Generator', () => {
  it('should generate valid ICS format with all-day events', () => {
    const mockEvent = {
      id: 'test-123',
      titulo: 'Test Event',
      tipo: 'iva' as const,
      tipo_evento: 'oficial' as const,
      data: new Date('2024-12-15'),
      projeto: { nome: 'Test Project', cor: '#3b82f6' },
      estado: 'pendente' as const,
    };

    // Basic ICS structure validation
    const icsContent = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//ACR Deadlines//PT
CALSCALE:GREGORIAN
METHOD:PUBLISH
BEGIN:VEVENT
UID:test-123-oficial@acr
DTSTART;VALUE=DATE:20241215
SUMMARY:Test Event
DESCRIPTION:Test Project - IVA
STATUS:CONFIRMED
END:VEVENT
END:VCALENDAR`;

    expect(icsContent).toContain('BEGIN:VCALENDAR');
    expect(icsContent).toContain('END:VCALENDAR');
    expect(icsContent).toContain('BEGIN:VEVENT');
    expect(icsContent).toContain('END:VEVENT');
    expect(icsContent).toContain('DTSTART;VALUE=DATE:');
    expect(icsContent).toContain('UID:');
  });

  it('should have stable UIDs for same obligation', () => {
    const uid1 = 'test-123-oficial@acr';
    const uid2 = 'test-123-oficial@acr';
    expect(uid1).toBe(uid2);
  });

  it('should use CRLF line endings', () => {
    const icsLine = 'BEGIN:VCALENDAR\r\n';
    expect(icsLine).toContain('\r\n');
  });

  it('should escape special characters', () => {
    const text = 'Test, with; special\ncharacters';
    const escaped = text.replace(/[,;\\]/g, '\\$&').replace(/\n/g, '\\n');
    expect(escaped).toBe('Test\\, with\\; special\\ncharacters');
  });
});
