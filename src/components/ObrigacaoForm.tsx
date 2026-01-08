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
import { CalendarIcon, Search } from "lucide-react";
import { format } from "date-fns";
import { pt } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { createLog } from "@/lib/logUtils";
import { Database } from "@/integrations/supabase/types";
import { isDemoMode } from "@/lib/demoData";
import { demoClient } from "@/lib/demoData";

type TipoObrigacao = Database["public"]["Enums"]["tipo_obrigacao"];
type Periodicidade = Database["public"]["Enums"]["periodicidade"];

// Lista atualizada de tipos de obrigação (inclui os novos)
const TIPOS_OBRIGACAO: TipoObrigacao[] = [
  "iva", "ies", "saft", "modelo_10", "modelo_22", "dmr", "ifs", 
  "retencoes", "modelo_30", "cope", "recapitulativa", "dmis", "iuc", "outro"
];

const TIPOS_LABELS: Record<string, string> = {
  iva: "IVA",
  ies: "IES",
  saft: "SAF-T",
  modelo_10: "Modelo 10",
  modelo_22: "Modelo 22",
  dmr: "DMR",
  ifs: "IFS",
  retencoes: "Retenções",
  modelo_30: "Modelo 30",
  cope: "COPE",
  recapitulativa: "Recapitulativa",
  dmis: "DMIS",
  iuc: "IUC",
  outro: "Outro",
};

const PERIODICIDADES: Periodicidade[] = ["mensal", "trimestral", "anual", "pontual"];

const obrigacaoSchema = z.object({
  titulo: z.string().min(1, "Título é obrigatório"),
  client_id: z.string().min(1, "Seleciona o cliente"),
  tipo: z.string().min(1, "Tipo é obrigatório"),
  periodicidade: z.enum(PERIODICIDADES as [Periodicidade, ...Periodicidade[]]),
  periodo_referencia: z.string().optional(),
  deadline_revisao_senior: z.date(),
  deadline_interna: z.date(),
  deadline_oficial: z.date(),
  prioridade: z.enum(["Alta", "Media", "Baixa"]).default("Media"),
  comentarios: z.string().optional(),
}).refine((data) => {
  return data.deadline_revisao_senior <= data.deadline_interna;
}, {
  message: "Data de revisão deve ser antes ou igual à data interna",
  path: ["deadline_revisao_senior"],
}).refine((data) => {
  return data.deadline_interna <= data.deadline_oficial;
}, {
  message: "Data interna deve ser antes ou igual à data oficial",
  path: ["deadline_interna"],
});

type ObrigacaoFormData = z.infer<typeof obrigacaoSchema>;

interface ObrigacaoFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  obrigacao?: any;
  clientId?: string;
  onSuccess: () => void;
}

export function ObrigacaoForm({ 
  open, 
  onOpenChange, 
  obrigacao, 
  clientId,
  onSuccess 
}: ObrigacaoFormProps) {
  const [loading, setLoading] = useState(false);
  const [clients, setClients] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");

  const form = useForm<ObrigacaoFormData>({
    resolver: zodResolver(obrigacaoSchema),
    defaultValues: {
      titulo: obrigacao?.titulo || "",
      client_id: obrigacao?.client_id || clientId || "",
      tipo: obrigacao?.tipo || "iva",
      periodicidade: obrigacao?.periodicidade || "mensal",
      periodo_referencia: obrigacao?.periodo_referencia || "",
      deadline_revisao_senior: obrigacao?.deadline_revisao_senior ? new Date(obrigacao.deadline_revisao_senior) : new Date(),
      deadline_interna: obrigacao?.deadline_interna ? new Date(obrigacao.deadline_interna) : new Date(),
      deadline_oficial: obrigacao?.deadline_oficial ? new Date(obrigacao.deadline_oficial) : new Date(),
      prioridade: obrigacao?.prioridade || "Media",
      comentarios: obrigacao?.notas || "",
    },
  });

  useEffect(() => {
    if (open) {
      loadClients();
      // Reset form when opening with new data
      form.reset({
        titulo: obrigacao?.titulo || "",
        client_id: obrigacao?.client_id || clientId || "",
        tipo: obrigacao?.tipo || "iva",
        periodicidade: obrigacao?.periodicidade || "mensal",
        periodo_referencia: obrigacao?.periodo_referencia || "",
        deadline_revisao_senior: obrigacao?.deadline_revisao_senior ? new Date(obrigacao.deadline_revisao_senior) : new Date(),
        deadline_interna: obrigacao?.deadline_interna ? new Date(obrigacao.deadline_interna) : new Date(),
        deadline_oficial: obrigacao?.deadline_oficial ? new Date(obrigacao.deadline_oficial) : new Date(),
        prioridade: obrigacao?.prioridade || "Media",
        comentarios: obrigacao?.notas || "",
      });
    }
  }, [open, obrigacao, clientId]);

  const loadClients = async () => {
    if (isDemoMode()) {
      setClients([demoClient]);
      return;
    }
    
    const { data } = await supabase
      .from("clients")
      .select("id, name")
      .is("deleted_at", null)
      .order("name");
    setClients(data || []);
  };

  const filteredClients = clients.filter(client => 
    client.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const onSubmit = async (data: ObrigacaoFormData) => {
    setLoading(true);
    try {
      if (isDemoMode()) {
        // Demo mode - just simulate success
        toast.success(obrigacao ? "Obrigação atualizada com sucesso" : "Obrigação criada com sucesso");
        onSuccess();
        onOpenChange(false);
        form.reset();
        setLoading(false);
        return;
      }

      if (obrigacao) {
        const { error } = await supabase
          .from("obrigacoes")
          .update({
            titulo: data.titulo,
            client_id: data.client_id,
            tipo: data.tipo as TipoObrigacao,
            periodicidade: data.periodicidade,
            periodo_referencia: data.periodo_referencia,
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
        const insertData = {
          titulo: data.titulo,
          client_id: data.client_id,
          projeto_id: data.client_id, // Usa client_id como projeto_id temporariamente (campo obrigatório legado)
          tipo: data.tipo as TipoObrigacao,
          periodicidade: data.periodicidade,
          periodo_referencia: data.periodo_referencia || null,
          notas: data.comentarios || null,
          deadline_revisao_senior: data.deadline_revisao_senior.toISOString(),
          deadline_interna: data.deadline_interna.toISOString(),
          deadline_oficial: data.deadline_oficial.toISOString(),
          estado: "pendente" as const,
        };
        
        const { data: newObrigacao, error } = await supabase
          .from("obrigacoes")
          .insert([insertData])
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
      console.error("Erro ao guardar obrigação:", error);
      toast.error(error.message || "Erro ao guardar obrigação");
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
              name="client_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Cliente *</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value || undefined}
                    disabled={!!clientId}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleciona o cliente" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <div className="px-2 pb-2">
                        <div className="relative">
                          <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                          <Input
                            placeholder="Pesquisar cliente..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-8 h-8"
                          />
                        </div>
                      </div>
                      {filteredClients.filter(c => c.id).map((client) => (
                        <SelectItem key={client.id} value={client.id}>
                          {client.name}
                        </SelectItem>
                      ))}
                      {filteredClients.length === 0 && (
                        <div className="py-2 px-2 text-sm text-muted-foreground text-center">
                          Nenhum cliente encontrado
                        </div>
                      )}
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
                    <FormLabel>Tipo de obrigação</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Tipo" />
                        </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {TIPOS_OBRIGACAO.filter(t => t).map((tipo) => (
                        <SelectItem key={tipo} value={tipo}>
                          {TIPOS_LABELS[tipo] || tipo.toUpperCase()}
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
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Periodicidade" />
                        </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {PERIODICIDADES.filter(p => p).map((per) => (
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
                    value={field.value}
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
              <h4 className="text-sm font-medium">Datas</h4>
              
              <FormField
                control={form.control}
                name="deadline_revisao_senior"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel className="text-info">Data de revisão</FormLabel>
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
                              format(field.value, "dd/MM/yyyy", { locale: pt })
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
                    <FormLabel className="text-warning">Data interna</FormLabel>
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
                              format(field.value, "dd/MM/yyyy", { locale: pt })
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
                    <FormLabel className="text-destructive">Data oficial</FormLabel>
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
                              format(field.value, "dd/MM/yyyy", { locale: pt })
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
                  <FormLabel>Notas</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Notas adicionais..."
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex gap-2 justify-end pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? "A guardar..." : "Guardar"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}