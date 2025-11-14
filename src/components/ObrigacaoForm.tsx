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
import { Database } from "@/integrations/supabase/types";

type TipoObrigacao = Database["public"]["Enums"]["tipo_obrigacao"];
type Periodicidade = Database["public"]["Enums"]["periodicidade"];

const TIPOS_OBRIGACAO: TipoObrigacao[] = ["iva", "ies", "saft", "modelo_10", "modelo_22", "dmr", "ifs", "outro"];
const PERIODICIDADES: Periodicidade[] = ["mensal", "trimestral", "anual", "pontual"];

const obrigacaoSchema = z.object({
  titulo: z.string().min(1, "Título é obrigatório"),
  projeto_id: z.string().min(1, "Projeto é obrigatório"),
  tipo: z.enum(TIPOS_OBRIGACAO as [TipoObrigacao, ...TipoObrigacao[]]),
  periodicidade: z.enum(PERIODICIDADES as [Periodicidade, ...Periodicidade[]]),
  periodo_referencia: z.string().optional(),
  deadline_revisao_senior: z.date(),
  deadline_interna: z.date(),
  deadline_oficial: z.date(),
  prioridade: z.enum(["Alta", "Media", "Baixa"]).default("Media"),
  comentarios: z.string().optional(),
}).refine((data) => {
  return data.deadline_revisao_senior < data.deadline_interna;
}, {
  message: "Deadline de revisão deve ser antes da deadline interna",
  path: ["deadline_revisao_senior"],
}).refine((data) => {
  return data.deadline_interna < data.deadline_oficial;
}, {
  message: "Deadline interna deve ser antes da deadline oficial",
  path: ["deadline_interna"],
});

type ObrigacaoFormData = z.infer<typeof obrigacaoSchema>;

interface ObrigacaoFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  obrigacao?: any;
  projetoId?: string;
  onSuccess: () => void;
}

export function ObrigacaoForm({ 
  open, 
  onOpenChange, 
  obrigacao, 
  projetoId,
  onSuccess 
}: ObrigacaoFormProps) {
  const [loading, setLoading] = useState(false);
  const [projetos, setProjetos] = useState<any[]>([]);

  const form = useForm<ObrigacaoFormData>({
    resolver: zodResolver(obrigacaoSchema),
    defaultValues: {
      titulo: obrigacao?.titulo || "",
      projeto_id: obrigacao?.projeto_id || projetoId || "",
      tipo: obrigacao?.tipo || "iva",
      periodicidade: obrigacao?.periodicidade || "mensal",
      periodo_referencia: obrigacao?.periodo_referencia || "",
      deadline_revisao_senior: obrigacao?.deadline_revisao_senior ? new Date(obrigacao.deadline_revisao_senior) : new Date(),
      deadline_interna: obrigacao?.deadline_interna ? new Date(obrigacao.deadline_interna) : new Date(),
      deadline_oficial: obrigacao?.deadline_oficial ? new Date(obrigacao.deadline_oficial) : new Date(),
      prioridade: obrigacao?.prioridade || "Media",
      comentarios: obrigacao?.comentarios || "",
    },
  });

  useEffect(() => {
    loadProjetos();
  }, []);

  const loadProjetos = async () => {
    const { data } = await supabase
      .from("projetos")
      .select("id, nome")
      .eq("ativo", true)
      .order("nome");
    setProjetos(data || []);
  };

  const onSubmit = async (data: ObrigacaoFormData) => {
    setLoading(true);
    try {
      if (obrigacao) {
        const { error } = await supabase
          .from("obrigacoes")
          .update({
            titulo: data.titulo,
            projeto_id: data.projeto_id,
            tipo: data.tipo,
            periodicidade: data.periodicidade,
            periodo_referencia: data.periodo_referencia,
            prioridade: data.prioridade,
            notas: data.comentarios,
            deadline_revisao_senior: data.deadline_revisao_senior.toISOString(),
            deadline_interna: data.deadline_interna.toISOString(),
            deadline_oficial: data.deadline_oficial.toISOString(),
          })
          .eq("id", obrigacao.id);

        if (error) throw error;

        await createLog({
          entidade_tipo: "obrigacao",
          entidade_id: obrigacao.id,
          acao: "editar",
          detalhes: `Obrigação "${data.titulo}" atualizada`,
        });

        toast.success("Obrigação atualizada com sucesso");
      } else {
        const { data: newObrigacao, error } = await supabase
          .from("obrigacoes")
          .insert({
            titulo: data.titulo,
            projeto_id: data.projeto_id,
            tipo: data.tipo,
            periodicidade: data.periodicidade,
            periodo_referencia: data.periodo_referencia,
            notas: data.comentarios,
            deadline_revisao_senior: data.deadline_revisao_senior.toISOString(),
            deadline_interna: data.deadline_interna.toISOString(),
            deadline_oficial: data.deadline_oficial.toISOString(),
            estado: "pendente",
          })
          .select()
          .single();

        if (error) throw error;

        await createLog({
          entidade_tipo: "obrigacao",
          entidade_id: newObrigacao.id,
          acao: "criar",
          detalhes: `Obrigação "${data.titulo}" criada`,
        });

        toast.success("Obrigação criada com sucesso");
      }

      onSuccess();
      onOpenChange(false);
      form.reset();
    } catch (error: any) {
      console.error("Erro ao salvar obrigação:", error);
      toast.error(error.message || "Erro ao salvar obrigação");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {obrigacao ? "Editar Obrigação" : "Criar Obrigação"}
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
                    <Input placeholder="Ex: IVA Janeiro 2024" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="projeto_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Projeto</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione um projeto" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {projetos.map((projeto) => (
                        <SelectItem key={projeto.id} value={projeto.id}>
                          {projeto.nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="tipo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Tipo" />
                        </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {TIPOS_OBRIGACAO.map((tipo) => (
                        <SelectItem key={tipo} value={tipo}>
                          {tipo.toUpperCase()}
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
                name="periodicidade"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Periodicidade</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Periodicidade" />
                        </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {PERIODICIDADES.map((per) => (
                        <SelectItem key={per} value={per}>
                          {per.charAt(0).toUpperCase() + per.slice(1)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="periodo_referencia"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Período de Referência</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: Janeiro 2024, Q1 2024" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="prioridade"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Prioridade</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Prioridade" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="Alta">Alta</SelectItem>
                      <SelectItem value="Media">Média</SelectItem>
                      <SelectItem value="Baixa">Baixa</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="space-y-3 border-t pt-4">
              <h4 className="text-sm font-medium">Deadlines</h4>
              
              <FormField
                control={form.control}
                name="deadline_revisao_senior"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel className="text-info">Revisão Senior</FormLabel>
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
                    <FormDescription>
                      Data limite para revisão pelo senior
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="deadline_interna"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel className="text-warning">Deadline Interna</FormLabel>
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
                    <FormDescription>
                      Data limite interna
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="deadline_oficial"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel className="text-destructive">Deadline Oficial</FormLabel>
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
                    <FormDescription>
                      Data limite oficial
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="comentarios"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Comentários</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Notas adicionais"
                      {...field}
                      rows={3}
                    />
                  </FormControl>
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
                {loading ? "A guardar..." : obrigacao ? "Atualizar" : "Criar"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
