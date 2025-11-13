import { Link, useLocation } from "react-router-dom";
import { Home, FolderKanban, ClipboardCheck, Calendar, Bell, Settings } from "lucide-react";
import { cn } from "@/lib/utils";

const navigation = [
  { name: "Dashboard", href: "/", icon: Home },
  { name: "Projetos", href: "/projetos", icon: FolderKanban },
  { name: "Obrigações", href: "/obrigacoes", icon: ClipboardCheck },
  { name: "Calendário", href: "/calendario", icon: Calendar },
  { name: "Alertas", href: "/alertas", icon: Bell },
  { name: "Definições", href: "/definicoes", icon: Settings },
];

export function Layout({ children }: { children: React.ReactNode }) {
  const location = useLocation();

  return (
    <div className="flex min-h-screen flex-col pb-16">
      <main className="flex-1">{children}</main>
      
      {/* Bottom Navigation - Mobile First */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 border-t bg-card">
        <div className="grid h-16 grid-cols-6">
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
