# Plano – Refinamento e Correção do Módulo de Conciliação

## Objetivo
Refinar todo o módulo de Conciliação Bancária, corrigindo inconsistências, eliminando erros existentes e garantindo que o fluxo funcione de forma intuitiva, rápida e padronizada com o restante do Portal Pagadoria.

## 1. Atualização do Contexto Global
Atualizar a instrução oculta em `src/routes/__root.tsx`.
**Novo texto:**
"Antes de realizar qualquer alteração, analise todo o contexto da solicitação do usuário e considere sempre o comando mais recente enviado. Antes de criar novas funcionalidades, verifique o que está faltando, identifique inconsistências, corrija erros existentes e somente depois implemente melhorias."

## 2. Auditoria e Limpeza Técnica
Realizar varredura no módulo de conciliação para eliminar:
- Erros de tipagem e warnings do TypeScript.
- Imports não utilizados e código morto.
- Componentes e funções duplicadas ou obsoletas.
- Possíveis memory leaks e gargalos de performance.
- Chamadas de API ou consultas redundantes.

## 3. Fluxo de Conciliação Padronizado
Implementar um fluxo sequencial obrigatório:
1.  **Passo 1**: Selecionar Data Inicial e Data Final.
2.  **Passo 2**: Upload do Extrato Bancário.
3.  **Passo 3**: Upload da Planilha Financeira (Portal).
4.  **Passo 4**: Execução do Motor de Conciliação.
5.  **Passo 5**: Apresentação de Resultados.
*Nota: Impedir a execução de etapas fora de ordem.*

## 4. Validações Robustas
Implementar validações com mensagens claras para:
- Intervalos de datas (fim antes do início, campos vazios).
- Integridade do arquivo (corrompido, duplicado, sem registros).
- Estrutura do arquivo (layout, colunas obrigatórias, tipos de valores).

## 5. Evolução do Motor Inteligente
Aprimorar o algoritmo de comparação usando:
- Data, Valor, Documento, Histórico, CPF/CNPJ, Favorecido, Banco, Agência e Conta.
- Sugestão de correspondências para pequenas diferenças (conciliação parcial).

## 6. Tratamento de Erros e Logs
- Implementar `try/catch` em todos os processos críticos.
- Garantir mensagens amigáveis ao usuário e logs detalhados para diagnóstico.
- Recuperação automática de falhas onde for tecnicamente viável.

## 7. Interface e Experiência (UX/UI)
- Padronizar o design "Minimalismo Translúcido" (glassmorphism, bordas suaves, transparência).
- Garantir responsividade e espaçamento consistente.
- Implementar Barra de Progresso para processamentos longos.
- Adicionar Resumo Final (contagem de registros, sucesso, tempo de execução).

## 8. Dashboard Dinâmico
- Vincular todos os indicadores (Total, Pendências, Divergências, Valores) ao filtro de período selecionado.

## 9. Gestão de Dados e Exportação
- Habilitar botões de exportação (Excel, CSV, PDF) apenas com dados válidos.
- Implementar Histórico de Conciliações e Log de Auditoria.
- Adicionar funcionalidade de "Desfazer Conciliação".

## 10. Verificação Final
- Testes automatizados de fluxo completo.
- Inspeção de console e ferramentas de desenvolvedor.
- Revisão de acessibilidade e consistência visual.
