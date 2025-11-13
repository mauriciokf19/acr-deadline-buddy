import { Layout } from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { LogOut, User } from "lucide-react";

export default function Definicoes() {
  const { user, signOut } = useAuth();

  return (
    <Layout>
      <div className="container mx-auto max-w-lg space-y-6 p-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold">Definições</h1>
          <p className="text-sm text-muted-foreground">
            Gerir a sua conta e preferências
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <User className="h-5 w-5" />
              Perfil
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="text-sm">
              <span className="text-muted-foreground">Email: </span>
              <span className="font-medium">{user?.email}</span>
            </div>
          </CardContent>
        </Card>

        <Button
          variant="destructive"
          className="w-full"
          onClick={signOut}
        >
          <LogOut className="mr-2 h-4 w-4" />
          Terminar Sessão
        </Button>
      </div>
    </Layout>
  );
}
