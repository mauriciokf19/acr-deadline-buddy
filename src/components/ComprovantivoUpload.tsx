import { useState } from "react";
import { Upload, File, X, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { validateFileUpload, formatFileSize } from "@/lib/uploadValidation";

interface ComprovantivoUploadProps {
  obrigacaoId: string;
  onUploadComplete?: (path: string) => void;
  existingFile?: {
    path: string;
    name: string;
    size: number;
  };
}

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
];

export function ComprovantivoUpload({
  obrigacaoId,
  onUploadComplete,
  existingFile,
}: ComprovantivoUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [file, setFile] = useState<File | null>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    // Server-side validation with magic bytes
    const validation = await validateFileUpload(selectedFile);
    if (!validation.valid) {
      toast.error(validation.error);
      return;
    }

    setFile(selectedFile);
  };

  const handleUpload = async () => {
    if (!file) return;

    setUploading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      // Secure path: {user_id}/{obrigacao_id}/{filename}
      const filePath = `${user.id}/${obrigacaoId}/${file.name}`;

      const { error: uploadError } = await supabase.storage
        .from("comprovativos")
        .upload(filePath, file, {
          cacheControl: "3600",
          upsert: false,
        });

      if (uploadError) throw uploadError;

      // Update obrigacao with file metadata
      const { error: updateError } = await supabase
        .from("obrigacoes")
        .update({
          comprovativo_storage_path: filePath,
          comprovativo_nome_original: file.name,
          comprovativo_size_bytes: file.size,
          comprovativo_mime: file.type,
          comprovativo_uploaded_at: new Date().toISOString(),
          comprovativo_uploaded_by: user.id,
        })
        .eq("id", obrigacaoId);

      if (updateError) throw updateError;

      toast.success("Comprovativo enviado com sucesso!");
      onUploadComplete?.(filePath);
      setFile(null);
    } catch (error: any) {
      console.error("Erro ao enviar comprovativo:", error);
      toast.error(error.message || "Erro ao enviar arquivo");
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = async () => {
    if (!existingFile) return;

    try {
      const { error } = await supabase.storage
        .from("comprovativos")
        .remove([existingFile.path]);

      if (error) throw error;

      // Clear metadata from obrigacao
      const { error: updateError } = await supabase
        .from("obrigacoes")
        .update({
          comprovativo_storage_path: null,
          comprovativo_nome_original: null,
          comprovativo_size_bytes: null,
          comprovativo_mime: null,
          comprovativo_uploaded_at: null,
          comprovativo_uploaded_by: null,
        })
        .eq("id", obrigacaoId);

      if (updateError) throw updateError;

      toast.success("Comprovativo removido");
      onUploadComplete?.(null as any);
    } catch (error: any) {
      console.error("Erro ao remover comprovativo:", error);
      toast.error("Erro ao remover arquivo");
    }
  };

  const downloadFile = async () => {
    if (!existingFile) return;

    try {
      const { data, error } = await supabase.storage
        .from("comprovativos")
        .createSignedUrl(existingFile.path, 300); // 5 minutes

      if (error) throw error;

      window.open(data.signedUrl, "_blank");
    } catch (error: any) {
      console.error("Erro ao baixar comprovativo:", error);
      toast.error("Erro ao baixar arquivo");
    }
  };

  if (existingFile) {
    return (
      <div className="flex items-center gap-2 p-3 border rounded-lg bg-muted/50">
        <File className="h-5 w-5 text-muted-foreground" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">{existingFile.name}</p>
          <p className="text-xs text-muted-foreground">
            {(existingFile.size / 1024).toFixed(1)} KB
          </p>
        </div>
        <Button size="sm" variant="outline" onClick={downloadFile}>
          Download
        </Button>
        <Button size="sm" variant="ghost" onClick={handleRemove}>
          <X className="h-4 w-4" />
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <input
          type="file"
          id={`file-${obrigacaoId}`}
          accept={ALLOWED_TYPES.join(",")}
          onChange={handleFileSelect}
          className="hidden"
        />
        <label
          htmlFor={`file-${obrigacaoId}`}
          className={cn(
            "flex-1 flex items-center justify-center gap-2 p-4 border-2 border-dashed rounded-lg cursor-pointer transition-colors",
            file
              ? "border-primary bg-primary/5"
              : "border-muted-foreground/25 hover:border-primary/50"
          )}
        >
          {file ? (
            <>
              <Check className="h-5 w-5 text-primary" />
              <span className="text-sm font-medium">{file.name}</span>
            </>
          ) : (
            <>
              <Upload className="h-5 w-5 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">
                Selecionar arquivo (PDF, JPEG, PNG, WEBP)
              </span>
            </>
          )}
        </label>
      </div>

      {file && (
        <div className="flex gap-2">
          <Button
            onClick={handleUpload}
            disabled={uploading}
            className="flex-1"
          >
            {uploading ? "Enviando..." : "Enviar Comprovativo"}
          </Button>
          <Button
            variant="outline"
            onClick={() => setFile(null)}
            disabled={uploading}
          >
            Cancelar
          </Button>
        </div>
      )}
    </div>
  );
}
