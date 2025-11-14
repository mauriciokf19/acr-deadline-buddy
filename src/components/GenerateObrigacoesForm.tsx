import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { createLog } from "@/lib/logUtils";
import {
  calculateDeadlineOficial,
  calculateDeadlineInterna,
  calculateDeadlineRevisao,
  formatPeriodoReferencia,
} from "@/lib/deadlineCalculator";

const generateSchema = z.object({
  projeto_id: z.string().min(1, "Projeto é obrigatório"),
  ano_fiscal: z.number().min(2000).max(2100),
  periodos: z.array(z.number()).min(1, "Selecione pelo menos um período"),
});

type GenerateFormData = z.infer<typeof generateSchema>;

interface GenerateObrigacoesFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  template: any;
  onSuccess: () => void;
}

export function GenerateObrigacoesForm({
  open,
  onOpenChange,
  template,
  onSuccess,
}: GenerateObrigacoesFormProps) {
  const [loading, setLoading] = useState(false);
  const [projetos, setProjetos] = useState<any[]>([]);
  const currentYear = new Date().getFullYear();

  const form = useForm<GenerateFormData>({
    resolver: zodResolver(generateSchema),
    defaultValues: {
      projeto_id: "",
      ano_fiscal: currentYear,
      periodos: [],
    },
  });

  useEffect(() => {
    if (open) {
      loadProjetos();
      // Pre-select all periods based on periodicity
      if (template) {
        const allPeriods = getPeriodOptions(template.periodicidade).map(p => p.value);
        form.setValue("periodos", allPeriods);
      }
    }
  }, [open, template]);

  const loadProjetos = async () => {
    const { data } = await supabase
      .from("projetos")
      .select("id, nome, cliente_id, clientes(nome)")
      .eq("ativo", true)
      .order("nome");
    setProjetos(data || []);
  };

  const getPeriodOptions = (periodicidade: string) => {
    if (periodicidade === "mensal") {
      return Array.from({ length: 12 }, (_, i) => ({
        value: i + 1,
        label: `Mês ${i + 1}`,
      }));
    } else if (periodicidade === "trimestral") {
      return Array.from({ length: 4 }, (_, i) => ({
        value: i + 1,
        label: `T${i + 1}`,
      }));
    } else if (periodicidade === "anual") {
      return [{ value: 1, label: "Anual" }];
    }
    return [];
  };

  const selectedPeriods = form.watch("periodos") || [];
  const previewCount = selectedPeriods.length;

  const onSubmit = async (data: GenerateFormData) => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Utilizador não autenticado");

      let generatedCount = 0;
      const obrigacoesIds: string[] = [];

      // Generate obligations for each selected period
      for (const periodo of data.periodos) {
        const periodoRef = formatPeriodoReferencia(
          template.periodicidade,
          periodo,
          data.ano_fiscal
        );

        // Check if already exists (idempotency)
        const { data: existing } = await supabase
          .from("obrigacoes")
          .select("id")
          .eq("projeto_id", data.projeto_id)
          .eq("tipo", template.tipo_obrigacao)
          .eq("periodo_referencia", periodoRef)
          .maybeSingle();

        if (existing) {
          console.log(`Obrigação já existe: ${periodoRef}`);
          continue;
        }

        // Calculate deadlines
        const deadlineOficial = calculateDeadlineOficial(
          template.regra_deadline_oficial,
          template.periodicidade,
          periodo,
          data.ano_fiscal
        );
        const deadlineInterna = calculateDeadlineInterna(
          deadlineOficial,
          template.offset_interna
        );
        const deadlineRevisao = calculateDeadlineRevisao(
          deadlineInterna,
          template.offset_revisao
        );

        // Get project info for title
        const projeto = projetos.find(p => p.id === data.projeto_id);
        const titulo = `${template.tipo_obrigacao.toUpperCase()} ${periodoRef} - ${projeto?.nome || ""}`;

        // Create obligation
        const { data: newObrigacao, error } = await supabase
          .from("obrigacoes")
          .insert({
            projeto_id: data.projeto_id,
            tipo: template.tipo_obrigacao,
            periodicidade: template.periodicidade,
            periodo_referencia: periodoRef,
            titulo,
            deadline_oficial: deadlineOficial.toISOString(),
            deadline_interna: deadlineInterna.toISOString(),
            deadline_revisao_senior: deadlineRevisao.toISOString(),
            estado: "pendente",
            created_by: user.id,
          })
          .select()
          .single();

        if (error) throw error;

        obrigacoesIds.push(newObrigacao.id);
        generatedCount++;

        // Create log for each generated obligation
        await createLog({
          entidade_tipo: "obrigacao",
          entidade_id: newObrigacao.id,
          acao: "criar",
          detalhes: `Gerada a partir do template "${template.nome}"`,
        });
      }

      // Criar entrada em template_instancias
      if (generatedCount > 0) {
        await supabase.from("template_instancias").insert({
          template_id: template.id,
          projeto_id: data.projeto_id,
          ano_fiscal: data.ano_fiscal,
          parametros_json: {
            periodos_selecionados: data.periodos,
            periodicidade: template.periodicidade,
            obrigacoes_ids: obrigacoesIds,
          },
          obrigacoes_geradas: generatedCount,
        });

        const projeto = projetos.find(p => p.id === data.projeto_id);
        toast.success(
          `Foram geradas ${generatedCount} obrigações para ${projeto?.nome}/${data.ano_fiscal}`
        );
      } else {
        toast.info("Nenhuma obrigação nova foi gerada (todas já existem)");
      }

      onSuccess();
      onOpenChange(false);
      form.reset();
    } catch (error: any) {
      console.error("Erro ao gerar obrigações:", error);
      toast.error(error.message || "Erro ao gerar obrigações");
    } finally {
      setLoading(false);
    }
  };

  if (!template) return null;

  const periodOptions = getPeriodOptions(template.periodicidade);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Gerar Obrigações</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                Template: <span className="font-medium">{template.nome}</span>
              </p>
              <p className="text-xs text-muted-foreground">
                {template.tipo_obrigacao.toUpperCase()} • {template.periodicidade}
              </p>
            </div>

            <FormField
              control={form.control}
              name="projeto_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Projeto *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o projeto" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {projetos.map((projeto) => (
                        <SelectItem key={projeto.id} value={projeto.id}>
                          {projeto.nome}
                          {projeto.clientes && ` - ${projeto.clientes.nome}`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="ano_fiscal"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Ano Fiscal *</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      {...field}
                      onChange={(e) => field.onChange(parseInt(e.target.value))}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="periodos"
              render={() => (
                <FormItem>
                  <FormLabel>Períodos *</FormLabel>
                  <FormDescription>
                    Selecione os períodos para gerar obrigações
                  </FormDescription>
                  <div className="grid grid-cols-3 gap-2 mt-2">
                    {periodOptions.map((option) => (
                      <FormField
                        key={option.value}
                        control={form.control}
                        name="periodos"
                        render={({ field }) => (
                          <FormItem className="flex items-center space-x-2 space-y-0">
                            <FormControl>
                              <Checkbox
                                checked={field.value?.includes(option.value)}
                                onCheckedChange={(checked) => {
                                  const newValue = checked
                                    ? [...(field.value || []), option.value]
                                    : field.value?.filter((v) => v !== option.value);
                                  field.onChange(newValue);
                                }}
                              />
                            </FormControl>
                            <FormLabel className="font-normal text-sm">
                              {option.label}
                            </FormLabel>
                          </FormItem>
                        )}
                      />
                    ))}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            {previewCount > 0 && (
              <div className="rounded-lg bg-muted p-3">
                <p className="text-sm font-medium">Pré-visualização</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Serão criadas <span className="font-semibold">{previewCount}</span> obrigações
                </p>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={loading}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={loading || previewCount === 0}>
                {loading ? "A gerar..." : "Gerar Obrigações"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
