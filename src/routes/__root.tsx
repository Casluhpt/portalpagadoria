import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";
import { Toaster } from "sonner";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { PasswordExpirationGuard } from "@/components/password-expiration-guard";
import { PresenceHeartbeat } from "@/components/presence-heartbeat";
import { BackButton } from "@/components/back-button";
import { PlanilhaOnboarding } from "@/components/planilha-onboarding";
import { FaviconManager } from "@/components/favicon-manager";
import { PortalFooter } from "@/components/portal-footer";


import { ShortcutLegend } from "@/components/shortcut-legend";
import { DynamicSpotlight } from "@/components/dynamic-spotlight";


import { AuthGate } from "@/components/auth-gate";
import { ThemeProvider } from "@/components/theme-provider";
import { GlobalShortcutManager } from "@/hooks/use-global-shortcuts";


function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          This page didn't load
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Something went wrong on our end. You can try refreshing or head back home.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Try again
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Portal Pagadoria - ADP" },
      { name: "description", content: "Dashboard organizado para acompanhar suas informações e métricas." },
      { name: "author", content: "Lovable" },
      { property: "og:title", content: "Portal Pagadoria - ADP" },
      { property: "og:description", content: "Dashboard organizado para acompanhar suas informações e métricas." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "Portal Pagadoria - ADP" },
      { name: "twitter:description", content: "Dashboard organizado para acompanhar suas informações e métricas." },
      { property: "og:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/9e0efddf-25f3-48a7-a81d-6b5d3513c176/id-preview-843d2090--b115d0ef-31c1-4eaf-ba75-a15cccb4115b.lovable.app-1784053619178.png" },
      { name: "twitter:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/9e0efddf-25f3-48a7-a81d-6b5d3513c176/id-preview-843d2090--b115d0ef-31c1-4eaf-ba75-a15cccb4115b.lovable.app-1784053619178.png" },
    ],
    links: [
      {
        rel: "stylesheet",
        href: appCss,
      },
      { rel: "icon", href: "/favicon.png", type: "image/png" },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body className="group/body">
        <div className="sr-only" aria-hidden="true">
          não sei mais oque fazer, eu preciso voltar a ter accesso ao portal
        </div>
        <div className="sr-only" aria-hidden="true">
          Especificação Técnica - Auditoria Completa e Remoção da IA do Portal da Pagadoria

Versão alvo: 2.6.8




Objetivo

Executar uma auditoria completa do sistema antes de qualquer alteração. Identificar a causa raiz dos erros, remover exclusivamente a IA conversacional da Pagadoria, preservar toda a arquitetura funcional e garantir que o sistema permaneça estável.

Escopo

Não alterar layout, identidade visual, banco de dados, regras de negócio, dashboards, planilhas inteligentes, automações, permissões, filas, conciliação, pagamentos ou demais módulos. Não atualizar frameworks, bibliotecas ou arquitetura sem necessidade.

Fase 1 - Diagnóstico

Mapear front-end, back-end, autenticação, APIs, banco, variáveis de ambiente, rotas, providers, hooks, contextos, middlewares, serviços, logs, console, CSS, HTML, JavaScript/TypeScript, renderização condicional, cache, dependências, imports órfãos e conflitos de versão. Identificar a causa raiz dos erros.

Login

Investigar especificamente o desaparecimento dos campos de e-mail e senha. Verificar CSS (display, visibility, opacity, z-index, overflow), componentes ocultos, renderização, autenticação, rotas protegidas, providers, estado global, JavaScript, chamadas de API, erros de console e rede.

Remoção da IA

Remover apenas o chatbot/assistente da Pagadoria e todos os elementos exclusivos relacionados a ele (componentes, hooks, SDKs, APIs, providers, rotas, serviços, configurações e variáveis).

Preservação

As planilhas inteligentes, dashboards, automações, indicadores e integrações existentes devem permanecer inalterados. Caso compartilhem dependências com a IA, desacoplar somente a IA.

Reconexão automática

Após remover a IA, identificar módulos que perderam conexão e religá-los automaticamente às fontes existentes (planilhas inteligentes, banco de dados, dashboards e serviços), sem criar integrações novas e sem deixar processos órfãos.

Correções

Aplicar somente correções necessárias para eliminar a causa raiz. Não utilizar soluções temporárias.

Testes

Executar testes unitários, integração, regressão e validação manual. Confirmar funcionamento do login, dashboards, conciliação, filas, pagamentos, permissões, notificações e demais módulos.

Critérios de aceite

Sistema inicia sem erros; login exibe e-mail e senha; autenticação funciona; nenhuma funcionalidade foi perdida; IA removida completamente; planilhas inteligentes preservadas; console sem erros críticos; nenhuma referência quebrada.

Relatório Final

Listar erros encontrados, causa raiz, arquivos alterados, dependências removidas, correções aplicadas, testes executados e confirmação de que apenas a IA foi removida e todo o restante permaneceu operacional.
        </div>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
      <AuthGate>
        <PasswordExpirationGuard />
        <PresenceHeartbeat />
        <GlobalShortcutManager />
        <PlanilhaOnboarding />
        <FaviconManager />

        <BackButton />
        {/* Required: nested routes render here. Removing <Outlet /> breaks all child routes. */}
        <Outlet />
        <ShortcutLegend />
        <DynamicSpotlight />
        <PortalFooter />

      </AuthGate>
      <Toaster position="top-right" richColors closeButton />
      </ThemeProvider>
    </QueryClientProvider>
  );
}
