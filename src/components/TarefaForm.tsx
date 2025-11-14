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
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { pt } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { createLog } from "@/lib/logUtils";

const tarefaSchema = z.object({
  titulo: z.string().min(1, "Título é obrigatório"),
  descricao: z.string().optional(),
  obrigacao_id: z.string().optional(),
  deadline: z.date().optional(),
  concluida: z.boolean().default(false),
});

type TarefaFormData = z.infer<typeof tarefaSchema>;

interface TarefaFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tarefa?: any;
  obrigacaoId?: string;
  onSuccess: () => void;
}

export function TarefaForm({ 
  open, 
  onOpenChange, 
  tarefa, 
  obrigacaoId,
  onSuccess 
}: TarefaFormProps) {
  const [loading, setLoading] = useState(false);
  const [obrigacoes, setObrigacoes] = useState<any[]>([]);

  const form = useForm<TarefaFormData>({
    resolver: zodResolver(tarefaSchema),
    defaultValues: {
      titulo: tarefa?.titulo || "",
      descricao: tarefa?.descricao || "",
      obrigacao_id: tarefa?.obrigacao_id || obrigacaoId || "",
      deadline: tarefa?.deadline ? new Date(tarefa.deadline) : undefined,
      concluida: tarefa?.concluida || false,
    },
  });

  useEffect(() => {
    if (!obrigacaoId) {
      loadObrigacoes();
    }
  }, [obrigacaoId]);

  const loadObrigacoes = async () => {
    const { data } = await supabase
      .from("obrigacoes")
      .select("id, titulo")
      .order("titulo");
    setObrigacoes(data || []);
  };

  const onSubmit = async (data: TarefaFormData) => {
    setLoading(true);
    try {
      if (tarefa) {
        const { error } = await supabase
          .from("tarefas")
          .update({
            titulo: data.titulo,
            descricao: data.descricao,
            obrigacao_id: data.obrigacao_id || null,
            deadline: data.deadline ? data.deadline.toISOString() : null,
            concluida: data.concluida,
          })
          .eq("id", tarefa.id);

        if (error) throw error;

        await createLog({
          entidade_tipo: "tarefa",
          entidade_id: tarefa.id,
          acao: "editar",
          detalhes: `Tarefa "${data.titulo}" atualizada`,
        });

        toast.success("Tarefa atualizada com sucesso");
      } else {
        const { data: newTarefa, error } = await supabase
          .from("tarefas")
          .insert({
            titulo: data.titulo,
            descricao: data.descricao,
            obrigacao_id: data.obrigacao_id || null,
            deadline: data.deadline ? data.deadline.toISOString() : null,
            concluida: data.concluida,
          })
          .select()
          .single();

        if (error) throw error;

        await createLog({
          entidade_tipo: "tarefa",
          entidade_id: newTarefa.id,
          acao: "criar",
          detalhes: `Tarefa "${data.titulo}" criada`,
        });

        toast.success("Tarefa criada com sucesso");
      }

      onSuccess();
      onOpenChange(false);
      form.reset();
    } catch (error: any) {
      console.error("Erro ao salvar tarefa:", error);
      toast.error(error.message || "Erro ao salvar tarefa");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {tarefa ? "Editar Tarefa" : "Criar Tarefa"}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="titulo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Título</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: Revisar declaração" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="descricao"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descrição (Opcional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Descrição da tarefa"
                      {...field}
                      rows={3}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {!obrigacaoId && (
              <FormField
                control={form.control}
                name="obrigacao_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Obrigação (Opcional)</FormLabel>
                    <div className="flex gap-2">
                      <Select
                        onValueChange={field.onChange}
                        value={field.value || undefined}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione uma obrigação" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {obrigacoes.filter(o => o.id).map((obrigacao) => (
                            <SelectItem key={obrigacao.id} value={obrigacao.id}>
                              {obrigacao.titulo}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {field.value && (
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          onClick={() => field.onChange(undefined)}
                        >
                          ✕
                        </Button>
                      )}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <FormField
              control={form.control}
              name="deadline"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Data Alvo (Opcional)</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          className={cn(
                            "pl-3 text-left font-normal",
                            !field.value && "text-muted-foreground"
                          )}
                        >
                          {field.value ? (
                            format(field.value, "PPP", { locale: pt })
                          ) : (
                            <span>Selecione a data</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        initialFocus
                        className="pointer-events-auto"
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex gap-2 justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? "A guardar..." : tarefa ? "Atualizar" : "Criar"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
