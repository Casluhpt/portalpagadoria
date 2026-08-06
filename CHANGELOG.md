# Changelog - Portal da Pagadoria

## [v2.7.6] - 2026-08-06
### Adicionado
- **Interação Minimalista:** Efeitos sutis de hover em botões, links e cards (elevação suave e brilho), reforçando a estética "Minimalismo Translúcido".
- **Feedback Visual:** Interações específicas para elementos coloridos e componentes com transparência (glassmorphism).
- **Design de Status:** Removida a barra de fundo colorida no indicador de status do menu lateral para um visual mais limpo e integrado, seguindo o novo padrão visual.

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
