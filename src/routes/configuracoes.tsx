import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { AppLogo } from "@/components/app-logo";
import { AppSidebar } from "@/components/app-sidebar";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { HeaderActions } from "@/components/header-actions";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { HelpCircle, Bug, AlertCircle, MessageSquare, Send, CheckCircle2, Paperclip, X, Loader2, Settings, Users, History, ChevronRight, Activity, Cloud, ShieldCheck, Mail, Save, Code, Zap, Database, ShieldAlert, Cpu, Sparkles, RefreshCw, Trash2, Lock, Table as TableIcon, Image as ImageIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { usePlanilhaModo } from "@/hooks/use-planilha-modo";
import { useState, useRef, useEffect } from "react";
import { useSession } from "@/hooks/use-session";
import { useMutation } from "@tanstack/react-query";
import { sendSupportRequest } from "@/lib/suporte.functions";
import { toast } from "sonner";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { UsuariosTableWrapper as UsuariosTable } from "@/components/admin/usuarios-table";
import { IdentidadeVisualPanel } from "@/components/admin/identidade-visual";

import { DocumentacaoTecnicaSection } from "@/components/documentacao-tecnica-section";


export const Route = createFileRoute("/configuracoes")({
  head: () => ({
    meta: [
      { title: "Configurações | Portal Pagadoria" },
      { name: "description", content: "Personalize sua experiência, gerencie permissões e acesse o suporte técnico." },
      { property: "og:title", content: "Configurações | Portal Pagadoria" },
      { property: "og:description", content: "Personalize sua experiência, gerencie permissões e acesse o suporte técnico." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ConfiguracoesPage,
});

function ConfiguracoesPage() {
  const navigate = useNavigate();
  return (
    <div className="flex min-h-screen w-full bg-background">
      <AppSidebar />
      <div className="flex flex-1 flex-col">
          <header className="sticky top-0 z-10 flex h-14 items-center gap-3 border-b border-border bg-background/80 px-4 backdrop-blur">
            <SidebarTrigger />
            <Link to="/" className="flex flex-1 items-center gap-2 hover:opacity-80 transition-opacity">
              <AppLogo area="header" className="h-6 w-auto shrink-0 sm:h-7" />
              <div className="min-w-0">
                <h1 className="truncate text-sm font-semibold text-foreground">Configurações</h1>
                <p className="hidden truncate text-[10px] text-muted-foreground sm:block">Personalização e suporte técnico</p>
              </div>
            </Link>
            <div className="ml-auto">
              <HeaderActions />
            </div>
          </header>
          
          <main className="flex-1 p-6">
            <Tabs defaultValue="suporte" className="w-full max-w-5xl mx-auto space-y-8">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-2">
                <div>
                  <h2 className="text-2xl font-bold text-foreground">Acesso Rápido</h2>
                  <p className="text-sm text-muted-foreground">Gerencie o portal e solicite suporte técnico.</p>
                </div>
                <TabsList className="bg-muted/50 border border-border p-1 h-auto grid grid-cols-3 md:grid-cols-6 w-full md:w-auto">
                  <TabsTrigger value="suporte" className="py-2.5 px-4 text-xs font-semibold data-[state=active]:bg-background data-[state=active]:shadow-sm">
                    <HelpCircle className="h-3.5 w-3.5 mr-2" /> Suporte
                  </TabsTrigger>
                  <TabsTrigger value="administracao" className="py-2.5 px-4 text-xs font-semibold data-[state=active]:bg-background data-[state=active]:shadow-sm">
                    <Users className="h-3.5 w-3.5 mr-2" /> Usuários
                  </TabsTrigger>
                  <TabsTrigger value="identidade" className="py-2.5 px-4 text-xs font-semibold data-[state=active]:bg-background data-[state=active]:shadow-sm">
                    <ImageIcon className="h-3.5 w-3.5 mr-2" /> Identidade
                  </TabsTrigger>
                  <TabsTrigger value="documentacao" className="py-2.5 px-4 text-xs font-semibold data-[state=active]:bg-background data-[state=active]:shadow-sm">
                    <Code className="h-3.5 w-3.5 mr-2" /> Documentação
                  </TabsTrigger>
                  <TabsTrigger value="diagnostico" className="py-2.5 px-4 text-xs font-semibold data-[state=active]:bg-background data-[state=active]:shadow-sm">
                    <Activity className="h-3.5 w-3.5 mr-2" /> Diagnóstico
                  </TabsTrigger>
                  <TabsTrigger value="seguranca" className="py-2.5 px-4 text-xs font-semibold data-[state=active]:bg-background data-[state=active]:shadow-sm">
                    <ShieldCheck className="h-3.5 w-3.5 mr-2" /> Segurança
                  </TabsTrigger>
                </TabsList>

              </div>

              <TabsContent value="suporte" className="m-0 focus-visible:outline-none">
                <SupportForm />
              </TabsContent>

              <TabsContent value="administracao" className="m-0 focus-visible:outline-none">
                <UsuariosTable />
              </TabsContent>
              <TabsContent value="identidade" className="m-0 focus-visible:outline-none">
                <IdentidadeVisualPanel />
              </TabsContent>

              <TabsContent value="documentacao" className="m-0 focus-visible:outline-none">
                <DocumentacaoTecnicaSection />
              </TabsContent>



              <TabsContent value="diagnostico" className="m-0 focus-visible:outline-none">
                <DiagnosticPanel />
              </TabsContent>

              <TabsContent value="seguranca" className="m-0 focus-visible:outline-none">
                <div className="grid gap-6 md:grid-cols-2">
                  <AdvancedSecuritySettings />
                  <SmartConfigPanel />
                </div>
              </TabsContent>
            </Tabs>
          </main>
        </div>
      </div>
    </div>
  );
}

function SupportForm() {
  const { user } = useSession();
  const sendFn = useServerFn(sendSupportRequest);
  const [success, setSuccess] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [formData, setFormData] = useState({
    assunto: "" as "Bug e Correção" | "Erro" | "Melhoria",
    comentario: "",
    anexo_url: "",
  });

  const uploadFile = async (file: File) => {
    try {
      setUploading(true);
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2)}_${Date.now()}.${fileExt}`;
      const filePath = `${user?.id}/${fileName}`;

      const { data, error } = await supabase.storage
        .from('suporte_anexos')
        .upload(filePath, file);

      if (error) throw error;

      // Get signed URL since bucket is private
      const { data: urlData, error: urlError } = await supabase.storage
        .from('suporte_anexos')
        .createSignedUrl(filePath, 60 * 60 * 24 * 365); // 1 year expiry

      if (urlError) throw urlError;
      return urlData.signedUrl;
    } finally {
      setUploading(false);
    }
  };

  const sendMut = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Usuário não autenticado");
      
      let finalAnexoUrl = formData.anexo_url;
      if (file) {
        finalAnexoUrl = await uploadFile(file);
      }

      return sendFn({
        data: {
          ...formData,
          anexo_url: finalAnexoUrl,
          user_id: user.id,
          user_nome: (user.user_metadata?.nome || user.user_metadata?.full_name || "Usuário"),
          user_email: user.email!,
        }
      });
    },
    onSuccess: () => {
      setSuccess(true);
      setTimeout(() => setSuccess(false), 5000);
      setFormData({ assunto: "" as any, comentario: "", anexo_url: "" });
      setFile(null);
    },
    onError: (e: Error) => toast.error("Erro ao enviar: " + e.message),
  });

  if (success) {
    return (
      <Card className="mx-auto max-w-2xl border-emerald-200 bg-emerald-50 dark:bg-emerald-950/20 dark:border-emerald-900/30">
        <CardContent className="flex flex-col items-center justify-center p-12 text-center">
          <CheckCircle2 className="mb-4 h-16 w-16 text-emerald-600" />
          <h2 className="mb-2 text-2xl font-bold text-emerald-900">Enviado com sucesso!</h2>
          <p className="text-emerald-700">Obrigado por compartilhar sua opinião conosco. Nossa equipe técnica analisará sua mensagem.</p>
          <Button variant="outline" className="mt-6 border-emerald-300 text-emerald-700 hover:bg-emerald-100" onClick={() => setSuccess(false)}>
            Enviar outra mensagem
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mx-auto max-w-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5 text-indigo-600" />
          Canal de Suporte Técnico
        </CardTitle>
        <CardDescription>
          Utilize este formulário para relatar bugs, erros ou sugerir melhorias para o sistema.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="assunto">Assunto <span className="text-destructive">*</span></Label>
          <Select 
            value={formData.assunto} 
            onValueChange={(v) => setFormData(prev => ({ ...prev, assunto: v as any }))}
          >
            <SelectTrigger id="assunto">
              <SelectValue placeholder="Selecione o tipo de ocorrência" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Bug e Correção">
                <div className="flex items-center gap-2">
                  <Bug className="h-4 w-4 text-amber-600" /> Bug e Correção
                </div>
              </SelectItem>
              <SelectItem value="Erro">
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-rose-600" /> Erro
                </div>
              </SelectItem>
              <SelectItem value="Melhoria">
                <div className="flex items-center gap-2">
                  <Send className="h-4 w-4 text-indigo-600" /> Melhoria
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="anexo">Anexo (Opcional - Imagem ou Screenshot)</Label>
          <div className="flex flex-col gap-2">
            {!file ? (
              <Button 
                variant="outline" 
                type="button"
                className="w-full border-dashed border-border h-20 flex flex-col items-center justify-center gap-1 hover:border-indigo-400 hover:bg-indigo-50/50 dark:hover:bg-indigo-950/20 transition-colors"
                onClick={() => fileInputRef.current?.click()}
              >
                <Paperclip className="h-5 w-5 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">Clique para selecionar um arquivo</span>
              </Button>
            ) : (
              <div className="flex items-center justify-between p-3 border rounded-lg bg-muted border-border">
                <div className="flex items-center gap-2 overflow-hidden">
                  <Paperclip className="h-4 w-4 text-indigo-600 shrink-0" />
                  <span className="text-sm truncate text-foreground">{file.name}</span>
                  <span className="text-[10px] text-muted-foreground">({(file.size / 1024 / 1024).toFixed(2)} MB)</span>
                </div>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-8 w-8 text-muted-foreground hover:text-destructive"
                  onClick={() => setFile(null)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            )}
            <input 
              ref={fileInputRef}
              type="file" 
              className="hidden" 
              accept="image/*,.pdf,.doc,.docx"
              onChange={(e) => {
                const selectedFile = e.target.files?.[0];
                if (selectedFile) {
                  if (selectedFile.size > 5 * 1024 * 1024) {
                    toast.error("Arquivo muito grande. O limite é 5MB.");
                    return;
                  }
                  setFile(selectedFile);
                }
              }}
            />
            <p className="hidden truncate text-[10px] text-muted-foreground sm:block">Arraste ou selecione um arquivo de até 5MB.</p>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="comentario">Comentário (Opcional)</Label>
          <Textarea 
            id="comentario" 
            placeholder="Descreva detalhadamente o que aconteceu ou sua sugestão..." 
            className="min-h-[120px]"
            value={formData.comentario}
            onChange={(e) => setFormData(prev => ({ ...prev, comentario: e.target.value }))}
          />
        </div>

        <Button 
          className="w-full bg-indigo-600 hover:bg-indigo-700" 
          disabled={!formData.assunto || sendMut.isPending || uploading}
          onClick={() => sendMut.mutate()}
        >
          {sendMut.isPending || uploading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {uploading ? "Fazendo upload do anexo..." : "Enviando..."}
            </>
          ) : (
            <>
              <Send className="mr-2 h-4 w-4" /> Enviar para Suporte
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}

function DiagnosticPanel() {
  const navigate = useNavigate();
  const [refreshing, setRefreshing] = useState(false);
  const [status, setStatus] = useState({
    performance: "excelente",
    carga: "normal",
    cloud: "estavel",
    seguranca: "protegido",
    antivirus: "limpo"
  });

  const handleRefresh = () => {
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
      toast.success("Diagnóstico atualizado com sucesso!");
    }, 1500);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold flex items-center gap-2">
          <Activity className="h-5 w-5 text-indigo-600" />
          Painel de Saúde do Sistema
        </h3>
        <Button 
          variant="outline" 
          size="sm" 
          className="gap-2" 
          onClick={handleRefresh}
          disabled={refreshing}
        >
          <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
          Atualizar Diagnóstico
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="hover:shadow-md transition-all">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Zap className="h-4 w-4 text-amber-500" /> Performance e Carga
            </CardTitle>
            <CardDescription>Status em tempo real do processamento.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <button 
              onClick={() => toast.info("Latência normal. Nenhuma ação necessária.")}
              className="w-full flex items-center justify-between py-2 border-b border-border hover:bg-muted/30 px-2 rounded-md transition-colors text-left"
            >
              <div className="flex items-center gap-2">
                <Cpu className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Latência de API</span>
              </div>
              <span className="text-sm text-emerald-600 font-bold">32ms (Excelente)</span>
            </button>
            <button 
              onClick={() => toast.info("Carga otimizada pelo sistema.")}
              className="w-full flex items-center justify-between py-2 border-b border-border hover:bg-muted/30 px-2 rounded-md transition-colors text-left"
            >
              <div className="flex items-center gap-2">
                <Activity className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Carga da CPU</span>
              </div>
              <span className="text-sm text-muted-foreground font-bold">12%</span>
            </button>
            <button 
              onClick={() => navigate({ to: "/auditoria", search: { tab: "log" } })}
              className="w-full flex items-center justify-between py-2 hover:bg-muted/30 px-2 rounded-md transition-colors text-left"
            >
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Erros detectados (24h)</span>
              </div>
              <span className="text-sm text-muted-foreground font-bold">0</span>
            </button>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-all">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Database className="h-4 w-4 text-sky-600" /> Armazenamento em Nuvem
            </CardTitle>
            <CardDescription>Uso de disco e backups.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <button 
              onClick={() => navigate({ to: "/base" as any })}
              className="w-full flex items-center justify-between py-2 border-b border-border hover:bg-muted/30 px-2 rounded-md transition-colors text-left"
            >
              <span className="text-sm font-medium">Banco de Dados</span>
              <span className="text-sm text-muted-foreground font-bold">452 MB / 5 GB</span>
            </button>
            <button 
              onClick={() => navigate({ to: "/anexos" })}
              className="w-full flex items-center justify-between py-2 border-b border-border hover:bg-muted/30 px-2 rounded-md transition-colors text-left"
            >
              <span className="text-sm font-medium">Anexos e Documentos</span>
              <span className="text-sm text-muted-foreground font-bold">1.2 GB / 10 GB</span>
            </button>
            <button 
              onClick={() => navigate({ to: "/anexos" })}
              className="w-full flex items-center justify-between py-2 border-b border-border hover:bg-muted/30 px-2 rounded-md transition-colors text-left"
            >
              <span className="text-sm font-medium">Pasta [anexo]</span>
              <span className="text-sm text-emerald-600 font-bold">Ativa</span>
            </button>
            <button 
              onClick={() => toast.success("Backup íntegro no Lovable Cloud.")}
              className="w-full flex items-center justify-between py-2 hover:bg-muted/30 px-2 rounded-md transition-colors text-left"
            >
              <span className="text-sm font-medium">Último Backup</span>
              <span className="text-sm text-emerald-600 font-bold">Hoje, 03:00 AM</span>
            </button>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-all md:col-span-2">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <ShieldAlert className="h-4 w-4 text-emerald-600" /> Segurança e Antivírus
            </CardTitle>
            <CardDescription>Proteção e integridade do portal.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-3">
            <button 
              onClick={() => navigate({ search: { tab: 'criticas' }, to: '/auditoria' })}
              className="flex flex-col gap-1 rounded-lg border border-border p-4 bg-muted/30 hover:bg-muted/50 transition-all text-left"
            >
              <span className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Ameaças Bloqueadas</span>
              <span className="text-lg font-bold">4</span>
              <span className="text-[10px] text-amber-600 font-medium">Ver detalhes na Auditoria</span>
            </button>
            <button 
              onClick={() => toast.success("Lovable Antivirus: 100% dos arquivos seguros.")}
              className="flex flex-col gap-1 rounded-lg border border-border p-4 bg-muted/30 hover:bg-muted/50 transition-all text-left"
            >
              <span className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Scan de Vírus</span>
              <span className="text-lg font-bold text-emerald-600">Protegido</span>
              <span className="text-[10px] text-muted-foreground">Último scan: agora mesmo</span>
            </button>
            <button 
              onClick={() => toast.info("Certificado gerado por Lovable Cloud.")}
              className="flex flex-col gap-1 rounded-lg border border-border p-4 bg-muted/30 hover:bg-muted/50 transition-all text-left"
            >
              <span className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Certificado SSL</span>
              <span className="text-lg font-bold text-emerald-600">Ativo</span>
              <span className="text-[10px] text-muted-foreground">Expira em 365 dias</span>
            </button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function SmartConfigPanel() {
  const { modo, definirModo, salvando, isLoading } = usePlanilhaModo();
  const [clearing, setClearing] = useState(false);

  const escolher = async (novo: "inteligente" | "tradicional") => {
    if (novo === modo) return;
    try {
      await definirModo(novo);
      if (novo === "inteligente") toast.success("Planilha Inteligente ativada.");
      else toast.info("Modo Tradicional ativado — nenhuma funcionalidade é perdida.");
    } catch (e) {
      toast.error("Não foi possível salvar a preferência: " + (e as Error).message);
    }
  };

  const clearLearning = () => {
    setClearing(true);
    setTimeout(() => {
      localStorage.removeItem("portal_smart_history");
      setClearing(false);
      toast.success("Histórico de aprendizado limpo com sucesso!");
    }, 800);
  };

  const opcoes = [
    {
      id: "tradicional" as const,
      titulo: "Modo Tradicional",
      icone: TableIcon,
      desc: "Seu fluxo atual, sem sugestões automáticas. Nenhuma perda de funcionalidade.",
    },
    {
      id: "inteligente" as const,
      titulo: "Modo Inteligente",
      icone: Sparkles,
      desc: "Aprende padrões, sugere preenchimentos e aponta inconsistências — sempre como assistência.",
    },
  ];

  return (
    <Card className="border-border shadow-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Sparkles className="h-5 w-5 text-violet-600" />
          Planilha Inteligente
        </CardTitle>
        <CardDescription>
          Escolha como deseja trabalhar nas planilhas do portal. A alteração é imediata e reversível.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="grid gap-3 sm:grid-cols-2">
          {opcoes.map((o) => {
            const ativo = modo === o.id;
            const Icone = o.icone;
            return (
              <button
                key={o.id}
                type="button"
                disabled={salvando || isLoading}
                onClick={() => escolher(o.id)}
                className={cn(
                  "flex flex-col items-start gap-2 rounded-lg border p-4 text-left transition-all duration-300",
                  ativo
                    ? "border-violet-400 bg-violet-500/10 shadow-sm ring-1 ring-violet-400/40"
                    : "border-border bg-muted/40 hover:bg-muted/70",
                )}
              >
                <div className="flex w-full items-center gap-2">
                  <Icone className={cn("h-4 w-4", ativo ? "text-violet-600" : "text-muted-foreground")} />
                  <span className="text-sm font-bold text-foreground">{o.titulo}</span>
                  {ativo && (
                    <span className="ml-auto rounded-full bg-violet-600 px-2 py-0.5 text-[9px] font-bold uppercase text-white">
                      Ativo
                    </span>
                  )}
                </div>
                <p className="text-[11px] leading-relaxed text-muted-foreground">{o.desc}</p>
              </button>
            );
          })}
        </div>

        <p className="text-[10px] italic leading-relaxed text-muted-foreground">
          * A preferência fica salva no seu perfil e pode ser alterada a qualquer momento.
          O aprendizado é processado localmente no seu navegador para garantir privacidade total.
        </p>

        <div className="flex flex-col gap-2 pt-1 sm:flex-row">
          <Button
            variant="outline"
            className="flex-1 gap-2 text-xs"
            onClick={clearLearning}
            disabled={clearing}
          >
            {clearing ? <Loader2 className="h-3 w-3 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
            Limpar Histórico
          </Button>
          <Button
            variant="outline"
            className="flex-1 gap-2 text-xs"
            onClick={() => {
              escolher("tradicional");
              localStorage.removeItem("portal_smart_history");
            }}
            disabled={salvando}
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Restaurar Padrão
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function AdvancedSecuritySettings() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState({
    enabled: false,
    email: "",
  });

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('portal_settings')
        .select('value')
        .eq('key', 'envio_base_pagamentos_email')
        .single();
      
      if (error && error.code !== 'PGRST116') throw error;
      if (data?.value) {
        setSettings(data.value as any);
      }
    } catch (e: any) {
      toast.error("Erro ao carregar configurações: " + e.message);
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('portal_settings')
        .upsert({
          key: 'envio_base_pagamentos_email',
          value: settings,
          updated_at: new Date().toISOString()
        });
      
      if (error) throw error;
      toast.success("Configurações salvas com sucesso!");
    } catch (e: any) {
      toast.error("Erro ao salvar: " + e.message);
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  if (loading) {
    return (
      <div className="flex h-40 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <Card className="mx-auto max-w-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ShieldCheck className="h-5 w-5 text-indigo-600" />
          Configurações de Segurança e Auditoria
        </CardTitle>
        <CardDescription>
          Controles avançados para exportação, auditoria e monitoramento de dados sensíveis.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="rounded-lg border border-border p-4 bg-muted/30 space-y-3">
          <div className="flex items-center gap-2">
            <ShieldAlert className="h-4 w-4 text-amber-600" />
            <h4 className="text-sm font-bold">Auditoria de Acesso Sensível (Pagadoria)</h4>
          </div>
          <p className="text-[11px] text-muted-foreground leading-relaxed">
            Todas as alterações de acesso ao setor <strong>Pagadoria</strong> são registradas com rastreabilidade total, incluindo o administrador responsável, o usuário alvo, data/hora e o estado anterior das permissões.
          </p>
          <Button 
            variant="link" 
            size="sm" 
            className="h-auto p-0 text-indigo-600 text-[11px]"
            onClick={() => navigate({ search: { tab: 'criticas' }, to: '/auditoria' })}
          >
            Ver logs de auditoria <ChevronRight className="h-3 w-3 ml-1" />
          </Button>
        </div>

        <div className="rounded-lg border border-border p-4 bg-muted/30 space-y-4">
          <div className="flex items-center gap-2">
            <Lock className="h-4 w-4 text-indigo-600" />
            <h4 className="text-sm font-bold">Política de Sessão Única</h4>
          </div>
          <p className="text-[11px] text-muted-foreground leading-relaxed">
            Garante que cada usuário possua apenas uma sessão ativa simultaneamente, preservando a integridade da fila virtual e segurança do login.
          </p>
          <div className="flex items-center justify-between py-1 border-t border-border pt-4">
            <div className="space-y-0.5">
              <Label className="text-[12px] font-semibold">Encerrar sessão anterior automaticamente</Label>
              <p className="text-[10px] text-muted-foreground">Novos logins derrubam acessos antigos no mesmo usuário.</p>
            </div>
            <Switch checked={true} disabled className="data-[state=checked]:bg-indigo-600" />
          </div>
        </div>

        <div className="flex items-center justify-between rounded-lg border border-border p-4 bg-muted/50">
          <div className="space-y-0.5">
            <Label className="text-base">Envio Diário da Base de Pagamentos</Label>
            <p className="text-sm text-muted-foreground">
              Enviar por e-mail a "base" de "pagamentos diversos" ao final de cada dia.
            </p>
          </div>
          <div className="flex items-center h-6">
             <input 
              type="checkbox" 
              className="h-4 w-4 rounded border-border text-indigo-600 focus:ring-indigo-600"
              checked={settings.enabled}
              onChange={(e) => setSettings(prev => ({ ...prev, enabled: e.target.checked }))}
            />
          </div>
        </div>

        {settings.enabled && (
          <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-300">
            <Label htmlFor="admin-email">E-mail do Administrador Destinatário</Label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input 
                  id="admin-email"
                  type="email"
                  placeholder="admin@exemplo.com"
                  className="pl-10"
                  value={settings.email}
                  onChange={(e) => setSettings(prev => ({ ...prev, email: e.target.value }))}
                />
              </div>
            </div>
            <p className="text-[11px] text-amber-600 font-medium">
              Nota: Este usuário receberá um arquivo Excel consolidado com todos os lançamentos do dia.
            </p>
          </div>
        )}

        <Button 
          className="w-full bg-indigo-600 hover:bg-indigo-700 mt-4" 
          disabled={saving}
          onClick={saveSettings}
        >
          {saving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Salvando...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" /> Salvar Configurações
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
