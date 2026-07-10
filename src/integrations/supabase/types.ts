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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      app_versions: {
        Row: {
          autor: string | null
          created_at: string
          destaque: boolean
          itens: Json
          lancada_em: string
          resumo: string | null
          tipo: Database["public"]["Enums"]["app_version_tipo"]
          titulo: string
          updated_at: string
          versao: string
        }
        Insert: {
          autor?: string | null
          created_at?: string
          destaque?: boolean
          itens?: Json
          lancada_em?: string
          resumo?: string | null
          tipo?: Database["public"]["Enums"]["app_version_tipo"]
          titulo: string
          updated_at?: string
          versao: string
        }
        Update: {
          autor?: string | null
          created_at?: string
          destaque?: boolean
          itens?: Json
          lancada_em?: string
          resumo?: string | null
          tipo?: Database["public"]["Enums"]["app_version_tipo"]
          titulo?: string
          updated_at?: string
          versao?: string
        }
        Relationships: []
      }
      comunicado_leituras: {
        Row: {
          comunicado_id: string
          lido_em: string
          user_id: string
        }
        Insert: {
          comunicado_id: string
          lido_em?: string
          user_id: string
        }
        Update: {
          comunicado_id?: string
          lido_em?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "comunicado_leituras_comunicado_id_fkey"
            columns: ["comunicado_id"]
            isOneToOne: false
            referencedRelation: "comunicados"
            referencedColumns: ["id"]
          },
        ]
      }
      comunicados: {
        Row: {
          criado_em: string
          criado_por: string | null
          id: string
          mensagem: string
          titulo: string
        }
        Insert: {
          criado_em?: string
          criado_por?: string | null
          id?: string
          mensagem: string
          titulo: string
        }
        Update: {
          criado_em?: string
          criado_por?: string | null
          id?: string
          mensagem?: string
          titulo?: string
        }
        Relationships: []
      }
      lancamentos: {
        Row: {
          account_group: string | null
          action: string | null
          center: string | null
          company: number | null
          created_at: string
          desc_status: string | null
          due_date: string | null
          empresa: string | null
          gross_amount: number | null
          id: string
          invoice_number: string | null
          issuer: string | null
          log: string | null
          pre_pedido: number | null
          register_date: string | null
          supplier: string | null
          text_field: string | null
          updated_at: string
        }
        Insert: {
          account_group?: string | null
          action?: string | null
          center?: string | null
          company?: number | null
          created_at?: string
          desc_status?: string | null
          due_date?: string | null
          empresa?: string | null
          gross_amount?: number | null
          id?: string
          invoice_number?: string | null
          issuer?: string | null
          log?: string | null
          pre_pedido?: number | null
          register_date?: string | null
          supplier?: string | null
          text_field?: string | null
          updated_at?: string
        }
        Update: {
          account_group?: string | null
          action?: string | null
          center?: string | null
          company?: number | null
          created_at?: string
          desc_status?: string | null
          due_date?: string | null
          empresa?: string | null
          gross_amount?: number | null
          id?: string
          invoice_number?: string | null
          issuer?: string | null
          log?: string | null
          pre_pedido?: number | null
          register_date?: string | null
          supplier?: string | null
          text_field?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      pagamentos_audit: {
        Row: {
          acao: string
          created_at: string
          id: string
          pagamento_id: string | null
          snapshot: Json | null
          user_id: string | null
          user_nome: string | null
        }
        Insert: {
          acao: string
          created_at?: string
          id?: string
          pagamento_id?: string | null
          snapshot?: Json | null
          user_id?: string | null
          user_nome?: string | null
        }
        Update: {
          acao?: string
          created_at?: string
          id?: string
          pagamento_id?: string | null
          snapshot?: Json | null
          user_id?: string | null
          user_nome?: string | null
        }
        Relationships: []
      }
      pagamentos_diversos: {
        Row: {
          arquivo_remessa: string | null
          banco: string | null
          celula: string | null
          colaborador_nome: string
          competencia: string | null
          created_at: string
          data_credito: string | null
          descricao_pagamento: string | null
          diferenca_bank_itau: number | null
          diferenca_lg_finnet: number | null
          empresa: string | null
          ev_saida_folha_mensal: number | null
          folha: string | null
          id: string
          natureza_pagamento: string | null
          observacao: string | null
          qtde_colaboradores: number | null
          registrado_em: string
          registrado_por: string | null
          status_bankmanager: string | null
          status_itau: string | null
          tipo_arquivo: string | null
          updated_at: string
          valor_bankmanager: number | null
          valor_itau: number | null
          valor_lg: number | null
        }
        Insert: {
          arquivo_remessa?: string | null
          banco?: string | null
          celula?: string | null
          colaborador_nome: string
          competencia?: string | null
          created_at?: string
          data_credito?: string | null
          descricao_pagamento?: string | null
          diferenca_bank_itau?: number | null
          diferenca_lg_finnet?: number | null
          empresa?: string | null
          ev_saida_folha_mensal?: number | null
          folha?: string | null
          id?: string
          natureza_pagamento?: string | null
          observacao?: string | null
          qtde_colaboradores?: number | null
          registrado_em?: string
          registrado_por?: string | null
          status_bankmanager?: string | null
          status_itau?: string | null
          tipo_arquivo?: string | null
          updated_at?: string
          valor_bankmanager?: number | null
          valor_itau?: number | null
          valor_lg?: number | null
        }
        Update: {
          arquivo_remessa?: string | null
          banco?: string | null
          celula?: string | null
          colaborador_nome?: string
          competencia?: string | null
          created_at?: string
          data_credito?: string | null
          descricao_pagamento?: string | null
          diferenca_bank_itau?: number | null
          diferenca_lg_finnet?: number | null
          empresa?: string | null
          ev_saida_folha_mensal?: number | null
          folha?: string | null
          id?: string
          natureza_pagamento?: string | null
          observacao?: string | null
          qtde_colaboradores?: number | null
          registrado_em?: string
          registrado_por?: string | null
          status_bankmanager?: string | null
          status_itau?: string | null
          tipo_arquivo?: string | null
          updated_at?: string
          valor_bankmanager?: number | null
          valor_itau?: number | null
          valor_lg?: number | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          atualizado_em: string
          criado_em: string
          email: string | null
          id: string
          last_seen_at: string | null
          nome: string | null
          presence_status: string
        }
        Insert: {
          atualizado_em?: string
          criado_em?: string
          email?: string | null
          id: string
          last_seen_at?: string | null
          nome?: string | null
          presence_status?: string
        }
        Update: {
          atualizado_em?: string
          criado_em?: string
          email?: string | null
          id?: string
          last_seen_at?: string | null
          nome?: string | null
          presence_status?: string
        }
        Relationships: []
      }
      provisao_diaria: {
        Row: {
          banco: string | null
          created_at: string
          data: string | null
          empresa: string | null
          id: string
          pagamento_id: string | null
          updated_at: string
          valor: number | null
        }
        Insert: {
          banco?: string | null
          created_at?: string
          data?: string | null
          empresa?: string | null
          id?: string
          pagamento_id?: string | null
          updated_at?: string
          valor?: number | null
        }
        Update: {
          banco?: string | null
          created_at?: string
          data?: string | null
          empresa?: string | null
          id?: string
          pagamento_id?: string | null
          updated_at?: string
          valor?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "provisao_diaria_pagamento_id_fkey"
            columns: ["pagamento_id"]
            isOneToOne: true
            referencedRelation: "pagamentos_diversos"
            referencedColumns: ["id"]
          },
        ]
      }
      solicitacao_updates: {
        Row: {
          autor_email: string | null
          autor_nome: string
          autor_tipo: string
          criado_em: string
          id: string
          mensagem: string
          novo_status: Database["public"]["Enums"]["solicitacao_status"] | null
          solicitacao_id: string
        }
        Insert: {
          autor_email?: string | null
          autor_nome: string
          autor_tipo: string
          criado_em?: string
          id?: string
          mensagem: string
          novo_status?: Database["public"]["Enums"]["solicitacao_status"] | null
          solicitacao_id: string
        }
        Update: {
          autor_email?: string | null
          autor_nome?: string
          autor_tipo?: string
          criado_em?: string
          id?: string
          mensagem?: string
          novo_status?: Database["public"]["Enums"]["solicitacao_status"] | null
          solicitacao_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "solicitacao_updates_solicitacao_id_fkey"
            columns: ["solicitacao_id"]
            isOneToOne: false
            referencedRelation: "solicitacoes"
            referencedColumns: ["id"]
          },
        ]
      }
      solicitacoes: {
        Row: {
          assunto: string
          atualizado_em: string
          codigo: string
          criado_em: string
          descricao: string
          id: string
          solicitante_email: string
          solicitante_nome: string
          status: Database["public"]["Enums"]["solicitacao_status"]
          tipo: Database["public"]["Enums"]["solicitacao_tipo"]
        }
        Insert: {
          assunto: string
          atualizado_em?: string
          codigo: string
          criado_em?: string
          descricao: string
          id?: string
          solicitante_email: string
          solicitante_nome: string
          status?: Database["public"]["Enums"]["solicitacao_status"]
          tipo: Database["public"]["Enums"]["solicitacao_tipo"]
        }
        Update: {
          assunto?: string
          atualizado_em?: string
          codigo?: string
          criado_em?: string
          descricao?: string
          id?: string
          solicitante_email?: string
          solicitante_nome?: string
          status?: Database["public"]["Enums"]["solicitacao_status"]
          tipo?: Database["public"]["Enums"]["solicitacao_tipo"]
        }
        Relationships: []
      }
      user_password_metadata: {
        Row: {
          created_at: string
          password_changed_at: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          password_changed_at?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          password_changed_at?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
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
      ensure_viewer_role: { Args: never; Returns: undefined }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      mark_password_changed: { Args: never; Returns: undefined }
      set_presence: { Args: { _status: string }; Returns: undefined }
    }
    Enums: {
      app_role:
        | "administrador"
        | "criador_competencia"
        | "operacional"
        | "consulta"
        | "auditor"
        | "viewer"
      app_version_tipo: "major" | "minor" | "patch" | "hotfix"
      solicitacao_status:
        | "aberta"
        | "em_analise"
        | "respondida"
        | "concluida"
        | "cancelada"
      solicitacao_tipo:
        | "pagamento_diverso"
        | "provisao"
        | "holerite"
        | "ferias"
        | "rescisao"
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
      app_role: [
        "administrador",
        "criador_competencia",
        "operacional",
        "consulta",
        "auditor",
        "viewer",
      ],
      app_version_tipo: ["major", "minor", "patch", "hotfix"],
      solicitacao_status: [
        "aberta",
        "em_analise",
        "respondida",
        "concluida",
        "cancelada",
      ],
      solicitacao_tipo: [
        "pagamento_diverso",
        "provisao",
        "holerite",
        "ferias",
        "rescisao",
        "outro",
      ],
    },
  },
} as const
