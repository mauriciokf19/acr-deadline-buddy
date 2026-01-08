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
      activity_log: {
        Row: {
          action: string
          actor_id: string | null
          created_at: string | null
          entity_id: string | null
          entity_type: string
          id: string
          ip_address: string | null
          metadata: Json | null
          tenant_id: string
          user_agent: string | null
        }
        Insert: {
          action: string
          actor_id?: string | null
          created_at?: string | null
          entity_id?: string | null
          entity_type: string
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          tenant_id: string
          user_agent?: string | null
        }
        Update: {
          action?: string
          actor_id?: string | null
          created_at?: string | null
          entity_id?: string | null
          entity_type?: string
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          tenant_id?: string
          user_agent?: string | null
        }
        Relationships: []
      }
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
      clients: {
        Row: {
          address: string | null
          created_at: string | null
          deleted_at: string | null
          email: string | null
          id: string
          legacy_cliente_id: string | null
          name: string
          notes: string | null
          owner_id: string
          phone: string | null
          tenant_id: string
          updated_at: string | null
          vat_number: string | null
        }
        Insert: {
          address?: string | null
          created_at?: string | null
          deleted_at?: string | null
          email?: string | null
          id?: string
          legacy_cliente_id?: string | null
          name: string
          notes?: string | null
          owner_id: string
          phone?: string | null
          tenant_id: string
          updated_at?: string | null
          vat_number?: string | null
        }
        Update: {
          address?: string | null
          created_at?: string | null
          deleted_at?: string | null
          email?: string | null
          id?: string
          legacy_cliente_id?: string | null
          name?: string
          notes?: string | null
          owner_id?: string
          phone?: string | null
          tenant_id?: string
          updated_at?: string | null
          vat_number?: string | null
        }
        Relationships: []
      }
      comments: {
        Row: {
          author_id: string
          body: string
          created_at: string | null
          entity_id: string
          entity_type: string
          id: string
          is_internal: boolean | null
          mentions: Json | null
          updated_at: string | null
        }
        Insert: {
          author_id: string
          body: string
          created_at?: string | null
          entity_id: string
          entity_type: string
          id?: string
          is_internal?: boolean | null
          mentions?: Json | null
          updated_at?: string | null
        }
        Update: {
          author_id?: string
          body?: string
          created_at?: string | null
          entity_id?: string
          entity_type?: string
          id?: string
          is_internal?: boolean | null
          mentions?: Json | null
          updated_at?: string | null
        }
        Relationships: []
      }
      contacts: {
        Row: {
          client_id: string
          created_at: string | null
          deleted_at: string | null
          email: string | null
          id: string
          is_primary: boolean | null
          name: string
          owner_id: string
          phone: string | null
          role: string | null
          tenant_id: string
          updated_at: string | null
        }
        Insert: {
          client_id: string
          created_at?: string | null
          deleted_at?: string | null
          email?: string | null
          id?: string
          is_primary?: boolean | null
          name: string
          owner_id: string
          phone?: string | null
          role?: string | null
          tenant_id: string
          updated_at?: string | null
        }
        Update: {
          client_id?: string
          created_at?: string | null
          deleted_at?: string | null
          email?: string | null
          id?: string
          is_primary?: boolean | null
          name?: string
          owner_id?: string
          phone?: string | null
          role?: string | null
          tenant_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "contacts_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      email_accounts: {
        Row: {
          active: boolean | null
          created_at: string | null
          display_name: string | null
          email_address: string
          id: string
          last_sync_at: string | null
          oauth_access_token_encrypted: string | null
          oauth_expiry: string | null
          oauth_provider: string | null
          oauth_refresh_token_encrypted: string | null
          owner_id: string
          provider: string
          sync_error: string | null
          sync_status: string | null
          tenant_id: string
          updated_at: string | null
        }
        Insert: {
          active?: boolean | null
          created_at?: string | null
          display_name?: string | null
          email_address: string
          id?: string
          last_sync_at?: string | null
          oauth_access_token_encrypted?: string | null
          oauth_expiry?: string | null
          oauth_provider?: string | null
          oauth_refresh_token_encrypted?: string | null
          owner_id: string
          provider: string
          sync_error?: string | null
          sync_status?: string | null
          tenant_id: string
          updated_at?: string | null
        }
        Update: {
          active?: boolean | null
          created_at?: string | null
          display_name?: string | null
          email_address?: string
          id?: string
          last_sync_at?: string | null
          oauth_access_token_encrypted?: string | null
          oauth_expiry?: string | null
          oauth_provider?: string | null
          oauth_refresh_token_encrypted?: string | null
          owner_id?: string
          provider?: string
          sync_error?: string | null
          sync_status?: string | null
          tenant_id?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      email_messages: {
        Row: {
          attachments: Json | null
          bcc_addresses: Json | null
          body_html: string | null
          body_text: string | null
          cc_addresses: Json | null
          created_at: string | null
          direction: string
          external_message_id: string | null
          from_address: string | null
          from_name: string | null
          id: string
          sent_at: string | null
          subject: string | null
          thread_id: string
          to_addresses: Json | null
        }
        Insert: {
          attachments?: Json | null
          bcc_addresses?: Json | null
          body_html?: string | null
          body_text?: string | null
          cc_addresses?: Json | null
          created_at?: string | null
          direction: string
          external_message_id?: string | null
          from_address?: string | null
          from_name?: string | null
          id?: string
          sent_at?: string | null
          subject?: string | null
          thread_id: string
          to_addresses?: Json | null
        }
        Update: {
          attachments?: Json | null
          bcc_addresses?: Json | null
          body_html?: string | null
          body_text?: string | null
          cc_addresses?: Json | null
          created_at?: string | null
          direction?: string
          external_message_id?: string | null
          from_address?: string | null
          from_name?: string | null
          id?: string
          sent_at?: string | null
          subject?: string | null
          thread_id?: string
          to_addresses?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "email_messages_thread_id_fkey"
            columns: ["thread_id"]
            isOneToOne: false
            referencedRelation: "email_threads"
            referencedColumns: ["id"]
          },
        ]
      }
      email_templates: {
        Row: {
          body_html: string
          category: string | null
          created_at: string | null
          id: string
          name: string
          owner_id: string
          subject: string | null
          tenant_id: string
          updated_at: string | null
        }
        Insert: {
          body_html: string
          category?: string | null
          created_at?: string | null
          id?: string
          name: string
          owner_id: string
          subject?: string | null
          tenant_id: string
          updated_at?: string | null
        }
        Update: {
          body_html?: string
          category?: string | null
          created_at?: string | null
          id?: string
          name?: string
          owner_id?: string
          subject?: string | null
          tenant_id?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      email_threads: {
        Row: {
          account_id: string
          client_id: string | null
          created_at: string | null
          external_thread_id: string | null
          id: string
          importance: string | null
          is_read: boolean | null
          last_message_at: string | null
          message_count: number | null
          owner_id: string
          snippet: string | null
          snoozed_until: string | null
          status: string | null
          subject: string | null
          tenant_id: string
          updated_at: string | null
        }
        Insert: {
          account_id: string
          client_id?: string | null
          created_at?: string | null
          external_thread_id?: string | null
          id?: string
          importance?: string | null
          is_read?: boolean | null
          last_message_at?: string | null
          message_count?: number | null
          owner_id: string
          snippet?: string | null
          snoozed_until?: string | null
          status?: string | null
          subject?: string | null
          tenant_id: string
          updated_at?: string | null
        }
        Update: {
          account_id?: string
          client_id?: string | null
          created_at?: string | null
          external_thread_id?: string | null
          id?: string
          importance?: string | null
          is_read?: boolean | null
          last_message_at?: string | null
          message_count?: number | null
          owner_id?: string
          snippet?: string | null
          snoozed_until?: string | null
          status?: string | null
          subject?: string | null
          tenant_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "email_threads_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "email_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "email_threads_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      feature_flags: {
        Row: {
          created_at: string | null
          enabled: boolean | null
          flag_name: string
          id: string
          tenant_id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          enabled?: boolean | null
          flag_name: string
          id?: string
          tenant_id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          enabled?: boolean | null
          flag_name?: string
          id?: string
          tenant_id?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      files: {
        Row: {
          client_id: string | null
          file_name: string
          file_type: string | null
          id: string
          is_proof: boolean | null
          mime_type: string | null
          size_bytes: number | null
          storage_key: string
          tenant_id: string
          uploaded_at: string | null
          uploaded_by: string
          work_item_link_id: string | null
        }
        Insert: {
          client_id?: string | null
          file_name: string
          file_type?: string | null
          id?: string
          is_proof?: boolean | null
          mime_type?: string | null
          size_bytes?: number | null
          storage_key: string
          tenant_id: string
          uploaded_at?: string | null
          uploaded_by: string
          work_item_link_id?: string | null
        }
        Update: {
          client_id?: string | null
          file_name?: string
          file_type?: string | null
          id?: string
          is_proof?: boolean | null
          mime_type?: string | null
          size_bytes?: number | null
          storage_key?: string
          tenant_id?: string
          uploaded_at?: string | null
          uploaded_by?: string
          work_item_link_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "files_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "files_work_item_link_id_fkey"
            columns: ["work_item_link_id"]
            isOneToOne: false
            referencedRelation: "work_item_links"
            referencedColumns: ["id"]
          },
        ]
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
          client_id: string | null
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
          client_id?: string | null
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
          client_id?: string | null
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
            foreignKeyName: "obrigacoes_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
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
      tasks: {
        Row: {
          assignee_id: string | null
          client_id: string | null
          completed_at: string | null
          created_at: string | null
          deleted_at: string | null
          description: string | null
          due_date: string | null
          id: string
          linked_email_thread_id: string | null
          owner_id: string
          priority: string | null
          status: string | null
          tenant_id: string
          title: string
          updated_at: string | null
        }
        Insert: {
          assignee_id?: string | null
          client_id?: string | null
          completed_at?: string | null
          created_at?: string | null
          deleted_at?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          linked_email_thread_id?: string | null
          owner_id: string
          priority?: string | null
          status?: string | null
          tenant_id: string
          title: string
          updated_at?: string | null
        }
        Update: {
          assignee_id?: string | null
          client_id?: string | null
          completed_at?: string | null
          created_at?: string | null
          deleted_at?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          linked_email_thread_id?: string | null
          owner_id?: string
          priority?: string | null
          status?: string | null
          tenant_id?: string
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tasks_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_linked_email_thread_id_fkey"
            columns: ["linked_email_thread_id"]
            isOneToOne: false
            referencedRelation: "email_threads"
            referencedColumns: ["id"]
          },
        ]
      }
      template_instancias: {
        Row: {
          ano_fiscal: number
          client_id: string | null
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
          client_id?: string | null
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
          client_id?: string | null
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
            foreignKeyName: "template_instancias_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
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
      work_item_links: {
        Row: {
          client_id: string | null
          created_at: string | null
          deprecated_at: string | null
          external_id: string
          external_table: string
          id: string
          link_type: string | null
          owner_id: string
          task_id: string | null
          tenant_id: string
          thread_id: string | null
        }
        Insert: {
          client_id?: string | null
          created_at?: string | null
          deprecated_at?: string | null
          external_id: string
          external_table: string
          id?: string
          link_type?: string | null
          owner_id: string
          task_id?: string | null
          tenant_id: string
          thread_id?: string | null
        }
        Update: {
          client_id?: string | null
          created_at?: string | null
          deprecated_at?: string | null
          external_id?: string
          external_table?: string
          id?: string
          link_type?: string | null
          owner_id?: string
          task_id?: string | null
          tenant_id?: string
          thread_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "work_item_links_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "work_item_links_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "work_item_links_thread_id_fkey"
            columns: ["thread_id"]
            isOneToOne: false
            referencedRelation: "email_threads"
            referencedColumns: ["id"]
          },
        ]
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
      log_activity: {
        Args: {
          p_action: string
          p_entity_id: string
          p_entity_type: string
          p_metadata?: Json
        }
        Returns: string
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
        | "retencoes"
        | "modelo_30"
        | "cope"
        | "recapitulativa"
        | "dmis"
        | "iuc"
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
        "retencoes",
        "modelo_30",
        "cope",
        "recapitulativa",
        "dmis",
        "iuc",
      ],
    },
  },
} as const
