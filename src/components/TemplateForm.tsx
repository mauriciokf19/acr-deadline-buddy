import { useState } from "react";
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
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { createLog } from "@/lib/logUtils";
import { Database } from "@/integrations/supabase/types";

type TipoObrigacao = Database["public"]["Enums"]["tipo_obrigacao"];
type Periodicidade = Database["public"]["Enums"]["periodicidade"];

const TIPOS_OBRIGACAO: TipoObrigacao[] = ["iva", "ies", "saft", "modelo_10", "modelo_22", "dmr", "ifs", "outro"];
const PERIODICIDADES: Periodicidade[] = ["mensal", "trimestral", "anual", "pontual"];

const templateSchema = z.object({
  nome: z.string().min(1, "Nome é obrigatório"),
  pais: z.string().min(1, "País é obrigatório"),
  tipo_obrigacao: z.enum(TIPOS_OBRIGACAO as [TipoObrigacao, ...TipoObrigacao[]]),
  periodicidade: z.enum(PERIODICIDADES as [Periodicidade, ...Periodicidade[]]),
  regra_deadline_oficial: z.string().min(1, "Regra de deadline é obrigatória"),
  offset_interna: z.number().min(0),
  offset_revisao: z.number().min(0),
  notas: z.string().optional(),
});

type TemplateFormData = z.infer<typeof templateSchema>;

interface TemplateFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  template?: any;
  onSuccess: () => void;
}

export function TemplateForm({ open, onOpenChange, template, onSuccess }: TemplateFormProps) {
  const [loading, setLoading] = useState(false);

  const form = useForm<TemplateFormData>({
    resolver: zodResolver(templateSchema),
    defaultValues: {
      nome: template?.nome || "",
      pais: template?.pais || "PT",
      tipo_obrigacao: template?.tipo_obrigacao || "iva",
      periodicidade: template?.periodicidade || "mensal",
      regra_deadline_oficial: template?.regra_deadline_oficial || "",
      offset_interna: template?.offset_interna || 3,
      offset_revisao: template?.offset_revisao || 2,
      notas: template?.notas || "",
    },
  });

  const onSubmit = async (data: TemplateFormData) => {
    setLoading(true);
    try {
      if (template) {
        const { error } = await supabase
          .from("templates" as any)
          .update(data)
          .eq("id", template.id);

        if (error) throw error;

        await createLog({
          entidade_tipo: "template",
          entidade_id: template.id,
          acao: "editar",
          detalhes: `Template "${data.nome}" atualizado`,
        });

        toast.success("Template atualizado com sucesso");
      } else {
        const { data: newTemplate, error } = await supabase
          .from("templates" as any)
          .insert(data)
          .select()
          .single();

        if (error) throw error;

        await createLog({
          entidade_tipo: "template",
          entidade_id: (newTemplate as any).id,
          acao: "criar",
          detalhes: `Template "${data.nome}" criado`,
        });

        toast.success("Template criado com sucesso");
      }

      onSuccess();
      onOpenChange(false);
      form.reset();
    } catch (error: any) {
      console.error("Erro ao salvar template:", error);
      toast.error(error.message || "Erro ao salvar template");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {template ? "Editar Template" : "Criar Template"}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="nome"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome do Template</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: IVA Mensal PT" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="pais"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>País</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="País" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="PT">Portugal</SelectItem>
                        <SelectItem value="ES">Espanha</SelectItem>
                        <SelectItem value="FR">França</SelectItem>
                        <SelectItem value="UK">Reino Unido</SelectItem>
                        <SelectItem value="OTHER">Outro</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="tipo_obrigacao"
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
            </div>

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

            <FormField
              control={form.control}
              name="regra_deadline_oficial"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Regra de Deadline Oficial</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Ex: dia 10 do mês seguinte" 
                      {...field} 
                    />
                  </FormControl>
                  <FormDescription>
                    Descrição da regra para calcular a deadline oficial
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="offset_interna"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Offset Interna (dias)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        {...field}
                        onChange={(e) => field.onChange(Number(e.target.value))}
                      />
                    </FormControl>
                    <FormDescription>
                      Dias antes da oficial
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="offset_revisao"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Offset Revisão (dias)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        {...field}
                        onChange={(e) => field.onChange(Number(e.target.value))}
                      />
                    </FormControl>
                    <FormDescription>
                      Dias antes da interna
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="notas"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notas (Opcional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Notas adicionais sobre o template"
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
                {loading ? "A guardar..." : template ? "Atualizar" : "Criar"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
