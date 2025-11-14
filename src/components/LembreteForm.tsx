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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { createLog } from "@/lib/logUtils";

const lembreteSchema = z.object({
  entidade_tipo: z.enum(["obrigacao", "tarefa"]),
  entidade_id: z.string().min(1, "Entidade é obrigatória"),
  regra: z.string().min(1, "Regra é obrigatória"),
  canal: z.enum(["email", "push"]),
  ativo: z.boolean().default(true),
});

type LembreteFormData = z.infer<typeof lembreteSchema>;

interface LembreteFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lembrete?: any;
  onSuccess: () => void;
}

export function LembreteForm({ 
  open, 
  onOpenChange, 
  lembrete, 
  onSuccess 
}: LembreteFormProps) {
  const [loading, setLoading] = useState(false);
  const [obrigacoes, setObrigacoes] = useState<any[]>([]);
  const [tarefas, setTarefas] = useState<any[]>([]);

  const form = useForm<LembreteFormData>({
    resolver: zodResolver(lembreteSchema),
    defaultValues: {
      entidade_tipo: lembrete?.entidade_tipo || "obrigacao",
      entidade_id: lembrete?.entidade_id || "",
      regra: lembrete?.regra || "",
      canal: lembrete?.canal || "email",
      ativo: lembrete?.ativo ?? true,
    },
  });

  const entidadeTipo = form.watch("entidade_tipo");

  useEffect(() => {
    loadEntidades();
  }, [entidadeTipo]);

  const loadEntidades = async () => {
    if (entidadeTipo === "obrigacao") {
      const { data } = await supabase
        .from("obrigacoes")
        .select("id, titulo")
        .order("titulo");
      setObrigacoes(data || []);
    } else {
      const { data } = await supabase
        .from("tarefas")
        .select("id, titulo")
        .order("titulo");
      setTarefas(data || []);
    }
  };

  const onSubmit = async (data: LembreteFormData) => {
    setLoading(true);
    try {
      if (lembrete) {
        const { error } = await supabase
          .from("lembretes")
          .update({
            entidade_tipo: data.entidade_tipo as any,
            entidade_id: data.entidade_id as any,
            regra: data.regra as any,
            canal: data.canal as any,
            ativo: data.ativo as any,
          } as any)
          .eq("id", lembrete.id);

        if (error) throw error;

        await createLog({
          entidade_tipo: "lembrete",
          entidade_id: lembrete.id,
          acao: "editar",
          detalhes: `Lembrete atualizado`,
        });

        toast.success("Lembrete atualizado com sucesso");
      } else {
        const { data: newLembrete, error } = await supabase
          .from("lembretes")
          .insert({
            entidade_tipo: data.entidade_tipo as any,
            entidade_id: data.entidade_id as any,
            regra: data.regra as any,
            canal: data.canal as any,
            ativo: data.ativo as any,
          } as any)
          .select()
          .single();

        if (error) throw error;

        await createLog({
          entidade_tipo: "lembrete",
          entidade_id: newLembrete.id,
          acao: "criar",
          detalhes: `Lembrete criado`,
        });

        toast.success("Lembrete criado com sucesso");
      }

      onSuccess();
      onOpenChange(false);
      form.reset();
    } catch (error: any) {
      console.error("Erro ao salvar lembrete:", error);
      toast.error(error.message || "Erro ao salvar lembrete");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {lembrete ? "Editar Lembrete" : "Criar Lembrete"}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="entidade_tipo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tipo de Entidade</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o tipo" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="obrigacao">Obrigação</SelectItem>
                      <SelectItem value="tarefa">Tarefa</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="entidade_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    {entidadeTipo === "obrigacao" ? "Obrigação" : "Tarefa"}
                  </FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={`Selecione ${entidadeTipo === "obrigacao" ? "a obrigação" : "a tarefa"}`} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {entidadeTipo === "obrigacao"
                        ? obrigacoes.map((obrigacao) => (
                            <SelectItem key={obrigacao.id} value={obrigacao.id}>
                              {obrigacao.titulo}
                            </SelectItem>
                          ))
                        : tarefas.map((tarefa) => (
                            <SelectItem key={tarefa.id} value={tarefa.id}>
                              {tarefa.titulo}
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
              name="regra"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Regra</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Ex: 3d antes de deadline_interna" 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="canal"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Canal</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o canal" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="email">Email</SelectItem>
                      <SelectItem value="push">Push</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="ativo"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Ativo</FormLabel>
                    <div className="text-sm text-muted-foreground">
                      Ativar ou desativar este lembrete
                    </div>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
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
                {loading ? "A guardar..." : lembrete ? "Atualizar" : "Criar"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
