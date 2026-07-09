import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, ListChecks, ShieldCheck, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PortalHeader } from "@/components/portal-header";
import { useIdentidade } from "@/hooks/use-identidade";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Portal Pagadoria/ADP — Profarma" },
      {
        name: "description",
        content:
          "Abra e acompanhe solicitações à equipe da Pagadoria/ADP da Profarma. Sem login, sem senha — apenas seu nome e e-mail corporativo.",
      },
      { property: "og:title", content: "Portal Pagadoria/ADP — Profarma" },
      {
        property: "og:description",
        content: "Atendimento simples e rastreável para demandas de folha, provisão e pagamentos.",
      },
    ],
  }),
  component: LandingPage,
});

function LandingPage() {
  const { identidade, hydrated } = useIdentidade();
  const ctaTo = hydrated && identidade ? "/nova-solicitacao" : "/identificar";
  const ctaLabel = hydrated && identidade ? "Abrir nova solicitação" : "Identificar-se";

  return (
    <div className="min-h-dvh bg-gradient-to-br from-slate-50 via-slate-50 to-violet-100">
      <PortalHeader />

      <main className="mx-auto max-w-6xl px-4 py-16">
        <section className="mx-auto max-w-3xl text-center">
          <span className="inline-flex items-center rounded-full border border-violet-200 bg-violet-50 px-3 py-1 text-xs font-medium text-violet-700">
            Pagadoria / ADP · Profarma
          </span>
          <h1 className="mt-4 text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
            Envie sua demanda à Pagadoria em poucos cliques
          </h1>
          <p className="mt-4 text-lg text-slate-600">
            Sem login, sem senha. Basta informar seu nome e e-mail corporativo para abrir e
            acompanhar suas solicitações.
          </p>

          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Button asChild size="lg" className="bg-violet-600 hover:bg-violet-700">
              <Link to={ctaTo}>
                {ctaLabel}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link to="/minhas-solicitacoes">
                <ListChecks className="mr-2 h-4 w-4" />
                Consultar minhas solicitações
              </Link>
            </Button>
          </div>
        </section>

        <section className="mt-16 grid gap-4 sm:grid-cols-3">
          <Feature
            icon={ShieldCheck}
            title="Simples e direto"
            text="Sem cadastro. Identifique-se com nome e e-mail corporativo."
          />
          <Feature
            icon={Clock}
            title="Rastreável"
            text="Cada solicitação recebe um código único e histórico completo."
          />
          <Feature
            icon={ListChecks}
            title="Acompanhe a qualquer hora"
            text="Consulte o andamento das suas demandas quando quiser."
          />
        </section>
      </main>
    </div>
  );
}

function Feature({
  icon: Icon,
  title,
  text,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  text: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-100 text-violet-700">
        <Icon className="h-5 w-5" />
      </div>
      <h3 className="mt-4 text-base font-semibold text-slate-800">{title}</h3>
      <p className="mt-1 text-sm text-slate-600">{text}</p>
    </div>
  );
}
