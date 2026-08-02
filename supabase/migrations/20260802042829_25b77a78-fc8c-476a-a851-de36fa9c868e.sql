
CREATE TABLE IF NOT EXISTS public.conciliacao_historico (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tipo TEXT NOT NULL, -- 'importacao' ou 'semanal'
    nomenclatura TEXT, -- 'Varejo' ou 'Distribuição'
    competencias_utilizadas TEXT[],
    periodo_inicio DATE,
    periodo_fim DATE,
    arquivo_importado_nome TEXT,
    arquivo_importado_url TEXT,
    arquivo_resultado_url TEXT,
    resultado_sumario JSONB,
    executado_por UUID REFERENCES auth.users(id),
    executado_em TIMESTAMPTZ DEFAULT NOW()
);

GRANT SELECT, INSERT ON public.conciliacao_historico TO authenticated;
GRANT ALL ON public.conciliacao_historico TO service_role;

ALTER TABLE public.conciliacao_historico ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuários podem ver seu histórico de conciliação"
ON public.conciliacao_historico
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Usuários podem inserir no histórico"
ON public.conciliacao_historico
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = executado_por);

-- Registrar Versão 1.9.0
INSERT INTO public.app_versions (
    versao,
    lancada_em,
    tipo,
    titulo,
    resumo,
    itens,
    autor,
    destaque
) VALUES (
    '1.9.0',
    NOW(),
    'minor',
    'Aprimoramento do Módulo de Conciliação Bancária',
    'Implementação de lógica de conciliação multi-nível, processamento por importação e conciliação semanal auditada.',
    '[
        {"categoria": "novo", "descricao": "Conciliação por Importação (Varejo/Distribuição) com 5 níveis de correspondência inteligente."},
        {"categoria": "novo", "descricao": "Conciliação Semanal com extração automática baseada em período e arquivamento em Base de Anexos."},
        {"categoria": "melhoria", "descricao": "Status de conciliação dinâmicos com tooltips explicativos (Conciliado, Soma de Lançamentos, Parcial, etc)."},
        {"categoria": "seguranca", "descricao": "Auditoria completa de execuções: quem, quando, competências e arquivos utilizados."},
        {"categoria": "novo", "descricao": "Integração com Central de Notificações para avisos de arquivos gerados."},
        {"categoria": "melhoria", "descricao": "Exportação Excel avançada com abas separadas para dados originais e resultados de conciliação."}
    ]'::jsonb,
    'Sistema',
    true
) ON CONFLICT (versao) DO UPDATE SET
    titulo = EXCLUDED.titulo,
    resumo = EXCLUDED.resumo,
    itens = EXCLUDED.itens,
    lancada_em = EXCLUDED.lancada_em;
