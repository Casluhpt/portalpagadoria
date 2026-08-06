# Plano: Finalização da Organização do Sistema (v2.7.5)

Para concluir a organização geral do sistema, será realizada uma revisão final para garantir coesão, funcionalidade e aderência estética ao padrão **"Minimalismo Translúcido"**.

## 1. Auditoria de Navegação e Módulos
- **Conciliação de Líquidos:** Atualmente é uma aba dentro de `/conciliacao`. Vou adicionar um atalho direto no menu lateral para facilitar o acesso, conforme sugerido no plano de organização.
- **Hierarquia do Menu:** Revisar `app-sidebar.tsx` para garantir que a ordem dos grupos seja lógica (Operacional -> Financeiro -> Apoio).

## 2. Indicadores de Status e Governança
- **Status do Sistema:** Implementar um pequeno indicador visual de "Sistema Operacional" no rodapé do menu lateral ou no cabeçalho, reforçando a percepção de estabilidade.
- **Documentação de Versões:** Criar o arquivo `CHANGELOG.md` na raiz do projeto para servir como registro técnico imutável das atualizações, espelhando o que está no banco de dados.

## 3. Padronização Visual e UX
- **Datas (PT-BR):** Revisar os módulos de `Despesas Fixas` e `Controle E-Social` para garantir que todas as exibições de data sigam estritamente o formato `DD/MM/AAAA`.
- **Elementos Flutuantes:** Ajustar o `BackButton` e o `FloatingAI` para garantir que em telas mobile eles não atrapalhem a leitura do conteúdo inferior (rodapé).

## 4. Segurança e Restrições
- **Documentação Técnica:** Confirmar que o acesso aos downloads permanece exclusivo para `lucas.chaves.lc2001@gmail.com`.
- **RBAC:** Verificar se a aba "Segurança" nas configurações está acessível apenas para Administradores.

## 5. Histórico de Versões
- Sincronizar o histórico para garantir que a entrada **v2.7.5** esteja presente como a versão de "Organização e Estabilização".

---

### Alterações propostas:
- `src/components/app-sidebar.tsx`: Reorganização e inclusão do Status do Sistema.
- `src/routes/configuracoes.tsx`: Ajuste de visibilidade de abas.
- `src/routes/despesas-fixas.tsx`: Padronização de datas.
- `src/routes/esocial.tsx`: Padronização de datas.
- `CHANGELOG.md`: Criação do arquivo.
- `supabase migration`: Registro da v2.7.5.
