import { useSession } from "@/hooks/use-session";

export function PortalFooter() {
  const { user } = useSession();

  // Only renders inside the authenticated portal shell.
  if (!user) return null;

  return (
    <footer className="w-full border-t border-border/40 bg-card/40 backdrop-blur-md py-3 mt-auto">
      <div className="mx-auto max-w-[1600px] px-4 text-center">
        <p className="text-[11px] font-medium tracking-wide text-muted-foreground/80">
          Lucas Chaves Lima - pagadoria.
        </p>
      </div>
    </footer>
  );
}
