/**
 * Server-side upload validation with magic byte checking
 */

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

interface ValidationResult {
  valid: boolean;
  error?: string;
}

/**
 * Check file magic bytes to verify actual file type
 */
async function checkMagicBytes(file: File): Promise<string | null> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    
    reader.onloadend = (e) => {
      if (!e.target?.result) {
        resolve(null);
        return;
      }

      const arr = new Uint8Array(e.target.result as ArrayBuffer);
      
      // PDF: %PDF- (25 50 44 46 2D)
      if (arr.length >= 5 &&
          arr[0] === 0x25 && arr[1] === 0x50 && 
          arr[2] === 0x44 && arr[3] === 0x46 && arr[4] === 0x2D) {
        resolve('application/pdf');
        return;
      }

      // JPEG: FF D8 FF
      if (arr.length >= 3 &&
          arr[0] === 0xFF && arr[1] === 0xD8 && arr[2] === 0xFF) {
        resolve('image/jpeg');
        return;
      }

      // PNG: 89 50 4E 47 0D 0A 1A 0A
      if (arr.length >= 8 &&
          arr[0] === 0x89 && arr[1] === 0x50 && arr[2] === 0x4E && arr[3] === 0x47 &&
          arr[4] === 0x0D && arr[5] === 0x0A && arr[6] === 0x1A && arr[7] === 0x0A) {
        resolve('image/png');
        return;
      }

      resolve(null);
    };

    // Read first 16 bytes for magic number detection
    reader.readAsArrayBuffer(file.slice(0, 16));
  });
}

/**
 * Validate file upload (client-side + magic bytes)
 */
export async function validateFileUpload(file: File): Promise<ValidationResult> {
  // Size validation
  if (file.size > MAX_FILE_SIZE) {
    return {
      valid: false,
      error: 'Ficheiro demasiado grande (máx 10MB).'
    };
  }

  // Magic byte validation
  const actualType = await checkMagicBytes(file);
  
  if (!actualType) {
    return {
      valid: false,
      error: 'Tipo de ficheiro não suportado (permitido: PDF, JPG, PNG).'
    };
  }

  // Verify MIME type matches magic bytes
  const allowedTypes: Record<string, string[]> = {
    'application/pdf': ['application/pdf'],
    'image/jpeg': ['image/jpeg', 'image/jpg'],
    'image/png': ['image/png'],
  };

  const expectedMimes = allowedTypes[actualType] || [];
  if (!expectedMimes.includes(file.type)) {
    return {
      valid: false,
      error: `Extensão de ficheiro não corresponde ao conteúdo. Esperado: ${actualType}, recebido: ${file.type}`
    };
  }

  return { valid: true };
}

/**
 * Format file size for display
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}
