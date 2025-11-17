import { describe, it, expect } from 'vitest';
import { validateFileUpload, formatFileSize } from '@/lib/uploadValidation';

describe('Upload Validation', () => {
  describe('formatFileSize', () => {
    it('should format bytes correctly', () => {
      expect(formatFileSize(0)).toBe('0 Bytes');
      expect(formatFileSize(1024)).toBe('1 KB');
      expect(formatFileSize(1048576)).toBe('1 MB');
      expect(formatFileSize(5242880)).toBe('5 MB');
    });
  });

  describe('validateFileUpload', () => {
    it('should reject files over 10MB', async () => {
      const largeFile = new File(['x'.repeat(11 * 1024 * 1024)], 'large.pdf', {
        type: 'application/pdf',
      });

      const result = await validateFileUpload(largeFile);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('demasiado grande');
    });

    it('should validate PDF magic bytes', async () => {
      // Create a mock PDF with magic bytes
      const pdfBytes = new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2D, ...new Array(100).fill(0)]);
      const pdfFile = new File([pdfBytes], 'test.pdf', { type: 'application/pdf' });

      const result = await validateFileUpload(pdfFile);
      expect(result.valid).toBe(true);
    });

    it('should validate JPEG magic bytes', async () => {
      const jpegBytes = new Uint8Array([0xFF, 0xD8, 0xFF, ...new Array(100).fill(0)]);
      const jpegFile = new File([jpegBytes], 'test.jpg', { type: 'image/jpeg' });

      const result = await validateFileUpload(jpegFile);
      expect(result.valid).toBe(true);
    });

    it('should validate PNG magic bytes', async () => {
      const pngBytes = new Uint8Array([
        0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A,
        ...new Array(100).fill(0)
      ]);
      const pngFile = new File([pngBytes], 'test.png', { type: 'image/png' });

      const result = await validateFileUpload(pngFile);
      expect(result.valid).toBe(true);
    });

    it('should reject files with invalid magic bytes', async () => {
      const invalidBytes = new Uint8Array([0x00, 0x00, 0x00, ...new Array(100).fill(0)]);
      const invalidFile = new File([invalidBytes], 'fake.pdf', { type: 'application/pdf' });

      const result = await validateFileUpload(invalidFile);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('não suportado');
    });
  });
});
