import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Building2, Calendar, Landmark, ListChecks, Send, Wallet } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { fetchAllProvisao, provisaoQueryKey } from "@/lib/provisao";
import { comunicadosQueryKey, publicarComunicado } from "@/lib/comunicados";
import { useSession } from "@/hooks/use-session";
import profarmaLogo from "@/assets/profarma-logo.png.asset.json";

export const Route = createFileRoute("/provisao/")({
  component: ProvisaoDashboard,
});

const brl = (n: number) =>
  n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const today = () => new Date().toISOString().slice(0, 10);
const firstOfMonth = () => {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().slice(0, 10);
};
const fmtBR = (iso: string) =>
  new Date(iso + "T00:00:00").toLocaleDateString("pt-BR");

function ProvisaoDashboard() {
  const [dateFrom, setDateFrom] = useState<string>(firstOfMonth());
  const [dateTo, setDateTo] = useState<string>(today());
  const { user } = useSession();
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: provisaoQueryKey,
    queryFn: fetchAllProvisao,
    staleTime: 30_000,
  });

  const notificar = useMutation({
    mutationFn: () => {
      if (!user) throw new Error("Usuário não autenticado");
      return publicarComunicado(
        "Provisão Diária",
        "A Provisão Diaria foi enviada com sucesso.",
        user.id,
      );
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: comunicadosQueryKey });
      toast.success("Notificação enviada a todos os colaboradores.");
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Falha ao notificar"),
  });

  const filtered = useMemo(
    () =>
      (data ?? []).filter(
        (r) => r.data != null && r.data >= dateFrom && r.data <= dateTo,
      ),
    [data, dateFrom, dateTo],
  );

  // Group by empresa + banco, sorted desc by valor
  const grouped = useMemo(() => {
    const map = new Map<string, { empresa: string; banco: string; valor: number }>();
    for (const r of filtered) {
      const empresa = (r.empresa ?? "—").trim() || "—";
      const banco = (r.banco ?? "—").trim() || "—";
      const key = `${empresa}||${banco}`;
      const cur = map.get(key) ?? { empresa, banco, valor: 0 };
      cur.valor += r.valor ?? 0;
      map.set(key, cur);
    }
    return [...map.values()].sort((a, b) => b.valor - a.valor);
  }, [filtered]);

  const totalGeral = grouped.reduce((s, r) => s + r.valor, 0);
  const qtdEmpresas = new Set(grouped.map((g) => g.empresa)).size;
  const qtdLancamentos = filtered.length;

  const bancoTop = useMemo(() => {
    const m = new Map<string, number>();
    for (const g of grouped) m.set(g.banco, (m.get(g.banco) ?? 0) + g.valor);
    let top: { banco: string; valor: number } | null = null;
    for (const [banco, valor] of m) {
      if (!top || valor > top.valor) top = { banco, valor };
    }
    return top;
  }, [grouped]);

  const rangeLabel = `${fmtBR(dateFrom)} a ${fmtBR(dateTo)}`;


  return (
    <main className="flex-1 space-y-6 p-6">
      {/* Cards */}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Total Provisionado no Dia"
          value={brl(totalGeral)}
          icon={<Wallet className="h-5 w-5" />}
          highlight
        />
        <StatCard
          title="Quantidade de Empresas"
          value={qtdEmpresas.toString()}
          icon={<Building2 className="h-5 w-5" />}
        />
        <StatCard
          title="Quantidade de Lançamentos"
          value={qtdLancamentos.toString()}
          icon={<ListChecks className="h-5 w-5" />}
        />
        <StatCard
          title="Banco com Maior Valor"
          value={bancoTop ? bancoTop.banco : "—"}
          hint={bancoTop ? brl(bancoTop.valor) : undefined}
          icon={<Landmark className="h-5 w-5" />}
        />
      </div>

      {/* Main table */}
      <Card className="overflow-hidden border-emerald-200 shadow-sm">


        <CardHeader className="flex flex-row items-center justify-between gap-4 bg-emerald-700 py-4 text-emerald-50">
          <div className="flex items-center gap-3">
            <img
              src={profarmaLogo.url}
              alt="Profarma"
              className="h-8 rounded bg-white/95 px-2 py-1"
            />
            <CardTitle className="text-lg font-bold tracking-wide">
              ADP - PAGADORIA
            </CardTitle>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Label
              htmlFor="prov-from"
              className="flex items-center gap-1.5 text-sm font-medium text-emerald-50"
            >
              <Calendar className="h-4 w-4" /> PERÍODO
            </Label>
            <Input
              id="prov-from"
              type="date"
              value={dateFrom}
              max={dateTo}
              onChange={(e) => setDateFrom(e.target.value)}
              className="h-9 w-[160px] border-emerald-300 bg-white text-sm text-slate-900"
            />
            <span className="text-sm text-emerald-50">a</span>
            <Input
              id="prov-to"
              type="date"
              value={dateTo}
              min={dateFrom}
              onChange={(e) => setDateTo(e.target.value)}
              className="h-9 w-[160px] border-emerald-300 bg-white text-sm text-slate-900"
            />
            <span className="rounded bg-emerald-50 px-2 py-1 text-sm font-semibold text-emerald-900">
              {rangeLabel}
            </span>
          </div>


        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="min-w-full border-collapse text-base">
              <thead>
                <tr className="bg-emerald-600 text-emerald-50">
                  <th className="border-r border-emerald-500 px-4 py-2.5 text-left font-bold">
                    EMPRESA
                  </th>
                  <th className="border-r border-emerald-500 px-4 py-2.5 text-left font-bold">
                    BANCO
                  </th>
                  <th className="px-4 py-2.5 text-right font-bold">VALOR</th>
                </tr>
              </thead>
              <tbody>
                {isLoading && (
                  <tr>
                    <td colSpan={3} className="px-4 py-10 text-center text-muted-foreground">
                      Carregando…
                    </td>
                  </tr>
                )}
                {!isLoading && grouped.length === 0 && (
                  <tr>
                    <td colSpan={3} className="px-4 py-10 text-center text-muted-foreground">
                      Nenhum lançamento no período {rangeLabel}.
                    </td>
                  </tr>
                )}
                {grouped.map((g, i) => (
                  <tr
                    key={`${g.empresa}-${g.banco}`}
                    className={i % 2 === 0 ? "bg-emerald-50/40" : "bg-white"}
                  >
                    <td className="border-b border-r border-emerald-200/60 px-4 py-2 font-semibold text-slate-800">
                      {g.empresa.toUpperCase()}
                    </td>
                    <td className="border-b border-r border-emerald-200/60 px-4 py-2 text-slate-700">
                      {g.banco}
                    </td>
                    <td className="border-b border-emerald-200/60 px-4 py-2 text-right font-medium tabular-nums text-slate-800">
                      {brl(g.valor)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-emerald-800 text-emerald-50">
                  <td colSpan={2} className="px-4 py-3 text-left text-base font-bold tracking-wide">
                    TOTAL GERAL
                  </td>
                  <td className="px-4 py-3 text-right text-lg font-bold tabular-nums">
                    {brl(totalGeral)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Ação principal */}
      <div className="flex justify-end">
        <Button
          onClick={() => notificar.mutate()}
          disabled={notificar.isPending || !user}
          size="lg"
          className="gap-2 bg-emerald-700 font-semibold text-white shadow-sm hover:bg-emerald-800"
        >
          <Send className="h-4 w-4" />
          {notificar.isPending ? "Enviando…" : "Notificar Envio"}
        </Button>
      </div>
    </main>

  );
}

function StatCard({
  title,
  value,
  hint,
  icon,
  highlight,
}: {
  title: string;
  value: string;
  hint?: string;
  icon: React.ReactNode;
  highlight?: boolean;
}) {
  return (
    <Card
      className={
        highlight
          ? "border-emerald-300 bg-gradient-to-br from-emerald-50 to-emerald-100 shadow-sm"
          : "border-border"
      }
    >
      <CardContent className="flex items-start justify-between gap-3 p-4">
        <div className="min-w-0">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            {title}
          </p>
          <p
            className={
              "mt-1 truncate text-2xl font-bold " +
              (highlight ? "text-emerald-800" : "text-foreground")
            }
          >
            {value}
          </p>
          {hint && <p className="mt-0.5 text-sm text-muted-foreground">{hint}</p>}
        </div>
        <div
          className={
            "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg " +
            (highlight ? "bg-emerald-600 text-white" : "bg-muted text-muted-foreground")
          }
        >
          {icon}
        </div>
      </CardContent>
    </Card>
  );
}
