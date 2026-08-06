import { createFileRoute, Link } from "@tanstack/react-router";
import { AppLogo } from "@/components/app-logo";
import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import jsPDF from "jspdf";
import {
  BookOpen,
  Download,
  FileText,
  Loader2,
  Pencil,
  Plus,
  Search,
  Sparkles,
  Trash2,
  LifeBuoy,
  ShieldCheck,
  Star,
  Keyboard,
} from "lucide-react";
import { toast } from "sonner";

import { AppSidebar } from "@/components/app-sidebar";
import { HeaderActions } from "@/components/header-actions";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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

import { useRoles } from "@/hooks/use-roles";
import { useProfile } from "@/hooks/use-profile";
import { useSession } from "@/hooks/use-session";
import { perguntarIa } from "@/lib/ia.functions";
import {
  createMaterial,
  deleteMaterial,
  fetchMateriais,
  materialApoioQueryKey,
  rankMateriais,
  updateMaterial,
  type MaterialApoio,
  favoritosMaterialQueryKey,
  fetchFavoritos,
  favoritarMaterial,
  desfavoritarMaterial,
} from "@/lib/material-apoio";

export const Route = createFileRoute("/material-apoio")({
  head: () => ({
    meta: [
      { title: "Material de Apoio — Portal da Pagadoria" },
      {
        name: "description",
        content:
          "Central de ajuda do Portal da Pagadoria: materiais de suporte, busca por dúvidas, IA assistente e download em PDF.",
      },
      { property: "og:title", content: "Material de Apoio — Portal da Pagadoria" },
      {
        property: "og:description",
        content:
          "Materiais de suporte do portal, busca inteligente de dúvidas e download do conteúdo em PDF.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: MaterialApoioPage,
});

/** Renderizador leve de markdown (títulos, listas, negrito e tabelas simples). */
function Markdown({ text }: { text: string }) {
  const blocks = text.split("\n");
  const inline = (s: string) =>
    s.split(/(\*\*[^*]+\*\*)/g).map((part, i) =>
      part.startsWith("**") && part.endsWith("**") ? (
        <strong key={i} className="font-semibold text-foreground">
          {part.slice(2, -2)}
        </strong>
      ) : (
        <span key={i}>{part}</span>
      ),
    );

  return (
    <div className="space-y-2 text-sm leading-relaxed text-muted-foreground">
      {blocks.map((line, i) => {
        const l = line.trimEnd();
        if (!l.trim()) return <div key={i} className="h-1" />;
        if (l.startsWith("### ")) return <h4 key={i} className="pt-2 text-sm font-semibold text-foreground">{inline(l.slice(4))}</h4>;
        if (l.startsWith("## ")) return <h3 key={i} className="pt-3 text-base font-semibold text-foreground">{inline(l.slice(3))}</h3>;
        if (l.startsWith("# ")) return <h2 key={i} className="pt-1 text-lg font-bold text-foreground">{inline(l.slice(2))}</h2>;
        if (/^\|/.test(l)) {
          const cells = l.split("|").slice(1, -1).map((c) => c.trim());
          if (cells.every((c) => /^:?-{2,}:?$/.test(c))) return null;
          return (
            <div key={i} className="grid gap-2" style={{ gridTemplateColumns: `repeat(${cells.length}, minmax(0,1fr))` }}>
              {cells.map((c, j) => (
                <span key={j} className="rounded bg-muted/60 px-2 py-1 text-xs">
                  {inline(c)}
                </span>
              ))}
            </div>
          );
        }
        if (/^\d+\.\s/.test(l))
          return (
            <div key={i} className="flex gap-2 pl-1">
              <span className="font-semibold text-violet-600">{l.match(/^\d+/)![0]}.</span>
              <span>{inline(l.replace(/^\d+\.\s/, ""))}</span>
            </div>
          );
        if (l.startsWith("- ") || l.startsWith("* "))
          return (
            <div key={i} className="flex gap-2 pl-1">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-violet-500" />
              <span>{inline(l.slice(2))}</span>
            </div>
          );
        return <p key={i}>{inline(l)}</p>;
      })}
    </div>
  );
}

function baixarPdf(materiais: MaterialApoio[], titulo: string) {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const margem = 48;
  const largura = doc.internal.pageSize.getWidth() - margem * 2;
  let y = margem;

  const quebra = (altura: number) => {
    if (y + altura > doc.internal.pageSize.getHeight() - margem) {
      doc.addPage();
      y = margem;
    }
  };

  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.text("Portal da Pagadoria", margem, y);
  y += 22;
  doc.setFontSize(12);
  doc.setFont("helvetica", "normal");
  doc.text(titulo, margem, y);
  y += 14;
  doc.setFontSize(9);
  doc.setTextColor(120);
  doc.text(`Gerado em ${new Date().toLocaleString("pt-BR")}`, margem, y);
  y += 24;
  doc.setTextColor(0);

  materiais.forEach((m) => {
    quebra(40);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    doc.text(m.titulo, margem, y);
    y += 16;
    doc.setFont("helvetica", "italic");
    doc.setFontSize(9);
    doc.setTextColor(110);
    doc.text(`Categoria: ${m.categoria}`, margem, y);
    y += 16;
    doc.setTextColor(0);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    const linhas = doc.splitTextToSize(
      m.conteudo.replace(/\*\*/g, "").replace(/^#+\s?/gm, ""),
      largura,
    ) as string[];
    linhas.forEach((linha) => {
      quebra(14);
      doc.text(linha, margem, y);
      y += 14;
    });
    y += 16;
  });

  doc.save(`portal-pagadoria-material-apoio.pdf`);
}

const CATEGORIAS_SUGERIDAS = [
  "Introdução",
  "Pagamentos",
  "Provisão",
  "Conciliação",
  "Despesas Fixas",
  "Governança",
  "Suporte",
];

const vazio = {
  titulo: "",
  categoria: "Geral",
  resumo: "",
  conteudo: "",
  palavras_chave: "",
  publicado: true,
  ordem: 0,
};

function MaterialApoioPage() {
  const { isAdmin } = useRoles();
  const { nome } = useProfile();
  const { user } = useSession();
  const qc = useQueryClient();

  const { data: materiais = [], isLoading } = useQuery({
    queryKey: materialApoioQueryKey,
    queryFn: fetchMateriais,
    staleTime: 60_000,
  });

  const { data: favoritos = [] } = useQuery({
    queryKey: [...favoritosMaterialQueryKey, user?.id ?? "anon"],
    queryFn: () => fetchFavoritos(user?.id),
    enabled: !!user?.id,
    staleTime: 30_000,
  });
  const favSet = useMemo(() => new Set(favoritos), [favoritos]);
  const [salvandoFav, setSalvandoFav] = useState<string | null>(null);

  async function alternarFavorito(m: MaterialApoio) {
    if (!user?.id) {
      toast.info("Entre na sua conta para favoritar materiais.");
      return;
    }
    const jaEra = favSet.has(m.id);
    setSalvandoFav(m.id);
    try {
      if (jaEra) {
        await desfavoritarMaterial(user.id, m.id);
        toast.success("Removido dos favoritos.");
      } else {
        await favoritarMaterial(user.id, m.id);
        toast.success("Adicionado aos favoritos.");
      }
      await qc.invalidateQueries({ queryKey: favoritosMaterialQueryKey });
    } catch (e: any) {
      toast.error(e?.message ?? "Não foi possível atualizar os favoritos.");
    } finally {
      setSalvandoFav(null);
    }
  }

  const [busca, setBusca] = useState("");
  const [somenteFavoritos, setSomenteFavoritos] = useState(false);
  const [categoria, setCategoria] = useState<string | null>(null);
  const [aberto, setAberto] = useState<string | null>(null);


  const [editando, setEditando] = useState<MaterialApoio | null>(null);
  const [criando, setCriando] = useState(false);
  const [form, setForm] = useState({ ...vazio });
  const [salvando, setSalvando] = useState(false);
  const [excluir, setExcluir] = useState<MaterialApoio | null>(null);

  const categorias = useMemo(
    () => Array.from(new Set(materiais.map((m) => m.categoria))).sort(),
    [materiais],
  );

  const filtrados = useMemo(() => {
    let base = materiais;
    if (somenteFavoritos) base = base.filter((m) => favSet.has(m.id));
    if (categoria) base = base.filter((m) => m.categoria === categoria);
    return rankMateriais(base, busca);
  }, [materiais, busca, categoria, somenteFavoritos, favSet]);

  const sugestoes = useMemo(() => {
    if (busca.trim().length < 2) {
      return materiais.slice(0, 5).map((m) => `Como funciona: ${m.titulo}?`);
    }
    const ranked = rankMateriais(materiais, busca).slice(0, 5);
    return ranked.map((m) => m.titulo);
  }, [materiais, busca]);

  const contextoIa = useMemo(
    () =>
      materiais
        .filter((m) => m.publicado)
        .map(
          (m) =>
            `### ${m.titulo} (categoria: ${m.categoria})\nPalavras-chave: ${(m.palavras_chave ?? []).join(", ")}\n${m.conteudo}`,
        )
        .join("\n\n---\n\n")
        .slice(0, 55_000),
    [materiais],
  );

  const perguntar = async () => {
    toast.info("O serviço de IA Assistente foi desativado pela administração.");
  };

  const abrirCriacao = () => {
    setForm({ ...vazio, ordem: materiais.length + 1 });
    setCriando(true);
  };

  const abrirEdicao = (m: MaterialApoio) => {
    setForm({
      titulo: m.titulo,
      categoria: m.categoria,
      resumo: m.resumo ?? "",
      conteudo: m.conteudo,
      palavras_chave: (m.palavras_chave ?? []).join(", "),
      publicado: m.publicado,
      ordem: m.ordem,
    });
    setEditando(m);
  };

  const salvar = async () => {
    if (!form.titulo.trim() || !form.conteudo.trim()) {
      toast.error("Título e conteúdo são obrigatórios.");
      return;
    }
    setSalvando(true);
    const payload = {
      titulo: form.titulo.trim(),
      categoria: form.categoria.trim() || "Geral",
      resumo: form.resumo.trim(),
      conteudo: form.conteudo,
      palavras_chave: form.palavras_chave
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
      publicado: form.publicado,
      ordem: Number(form.ordem) || 0,
    };
    try {
      if (editando) {
        await updateMaterial(editando.id, payload);
        toast.success("Material atualizado.");
      } else {
        await createMaterial(payload, nome ?? user?.email ?? null);
        toast.success("Material publicado.");
      }
      await qc.invalidateQueries({ queryKey: materialApoioQueryKey });
      setEditando(null);
      setCriando(false);
    } catch (e: any) {
      toast.error(e?.message ?? "Não foi possível salvar o material.");
    } finally {
      setSalvando(false);
    }
  };

  const confirmarExclusao = async () => {
    if (!excluir) return;
    try {
      await deleteMaterial(excluir.id);
      await qc.invalidateQueries({ queryKey: materialApoioQueryKey });
      toast.success("Material removido.");
    } catch (e: any) {
      toast.error(e?.message ?? "Não foi possível remover.");
    } finally {
      setExcluir(null);
    }
  };

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
                <h1 className="truncate text-sm font-semibold text-foreground">Material de Apoio</h1>
                <p className="hidden truncate text-[10px] text-muted-foreground sm:block">Central de suporte e guias</p>
              </div>
            </Link>
            <div className="ml-auto">
              <HeaderActions />
            </div>
          </header>

          <main className="mx-auto w-full max-w-6xl flex-1 space-y-6 p-4 md:p-6">
            <Card className="overflow-hidden border-violet-200/70">
              <div className="bg-gradient-to-br from-violet-600 to-indigo-700 px-6 py-6 text-white">
                <h2 className="text-lg font-semibold">Central de Material de Apoio</h2>
                <p className="mt-1 text-xs text-white/80">
                  Pesquise no material de apoio do portal para encontrar guias e resoluções.
                </p>
                <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-violet-500" />
                    <Input
                      value={busca}
                      onChange={(e) => setBusca(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") perguntar();
                      }}
                      placeholder="Ex.: como fechar a competência? como importar pagamentos?"
                      className="h-11 border-0 bg-card pl-9 text-sm text-foreground placeholder:text-muted-foreground"
                      aria-label="Pesquisar no material de apoio"
                    />
                  </div>
                </div>

                {sugestoes.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    <span className="text-[11px] text-white/70">Sugestões:</span>
                    {sugestoes.map((s) => (
                      <button
                        key={s}
                        onClick={() => setBusca(s)}
                        className="rounded-full bg-white/15 px-3 py-1 text-[11px] text-white transition hover:bg-white/25"
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                )}
              </div>

            </Card>

            <section id="atalhos" className="rounded-xl border border-blue-100 bg-blue-50/30 p-5">
              <div className="flex items-center gap-2 mb-4">
                <Keyboard className="h-5 w-5 text-blue-600" />
                <h3 className="text-sm font-bold text-blue-900">Atalhos Globais (Ctrl + Tecla)</h3>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                {[
                  { key: 'H', label: 'Início / Home' },
                  { key: 'P', label: 'Pagamentos' },
                  { key: 'C', label: 'Conciliação' },
                  { key: 'M', label: 'Material Apoio' },
                  { key: 'A', label: 'Base Anexos' },
                  { key: 'F', label: 'Fechamento' },
                ].map(s => (
                  <div key={s.key} className="flex flex-col items-center justify-center p-3 bg-card rounded-lg border border-blue-100 shadow-sm text-center">
                    <kbd className="mb-1 rounded bg-muted px-2 py-0.5 font-mono text-xs font-bold border border-border">Ctrl + {s.key}</kbd>
                    <span className="text-[9px] text-muted-foreground uppercase font-bold tracking-tighter">{s.label}</span>
                  </div>
                ))}
              </div>
            </section>

            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  size="sm"
                  variant={categoria === null && !somenteFavoritos ? "default" : "outline"}
                  className={categoria === null && !somenteFavoritos ? "bg-violet-600 hover:bg-violet-700" : ""}
                  onClick={() => {
                    setCategoria(null);
                    setSomenteFavoritos(false);
                  }}
                >
                  Todos os Conteúdos
                </Button>
                <Button
                  size="sm"
                  variant={somenteFavoritos ? "default" : "outline"}
                  className={somenteFavoritos ? "bg-amber-500 hover:bg-amber-600 text-white" : ""}
                  onClick={() => {
                    setSomenteFavoritos(true);
                    setCategoria(null);
                  }}
                >
                  <Star className={`mr-2 h-4 w-4 ${somenteFavoritos ? "fill-white" : "text-amber-500"}`} />
                  Favoritos
                </Button>
                <div className="h-6 w-[1px] bg-muted mx-1 hidden sm:block" />
                <Button
                  size="sm"
                  variant={categoria === null && !somenteFavoritos ? "default" : "outline"}
                  onClick={() => {
                    setCategoria(null);
                    setSomenteFavoritos(false);
                  }}
                >
                  Todos os Conteúdos ({materiais.length})
                </Button>
                <Button
                  size="sm"
                  variant={somenteFavoritos ? "default" : "outline"}
                  className="gap-1.5"
                  onClick={() => {
                    setSomenteFavoritos(true);
                    setCategoria(null);
                  }}
                >
                  <Star
                    className={`h-3.5 w-3.5 ${somenteFavoritos ? "fill-current" : "text-amber-500"}`}
                  />
                  Favoritos ({favoritos.length})
                </Button>
                {categorias.map((c) => (
                  <Button
                    key={c}
                    size="sm"
                    variant={categoria === c && !somenteFavoritos ? "default" : "outline"}
                    onClick={() => {
                      setCategoria(c);
                      setSomenteFavoritos(false);
                    }}
                  >
                    {c}
                  </Button>
                ))}
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="gap-2"
                  onClick={() =>
                    filtrados.length
                      ? baixarPdf(filtrados, categoria ? `Material de apoio — ${categoria}` : "Material de apoio completo")
                      : toast.info("Nenhum material para exportar.")
                  }
                >
                  <Download className="h-4 w-4" /> Baixar PDF
                </Button>
                {isAdmin && (
                  <Button size="sm" className="gap-2" onClick={abrirCriacao}>
                    <Plus className="h-4 w-4" /> Novo material
                  </Button>
                )}
              </div>
            </div>

            {isLoading ? (
              <div className="flex items-center gap-2 p-8 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" /> Carregando materiais…
              </div>
            ) : filtrados.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center gap-2 py-12 text-center">
                  <LifeBuoy className="h-10 w-10 text-muted-foreground/50" />
                  <p className="text-sm font-medium">Nenhum material encontrado</p>
                  <p className="max-w-sm text-xs text-muted-foreground">
                    Ajuste a pesquisa ou pergunte à IA Assistente. Se a dúvida continuar, abra um
                    chamado em Configurações &gt; Canal de Suporte Técnico.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {filtrados.map((m) => {
                  const open = aberto === m.id;
                  return (
                    <Card key={m.id} className="flex flex-col border-border transition-shadow hover:shadow-md">
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-start gap-3">
                            <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300">
                              <FileText className="h-4 w-4" />
                            </div>
                            <div>
                              <CardTitle className="text-sm">{m.titulo}</CardTitle>
                              <div className="mt-1 flex flex-wrap items-center gap-1">
                                <Badge variant="secondary" className="text-[10px]">
                                  {m.categoria}
                                </Badge>
                                {favSet.has(m.id) && (
                                  <Badge className="gap-1 bg-amber-100 text-[10px] text-amber-700 hover:bg-amber-100 dark:bg-amber-900/40 dark:text-amber-300">
                                    <Star className="h-2.5 w-2.5 fill-current" /> Favorito
                                  </Badge>
                                )}
                                {!m.publicado && (
                                  <Badge variant="outline" className="text-[10px] text-amber-600">
                                    Rascunho
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="flex shrink-0 items-center gap-1">
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-7 w-7"
                              disabled={salvandoFav === m.id}
                              title={favSet.has(m.id) ? "Desfavoritar" : "Favoritar"}
                              aria-label={favSet.has(m.id) ? "Desfavoritar material" : "Favoritar material"}
                              onClick={() => alternarFavorito(m)}
                            >
                              {salvandoFav === m.id ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              ) : (
                                <Star
                                  className={`h-4 w-4 ${
                                    favSet.has(m.id)
                                      ? "fill-amber-400 text-amber-500"
                                      : "text-muted-foreground"
                                  }`}
                                />
                              )}
                            </Button>
                          {isAdmin && (
                            <div className="flex gap-1">
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-7 w-7"
                                aria-label="Editar material"
                                onClick={() => abrirEdicao(m)}
                              >
                                <Pencil className="h-3.5 w-3.5" />
                              </Button>
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-7 w-7 text-destructive"
                                aria-label="Excluir material"
                                onClick={() => setExcluir(m)}
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          )}
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="flex flex-1 flex-col justify-between gap-3">
                        {m.resumo && <p className="text-xs text-muted-foreground">{m.resumo}</p>}
                        {open && (
                          <ScrollArea className="max-h-72 rounded-md border bg-muted/30 p-3">
                            <Markdown text={m.conteudo} />
                          </ScrollArea>
                        )}
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant={open ? "outline" : "default"}
                            className="flex-1"
                            onClick={() => setAberto(open ? null : m.id)}
                          >
                            {open ? "Fechar" : "Ler material"}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="gap-1"
                            onClick={() => baixarPdf([m], m.titulo)}
                          >
                            <Download className="h-3.5 w-3.5" /> PDF
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}

            <p className="pb-6 text-center text-[11px] text-muted-foreground">
              Somente o administrador pode publicar ou alterar materiais. Todos os usuários podem
              consultar e baixar em PDF.
            </p>
          </main>
        </div>
      </div>

      <Dialog
        open={criando || !!editando}
        onOpenChange={(v) => {
          if (!v) {
            setCriando(false);
            setEditando(null);
          }
        }}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editando ? "Editar material" : "Novo material de apoio"}</DialogTitle>
            <DialogDescription>
              O conteúdo aceita markdown simples (#, ##, listas, **negrito** e tabelas).
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1">
                <Label className="text-xs">Título</Label>
                <Input
                  value={form.titulo}
                  onChange={(e) => setForm({ ...form, titulo: e.target.value })}
                  placeholder="Como registrar um pagamento diverso"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Categoria</Label>
                <Input
                  value={form.categoria}
                  onChange={(e) => setForm({ ...form, categoria: e.target.value })}
                  list="categorias-material"
                />
                <datalist id="categorias-material">
                  {[...new Set([...CATEGORIAS_SUGERIDAS, ...categorias])].map((c) => (
                    <option key={c} value={c} />
                  ))}
                </datalist>
              </div>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Resumo</Label>
              <Input
                value={form.resumo}
                onChange={(e) => setForm({ ...form, resumo: e.target.value })}
                placeholder="Uma linha explicando o material"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Conteúdo</Label>
              <Textarea
                value={form.conteudo}
                onChange={(e) => setForm({ ...form, conteudo: e.target.value })}
                rows={12}
                className="font-mono text-xs"
                placeholder={"# Título\n\n1. Primeiro passo\n- Observação **importante**"}
              />
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="space-y-1 sm:col-span-2">
                <Label className="text-xs">Palavras-chave (separadas por vírgula)</Label>
                <Input
                  value={form.palavras_chave}
                  onChange={(e) => setForm({ ...form, palavras_chave: e.target.value })}
                  placeholder="pagamento, importação, excel"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Ordem</Label>
                <Input
                  type="number"
                  value={form.ordem}
                  onChange={(e) => setForm({ ...form, ordem: Number(e.target.value) })}
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                checked={form.publicado}
                onCheckedChange={(v) => setForm({ ...form, publicado: v })}
                id="publicado"
              />
              <Label htmlFor="publicado" className="text-xs">
                Publicado (visível para todos os usuários)
              </Label>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setCriando(false);
                setEditando(null);
              }}
            >
              Cancelar
            </Button>
            <Button onClick={salvar} disabled={salvando}>
              {salvando && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!excluir} onOpenChange={(v) => !v && setExcluir(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover material?</AlertDialogTitle>
            <AlertDialogDescription>
              “{excluir?.titulo}” deixará de ficar disponível para os usuários do portal.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmarExclusao}>Remover</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </SidebarProvider>
  );
}
