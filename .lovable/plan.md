# Plan: Finalizing System Organization (v2.7.5)

To finalize the "organization of the system" as requested, I will audit the main entry points, sidebar navigation, and administrative modules to ensure everything is cohesive, functional, and consistent with the "Minimalismo Translúcido" aesthetic.

## Audit & Cleaning Tasks

### 1. Unified Navigation Audit
- Verify if all new modules (Processo de Aprovação, Controle E-Social, Conciliação de Líquidos, Despesas Fixas) are correctly linked in `src/components/app-sidebar.tsx`.
- Ensure the sidebar categories are intuitive and reflect the current scope.

### 2. Branding Consistency
- Audit the `IdentidadeVisualPanel` in `src/components/admin/identidade-visual.tsx` to ensure all 6 branding areas are editable and applying styles globally.

### 3. Administrative Governance
- Review `src/routes/configuracoes.tsx` to ensure all tabs (Usuarios, Segurança, Identidade, Documentação) are restricted to authorized roles and fully functional.
- Verify that the interactive diagnostics are correctly pulling live data (or realistic mocks) and linking to the right audit areas.

### 4. Technical Documentation
- Ensure `src/components/documentacao-tecnica-section.tsx` is actually restricted by the email `lucas.chaves.lc2001@gmail.com` as requested previously, or now extended to all admins as per the latest context.

### 5. Final Polish (Visual & UX)
- Review the floating elements (`FloatingAI`, `BackButton`) for layout overlapping on mobile viewports.
- Apply the Brazilian date format (DD/MM/AAAA) to any missing legacy modules.

## Proposed Changes

### Configuration & UI
- Update `src/routes/__root.tsx` to change the hidden instruction context.
- Update `src/components/app-sidebar.tsx` to ensure a clean hierarchical structure.
- Add a "System Status" summary in the main dashboard or sidebar footer to increase perceived organization.

### Documentation
- Create a `CHANGELOG.md` or a dedicated "System Status" file to keep track of the final v2.7.x stable state.

## Verification Plan

- [ ] Check sidebar links for dead ends.
- [ ] Verify RBAC (Role-Based Access Control) on the "Configurações" tabs.
- [ ] Test the Brazilian date format in "Despesas Fixas" and "E-Social" modules.
- [ ] Ensure the Version History carousel shows v2.7.4 as the latest stable entry.
