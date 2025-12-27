import { Layout } from "@/components/Layout";
import { useParams, Link } from "react-router-dom";
import { useClient, useClientContacts, useCreateContact, useUpdateContact, useDeleteContact } from "@/hooks/useClients";
import { useClientActivity } from "@/hooks/useActivityLog";
import { formatDateTimePT, formatDatePT } from "@/lib/gmailProvider";
import { DemoModeBanner } from "@/components/DemoModeBanner";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { 
  ArrowLeft,
  Building2,
  Mail,
  Phone,
  MapPin,
  FileText,
  User,
  Clock,
  Plus,
  Pencil,
  Trash2,
  AlertCircle,
  CheckCircle,
  Calendar
} from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";

export default function ClientDetail() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  
  const { data: client, isLoading } = useClient(id!);
  const { data: contacts, refetch: refetchContacts } = useClientContacts(id!);
  const { data: activities } = useClientActivity(id!);
  
  const createContact = useCreateContact();
  const updateContact = useUpdateContact();
  const deleteContact = useDeleteContact();

  // State for KPIs
  const [kpis, setKpis] = useState({ overdue: 0, today: 0, next7Days: 0, open: 0 });
  const [obrigacoes, setObrigacoes] = useState<any[]>([]);
  const [documents, setDocuments] = useState<any[]>([]);

  // Contact dialog state
  const [contactDialogOpen, setContactDialogOpen] = useState(false);
  const [editingContact, setEditingContact] = useState<any>(null);
  const [contactForm, setContactForm] = useState({
    name: "",
    email: "",
    phone: "",
    role: "",
  });

  // Load related data
  useEffect(() => {
    if (!id) return;
    
    const loadData = async () => {
      // Load obrigações linked to this client via work_item_links
      const { data: links } = await supabase
        .from("work_item_links")
        .select("external_id, external_table")
        .eq("client_id", id)
        .eq("external_table", "obrigacoes");

      if (links && links.length > 0) {
        const obrigacaoIds = links.map(l => l.external_id);
        const { data: obrigsData } = await supabase
          .from("obrigacoes")
          .select("*")
          .in("id", obrigacaoIds)
          .is("deleted_at", null);
        
        if (obrigsData) {
          setObrigacoes(obrigsData);
          
          const now = new Date();
          const todayStr = now.toISOString().split("T")[0];
          const next7Days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
          
          setKpis({
            overdue: obrigsData.filter(o => o.deadline_oficial < todayStr && o.estado !== "concluido").length,
            today: obrigsData.filter(o => o.deadline_oficial.startsWith(todayStr)).length,
            next7Days: obrigsData.filter(o => o.deadline_oficial > todayStr && o.deadline_oficial <= next7Days).length,
            open: obrigsData.filter(o => o.estado !== "concluido").length,
          });
        }
      }

      // Load documents
      const { data: docs } = await supabase
        .from("files")
        .select("*")
        .eq("client_id", id)
        .order("uploaded_at", { ascending: false });
      
      if (docs) setDocuments(docs);
    };

    loadData();
  }, [id]);

  const handleSaveContact = async () => {
    if (!contactForm.name.trim()) return;
    
    try {
      if (editingContact) {
        await updateContact.mutateAsync({
          id: editingContact.id,
          ...contactForm,
        });
        toast.success("Contacto atualizado!");
      } else {
        await createContact.mutateAsync({
          client_id: id!,
          ...contactForm,
        });
        toast.success("Contacto criado!");
      }
      
      setContactDialogOpen(false);
      setEditingContact(null);
      setContactForm({ name: "", email: "", phone: "", role: "" });
      refetchContacts();
    } catch (error: any) {
      toast.error(error.message || "Erro ao guardar contacto");
    }
  };

  const handleEditContact = (contact: any) => {
    setEditingContact(contact);
    setContactForm({
      name: contact.name || "",
      email: contact.email || "",
      phone: contact.phone || "",
      role: contact.role || "",
    });
    setContactDialogOpen(true);
  };

  const handleDeleteContact = async (contactId: string) => {
    if (!confirm("Tens a certeza que queres apagar este contacto?")) return;
    
    try {
      await deleteContact.mutateAsync(contactId);
      toast.success("Contacto apagado!");
      refetchContacts();
    } catch (error: any) {
      toast.error(error.message || "Erro ao apagar contacto");
    }
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="container mx-auto p-4 space-y-4">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-32 w-full" />
        </div>
      </Layout>
    );
  }

  if (!client) {
    return (
      <Layout>
        <div className="container mx-auto p-4 text-center py-16">
          <p className="text-muted-foreground">Cliente não encontrado</p>
          <Button variant="link" asChild>
            <Link to="/clientes">Voltar aos clientes</Link>
          </Button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto p-4 space-y-6">
        <DemoModeBanner />
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild aria-label="Voltar">
            <Link to="/clientes">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Building2 className="h-6 w-6" />
              {client.name}
            </h1>
            {client.vat_number && (
              <p className="text-sm text-muted-foreground">NIF: {client.vat_number}</p>
            )}
          </div>
        </div>

        {/* Quick Info */}
        <div className="flex flex-wrap gap-4 text-sm">
          {client.email && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Mail className="h-4 w-4" />
              <a href={`mailto:${client.email}`} className="hover:underline">{client.email}</a>
            </div>
          )}
          {client.phone && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Phone className="h-4 w-4" />
              <a href={`tel:${client.phone}`} className="hover:underline">{client.phone}</a>
            </div>
          )}
          {client.address && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <MapPin className="h-4 w-4" />
              {client.address}
            </div>
          )}
        </div>

        {/* Tabs */}
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview">Resumo</TabsTrigger>
            <TabsTrigger value="activity">Atividade</TabsTrigger>
            <TabsTrigger value="obrigacoes">Obrigações</TabsTrigger>
            <TabsTrigger value="documents">Documentos</TabsTrigger>
            <TabsTrigger value="contacts">Contactos</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-destructive flex items-center gap-2">
                    <AlertCircle className="h-4 w-4" />
                    Atrasadas
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold">{kpis.overdue}</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-warning flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Vencem Hoje
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold">{kpis.today}</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-info flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    Próximos 7 dias
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold">{kpis.next7Days}</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <CheckCircle className="h-4 w-4" />
                    Em aberto
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold">{kpis.open}</p>
                </CardContent>
              </Card>
            </div>

            {client.notes && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Notas</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">{client.notes}</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Activity Tab */}
          <TabsContent value="activity" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Timeline de Atividade</CardTitle>
                <CardDescription>Histórico de ações relacionadas com este cliente</CardDescription>
              </CardHeader>
              <CardContent>
                {activities && activities.length > 0 ? (
                  <div className="space-y-4">
                    {activities.map((activity: any) => (
                      <div key={activity.id} className="flex gap-4 pb-4 border-b last:border-0">
                        <div className="flex-shrink-0">
                          <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
                            <Clock className="h-4 w-4 text-muted-foreground" />
                          </div>
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium">{activity.action}</p>
                          <p className="text-xs text-muted-foreground">
                            {formatDateTimePT(activity.created_at)}
                          </p>
                          {activity.metadata && Object.keys(activity.metadata).length > 0 && (
                            <p className="text-xs text-muted-foreground mt-1">
                              {JSON.stringify(activity.metadata)}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    Sem atividade registada
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Obrigações Tab */}
          <TabsContent value="obrigacoes" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Obrigações Associadas</CardTitle>
              </CardHeader>
              <CardContent>
                {obrigacoes.length > 0 ? (
                  <div className="space-y-2">
                    {obrigacoes.map((obrigacao) => (
                      <div 
                        key={obrigacao.id} 
                        className="flex items-center justify-between p-3 rounded-lg border"
                      >
                        <div>
                          <p className="font-medium text-sm">{obrigacao.titulo}</p>
                          <p className="text-xs text-muted-foreground">
                            {obrigacao.tipo} · {formatDatePT(obrigacao.deadline_oficial)}
                          </p>
                        </div>
                        <Badge variant={
                          obrigacao.estado === "concluido" ? "default" :
                          obrigacao.estado === "atrasado" ? "destructive" : "secondary"
                        }>
                          {obrigacao.estado}
                        </Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    Nenhuma obrigação associada
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Documents Tab */}
          <TabsContent value="documents" className="space-y-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-base">Documentos</CardTitle>
                  <CardDescription>Ficheiros associados a este cliente</CardDescription>
                </div>
                <Button size="sm" variant="outline">
                  <Plus className="h-4 w-4 mr-2" />
                  Carregar
                </Button>
              </CardHeader>
              <CardContent>
                {documents.length > 0 ? (
                  <div className="space-y-2">
                    {documents.map((doc) => (
                      <div 
                        key={doc.id} 
                        className="flex items-center justify-between p-3 rounded-lg border"
                      >
                        <div className="flex items-center gap-3">
                          <FileText className="h-5 w-5 text-muted-foreground" />
                          <div>
                            <p className="font-medium text-sm">{doc.file_name}</p>
                            <p className="text-xs text-muted-foreground">
                              {formatDatePT(doc.uploaded_at)}
                              {doc.is_proof && (
                                <Badge variant="outline" className="ml-2 text-xs">
                                  Comprovativo
                                </Badge>
                              )}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    Nenhum documento carregado
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Contacts Tab */}
          <TabsContent value="contacts" className="space-y-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-base">Contactos</CardTitle>
                  <CardDescription>Pessoas de contacto deste cliente</CardDescription>
                </div>
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => {
                    setEditingContact(null);
                    setContactForm({ name: "", email: "", phone: "", role: "" });
                    setContactDialogOpen(true);
                  }}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar
                </Button>
              </CardHeader>
              <CardContent>
                {contacts && contacts.length > 0 ? (
                  <div className="space-y-2">
                    {contacts.map((contact: any) => (
                      <div 
                        key={contact.id} 
                        className="flex items-center justify-between p-3 rounded-lg border"
                      >
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                            <User className="h-5 w-5 text-muted-foreground" />
                          </div>
                          <div>
                            <p className="font-medium text-sm">{contact.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {contact.role && <span>{contact.role} · </span>}
                              {contact.email}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => handleEditContact(contact)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => handleDeleteContact(contact.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    Nenhum contacto registado
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Contact Dialog */}
        <Dialog open={contactDialogOpen} onOpenChange={setContactDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingContact ? "Editar Contacto" : "Novo Contacto"}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Nome *</Label>
                <Input
                  value={contactForm.name}
                  onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })}
                  placeholder="Nome do contacto"
                />
              </div>
              <div className="space-y-2">
                <Label>E-mail</Label>
                <Input
                  type="email"
                  value={contactForm.email}
                  onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                  placeholder="email@exemplo.com"
                />
              </div>
              <div className="space-y-2">
                <Label>Telefone</Label>
                <Input
                  value={contactForm.phone}
                  onChange={(e) => setContactForm({ ...contactForm, phone: e.target.value })}
                  placeholder="+351 ..."
                />
              </div>
              <div className="space-y-2">
                <Label>Cargo/Função</Label>
                <Input
                  value={contactForm.role}
                  onChange={(e) => setContactForm({ ...contactForm, role: e.target.value })}
                  placeholder="Ex: Diretor Financeiro"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setContactDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleSaveContact} disabled={!contactForm.name.trim()}>
                {editingContact ? "Guardar" : "Criar"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
}
