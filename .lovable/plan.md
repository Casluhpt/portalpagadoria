# Auditoria Técnica e Funcional — Portal Pagadoria ADP

Diagnóstico somente leitura (nenhum arquivo alterado). Evidências coletadas em código, políticas do banco e linter.
No fim há a ordem de prioridade para nível de produção corporativa.

## 0. Erro de build ativo (bloqueia deploy)

`src/hooks/use-global-shortcuts.ts:48` — `navigate({ to: "/auditoria" })` sem `search`.
A rota declara `validateSearch` com `tab` obrigatório (`src/routes/auditoria.tsx:35-39`), então o tipo exige `search`.
Correção: `navigate({ to: "/auditoria", search: { tab: "log" } })`. **Crítico** (o app não compila).

## 1. Notas por área

| Área | Nota | Comentário curto |
|---|---|---|
| Arquitetura / organização | 5 | Rota única flat, arquivos gigantes (pagamentos 1.998 linhas), lógica de negócio dentro de componentes |
| Rotas e módulos | 6 | 29 rotas, todas públicas no roteador; sem subtree `_authenticated` |
| Autenticação | 4 | Guard só no cliente (`auth-gate.tsx`), sem `beforeLoad`; corrida de redirect |
| RBAC | 3 | `RoleGate`/`RestrictedArea` são UI; várias server fns sem checagem de papel |
| RLS / banco | 5 | RLS ativo em tudo, mas muito `USING (true)` e 26 funções SECURITY DEFINER executáveis por qualquer logado |
| Consistência de migrations | 5 | 90 migrations, políticas duplicadas/sobrepostas (ex.: 3 SELECT em `profiles`, 4 em `lancamentos`) |
| Fila / concorrência | 3 | `concorrencia.functions.ts` usa service role sem autenticação e confia no `userId` do cliente |
| Pagamentos / lançamentos | 5 | Fluxo completo, mas exclusão em massa via server fn sem auth; `select('*')` sem paginação |
| Conciliação / Auditoria | 6 | Motor implementado; auditoria imutável é ponto forte; casamento 100% no cliente |
| Fechamento | 4 | `fechamento-pagamentos.functions.ts` deleta em massa com service role sem auth |
| Despesas fixas | 6 | Funcional; `USING (true)` para leitura de dados financeiros de fornecedores/PJ |
| Provisão | 5 | Sincronização por trigger é boa; RLS de leitura só admin gera divergência com a UI |
| Importação / exportação | 6 | `money.ts` + `import-preview.ts` corrigiram a raiz monetária; parsing 100% no cliente (xlsx) |
| Notificações | 6 | Glassmorphic ok; estado de leitura parcialmente em localStorage |
| IA | 4 | Inativada, mas código, tabelas, canais realtime e `FloatingAI` continuam no bundle |
| Tratamento de erros | 4 | 29 rotas, apenas 2 com `errorComponent`; falhas silenciosas em toast |
| Segurança | 3 | Ver seção 2 — escalonamento de privilégio e endpoints sem auth |
| Performance | 5 | 35 `select('*')` sem limite, cálculo pesado no cliente, arquivos de 1-2 mil linhas |
| UX / UI | 8 | Identidade translúcida consistente, atalhos, busca global |
| Acessibilidade | 4 | Tabelas densas sem semântica, foco/contraste não verificados, bloco `sr-only` poluído |
| Manutenção | 4 | 99 `as any`, tipos gerados contornados, lógica duplicada |
| Duplicidades / legado | 4 | Formatadores BRL/data repetidos por rota, IA morta, `check_user_permission` nunca chamada |

**Média ponderada aproximada: 4,7/10** — funcional como ferramenta interna, ainda não corporativo.

## 2. Achados por severidade

### Crítico
1. **Server functions destrutivas sem autenticação, com service role**
   - `src/lib/fechamento-pagamentos.functions.ts` — insere fechamento e apaga `pagamentos_diversos` em massa; sem `requireSupabaseAuth`, sem checagem de admin.
   - `src/lib/pagamentos-admin.functions.ts` — exclusão lógica em massa por IDs, com `userId`/nome vindos do cliente (auditoria forjável).
   - `src/lib/concorrencia.functions.ts` — entra/sai/heartbeat da fila com `userId` do cliente: qualquer um remove o titular e assume a edição.
2. **Escalonamento de privilégio em permissões** — `admin-users.functions.ts` (~311-408): `getAppModules`, `getUserModules`, `toggleUserModule`, `getUserSpecificPermissions`, `setUserSpecificPermission`, `removeUserSpecificPermission` exigem login mas **não** exigem admin, e escrevem com service role em `user_modules`/`user_specific_permissions`. Qualquer usuário autenticado concede permissões a si mesmo.
3. **Erro de build ativo** (seção 0).
4. **Dump de código-fonte público** — `public/codigo-fonte-portal-pagadoria.txt` (~1,6 MB) é asset estático; o gate por e-mail em `documentacao-tecnica-section.tsx:31` é apenas visual. Acessível sem login.

### Alto
5. **Sem proteção de rota no servidor** — `auth-gate.tsx` decide no cliente; nenhum `beforeLoad`/subtree `_authenticated`. Todo o JS de todos os módulos é entregue a anônimos e há flash/corrida de redirect.
6. **RBAC decorativo** — `role-gate.tsx` só condiciona renderização; nenhuma query ou server fn é bloqueada por ele.
7. **Papel lido de `user_metadata`** — `use-session.ts:41` e `configuracoes.tsx:438` (`setor === "ADMINISTRADOR"` ou e-mail fixo). `user_metadata` é editável pelo próprio usuário.
8. **RLS permissiva em dados financeiros** — `USING (true)` para SELECT em `pagamentos_diversos`, `despesas_fixas`, `despesas_fixas_notas`, `lancamentos`, `aprovacoes`, `pedidos_orcamento`, `fechamento_*`, `conciliacao_historico`, `concorrencia_fila`, `app_config`, `portal_settings`. Perfis `viewer`/`visitante` leem tudo.
9. **`conciliacao_historico` sem escopo** — política de SELECT chamada "seu histórico" com `USING (true)`: todos veem os arquivos e sumários de todos.
10. **Linter Supabase: 26 funções SECURITY DEFINER executáveis por qualquer logado + 2 por anônimo + 1 com `search_path` mutável.** Inclui funções de fechamento/purga que só deveriam ser chamadas por admin (a checagem interna existe em várias, mas não em todas).

### Médio
11. **Tratamento de erros** — 2 de 29 rotas com `errorComponent`; nenhum `notFoundComponent` por rota; erros de mutação frequentemente só em toast, sem retry nem log.
12. **Performance de leitura** — 35 `select('*')` sem `limit`/paginação (`audit_log` limitado a 2000, o resto irrestrito). Tabelas crescem indefinidamente; render de milhares de linhas sem virtualização.
13. **Duplicidade** — formatadores `brl`/`s`/datas redefinidos por rota (ex.: `auditoria.tsx:55`) apesar de `src/lib/money.ts` ser a fonte única declarada; dois parsers de importação (`import-preview.ts` e parsers locais).
14. **Código legado da IA** — `FloatingAI.tsx`, `ia-banner-offline.tsx`, `ia.functions.ts` (retorna 403), tabelas `ia_conversas`/`ia_user_patterns` e canais realtime `ia_status_*` ainda ativos, assinando `app_config` sem uso.
15. **`check_user_permission` nunca é chamada** — matriz de permissões existe no banco, mas o front decide por papel; risco de divergência entre o que a tela mostra e o que o banco permite.
16. **Divergência front/banco na Provisão** — `provisao_diaria` só permite SELECT para admin, mas a UI de provisão é oferecida a outros perfis: tela vazia sem erro claro.
17. **Migrations sobrepostas** — políticas duplicadas com nomes diferentes e mesma semântica (`profiles`: 3 SELECT; `lancamentos`: 2 SELECT + 2 write). Dificulta auditoria de acesso.
18. **Estado crítico em localStorage** — snooze/dismiss de notificações, highlights de pagamentos, modo planilha: não sincroniza entre dispositivos e não é auditável.
19. **Bloco `sr-only` no `__root.tsx:130-169`** — roteiro de instruções interno exposto no HTML de produção e lido por leitores de tela.

### Baixo
20. **99 `as any`** contornando os tipos gerados do banco (`audit-critico.ts`, `pagamentos.ts` etc.).
21. **Arquivos acima de 600 linhas** (pagamentos 1.998, despesas-fixas 1.174, configuracoes 1.057, material-apoio 859, registros-excluidos 826) — múltiplas responsabilidades por arquivo.
22. **Metadados de SEO/head** apenas no `__root`; rotas não têm `head()` próprio (irrelevante para portal interno, mas fora do padrão do stack).
23. **Acessibilidade** — falta `aria-label` em ações icônicas, ordem de foco em diálogos densos e contraste no tema noturno não validados.

## 3. Ordem de prioridade para produção corporativa

**Fase 1 — Bloqueadores (imediato)**
1. Corrigir o erro de build do atalho `/auditoria`.
2. Adicionar `requireSupabaseAuth` + verificação de papel (`assertAdmin`) em `fechamento-pagamentos.functions.ts`, `pagamentos-admin.functions.ts` e nas funções de permissão de `admin-users.functions.ts`; derivar sempre o `userId` do token, nunca do payload.
3. Reescrever `concorrencia.functions.ts` para usar a identidade do token; fila deixa de ser falsificável.
4. Remover `public/codigo-fonte-portal-pagadoria.txt` do diretório público (servir sob server fn autenticada, se necessário).

**Fase 2 — Fronteira de segurança (1ª semana)**
5. Mover os módulos para `src/routes/_authenticated/` com o gate gerenciado; manter `auth-gate` apenas como UX.
6. Substituir checagens por `user_metadata`/e-mail fixo por `has_role`/`check_user_permission` verificado no servidor.
7. Endurecer RLS: trocar `USING (true)` por políticas por papel nas tabelas financeiras; escopar `conciliacao_historico` ao autor + admin/auditor.
8. Revogar `EXECUTE` público/authenticated das funções SECURITY DEFINER administrativas e fixar `search_path` na função pendente.

**Fase 3 — Confiabilidade (2ª–3ª semana)**
9. `errorComponent` + `notFoundComponent` em todas as rotas; padronizar tratamento de erro de mutação.
10. Paginação/limites e filtros server-side em todas as listagens; virtualizar as tabelas grandes.
11. Alinhar UI e RLS da Provisão; adotar `check_user_permission` como fonte única de autorização.
12. Consolidar migrations de política (remover duplicatas) e documentar a matriz de acesso final.

**Fase 4 — Manutenibilidade (mês 2)**
13. Extrair lógica de `pagamentos`, `despesas-fixas` e `configuracoes` para hooks/serviços; alvo de 400 linhas por arquivo.
14. Eliminar formatadores duplicados em favor de `money.ts`; unificar parsers de importação.
15. Remover o legado de IA (componentes, canais realtime, tabelas) ou reativá-lo formalmente.
16. Reduzir `as any` usando os tipos gerados; mover estado crítico de localStorage para o banco.
17. Passe de acessibilidade (labels, foco, contraste) e limpeza do bloco `sr-only` do root.

## Observações

- Pontos fortes reais: auditoria imutável por trigger, exclusão lógica com bloqueio de hard delete, `money.ts` como fonte financeira única, identidade visual consistente e busca/atalhos globais.
- A avaliação de RLS foi feita sobre as políticas ativas no banco; a de código sobre a árvore atual em `src/`.
- Nenhuma alteração foi aplicada. Aprovar este plano executa a Fase 1 (e apenas ela) como próximo passo.
