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
import { HelpCircle, Bug, AlertCircle, MessageSquare, Send, CheckCircle2, Paperclip, X, Loader2, Settings, Users, History } from "lucide-react";
import { useState, useRef } from "react";
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
            <h1 className="text-sm font-semibold text-slate-700">Configurações</h1>
            <div className="ml-auto">
              <HeaderActions />
            </div>
          </header>
          
          <main className="flex-1 p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Card Administração de Usuários */}
              <Card 
                className="group hover:shadow-lg transition-all border-slate-200 cursor-pointer overflow-hidden flex flex-col"
                onClick={() => navigate({ to: "/usuarios" })}
              >
                <div className="p-6 flex flex-col h-full">
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                    <Users className="h-6 w-6" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 mb-2">Administração de usuários</h3>
                  <p className="text-sm text-muted-foreground flex-1">
                    Gestão completa de acessos, permissões e perfis de usuários do portal.
                  </p>
                  <div className="mt-6 flex items-center text-xs font-semibold text-indigo-600 uppercase tracking-wider">
                    Acessar Módulo <ChevronRight className="ml-1 h-3 w-3" />
                  </div>
                </div>
              </Card>

              {/* Card Histórico de Versões */}
              <Card 
                className="group hover:shadow-lg transition-all border-slate-200 cursor-pointer overflow-hidden flex flex-col"
                onClick={() => navigate({ to: "/historico" })}
              >
                <div className="p-6 flex flex-col h-full">
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-amber-50 text-amber-600 group-hover:bg-amber-600 group-hover:text-white transition-colors">
                    <History className="h-6 w-6" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 mb-2">Histórico de versões</h3>
                  <p className="text-sm text-muted-foreground flex-1">
                    Visualize o log detalhado de atualizações, melhorias e correções aplicadas ao sistema.
                  </p>
                  <div className="mt-6 flex items-center text-xs font-semibold text-amber-600 uppercase tracking-wider">
                    Ver Histórico <ChevronRight className="ml-1 h-3 w-3" />
                  </div>
                </div>
              </Card>

              {/* Card Suporte Técnico */}
              <Card 
                className="group hover:shadow-lg transition-all border-slate-200 cursor-pointer overflow-hidden flex flex-col"
                onClick={() => {
                  const tabs = document.querySelector('[role="tablist"]');
                  const supportTrigger = tabs?.querySelector('[value="suporte"]') as HTMLElement;
                  supportTrigger?.click();
                }}
              >
                <div className="p-6 flex flex-col h-full">
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                    <HelpCircle className="h-6 w-6" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 mb-2">Suporte Técnico</h3>
                  <p className="text-sm text-muted-foreground flex-1">
                    Central de ajuda para relatar bugs, sugerir melhorias ou tirar dúvidas técnicas.
                  </p>
                  <div className="mt-6 flex items-center text-xs font-semibold text-emerald-600 uppercase tracking-wider">
                    Abrir Chamado <ChevronRight className="ml-1 h-3 w-3" />
                  </div>
                </div>
              </Card>
            </div>

            <div className="mt-12 border-t pt-8">
              <Tabs defaultValue="suporte" className="w-full">
                <TabsList className="mb-6">
                  <TabsTrigger value="suporte" className="gap-2">
                    <HelpCircle className="h-4 w-4" /> Formulário de Suporte
                  </TabsTrigger>
                </TabsList>
                <TabsContent value="suporte">
                  <SupportForm />
                </TabsContent>
              </Tabs>
            </div>
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
                className="w-full border-dashed border-slate-300 h-20 flex flex-col items-center justify-center gap-1 hover:border-indigo-400 hover:bg-indigo-50/50 transition-colors"
                onClick={() => fileInputRef.current?.click()}
              >
                <Paperclip className="h-5 w-5 text-slate-400" />
                <span className="text-xs text-slate-500">Clique para selecionar um arquivo</span>
              </Button>
            ) : (
              <div className="flex items-center justify-between p-3 border rounded-lg bg-slate-50 border-slate-200">
                <div className="flex items-center gap-2 overflow-hidden">
                  <Paperclip className="h-4 w-4 text-indigo-600 shrink-0" />
                  <span className="text-sm truncate text-slate-700">{file.name}</span>
                  <span className="text-[10px] text-slate-400">({(file.size / 1024 / 1024).toFixed(2)} MB)</span>
                </div>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-8 w-8 text-slate-400 hover:text-destructive"
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
