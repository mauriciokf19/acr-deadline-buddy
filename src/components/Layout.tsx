import { Link, useLocation } from "react-router-dom";
import { Home, FolderKanban, ClipboardCheck, Calendar, Settings, MoreHorizontal, Bell, CheckSquare, Repeat, FileText, Bug, Menu } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";

const navigation = [
  { name: "Dashboard", href: "/", icon: Home },
  { name: "Projetos", href: "/projetos", icon: FolderKanban },
  { name: "Obrigações", href: "/obrigacoes", icon: ClipboardCheck },
  { name: "Calendário", href: "/calendario", icon: Calendar },
  { name: "Definições", href: "/definicoes", icon: Settings },
];

const secondaryNavigation = [
  { name: "Alertas", href: "/alertas", icon: Bell },
  { name: "Tarefas", href: "/tarefas", icon: CheckSquare },
  { name: "Lembretes", href: "/lembretes", icon: Repeat },
  { name: "Templates", href: "/templates", icon: FileText },
  { name: "QA", href: "/qa", icon: Bug },
];

export function Layout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="flex min-h-screen flex-col pb-20">
      {/* Header with secondary menu - Top Left */}
      <header 
        className="sticky top-0 z-50 border-b bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60"
        style={{ paddingTop: "env(safe-area-inset-top)", paddingLeft: "env(safe-area-inset-left)" }}
      >
        <div className="container flex h-14 items-center px-4">
          <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                aria-label="Abrir menu"
                className="focus-visible:ring-2 focus-visible:ring-primary"
              >
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-64">
              <SheetHeader>
                <SheetTitle>Menu</SheetTitle>
              </SheetHeader>
              <div className="grid gap-2 py-4">
                {secondaryNavigation.map((item) => {
                  const isActive = location.pathname === item.href;
                  return (
                    <Link
                      key={item.name}
                      to={item.href}
                      onClick={() => setMenuOpen(false)}
                      className={cn(
                        "flex items-center gap-3 rounded-lg px-4 py-3 transition-colors",
                        isActive
                          ? "bg-primary text-primary-foreground"
                          : "hover:bg-muted"
                      )}
                    >
                      <item.icon className="h-5 w-5" />
                      <span className="font-medium">{item.name}</span>
                    </Link>
                  );
                })}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </header>

      <main className="flex-1">{children}</main>
      
      {/* Bottom Navigation - Mobile First - Fixed */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 border-t bg-card shadow-lg" style={{ paddingBottom: "env(safe-area-inset-bottom)" }}>
        <div className="grid h-16 grid-cols-5">
          {navigation.map((item) => {
            const isActive = location.pathname === item.href;
            return (
              <Link
                key={item.name}
                to={item.href}
                className={cn(
                  "flex flex-col items-center justify-center gap-1 text-xs transition-colors",
                  isActive
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <item.icon className={cn("h-5 w-5", isActive && "fill-primary")} />
                <span className="hidden sm:inline">{item.name}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
