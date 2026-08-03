import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ShieldCheck, Loader2, Save, Search } from "lucide-react";
import { useServerFn } from "@tanstack/react-start";
import { getPermissions, updatePermission } from "@/lib/permissions.functions";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";

const RESOURCES = [
  { id: "pagamentos", name: "Pagamentos Diversos" },
  { id: "provisao", name: "Provisão Diária" },
  { id: "conciliacao", name: "Conciliação Bancária" },
  { id: "esocial", name: "Controle E-Social" },
  { id: "auditoria", name: "Auditoria" },
  { id: "configuracoes", name: "Configurações" },
  { id: "despesas", name: "Despesas Fixas" },
  { id: "suporte", name: "Suporte Técnico" },
];

const ACTIONS = [
  { id: "view", name: "Visualizar" },
  { id: "create", name: "Criar" },
  { id: "edit", name: "Editar" },
  { id: "delete", name: "Excluir" },
  { id: "import", name: "Importar" },
  { id: "export", name: "Exportar" },
  { id: "execute", name: "Executar" },
];

const ROLES = [
  { id: "admin", name: "Administrador" },
  { id: "user", name: "Usuário" },
  { id: "viewer", name: "Viewer" },
  { id: "visitante", name: "Visitante" },
];

export function PermissoesManagement() {
  const queryClient = useQueryClient();
  const getPermsFn = useServerFn(getPermissions);
  const updatePermFn = useServerFn(updatePermission);
  
  const [selectedRole, setSelectedRole] = useState("admin");
  const [search, setSearch] = useState("");

  const { data: permissions, isLoading } = useQuery({
    queryKey: ["app-permissions"],
    queryFn: () => getPermsFn(),
  });

  const updateMutation = useMutation({
    mutationFn: (vars: { resource: string, action: string, is_allowed: boolean }) => 
      updatePermFn({ data: { role: selectedRole, ...vars } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["app-permissions"] });
      toast.success("Permissão atualizada!");
    },
    onError: (e) => toast.error("Erro ao atualizar: " + e.message),
  });

  const isAllowed = (resource: string, action: string) => {
    // Admin tem tudo por padrão se não houver regra restritiva explícita (mas aqui o sistema é explícito)
    const perm = permissions?.find(p => p.role === selectedRole && p.resource === resource && p.action === action);
    return perm ? perm.is_allowed : (selectedRole === 'admin');
  };

  const filteredResources = RESOURCES.filter(r => 
    r.name.toLowerCase().includes(search.toLowerCase()) || 
    r.id.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-bold flex items-center gap-2 text-foreground">
            <ShieldCheck className="h-5 w-5 text-indigo-600" />
            Gestão Granular de Perfis e Permissões
          </h3>
          <p className="text-sm text-muted-foreground">
            Defina o que cada perfil pode realizar em cada módulo do portal.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={selectedRole} onValueChange={setSelectedRole}>
            <SelectTrigger className="w-[200px] bg-background">
              <SelectValue placeholder="Selecione o perfil" />
            </SelectTrigger>
            <SelectContent>
              {ROLES.map(role => (
                <SelectItem key={role.id} value={role.id}>{role.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input 
          placeholder="Filtrar módulos..." 
          className="pl-9 bg-background"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <Card className="border-border bg-card/50 backdrop-blur-sm overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow>
                <TableHead className="w-[250px] font-bold">Módulo / Submódulo</TableHead>
                {ACTIONS.map(action => (
                  <TableHead key={action.id} className="text-center font-bold text-[11px] uppercase tracking-wider">
                    {action.name}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={ACTIONS.length + 1} className="h-24 text-center">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto text-indigo-600" />
                  </TableCell>
                </TableRow>
              ) : filteredResources.map(resource => (
                <TableRow key={resource.id} className="hover:bg-muted/30 transition-colors">
                  <TableCell className="font-medium text-foreground">{resource.name}</TableCell>
                  {ACTIONS.map(action => (
                    <TableCell key={action.id} className="text-center">
                      <Switch 
                        checked={isAllowed(resource.id, action.id)}
                        onCheckedChange={(checked) => updateMutation.mutate({ 
                          resource: resource.id, 
                          action: action.id, 
                          is_allowed: checked 
                        })}
                        disabled={updateMutation.isPending}
                        className="data-[state=checked]:bg-indigo-600 scale-90"
                      />
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Card>
      
      <div className="flex items-center gap-2 p-4 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-400 text-xs">
        <ShieldCheck className="h-4 w-4 shrink-0" />
        <span>
          <strong>Nota de Segurança:</strong> Alterações de permissão entram em vigor imediatamente no portal. Todas as modificações são registradas na trilha de auditoria administrativa.
        </span>
      </div>
    </div>
  );
}
