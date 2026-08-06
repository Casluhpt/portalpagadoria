import { createFileRoute, Link } from "@tanstack/react-router";
import { AppLogo } from "@/components/app-logo";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { History } from "lucide-react";
import { getPagamentosAudit } from "@/lib/pagamentos-audit.functions";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import * as XLSX from "xlsx";
import {
  Loader2, Plus, Search, Trash2, ArrowUpDown, ArrowUp, ArrowDown,
  Upload, Download, LayoutGrid, Table as TableIcon,
  Scissors, Palette, X, Lock, Unlock, Users, Timer, LogOut, Info, ChevronRight,
  Sparkles, AlertTriangle, Wand2, CheckCircle2
} from "lucide-react";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import {
  BarChart, Bar, LineChart as ReLineChart, Line, PieChart, Pie, Cell,
  ResponsiveContainer, XAxis, YAxis, Tooltip, Legend, CartesianGrid,
} from "recharts";

import { AppSidebar } from "@/components/app-sidebar";
import { HeaderActions } from "@/components/header-actions";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { entrarFila, sairFila, getFilaStatus, heartbeatFila } from "@/lib/concorrencia.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon } from "lucide-react";
import { format, parseISO } from "date-fns";
import type { DateRange } from "react-day-picker";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { logAcaoCritica } from "@/lib/audit-critico";

import { useSession } from "@/hooks/use-session";
import { useRoles } from "@/hooks/use-roles";
import { supabase } from "@/integrations/supabase/client";
import {
  createPagamento, createPagamentosBulk, deletePagamento,
  fetchPagamentos, pagamentosQueryKey, updatePagamento,
  type PagamentoInput,
} from "@/lib/pagamentos";
import {
  PAGAMENTO_CAMPOS, COMPETENCIAS, getDescricoesByCelula,
  type Pagamento,
} from "@/lib/pagamentos-constants";
import {
  criarSolicitacaoProvisao, extractProvisaoFechadaDate,
} from "@/lib/provisao-fechamento";
import { Textarea } from "@/components/ui/textarea";
import {
  construirModelo, diagnosticarBase,
  sugerirPreenchimento, sugerirValores, sugestoesParaPatch,
  type AlertaLinha, type ModeloInteligente,
} from "@/lib/planilha-inteligente";
import { usePlanilhaModo } from "@/hooks/use-planilha-modo";



const HIDDEN_COLUMN_KEYS = new Set<string>([
  "valor_bankmanager","status_bankmanager","diferenca_lg_finnet",
  "valor_itau","status_itau","diferenca_bank_itau","natureza_pagamento",
]);
const VISIBLE_CAMPOS = PAGAMENTO_CAMPOS.filter((c) => !HIDDEN_COLUMN_KEYS.has(c.key));
import { purgarPagamentosBulkFn } from "@/lib/pagamentos-admin.functions";


export const Route = createFileRoute("/pagamentos")({
  component: PagamentosPage,
});

const brl = (n: number | null | undefined) =>
  n == null ? "" : Number(n).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const brlShort = (n: number) =>
  n.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });
const brlCompact = (n: number) =>
  n.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
    notation: "compact",
    maximumFractionDigits: 2,
  });

function fmtDateTime(iso: string | null | undefined) {
  if (!iso) return "";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return String(iso);
  return d.toLocaleString("pt-BR");
}

function PagamentosPage() {
  const { user } = useSession();
  const { isAdmin } = useRoles();
  const colaboradorNome =
    (user?.user_metadata?.nome as string) ||
    (user?.user_metadata?.full_name as string) ||
    user?.email ||
    "Anônimo";

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background">
        <AppSidebar />
        <div className="flex flex-1 flex-col">
          <header className="sticky top-0 z-10 flex h-14 items-center gap-3 border-b border-border bg-background/80 px-4 backdrop-blur">
            <SidebarTrigger />
            <Link to="/" className="flex flex-1 items-center gap-2 hover:opacity-80 transition-opacity">
              <AppLogo area="header" className="h-6 w-auto shrink-0 sm:h-7" />
              <div className="min-w-0">
                <h1 className="truncate text-sm font-semibold text-foreground">Pagamentos Diversos</h1>
                <p className="hidden truncate text-[10px] text-muted-foreground sm:block">Controle financeiro e conciliação</p>
              </div>
            </Link>
            <div className="ml-auto">
              <HeaderActions />
            </div>
          </header>
          <Tabs defaultValue="dashboard" className="flex flex-1 flex-col">
            <div className="border-b border-border bg-background px-4">
              <TabsList className="h-11 bg-transparent">
                <TabsTrigger value="dashboard" className="gap-2">
                  <LayoutGrid className="h-4 w-4" /> Dashboard
                </TabsTrigger>
                <TabsTrigger value="lancamentos" className="gap-2">
                  <TableIcon className="h-4 w-4" /> Lançamentos
                </TabsTrigger>
              </TabsList>

            </div>
            <TabsContent value="lancamentos" className="flex-1 p-0 data-[state=inactive]:hidden">
              <LancamentosTab colaboradorNome={colaboradorNome} userId={user?.id ?? null} isAdmin={isAdmin} />
            </TabsContent>
            <TabsContent value="dashboard" className="flex-1 p-0 data-[state=inactive]:hidden">
              <DashboardTab />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </SidebarProvider>
  );
}

/* ---------------- LANÇAMENTOS ---------------- */

function LancamentosTab({ colaboradorNome, userId, isAdmin }: { colaboradorNome: string; userId: string | null; isAdmin: boolean }) {
  const qc = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);
  
  // Fila de Concorrência
  const { data: queue = [] } = useQuery({
    queryKey: ['concorrencia-fila', 'pagamentos_diversos'],
    queryFn: () => getFilaStatus({ data: { modulo: 'pagamentos_diversos' } }),
    enabled: !!userId,
    refetchInterval: (query) => {
      const qData = query.state.data;
      const isUserAtivo = qData?.find(q => q.user_id === userId)?.status === 'ativo';
      return isUserAtivo ? 10000 : 3000;
    },
    refetchIntervalInBackground: false,
  });

  const entrarFilaFn = useServerFn(entrarFila);
  const sairFilaFn = useServerFn(sairFila);
  const heartbeatFn = useServerFn(heartbeatFila);

  const currentUserQueue = userId ? queue.find(q => q.user_id === userId) : undefined;
  const activeUser = queue.find(q => q.status === 'ativo');
  const { roles } = useRoles();
  const isViewer = roles.includes("viewer");
  const isVisitante = roles.includes("visitante");
  
  const isEditingEnabled = !!userId; // Edit enabled for all logged in users, queue only for new launches
  const canMutate = !!userId;
  const canDelete = !!userId;
  const canImport = !!userId;
  const canExport = !!userId;
  const fileRefCsv = useRef<HTMLInputElement>(null);

  const nextUser = queue.filter(q => q.status === 'aguardando').sort((a, b) => {
    const da = a.entrou_em ? new Date(a.entrou_em).getTime() : 0;
    const db = b.entrou_em ? new Date(b.entrou_em).getTime() : 0;
    return da - db;
  })[0];

  const entrarMut = useMutation({
    mutationFn: () => entrarFilaFn({ data: { userId: userId as string, userNome: colaboradorNome, modulo: 'pagamentos_diversos' } }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['concorrencia-fila'] });
      setFilaOpen(true);
      toast.success("Você entrou na fila de acesso.");
    }
  });

  const [confirmSaidaFila, setConfirmSaidaFila] = useState(false);

  const sairMut = useMutation({
    mutationFn: async () => {
      const posicaoAnterior = queue.findIndex((q) => q.user_id === userId) + 1;
      const statusAnterior = currentUserQueue?.status ?? null;
      await sairFilaFn({ data: { userId: userId as string, modulo: 'pagamentos_diversos' } });
      const { logAcaoCritica } = await import("@/lib/audit-critico");
      await logAcaoCritica({
        acao: "saida_fila",
        modulo: "Pagamentos Diversos",
        tabela: "concorrencia_fila",
        registro_id: userId ?? undefined,
        descricao: `Saída voluntária da fila virtual (posição ${posicaoAnterior || "-"}, status ${statusAnterior ?? "-"})`,
        metadata: {
          modulo_fila: "pagamentos_diversos",
          posicao_anterior: posicaoAnterior || null,
          status_anterior: statusAnterior,
          total_na_fila: queue.length,
          saiu_em: new Date().toISOString(),
        },
        severidade: "info",
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['concorrencia-fila'] });
      setConfirmSaidaFila(false);
      setFilaOpen(false);
      setPosicaoFila(null);
      setPrevStatus(null);
      toast.info("Você saiu da fila. Sua posição foi liberada — entre novamente quando desejar.");
    },
    onError: (e: Error) => toast.error("Não foi possível sair da fila: " + e.message),
  });

  const [posicaoFila, setPosicaoFila] = useState<number | null>(null);
  const [filaOpen, setFilaOpen] = useState(false);
  const [prevStatus, setPrevStatus] = useState<string | null>(null);

  useEffect(() => {
    if (currentUserQueue && queue.length > 0) {
      const idx = queue.findIndex(q => q.user_id === userId);
      const newPos = idx !== -1 ? idx + 1 : null;
      setPosicaoFila(newPos);
      
      const currentStatus = currentUserQueue.status;
      
      // Notificação única ao chegar a vez
      if (prevStatus === 'aguardando' && currentStatus === 'ativo') {
        toast.success("Sua vez chegou! A base está disponível para edição.", {
          duration: 10000,
          icon: <Unlock className="h-5 w-5 text-emerald-500" />,
        });
        
        // Opcional: Notificação nativa se permitido
        if ("Notification" in window && Notification.permission === "granted") {
          new Notification("Portal Pagadoria", {
            body: "Sua vez chegou! Você já pode editar os lançamentos.",
            icon: "/favicon.ico"
          });
        }
      }
      
      setPrevStatus(currentStatus);

      if (currentStatus === 'ativo') {
        setFilaOpen(false);
      } else if (currentStatus === 'aguardando') {
        // Se estiver aguardando, garante que o modal esteja aberto
        setFilaOpen(true);
      }
    } else {
      setPosicaoFila(null);
      setPrevStatus(null);
    }
  }, [queue, currentUserQueue, userId, prevStatus]);

  // Heartbeat para queda de sessão
  useEffect(() => {
    if (!userId || !currentUserQueue) return;
    
    const interval = setInterval(() => {
      heartbeatFn({ data: { userId, modulo: 'pagamentos_diversos' } }).catch(console.error);
    }, 15000); // Heartbeat a cada 15s

    // Remoção automática ao fechar aba/navegador
    const handleUnload = () => {
      // Beacon or sync fetch as last resort
      const blob = new Blob([JSON.stringify({ userId, modulo: 'pagamentos_diversos' })], { type: 'application/json' });
      navigator.sendBeacon('/api/public/concorrencia/sair', blob); 
      // Note: This endpoint needs to be created or we just rely on heartbeat timeout
    };

    window.addEventListener('beforeunload', handleUnload);
    return () => {
      clearInterval(interval);
      window.removeEventListener('beforeunload', handleUnload);
    };
  }, [userId, currentUserQueue, heartbeatFn]);

  const { data = [], isLoading } = useQuery({
    queryKey: pagamentosQueryKey,
    queryFn: fetchPagamentos,
    enabled: !!userId,
    staleTime: 30_000,
    select: (list) => list.filter(r => !r.excluido_em),
  });

  const [search, setSearch] = useState("");
  const [importMode, setImportMode] = useState<"incremental" | "replace">("incremental");
  const [sortKey, setSortKey] = useState<keyof Pagamento>("registrado_em");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [highlights, setHighlights] = useState<Record<string, string>>(() => {
    if (typeof window === "undefined") return {};
    try {
      return JSON.parse(localStorage.getItem("pagamentos:highlights") || "{}");
    } catch {
      return {};
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem("pagamentos:highlights", JSON.stringify(highlights));
    } catch {
      /* noop */
    }
  }, [highlights]);

  const [bulkPendingDelete, setBulkPendingDelete] = useState(false);


  const invalidate = () => qc.invalidateQueries({ queryKey: pagamentosQueryKey });


  const createMut = useMutation({
    mutationFn: (qty: number) =>
      qty <= 1
        ? createPagamento({}, colaboradorNome, userId).then(() => 1)
        : createPagamentosBulk(Array.from({ length: qty }, () => ({})), colaboradorNome, userId),
    onSuccess: (n) => { invalidate(); toast.success(`${n} lançamento(s) adicionado(s)`); },
    onError: (e: Error) => toast.error("Falha ao inserir: " + e.message),
  });
  const [novoQty, setNovoQty] = useState<number>(1);
  const [novoOpen, setNovoOpen] = useState(false);

  const [blocked, setBlocked] = useState<{
    rowId: string;
    dataCredito: string;
    snapshot: Pagamento;
    patch: PagamentoInput;
  } | null>(null);
  const [blockedMotivo, setBlockedMotivo] = useState("");

  const updateMut = useMutation({
    mutationFn: ({ id, patch, oldData }: { id: string; patch: PagamentoInput; oldData?: Pagamento }) => updatePagamento(id, patch, oldData),
    onSuccess: () => invalidate(),
    onError: (e: Error, variables) => {
      const dia = extractProvisaoFechadaDate(e.message);
      if (dia && variables?.patch && "data_credito" in variables.patch) {
        const row = data.find((r) => r.id === variables.id);
        if (row) {
          setBlocked({ rowId: variables.id, dataCredito: dia, snapshot: row, patch: variables.patch });
          setBlockedMotivo("");
          return;
        }
      }
      toast.error("Falha ao salvar: " + e.message);
    },
  });

  // Referência estável para o save de célula — evita quebrar o React.memo
  // de EditableCell (uma nova arrow por linha invalidaria memoização).
  const updateMutRef = useRef(updateMut);
  useEffect(() => { updateMutRef.current = updateMut; }, [updateMut]);
  const stableCellSave = React.useCallback(
    (id: string, patch: PagamentoInput, oldData?: Pagamento) => updateMutRef.current.mutate({ id, patch, oldData }),
    [],
  );


  const solicitacaoMut = useMutation({
    mutationFn: async () => {
      if (!blocked) throw new Error("Sem contexto");
      if (!userId) throw new Error("Usuário não autenticado");
      const src = { ...blocked.snapshot, ...blocked.patch } as Record<string, unknown>;
      const keys = [
        "celula","arquivo_remessa","tipo_arquivo","ev_saida_folha_mensal","banco","empresa",
        "descricao_pagamento","valor_lg","competencia","folha","qtde_colaboradores","observacao",
        "valor_bankmanager","status_bankmanager","valor_itau","status_itau","natureza_pagamento",
      ] as const;
      const payload: Record<string, unknown> = {};
      for (const k of keys) if (src[k] != null && src[k] !== "") payload[k] = src[k];
      await criarSolicitacaoProvisao({
        solicitanteId: userId,
        solicitanteNome: colaboradorNome,
        dataCredito: blocked.dataCredito,
        payload,
        motivo: blockedMotivo.trim(),
      });
    },
    onSuccess: () => {
      toast.success("Solicitação enviada à Central de Divergências.");
      setBlocked(null);
      setBlockedMotivo("");
    },
    onError: (e: Error) => toast.error("Falha ao enviar solicitação: " + e.message),
  });




  const purgarBulkFn = useServerFn(purgarPagamentosBulkFn);

  const bulkDeleteMut = useMutation({
    mutationFn: async (ids: string[]) => {
      const res = await purgarBulkFn({
        data: {
          ids,
          colaboradorNome,
          userId: userId || undefined
        }
      });
      return res.count;
    },
    onSuccess: (n) => {

      invalidate();
      setSelected(new Set());
      toast.success(`${n} registro(s) excluído(s) e registrado(s) na Auditoria`);
    },
    onError: (e: Error) => toast.error("Falha ao excluir: " + e.message),
  });


  const importMut = useMutation({
    mutationFn: (rows: PagamentoInput[]) => createPagamentosBulk(rows, colaboradorNome, userId, importMode === "replace"),
    onSuccess: (n) => {
      invalidate();
      toast.success(`${n} lançamento(s) importado(s)`);
      void logAcaoCritica({
        acao: "importacao_dados",
        modulo: "Pagamentos Diversos",
        tabela: "pagamentos_diversos",
        descricao: `Importação de ${n} lançamento(s) — modo ${importMode === "replace" ? "substituição da base" : "incremental"}`,
        metadata: { 
          registros: n, 
          modo: importMode,
          data_importacao: new Date().toISOString()
        },
        severidade: "alerta",
      });
    },
    onError: (e: Error) => {
      console.error("Erro na importação:", e);
      toast.error("Falha na importação: " + e.message);
    },
  });

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();
    const filtered = q
      ? data.filter((r) =>
          PAGAMENTO_CAMPOS.some((c) => {
            const v = r[c.key];
            return v != null && String(v).toLowerCase().includes(q);
          }),
        )
      : data;
    return [...filtered].sort((a, b) => {
      const av = a[sortKey]; const bv = b[sortKey];
      if (av == null && bv == null) return 0;
      if (av == null) return 1;
      if (bv == null) return -1;
      let cmp = 0;
      if (typeof av === "number" && typeof bv === "number") cmp = av - bv;
      else cmp = String(av).localeCompare(String(bv), "pt-BR");
      return sortDir === "asc" ? cmp : -cmp;
    });
  }, [data, search, sortKey, sortDir]);

  /* ---------- Modo Tradicional / Modo Inteligente (preferência do perfil) ---------- */
  const { inteligente: smartOn, definirModo, salvando: salvandoModo } = usePlanilhaModo();
  const toggleSmart = async (v: boolean) => {
    try {
      await definirModo(v ? "inteligente" : "tradicional");
      if (v) toast.success("Modo Inteligente ativado — sugestões e alertas habilitados.");
      else toast.info("Modo Tradicional ativado — nenhuma perda de funcionalidade.");
    } catch (e) {
      toast.error("Não foi possível salvar a preferência: " + (e as Error).message);
    }
  };
  const rotulos = useMemo(
    () => Object.fromEntries(PAGAMENTO_CAMPOS.map((c) => [c.key, c.label])) as Record<string, string>,
    [],
  );
  const modelo = useMemo(() => construirModelo(data), [data]);
  const diagnostico = useMemo(
    () => (smartOn ? diagnosticarBase(modelo, rows) : null),
    [smartOn, modelo, rows],
  );
  const modeloRef = useRef(modelo);
  useEffect(() => { modeloRef.current = modelo; }, [modelo]);
  const suggestFn = React.useCallback(
    (campo: string, row: Pagamento) => sugerirValores(modeloRef.current, campo, row),
    [],
  );
  const aplicarSugestoes = (ids: string[]) => {
    let aplicadas = 0;
    for (const id of ids) {
      const row = data.find((r) => r.id === id);
      if (!row) continue;
      const sug = sugerirPreenchimento(modeloRef.current, row, rotulos);
      if (!sug.length) continue;
      stableCellSave(id, sugestoesParaPatch(sug), row);
      aplicadas += sug.length;
    }
    if (aplicadas) toast.success(`${aplicadas} campo(s) preenchido(s) por sugestão — revise e ajuste se necessário.`);
    else toast.info("Nenhum padrão recorrente encontrado para as linhas selecionadas.");
  };


  const toggleSort = (k: keyof Pagamento) => {
    if (sortKey === k) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortKey(k); setSortDir("asc"); }
  };

  const handleExport = () => {
    const exportRows = rows.map((r) => {
      const o: Record<string, unknown> = {};
      for (const c of PAGAMENTO_CAMPOS) {
        const v = r[c.key];
        o[c.label] = c.key === "registrado_em" ? fmtDateTime(v as string) : v;
      }
      return o;
    });
    const ws = XLSX.utils.json_to_sheet(exportRows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Pagamentos");
    XLSX.writeFile(wb, `pagamentos-diversos-${new Date().toISOString().slice(0,10)}.xlsx`);
    void logAcaoCritica({
      acao: "exportacao_relatorio",
      modulo: "Pagamentos Diversos",
      tabela: "pagamentos_diversos",
      descricao: `Exportação de relatório com ${exportRows.length} registro(s)`,
      metadata: { registros: exportRows.length },
    });
  };

  const handleFile = async (f: File) => {
    try {
      const buf = await f.arrayBuffer();
      const wb = XLSX.read(buf, { cellDates: true, type: 'array' });

      // Normalize: strip accents, lowercase, collapse spaces, unify ×→x
      const norm = (s: string) =>
        s.normalize("NFD").replace(/[\u0300-\u036f]/g, "")
         .replace(/×/g, "x").toLowerCase().replace(/\s+/g, " ").trim();

      // Try to find a sheet with "pgtos" or data, otherwise fallback to first sheet
      const dataSheetName =
        wb.SheetNames.find((n) => norm(n).includes("pgtos") || norm(n).includes("base") || norm(n).includes("dados")) ??
        wb.SheetNames[0];
      const ws = wb.Sheets[dataSheetName];
      const raw = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws, { defval: null });
      const parsed: PagamentoInput[] = [];
      const errors: string[] = [];

      // Aliases (arquivo → app) — matched by normalized header
      const aliases: Record<string, string> = {
        "celula": "célula",
        "ev. saida folha mensal": "ev. saída folha",
        "ev saida folha mensal": "ev. saída folha",
        "data de credito": "data de crédito",
        "qtde colaboradores no arquivo": "qtde colab.",
        "diferenca lg x finnet": "dif. lg x finnet",
        "diferença lg x finnet": "dif. lg x finnet",
        "status concluido itau": "status itaú",
        "status concluído itau": "status itaú",
        "status concluído itaú": "status itaú",
        "diferenca bankmananger x itau": "dif. bank x itaú",
        "diferença bankmananger x  itau": "dif. bank x itaú",
        "diferença bankmanager x itau": "dif. bank x itaú",
        "natureza do pagamento": "natureza",
      };

      // map normalized label → column
      const labelMap = new Map<string, typeof PAGAMENTO_CAMPOS[number]>();
      for (const c of PAGAMENTO_CAMPOS) {
        if (c.editable === false) continue;
        labelMap.set(norm(c.label), c);
      }

      raw.forEach((row, i) => {
        const rec: Record<string, unknown> = {};
        for (const [rawKey, rawVal] of Object.entries(row)) {
          const key = String(rawKey);
          if (key.startsWith("__EMPTY")) continue;
          const n = norm(key);
          const targetLabel = aliases[n] ?? n;
          const col = labelMap.get(targetLabel);
          if (!col) continue;
          
          if (rawVal === null || rawVal === "") continue;
          
          if (col.kind === "number" || col.kind === "currency") {
            const valStr = String(rawVal).replace(/[R$\s.]/g, "").replace(",", ".");
            const num = Number(valStr);
            if (!Number.isNaN(num)) rec[col.key] = num;
          } else if (col.kind === "date") {
            const d = rawVal instanceof Date ? rawVal : new Date(String(rawVal));
            if (!isNaN(d.getTime())) rec[col.key] = d.toISOString().slice(0,10);
          } else {
            rec[col.key] = String(rawVal).trim();
          }
        }
        if (Object.keys(rec).length > 0) parsed.push(rec as PagamentoInput);
      });

      if (!parsed.length) { 
        toast.error(`Nenhum registro válido encontrado no arquivo (aba: "${dataSheetName}")`); 
        return; 
      }
      toast.info(`Lendo aba "${dataSheetName}" — ${parsed.length} linha(s)…`);
      // Regras v1.8.0: Validação de duplicados e campos obrigatórios
      const required = ["célula", "empresa", "valor lg", "data de crédito"];
      const seen = new Set<string>();
      const finalParsed: PagamentoInput[] = [];
      const validationErrors: string[] = [];

      parsed.forEach((rec, idx) => {
        // Identificação de duplicados (Chave: Empresa + Data + Valor + Célula)
        const dupKey = `${rec.empresa}|${rec.data_credito}|${rec.valor_lg}|${rec.celula}`;
        if (!seen.has(dupKey)) {
          seen.add(dupKey);
          finalParsed.push(rec);
        }
      });

      if (validationErrors.length > 0) {
        toast.error(`Erros de validação encontrados (${validationErrors.length}). Importação cancelada.`);
        console.error("Relatório de erros de importação:", validationErrors);
        return;
      }

      const confirmed = window.confirm(`Confirma a importação de ${finalParsed.length} registros? Esta ação pode substituir ou adicionar dados à base atual.`);
      if (!confirmed) return;

      toast.info(`Iniciando importação auditada por ${colaboradorNome}...`);
      importMut.mutate(finalParsed);
    } catch (e) {
      toast.error("Erro ao ler o arquivo: " + (e as Error).message);
    }
  };

  const allSelected = rows.length > 0 && rows.every((r) => selected.has(r.id));
  const someSelected = selected.size > 0 && !allSelected;
  const toggleAll = () => {
    if (allSelected) setSelected(new Set());
    else setSelected(new Set(rows.map((r) => r.id)));
  };
  const toggleOne = (id: string) => {
    setSelected((prev) => {
      const n = new Set(prev);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });
  };
  const setHighlightForSelected = (color: string | null) => {
    setHighlights((prev) => {
      const n = { ...prev };
      for (const id of selected) {
        if (color) n[id] = color;
        else delete n[id];
      }
      return n;
    });
    toast.success(color ? "Destaque aplicado" : "Destaque removido");
  };
  const cutSelected = async () => {
    const ids = Array.from(selected);
    if (!ids.length) return;
    const selectedRows = rows.filter((r) => ids.includes(r.id));
    const header = VISIBLE_CAMPOS.map((c) => c.label).join("\t");
    const body = selectedRows
      .map((r) => VISIBLE_CAMPOS.map((c) => {
        const v = r[c.key];
        return v == null ? "" : String(v).replace(/\t|\n/g, " ");
      }).join("\t"))
      .join("\n");
    try {
      await navigator.clipboard.writeText(header + "\n" + body);
      toast.success(`${ids.length} linha(s) copiada(s) para a área de transferência`);
      bulkDeleteMut.mutate(ids);
    } catch {
      toast.error("Falha ao copiar para a área de transferência");
    }
  };

  const HIGHLIGHT_COLORS: { name: string; label: string; bg: string; sw: string }[] = [
    { name: "yellow", label: "Amarelo", bg: "rgba(250,204,21,0.28)", sw: "#facc15" },
    { name: "green",  label: "Verde",   bg: "rgba(34,197,94,0.28)",  sw: "#22c55e" },
    { name: "blue",   label: "Azul",    bg: "rgba(59,130,246,0.28)", sw: "#3b82f6" },
    { name: "red",    label: "Vermelho",bg: "rgba(239,68,68,0.28)",  sw: "#ef4444" },
    { name: "purple", label: "Roxo",    bg: "rgba(168,85,247,0.28)", sw: "#a855f7" },
  ];
  const colorBg = (name: string | undefined) =>
    HIGHLIGHT_COLORS.find((c) => c.name === name)?.bg;

  return (
    <div className="flex flex-col">
      <div className="sticky top-14 z-[5] flex flex-wrap items-center gap-2 border-b border-border bg-background/80 px-4 py-2 backdrop-blur">
        <div className="flex items-center gap-3">
          <div className="text-xs text-muted-foreground">
            {isLoading ? "Carregando…" : `${rows.length.toLocaleString("pt-BR")} lançamento(s)`}
          </div>
          
          {/* Fila Virtual UI */}
          <div className="flex items-center gap-2 border-l border-border pl-3">
            {!currentUserQueue ? (
              <Button size="sm" variant="outline" className="h-7 gap-1.5 bg-indigo-500/10 text-indigo-600 hover:bg-indigo-500/20 border-indigo-200" onClick={() => entrarMut.mutate()}>
                <Users className="h-3.5 w-3.5" /> Entrar na Fila
              </Button>
            ) : (
              <div className="flex items-center gap-2">
                <Badge variant={currentUserQueue.status === 'ativo' ? "default" : "secondary"} className={`h-6 gap-1.5 px-2 ${currentUserQueue.status === 'ativo' ? 'bg-emerald-500 hover:bg-emerald-600' : 'bg-amber-100 text-amber-700 border-amber-200'}`}>
                  {currentUserQueue.status === 'ativo' ? (
                    <>
                      <Lock className="h-3 w-3" /> Editando
                    </>
                  ) : (
                    <>
                      <Timer className="h-3 w-3" /> {posicaoFila}º na Fila
                    </>
                  )}
                </Badge>
                
                <Popover>
                  <PopoverTrigger asChild>
                    <Button size="icon" variant="ghost" className="h-7 w-7 text-muted-foreground">
                      <Info className="h-4 w-4" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-64 p-3 shadow-xl border-border bg-card/95 backdrop-blur-md">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between border-b border-border pb-2">
                        <span className="text-xs font-bold text-foreground">Usuários na Fila</span>
                        <Badge variant="outline" className="text-[10px]">{queue.length}</Badge>
                      </div>
                      <div className="space-y-2 max-h-48 overflow-y-auto pr-1 custom-scrollbar">
                        {queue.map((q, idx) => (
                          <div key={q.id} className={`flex items-center justify-between p-2 rounded-md border ${q.user_id === userId ? 'bg-indigo-500/5 border-indigo-200' : 'bg-muted/30 border-transparent'}`}>
                            <div className="flex flex-col gap-0.5 min-w-0">
                              <span className={`text-[11px] font-semibold truncate ${q.user_id === userId ? 'text-indigo-600' : 'text-foreground'}`}>
                                {idx + 1}. {q.user_nome}
                              </span>
                              <span className="text-[9px] text-muted-foreground">
                                {q.status === 'ativo' ? 'Editando agora' : 'Aguardando vez'}
                              </span>
                            </div>
                            {q.status === 'ativo' && <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />}
                          </div>
                        ))}
                      </div>
                      <Button
                        size="sm"
                        className="w-full h-7 bg-red-600 text-white hover:bg-red-700 text-[10px] font-bold"
                        onClick={() => setConfirmSaidaFila(true)}
                      >
                        <LogOut className="h-3 w-3 mr-1.5" /> Sair da Fila
                      </Button>
                    </div>
                  </PopoverContent>
                </Popover>

                <Button
                  size="sm"
                  className="h-7 gap-1.5 bg-red-600 text-xs font-bold text-white hover:bg-red-700"
                  disabled={sairMut.isPending}
                  onClick={() => setConfirmSaidaFila(true)}
                  title="Desistir da fila e liberar sua posição"
                >
                  {sairMut.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <LogOut className="h-3.5 w-3.5" />}
                  Sair da Fila
                </Button>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 border-l border-border pl-2">
          <Button
            size="sm"
            variant={smartOn ? "default" : "outline"}
            className={cn("h-7 gap-1.5 text-xs", smartOn && "bg-violet-600 text-white hover:bg-violet-700")}
            onClick={() => toggleSmart(!smartOn)}
            disabled={salvandoModo}
            title={smartOn
              ? "Modo Inteligente ativo — clique para voltar ao Modo Tradicional"
              : "Modo Tradicional ativo — clique para ativar a Planilha Inteligente"}
          >
            {salvandoModo ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
            {smartOn ? "Modo Inteligente" : "Modo Tradicional"}
          </Button>
          {smartOn && diagnostico && (
            <Popover>
              <PopoverTrigger asChild>
                <Button size="sm" variant="outline" className="h-7 gap-1.5 text-xs">
                  {diagnostico.linhasComAlerta > 0 ? (
                    <><AlertTriangle className="h-3.5 w-3.5 text-amber-500" /> {diagnostico.linhasComAlerta} linha(s) para revisar</>
                  ) : (
                    <><CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" /> Base consistente</>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80 space-y-3 border-border bg-card/95 p-3 shadow-xl backdrop-blur-md">
                <div className="space-y-1 border-b border-border pb-2">
                  <span className="text-xs font-bold text-foreground">Assistência da Planilha</span>
                  <p className="text-[10px] leading-relaxed text-muted-foreground">
                    Padrões aprendidos de {modelo.amostra.toLocaleString("pt-BR")} lançamento(s) desta base,
                    processados apenas no seu navegador.
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="rounded-md border border-border bg-muted/40 p-2">
                    <p className="text-[9px] uppercase tracking-wide text-muted-foreground">Campos incompletos</p>
                    <p className="text-sm font-bold text-amber-600">{diagnostico.incompletos}</p>
                  </div>
                  <div className="rounded-md border border-border bg-muted/40 p-2">
                    <p className="text-[9px] uppercase tracking-wide text-muted-foreground">Inconsistências</p>
                    <p className="text-sm font-bold text-rose-600">{diagnostico.inconsistencias}</p>
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 w-full gap-1.5 text-[11px]"
                  onClick={() => aplicarSugestoes(rows.map((r) => r.id))}
                  disabled={!isEditingEnabled}
                >
                  <Wand2 className="h-3 w-3" /> Sugerir preenchimento em toda a base
                </Button>
                <p className="text-[9px] italic leading-relaxed text-muted-foreground">
                  As sugestões são apenas assistência — você pode alterar, corrigir ou ignorar qualquer recomendação.
                </p>
              </PopoverContent>
            </Popover>
          )}
        </div>

        <div className="flex items-center gap-2 border-l border-border pl-2">
          <Select value={importMode} onValueChange={(v: any) => setImportMode(v)}>
            <SelectTrigger className="h-9 w-[180px] text-xs">
              <SelectValue placeholder="Modo de importação" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="incremental">Incremental (adicionar)</SelectItem>
              <SelectItem value="replace">Substituir a base (apagar)</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-2">
          <input
            ref={fileRef}
            type="file"
            accept=".xlsx,.xls,.csv"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleFile(f);
              e.target.value = "";
            }}
          />
          <Button size="sm" variant="outline" className="gap-1" onClick={() => fileRef.current?.click()} disabled={importMut.isPending || !canImport || !isEditingEnabled}>
            {importMut.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
            Importar Excel
          </Button>
          <Button size="sm" variant="outline" className="gap-1" onClick={() => {
            handleExport();
            if (userId) {
              import("@/lib/notificacoes-arquivos").then(m => {
                m.notificarArquivoPronto(
                  "Exportação Concluída",
                  `Seu arquivo Excel de pagamentos foi gerado com sucesso em ${new Date().toLocaleTimeString()}.`,
                  userId
                );
              });
            }
          }} disabled={!rows.length || !canExport}>
            <Download className="h-4 w-4" />
            Exportar Excel
          </Button>
          <FechamentoCompetenciaButton onComplete={invalidate} disabled={!isEditingEnabled} data={data} />
            <Dialog open={novoOpen} onOpenChange={setNovoOpen}>
              <DialogTrigger asChild>
                <Button
                  size="sm"
                  className="gap-1"
                  disabled={createMut.isPending || !canMutate || !isEditingEnabled}
                >
                  {createMut.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                  Novo
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-sm">
                <DialogHeader>
                  <DialogTitle>Adicionar novas linhas</DialogTitle>
                  <DialogDescription>
                    Selecione a quantidade de linhas que deseja adicionar (limite de 50 por vez).
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-2 py-2">
                  <Label>Quantidade</Label>
                  <Input 
                    type="number" 
                    min={1} 
                    max={50} 
                    value={novoQty} 
                    onChange={(e) => setNovoQty(Math.min(50, Math.max(1, Number(e.target.value) || 1)))} 
                  />
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setNovoOpen(false)}>Cancelar</Button>
                  <Button onClick={() => createMut.mutate(novoQty)} disabled={createMut.isPending || !isEditingEnabled}>
                    Confirmar
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
        </div>
      </div>

      {selected.size > 0 && (
        <div className="sticky top-[6.25rem] z-[5] flex flex-wrap items-center gap-2 border-b border-border bg-primary/5 px-4 py-2 backdrop-blur">
          <span className="text-xs font-medium text-foreground">
            {selected.size} selecionada(s)
          </span>
          <Button size="sm" variant="outline" className="gap-1" onClick={cutSelected} disabled={bulkDeleteMut.isPending || !canMutate || !isEditingEnabled}>
            <Scissors className="h-4 w-4" /> Recortar
          </Button>
          {smartOn && (
            <Button
              size="sm"
              variant="outline"
              className="gap-1 border-violet-300 text-violet-700 hover:bg-violet-50 dark:text-violet-300 dark:hover:bg-violet-950/30"
              onClick={() => aplicarSugestoes(Array.from(selected))}
              disabled={!isEditingEnabled}
            >
              <Wand2 className="h-4 w-4" /> Sugerir preenchimento
            </Button>
          )}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="sm" variant="outline" className="gap-1">
                <Palette className="h-4 w-4" /> Destacar
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              {HIGHLIGHT_COLORS.map((c) => (
                <DropdownMenuItem key={c.name} onClick={() => setHighlightForSelected(c.name)}>
                  <span className="mr-2 inline-block h-3 w-3 rounded-sm border border-border" style={{ background: c.sw }} />
                  {c.label}
                </DropdownMenuItem>
              ))}
              <DropdownMenuItem onClick={() => setHighlightForSelected(null)}>
                <X className="mr-2 h-3 w-3" /> Remover destaque
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button
            size="sm"
            variant="destructive"
            className="gap-1"
            onClick={() => setBulkPendingDelete(true)}
            disabled={bulkDeleteMut.isPending || !canDelete || !isEditingEnabled}
          >
            {bulkDeleteMut.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
            Excluir
          </Button>
          <Button size="sm" variant="ghost" className="gap-1 ml-auto" onClick={() => setSelected(new Set())}>
            <X className="h-4 w-4" /> Limpar seleção
          </Button>
        </div>
      )}

      <div className="p-4">
        <div className="relative max-h-[calc(100vh-11rem)] overflow-auto rounded-lg border border-border bg-card">
          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <table className="min-w-full border-collapse text-xs">
              <thead className="sticky top-0 z-10 bg-muted/95 backdrop-blur">
                <tr>
                  <th className="w-8 border-b border-border px-2 py-2 text-left">
                    <Checkbox
                      checked={allSelected ? true : someSelected ? "indeterminate" : false}
                      onCheckedChange={toggleAll}
                      aria-label="Selecionar todas"
                    />
                  </th>
                  <th className="w-10 border-b border-border px-2 py-2 text-left font-semibold text-muted-foreground">#</th>
                  {smartOn && (
                    <th className="w-9 border-b border-border px-2 py-2 text-left" title="Assistência inteligente">
                      <Sparkles className="h-3.5 w-3.5 text-violet-500" />
                    </th>
                  )}
                  {VISIBLE_CAMPOS.map((c) => (
                    <th
                      key={c.key}
                      className="cursor-pointer select-none whitespace-nowrap border-b border-r border-border px-2 py-2 text-left font-semibold text-foreground hover:bg-muted"
                      onClick={() => toggleSort(c.key)}
                    >
                      <div className="flex items-center gap-1">
                        {c.label}
                        {sortKey === c.key
                          ? (sortDir === "asc" ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />)
                          : <ArrowUpDown className="h-3 w-3 opacity-40" />}
                      </div>
                    </th>
                  ))}
                    <th className="w-10 border-b border-border px-2 py-2 text-left font-semibold text-muted-foreground">Audit</th>
                  </tr>
              </thead>
              <tbody>
                {rows.map((r, i) => {
                  const bg = colorBg(highlights[r.id]);
                  return (
                    <tr
                      key={r.id}
                      className="group hover:bg-muted/40"
                      style={bg ? { background: bg } : undefined}
                    >
                      <td className="border-b border-border px-2 py-1">
                        <Checkbox
                          checked={selected.has(r.id)}
                          onCheckedChange={() => toggleOne(r.id)}
                          aria-label={`Selecionar linha ${i + 1}`}
                        />
                      </td>
                      <td className="border-b border-border px-2 py-1 text-muted-foreground">
                        {i + 1}
                      </td>
                      {smartOn && (
                        <SmartRowCell
                          row={r}
                          alertas={diagnostico?.porLinha.get(r.id) ?? []}
                          modelo={modelo}
                          rotulos={rotulos}
                          disabled={!isEditingEnabled}
                          onApply={(patch) => stableCellSave(r.id, patch, r)}
                        />
                      )}
                      {VISIBLE_CAMPOS.map((c) => (
                        <EditableCell
                          key={c.key}
                          rowId={r.id}
                          row={r}
                          col={c}
                          onSave={stableCellSave}
                          disabled={!isEditingEnabled}
                          suggest={smartOn ? suggestFn : undefined}
                        />
                      ))}
                      <td className="border-b border-border px-2 py-1">
                        <AuditCell pagamentoId={r.id} />
                      </td>
                    </tr>
                  );
                })}

                {rows.length === 0 && (
                  <tr>
                    <td colSpan={VISIBLE_CAMPOS.length + (smartOn ? 4 : 3)} className="px-4 py-16 text-center text-sm text-muted-foreground">
                      Nenhum lançamento. Clique em "Novo" ou importe uma planilha Excel.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <AlertDialog open={bulkPendingDelete} onOpenChange={setBulkPendingDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir {selected.size} lançamento(s)?</AlertDialogTitle>
            <AlertDialogDescription>Essa ação é permanente e ficará registrada na auditoria.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                bulkDeleteMut.mutate(Array.from(selected));
                setBulkPendingDelete(false);
              }}
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={!!blocked} onOpenChange={(o) => { if (!o) { setBlocked(null); setBlockedMotivo(""); } }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-amber-700">Provisão do dia já foi enviada</DialogTitle>
            <DialogDescription>
              A provisão diária de{" "}
              <b>{blocked ? new Date(blocked.dataCredito + "T00:00:00").toLocaleDateString("pt-BR") : ""}</b>{" "}
              já foi fechada. Novos lançamentos para esta data estão bloqueados.
              <br /><br />
              Se este pagamento realmente precisa entrar no dia, envie uma solicitação ao
              administrador. Ela ficará registrada na <b>Central de Divergências</b> e o
              administrador poderá liberar o lançamento.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="motivo-solic">Justificativa (obrigatório)</Label>
            <Textarea
              id="motivo-solic"
              rows={4}
              placeholder="Explique por que este pagamento precisa ficar nesta data..."
              value={blockedMotivo}
              onChange={(e) => setBlockedMotivo(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setBlocked(null); setBlockedMotivo(""); }}>
              Cancelar
            </Button>
            <Button
              onClick={() => solicitacaoMut.mutate()}
              disabled={solicitacaoMut.isPending || blockedMotivo.trim().length < 5}
              className="bg-amber-600 text-white hover:bg-amber-700"
            >
              {solicitacaoMut.isPending ? "Enviando..." : "Enviar solicitação"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={entrarMut.isPending || (!!currentUserQueue && currentUserQueue.status === 'aguardando' && filaOpen)}
        onOpenChange={(open) => {
          // Só permite fechar se o estado da fila mudar ou via botões internos.
          // O onOpenChange(false) disparado por cliques fora/ESC é ignorado aqui.
          if (!open) {
             // Opcional: registrar log ou apenas ignorar o fechamento forçado
             return;
          }
          setFilaOpen(open);
        }}
      >
        <DialogContent 
          className="max-w-sm border-amber-200 bg-amber-50/95 dark:bg-amber-950/20 backdrop-blur-md"
          onPointerDownOutside={(e) => e.preventDefault()}
          onInteractOutside={(e) => e.preventDefault()}
          onEscapeKeyDown={(e) => e.preventDefault()}
        >
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-amber-700">
              <Timer className="h-5 w-5 animate-pulse" /> Fila de Edição
            </DialogTitle>
            <DialogDescription className="text-amber-800/80">
              Sua posição atual é <b>{posicaoFila}º</b> na fila.
              <br /><br />
              Atualmente <b>{activeUser?.user_nome}</b> está editando a base. Você terá permissão automaticamente assim que chegar sua vez.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="rounded-lg border border-amber-200 bg-amber-100/50 p-3 space-y-2">
              <span className="text-xs font-bold text-amber-900 flex items-center gap-2">
                <Users className="h-3.5 w-3.5" /> Pessoas à frente: {posicaoFila ? posicaoFila - 1 : 0}
              </span>
              <div className="flex flex-col gap-1.5">
                {queue.slice(0, (posicaoFila || 1) - 1).map((q, i) => (
                  <span key={q.id} className="text-[10px] text-amber-800/70 flex items-center gap-1.5">
                    <ChevronRight className="h-2.5 w-2.5" /> {q.user_nome} {i === 0 ? '(Editando)' : ''}
                  </span>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter className="flex-col sm:flex-col gap-2">
            <Button 
              variant="outline" 
              className="w-full border-amber-300 text-amber-800 hover:bg-amber-100" 
              onClick={() => {
                setFilaOpen(false);
                toast.info("Você minimizou o modal da fila. Ele reabrirá se houver atualizações importantes.");
              }}
            >
              Aguardar em Segundo Plano
            </Button>
            <Button
              className="w-full gap-2 bg-red-600 font-bold text-white hover:bg-red-700"
              onClick={() => { 
                // setFilaOpen(false); // Mantemos a fila aberta para evitar fechar antes da confirmação
                setConfirmSaidaFila(true); 
              }}
            >
              <LogOut className="h-4 w-4" /> Sair da Fila
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirmação de saída da fila */}
      <AlertDialog open={confirmSaidaFila} onOpenChange={setConfirmSaidaFila}>
        <AlertDialogContent className="border-red-200 bg-card/95 backdrop-blur-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-red-600">
              <LogOut className="h-5 w-5" /> Sair da fila?
            </AlertDialogTitle>
            <AlertDialogDescription className="leading-relaxed">
              Você deseja realmente sair da fila? Ao confirmar, sua posição será liberada e será
              necessário entrar novamente caso deseje realizar o pagamento posteriormente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={sairMut.isPending}>Permanecer na fila</AlertDialogCancel>
            <AlertDialogAction
              className="gap-2 bg-red-600 text-white hover:bg-red-700"
              disabled={sairMut.isPending}
              onClick={(e) => { e.preventDefault(); sairMut.mutate(); }}
            >
              {sairMut.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogOut className="h-4 w-4" />}
              Confirmar saída
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

const EditableCell = React.memo(function EditableCell({
  rowId, row, col, onSave, disabled, suggest,
}: {
  rowId: string;
  row: Pagamento;
  col: typeof PAGAMENTO_CAMPOS[number];
  onSave: (id: string, patch: PagamentoInput, oldData: Pagamento) => void;
  disabled?: boolean;
  /** Assistência inteligente: valores frequentes para o campo neste contexto. */
  suggest?: (campo: string, row: Pagamento) => string[];
}) {
  const raw = row[col.key];
  const editable = col.editable !== false && !col.computed;

  const display = (() => {
    if (raw == null || raw === "") return "";
    if (col.key === "registrado_em") return fmtDateTime(raw as string);
    if (col.kind === "currency") return brl(raw as number);
    return String(raw);
  })();

  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState("");

  const startEdit = () => {
    if (disabled) return;
    setValue(raw == null ? "" : String(raw));
    setEditing(true);
  };

  const commit = () => {
    setEditing(false);
    const syncedStr = raw == null ? "" : String(raw);
    if (value === syncedStr) return;
    let parsed: string | number | null;
    if (value === "") parsed = null;
    else if (col.kind === "number" || col.kind === "currency") {
      const n = Number(value.replace(/[R$\s.]/g, "").replace(",", "."));
      if (Number.isNaN(n)) return;
      parsed = n;
    } else {
      parsed = value;
    }
    onSave(rowId, { [col.key]: parsed } as PagamentoInput, row);
  };

  const width =
    col.kind === "currency" ? 130 :
    col.kind === "date" ? 130 :
    col.kind === "number" ? 100 :
    col.key === "descricao_pagamento" ? 240 :
    col.key === "tipo_arquivo" || col.key === "arquivo_remessa" ? 200 :
    col.key === "observacao" ? 200 : 140;

  if (!editable) {
    return (
      <td style={{ minWidth: width }} className="whitespace-nowrap border-b border-r border-border px-2 py-1 text-muted-foreground">
        {display || <span className="opacity-40">—</span>}
      </td>
    );
  }

  if (col.kind === "select" && col.options) {
    const opts =
      col.key === "descricao_pagamento"
        ? getDescricoesByCelula(row.celula)
        : col.options;
    return (
      <td style={{ minWidth: width }} className="border-b border-r border-border p-0">
        <Select
          value={(raw as string) ?? ""}
          onValueChange={(v) => onSave(rowId, { [col.key]: v || null } as PagamentoInput, row)}
        >
          <SelectTrigger className="h-8 border-0 bg-transparent text-xs shadow-none focus:ring-1">
            <SelectValue placeholder="—" />
          </SelectTrigger>
          <SelectContent>
            {opts.map((o: string) => <SelectItem key={o} value={o}>{o}</SelectItem>)}
          </SelectContent>
        </Select>
      </td>
    );
  }

  // Assistência: valores recorrentes para este campo/contexto (texto livre).
  const listId = `sug-${col.key}-${rowId}`;
  const opcoesSugeridas =
    editing && suggest && col.kind === "text" ? suggest(col.key, row).filter(Boolean) : [];

  return (
    <td style={{ minWidth: width }} className="border-b border-r border-border p-0">
      {editing ? (
        <>
          <input
            autoFocus
            type={col.kind === "date" ? "date" : "text"}
            inputMode={col.kind === "number" || col.kind === "currency" ? "decimal" : undefined}
            list={opcoesSugeridas.length ? listId : undefined}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onBlur={commit}
            onKeyDown={(e) => {
              if (e.key === "Enter") (e.target as HTMLInputElement).blur();
              if (e.key === "Escape") { setEditing(false); }
            }}
            className="w-full bg-background px-2 py-1.5 text-xs outline-none ring-2 ring-primary/60"
          />
          {opcoesSugeridas.length > 0 && (
            <datalist id={listId}>
              {opcoesSugeridas.map((o) => <option key={o} value={o} />)}
            </datalist>
          )}
        </>
      ) : (
        <button
          type="button"
          onClick={startEdit}
          className="block w-full truncate px-2 py-1.5 text-left text-xs hover:bg-muted/40"
          title={display || "—"}
        >
          {display || <span className="text-muted-foreground/60">—</span>}
        </button>
      )}
    </td>
  );
}, (prev, next) => {
  // Só re-renderiza se o valor da célula ou a coluna mudar.
  // Ignora mudanças em outras colunas da linha (que antes forçavam re-render
  // de todas as ~19 células × N linhas a cada keystroke / refetch).
  return (
    prev.col === next.col &&
    prev.onSave === next.onSave &&
    prev.suggest === next.suggest &&
    prev.row[prev.col.key] === next.row[next.col.key] &&
    (prev.col.key === "descricao_pagamento" ? prev.row.celula === next.row.celula : true)
  );
});

/* ---------------- PLANILHA INTELIGENTE — célula de assistência por linha ---------------- */

function SmartRowCell({
  row, alertas, modelo, rotulos, disabled, onApply,
}: {
  row: Pagamento;
  alertas: AlertaLinha[];
  modelo: ModeloInteligente;
  rotulos: Record<string, string>;
  disabled?: boolean;
  onApply: (patch: PagamentoInput, oldData: Pagamento) => void;
}) {
  const [open, setOpen] = useState(false);
  const sugestoes = useMemo(
    () => (open ? sugerirPreenchimento(modelo, row, rotulos) : []),
    [open, modelo, row, rotulos],
  );

  const incompletos = alertas.filter((a) => a.tipo === "incompleto").length;
  const inconsistencias = alertas.filter((a) => a.tipo === "inconsistencia").length;

  const cor =
    inconsistencias > 0 ? "text-rose-500" :
    incompletos > 0 ? "text-amber-500" :
    "text-emerald-500/70";

  return (
    <td className="border-b border-r border-border p-0 text-center align-middle">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button
            type="button"
            className="flex h-full w-full items-center justify-center px-2 py-1.5 hover:bg-violet-500/10"
            title={
              alertas.length
                ? `${alertas.length} ponto(s) de atenção`
                : "Linha consistente — ver sugestões"
            }
          >
            {alertas.length > 0
              ? <AlertTriangle className={cn("h-3.5 w-3.5", cor)} />
              : <CheckCircle2 className={cn("h-3.5 w-3.5", cor)} />}
          </button>
        </PopoverTrigger>
        <PopoverContent align="start" className="w-80 space-y-3 border-border bg-card/95 p-3 text-left shadow-xl backdrop-blur-md">
          <div className="flex items-center gap-2 border-b border-border pb-2">
            <Sparkles className="h-3.5 w-3.5 text-violet-500" />
            <span className="text-xs font-bold text-foreground">Assistência da linha</span>
          </div>

          {alertas.length > 0 ? (
            <div className="space-y-1.5">
              {alertas.map((a, i) => (
                <div key={i} className="flex items-start gap-2 rounded-md border border-border bg-muted/40 p-2">
                  <AlertTriangle className={cn("mt-0.5 h-3 w-3 shrink-0", a.tipo === "inconsistencia" ? "text-rose-500" : "text-amber-500")} />
                  <span className="text-[10px] leading-relaxed text-foreground">
                    {a.mensagem}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-[10px] text-muted-foreground">
              Nenhuma inconsistência ou campo obrigatório em falta nesta linha.
            </p>
          )}

          {sugestoes.length > 0 && (
            <div className="space-y-2 border-t border-border pt-2">
              <span className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
                Sugestões com base no histórico
              </span>
              <div className="space-y-1.5">
                {sugestoes.map((s) => (
                  <div key={String(s.campo)} className="flex items-center gap-2 rounded-md border border-violet-200/60 bg-violet-500/5 p-2 dark:border-violet-900/60">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[10px] font-semibold text-foreground">
                        {s.label}: {s.valor}
                      </p>
                      <p className="truncate text-[9px] text-muted-foreground">
                        {s.confianca}% · {s.origem}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-6 shrink-0 px-2 text-[10px] text-violet-700 hover:bg-violet-500/10 dark:text-violet-300"
                      disabled={disabled}
                      onClick={() => {
                        onApply(sugestoesParaPatch([s]), row);
                        toast.success(`${s.label} preenchido — você pode alterar a qualquer momento.`);
                      }}
                    >
                      Aplicar
                    </Button>
                  </div>
                ))}
              </div>
              <Button
                size="sm"
                variant="outline"
                className="h-7 w-full gap-1.5 text-[11px]"
                disabled={disabled}
                onClick={() => {
                  onApply(sugestoesParaPatch(sugestoes), row);
                  setOpen(false);
                  toast.success(`${sugestoes.length} campo(s) preenchido(s) por sugestão — revise se necessário.`);
                }}
              >
                <Wand2 className="h-3 w-3" /> Aplicar todas as sugestões
              </Button>
            </div>
          )}

          <p className="text-[9px] italic leading-relaxed text-muted-foreground">
            As recomendações são apenas assistência — você mantém total controle sobre os lançamentos.
          </p>
        </PopoverContent>
      </Popover>
    </td>
  );
}

function AuditCell({ pagamentoId }: { pagamentoId: string }) {
  const getAudit = useServerFn(getPagamentosAudit);
  const { data: logs, isLoading } = useQuery({
    queryKey: ["pagamentos-audit", pagamentoId],
    queryFn: () => getAudit({ data: { pagamentoId } }),
    staleTime: 60000,
  });

  if (isLoading) return <Loader2 className="h-3 w-3 animate-spin opacity-50" />;
  if (!logs || logs.length === 0) return null;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button size="icon" variant="ghost" className="h-6 w-6 text-indigo-500 hover:text-indigo-600 hover:bg-indigo-50">
          <History className="h-3.5 w-3.5" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0 shadow-xl border-border bg-card/95 backdrop-blur-md">
        <div className="p-3 border-b border-border bg-muted/30">
          <h4 className="text-xs font-bold flex items-center gap-2">
            <History className="h-3 w-3" /> Histórico de Alterações
          </h4>
        </div>
        <div className="max-h-60 overflow-y-auto p-2 space-y-3 custom-scrollbar">
          {logs.map((log: any) => (
            <div key={log.id} className="text-[10px] space-y-1.5 border-l-2 border-indigo-200 pl-2 ml-1">
              <div className="flex items-center justify-between text-muted-foreground font-medium">
                <span>{log.usuario_nome}</span>
                <span>{new Date(log.alterado_em).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" })}</span>
              </div>
              <div className="space-y-1 bg-muted/20 rounded p-1.5 border border-border/50">
                {Object.entries(log.dados_novos || {}).map(([key, value]: [string, any]) => (
                  <div key={key} className="grid grid-cols-1 gap-0.5">
                    <span className="font-bold text-foreground opacity-70 uppercase text-[8px]">{key.replace(/_/g, " ")}</span>
                    <div className="flex items-center gap-1 flex-wrap">
                      <span className="text-red-500/80 line-through truncate max-w-[100px]">{String(log.dados_anteriores?.[key] ?? "—")}</span>
                      <ChevronRight className="h-2 w-2 text-muted-foreground shrink-0" />
                      <span className="text-emerald-600 font-semibold truncate max-w-[100px]">{String(value ?? "—")}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}


/* ---------------- DASHBOARD ---------------- */

const PIE_COLORS = ["#3b82f6","#8b5cf6","#22c55e","#f59e0b","#ef4444","#06b6d4","#ec4899","#84cc16","#f97316","#14b8a6"];

function DashboardTab() {
  const { user } = useSession();
  const { data = [], isLoading } = useQuery({
    queryKey: pagamentosQueryKey,
    queryFn: fetchPagamentos,
    enabled: !!user,
    staleTime: 30_000,
  });

  const [fEmpresa, setFEmpresa] = useState<string>("");
  const [fCelula, setFCelula] = useState<string>("");
  const [fCompetencia, setFCompetencia] = useState<string>("");
  
  const [fBanco, setFBanco] = useState<string>("");
  const [fFolha, setFFolha] = useState<string>("");
  const [fDataIni, setFDataIni] = useState<string>("");
  const [fDataFim, setFDataFim] = useState<string>("");
  const [fColab, setFColab] = useState<string>("");

  const opts = useMemo(() => {
    const uniq = (k: keyof Pagamento) =>
      Array.from(new Set(data.map((r) => r[k]).filter((v) => v != null && v !== ""))).sort() as string[];
    return {
      empresa: uniq("empresa"),
      celula: uniq("celula"),
      banco: uniq("banco"),
      folha: uniq("folha"),
      colab: uniq("colaborador_nome"),
      
    };
  }, [data]);

  const filtered = useMemo(() => {
    return data.filter((r) => {
      if (fEmpresa && r.empresa !== fEmpresa) return false;
      if (fCelula && r.celula !== fCelula) return false;
      if (fCompetencia && r.competencia !== fCompetencia) return false;
      
      if (fBanco && r.banco !== fBanco) return false;
      if (fFolha && r.folha !== fFolha) return false;
      if (fColab && r.colaborador_nome !== fColab) return false;
      if (fDataIni && (r.data_credito ?? "") < fDataIni) return false;
      if (fDataFim && (r.data_credito ?? "") > fDataFim) return false;
      return true;
    });
  }, [data, fEmpresa, fCelula, fCompetencia, fBanco, fFolha, fColab, fDataIni, fDataFim]);

  const kpis = useMemo(() => {
    const total = filtered.reduce((s, r) => s + (Number(r.valor_lg) || 0), 0);
    const qtdColab = filtered.reduce((s, r) => s + (Number(r.qtde_colaboradores) || 0), 0);
    const media = filtered.length ? total / filtered.length : 0;
    return {
      total, qtdColab, media,
      lancamentos: filtered.length,
      empresas: new Set(filtered.map((r) => r.empresa).filter(Boolean)).size,
      descricoes: new Set(filtered.map((r) => r.descricao_pagamento).filter(Boolean)).size,
    };
  }, [filtered]);

  const porEmpresa = useMemo(() => {
    const m = new Map<string, number>();
    for (const r of filtered) {
      const k = r.empresa || "—";
      m.set(k, (m.get(k) ?? 0) + (Number(r.valor_lg) || 0));
    }
    return Array.from(m, ([empresa, valor]) => ({ empresa, valor })).sort((a,b) => b.valor - a.valor);
  }, [filtered]);

  const porCelula = useMemo(() => {
    const m = new Map<string, number>();
    for (const r of filtered) {
      const k = r.celula || "—";
      m.set(k, (m.get(k) ?? 0) + (Number(r.valor_lg) || 0));
    }
    return Array.from(m, ([celula, valor]) => ({ celula, valor })).sort((a,b) => b.valor - a.valor);
  }, [filtered]);

  const porDescricao = useMemo(() => {
    const m = new Map<string, number>();
    for (const r of filtered) {
      const k = r.descricao_pagamento || "—";
      m.set(k, (m.get(k) ?? 0) + (Number(r.valor_lg) || 0));
    }
    return Array.from(m, ([name, value]) => ({ name, value })).sort((a,b) => b.value - a.value).slice(0, 10);
  }, [filtered]);

  const evolucao = useMemo(() => {
    const m = new Map<string, number>();
    for (const r of filtered) {
      if (!r.data_credito) continue;
      m.set(r.data_credito, (m.get(r.data_credito) ?? 0) + (Number(r.valor_lg) || 0));
    }
    return Array.from(m, ([data, valor]) => ({ data, valor })).sort((a,b) => a.data.localeCompare(b.data));
  }, [filtered]);

  const topLancamentos = useMemo(
    () => [...filtered].sort((a,b) => (Number(b.valor_lg)||0) - (Number(a.valor_lg)||0)).slice(0, 10),
    [filtered]
  );

  const clearFilters = () => {
    setFEmpresa(""); setFCelula(""); setFCompetencia("");
    setFBanco(""); setFFolha(""); setFColab(""); setFDataIni(""); setFDataFim("");
  };

  if (isLoading) {
    return <div className="flex items-center justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;
  }

  return (
    <div className="space-y-4 p-4">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-2 md:grid-cols-4 lg:grid-cols-5">
            <FilterSelect label="Empresa" value={fEmpresa} onChange={setFEmpresa} options={opts.empresa} />
            <FilterSelect label="Célula" value={fCelula} onChange={setFCelula} options={opts.celula} />
            <FilterSelect label="Competência" value={fCompetencia} onChange={setFCompetencia} options={[...COMPETENCIAS]} />
            
            <FilterSelect label="Banco" value={fBanco} onChange={setFBanco} options={opts.banco} />
            <FilterSelect label="Folha" value={fFolha} onChange={setFFolha} options={opts.folha} />
            <FilterSelect label="Colaborador" value={fColab} onChange={setFColab} options={opts.colab} />
            <div className="md:col-span-2">
              <label className="mb-1 block text-xs text-muted-foreground">Período</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "h-9 w-full justify-start gap-2 text-left font-normal",
                      !fDataIni && !fDataFim && "text-muted-foreground",
                    )}
                  >
                    <CalendarIcon className="h-4 w-4" />
                    {fDataIni || fDataFim ? (
                      <span>
                        {fDataIni ? format(parseISO(fDataIni), "dd.MM.yyyy") : "…"}
                        {" a "}
                        {fDataFim ? format(parseISO(fDataFim), "dd.MM.yyyy") : "…"}
                      </span>
                    ) : (
                      <span>Selecione o período</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent align="start" className="w-auto p-0">
                  <Calendar
                    mode="range"
                    numberOfMonths={2}
                    selected={{
                      from: fDataIni ? parseISO(fDataIni) : undefined,
                      to: fDataFim ? parseISO(fDataFim) : undefined,
                    }}
                    onSelect={(range: DateRange | undefined) => {
                      setFDataIni(range?.from ? format(range.from, "yyyy-MM-dd") : "");
                      setFDataFim(range?.to ? format(range.to, "yyyy-MM-dd") : "");
                    }}
                    initialFocus
                    className={cn("p-3 pointer-events-auto")}
                  />
                  <div className="flex items-center justify-end gap-2 border-t border-border p-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => { setFDataIni(""); setFDataFim(""); }}
                    >
                      Limpar
                    </Button>
                  </div>
                </PopoverContent>
              </Popover>
            </div>
            <div className="flex items-end">
              <Button variant="outline" size="sm" onClick={clearFilters} className="w-full">Limpar filtros</Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-5">
        <Kpi label="Valor Total" value={brlCompact(kpis.total)} title={brl(kpis.total)} />
        <Kpi label="Lançamentos" value={kpis.lancamentos.toLocaleString("pt-BR")} />
        <Kpi label="Colaboradores" value={kpis.qtdColab.toLocaleString("pt-BR")} />
        <Kpi label="Empresas" value={String(kpis.empresas)} />
        <Kpi label="Tipos de Pagamento" value={String(kpis.descricoes)} />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Total por Empresa</CardTitle></CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={porEmpresa.slice(0,10)}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                <XAxis dataKey="empresa" tick={{ fontSize: 10 }} interval={0} angle={-25} textAnchor="end" height={70} />
                <YAxis tick={{ fontSize: 10 }} tickFormatter={(v) => brlShort(v)} />
                <Tooltip formatter={(v: number) => brl(v)} />
                <Bar dataKey="valor" fill="#3b82f6" radius={[4,4,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Total por Célula</CardTitle></CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={porCelula}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                <XAxis dataKey="celula" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 10 }} tickFormatter={(v) => brlShort(v)} />
                <Tooltip formatter={(v: number) => brl(v)} />
                <Bar dataKey="valor" fill="#8b5cf6" radius={[4,4,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Distribuição por Tipo de Pagamento (Top 10)</CardTitle></CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={porDescricao} dataKey="value" nameKey="name" outerRadius={90} label={(e: { name: string }) => e.name.slice(0, 18)}>
                  {porDescricao.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                </Pie>
                <Tooltip formatter={(v: number) => brl(v)} />
                <Legend wrapperStyle={{ fontSize: 10 }} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Evolução dos Pagamentos</CardTitle></CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <ReLineChart data={evolucao}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                <XAxis dataKey="data" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} tickFormatter={(v) => brlShort(v)} />
                <Tooltip formatter={(v: number) => brl(v)} />
                <Line type="monotone" dataKey="valor" stroke="#22c55e" strokeWidth={2} dot={false} />
              </ReLineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-sm">Ranking — Maiores Lançamentos</CardTitle></CardHeader>
        <CardContent>
          <div className="overflow-auto">
            <table className="min-w-full text-xs">
              <thead className="bg-muted/60">
                <tr>
                  <th className="px-2 py-1 text-left">#</th>
                  <th className="px-2 py-1 text-left">Empresa</th>
                  <th className="px-2 py-1 text-left">Descrição</th>
                  <th className="px-2 py-1 text-left">Data</th>
                  <th className="px-2 py-1 text-right">Valor LG</th>
                </tr>
              </thead>
              <tbody>
                {topLancamentos.map((r, i) => (
                  <tr key={r.id} className="border-t border-border">
                    <td className="px-2 py-1 text-muted-foreground">{i + 1}</td>
                    <td className="px-2 py-1">{r.empresa ?? "—"}</td>
                    <td className="px-2 py-1">{r.descricao_pagamento ?? "—"}</td>
                    <td className="px-2 py-1">{r.data_credito ? r.data_credito.split("-").reverse().join("/") : "—"}</td>
                    <td className="px-2 py-1 text-right font-medium">{brl(r.valor_lg)}</td>
                  </tr>
                ))}
                {topLancamentos.length === 0 && (
                  <tr><td colSpan={5} className="px-2 py-6 text-center text-muted-foreground">Sem dados no filtro atual.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function Kpi({ label, value, title }: { label: string; value: string; title?: string }) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="text-[11px] uppercase text-muted-foreground">{label}</div>
        <div className="mt-1 text-lg font-semibold text-foreground" title={title ?? value}>{value}</div>
      </CardContent>
    </Card>
  );
}

function FilterSelect({
  label, value, onChange, options,
}: { label: string; value: string; onChange: (v: string) => void; options: string[] }) {
  return (
    <div>
      <label className="mb-1 block text-xs text-muted-foreground">{label}</label>
      <Select value={value || "__all"} onValueChange={(v) => onChange(v === "__all" ? "" : v)}>
        <SelectTrigger className="h-9"><SelectValue placeholder="Todos" /></SelectTrigger>
        <SelectContent>
          <SelectItem value="__all">Todos</SelectItem>
          {options.map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}
        </SelectContent>
      </Select>
    </div>
  );
}

function FechamentoCompetenciaButton({ onComplete, disabled, data }: { onComplete: () => void; disabled?: boolean; data: Pagamento[] }) {
  const { isAdmin } = useRoles();
  const [open, setOpen] = useState(false);
  const [nome, setNome] = useState("");
  const { user } = useSession();

  const mutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Usuário não autenticado");

      // Validar pendências: status_itau ou status_bankmanager vazios em lançamentos com valor
      const pendencias = data.filter(r => 
        (r.valor_lg && !r.status_bankmanager) || 
        (r.valor_itau && !r.status_itau)
      );

      if (pendencias.length > 0) {
        throw new Error(`Não é possível fechar: existem ${pendencias.length} lançamentos com status pendente.`);
      }
      
      // Export current data to Excel before clearing
      const exportRows = data.map((r) => {
        const o: Record<string, unknown> = {};
        for (const c of PAGAMENTO_CAMPOS) {
          const v = (r as any)[c.key];
          o[c.label] = c.key === "registrado_em" ? fmtDateTime(v as string) : v;
        }
        return o;
      });
      const ws = XLSX.utils.json_to_sheet(exportRows);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Fechamento");
      XLSX.writeFile(wb, `fechamento-${nome}-${format(new Date(), "dd-MM-yyyy")}.xlsx`);

      // Database closure and cleanup via Server Function
      const { fecharCompetenciaPagamentosFn } = await import("@/lib/fechamento-pagamentos.functions");
      await fecharCompetenciaPagamentosFn({
        data: {
          nome,
          usuarioId: user.id,
          registros: data
        }
      });
      await logAcaoCritica({
        acao: "fechamento_competencia",
        modulo: "Pagamentos Diversos",
        tabela: "fechamento_pagamentos",
        descricao: `Competência "${nome}" fechada e arquivada com ${data.length} registro(s); base limpa para novo ciclo`,
        metadata: { 
          registros: data.length, 
          competencia: nome,
          data_fechamento: new Date().toISOString()
        },
        severidade: "critico",
      });
    },
    onSuccess: () => {
      toast.success("Competência de Pagamentos Diversos fechada e base limpa.");
      setOpen(false);
      setNome("");
      onComplete();
    },
    onError: (e: any) => toast.error(e.message),
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline" className="gap-1 border-emerald-600 text-emerald-700 hover:bg-emerald-50" disabled={disabled}>
          <TableIcon className="h-4 w-4" /> Fechamento de Competência
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Fechamento de Competência — Pagamentos Diversos</DialogTitle>
          <DialogDescription className="mt-2 bg-red-50 p-4 text-red-800 border border-red-200 rounded-md flex flex-col gap-2">
            <div className="flex items-center gap-2 font-bold text-red-600">
              <Info className="h-5 w-5" />
              INFORMATIVO CRÍTICO
            </div>
            <span className="text-sm">
              Ao realizar o fechamento, os dados de <b>Pagamentos Diversos</b> serão salvos em um arquivo Excel 
              e a base será <b>totalmente limpa</b> para iniciar um novo ciclo. Esta ação é irreversível na base ativa.
            </span>
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="nome-fechamento-pg">Nome do Fechamento (Ex: Julho/2026)</Label>
            <Input
              id="nome-fechamento-pg"
              placeholder="Digite um nome para o arquivo..."
              value={nome}
              onChange={(e) => setNome(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
          <Button 
            className="bg-red-600 hover:bg-red-700 text-white font-bold"
            onClick={() => mutation.mutate()}
            disabled={!nome || mutation.isPending}
          >
            {mutation.isPending ? "Processando..." : "Realizar Fechamento e Limpar Base"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default PagamentosPage;
