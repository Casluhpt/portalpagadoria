import { useState, useEffect } from "react";
import { Info, X, Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export function ActionContextResumo() {
  const [isVisible, setIsVisible] = useState(true);
  const [contextText, setContextText] = useState("");

  useEffect(() => {
    // Busca o texto do div sr-only no __root.tsx via DOM
    const contextDiv = document.querySelector('body > div.sr-only[aria-hidden="true"]');
    if (contextDiv) {
      const fullText = contextDiv.textContent || "";
      const prefix = "comando mais recente enviado por ele:";
      const index = fullText.indexOf(prefix);
      
      if (index !== -1) {
        setContextText(fullText.substring(index + prefix.length).trim());
      } else {
        setContextText(fullText.trim());
      }
    }
  }, []);

  if (!isVisible || !contextText) return null;

  return (
    <div className="fixed bottom-24 right-6 z-[90] w-full max-w-[300px] animate-in fade-in slide-in-from-right-8 duration-500">
      <div className="group relative overflow-hidden rounded-xl border border-primary/20 bg-background/40 p-3 shadow-2xl backdrop-blur-xl ring-1 ring-white/10 transition-all hover:bg-background/60">
        {/* Decorative background glow */}
        <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-primary/10 blur-2xl transition-all group-hover:bg-primary/20" />
        
        <div className="relative flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-primary/20 text-primary ring-1 ring-primary/30 shadow-glow">
                <Zap className="h-3.5 w-3.5" />
              </div>
              <span className="text-[10px] font-bold uppercase tracking-widest text-primary/80">Instrução Ativa</span>
            </div>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-5 w-5 rounded-full hover:bg-white/10" 
              onClick={() => setIsVisible(false)}
            >
              <X className="h-3 w-3 opacity-50 hover:opacity-100" />
            </Button>
          </div>
          
          <div className="flex gap-2">
            <Info className="mt-0.5 h-3 w-3 shrink-0 text-primary/60" />
            <p className="text-[11px] leading-relaxed text-foreground/80 font-medium">
              {contextText}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
