import { useMemo, useState, type ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/hooks/use-session";
import { useRoles } from "@/hooks/use-roles";
import {
  BookOpen,
  Bug,
  AlertCircle,
  Send,
  History,
  MessageCircle,
  LifeBuoy,
  Loader2,
  Paperclip,
  RefreshCw,
} from "lucide-react";

const glass =
  "border border-white/20 bg-white/10 dark:bg-black/20 backdrop-blur-md shadow-xl rounded-2xl";

type Chamado = {
  id: string;
  assunto: string;
  comentario: string | null;
  anexo_url: string | null;
  user_nome: string | null;
  user_email: string | null;
  user_id: string | null;
  created_at: string | null;
};

const assuntoMeta: Record<string, { Icon: typeof Bug; tone: string }> = {
  "Bug e Correção": { Icon: Bug, tone: "text-amber-600" },
  Erro: { Icon: AlertCircle, tone: "text-rose-600" },
  Melhoria: { Icon: Send, tone: "text-indigo-600" },
};

function formatarData(iso: string | null) {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "medium" });
}

const faqs = [
  {
    q: "Como importar uma base em Excel ou CSV?",
    a: "Acesse o módulo desejado, clique em Importar e selecione o arquivo. O sistema identifica a planilha pelos títulos das colunas — o nome da aba não precisa ser exato.",
  },
  {
    q: "Por que não consigo editar em Pagamentos Diversos?",
    a: "O módulo usa Fila Virtual: apenas o primeiro da fila tem permissão de edição. Você é notificado automaticamente quando chegar a sua vez.",
  },
  {
    q: "Excluí um registro por engano. É possível recuperar?",
    a: "Sim. Todas as exclusões são lógicas e ficam disponíveis em Auditoria > Registros Excluídos. A restauração é exclusiva do Administrador e exige justificativa.",
  },
  {
    q: "Como funciona o Fechamento de Competência?",
    a: "O fechamento gera um snapshot imutável do período e libera a base para o próximo ciclo. Administradores podem reabrir a competência com registro em auditoria.",
  },
  {
    q: "Quem pode ver os relatórios de Saúde do Portal?",
    a: "Somente perfis Administrador. Demais perfis visualizam apenas as configurações pessoais e o canal de Suporte Técnico.",
  },
];

export function SuporteTecnicoPanel({ children }: { children?: ReactNode }) {
  const { user } = useSession();
  const { isAdmin } = useRoles();
  const [tab, setTab] = useState("abrir");

  const historico = useQuery({
    queryKey: ["suporte-chamados", user?.id, isAdmin],
    enabled: !!user,
    queryFn: async (): Promise<Chamado[]> => {
      let q = supabase
        .from("suporte_tecnico")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(200);
      if (!isAdmin) q = q.eq("user_id", user!.id);
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as Chamado[];
    },
  });

  const chamados = useMemo(() => historico.data ?? [], [historico.data]);

  return (
    <div className="space-y-6">
      <Card className={glass}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <LifeBuoy className="h-5 w-5 text-indigo-600" />
            Suporte Técnico
          </CardTitle>
          <CardDescription>
            Canal dedicado aos colaboradores: abra chamados, acompanhe o histórico e consulte a
            documentação do portal.
            {isAdmin ? " Como Administrador, você visualiza os chamados de todos os usuários." : ""}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={tab} onValueChange={setTab}>
            <TabsList className="grid w-full grid-cols-2 gap-1 bg-white/10 backdrop-blur-md sm:grid-cols-4">
              <TabsTrigger value="abrir" className="text-xs sm:text-sm">
                <Send className="mr-1.5 h-4 w-4" /> Abrir chamado
              </TabsTrigger>
              <TabsTrigger value="historico" className="text-xs sm:text-sm">
                <History className="mr-1.5 h-4 w-4" /> Histórico
              </TabsTrigger>
              <TabsTrigger value="chat" className="text-xs sm:text-sm">
                <MessageCircle className="mr-1.5 h-4 w-4" /> Chat
              </TabsTrigger>
              <TabsTrigger value="faq" className="text-xs sm:text-sm">
                <BookOpen className="mr-1.5 h-4 w-4" /> FAQs
              </TabsTrigger>
            </TabsList>

            <TabsContent value="abrir" className="mt-6">
              {children}
            </TabsContent>

            <TabsContent value="historico" className="mt-6 space-y-3">
              <div className="flex items-center justify-between gap-3">
                <p className="text-xs text-muted-foreground">
                  {chamados.length} chamado(s) {isAdmin ? "no portal" : "abertos por você"}
                </p>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => historico.refetch()}
                  disabled={historico.isFetching}
                >
                  <RefreshCw
                    className={historico.isFetching ? "mr-2 h-4 w-4 animate-spin" : "mr-2 h-4 w-4"}
                  />
                  Atualizar
                </Button>
              </div>

              {historico.isLoading ? (
                <div className="flex h-32 items-center justify-center text-muted-foreground">
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Carregando chamados...
                </div>
              ) : chamados.length === 0 ? (
                <div className="flex h-32 items-center justify-center rounded-xl border border-dashed border-border text-sm italic text-muted-foreground">
                  Nenhum chamado registrado até o momento.
                </div>
              ) : (
                <div className="grid gap-3">
                  {chamados.map((c) => {
                    const meta = assuntoMeta[c.assunto] ?? { Icon: AlertCircle, tone: "text-muted-foreground" };
                    const Icon = meta.Icon;
                    return (
                      <div
                        key={c.id}
                        className="rounded-xl border border-white/20 bg-white/10 p-4 backdrop-blur-md transition-colors hover:bg-white/20 dark:bg-black/20 dark:hover:bg-black/30"
                      >
                        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3 sm:flex sm:justify-between">
                          <div className="flex min-w-0 items-start gap-3">
                            <Icon className={`mt-0.5 h-5 w-5 shrink-0 ${meta.tone}`} />
                            <div className="min-w-0">
                              <p className="truncate text-sm font-semibold text-foreground">
                                {c.assunto}
                              </p>
                              <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">
                                {c.comentario || "Sem comentário adicional."}
                              </p>
                              {isAdmin && (
                                <p className="mt-1 truncate text-[10px] uppercase tracking-wide text-muted-foreground">
                                  {c.user_nome || c.user_email || "Usuário"}
                                </p>
                              )}
                            </div>
                          </div>
                          <div className="flex shrink-0 flex-col items-end gap-1.5">
                            <Badge variant="secondary" className="text-[10px]">
                              {formatarData(c.created_at)}
                            </Badge>
                            {c.anexo_url && (
                              <a
                                href={c.anexo_url}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1 text-[11px] text-indigo-600 hover:underline dark:text-indigo-400"
                              >
                                <Paperclip className="h-3 w-3" /> Anexo
                              </a>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </TabsContent>

            <TabsContent value="chat" className="mt-6">
              <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-white/20 bg-white/10 p-10 text-center backdrop-blur-md dark:bg-black/20">
                <MessageCircle className="h-6 w-6 text-indigo-600" />
                <p className="text-sm font-medium text-foreground">
                  Chat direto com o suporte — indisponível no momento
                </p>
                <p className="max-w-md text-xs text-muted-foreground">
                  O atendimento em tempo real será liberado em breve. Enquanto isso, abra um chamado
                  técnico: a equipe responde por e-mail e o retorno fica registrado no histórico.
                </p>
                <Button variant="outline" size="sm" onClick={() => setTab("abrir")}>
                  <Send className="mr-2 h-4 w-4" /> Abrir chamado
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="faq" className="mt-6">
              <Accordion type="single" collapsible className="w-full">
                {faqs.map((f, i) => (
                  <AccordionItem key={i} value={`faq-${i}`}>
                    <AccordionTrigger className="text-left text-sm">{f.q}</AccordionTrigger>
                    <AccordionContent className="text-sm text-muted-foreground">
                      {f.a}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
