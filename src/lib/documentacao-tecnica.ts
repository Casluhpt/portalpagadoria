export type DocBloco = { subtitulo?: string; paragrafo?: string; itens?: string[] };
export type DocSecao = { id: string; titulo: string; blocos: DocBloco[] };

export const DOC_INTRO =
  "Compilado detalhado das especificações técnicas e requisitos de interface do Portal da Pagadoria, no formato de engenharia de prompt para ferramentas de desenvolvimento ágil (Lovable, v0, Bolt). O conteúdo é setorizado de forma rigorosa, eliminando elementos informais e focando na precisão técnica dos fluxos e regras de negócio.";

export const DOC_SECOES: DocSecao[] = [
  {
    id: "config-suporte",
    titulo: "1. Módulo de Configurações e Canal de Suporte Técnico",
    blocos: [
      {
        subtitulo: "Localização e Interface do Usuário",
        itens: [
          'Incorporar na aba Configurações a funcionalidade "Dúvidas, Sugestões e Melhorias".',
          "Formulário simplificado contendo: Assunto (Bug, Erro, Melhoria), Anexo (opcional) e Comentário.",
        ],
      },
      {
        subtitulo: "Regras de Negócio e Back-end",
        itens: [
          "Identificação automatizada do usuário via sessão autenticada.",
          'Disparo simultâneo de notificação ao administrador e inserção na "Central de Divergências".',
          'Mensagem de sucesso: "Enviado com sucesso! Obrigado por compartilhar."',
        ],
      },
    ],
  },
  {
    id: "fila-virtual",
    titulo: "2. Sistema de Fila Virtual e Controle de Concorrência",
    blocos: [
      {
        subtitulo: "Localização e Objetivo",
        paragrafo:
          "Operação na seção Pagamentos Diversos para gerenciar acesso simultâneo e mitigar conflitos de concorrência.",
      },
      {
        subtitulo: "Fluxo de Entrada e Interface de Espera",
        itens: [
          'Botão "Entrar na Fila" aloca o usuário na estrutura de dados.',
          "Painel em tempo real: posição, total retido, operador ativo, cronômetro e próximo da fila.",
          "Modo estritamente leitura enquanto retido na fila.",
        ],
      },
      {
        subtitulo: "Liberação de Acesso e Alternância",
        itens: [
          "Desbloqueio de interface ao atingir a 1ª posição, com sinalização visual.",
          'Botão "Encerrar Pagamento" ou timeout transaciona o privilégio automaticamente.',
        ],
      },
    ],
  },
  {
    id: "despesas-fixas",
    titulo: "3. Atualização Estrutural do Módulo de Despesas Fixas",
    blocos: [
      {
        subtitulo: "Lançamentos e Regras de Competência",
        itens: [
          "Lançamento ilimitado de notas fiscais para PJ, Penhora, Pensão e Fornecedores.",
          "Atributos obrigatórios: Nº Nota, Pedido, Valor, Emissão, Vencimento e Lançamento.",
          "Cálculo automático de Competência (M-1) com override manual.",
          "Segmentação PJ: Mensal, Adiantamento, Antecipação e PPR.",
        ],
      },
      {
        subtitulo: "Gestão Orçamentária e Saldos",
        itens: [
          "Dedução automática do valor da NF do saldo disponível do pedido.",
          "Trava impeditiva ou alerta explícito em caso de violação de teto orçamentário.",
          "Rastreabilidade: pedido antigo/novo, conta, CC, empresa, ref PJ e SAP.",
        ],
      },
    ],
  },
  {
    id: "conciliacao",
    titulo: "4. Módulo de Conciliação Bancária",
    blocos: [
      {
        subtitulo: "Etapas de Correspondência",
        itens: [
          "Nível 1 — Correspondência exata (valor, data e documento).",
          "Nível 2 — Correspondência por valor e janela de datas.",
          "Nível 3 — Agrupamento (subset sum) de lançamentos.",
          "Nível 4 — Ajuste de tarifas e diferenças toleradas.",
          "Nível 5 — Divergência encaminhada à Central de Divergências.",
        ],
      },
      {
        subtitulo: "Importação",
        itens: [
          "Validação automática das colunas do arquivo.",
          "Detecção de duplicidade e registro de data/hora da importação.",
          'Modos de importação: "Incremental (adicionar aos existentes)" e "Substituir a base (apagar tudo antes)".',
        ],
      },
    ],
  },
  {
    id: "ia-busca",
    titulo: "5. Busca Total e IA Assistente",
    blocos: [
      {
        subtitulo: "Central de Busca Total",
        itens: [
          "Busca unificada por matrícula, usuário, empresa, colaborador, fornecedor e competência.",
          "Histórico de pesquisas recentes com opção de limpeza.",
          "Fallback direto para a IA Assistente quando não houver resultado no portal.",
        ],
      },
      {
        subtitulo: "Governança da IA",
        itens: [
          "Responder exclusivamente com base nos materiais autorizados (Material de Apoio).",
          "Registrar interações para auditoria e melhoria contínua.",
          "Permitir feedback do usuário sobre as respostas.",
        ],
      },
    ],
  },
  {
    id: "governanca",
    titulo: "6. Proteção, Backup e Integridade de Dados",
    blocos: [
      {
        itens: [
          "Log de auditoria imutável para operações críticas.",
          "Exclusão lógica com área restrita de Registros Excluídos e restauração exclusiva do Administrador.",
          "RLS habilitada em todas as tabelas públicas, com GRANTs explícitos.",
          "Perfis de acesso: Administração, Viewer e Visitante, com setor obrigatório do usuário.",
        ],
      },
    ],
  },
  {
    id: "arquitetura",
    titulo: "7. Requisitos de Arquitetura e Engenharia de Software",
    blocos: [
      {
        itens: [
          "Escalabilidade: modelagem extensível para integração com ERPs externos.",
          "Tempo real: sincronização de estados via protocolos de baixa latência (WebSockets/Realtime).",
          "Diretriz visual: padrões financeiros sóbrios com destaques funcionais e translucidez elegante.",
          "Responsividade validada em celular, tablet e desktop.",
        ],
      },
    ],
  },
];
