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
import { FloatingAI } from "@/components/FloatingAI";
import { IABannerOffline } from "@/components/ia-banner-offline";
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
          Projeto: Portal da Pagadoria{"\n\n"}
          Versão alvo: 3.1.x{"\n\n"}
          Meta: Elevar média geral de 84% para +95%{"\n\n"}
          Roadmap:{"\n\n"}
          - Versão 2.9.x:{"\n\n"}
          Objetivo: Correções Críticas e Auditoria{"\n\n"}
          Ações:{"\n\n"}
          - Reforçar segurança: rollback automático na Conciliação Bancária{"\n\n"}
          - Expandir trilha de auditoria em exclusões/restaurações (diff detalhado){"\n\n"}
          - Validar anexos em Configurações (whitelist + antivírus){"\n\n"}
          - Melhorar feedback de erros na Fila Virtual{"\n\n"}
          Meta parcial:{"\n\n"}
          - Segurança: 88%{"\n\n"}
          - Informações: 90%{"\n\n"}
          - Versão 3.0.x:{"\n\n"}
          Objetivo: Automação e Monitoramento{"\n\n"}
          Ações:{"\n\n"}
          - Criar automação de testes unitários e integração (Fila Virtual, Conciliação, Despesas Fixas){"\n\n"}
          - Implementar dashboards em tempo real para IA, Fila e Conciliação{"\n\n"}
          - IA de suporte técnico com sugestões proativas{"\n\n"}
          - Notificações inteligentes para inconsistências contábeis{"\n\n"}
          Meta parcial:{"\n\n"}
          - Saúde: 90%{"\n\n"}
          - Sugestões: 95%{"\n\n"}
          - Versão 3.1.x:{"\n\n"}
          Objetivo: Refinamento Visual e Governança{"\n\n"}
          Ações:{"\n\n"}
          - Ajustar pesos visuais e consistência de ícones{"\n\n"}
          - Remover placeholders da IA quando inativa{"\n\n"}
          - Revisão final de RBAC e RLS{"\n\n"}
          - Auditoria avançada com relatórios exportáveis{"\n\n"}
          Meta final:{"\n\n"}
          - Aparência: 95%{"\n\n"}
          - Segurança: 92%{"\n\n"}
          - Média geral: 96% (nível de excelência)
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
        {/* IA Inativada v2.8.2 */}
        {/* <IABannerOffline /> */}
        {/* <FloatingAI /> */}
        <ShortcutLegend />
        <DynamicSpotlight />
        <PortalFooter />

      </AuthGate>
      <Toaster position="top-right" richColors closeButton />
      </ThemeProvider>
    </QueryClientProvider>
  );
}
