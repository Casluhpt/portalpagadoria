# Auditoria Somente Leitura — Portal Pagadoria ADP

Nenhum arquivo, banco, configuração ou UI foi alterado. Evidências vindas de leitura de código, políticas RLS ativas, linter e scan de segurança do backend.
Cada achado marca **[CONFIRMADO]** (verificado no projeto) ou **[RISCO]** (hipótese fundamentada, não executada).

## 0. Erro de build ativo — Crítico, corrigir agora

- **Evidência [CONFIRMADO]:** `src/hooks/use-global-shortcuts.ts:48` faz `navigate({ to: "/auditoria" })`, mas `src/routes/auditoria.tsx:35-39` declara `validateSearch` com `tab` obrigatório → TS2345.
- **Impacto:** o projeto não compila; nenhum deploy é possível.
- **Correção:** `navigate({ to: "/auditoria", search: { tab: "log" } })`.

## 1. Notas por área

| Área | Nota | Comentário |
|---|---|---|
| Arquitetura / organização | 5 | Rotas flat, arquivos de 1-2 mil linhas, negócio dentro de componentes |
| Rotas e módulos | 6 | 29 rotas; 2 stubs reais (`alertas`, `anexos`) |
| Autenticação | 4 | Guard apenas no cliente (`auth-gate.tsx`), sem `beforeLoad` |
| RBAC | 3 | `RoleGate` é UI; server fns críticas sem checagem de papel |
| RLS / banco | 4 | RLS ativo, mas muito `USING (true)` e insert anônimo forjável |
| Migrations | 5 | 90 arquivos; políticas duplicadas/sobrepostas |
| Fila / concorrência | 3 | `userId` vindo do cliente + service role; fila visível a todos em realtime |
| Pagamentos / lançamentos | 5 | Completo, mas exclusão em massa sem auth no servidor |
| Conciliação | 5 | Motor real, porém parser monetário próprio e O(n×m) no navegador |
| Auditoria | 7 | Trilha imutável por trigger é o ponto mais forte do sistema |
| Fechamento | 4 | Delete em massa via service role sem autenticação |
| Despesas fixas | 6 | Funcional; leitura liberada a qualquer logado; busca central é placeholder |
| Provisão | 5 | Trigger de sincronização boa; RLS só-admin divergente da UI |
| Importação / exportação | 6 | `money.ts` resolveu a raiz monetária; parsing todo no cliente |
| Notificações | 6 | Visual ok; estado de leitura parcialmente em localStorage |
| IA | 4 | Inativada, mas componentes, canais realtime e tabelas seguem no bundle |
| Tratamento de erros | 3 | 2 de 29 rotas com `errorComponent`; falhas só em toast; erros engolidos |
| Performance | 4 | ~25 `select('*')` sem `limit`; agregação e casamento no cliente |
| UX / UI | 8 | Identidade translúcida consistente, atalhos, busca global |
| Acessibilidade | 4 | Ícones sem label, tabelas densas, bloco `sr-only` poluído |
| Manutenção | 4 | 99 `as any`; formatadores de data duplicados por rota |
| Legado / duplicidade | 4 | `FloatingAI` morto no bundle, `check_user_permission` nunca chamada |

**Média aproximada: 4,7/10** — funciona como ferramenta interna; ainda não é grau corporativo.

## 2. Achados

### Crítica
1. **Server functions destrutivas sem autenticação, usando service role** — [CONFIRMADO]
   `src/lib/fechamento-pagamentos.functions.ts` (insere fechamento e apaga `pagamentos_diversos` em massa), `src/lib/pagamentos-admin.functions.ts` (exclusão lógica por IDs com `userId`/nome do cliente → auditoria forjável), `src/lib/concorrencia.functions.ts` (fila). Nenhuma usa `requireSupabaseAuth` nem checa papel. Impacto: perda de base financeira por chamada anônima ao endpoint. Correção: `requireSupabaseAuth` + `assertAdmin`, identidade sempre do token. **Agora.**
2. **Escalonamento de privilégio em permissões** — [CONFIRMADO]
   `src/lib/admin-users.functions.ts` (~311-408): `toggleUserModule`, `setUserSpecificPermission`, `removeUserSpecificPermission`, `getUserSpecificPermissions` exigem login mas não exigem admin, e escrevem com service role em `user_modules`/`user_specific_permissions`. Qualquer usuário autenticado concede permissões a si mesmo. Correção: `assertAdmin` em todas. **Agora.**
3. **Insert anônimo forjável em `solicitacao_updates`** — [CONFIRMADO pelo scan]
   Política `solicitante insert updates` permite `anon` + `authenticated` apenas checando `autor_tipo = 'solicitante'`, sem vínculo com identidade. Qualquer pessoa na internet injeta mensagens/status em qualquer chamado. Correção: restringir a `authenticated` com validação de titularidade ou mover para server fn. **Agora.**
4. **Erro de build** (seção 0) — [CONFIRMADO]. **Agora.**
5. **Dump de código-fonte público** — [CONFIRMADO] `public/codigo-fonte-portal-pagadoria.txt` (~1,6 MB) é asset estático; o gate por e-mail em `src/components/documentacao-tecnica-section.tsx:31` é apenas visual. Correção: remover do `public/`. **Agora.**

### Alta
6. **Sem proteção de rota no servidor** — [CONFIRMADO] `src/components/auth-gate.tsx` decide via `getSession()` no cliente; nenhum `beforeLoad` ou subtree `_authenticated`. Todo o JS de todos os módulos é entregue a anônimos e há flash/corrida de redirect. Correção: mover módulos para `_authenticated/`. **Depois (Fase 2).**
7. **RBAC decorativo** — [CONFIRMADO] `src/components/role-gate.tsx` só condiciona renderização; nenhuma query ou server fn é bloqueada. A barreira real é só RLS. **Fase 2.**
8. **Papel lido de `user_metadata` / e-mail fixo** — [CONFIRMADO] `src/hooks/use-session.ts:41`, `src/routes/configuracoes.tsx:438` (`setor === "ADMINISTRADOR"` ou e-mail). `user_metadata` é editável pelo próprio usuário. **Fase 2.**
9. **RLS permissiva em dados financeiros** — [CONFIRMADO] `USING (true)` no SELECT de `pagamentos_diversos`, `despesas_fixas`, `despesas_fixas_notas`, `lancamentos`, `aprovacoes`, `pedidos_orcamento`, `fechamento_*`, `conciliacao_historico`, `concorrencia_fila`, `app_config`, `portal_settings`. `viewer`/`visitante` leem tudo, contrariando a matriz de acesso prometida. **Fase 2.**
10. **`conciliacao_historico` sem escopo** — [CONFIRMADO] política nomeada "seu histórico" com `USING (true)`: todos veem arquivos e sumários de todos. **Fase 2.**
11. **Parser monetário próprio na conciliação** — [CONFIRMADO] `src/lib/conciliacao-engine.ts:62-63,83-84` refaz `replace(/[^\d.,]/g,"").replace(",",".")`, exatamente o padrão que `src/lib/money.ts` foi criado para eliminar. [RISCO] reintrodução do erro ×100/÷100 em extratos com texto pt-BR → conciliação aprovando valores errados. Correção: usar `parseMoney`. **Agora ou Fase 2 (baixo custo, alto risco financeiro).**
12. **Funções SECURITY DEFINER expostas** — [CONFIRMADO pelo linter] 26 executáveis por qualquer logado, 2 por anônimo, 1 com `search_path` mutável. Inclui fechamento/purga. Correção: revogar `EXECUTE`, fixar `search_path`. **Fase 2.**

### Média
13. **Stubs reais em produção** — [CONFIRMADO] `src/routes/alertas.tsx:20-24` é `ModuleStub` ("Fase 5"); `src/routes/anexos.tsx:14-84` é UI estática, botão "Enviar arquivo" sem `onClick`, "Nenhum arquivo" fixo, sem Storage. Impacto: usuário acredita que o módulo existe. Correção: implementar ou ocultar do menu/dashboard. **Depois.**
14. **Placeholders dentro de módulos completos** — [CONFIRMADO] `src/routes/despesas-fixas.tsx:322` (`toast.info("Busca centralizada disponível em breve")`), `src/routes/index.tsx:244,264` (`updated: "em breve"`). **Depois.**
15. **Tratamento de erros** — [CONFIRMADO] apenas `__root.tsx` e `principal.index.tsx` têm `errorComponent`; nenhuma rota usa `loader`. `conciliacao-engine.ts:194-228` engole falha de exportação em `console.error` — o usuário não recebe aviso e perde o arquivo. **Fase 3.**
16. **Consultas sem limite** — [CONFIRMADO] `conciliacao.functions.ts:12,52`, `lancamentos.ts:90,106,117`, `pagamentos.ts:33,56,98`, `provisao.ts:67,90,101`, `provisao-fechamento*.ts`, `fechamento-governance.functions.ts:26,63`, `auditoria.tsx:68`, `historico.tsx:103`. Existe padrão correto em `exportacao.tsx:87-107` (`.range` paginado) e `registros-excluidos.functions.ts` (`.limit(500)`). [RISCO] degradação e timeout conforme a base cresce. **Fase 3.**
17. **Casamento de conciliação O(n×m) no navegador** — [CONFIRMADO] `conciliacao-engine.ts:104-192`, 7 heurísticas por par, sem chunk/worker, sobre datasets carregados inteiros. **Fase 3.**
18. **Divergência UI × RLS na Provisão** — [CONFIRMADO] `provisao_diaria` só permite SELECT a admin, mas a tela é oferecida a outros perfis → tela vazia sem erro claro. **Fase 3.**
19. **Fila e perfis vazando por Realtime** — [CONFIRMADO pelo scan] `concorrencia_fila` publica `user_nome`/`session_id`/atividade a qualquer logado; `profiles` transmite e-mail/setor/presença a todos. **Fase 3.**
20. **`check_user_permission` nunca chamada** — [CONFIRMADO] matriz existe no banco, front decide por papel; divergência entre o que a tela mostra e o que o banco permite. **Fase 3.**
21. **Migrations sobrepostas** — [CONFIRMADO] `profiles` com 3 políticas SELECT equivalentes, `lancamentos` com 2 SELECT + 2 write duplicadas. Dificulta auditar acesso. **Fase 3.**
22. **Estado crítico em localStorage** — [CONFIRMADO] snooze/dismiss de notificações, highlights de pagamentos, modo planilha: não sincroniza entre dispositivos nem é auditável. **Fase 4.**
23. **Legado da IA no bundle** — [CONFIRMADO] `FloatingAI` importado em `__root.tsx:21` e comentado em `:195`; canais realtime `ia_status_*` em `FloatingAI.tsx`, `ia-banner-offline.tsx`, `header-actions.tsx`; `ia.functions.ts` devolve 403; tabelas `ia_conversas`/`ia_user_patterns` ativas. **Fase 4.**

### Baixa
24. **Formatadores de data duplicados** — [CONFIRMADO] `divergencias.tsx:36`, `pagamentos.tsx:1126`, `conciliacao.tsx:450`, `fechamento.tsx:213`, `index.tsx:305,418`, `aprovacao.tsx:522`, com tratamentos de nulo diferentes. Não existe `src/lib/date`. **Fase 4.**
25. **99 `as any`** contornando os tipos gerados. **Fase 4.**
26. **Arquivos gigantes** — `pagamentos.tsx` 1.998, `despesas-fixas.tsx` 1.174, `configuracoes.tsx` 1.057, `material-apoio.tsx` 859, `registros-excluidos.tsx` 826. **Fase 4.**
27. **Bloco `sr-only` em `__root.tsx:130-169`** — roteiro interno exposto no HTML e lido por leitores de tela. **Fase 4.**
28. **Acessibilidade** — falta `aria-label` em ações icônicas, ordem de foco em diálogos densos, contraste do tema noturno não validado. **Fase 4.**
29. **Round-trips sequenciais** — `conciliacao-engine.ts:31-53` sem `Promise.all`; `portal-search.ts:46-70` faz 5 queries em vez de uma RPC. **Fase 4.**

## 3. Top 10 por importância

1. Server fns destrutivas sem autenticação (fechamento/pagamentos/fila) — Crítica
2. Escalonamento de privilégio nas funções de permissão — Crítica
3. Insert anônimo forjável em `solicitacao_updates` — Crítica
4. Erro de build do atalho `/auditoria` — Crítica
5. Dump de código-fonte servido publicamente — Crítica
6. Ausência de proteção de rota no servidor + RBAC decorativo — Alta
7. RLS `USING (true)` em tabelas financeiras e no histórico de conciliação — Alta
8. Parser monetário divergente no motor de conciliação — Alta
9. Funções SECURITY DEFINER abertas / `search_path` mutável — Alta
10. Consultas sem limite + casamento O(n×m) no cliente — Média (vira Alta com crescimento da base)

## 4. Plano de correção por prioridade

**Fase 1 — Bloqueadores (agora)**
1. Corrigir o `navigate` de `/auditoria`.
2. `requireSupabaseAuth` + `assertAdmin` em `fechamento-pagamentos.functions.ts`, `pagamentos-admin.functions.ts` e nas funções de módulo/permissão de `admin-users.functions.ts`; identidade sempre do token.
3. Reescrever `concorrencia.functions.ts` para derivar `userId` do token.
4. Corrigir a política de `solicitacao_updates`.
5. Remover `public/codigo-fonte-portal-pagadoria.txt`.
6. Trocar o parser inline de `conciliacao-engine.ts` por `parseMoney`.

**Fase 2 — Fronteira de segurança (semana 1)**
7. Mover módulos para `src/routes/_authenticated/`.
8. Substituir checagens por `user_metadata`/e-mail por `has_role` validado no servidor.
9. Endurecer RLS das tabelas financeiras; escopar `conciliacao_historico`; restringir campos da fila e de `profiles` no Realtime.
10. Revogar `EXECUTE` das SECURITY DEFINER administrativas e fixar `search_path`.

**Fase 3 — Confiabilidade (semanas 2-3)**
11. `errorComponent`/`notFoundComponent` em todas as rotas; padronizar erro de mutação; nunca engolir falha de exportação.
12. Paginação e filtros no servidor em todas as listagens; virtualizar tabelas grandes; mover o casamento da conciliação para o servidor ou em lotes.
13. Alinhar UI e RLS da Provisão; adotar `check_user_permission` como autorização única.
14. Consolidar migrations de política e documentar a matriz de acesso.

**Fase 4 — Manutenibilidade (mês 2)**
15. Implementar ou ocultar `alertas` e `anexos`; eliminar placeholders "em breve".
16. Extrair lógica de `pagamentos`, `despesas-fixas`, `configuracoes` para hooks/serviços.
17. Criar `src/lib/date` e remover formatadores duplicados; reduzir `as any`.
18. Remover ou reativar formalmente o legado de IA; mover estado crítico do localStorage para o banco.
19. Passe de acessibilidade e limpeza do bloco `sr-only`.

## Observações

- Pontos fortes reais: trilha de auditoria imutável por trigger, bloqueio de exclusão física com restauração admin, `money.ts` como fonte financeira única, identidade visual consistente, busca e atalhos globais.
- Não verificado nesta rodada: volume real das tabelas (define se as consultas sem limite já doem hoje), e se o hosting bloqueia `/codigo-fonte-portal-pagadoria.txt` fora do repositório.
- Nenhuma alteração foi feita. Aprovar este plano executa apenas a Fase 1.
