import { useState, useEffect } from "react";
import { Bot, X, Send, Loader2, Sparkles, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { perguntarIa } from "@/lib/ia.functions";
import { useQuery } from "@tanstack/react-query";
import { fetchMateriais, materialApoioQueryKey } from "@/lib/material-apoio";
import { useSession } from "@/hooks/use-session";
import { useNavigate } from "@tanstack/react-router";
import { cn } from "@/lib/utils";

export function FloatingAI() {
  const [isOpen, setIsOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<{ role: "user" | "assistant"; content: string }[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const { user } = useSession();
  const navigate = useNavigate();

  const { data: materiais = [] } = useQuery({
    queryKey: materialApoioQueryKey,
    queryFn: fetchMateriais,
    enabled: !!user,
    staleTime: 5 * 60_000,
  });

  const handleSendMessage = async () => {
    if (!chatInput.trim() || isTyping) return;

    const userMsg = chatInput.trim();
    setChatInput("");
    setChatMessages((prev) => [...prev, { role: "user", content: userMsg }]);
    setIsTyping(true);

    const contexto = [
      ...materiais
        .filter((m) => m.publicado)
        .map((m) => `### ${m.titulo} (${m.categoria})\n${m.conteudo}`),
    ]
      .join("\n\n")
      .slice(0, 50_000);

    try {
      const r = await perguntarIa({ data: { pergunta: userMsg, contexto } });
      if (r.erro) {
        setChatMessages((prev) => [...prev, { role: "assistant", content: r.erro }]);
        toast.error(r.erro);
      } else {
        setChatMessages((prev) => [
          ...prev,
          { role: "assistant", content: r.resposta ?? "IA da Pagadoria: Não encontrei material autorizado suficiente." },
        ]);
      }
    } catch (err) {
      setChatMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Erro na conexão com a IA. Tente novamente." },
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  if (!user) return null;

  return (
    <div className="fixed bottom-6 right-6 z-[100] flex flex-col items-end gap-4">
      {/* Floating Chat Window */}
      {isOpen && (
        <div 
          className={cn(
            "flex h-[500px] w-[350px] flex-col overflow-hidden rounded-2xl border border-white/20 bg-background/60 shadow-2xl backdrop-blur-xl animate-in fade-in slide-in-from-bottom-8 duration-300 ring-1 ring-white/10",
            "lg:w-[400px]"
          )}
        >
          {/* Header */}
          <div className="flex items-center justify-between bg-primary/20 p-4 border-b border-white/10 backdrop-blur-md">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/20 shadow-glow ring-1 ring-primary/30">
                <Bot className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="text-sm font-bold leading-none text-foreground">IA da Pagadoria</h3>
                <div className="mt-1 flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.6)]" />
                  <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">Online</span>
                </div>
              </div>
            </div>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-8 w-8 rounded-full hover:bg-white/10" 
              onClick={() => setIsOpen(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          
          {/* Messages */}
          <ScrollArea className="flex-1 p-4">
            <div className="space-y-4 pb-4">
              {chatMessages.length === 0 && (
                <div className="flex flex-col items-center justify-center pt-20 text-center space-y-4 opacity-60">
                  <div className="relative">
                    <div className="absolute inset-0 bg-primary/20 blur-2xl rounded-full" />
                    <Sparkles className="relative h-12 w-12 text-primary/60" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-foreground">Olá! Sou a assistente do Portal.</p>
                    <p className="text-xs text-muted-foreground px-8">Posso ajudar com dúvidas sobre processos, módulos ou material de apoio.</p>
                  </div>
                </div>
              )}
              {chatMessages.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"} animate-in fade-in slide-in-from-bottom-2`}>
                  <div className={cn(
                    "rounded-2xl px-4 py-2.5 text-xs shadow-sm max-w-[85%]",
                    msg.role === "user" 
                      ? "bg-primary text-primary-foreground rounded-tr-none" 
                      : "bg-muted/50 border border-white/10 text-foreground rounded-tl-none backdrop-blur-sm"
                  )}>
                    {msg.content}
                  </div>
                </div>
              ))}
              {isTyping && (
                <div className="flex justify-start animate-in fade-in duration-300">
                  <div className="bg-muted/50 border border-white/10 rounded-2xl px-4 py-2.5 rounded-tl-none backdrop-blur-sm">
                    <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>

          {/* Input */}
          <div className="p-4 border-t border-white/10 bg-white/5 backdrop-blur-sm">
            <form 
              onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }}
              className="flex gap-2"
            >
              <Input
                placeholder="Pergunte qualquer coisa..."
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                disabled={isTyping}
                className="h-10 bg-background/50 border-white/10 focus-visible:ring-primary/30"
              />
              <Button 
                type="submit" 
                size="icon" 
                disabled={!chatInput.trim() || isTyping}
                className="h-10 w-10 shrink-0 shadow-glow transition-all hover:scale-105 active:scale-95"
              >
                <Send className="h-4 w-4" />
              </Button>
            </form>
          </div>
        </div>
      )}

      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "group relative flex h-14 w-14 items-center justify-center rounded-full bg-primary shadow-[0_8px_32px_rgba(var(--primary-rgb),0.4)] transition-all duration-500 hover:scale-110 active:scale-95 ring-1 ring-white/20 overflow-hidden",
          isOpen && "rotate-90 scale-90"
        )}
      >
        <div className="absolute inset-0 bg-gradient-to-tr from-primary via-primary to-white/30 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        {isOpen ? (
          <X className="h-6 w-6 text-primary-foreground relative z-10" />
        ) : (
          <Bot className="h-7 w-7 text-primary-foreground relative z-10 animate-bounce-slow" />
        )}
        {!isOpen && (
          <span className="absolute -top-1 -right-1 flex h-4 w-4">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary-foreground opacity-75"></span>
            <span className="relative inline-flex rounded-full h-4 w-4 bg-primary-foreground shadow-sm">
              <Sparkles className="h-2.5 w-2.5 text-primary m-auto" />
            </span>
          </span>
        )}
      </button>
    </div>
  );
}
