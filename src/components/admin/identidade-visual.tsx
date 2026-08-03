import { useRef, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Image as ImageIcon, Upload, RotateCcw, Loader2, Info, MapPin } from "lucide-react";
import { toast } from "sonner";
import { useLogos, LOGO_AREAS, type LogoArea } from "@/hooks/use-logos";
import { useRoles } from "@/hooks/use-roles";

const MAX_BYTES = 400 * 1024;

function fileToDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("Falha ao ler o arquivo"));
    reader.readAsDataURL(file);
  });
}

export function IdentidadeVisualPanel() {
  const { isAdmin, loading: rolesLoading } = useRoles();
  const { logos, resolve, salvar, padrao, loading } = useLogos();
  const [saving, setSaving] = useState<LogoArea | null>(null);
  const inputs = useRef<Record<string, HTMLInputElement | null>>({});

  const handleFile = async (area: LogoArea, file: File | undefined) => {
    if (!file) return;
    if (file.type !== "image/png") {
      toast.error("Envie um arquivo no formato PNG.");
      return;
    }
    if (file.size > MAX_BYTES) {
      toast.error("O PNG deve ter no máximo 400 KB.");
      return;
    }
    setSaving(area);
    try {
      const dataUrl = await fileToDataUrl(file);
      await salvar({ ...logos, [area]: dataUrl });
      toast.success("PNG atualizado com sucesso.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Não foi possível salvar o PNG.");
    } finally {
      setSaving(null);
    }
  };

  const restaurar = async (area: LogoArea) => {
    setSaving(area);
    try {
      const next = { ...logos };
      delete next[area];
      await salvar(next);
      toast.success("PNG restaurado para o padrão do portal.");
    } catch {
      toast.error("Não foi possível restaurar o PNG.");
    } finally {
      setSaving(null);
    }
  };

  if (rolesLoading || loading) {
    return (
      <Card className="border-border/60 bg-card/60 backdrop-blur-md">
        <CardContent className="flex items-center gap-2 py-10 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Carregando identidade visual...
        </CardContent>
      </Card>
    );
  }

  if (!isAdmin) {
    return (
      <Card className="border-border/60 bg-card/60 backdrop-blur-md">
        <CardContent className="py-10 text-center text-sm text-muted-foreground">
          A alteração dos PNGs do portal é restrita ao Administrador da Pagadoria.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="border-border/60 bg-card/60 backdrop-blur-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <ImageIcon className="h-4 w-4 text-primary" /> Identidade Visual — PNGs do Portal
          </CardTitle>
          <CardDescription>
            Abaixo estão todas as áreas do portal que exibem um PNG. Cada área pode ter
            sua própria imagem ou herdar o PNG global. Formato aceito: PNG (máx. 400 KB).
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-start gap-2 rounded-lg border border-border/60 bg-muted/40 p-3 text-xs text-muted-foreground">
            <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
            <span>
              Ao alterar o <strong>PNG Global</strong>, todas as áreas sem imagem própria são
              atualizadas automaticamente. Use “Restaurar padrão” para voltar à marca original
              (Grupo Profarma 65 anos).
            </span>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        {LOGO_AREAS.map((info) => {
          const personalizado = Boolean(logos[info.area]);
          const busy = saving === info.area;
          return (
            <Card key={info.area} className="border-border/60 bg-card/60 backdrop-blur-md">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="text-sm">{info.titulo}</CardTitle>
                  <Badge variant={personalizado ? "default" : "secondary"} className="text-[10px]">
                    {personalizado ? "Personalizado" : "Padrão"}
                  </Badge>
                </div>
                <CardDescription className="text-xs">{info.descricao}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex h-24 items-center justify-center rounded-lg border border-dashed border-border/70 bg-muted/30 p-3">
                  <img
                    src={resolve(info.area)}
                    alt={`PNG atual — ${info.titulo}`}
                    className="max-h-full max-w-full object-contain"
                  />
                </div>

                <div className="space-y-1.5">
                  <p className="flex items-center gap-1.5 text-[11px] font-semibold text-foreground">
                    <MapPin className="h-3 w-3 text-primary" /> Onde aparece
                  </p>
                  <ul className="space-y-0.5 pl-4 text-[11px] text-muted-foreground">
                    {info.ondeAparece.map((local) => (
                      <li key={local} className="list-disc">{local}</li>
                    ))}
                  </ul>
                  <p className="text-[10px] italic text-muted-foreground">{info.recomendacao}</p>
                </div>

                <input
                  ref={(el) => { inputs.current[info.area] = el; }}
                  type="file"
                  accept="image/png"
                  className="hidden"
                  onChange={(e) => {
                    handleFile(info.area, e.target.files?.[0]);
                    e.target.value = "";
                  }}
                />

                <div className="flex gap-2">
                  <Button
                    size="sm"
                    className="flex-1 transition-all duration-300"
                    disabled={busy}
                    onClick={() => inputs.current[info.area]?.click()}
                  >
                    {busy ? <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" /> : <Upload className="mr-2 h-3.5 w-3.5" />}
                    Alterar PNG
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={busy || !personalizado}
                    onClick={() => restaurar(info.area)}
                  >
                    <RotateCcw className="mr-2 h-3.5 w-3.5" /> Restaurar padrão
                  </Button>
                </div>
                {!personalizado && info.area !== "global" && (
                  <p className="text-[10px] text-muted-foreground">
                    Atualmente herdando o PNG {logos.global ? "global personalizado" : "original do portal"}.
                  </p>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      <p className="text-center text-[11px] text-muted-foreground">
        PNG original do portal: <span className="font-mono">{padrao.split("/").pop()}</span>
      </p>
    </div>
  );
}
