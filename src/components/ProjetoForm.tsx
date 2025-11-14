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
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { createLog } from "@/lib/logUtils";

const projetoSchema = z.object({
  nome: z.string().min(1, "Nome é obrigatório"),
  descricao: z.string().optional(),
  cliente_id: z.string().optional(),
  pais: z.string().min(1, "País é obrigatório"),
  ano_fiscal: z.number().min(2020).max(2100),
  cor: z.string().default("#3B82F6"),
  ativo: z.boolean().default(true),
});

type ProjetoFormData = z.infer<typeof projetoSchema>;

interface ProjetoFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projeto?: any;
  onSuccess: () => void;
}

export function ProjetoForm({ open, onOpenChange, projeto, onSuccess }: ProjetoFormProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [clientes, setClientes] = useState<any[]>([]);

  const form = useForm<ProjetoFormData>({
    resolver: zodResolver(projetoSchema),
    defaultValues: {
      nome: projeto?.nome || "",
      descricao: projeto?.descricao || "",
      cliente_id: projeto?.cliente_id || "",
      pais: projeto?.pais || "PT",
      ano_fiscal: projeto?.ano_fiscal || new Date().getFullYear(),
      cor: projeto?.cor || "#3B82F6",
      ativo: projeto?.ativo ?? true,
    },
  });

  useEffect(() => {
    loadClientes();
  }, []);

  useEffect(() => {
    if (projeto) {
      form.reset({
        nome: projeto.nome,
        descricao: projeto.descricao || "",
        cliente_id: projeto.cliente_id || "",
        pais: projeto.pais || "PT",
        ano_fiscal: projeto.ano_fiscal || new Date().getFullYear(),
        cor: projeto.cor || "#3B82F6",
        ativo: projeto.ativo ?? true,
      });
    }
  }, [projeto, form]);

  const loadClientes = async () => {
    const { data } = await supabase
      .from("clientes")
      .select("id, nome")
      .order("nome");
    setClientes(data || []);
  };

  const onSubmit = async (data: ProjetoFormData) => {
    setLoading(true);
    try {
      if (projeto) {
        // Editar
        const { error } = await supabase
          .from("projetos")
          .update(data)
          .eq("id", projeto.id);

        if (error) throw error;

        await createLog({
          entidade_tipo: "projeto",
          entidade_id: projeto.id,
          acao: "editar",
          detalhes: `Projeto "${data.nome}" atualizado`,
        });

        toast.success("Projeto atualizado com sucesso");
      } else {
        // Criar - preparar payload sem campos vazios
        const insertPayload: any = {
          nome: data.nome,
          descricao: data.descricao || undefined,
          cliente_id: data.cliente_id || undefined,
          pais: data.pais || undefined, // deixar DB aplicar default se vazio
          ano_fiscal: data.ano_fiscal || undefined, // deixar DB aplicar default se vazio
          cor: data.cor,
          ativo: data.ativo,
        };

        const { data: newProjeto, error } = await supabase
          .from("projetos")
          .insert(insertPayload)
          .select()
          .single();

        if (error) throw error;

        await createLog({
          entidade_tipo: "projeto",
          entidade_id: newProjeto.id,
          acao: "criar",
          detalhes: `Projeto "${data.nome}" criado`,
        });

        toast.success("Projeto criado com sucesso");
      }

      onSuccess();
      onOpenChange(false);
      form.reset();
    } catch (error: any) {
      console.error("Erro ao salvar projeto:", error);
      
      // Mensagens de erro específicas em PT-PT
      if (error.code === 'PGRST301' || error.message?.includes('row-level security')) {
        toast.error("Não foi possível criar o projeto. Verifica a tua sessão e permissões.");
      } else if (error.code === '23505') {
        toast.error("Já existe um projeto com este nome.");
      } else if (error.code === '23502') {
        toast.error("Preenche todos os campos obrigatórios.");
      } else {
        toast.error(error.message || "Erro ao salvar projeto");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {projeto ? "Editar Projeto" : "Criar Projeto"}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="nome"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome do Projeto</FormLabel>
                  <FormControl>
                    <Input placeholder="Nome do projeto" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="cliente_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Cliente (Opcional)</FormLabel>
                  <div className="flex gap-2">
                    <Select
                      onValueChange={field.onChange}
                      value={field.value || undefined}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione um cliente" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {clientes.filter(c => c.id).map((cliente) => (
                          <SelectItem key={cliente.id} value={cliente.id}>
                            {cliente.nome}
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

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="pais"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>País</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
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
                name="ano_fiscal"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Ano Fiscal</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        {...field}
                        onChange={(e) => field.onChange(Number(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="descricao"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descrição (Opcional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Descrição do projeto"
                      {...field}
                      rows={3}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="cor"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Cor</FormLabel>
                  <FormControl>
                    <Input type="color" {...field} />
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
                {loading ? "A guardar..." : projeto ? "Atualizar" : "Criar"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
