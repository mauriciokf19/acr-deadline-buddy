import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import Projetos from "./pages/Projetos";
import ProjetoDetail from "./pages/ProjetoDetail";
import Obrigacoes from "./pages/Obrigacoes";
import Tarefas from "./pages/Tarefas";
import Lembretes from "./pages/Lembretes";
import Calendario from "./pages/Calendario";
import Alertas from "./pages/Alertas";
import Definicoes from "./pages/Definicoes";
import Templates from "./pages/Templates";
import Dev from "./pages/Dev";
import QA from "./pages/QA";
import NotFound from "./pages/NotFound";
import Inbox from "./pages/Inbox";
import InboxThread from "./pages/InboxThread";
import Clientes from "./pages/Clientes";
import ClientDetail from "./pages/ClientDetail";
import Integracoes from "./pages/Integracoes";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/auth" element={<Auth />} />
            <Route
              path="/"
              element={<Navigate to="/dashboard" replace />}
            />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/inbox"
              element={
                <ProtectedRoute>
                  <Inbox />
                </ProtectedRoute>
              }
            />
            <Route
              path="/inbox/:id"
              element={
                <ProtectedRoute>
                  <InboxThread />
                </ProtectedRoute>
              }
            />
            <Route
              path="/clientes"
              element={
                <ProtectedRoute>
                  <Clientes />
                </ProtectedRoute>
              }
            />
            <Route
              path="/clientes/:id"
              element={
                <ProtectedRoute>
                  <ClientDetail />
                </ProtectedRoute>
              }
            />
            <Route
              path="/projetos"
              element={
                <ProtectedRoute>
                  <Projetos />
                </ProtectedRoute>
              }
            />
            <Route
              path="/projetos/:id"
              element={
                <ProtectedRoute>
                  <ProjetoDetail />
                </ProtectedRoute>
              }
            />
            <Route
              path="/obrigacoes"
              element={
                <ProtectedRoute>
                  <Obrigacoes />
                </ProtectedRoute>
              }
            />
            <Route
              path="/calendario"
              element={
                <ProtectedRoute>
                  <Calendario />
                </ProtectedRoute>
              }
            />
            <Route
              path="/alertas"
              element={
                <ProtectedRoute>
                  <Alertas />
                </ProtectedRoute>
              }
            />
            <Route
              path="/definicoes"
              element={
                <ProtectedRoute>
                  <Definicoes />
                </ProtectedRoute>
              }
            />
            <Route
              path="/definicoes/integracoes"
              element={
                <ProtectedRoute>
                  <Integracoes />
                </ProtectedRoute>
              }
            />
            <Route
              path="/tarefas"
              element={
                <ProtectedRoute>
                  <Tarefas />
                </ProtectedRoute>
              }
            />
            <Route
              path="/lembretes"
              element={
                <ProtectedRoute>
                  <Lembretes />
                </ProtectedRoute>
              }
            />
            <Route
              path="/templates"
              element={
                <ProtectedRoute>
                  <Templates />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dev"
              element={
                <ProtectedRoute>
                  <Dev />
                </ProtectedRoute>
              }
            />
            <Route
              path="/qa"
              element={
                <ProtectedRoute>
                  <QA />
                </ProtectedRoute>
              }
            />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
