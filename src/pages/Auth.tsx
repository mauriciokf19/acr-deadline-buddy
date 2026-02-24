import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { enableDemoMode, isDemoMode } from "@/lib/demoData";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Navigate } from "react-router-dom";
import { ClipboardCheck, Beaker } from "lucide-react";

export default function Auth() {
  const { user, signIn, signUp } = useAuth();
  const [loading, setLoading] = useState(false);

  // If in demo mode, redirect to dashboard
  if (isDemoMode()) {
    return <Navigate to="/dashboard" replace />;
  }

  // Redirect if already logged in
  if (user) {
    return <Navigate to="/" replace />;
  }

  const handleSignIn = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    const { error } = await signIn(email, password);

    if (error) {
      toast.error(error.message || "Erro ao fazer login");
    } else {
      toast.success("Login efetuado com sucesso!");
    }

    setLoading(false);
  };

  const handleSignUp = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;
    const nome = formData.get("nome") as string;

    if (password.length < 6) {
      toast.error("A password deve ter pelo menos 6 caracteres");
      setLoading(false);
      return;
    }

    const { error } = await signUp(email, password, nome);

    if (error) {
      toast.error(error.message || "Erro ao criar conta");
    } else {
      toast.success("Conta criada com sucesso!");
    }

    setLoading(false);
  };

  const handleEnterDemo = () => {
    enableDemoMode();
    toast.success("Demo Mode activado!");
    window.location.href = "/dashboard";
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary">
            <ClipboardCheck className="h-8 w-8 text-primary-foreground" />
          </div>
          <CardTitle className="text-2xl">ACR Deadlines</CardTitle>
          <CardDescription>
            Gestão de obrigações fiscais
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="signin" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="signin">Login</TabsTrigger>
              <TabsTrigger value="signup">Criar Conta</TabsTrigger>
            </TabsList>

            <TabsContent value="signin">
              <form onSubmit={handleSignIn} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signin-email">Email</Label>
                  <Input
                    id="signin-email"
                    name="email"
                    type="email"
                    placeholder="seu@email.com"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signin-password">Password</Label>
                  <Input
                    id="signin-password"
                    name="password"
                    type="password"
                    placeholder="••••••"
                    required
                  />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "A entrar..." : "Entrar"}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="signup">
              <form onSubmit={handleSignUp} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signup-nome">Nome</Label>
                  <Input
                    id="signup-nome"
                    name="nome"
                    type="text"
                    placeholder="O seu nome"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-email">Email</Label>
                  <Input
                    id="signup-email"
                    name="email"
                    type="email"
                    placeholder="seu@email.com"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-password">Password</Label>
                  <Input
                    id="signup-password"
                    name="password"
                    type="password"
                    placeholder="••••••"
                    required
                    minLength={6}
                  />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "A criar..." : "Criar Conta"}
                </Button>
              </form>
            </TabsContent>
          </Tabs>

          {/* Demo Mode Button */}
          <div className="mt-6 pt-6 border-t">
            <Button
              variant="outline"
              className="w-full gap-2"
              onClick={handleEnterDemo}
            >
              <Beaker className="h-4 w-4" />
              Entrar em Demo Mode
            </Button>
            <p className="text-xs text-muted-foreground text-center mt-2">
              Testar a aplicação com dados fictícios
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
