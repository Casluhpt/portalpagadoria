import { createFileRoute } from "@tanstack/react-router";
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
import { HelpCircle, Bug, AlertCircle, MessageSquare, Send, CheckCircle2 } from "lucide-react";
import { useState } from "react";
import { useSession } from "@/hooks/use-session";
import { useMutation } from "@tanstack/react-query";
import { sendSupportRequest } from "@/lib/suporte.functions";
import { toast } from "sonner";
import { useServerFn } from "@tanstack/react-start";

export const Route = createFileRoute("/configuracoes")({
  component: ConfiguracoesPage,
});

function ConfiguracoesPage() {
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
            <Tabs defaultValue="suporte" className="w-full">
              <TabsList className="mb-4">
                <TabsTrigger value="geral" disabled>Geral</TabsTrigger>
                <TabsTrigger value="integracoes" disabled>Integrações</TabsTrigger>
                <TabsTrigger value="suporte" className="gap-2">
                  <HelpCircle className="h-4 w-4" /> Dúvidas, Sugestões e Melhorias
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="suporte">
                <SupportForm />
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
  const [formData, setFormData] = useState({
    assunto: "" as "Bug e Correção" | "Erro" | "Melhoria",
    comentario: "",
    anexo_url: "",
  });

  const sendMut = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Usuário não autenticado");
      return sendFn({
        data: {
          ...formData,
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
          <Label htmlFor="anexo">Anexo (Opcional - Link da imagem/screenshot)</Label>
          <Input 
            id="anexo" 
            placeholder="https://..." 
            value={formData.anexo_url}
            onChange={(e) => setFormData(prev => ({ ...prev, anexo_url: e.target.value }))}
          />
          <p className="text-[10px] text-muted-foreground">Em breve habilitaremos o upload direto de arquivos.</p>
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
          disabled={!formData.assunto || sendMut.isPending}
          onClick={() => sendMut.mutate()}
        >
          {sendMut.isPending ? (
            <>Enviando...</>
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
