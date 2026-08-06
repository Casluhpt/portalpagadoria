# Plano de Padronização de Ícones (v2.7.6)

Para melhorar a consistência visual do portal conforme solicitado, os tamanhos dos ícones nos cards principais e elementos de interface serão padronizados seguindo a paleta de design "Minimalismo Translúcido".

## Alterações Propostas

### 1. Padronização de Ícones nos Cards
*   **KPI Cards (Dashboard):** Definir o tamanho fixo de `h-5 w-5` para todos os ícones de indicadores rápidos em `src/routes/index.tsx`.
*   **Module Cards (Dashboard):** Padronizar os ícones dos módulos para `h-6 w-6` dentro de seus respectivos contêineres em `src/routes/index.tsx`.
*   **Cards de Histórico de Versões:** Ajustar os ícones de categoria (Novo, Correção, Segurança, Ajuste) para `h-4 w-4` em `src/routes/index.tsx`.

### 2. Consistência em Outros Componentes
*   **App Sidebar:** Revisar os ícones do menu lateral para garantir que todos utilizem `h-4 w-4` em `src/components/app-sidebar.tsx`.
*   **Configurações:** Padronizar os ícones das abas e seções de diagnóstico para manter a harmonia visual em `src/routes/configuracoes.tsx`.

### 3. Registro de Versão
*   Criar uma migração para registrar a versão **v2.7.6** com foco em "Padronização da Identidade Visual e Consistência de Ícones".
*   Atualizar o contexto do sistema em `src/routes/__root.tsx`.

## Plano de Testes
*   Verificar visualmente se os ícones do dashboard possuem o mesmo peso visual.
*   Confirmar se a responsividade não foi afetada pelos tamanhos fixos.
*   Validar se o Histórico de Versões reflete a atualização v2.7.6.
