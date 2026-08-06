import { useState, useEffect } from "react";
import { AlertCircle, Bot, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/hooks/use-session";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

export function IABannerOffline() {
  const { user } = useSession();
  const [iaOnline, setIaOnline] = useState<boolean | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (!user) return;
    
    const fetchIaStatus = async () => {
      const { data } = await supabase
        .from('app_config')
        .select('value')
        .eq('key', 'ia_online')
        .maybeSingle();
      setIaOnline(data?.value !== false);
    };

    fetchIaStatus();

    const channel = supabase
      .channel('ia_status_banner')
      .on('postgres_changes', { 
        event: 'UPDATE', 
        schema: 'public', 
        table: 'app_config',
        filter: 'key=eq.ia_online'
      }, (payload) => {
        setIaOnline(payload.new.value !== false);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  if (!user || iaOnline !== false || dismissed) return null;

  return (
    <div className="fixed top-4 left-1/2 z-[200] w-full max-w-2xl -translate-x-1/2 px-4 animate-in fade-in slide-in-from-top-4 duration-500">
      <Alert variant="destructive" className="border-rose-500/50 bg-rose-500/10 text-rose-600 shadow-2xl backdrop-blur-md dark:text-rose-400 ring-1 ring-rose-500/20">
        <Bot className="h-5 w-5 text-rose-500" />
        <AlertTitle className="flex items-center justify-between font-bold tracking-tight">
          <span>A IA da Pagadoria está Temporariamente Offline</span>
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-6 w-6 rounded-full hover:bg-rose-500/20 text-rose-500" 
            onClick={() => setDismissed(true)}
          >
            <X className="h-4 w-4" />
          </Button>
        </AlertTitle>
        <AlertDescription className="mt-2 text-xs leading-relaxed opacity-90">
          O assistente inteligente está em manutenção ou desativado pelo administrador. 
          <strong className="block mt-1 font-semibold">O que fazer agora:</strong>
          <ul className="mt-1 list-disc list-inside space-y-0.5 ml-1">
            <li>Consulte o <strong>Material de Apoio</strong> na barra lateral para processos manuais.</li>
            <li>Utilize a <strong>Busca Global (Ctrl+K)</strong> para localizar documentos e links.</li>
            <li>Se for urgente, abra um chamado no canal de suporte técnico.</li>
          </ul>
        </AlertDescription>
      </Alert>
    </div>
  );
}
