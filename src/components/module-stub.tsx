import { Link } from "@tanstack/react-router";
import { Construction, ArrowLeft, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface ModuleStubProps {
  title: string;
  description: string;
  phase?: string;
  adminOnly?: boolean;
}

export function ModuleStub({ title, description, phase, adminOnly }: ModuleStubProps) {
  return (
    <div className="min-h-[calc(100vh-3.5rem)] bg-gradient-to-br from-muted via-white to-violet-50/40 p-6">
      <div className="mx-auto max-w-3xl space-y-4">
        <Button variant="ghost" size="sm" asChild>
          <Link to="/">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar ao Portal
          </Link>
        </Button>
        <Card className="border-border shadow-sm">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-violet-100 text-violet-700">
                {adminOnly ? <Lock className="h-5 w-5" /> : <Construction className="h-5 w-5" />}
              </div>
              <div>
                <CardTitle className="text-xl text-foreground">{title}</CardTitle>
                <p className="text-sm text-muted-foreground">{description}</p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <p>
              Este módulo faz parte do escopo do Portal Pagadoria e será entregue{" "}
              {phase ? <strong>na {phase}</strong> : "em uma próxima fase"} do plano de construção.
            </p>
            {adminOnly && (
              <div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-amber-800">
                <strong>Área restrita.</strong> Apenas administradores terão acesso quando o
                módulo estiver disponível.
              </div>
            )}
            <p className="text-muted-foreground">
              Integração futura disponível para Excel, SharePoint e Power BI.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
