import { createFileRoute, redirect } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Loader2, Plus, Trash2, Save, X, Wallet, Filter } from "lucide-react";

import { AppSidebar } from "@/components/app-sidebar";
import { HeaderActions } from "@/components/header-actions";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { supabase } from "@/integrations/supabase/client";
import {
  listDespesasFixas,
  upsertDespesaFixa,
  deleteDespesaFixa,
  CATEGORIAS_DESPESAS,
  type CategoriaDespesa,
  type DespesaFixa,
} from "@/lib/despesas-fixas.functions";

export const Route = createFileRoute("/despesas-fixas")({
  beforeLoad: async () => {
    const { data } = await supabase.auth.getSession();
    if (!data.session) throw redirect({ to: "/auth" });
  },
  component: DespesasFixasPage,
});

const MESES = [
  "Jan", "Fev", "Mar", "Abr", "Mai", "Jun",
  "Jul", "Ago", "Set", "Out", "Nov", "Dez",
];

const brl = (n: number) =>
  n.toLocaleString("pt-BR", { style: "currency", currency: "BRL", minimumFractionDigits: 2 });

const chipByCategoria: Record<CategoriaDespesa, string> = {
  PJ: "bg-blue-100 text-blue-800 border-blue-200",
  "Pensão": "bg-rose-100 text-rose-800 border-rose-200",
  Penhora: "bg-amber-100 text-amber-800 border-amber-200",
  Fornecedores: "bg-emerald-100 text-emerald-800 border-emerald-200",
};

/** Uma "linha" agrupa 12 meses da mesma (categoria, descricao). */
type LinhaAgrupada = {
  key: string;
  categoria: CategoriaDespesa;
  descricao: string;
  registros: (DespesaFixa | null)[]; // 12 posições (jan..dez)
  total: number;
};

function DespesasFixasPage() {
  const [ano, setAno] = useState<number>(2026);
  const [filtroCat, setFiltroCat] = useState<"todas" | CategoriaDespesa>("todas");
  const [busca, setBusca] = useState("");
  const [novaLinha, setNovaLinha] = useState<{ categoria: CategoriaDespesa; descricao: string } | null>(null);
  const [confirmDel, setConfirmDel] = useState<LinhaAgrupada | null>(null);

  const listFn = useServerFn(listDespesasFixas);
  const upsertFn = useServerFn(upsertDespesaFixa);
  const deleteFn = useServerFn(deleteDespesaFixa);
  const qc = useQueryClient();

  const queryKey = ["despesas-fixas", ano] as const;
  const { data = [], isLoading, error } = useQuery({
    queryKey,
    queryFn: () => listFn({ data: { ano } }),
    staleTime: 30_000,
  });

  const upsertMut = useMutation({
    mutationFn: (input: any) => upsertFn({ data: input }),
    onSuccess: () => qc.invalidateQueries({ queryKey }),
    onError: (e: any) => toast.error(e?.message ?? "Falha ao salvar"),
  });
  const delMut = useMutation({
    mutationFn: (id: string) => deleteFn({ data: { id } }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey });
      setConfirmDel(null);
      toast.success("Linha excluída");
    },
    onError: (e: any) => toast.error(e?.message ?? "Falha ao excluir"),
  });

  const linhas: LinhaAgrupada[] = useMemo(() => {
    const map = new Map<string, LinhaAgrupada>();
    data.forEach((r) => {
      const key = `${r.categoria}||${r.descricao}`;
      let l = map.get(key);
      if (!l) {
        l = {
          key,
          categoria: r.categoria,
          descricao: r.descricao,
          registros: Array.from({ length: 12 }, () => null),
          total: 0,
        };
        map.set(key, l);
      }
      l.registros[r.mes - 1] = r;
      l.total += Number(r.valor) || 0;
    });
    const arr = Array.from(map.values());
    arr.sort((a, b) => a.categoria.localeCompare(b.categoria) || a.descricao.localeCompare(b.descricao));
    return arr;
  }, [data]);

  const linhasFiltradas = useMemo(() => {
    const q = busca.trim().toLowerCase();
    return linhas.filter((l) => {
      if (filtroCat !== "todas" && l.categoria !== filtroCat) return false;
      if (q && !l.descricao.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [linhas, filtroCat, busca]);

  const totaisPorMes = useMemo(() => {
    const arr = Array.from({ length: 12 }, () => 0);
    linhasFiltradas.forEach((l) => l.registros.forEach((r, i) => { if (r) arr[i] += Number(r.valor) || 0; }));
    return arr;
  }, [linhasFiltradas]);

  const totaisPorCategoria = useMemo(() => {
    const m: Record<string, number> = {};
    CATEGORIAS_DESPESAS.forEach((c) => (m[c] = 0));
    linhasFiltradas.forEach((l) => { m[l.categoria] = (m[l.categoria] ?? 0) + l.total; });
    return m;
  }, [linhasFiltradas]);

  const totalGeral = totaisPorMes.reduce((a, b) => a + b, 0);

  const salvarValor = (linha: LinhaAgrupada, mes: number, valorStr: string) => {
    const valor = parseFloat(valorStr.replace(/\./g, "").replace(",", "."));
    if (!Number.isFinite(valor)) {
      toast.error("Valor inválido");
      return;
    }
    const existente = linha.registros[mes - 1];
    upsertMut.mutate({
      id: existente?.id,
      categoria: linha.categoria,
      descricao: linha.descricao,
      ano,
      mes,
      valor,
      observacao: existente?.observacao ?? null,
    });
  };

  const criarNovaLinha = async () => {
    if (!novaLinha) return;
    if (!novaLinha.descricao.trim()) { toast.error("Informe uma descrição"); return; }
    // cria um registro "seed" com valor 0 em janeiro pra materializar a linha
    await upsertMut.mutateAsync({
      categoria: novaLinha.categoria,
      descricao: novaLinha.descricao.trim(),
      ano,
      mes: 1,
      valor: 0,
      observacao: null,
    });
    toast.success("Linha adicionada — preencha os valores mensais.");
    setNovaLinha(null);
  };

  const excluirLinhaCompleta = async (linha: LinhaAgrupada) => {
    const ids = linha.registros.filter(Boolean).map((r) => r!.id);
    for (const id of ids) {
      // eslint-disable-next-line no-await-in-loop
      await deleteFn({ data: { id } });
    }
    qc.invalidateQueries({ queryKey });
    setConfirmDel(null);
    toast.success("Linha excluída");
  };

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-gradient-to-br from-slate-50 via-slate-100 to-emerald-50/40">
        <AppSidebar />
        <div className="flex flex-1 flex-col">
          <header className="sticky top-0 z-10 flex h-14 items-center gap-3 border-b border-slate-200 bg-white/80 px-4 backdrop-blur">
            <SidebarTrigger />
            <div className="flex items-center gap-2">
              <Wallet className="h-5 w-5 text-emerald-700" />
              <h1 className="text-sm font-semibold text-slate-800">Despesas Fixas</h1>
              <Badge variant="secondary">Ano {ano}</Badge>
            </div>
            <div className="ml-auto"><HeaderActions /></div>
          </header>

          <main className="flex-1 space-y-4 p-6">
            <p className="text-sm text-muted-foreground">
              Base de lançamentos das despesas fixas mensais (PJs, Pensão, Penhora e Fornecedores).
              Clique em qualquer célula mensal para editar o valor e pressione <kbd className="rounded border px-1 text-[10px]">Enter</kbd> para salvar.
            </p>

            {/* Totais por categoria */}
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              {CATEGORIAS_DESPESAS.map((c) => (
                <div key={c} className={`rounded-lg border p-3 ${chipByCategoria[c]}`}>
                  <div className="text-[11px] font-semibold uppercase tracking-wide opacity-80">{c}</div>
                  <div className="mt-1 text-lg font-bold">{brl(totaisPorCategoria[c] ?? 0)}</div>
                </div>
              ))}
            </div>

            {/* Filtros */}
            <div className="flex flex-wrap items-center gap-2 rounded-md border border-border bg-card p-3">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <Select value={filtroCat} onValueChange={(v) => setFiltroCat(v as any)}>
                <SelectTrigger className="w-52"><SelectValue placeholder="Categoria" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="todas">Todas as categorias</SelectItem>
                  {CATEGORIAS_DESPESAS.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={String(ano)} onValueChange={(v) => setAno(Number(v))}>
                <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {[2024, 2025, 2026, 2027].map((y) => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}
                </SelectContent>
              </Select>
              <Input
                placeholder="Buscar por descrição…"
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                className="w-64"
              />
              <Button
                size="sm"
                className="ml-auto"
                onClick={() => setNovaLinha({ categoria: filtroCat === "todas" ? "PJ" : filtroCat, descricao: "" })}
              >
                <Plus className="mr-1 h-4 w-4" /> Nova linha
              </Button>
            </div>

            {/* Nova linha inline */}
            {novaLinha && (
              <div className="flex flex-wrap items-center gap-2 rounded-md border border-emerald-300 bg-emerald-50 p-3">
                <Select
                  value={novaLinha.categoria}
                  onValueChange={(v) => setNovaLinha({ ...novaLinha, categoria: v as CategoriaDespesa })}
                >
                  <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {CATEGORIAS_DESPESAS.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Input
                  autoFocus
                  placeholder="Descrição (ex.: João da Silva — PJ)"
                  value={novaLinha.descricao}
                  onChange={(e) => setNovaLinha({ ...novaLinha, descricao: e.target.value })}
                  className="w-80"
                  onKeyDown={(e) => { if (e.key === "Enter") criarNovaLinha(); if (e.key === "Escape") setNovaLinha(null); }}
                />
                <Button size="sm" onClick={criarNovaLinha} disabled={upsertMut.isPending}>
                  <Save className="mr-1 h-4 w-4" /> Adicionar
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setNovaLinha(null)}>
                  <X className="mr-1 h-4 w-4" /> Cancelar
                </Button>
              </div>
            )}

            {/* Grid */}
            {isLoading ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : error ? (
              <div className="rounded-md border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive">
                {(error as any)?.message ?? "Falha ao carregar despesas fixas."}
              </div>
            ) : linhasFiltradas.length === 0 ? (
              <div className="rounded-md border border-dashed border-border p-12 text-center text-sm text-muted-foreground">
                Nenhuma linha ainda. Clique em <strong>Nova linha</strong> para começar.
              </div>
            ) : (
              <div className="overflow-x-auto rounded-lg border border-border bg-card">
                <table className="w-full min-w-[1100px] border-collapse text-sm">
                  <thead className="sticky top-0 bg-slate-50">
                    <tr>
                      <th className="border-b border-border px-3 py-2 text-left font-semibold">Categoria</th>
                      <th className="border-b border-border px-3 py-2 text-left font-semibold">Descrição</th>
                      {MESES.map((m) => (
                        <th key={m} className="border-b border-border px-2 py-2 text-right font-semibold">{m}</th>
                      ))}
                      <th className="border-b border-border px-3 py-2 text-right font-semibold">Total</th>
                      <th className="border-b border-border px-2 py-2" />
                    </tr>
                  </thead>
                  <tbody>
                    {linhasFiltradas.map((l) => (
                      <tr key={l.key} className="hover:bg-slate-50/60">
                        <td className="border-b border-border px-3 py-2">
                          <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${chipByCategoria[l.categoria]}`}>
                            {l.categoria}
                          </span>
                        </td>
                        <td className="border-b border-border px-3 py-2 font-medium">{l.descricao}</td>
                        {l.registros.map((r, i) => (
                          <td key={i} className="border-b border-border px-1 py-1 text-right">
                            <ValorCell
                              valor={r?.valor ?? 0}
                              onSave={(v) => salvarValor(l, i + 1, v)}
                            />
                          </td>
                        ))}
                        <td className="border-b border-border px-3 py-2 text-right font-semibold text-emerald-700">
                          {brl(l.total)}
                        </td>
                        <td className="border-b border-border px-2 py-1 text-right">
                          <Button size="icon" variant="ghost" onClick={() => setConfirmDel(l)} aria-label="Excluir linha">
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="bg-slate-100 font-semibold">
                      <td className="px-3 py-2" colSpan={2}>Total geral</td>
                      {totaisPorMes.map((v, i) => (
                        <td key={i} className="px-2 py-2 text-right">{brl(v)}</td>
                      ))}
                      <td className="px-3 py-2 text-right text-emerald-700">{brl(totalGeral)}</td>
                      <td />
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </main>
        </div>
      </div>

      <AlertDialog open={!!confirmDel} onOpenChange={(o) => !o && setConfirmDel(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir linha?</AlertDialogTitle>
            <AlertDialogDescription>
              A linha <strong>{confirmDel?.descricao}</strong> ({confirmDel?.categoria}) e todos os
              seus lançamentos mensais serão apagados.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => { e.preventDefault(); if (confirmDel) excluirLinhaCompleta(confirmDel); }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </SidebarProvider>
  );
}

function ValorCell({ valor, onSave }: { valor: number; onSave: (v: string) => void }) {
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState<string>(() => (valor ? valor.toFixed(2).replace(".", ",") : ""));

  if (editing) {
    return (
      <Input
        autoFocus
        value={text}
        onChange={(e) => setText(e.target.value)}
        onBlur={() => { setEditing(false); if (text.trim()) onSave(text); }}
        onKeyDown={(e) => {
          if (e.key === "Enter") { setEditing(false); if (text.trim()) onSave(text); }
          if (e.key === "Escape") { setEditing(false); setText(valor ? valor.toFixed(2).replace(".", ",") : ""); }
        }}
        className="h-8 w-24 text-right"
        inputMode="decimal"
      />
    );
  }
  return (
    <button
      onClick={() => { setText(valor ? valor.toFixed(2).replace(".", ",") : ""); setEditing(true); }}
      className={`inline-block w-24 rounded px-2 py-1 text-right text-xs tabular-nums hover:bg-slate-100 ${valor ? "text-slate-800" : "text-slate-400"}`}
    >
      {valor ? brl(valor) : "—"}
    </button>
  );
}
