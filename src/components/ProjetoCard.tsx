import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { FolderKanban, MoreVertical, Edit, Archive, Copy } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

interface ProjetoCardProps {
  projeto: any;
  onEdit: () => void;
  onArchive: () => void;
  onDuplicate: () => void;
}

export function ProjetoCard({ projeto, onEdit, onArchive, onDuplicate }: ProjetoCardProps) {
  const navigate = useNavigate();

  const handleCardClick = () => {
    if (!projeto?.id) {
      toast.error("Projeto inválido");
      return;
    }
    navigate(`/projetos/${projeto.id}`);
  };

  return (
    <Card 
      className="cursor-pointer hover:border-primary transition-colors"
      onClick={handleCardClick}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <div
              className="h-3 w-3 rounded-full flex-shrink-0"
              style={{ backgroundColor: projeto.cor }}
            />
            <CardTitle className="text-base truncate">{projeto.nome}</CardTitle>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onEdit(); }}>
                <Edit className="mr-2 h-4 w-4" />
                Editar
              </DropdownMenuItem>
              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onDuplicate(); }}>
                <Copy className="mr-2 h-4 w-4" />
                Duplicar
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={(e) => { e.stopPropagation(); onArchive(); }}
                className="text-destructive"
              >
                <Archive className="mr-2 h-4 w-4" />
                {projeto.ativo ? "Arquivar" : "Restaurar"}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <FolderKanban className="h-4 w-4" />
            <span>
              {projeto.cliente?.nome || "Sem cliente"} • {projeto.pais} • {projeto.ano_fiscal}
            </span>
          </div>
          
          <div className="flex items-center gap-2">
            <Badge variant={projeto.ativo ? "default" : "secondary"}>
              {projeto.ativo ? "Ativo" : "Arquivado"}
            </Badge>
            {projeto.obrigacoes_count > 0 && (
              <Badge variant="outline">
                {projeto.obrigacoes_count} obrigações
              </Badge>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
