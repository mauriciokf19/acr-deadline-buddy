export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      alertas: {
        Row: {
          canal: string
          created_at: string | null
          disparado_em: string
          entidade_id: string
          entidade_tipo: string
          id: string
          mensagem: string
          titulo: string
          user_id: string
          visto: boolean | null
        }
        Insert: {
          canal: string
          created_at?: string | null
          disparado_em?: string
          entidade_id: string
          entidade_tipo: string
          id?: string
          mensagem: string
          titulo: string
          user_id: string
          visto?: boolean | null
        }
        Update: {
          canal?: string
          created_at?: string | null
          disparado_em?: string
          entidade_id?: string
          entidade_tipo?: string
          id?: string
          mensagem?: string
          titulo?: string
          user_id?: string
          visto?: boolean | null
        }
        Relationships: []
      }
      clientes: {
        Row: {
          contacto: string | null
          created_at: string | null
          email: string | null
          id: string
          nif: string | null
          nome: string
          owner_id: string | null
          updated_at: string | null
        }
        Insert: {
          contacto?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          nif?: string | null
          nome: string
          owner_id?: string | null
          updated_at?: string | null
        }
        Update: {
          contacto?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          nif?: string | null
          nome?: string
          owner_id?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      lembretes: {
        Row: {
          ativo: boolean | null
          canal: string
          created_at: string | null
          deleted_at: string | null
          entidade_id: string
          entidade_tipo: string
          id: string
          owner_id: string | null
          proximo_disparo_em: string | null
          regra: string
          ultimo_disparo_em: string | null
          updated_at: string | null
        }
        Insert: {
          ativo?: boolean | null
          canal: string
          created_at?: string | null
          deleted_at?: string | null
          entidade_id: string
          entidade_tipo: string
          id?: string
          owner_id?: string | null
          proximo_disparo_em?: string | null
          regra: string
          ultimo_disparo_em?: string | null
          updated_at?: string | null
        }
        Update: {
          ativo?: boolean | null
          canal?: string
          created_at?: string | null
          deleted_at?: string | null
          entidade_id?: string
          entidade_tipo?: string
          id?: string
          owner_id?: string | null
          proximo_disparo_em?: string | null
          regra?: string
          ultimo_disparo_em?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      logs: {
        Row: {
          acao: string
          created_at: string | null
          detalhes: Json | null
          entidade_id: string
          entidade_tipo: string
          id: string
          user_id: string | null
        }
        Insert: {
          acao: string
          created_at?: string | null
          detalhes?: Json | null
          entidade_id: string
          entidade_tipo: string
          id?: string
          user_id?: string | null
        }
        Update: {
          acao?: string
          created_at?: string | null
          detalhes?: Json | null
          entidade_id?: string
          entidade_tipo?: string
          id?: string
          user_id?: string | null
        }
        Relationships: []
      }
      obrigacoes: {
        Row: {
          aprovado_em: string | null
          comprovativo_mime: string | null
          comprovativo_nome_original: string | null
          comprovativo_size_bytes: number | null
          comprovativo_storage_path: string | null
          comprovativo_uploaded_at: string | null
          comprovativo_uploaded_by: string | null
          concluido_em: string | null
          created_at: string | null
          created_by: string | null
          data_envio_senior: string | null
          data_feedback_senior: string | null
          deadline_interna: string
          deadline_oficial: string
          deadline_revisao_senior: string
          deleted_at: string | null
          enviado_senior_em: string | null
          estado: Database["public"]["Enums"]["estado_obrigacao"] | null
          id: string
          notas: string | null
          owner_id: string | null
          periodicidade: Database["public"]["Enums"]["periodicidade"]
          periodo_referencia: string | null
          projeto_id: string
          responsavel_id: string | null
          submetido_em: string | null
          tipo: Database["public"]["Enums"]["tipo_obrigacao"]
          titulo: string
          updated_at: string | null
        }
        Insert: {
          aprovado_em?: string | null
          comprovativo_mime?: string | null
          comprovativo_nome_original?: string | null
          comprovativo_size_bytes?: number | null
          comprovativo_storage_path?: string | null
          comprovativo_uploaded_at?: string | null
          comprovativo_uploaded_by?: string | null
          concluido_em?: string | null
          created_at?: string | null
          created_by?: string | null
          data_envio_senior?: string | null
          data_feedback_senior?: string | null
          deadline_interna: string
          deadline_oficial: string
          deadline_revisao_senior: string
          deleted_at?: string | null
          enviado_senior_em?: string | null
          estado?: Database["public"]["Enums"]["estado_obrigacao"] | null
          id?: string
          notas?: string | null
          owner_id?: string | null
          periodicidade: Database["public"]["Enums"]["periodicidade"]
          periodo_referencia?: string | null
          projeto_id: string
          responsavel_id?: string | null
          submetido_em?: string | null
          tipo: Database["public"]["Enums"]["tipo_obrigacao"]
          titulo: string
          updated_at?: string | null
        }
        Update: {
          aprovado_em?: string | null
          comprovativo_mime?: string | null
          comprovativo_nome_original?: string | null
          comprovativo_size_bytes?: number | null
          comprovativo_storage_path?: string | null
          comprovativo_uploaded_at?: string | null
          comprovativo_uploaded_by?: string | null
          concluido_em?: string | null
          created_at?: string | null
          created_by?: string | null
          data_envio_senior?: string | null
          data_feedback_senior?: string | null
          deadline_interna?: string
          deadline_oficial?: string
          deadline_revisao_senior?: string
          deleted_at?: string | null
          enviado_senior_em?: string | null
          estado?: Database["public"]["Enums"]["estado_obrigacao"] | null
          id?: string
          notas?: string | null
          owner_id?: string | null
          periodicidade?: Database["public"]["Enums"]["periodicidade"]
          periodo_referencia?: string | null
          projeto_id?: string
          responsavel_id?: string | null
          submetido_em?: string | null
          tipo?: Database["public"]["Enums"]["tipo_obrigacao"]
          titulo?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "obrigacoes_projeto_id_fkey"
            columns: ["projeto_id"]
            isOneToOne: false
            referencedRelation: "projetos"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string | null
          email: string
          exigir_comprovativo_para_submetido: boolean | null
          id: string
          janela_silencio_fim: string | null
          janela_silencio_inicio: string | null
          lembrete_followup_horas: number | null
          lembrete_interna_dias: number | null
          lembrete_oficial_dias: number | null
          nome: string
          role: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          email: string
          exigir_comprovativo_para_submetido?: boolean | null
          id: string
          janela_silencio_fim?: string | null
          janela_silencio_inicio?: string | null
          lembrete_followup_horas?: number | null
          lembrete_interna_dias?: number | null
          lembrete_oficial_dias?: number | null
          nome: string
          role?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string
          exigir_comprovativo_para_submetido?: boolean | null
          id?: string
          janela_silencio_fim?: string | null
          janela_silencio_inicio?: string | null
          lembrete_followup_horas?: number | null
          lembrete_interna_dias?: number | null
          lembrete_oficial_dias?: number | null
          nome?: string
          role?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      projetos: {
        Row: {
          ano_fiscal: number | null
          ativo: boolean | null
          cliente_id: string | null
          cor: string | null
          created_at: string | null
          created_by: string | null
          descricao: string | null
          id: string
          nome: string
          owner_id: string | null
          pais: string | null
          updated_at: string | null
        }
        Insert: {
          ano_fiscal?: number | null
          ativo?: boolean | null
          cliente_id?: string | null
          cor?: string | null
          created_at?: string | null
          created_by?: string | null
          descricao?: string | null
          id?: string
          nome: string
          owner_id?: string | null
          pais?: string | null
          updated_at?: string | null
        }
        Update: {
          ano_fiscal?: number | null
          ativo?: boolean | null
          cliente_id?: string | null
          cor?: string | null
          created_at?: string | null
          created_by?: string | null
          descricao?: string | null
          id?: string
          nome?: string
          owner_id?: string | null
          pais?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "projetos_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
        ]
      }
      tarefas: {
        Row: {
          concluida: boolean | null
          created_at: string | null
          deadline: string | null
          deleted_at: string | null
          descricao: string | null
          id: string
          obrigacao_id: string | null
          owner_id: string | null
          responsavel_id: string | null
          titulo: string
          updated_at: string | null
        }
        Insert: {
          concluida?: boolean | null
          created_at?: string | null
          deadline?: string | null
          deleted_at?: string | null
          descricao?: string | null
          id?: string
          obrigacao_id?: string | null
          owner_id?: string | null
          responsavel_id?: string | null
          titulo: string
          updated_at?: string | null
        }
        Update: {
          concluida?: boolean | null
          created_at?: string | null
          deadline?: string | null
          deleted_at?: string | null
          descricao?: string | null
          id?: string
          obrigacao_id?: string | null
          owner_id?: string | null
          responsavel_id?: string | null
          titulo?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tarefas_obrigacao_id_fkey"
            columns: ["obrigacao_id"]
            isOneToOne: false
            referencedRelation: "obrigacoes"
            referencedColumns: ["id"]
          },
        ]
      }
      template_instancias: {
        Row: {
          ano_fiscal: number
          created_at: string
          id: string
          obrigacoes_geradas: number
          owner_id: string | null
          parametros_json: Json
          projeto_id: string
          template_id: string
          user_id: string | null
        }
        Insert: {
          ano_fiscal: number
          created_at?: string
          id?: string
          obrigacoes_geradas?: number
          owner_id?: string | null
          parametros_json: Json
          projeto_id: string
          template_id: string
          user_id?: string | null
        }
        Update: {
          ano_fiscal?: number
          created_at?: string
          id?: string
          obrigacoes_geradas?: number
          owner_id?: string | null
          parametros_json?: Json
          projeto_id?: string
          template_id?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "template_instancias_projeto_id_fkey"
            columns: ["projeto_id"]
            isOneToOne: false
            referencedRelation: "projetos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "template_instancias_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "templates"
            referencedColumns: ["id"]
          },
        ]
      }
      templates: {
        Row: {
          created_at: string
          id: string
          nome: string
          notas: string | null
          offset_interna: number
          offset_revisao: number
          owner_id: string | null
          pais: string
          periodicidade: Database["public"]["Enums"]["periodicidade"]
          regra_deadline_oficial: string
          tipo_obrigacao: Database["public"]["Enums"]["tipo_obrigacao"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          nome: string
          notas?: string | null
          offset_interna?: number
          offset_revisao?: number
          owner_id?: string | null
          pais?: string
          periodicidade: Database["public"]["Enums"]["periodicidade"]
          regra_deadline_oficial: string
          tipo_obrigacao: Database["public"]["Enums"]["tipo_obrigacao"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          nome?: string
          notas?: string | null
          offset_interna?: number
          offset_revisao?: number
          owner_id?: string | null
          pais?: string
          periodicidade?: Database["public"]["Enums"]["periodicidade"]
          regra_deadline_oficial?: string
          tipo_obrigacao?: Database["public"]["Enums"]["tipo_obrigacao"]
          updated_at?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
      estado_obrigacao:
        | "pendente"
        | "em_revisao"
        | "aprovado"
        | "submetido"
        | "concluido"
        | "atrasado"
      periodicidade: "mensal" | "trimestral" | "anual" | "pontual"
      tipo_obrigacao:
        | "iva"
        | "ies"
        | "saft"
        | "modelo_10"
        | "modelo_22"
        | "dmr"
        | "ifs"
        | "outro"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "moderator", "user"],
      estado_obrigacao: [
        "pendente",
        "em_revisao",
        "aprovado",
        "submetido",
        "concluido",
        "atrasado",
      ],
      periodicidade: ["mensal", "trimestral", "anual", "pontual"],
      tipo_obrigacao: [
        "iva",
        "ies",
        "saft",
        "modelo_10",
        "modelo_22",
        "dmr",
        "ifs",
        "outro",
      ],
    },
  },
} as const
