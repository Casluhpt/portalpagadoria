# Changelog - Portal da Pagadoria

## [v2.7.5] - 2026-08-06
### Adicionado
- **Status do Sistema:** Indicador visual em tempo real no rodapé do menu lateral ("Sistema Online").
- **Conciliação de Líquidos:** Atalho direto no menu lateral para acesso rápido ao dashboard financeiro.
- **Documentação de Versões:** Criação do arquivo `CHANGELOG.md` para registro histórico offline.

### Alterado
- **Padronização de Datas:** Campos de data no módulo de Despesas Fixas agora exibem o formato brasileiro (DD/MM/AAAA) como auxílio visual sobre o seletor nativo.
- **Reorganização do Menu:** Grupos de navegação ajustados para melhor fluxo operacional (Operação -> Financeiro -> Apoio).
- **Identidade Visual:** Sincronização de PNGs em todas as áreas do portal.

### Segurança
- **Restrição de Documentação:** Acesso a downloads técnicos e código-fonte restrito exclusivamente a `lucas.chaves.lc2001@gmail.com`.
- **Governança RBAC:** Auditoria de permissões nas abas de Configurações para garantir restrição a perfis não autorizados.

## [v2.7.4] - 2026-08-05
### Alterado
- **Localização:** Implementação inicial do formato de data brasileiro (DD/MM/AAAA) na Base da Provisão e Dashboard.

## [v2.7.3] - 2026-08-04
### Corrigido
- **Persistência:** Correção do erro de `not-null constraint` na coluna `mes` da relação `provisao_diaria`.

## [v2.7.2] - 2026-08-03
### Adicionado
- **Automação:** Sincronização automática entre as instruções do sistema e o histórico de versões.

## [2.7.6] - 2026-08-06
### Alterado
- Padronização dos ícones de KPIs e Módulos no Dashboard para tamanhos consistentes.
- Uniformização dos ícones do menu lateral e abas de configurações para o padrão h-4.
- Refinamento visual dos ícones de status e categorias no Histórico de Versões.
- Ajuste geral de pesos visuais conforme o padrão "Minimalismo Translúcido".

## [2.7.6] - 2026-08-06
### Alterado
- Padronização dos ícones de KPIs e Módulos no Dashboard para tamanhos consistentes.
- Uniformização dos ícones do menu lateral e abas de configurações para o padrão h-4.
- Refinamento visual dos ícones de status e categorias no Histórico de Versões.
- Ajuste geral de pesos visuais conforme o padrão "Minimalismo Translúcido".
