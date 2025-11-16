import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, AlertCircle } from "lucide-react";
import { format } from "date-fns";
import { pt } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { ComprovantivoUpload } from "@/components/ComprovantivoUpload";
import { supabase } from "@/lib/supabase";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface SubmeterModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (date: Date) => void;
  loading?: boolean;
  obrigacaoId: string;
  hasComprovativo: boolean;
}

export function SubmeterModal({ 
  open, 
  onOpenChange, 
  onConfirm, 
  loading,
  obrigacaoId,
  hasComprovativo: initialHasComprovativo
}: SubmeterModalProps) {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [requireComprovativo, setRequireComprovativo] = useState(false);
  const [hasComprovativo, setHasComprovativo] = useState(initialHasComprovativo);
  const [loadingSettings, setLoadingSettings] = useState(true);

  useEffect(() => {
    if (open) {
      loadUserSettings();
      setHasComprovativo(initialHasComprovativo);
    }
  }, [open, initialHasComprovativo]);

  const loadUserSettings = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from("profiles")
        .select("exigir_comprovativo_para_submetido")
        .eq("id", user.id)
        .single();

      setRequireComprovativo(data?.exigir_comprovativo_para_submetido || false);
    } catch (error) {
      console.error("Erro ao carregar definições:", error);
    } finally {
      setLoadingSettings(false);
    }
  };

  const handleUploadComplete = () => {
    setHasComprovativo(true);
  };

  const canConfirm = selectedDate && (!requireComprovativo || hasComprovativo);

  const handleConfirm = () => {
    onConfirm(selectedDate);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Submeter Obrigação</DialogTitle>
          <DialogDescription>
            Preencha a data de submissão{requireComprovativo ? " e anexe o comprovativo" : ""} para marcar como Submetido.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Data de submissão */}
          <div>
            <label className="text-sm font-medium mb-2 block">
              Data de submissão <span className="text-destructive">*</span>
            </label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !selectedDate && "text-muted-foreground"
                  )}
                  aria-label="Selecionar data de submissão"
                  disabled={loadingSettings}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {selectedDate ? (
                    format(selectedDate, "PPP", { locale: pt })
                  ) : (
                    <span>Selecione a data</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={(date) => date && setSelectedDate(date)}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Comprovativo (se exigido) */}
          {requireComprovativo && !loadingSettings && (
            <div>
              <label className="text-sm font-medium mb-2 block">
                Comprovativo <span className="text-destructive">*</span>
              </label>
              
              {!hasComprovativo && (
                <Alert className="mb-4">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    É obrigatório anexar um comprovativo antes de submeter. Carregue um ficheiro PDF, JPG ou PNG (máx. 10MB).
                  </AlertDescription>
                </Alert>
              )}

              <ComprovantivoUpload
                obrigacaoId={obrigacaoId}
                onUploadComplete={handleUploadComplete}
                existingFile={hasComprovativo ? { path: "", name: "Comprovativo anexado", size: 0 } : undefined}
              />
            </div>
          )}

          {/* Aviso se faltar algo */}
          {!canConfirm && !loadingSettings && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                {!selectedDate && "Selecione a data de submissão. "}
                {requireComprovativo && !hasComprovativo && "Anexe o comprovativo antes de submeter."}
              </AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            Cancelar
          </Button>
          <Button 
            onClick={handleConfirm} 
            disabled={loading || !canConfirm || loadingSettings}
          >
            {loading ? "A submeter..." : "Confirmar Submissão"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
