import { useState } from "react";
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
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { pt } from "date-fns/locale";
import { cn } from "@/lib/utils";

interface SubmeterModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (date: Date) => void;
  loading?: boolean;
}

export function SubmeterModal({ open, onOpenChange, onConfirm, loading }: SubmeterModalProps) {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  const handleConfirm = () => {
    onConfirm(selectedDate);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Data de Submissão</DialogTitle>
          <DialogDescription>
            Para marcar como Submetido, é necessário preencher a data de submissão.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <label className="text-sm font-medium mb-2 block">
            Selecione a data de submissão:
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

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            Cancelar
          </Button>
          <Button onClick={handleConfirm} disabled={loading}>
            {loading ? "A submeter..." : "Confirmar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
