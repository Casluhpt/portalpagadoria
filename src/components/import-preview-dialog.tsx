import { useMemo } from "react";
import { AlertTriangle, CheckCircle2, FileSpreadsheet, Loader2, XCircle } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { formatBRL } from "@/lib/money";
import type { CampoSpec, PreviaImportacao } from "@/lib/import-preview";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  previa: PreviaImportacao | null;
  campos: CampoSpec[];
  analisando?: boolean;
  gravando?: boolean;
  modo: "incremental" | "replace";
  onModoChange: (modo: "incremental" | "replace") => void;
  onAbaChange: (aba: string) => void;
  onMapear: (campoKey: string, header: string | null) => void;
  onConfirmar: () => void;
};

export function ImportPreviewDialog({
  open,
  onOpenChange,
  previa,
  campos,
  analisando,
  gravando,
  modo,
  onModoChange,
  onAbaChange,
  onMapear,
  onConfirmar,
}: Props) {
  const camposValor = useMemo(() => campos.filter((c) => c.tipo === "valor"), [campos]);
  const exemplos = previa?.linhas.slice(0, 12) ?? [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-4xl overflow-hidden border-border/60 bg-background/85 backdrop-blur-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5 text-primary" />
            Conferência da importação
          </DialogTitle>
          <DialogDescription>
            Nenhum dado é gravado antes desta conferência. Revise a estrutura detectada, os
            valores interpretados e as linhas rejeitadas.
          </DialogDescription>
        </DialogHeader>

        {analisando || !previa ? (
          <div className="flex items-center justify-center gap-2 py-16 text-sm text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" /> Analisando arquivo…
          </div>
        ) : (
          <ScrollArea className="max-h-[62vh] pr-3">
            <div className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <Resumo titulo="Arquivo" valor={previa.arquivo} />
                <Resumo titulo="Linhas válidas" valor={String(previa.linhasValidas)} tom="ok" />
                <Resumo
                  titulo="Linhas rejeitadas"
                  valor={String(previa.linhasRejeitadas)}
                  tom={previa.linhasRejeitadas > 0 ? "alerta" : undefined}
                />
                <Resumo titulo="Valor total interpretado" valor={previa.valorTotalFormatado || formatBRL(0)} />
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1">
                  <Label className="text-xs">Aba do arquivo</Label>
                  <Select value={previa.abaSelecionada} onValueChange={onAbaChange}>
                    <SelectTrigger className="h-9 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {previa.abas.map((a) => (
                        <SelectItem key={a} value={a}>
                          {a}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-[11px] text-muted-foreground">
                    Cabeçalho detectado na linha {previa.linhaCabecalho + 1}.
                  </p>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Modo de importação</Label>
                  <Select value={modo} onValueChange={(v) => onModoChange(v as "incremental" | "replace")}>
                    <SelectTrigger className="h-9 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="incremental">Incrementar (adicionar/atualizar)</SelectItem>
                      <SelectItem value="replace">Substituir a base (apagar antes)</SelectItem>
                    </SelectContent>
                  </Select>
                  {modo === "replace" && (
                    <p className="text-[11px] font-medium text-amber-600">
                      A base ativa será substituída somente após esta confirmação e validação integral.
                    </p>
                  )}
                </div>
              </div>

              <div className="rounded-lg border border-border/60 bg-card/60 p-3">
                <p className="mb-2 text-xs font-semibold text-foreground">Relacionamento de colunas</p>
                <div className="grid gap-2 sm:grid-cols-2">
                  {campos.map((c) => (
                    <div key={c.key} className="flex items-center gap-2">
                      <span className="w-28 shrink-0 text-xs text-muted-foreground">{c.label}</span>
                      <Select
                        value={previa.mapeamento[c.key] ?? "__none__"}
                        onValueChange={(v) => onMapear(c.key, v === "__none__" ? null : v)}
                      >
                        <SelectTrigger className="h-8 flex-1 text-xs">
                          <SelectValue placeholder="Selecionar coluna" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="__none__">— não mapeada —</SelectItem>
                          {previa.cabecalhos.map((h) => (
                            <SelectItem key={h} value={h}>
                              {h}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  ))}
                </div>
              </div>

              {(previa.competencias.length > 0 || previa.empresas.length > 0) && (
                <div className="grid gap-2 text-xs sm:grid-cols-2">
                  {previa.competencias.length > 0 && (
                    <p className="text-muted-foreground">
                      <span className="font-semibold text-foreground">Competências:</span>{" "}
                      {previa.competencias.join(", ")}
                    </p>
                  )}
                  {previa.empresas.length > 0 && (
                    <p className="truncate text-muted-foreground">
                      <span className="font-semibold text-foreground">Empresas:</span>{" "}
                      {previa.empresas.slice(0, 8).join(", ")}
                      {previa.empresas.length > 8 ? "…" : ""}
                    </p>
                  )}
                </div>
              )}

              {previa.erros.map((e) => (
                <p key={e} className="flex items-start gap-2 rounded-md bg-destructive/10 p-2 text-xs text-destructive">
                  <XCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" /> {e}
                </p>
              ))}
              {previa.advertencias.map((a) => (
                <p key={a} className="flex items-start gap-2 rounded-md bg-amber-500/10 p-2 text-xs text-amber-700">
                  <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" /> {a}
                </p>
              ))}

              <div className="overflow-x-auto rounded-lg border border-border/60">
                <table className="min-w-full text-xs">
                  <thead className="bg-muted/70">
                    <tr>
                      <th className="px-2 py-1.5 text-left font-semibold">Linha</th>
                      {campos.map((c) => (
                        <th key={c.key} className="px-2 py-1.5 text-left font-semibold">
                          {c.label}
                        </th>
                      ))}
                      {camposValor.map((c) => (
                        <th key={`orig-${c.key}`} className="px-2 py-1.5 text-left font-semibold">
                          {c.label} (original)
                        </th>
                      ))}
                      <th className="px-2 py-1.5 text-left font-semibold">Situação</th>
                    </tr>
                  </thead>
                  <tbody>
                    {exemplos.map((l) => (
                      <tr key={l.linhaArquivo} className={l.valida ? "" : "bg-destructive/5"}>
                        <td className="px-2 py-1 text-muted-foreground">{l.linhaArquivo}</td>
                        {campos.map((c) => (
                          <td key={c.key} className="px-2 py-1">
                            {c.tipo === "valor"
                              ? l.monetarios[c.key]?.formatado || "—"
                              : l.valores[c.key] == null
                                ? "—"
                                : String(l.valores[c.key])}
                          </td>
                        ))}
                        {camposValor.map((c) => (
                          <td key={`o-${c.key}`} className="px-2 py-1 text-muted-foreground">
                            {l.monetarios[c.key]?.original || "—"}
                          </td>
                        ))}
                        <td className="px-2 py-1">
                          {l.valida ? (
                            <span className="inline-flex items-center gap-1 text-emerald-600">
                              <CheckCircle2 className="h-3 w-3" /> Válida
                            </span>
                          ) : (
                            <span className="text-destructive">{l.erros.join(" · ")}</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </ScrollArea>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={gravando}>
            Cancelar
          </Button>
          <Button
            onClick={onConfirmar}
            disabled={!previa?.podeImportar || !!gravando || !!analisando}
            className="gap-2"
          >
            {gravando && <Loader2 className="h-4 w-4 animate-spin" />}
            {modo === "replace" ? "Confirmar substituição da base" : "Confirmar importação"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Resumo({ titulo, valor, tom }: { titulo: string; valor: string; tom?: "ok" | "alerta" }) {
  return (
    <div className="rounded-lg border border-border/60 bg-card/60 p-2.5">
      <p className="text-[10px] uppercase tracking-wide text-muted-foreground">{titulo}</p>
      <p
        className={
          "truncate text-sm font-semibold " +
          (tom === "ok" ? "text-emerald-600" : tom === "alerta" ? "text-amber-600" : "text-foreground")
        }
        title={valor}
      >
        {valor}
      </p>
    </div>
  );
}
