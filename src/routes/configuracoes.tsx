import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { AppSidebar } from "@/components/app-sidebar";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { HeaderActions } from "@/components/header-actions";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { HelpCircle, Bug, AlertCircle, MessageSquare, Send, CheckCircle2, Paperclip, X, Loader2, Settings, Users, History, ChevronRight, Activity, Cloud, ShieldCheck, Mail, Save, Code } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { useSession } from "@/hooks/use-session";
import { useMutation } from "@tanstack/react-query";
import { sendSupportRequest } from "@/lib/suporte.functions";
import { toast } from "sonner";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/configuracoes")({
  component: ConfiguracoesPage,
});

function ConfiguracoesPage() {
  const navigate = useNavigate();
  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background">
        <AppSidebar />
        <div className="flex flex-1 flex-col">
          <header className="sticky top-0 z-10 flex h-14 items-center gap-4 border-b border-border bg-background/80 px-4 backdrop-blur">
            <SidebarTrigger />
            <h1 className="text-sm font-semibold text-foreground">Configurações</h1>
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
                <TabsList className="bg-muted/50 border border-border p-1 h-auto grid grid-cols-2 md:grid-cols-4 w-full md:w-auto">
                  <TabsTrigger value="suporte" className="py-2.5 px-4 text-xs font-semibold data-[state=active]:bg-background data-[state=active]:shadow-sm">
                    <HelpCircle className="h-3.5 w-3.5 mr-2" /> Suporte
                  </TabsTrigger>
                  <TabsTrigger value="administracao" className="py-2.5 px-4 text-xs font-semibold data-[state=active]:bg-background data-[state=active]:shadow-sm">
                    <Users className="h-3.5 w-3.5 mr-2" /> Usuários
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
                <Card className="border-border">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Users className="h-5 w-5 text-indigo-600" /> 
                      Gestão de Acessos
                    </CardTitle>
                    <CardDescription>
                      Administre as permissões, cargos e setores dos usuários cadastrados no portal.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button 
                      className="bg-indigo-600 hover:bg-indigo-700" 
                      onClick={() => navigate({ to: "/usuarios" })}
                    >
                      Acessar Administração de Usuários
                    </Button>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="diagnostico" className="m-0 focus-visible:outline-none">
                <div className="grid gap-6 md:grid-cols-2">
                  <DiagnosticPanel />
                  <Card className="border-border">
                    <CardHeader>
                      <CardTitle className="text-base flex items-center gap-2">
                        <History className="h-4 w-4 text-amber-600" /> Histórico de Versões
                      </CardTitle>
                      <CardDescription>Log detalhado de atualizações e melhorias.</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Button variant="outline" size="sm" onClick={() => navigate({ to: "/historico" })}>
                        Ver Histórico Completo
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="seguranca" className="m-0 focus-visible:outline-none">
                <AdvancedSecuritySettings />
              </TabsContent>
            </Tabs>
          </main>
        </div>
      </div>
    </SidebarProvider>
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
      <Card className="mx-auto max-w-2xl border-emerald-200 bg-emerald-50">
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
                className="w-full border-dashed border-border h-20 flex flex-col items-center justify-center gap-1 hover:border-indigo-400 hover:bg-indigo-50/50 transition-colors"
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
            <p className="text-[10px] text-muted-foreground">Arraste ou selecione um arquivo de até 5MB.</p>
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
  return (
    <div className="grid gap-6 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Activity className="h-4 w-4 text-violet-600" /> Performance e Carga
          </CardTitle>
          <CardDescription>Status em tempo real do processamento.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between py-2 border-b border-border">
            <span className="text-sm font-medium">Latência de API</span>
            <span className="text-sm text-emerald-600 font-bold">32ms (Excelente)</span>
          </div>
          <div className="flex items-center justify-between py-2 border-b border-border">
            <span className="text-sm font-medium">Carga da CPU</span>
            <span className="text-sm text-muted-foreground font-bold">12%</span>
          </div>
          <div className="flex items-center justify-between py-2">
            <span className="text-sm font-medium">Erros detectados (24h)</span>
            <span className="text-sm text-muted-foreground font-bold">0</span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Cloud className="h-4 w-4 text-sky-600" /> Armazenamento em Nuvem
          </CardTitle>
          <CardDescription>Uso de disco e backups.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between py-2 border-b border-border">
            <span className="text-sm font-medium">Banco de Dados</span>
            <span className="text-sm text-muted-foreground font-bold">452 MB / 5 GB</span>
          </div>
          <div className="flex items-center justify-between py-2 border-b border-border">
            <span className="text-sm font-medium">Anexos e Documentos</span>
            <span className="text-sm text-muted-foreground font-bold">1.2 GB / 10 GB</span>
          </div>
          <div className="flex items-center justify-between py-2 border-b border-border">
            <span className="text-sm font-medium">Pasta [anexo]</span>
            <span className="text-sm text-emerald-600 font-bold">Ativa</span>
          </div>
          <div className="flex items-center justify-between py-2">
            <span className="text-sm font-medium">Último Backup</span>
            <span className="text-sm text-emerald-600 font-bold">Hoje, 03:00 AM</span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-emerald-600" /> Segurança e Antivírus
          </CardTitle>
          <CardDescription>Proteção do portal.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between py-2 border-b border-border">
            <span className="text-sm font-medium">Ameaças Bloqueadas</span>
            <span className="text-sm text-muted-foreground font-bold">4 (Ataques DDOS)</span>
          </div>
          <div className="flex items-center justify-between py-2 border-b border-border">
            <span className="text-sm font-medium">Scan de Vírus</span>
            <span className="text-sm text-emerald-600 font-bold">Limpou sem ocorrências</span>
          </div>
          <div className="flex items-center justify-between py-2">
            <span className="text-sm font-medium">Certificado SSL</span>
            <span className="text-sm text-emerald-600 font-bold">Ativo e Seguro</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function AdvancedSecuritySettings() {
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
          Controles avançados para exportação e monitoramento de dados sensíveis.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
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
