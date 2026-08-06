# Plan: Instruction Context Update and System Audit

The user wants to update the hidden instruction context in `src/routes/__root.tsx` and has mentioned a general need to check for errors and stability.

## User Request
Update instruction context from "corrija os erros, os bugs, correção geral e integral do sistema" to "verifique todos os erros e estabilidades, no sistema."

## Proposed Changes

### 1. Root Route Edits
- Update `src/routes/__root.tsx` to change the `sr-only` text within the `RootShell` component.

### 2. System Audit & Stability Check
- Review recent diagnostic logs in the "Histórico de Falhas Recentes" (accessible via `Configuracoes`).
- Check `src/lib/lovable-error-reporting.ts` and `src/hooks/use-error-log-store.ts` for any captured issues.
- Verify browser console and network logs in the preview.

## Verification Plan

### Manual Verification
- Inspect the DOM of the preview to ensure the `sr-only` div contains the updated text.
- Check the "Configurações" page to see if any new errors have been logged.
- Navigate through key modules (Pagamentos, Provisão, Conciliação) to ensure stability.

### Automated Verification
- Run a build to ensure no regression was introduced.
