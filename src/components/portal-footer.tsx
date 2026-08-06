import { useSession } from "@/hooks/use-session";

export function PortalFooter() {
  const { user } = useSession();

  // Only renders inside the authenticated portal shell.
  if (!user) return null;

  return (
    <footer className="w-full border-t border-border/10 bg-black/5 backdrop-blur-xl py-4 mt-auto">
      <div className="mx-auto max-w-[1600px] px-6 flex flex-col items-center justify-center gap-1">
        <p className="text-[10px] uppercase tracking-[0.2em] font-semibold text-muted-foreground/60">
          Analista Administrativo | Desenvolvedor do Portal
        </p>
        <p className="text-[12px] font-medium text-foreground/80">
          Lucas C.
        </p>
      </div>
    </footer>
  );
}
