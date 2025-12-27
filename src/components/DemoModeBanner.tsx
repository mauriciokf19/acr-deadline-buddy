import { isDemoMode } from "@/lib/demoData";
import { useDemoStore } from "@/lib/demoStore";
import { Button } from "@/components/ui/button";
import { Beaker, RotateCcw } from "lucide-react";
import { toast } from "sonner";

export function DemoModeBanner() {
  const resetDemoData = useDemoStore((state) => state.resetDemoData);

  if (!isDemoMode()) return null;

  const handleReset = () => {
    resetDemoData();
    toast.success("Dados demo restaurados ao estado inicial");
  };

  return (
    <div className="flex items-center justify-between gap-2 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-400">
      <div className="flex items-center gap-2">
        <Beaker className="h-4 w-4" />
        <span className="text-sm font-medium">Demo Mode</span>
        <span className="text-xs text-muted-foreground">• Dados fictícios para testes</span>
      </div>
      <Button
        variant="ghost"
        size="sm"
        onClick={handleReset}
        className="h-7 gap-1.5 text-amber-700 dark:text-amber-400 hover:bg-amber-500/20"
      >
        <RotateCcw className="h-3.5 w-3.5" />
        <span className="hidden sm:inline">Reiniciar</span>
      </Button>
    </div>
  );
}
