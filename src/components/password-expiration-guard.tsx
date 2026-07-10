import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { AlertTriangle, KeyRound, ShieldAlert, X } from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/hooks/use-session";
import { Button } from "@/components/ui/button";
import {
  AlertDialog, AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle, AlertDialogAction,
} from "@/components/ui/alert-dialog";

const MAX_AGE_DAYS = 60;
const NOTIFY_DAYS = [7, 5, 3, 2, 1];

type ChangeMode = "recovery" | "inline";

export function PasswordExpirationGuard() {
  const { user, loading } = useSession();
  const navigate = useNavigate();
  const location = useLocation();
  const [changedAt, setChangedAt] = useState<Date | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const [changeOpen, setChangeOpen] = useState(false);
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [saving, setSaving] = useState(false);
  const notifiedRef = useRef<Set<number>>(new Set());

  const publicRoute = /^\/(auth|forgot-password|reset-password)/.test(location.pathname);

  useEffect(() => {
    if (!user?.id) { setChangedAt(null); return; }
    let cancel = false;
    (async () => {
      const { data, error } = await (supabase as any)
        .from("user_password_metadata")
        .select("password_changed_at")
        .eq("user_id", user.id)
        .maybeSingle();
      if (cancel) return;
      if (!error && data?.password_changed_at) {
        setChangedAt(new Date(data.password_changed_at));
      }
    })();
    return () => { cancel = true; };
  }, [user?.id]);

  const daysRemaining = useMemo(() => {
    if (!changedAt) return null;
    const elapsedMs = Date.now() - changedAt.getTime();
    const elapsedDays = elapsedMs / (1000 * 60 * 60 * 24);
    return Math.ceil(MAX_AGE_DAYS - elapsedDays);
  }, [changedAt]);

  const expired = daysRemaining !== null && daysRemaining <= 0;

  // Notify at 7/5/3/2/1 days before expiration (once per threshold per session)
  useEffect(() => {
    if (daysRemaining === null || expired) return;
    for (const threshold of NOTIFY_DAYS) {
      if (daysRemaining <= threshold && !notifiedRef.current.has(threshold)) {
        notifiedRef.current.add(threshold);
        toast.warning(
          daysRemaining === 1
            ? "Sua senha expira amanhã. Troque agora para não perder o acesso."
            : `Sua senha expira em ${daysRemaining} dias. Troque agora para manter o acesso.`,
          { duration: 8000 },
        );
        break; // only fire the smallest matching threshold
      }
    }
  }, [daysRemaining, expired]);

  const changePasswordInline = async () => {
    if (newPw.length < 8) return toast.error("Senha precisa de ao menos 8 caracteres.");
    if (newPw !== confirmPw) return toast.error("As senhas não coincidem.");
    setSaving(true);
    const { error } = await supabase.auth.updateUser({ password: newPw });
    if (error) { setSaving(false); return toast.error(error.message); }
    try { await supabase.rpc("mark_password_changed" as never); } catch { /* ignore */ }
    setSaving(false);
    setChangeOpen(false);
    setNewPw(""); setConfirmPw("");
    toast.success("Senha alterada com sucesso.");
    // Refresh local metadata
    setChangedAt(new Date());
    setDismissed(false);
    notifiedRef.current.clear();
  };

  const sendRecoveryEmail = async () => {
    if (!user?.email) return;
    const { error } = await supabase.auth.resetPasswordForEmail(user.email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) return toast.error(error.message);
    toast.success("Email de redefinição enviado.");
  };

  if (loading || !user || publicRoute || daysRemaining === null) return null;

  // Blocking dialog when password expired
  if (expired) {
    return (
      <AlertDialog open>
        <AlertDialogContent onEscapeKeyDown={(e) => e.preventDefault()}>
          <AlertDialogHeader>
            <div className="flex items-center gap-2 text-destructive">
              <ShieldAlert className="h-5 w-5" />
              <AlertDialogTitle>Senha expirada</AlertDialogTitle>
            </div>
            <AlertDialogDescription>
              Por segurança, exigimos a troca da senha a cada {MAX_AGE_DAYS} dias.
              Defina uma nova senha para continuar usando o sistema.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-3">
            <div>
              <label className="text-xs font-medium">Nova senha (mín. 8 caracteres)</label>
              <input
                type="password" autoComplete="new-password"
                value={newPw} onChange={(e) => setNewPw(e.target.value)}
                className="mt-1 h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
              />
            </div>
            <div>
              <label className="text-xs font-medium">Confirmar nova senha</label>
              <input
                type="password" autoComplete="new-password"
                value={confirmPw} onChange={(e) => setConfirmPw(e.target.value)}
                className="mt-1 h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
              />
            </div>
          </div>
          <AlertDialogFooter>
            <Button
              variant="outline"
              onClick={async () => {
                await sendRecoveryEmail();
                await supabase.auth.signOut();
                navigate({ to: "/auth", replace: true });
              }}
            >
              Sair e receber por email
            </Button>
            <AlertDialogAction onClick={changePasswordInline} disabled={saving}>
              {saving ? "Salvando…" : "Salvar nova senha"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    );
  }

  // Warning banner within notify window
  const showBanner = daysRemaining <= NOTIFY_DAYS[0] && !dismissed;
  if (!showBanner) return null;

  return (
    <>
      <div className="sticky top-0 z-50 flex items-center justify-between gap-3 border-b border-amber-300 bg-amber-50 px-4 py-2 text-sm text-amber-900">
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-4 w-4" />
          <span>
            {daysRemaining === 1
              ? "Sua senha expira amanhã."
              : `Sua senha expira em ${daysRemaining} dias.`}
            {" "}Troque agora para manter o acesso.
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="default" onClick={() => setChangeOpen(true)}>
            <KeyRound className="mr-1 h-3.5 w-3.5" /> Trocar senha
          </Button>
          <button
            onClick={() => setDismissed(true)}
            className="rounded p-1 hover:bg-amber-100"
            aria-label="Dispensar"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      <AlertDialog open={changeOpen} onOpenChange={setChangeOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Trocar senha</AlertDialogTitle>
            <AlertDialogDescription>
              Defina uma nova senha. O contador de {MAX_AGE_DAYS} dias reinicia após salvar.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-3">
            <div>
              <label className="text-xs font-medium">Nova senha (mín. 8 caracteres)</label>
              <input
                type="password" autoComplete="new-password"
                value={newPw} onChange={(e) => setNewPw(e.target.value)}
                className="mt-1 h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
              />
            </div>
            <div>
              <label className="text-xs font-medium">Confirmar nova senha</label>
              <input
                type="password" autoComplete="new-password"
                value={confirmPw} onChange={(e) => setConfirmPw(e.target.value)}
                className="mt-1 h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
              />
            </div>
          </div>
          <AlertDialogFooter>
            <Button variant="outline" onClick={() => setChangeOpen(false)}>Cancelar</Button>
            <AlertDialogAction onClick={changePasswordInline} disabled={saving}>
              {saving ? "Salvando…" : "Salvar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

// Silence unused import warnings for the mode type used during future expansion
export type { ChangeMode };
