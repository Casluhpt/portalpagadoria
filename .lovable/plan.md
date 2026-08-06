# Plan - Refinement and Bug Fixes for Conciliation Module

The user wants to update the hidden context instruction in the `body` and requested to "check what is missing and fix the errors". Since there are no specific runtime errors reported, I will perform a general health check on the `conciliacao` module, focusing on common pitfalls in TanStack Start (missing imports, type mismatches, or UI inconsistencies) and ensuring the new date-based flow is robust.

## Proposed Changes

### 1. Root Layout Update
- Update the `.sr-only` div in `src/routes/__root.tsx` to match the new user instruction: "Antes de realizar qualquer ação, entenda o contexto e instrução recente do usuário, comando mais recente enviado por ele: verifique oque falta e corrija os erros por faovr".

### 2. Conciliation Module Health Check & Refinement
- **Validation Consistency**: Ensure date range validation is applied everywhere (dashboard summaries, Weekly view, and the main Conciliation flow).
- **Error Handling**: Add more specific try/catch blocks in the intelligent matching engine to prevent silent failures during large file imports.
- **UI Consistency**: Ensure all cards and tables follow the "Minimalismo Translúcido" theme (glassmorphism, subtle borders, translucent backgrounds).
- **Performance**: Optimize the preview query to avoid redundant fetches while the user is still typing/picking dates.

### 3. Verification
- Use Playwright to simulate a date range selection and verify that:
    - Invalid ranges show error messages.
    - Valid ranges trigger the preview table.
    - Export buttons are disabled when data is missing or invalid.

## Clarifying Questions
- Are there specific errors you've encountered that weren't captured in the recent logs (e.g., during file import or a specific export format)?
- Do you want the "Dashboard" indicators in the Conciliation page to also respond to the selected date range, or should they remain as overall system stats?
