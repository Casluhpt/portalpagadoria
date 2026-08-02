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
      aprovacoes: {
        Row: {
          ano: number
          created_at: string
          empresa: string | null
          id: string
          ordem: number
          ordem_pagamento: string | null
          status: string
          tipo: string
          updated_at: string
          valor: number
        }
        Insert: {
          ano?: number
          created_at?: string
          empresa?: string | null
          id?: string
          ordem?: number
          ordem_pagamento?: string | null
          status?: string
          tipo?: string
          updated_at?: string
          valor?: number
        }
        Update: {
          ano?: number
          created_at?: string
          empresa?: string | null
          id?: string
          ordem?: number
          ordem_pagamento?: string | null
          status?: string
          tipo?: string
          updated_at?: string
          valor?: number
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
          canal: string | null
          criado_em: string
          criado_por: string | null
          id: string
          mensagem: string
          titulo: string
        }
        Insert: {
          canal?: string | null
          criado_em?: string
          criado_por?: string | null
          id?: string
          mensagem: string
          titulo: string
        }
        Update: {
          canal?: string | null
          criado_em?: string
          criado_por?: string | null
          id?: string
          mensagem?: string
          titulo?: string
        }
        Relationships: []
      }
      conciliacao_historico: {
        Row: {
          arquivo_importado_nome: string | null
          arquivo_importado_url: string | null
          arquivo_resultado_url: string | null
          competencias_utilizadas: string[] | null
          executado_em: string | null
          executado_por: string | null
          id: string
          nomenclatura: string | null
          periodo_fim: string | null
          periodo_inicio: string | null
          resultado_sumario: Json | null
          tipo: string
        }
        Insert: {
          arquivo_importado_nome?: string | null
          arquivo_importado_url?: string | null
          arquivo_resultado_url?: string | null
          competencias_utilizadas?: string[] | null
          executado_em?: string | null
          executado_por?: string | null
          id?: string
          nomenclatura?: string | null
          periodo_fim?: string | null
          periodo_inicio?: string | null
          resultado_sumario?: Json | null
          tipo: string
        }
        Update: {
          arquivo_importado_nome?: string | null
          arquivo_importado_url?: string | null
          arquivo_resultado_url?: string | null
          competencias_utilizadas?: string[] | null
          executado_em?: string | null
          executado_por?: string | null
          id?: string
          nomenclatura?: string | null
          periodo_fim?: string | null
          periodo_inicio?: string | null
          resultado_sumario?: Json | null
          tipo?: string
        }
        Relationships: []
      }
      concorrencia_fila: {
        Row: {
          ativo_desde: string | null
          entrou_em: string | null
          id: string
          modulo: string
          status: string | null
          user_id: string | null
          user_nome: string | null
        }
        Insert: {
          ativo_desde?: string | null
          entrou_em?: string | null
          id?: string
          modulo: string
          status?: string | null
          user_id?: string | null
          user_nome?: string | null
        }
        Update: {
          ativo_desde?: string | null
          entrou_em?: string | null
          id?: string
          modulo?: string
          status?: string | null
          user_id?: string | null
          user_nome?: string | null
        }
        Relationships: []
      }
      despesas_fixas: {
        Row: {
          ano: number
          categoria: string
          centro_custo: string | null
          conta: string | null
          created_at: string
          created_by: string | null
          created_by_nome: string | null
          data_emissao: string | null
          data_lancamento: string | null
          data_vencimento: string | null
          descricao: string
          empresa_codigo: string | null
          empresa_nome: string | null
          id: string
          lancado: boolean
          mes: number
          motivo_suspensao: string | null
          nome_real: string | null
          notas: string | null
          numero_nf: string | null
          numero_pedido: string | null
          observacao: string | null
          ordem: number
          pedido_antigo: string | null
          pedido_novo: string | null
          sap_code: string | null
          suspensa: boolean | null
          tipo: string
          tipo_pj: string | null
          updated_at: string
          valor: number
          valor_previsto_anual: number | null
          valor_realizado: number | null
        }
        Insert: {
          ano?: number
          categoria: string
          centro_custo?: string | null
          conta?: string | null
          created_at?: string
          created_by?: string | null
          created_by_nome?: string | null
          data_emissao?: string | null
          data_lancamento?: string | null
          data_vencimento?: string | null
          descricao: string
          empresa_codigo?: string | null
          empresa_nome?: string | null
          id?: string
          lancado?: boolean
          mes: number
          motivo_suspensao?: string | null
          nome_real?: string | null
          notas?: string | null
          numero_nf?: string | null
          numero_pedido?: string | null
          observacao?: string | null
          ordem?: number
          pedido_antigo?: string | null
          pedido_novo?: string | null
          sap_code?: string | null
          suspensa?: boolean | null
          tipo?: string
          tipo_pj?: string | null
          updated_at?: string
          valor?: number
          valor_previsto_anual?: number | null
          valor_realizado?: number | null
        }
        Update: {
          ano?: number
          categoria?: string
          centro_custo?: string | null
          conta?: string | null
          created_at?: string
          created_by?: string | null
          created_by_nome?: string | null
          data_emissao?: string | null
          data_lancamento?: string | null
          data_vencimento?: string | null
          descricao?: string
          empresa_codigo?: string | null
          empresa_nome?: string | null
          id?: string
          lancado?: boolean
          mes?: number
          motivo_suspensao?: string | null
          nome_real?: string | null
          notas?: string | null
          numero_nf?: string | null
          numero_pedido?: string | null
          observacao?: string | null
          ordem?: number
          pedido_antigo?: string | null
          pedido_novo?: string | null
          sap_code?: string | null
          suspensa?: boolean | null
          tipo?: string
          tipo_pj?: string | null
          updated_at?: string
          valor?: number
          valor_previsto_anual?: number | null
          valor_realizado?: number | null
        }
        Relationships: []
      }
      despesas_fixas_notas: {
        Row: {
          criado_em: string | null
          data_emissao: string | null
          data_lancamento: string | null
          data_vencimento: string | null
          despesa_fixa_id: string | null
          id: string
          numero_nota: string | null
          numero_pedido: string | null
          tipo: string | null
          valor: number | null
        }
        Insert: {
          criado_em?: string | null
          data_emissao?: string | null
          data_lancamento?: string | null
          data_vencimento?: string | null
          despesa_fixa_id?: string | null
          id?: string
          numero_nota?: string | null
          numero_pedido?: string | null
          tipo?: string | null
          valor?: number | null
        }
        Update: {
          criado_em?: string | null
          data_emissao?: string | null
          data_lancamento?: string | null
          data_vencimento?: string | null
          despesa_fixa_id?: string | null
          id?: string
          numero_nota?: string | null
          numero_pedido?: string | null
          tipo?: string | null
          valor?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "despesas_fixas_notas_despesa_fixa_id_fkey"
            columns: ["despesa_fixa_id"]
            isOneToOne: false
            referencedRelation: "despesas_fixas"
            referencedColumns: ["id"]
          },
        ]
      }
      esocial_base: {
        Row: {
          atualizado_em: string | null
          bandeira: string | null
          cnpj: string | null
          criado_em: string | null
          dcomp_compensado: boolean | null
          empresa: string | null
          id: string
          mes_ano: string
          nome_coligada: string | null
          notificado: boolean | null
          num_empresa: string | null
          num_fopag: string | null
          status_lancamento: string | null
          valor_fgts: number | null
          valor_inss: number | null
          valor_irrf: number | null
          valor_pis: number | null
        }
        Insert: {
          atualizado_em?: string | null
          bandeira?: string | null
          cnpj?: string | null
          criado_em?: string | null
          dcomp_compensado?: boolean | null
          empresa?: string | null
          id?: string
          mes_ano: string
          nome_coligada?: string | null
          notificado?: boolean | null
          num_empresa?: string | null
          num_fopag?: string | null
          status_lancamento?: string | null
          valor_fgts?: number | null
          valor_inss?: number | null
          valor_irrf?: number | null
          valor_pis?: number | null
        }
        Update: {
          atualizado_em?: string | null
          bandeira?: string | null
          cnpj?: string | null
          criado_em?: string | null
          dcomp_compensado?: boolean | null
          empresa?: string | null
          id?: string
          mes_ano?: string
          nome_coligada?: string | null
          notificado?: boolean | null
          num_empresa?: string | null
          num_fopag?: string | null
          status_lancamento?: string | null
          valor_fgts?: number | null
          valor_inss?: number | null
          valor_irrf?: number | null
          valor_pis?: number | null
        }
        Relationships: []
      }
      fechamento_aprovacoes: {
        Row: {
          ano: number
          arquivo_url: string | null
          criado_em: string | null
          id: string
          nome: string
          total_registros: number | null
          total_valor: number | null
          usuario_id: string | null
        }
        Insert: {
          ano: number
          arquivo_url?: string | null
          criado_em?: string | null
          id?: string
          nome: string
          total_registros?: number | null
          total_valor?: number | null
          usuario_id?: string | null
        }
        Update: {
          ano?: number
          arquivo_url?: string | null
          criado_em?: string | null
          id?: string
          nome?: string
          total_registros?: number | null
          total_valor?: number | null
          usuario_id?: string | null
        }
        Relationships: []
      }
      fechamento_pagamentos: {
        Row: {
          ano: string
          arquivo_url: string | null
          criado_em: string | null
          id: string
          mes: string
          nome: string
          total_registros: number | null
          total_valor: number | null
          usuario_id: string | null
        }
        Insert: {
          ano: string
          arquivo_url?: string | null
          criado_em?: string | null
          id?: string
          mes: string
          nome: string
          total_registros?: number | null
          total_valor?: number | null
          usuario_id?: string | null
        }
        Update: {
          ano?: string
          arquivo_url?: string | null
          criado_em?: string | null
          id?: string
          mes?: string
          nome?: string
          total_registros?: number | null
          total_valor?: number | null
          usuario_id?: string | null
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
      lancamentos_audit: {
        Row: {
          acao: string
          created_at: string
          id: string
          lancamento_id: string | null
          snapshot: Json | null
          user_id: string | null
          user_nome: string | null
        }
        Insert: {
          acao: string
          created_at?: string
          id?: string
          lancamento_id?: string | null
          snapshot?: Json | null
          user_id?: string | null
          user_nome?: string | null
        }
        Update: {
          acao?: string
          created_at?: string
          id?: string
          lancamento_id?: string | null
          snapshot?: Json | null
          user_id?: string | null
          user_nome?: string | null
        }
        Relationships: []
      }
      material_apoio: {
        Row: {
          categoria: string
          conteudo: string
          created_at: string
          criado_por: string | null
          criado_por_nome: string | null
          id: string
          ordem: number
          palavras_chave: string[]
          publicado: boolean
          resumo: string | null
          titulo: string
          updated_at: string
        }
        Insert: {
          categoria?: string
          conteudo: string
          created_at?: string
          criado_por?: string | null
          criado_por_nome?: string | null
          id?: string
          ordem?: number
          palavras_chave?: string[]
          publicado?: boolean
          resumo?: string | null
          titulo: string
          updated_at?: string
        }
        Update: {
          categoria?: string
          conteudo?: string
          created_at?: string
          criado_por?: string | null
          criado_por_nome?: string | null
          id?: string
          ordem?: number
          palavras_chave?: string[]
          publicado?: boolean
          resumo?: string | null
          titulo?: string
          updated_at?: string
        }
        Relationships: []
      }
      material_apoio_favoritos: {
        Row: {
          created_at: string
          id: string
          material_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          material_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          material_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "material_apoio_favoritos_material_id_fkey"
            columns: ["material_id"]
            isOneToOne: false
            referencedRelation: "material_apoio"
            referencedColumns: ["id"]
          },
        ]
      }
      pagamento_solicitacoes: {
        Row: {
          criado_em: string
          data_credito: string
          decidido_em: string | null
          decidido_por: string | null
          decidido_por_nome: string | null
          id: string
          motivo: string | null
          motivo_decisao: string | null
          pagamento_id: string | null
          payload: Json
          solicitante_id: string | null
          solicitante_nome: string | null
          status: string
        }
        Insert: {
          criado_em?: string
          data_credito: string
          decidido_em?: string | null
          decidido_por?: string | null
          decidido_por_nome?: string | null
          id?: string
          motivo?: string | null
          motivo_decisao?: string | null
          pagamento_id?: string | null
          payload?: Json
          solicitante_id?: string | null
          solicitante_nome?: string | null
          status?: string
        }
        Update: {
          criado_em?: string
          data_credito?: string
          decidido_em?: string | null
          decidido_por?: string | null
          decidido_por_nome?: string | null
          id?: string
          motivo?: string | null
          motivo_decisao?: string | null
          pagamento_id?: string | null
          payload?: Json
          solicitante_id?: string | null
          solicitante_nome?: string | null
          status?: string
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
      pedidos_orcamento: {
        Row: {
          centro_custo: string | null
          conta: string | null
          created_at: string | null
          descricao: string | null
          empresa_codigo: string | null
          id: string
          numero_pedido: string
          saldo_inicial: number | null
          updated_at: string | null
        }
        Insert: {
          centro_custo?: string | null
          conta?: string | null
          created_at?: string | null
          descricao?: string | null
          empresa_codigo?: string | null
          id?: string
          numero_pedido: string
          saldo_inicial?: number | null
          updated_at?: string | null
        }
        Update: {
          centro_custo?: string | null
          conta?: string | null
          created_at?: string | null
          descricao?: string | null
          empresa_codigo?: string | null
          id?: string
          numero_pedido?: string
          saldo_inicial?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      portal_settings: {
        Row: {
          key: string
          updated_at: string | null
          value: Json | null
        }
        Insert: {
          key: string
          updated_at?: string | null
          value?: Json | null
        }
        Update: {
          key?: string
          updated_at?: string | null
          value?: Json | null
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
          setor: string | null
        }
        Insert: {
          atualizado_em?: string
          criado_em?: string
          email?: string | null
          id: string
          last_seen_at?: string | null
          nome?: string | null
          presence_status?: string
          setor?: string | null
        }
        Update: {
          atualizado_em?: string
          criado_em?: string
          email?: string | null
          id?: string
          last_seen_at?: string | null
          nome?: string | null
          presence_status?: string
          setor?: string | null
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
          mes: string
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
          mes: string
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
          mes?: string
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
      provisao_fechamento_competencia: {
        Row: {
          ano: string
          arquivo_url: string | null
          data_fechamento: string | null
          fechado_por: string | null
          id: string
          mes: string
          nome: string
          snapshot: Json
        }
        Insert: {
          ano: string
          arquivo_url?: string | null
          data_fechamento?: string | null
          fechado_por?: string | null
          id?: string
          mes: string
          nome: string
          snapshot: Json
        }
        Update: {
          ano?: string
          arquivo_url?: string | null
          data_fechamento?: string | null
          fechado_por?: string | null
          id?: string
          mes?: string
          nome?: string
          snapshot?: Json
        }
        Relationships: []
      }
      provisao_fechamentos: {
        Row: {
          data: string
          fechada_em: string
          fechada_por: string | null
          fechada_por_nome: string | null
        }
        Insert: {
          data: string
          fechada_em?: string
          fechada_por?: string | null
          fechada_por_nome?: string | null
        }
        Update: {
          data?: string
          fechada_em?: string
          fechada_por?: string | null
          fechada_por_nome?: string | null
        }
        Relationships: []
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
      suporte_tecnico: {
        Row: {
          anexo_url: string | null
          assunto: string
          comentario: string | null
          created_at: string | null
          id: string
          user_email: string | null
          user_id: string | null
          user_nome: string | null
        }
        Insert: {
          anexo_url?: string | null
          assunto: string
          comentario?: string | null
          created_at?: string | null
          id?: string
          user_email?: string | null
          user_id?: string | null
          user_nome?: string | null
        }
        Update: {
          anexo_url?: string | null
          assunto?: string
          comentario?: string | null
          created_at?: string | null
          id?: string
          user_email?: string | null
          user_id?: string | null
          user_nome?: string | null
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
      aprovar_solicitacao_provisao: {
        Args: { _id: string; _motivo?: string }
        Returns: string
      }
      ensure_viewer_role: { Args: never; Returns: undefined }
      fechar_competencia_provisao: {
        Args: { _ano: string; _mes: string; _nome: string; _usuario_id: string }
        Returns: string
      }
      fechar_provisao_diaria: {
        Args: { _data?: string }
        Returns: {
          data: string
          fechada_em: string
          fechada_por: string | null
          fechada_por_nome: string | null
        }
        SetofOptions: {
          from: "*"
          to: "provisao_fechamentos"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      integrar_pagamentos_na_provisao: { Args: never; Returns: undefined }
      is_provisao_fechada: { Args: { _data: string }; Returns: boolean }
      mark_password_changed: { Args: never; Returns: undefined }
      reabrir_provisao_diaria: { Args: { _data: string }; Returns: undefined }
      rejeitar_solicitacao_provisao: {
        Args: { _id: string; _motivo?: string }
        Returns: undefined
      }
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
        | "visitante"
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
        "visitante",
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
