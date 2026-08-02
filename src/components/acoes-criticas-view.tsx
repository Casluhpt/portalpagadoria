import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { Loader2, Search, ShieldAlert, Lock } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useRoles } from "@/hooks/use-roles";
import { ACOES_CRITICAS, fetchAuditCritico, type AuditLogRow } from "@/lib/audit-critico";

const severidadeTone: Record<string, string> = {
  info: "bg-slate-100 text-slate-700 border-slate-200",
  alerta: "bg-amber-100 text-amber-800 border-amber-200",
  critico: "bg-rose-100 text-rose-800 border-rose-200",
};

export function AcoesCriticasView() {
  const { isAdmin, isAuditor, loading } = useRoles();

  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center p-10">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!isAdmin && !isAuditor) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3 p-8 text-center">
        <ShieldAlert className="h-10 w-10 text-muted-foreground" />
        <h2 className="text-lg font-semibold">Acesso restrito</h2>
        <p className="max-w-md text-sm text-muted-foreground">
          O registro de ações críticas é visível apenas para Administração e Auditoria.
        </p>
      </div>
    );
  }

  return <AcoesCriticasTable />;
}

function AcoesCriticasTable() {
  const { data = [], isLoading, error } = useQuery({
    queryKey: ["audit_log_criticas"],
    queryFn: fetchAuditCritico,
    staleTime: 20_000,
  });

  const [busca, setBusca] = useState("");
  const [acao, setAcao] = useState("all");
  const [severidade, setSeveridade] = useState("all");
  const [de, setDe] = useState("");
  const [ate, setAte] = useState("");

  const rows = useMemo(() => {
    const q = busca.trim().toLowerCase();
    return data.filter((r: AuditLogRow) => {
      if (acao !== "all" && r.acao !== acao) return false;
      if (severidade !== "all" && r.severidade !== severidade) return false;
      const dia = r.created_at.slice(0, 10);
      if (de && dia < de) return false;
      if (ate && dia > ate) return false;
      if (q) {
        const hay = [
          r.acao, r.modulo, r.tabela, r.registro_id, r.descricao,
          r.justificativa, r.user_nome, r.user_email,
        ].filter(Boolean).join(" ").toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [data, busca, acao, severidade, de, ate]);

  return (
    <div className="flex flex-1 flex-col p-4">
      <div className="mb-3 flex items-center gap-2 rounded-lg border border-indigo-200 bg-indigo-50/60 px-3 py-2 text-xs text-indigo-900">
        <Lock className="h-3.5 w-3.5" />
        Trilha imutável — nenhum usuário, inclusive Administração, pode editar ou apagar estes registros.
      </div>

      <div className="mb-3 grid grid-cols-1 gap-2 rounded-lg border border-border bg-card p-3 md:grid-cols-3 lg:grid-cols-5">
        <div className="lg:col-span-2">
          <Label className="text-xs">Pesquisar</Label>
          <div className="relative">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Usuário, módulo, justificativa…" className="h-9 pl-8" />
          </div>
        </div>
        <div>
          <Label className="text-xs">Tipo de ação</Label>
          <Select value={acao} onValueChange={setAcao}>
            <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              {Object.entries(ACOES_CRITICAS).map(([k, v]) => (
                <SelectItem key={k} value={k}>{v}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="text-xs">Severidade</Label>
          <Select value={severidade} onValueChange={setSeveridade}>
            <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              <SelectItem value="info">Informativa</SelectItem>
              <SelectItem value="alerta">Alerta</SelectItem>
              <SelectItem value="critico">Crítica</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <Label className="text-xs">De</Label>
            <Input type="date" value={de} onChange={(e) => setDe(e.target.value)} className="h-9" />
          </div>
          <div>
            <Label className="text-xs">Até</Label>
            <Input type="date" value={ate} onChange={(e) => setAte(e.target.value)} className="h-9" />
          </div>
        </div>
        <div className="flex items-end lg:col-span-5">
          <Button variant="outline" size="sm" onClick={() => { setBusca(""); setAcao("all"); setSeveridade("all"); setDe(""); setAte(""); }}>
            Limpar filtros
          </Button>
        </div>
      </div>

      <div className="mb-2 text-xs text-muted-foreground">
        {isLoading ? "Carregando…" : error ? "Erro ao carregar a trilha." : `${rows.length.toLocaleString("pt-BR")} ação(ões) registrada(s)`}
      </div>

      <div className="overflow-x-auto rounded-lg border border-border bg-card">
        <table className="w-full min-w-[980px] border-collapse text-sm">
          <thead className="bg-muted/50">
            <tr>
              <th className="border-b border-border px-3 py-2 text-left font-semibold">Data e hora</th>
              <th className="border-b border-border px-3 py-2 text-left font-semibold">Usuário</th>
              <th className="border-b border-border px-3 py-2 text-left font-semibold">Ação</th>
              <th className="border-b border-border px-3 py-2 text-left font-semibold">Módulo</th>
              <th className="border-b border-border px-3 py-2 text-left font-semibold">Registro</th>
              <th className="border-b border-border px-3 py-2 text-left font-semibold">Justificativa</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="hover:bg-muted/40">
                <td className="whitespace-nowrap border-b border-border px-3 py-2 tabular-nums">
                  {format(new Date(r.created_at), "dd/MM/yyyy HH:mm:ss")}
                </td>
                <td className="border-b border-border px-3 py-2">
                  <div className="font-medium">{r.user_nome ?? "—"}</div>
                  <div className="text-[11px] text-muted-foreground">{r.user_email ?? ""}</div>
                </td>
                <td className="border-b border-border px-3 py-2">
                  <Badge variant="outline" className={severidadeTone[r.severidade] ?? severidadeTone.info}>
                    {(ACOES_CRITICAS as Record<string, string>)[r.acao] ?? r.acao}
                  </Badge>
                  {r.descricao && <div className="mt-1 text-[11px] text-muted-foreground">{r.descricao}</div>}
                </td>
                <td className="border-b border-border px-3 py-2">{r.modulo ?? "—"}</td>
                <td className="border-b border-border px-3 py-2 font-mono text-[11px]">{r.registro_id ?? "—"}</td>
                <td className="border-b border-border px-3 py-2 text-xs">{r.justificativa ?? "—"}</td>
              </tr>
            ))}
            {!isLoading && rows.length === 0 && (
              <tr>
                <td colSpan={6} className="px-3 py-10 text-center text-sm text-muted-foreground">
                  Nenhuma ação crítica registrada para os filtros aplicados.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
