import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { Code, Download, FileCode2, GitBranch, Loader2 } from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/hooks/use-session";
import { DOC_INTRO, DOC_SECOES } from "@/lib/documentacao-tecnica";

type Item = { categoria: string; descricao: string };
type Version = {
  versao: string;
  lancada_em: string;
  tipo: string;
  titulo: string;
  resumo: string | null;
  itens: Item[];
  autor: string | null;
};

const CODIGO_URL = "/codigo-fonte-portal-pagadoria.txt";
const ADMIN_DOWNLOAD_EMAIL = "lucas.chaves.lc2001@gmail.com";

export function DocumentacaoTecnicaSection() {
  const { user } = useSession();
  const podeBaixar =
    (user?.email ?? "").trim().toLowerCase() === ADMIN_DOWNLOAD_EMAIL;
  const { data: versoes = [], isLoading } = useQuery({
    queryKey: ["app-versions", "documentacao"],
    queryFn: async (): Promise<Version[]> => {
      const { data, error } = await (supabase as any)
        .from("app_versions")
        .select("*")
        .order("lancada_em", { ascending: false });
      if (error) throw error;
      return (data ?? []).map((v: any) => ({ ...v, itens: Array.isArray(v.itens) ? v.itens : [] }));
    },
  });

  const versaoAtual = useMemo(() => versoes[0]?.versao, [versoes]);

  const baixarPDF = () => {
    const doc = new jsPDF({ unit: "pt", format: "a4" });
    const pageWidth = doc.internal.pageSize.getWidth();
    const m = 40;

    doc.setFillColor(76, 29, 149);
    doc.rect(0, 0, pageWidth, 92, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(19);
    doc.text("Portal da Pagadoria", m, 40);
    doc.setFontSize(11);
    doc.text("Documentação Técnica e Engenharia de Prompt", m, 62);
    doc.setFontSize(9);
    doc.text(
      `Gerado em ${format(new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}${versaoAtual ? `  •  versão atual v${versaoAtual}` : ""}`,
      m,
      80,
    );

    let y = 120;
    doc.setTextColor(60, 60, 60);
    doc.setFontSize(10);
    const intro = doc.splitTextToSize(DOC_INTRO, pageWidth - m * 2);
    doc.text(intro, m, y);
    y += intro.length * 12 + 16;

    for (const secao of DOC_SECOES) {
      if (y > 700) {
        doc.addPage();
        y = 60;
      }
      doc.setFontSize(13);
      doc.setTextColor(76, 29, 149);
      doc.text(secao.titulo, m, y);
      y += 18;

      for (const bloco of secao.blocos) {
        if (y > 740) {
          doc.addPage();
          y = 60;
        }
        if (bloco.subtitulo) {
          doc.setFontSize(10.5);
          doc.setTextColor(30, 30, 30);
          doc.text(bloco.subtitulo, m, y);
          y += 14;
        }
        doc.setFontSize(9.5);
        doc.setTextColor(70, 70, 70);
        if (bloco.paragrafo) {
          const lines = doc.splitTextToSize(bloco.paragrafo, pageWidth - m * 2);
          doc.text(lines, m, y);
          y += lines.length * 11 + 4;
        }
        for (const item of bloco.itens ?? []) {
          const lines = doc.splitTextToSize(`•  ${item}`, pageWidth - m * 2 - 10);
          if (y + lines.length * 11 > 780) {
            doc.addPage();
            y = 60;
          }
          doc.text(lines, m + 10, y);
          y += lines.length * 11 + 2;
        }
        y += 6;
      }
      y += 6;
    }

    doc.addPage();
    doc.setFontSize(15);
    doc.setTextColor(76, 29, 149);
    doc.text("Histórico de Versões e Executados", m, 60);
    let yv = 80;
    for (const v of versoes) {
      if (yv > 700) {
        doc.addPage();
        yv = 60;
      }
      doc.setFontSize(12);
      doc.setTextColor(30, 30, 30);
      doc.text(`v${v.versao} — ${v.titulo}`, m, yv);
      doc.setFontSize(8.5);
      doc.setTextColor(120, 120, 120);
      doc.text(
        `${String(v.tipo).toUpperCase()}  •  ${format(new Date(v.lancada_em), "dd/MM/yyyy", { locale: ptBR })}${v.autor ? `  •  ${v.autor}` : ""}`,
        m,
        yv + 13,
      );
      yv += 28;
      if (v.resumo) {
        doc.setFontSize(9.5);
        doc.setTextColor(70, 70, 70);
        const lines = doc.splitTextToSize(v.resumo, pageWidth - m * 2);
        doc.text(lines, m, yv);
        yv += lines.length * 11 + 6;
      }
      if (v.itens.length) {
        autoTable(doc, {
          startY: yv,
          margin: { left: m, right: m },
          head: [["Categoria", "Executado"]],
          body: v.itens.map((i) => [i.categoria, i.descricao]),
          styles: { fontSize: 8.5, cellPadding: 4 },
          headStyles: { fillColor: [124, 58, 237], textColor: 255 },
          columnStyles: { 0: { cellWidth: 90 }, 1: { cellWidth: "auto" } },
        });
        // @ts-expect-error autotable extends doc
        yv = doc.lastAutoTable.finalY + 16;
      }
    }

    doc.save(`documentacao-tecnica-portal-pagadoria-${format(new Date(), "yyyy-MM-dd")}.pdf`);
  };

  const baixarVersoesPDF = () => {
    const doc = new jsPDF({ unit: "pt", format: "a4" });
    const pageWidth = doc.internal.pageSize.getWidth();
    const m = 40;

    doc.setFillColor(124, 58, 237);
    doc.rect(0, 0, pageWidth, 92, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(19);
    doc.text("Portal da Pagadoria", m, 40);
    doc.setFontSize(11);
    doc.text("Histórico de Versões Completo", m, 62);
    doc.setFontSize(9);
    doc.text(
      `Gerado em ${format(new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}`,
      m,
      80,
    );

    let yv = 120;
    for (const v of versoes) {
      if (yv > 700) {
        doc.addPage();
        yv = 60;
      }
      doc.setFontSize(12);
      doc.setTextColor(30, 30, 30);
      doc.text(`v${v.versao} — ${v.titulo}`, m, yv);
      doc.setFontSize(8.5);
      doc.setTextColor(120, 120, 120);
      doc.text(
        `${String(v.tipo).toUpperCase()}  •  ${format(new Date(v.lancada_em), "dd/MM/yyyy", { locale: ptBR })}${v.autor ? `  •  ${v.autor}` : ""}`,
        m,
        yv + 13,
      );
      yv += 28;
      if (v.resumo) {
        doc.setFontSize(9.5);
        doc.setTextColor(70, 70, 70);
        const lines = doc.splitTextToSize(v.resumo, pageWidth - m * 2);
        doc.text(lines, m, yv);
        yv += lines.length * 11 + 6;
      }
      if (v.itens.length) {
        autoTable(doc, {
          startY: yv,
          margin: { left: m, right: m },
          head: [["Categoria", "Executado"]],
          body: v.itens.map((i) => [i.categoria, i.descricao]),
          styles: { fontSize: 8.5, cellPadding: 4 },
          headStyles: { fillColor: [124, 58, 237], textColor: 255 },
          columnStyles: { 0: { cellWidth: 90 }, 1: { cellWidth: "auto" } },
        });
        // @ts-expect-error autotable extends doc
        yv = doc.lastAutoTable.finalY + 20;
      }
    }

    doc.save(`historico-versoes-portal-pagadoria-${format(new Date(), "yyyy-MM-dd")}.pdf`);
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <Card className="border-border">
        <CardHeader className="gap-3 md:flex-row md:items-start md:justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-xl">
              <Code className="h-5 w-5 text-indigo-600" />
              Documentação Técnica e Engenharia de Prompt
              {versaoAtual && <Badge variant="secondary">v{versaoAtual}</Badge>}
            </CardTitle>
            <CardDescription>
              Centraliza todas as especificações de arquitetura, fluxos e regras de negócio do portal.
            </CardDescription>
          </div>
          {podeBaixar && (
            <div className="flex flex-wrap gap-2">
              <Button size="sm" onClick={baixarPDF} className="gap-2">
                <Download className="h-4 w-4" /> PDF: Doc. Técnica e Engenharia
              </Button>
              <Button size="sm" onClick={baixarVersoesPDF} className="gap-2" variant="secondary">
                <Download className="h-4 w-4" /> PDF: Histórico de Versões
              </Button>
              <Button size="sm" variant="outline" asChild className="gap-2">
                <a href={CODIGO_URL} download="codigo-fonte-portal-pagadoria.txt">
                  <FileCode2 className="h-4 w-4" /> Código-fonte Completo
                </a>
              </Button>
            </div>
          )}
        </CardHeader>
        <CardContent className="space-y-8 text-sm text-foreground/90">
          <div className="rounded-lg bg-indigo-50/30 p-4 dark:bg-indigo-950/20">
            <p className="italic leading-relaxed">{DOC_INTRO}</p>
          </div>

          {DOC_SECOES.map((secao) => (
            <section key={secao.id} className="space-y-4">
              <h3 className="border-b border-border pb-2 text-lg font-bold text-indigo-600 dark:text-indigo-400">
                {secao.titulo}
              </h3>
              <div className="ml-2 space-y-4">
                {secao.blocos.map((bloco, i) => (
                  <div key={i}>
                    {bloco.subtitulo && (
                      <h4 className="mb-2 font-semibold text-foreground">{bloco.subtitulo}</h4>
                    )}
                    {bloco.paragrafo && <p className="text-muted-foreground">{bloco.paragrafo}</p>}
                    {bloco.itens && (
                      <ul className="list-disc space-y-1 pl-5 text-muted-foreground">
                        {bloco.itens.map((item) => (
                          <li key={item}>{item}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                ))}
              </div>
            </section>
          ))}
        </CardContent>
      </Card>

      <Card className="border-border">
        <CardHeader className="gap-3 md:flex-row md:items-start md:justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-base">
              <GitBranch className="h-4 w-4 text-violet-600" /> Versões anteriores e executados
            </CardTitle>
            <CardDescription>
              Todas as versões publicadas do portal com a descrição do que foi executado em cada uma.
            </CardDescription>
          </div>
          <Button variant="outline" size="sm" asChild className="shrink-0">
            <Link to="/historico">Ver histórico completo</Link>
          </Button>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center gap-2 py-6 text-xs text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> Carregando versões…
            </div>
          ) : versoes.length === 0 ? (
            <p className="py-4 text-xs text-muted-foreground">Nenhuma versão registrada.</p>
          ) : (
            <ScrollArea className="h-[420px] pr-3">
              <div className="space-y-5">
                {versoes.map((v) => (
                  <div key={v.versao} className="rounded-lg bg-muted/30 p-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="outline" className="font-mono text-[10px]">
                        v{v.versao}
                      </Badge>
                      <span className="text-sm font-semibold text-foreground">{v.titulo}</span>
                      <span className="ml-auto text-[10px] text-muted-foreground">
                        {format(new Date(v.lancada_em), "dd/MM/yyyy", { locale: ptBR })}
                      </span>
                    </div>
                    {v.resumo && (
                      <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{v.resumo}</p>
                    )}
                    {v.itens.length > 0 && (
                      <ul className="mt-2 list-disc space-y-1 pl-5 text-xs text-muted-foreground">
                        {v.itens.map((i, idx) => (
                          <li key={idx}>
                            <span className="font-medium text-foreground/80">{i.categoria}:</span>{" "}
                            {i.descricao}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
