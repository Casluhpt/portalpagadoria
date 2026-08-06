import { useState, useMemo } from "react";
import { 
  Search, 
  Calendar, 
  Download, 
  FileSpreadsheet, 
  AlertTriangle, 
  CheckCircle2, 
  XCircle,
  Trash2,
  ChevronRight,
  ShieldCheck,
  FileText,
  TrendingUp,
  ArrowRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ConciliacaoItem } from "@/lib/conciliacao-engine";

interface ConciliacaoResultadosViewProps {
  data: ConciliacaoItem[];
  onClear: () => void;
}

export function ConciliacaoResultadosView({ data, onClear }: ConciliacaoResultadosViewProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedEmpresa, setSelectedEmpresa] = useState("todas");
  const [selectedStatus, setSelectedStatus] = useState("todos");
  const [selectedDate, setSelectedDate] = useState("");

  const brl = (n: number) => 
    n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  const filteredData = useMemo(() => {
    return data.filter(item => {
      const matchesSearch = 
        item.empresa.toLowerCase().includes(searchTerm.toLowerCase()) || 
        (item.descricao?.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (item.favorecido?.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchesEmpresa = selectedEmpresa === "todas" || item.empresa.toLowerCase() === selectedEmpresa.toLowerCase();
      const matchesStatus = selectedStatus === "todos" || item.status?.toLowerCase() === selectedStatus.toLowerCase();
      const matchesDate = !selectedDate || item.data.includes(selectedDate);
      
      return matchesSearch && matchesEmpresa && matchesStatus && matchesDate;
    });
  }, [data, searchTerm, selectedEmpresa, selectedStatus, selectedDate]);

  const stats = useMemo(() => {
    const total = data.length;
    const conciliados = data.filter(i => i.status === "Conciliado").length;
    const divergentes = data.filter(i => i.status === "Divergente").length;
    const pendentes = data.filter(i => i.status === "Pendente").length;
    const valorTotal = data.reduce((acc, i) => acc + i.valor, 0);
    
    return {
      total,
      conciliados,
      divergentes,
      pendentes,
      valorTotal,
      percentual: total > 0 ? (conciliados / total) * 100 : 0
    };
  }, [data]);

  const empresas = Array.from(new Set(data.map(i => i.empresa))).sort();

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Resumo de Conciliação */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-card/40 backdrop-blur-md border border-white/10 shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Status Geral</span>
            <TrendingUp className="h-4 w-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-bold text-foreground">{stats.percentual.toFixed(1)}%</div>
          <div className="text-[10px] text-muted-foreground mt-1">Nível de conciliação automática</div>
        </div>
        <div className="p-4 rounded-2xl bg-card/40 backdrop-blur-md border border-white/10 shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Conciliados</span>
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-bold text-emerald-500">{stats.conciliados}</div>
          <div className="text-[10px] text-muted-foreground mt-1">Registros validados</div>
        </div>
        <div className="p-4 rounded-2xl bg-card/40 backdrop-blur-md border border-white/10 shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Divergentes</span>
            <AlertTriangle className="h-4 w-4 text-amber-500" />
          </div>
          <div className="text-2xl font-bold text-amber-500">{stats.divergentes}</div>
          <div className="text-[10px] text-muted-foreground mt-1">Necessitam justificativa</div>
        </div>
        <div className="p-4 rounded-2xl bg-card/40 backdrop-blur-md border border-white/10 shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Valor Total</span>
            <FileSpreadsheet className="h-4 w-4 text-primary" />
          </div>
          <div className="text-2xl font-bold text-foreground truncate">{brl(stats.valorTotal)}</div>
          <div className="text-[10px] text-muted-foreground mt-1">Montante em conciliação</div>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="flex flex-wrap items-center gap-3 p-4 rounded-xl bg-card/40 backdrop-blur-md border border-white/10 shadow-lg">
        <div className="flex items-center gap-2 mr-2">
          <FileText className="h-5 w-5 text-primary/70" />
          <h2 className="text-sm font-bold text-foreground">Resultados</h2>
          <Badge variant="secondary" className="h-5 px-1.5 text-[10px] bg-white/5 border-white/10 text-muted-foreground">
            {filteredData.length} itens
          </Badge>
        </div>

        <div className="flex-1 min-w-[200px] relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input 
            placeholder="Buscar descrição, banco ou favorecido..." 
            className="pl-9 h-9 bg-white/5 border-white/10 text-xs focus-visible:ring-primary/30"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <Select value={selectedEmpresa} onValueChange={setSelectedEmpresa}>
          <SelectTrigger className="w-[160px] h-9 bg-white/5 border-white/10 text-xs">
            <SelectValue placeholder="Empresa" />
          </SelectTrigger>
          <SelectContent className="bg-background/95 backdrop-blur-xl border-white/10">
            <SelectItem value="todas">Todas as empresas</SelectItem>
            {empresas.map(emp => (
              <SelectItem key={emp} value={emp.toLowerCase()}>{emp}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={selectedStatus} onValueChange={setSelectedStatus}>
          <SelectTrigger className="w-[140px] h-9 bg-white/5 border-white/10 text-xs">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent className="bg-background/95 backdrop-blur-xl border-white/10">
            <SelectItem value="todos">Todos os status</SelectItem>
            <SelectItem value="conciliado">Conciliados</SelectItem>
            <SelectItem value="divergente">Divergentes</SelectItem>
            <SelectItem value="pendente">Pendentes</SelectItem>
          </SelectContent>
        </Select>

        <Button 
          variant="ghost" 
          size="sm" 
          className="h-9 px-3 text-xs text-red-400 hover:text-red-300 hover:bg-red-500/10 gap-2 border border-red-500/20"
          onClick={onClear}
        >
          <Trash2 className="h-3.5 w-3.5" />
          Nova Importação
        </Button>
      </div>

      {/* Main Table Area */}
      <div className="rounded-2xl border border-white/10 bg-card/30 backdrop-blur-2xl overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-white/5">
              <TableRow className="hover:bg-transparent border-white/10">
                <TableHead className="w-[40px]"></TableHead>
                <TableHead className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground px-4">Data</TableHead>
                <TableHead className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground px-4">Empresa / Banco</TableHead>
                <TableHead className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground px-4">Descrição / Favorecido</TableHead>
                <TableHead className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground text-right px-4">Valor Banco</TableHead>
                <TableHead className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground text-right px-4">Valor Portal</TableHead>
                <TableHead className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground text-right px-4">Diferença</TableHead>
                <TableHead className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground px-4 text-center">Nível / Confiança</TableHead>
                <TableHead className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground px-4 text-center">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredData.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="h-32 text-center text-muted-foreground text-xs italic">
                    Nenhum registro encontrado.
                  </TableCell>
                </TableRow>
              ) : (
                filteredData.map((item, idx) => (
                  <TableRow key={idx} className="hover:bg-white/5 border-white/5 group transition-colors">
                    <TableCell className="px-4 text-center">
                      <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/50 group-hover:text-primary transition-transform group-hover:translate-x-0.5" />
                    </TableCell>
                    <TableCell className="px-4 text-[11px] font-medium text-foreground whitespace-nowrap">
                      {item.data}
                    </TableCell>
                    <TableCell className="px-4 py-3">
                      <div className="flex flex-col gap-0.5">
                        <span className="text-[11px] font-bold text-foreground uppercase tracking-wider">{item.empresa}</span>
                        <span className="text-[9px] text-muted-foreground flex items-center gap-1">
                          <ShieldCheck className="h-2.5 w-2.5" /> {item.banco || "Não identificado"}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="px-4 py-3 max-w-[200px]">
                      <div className="flex flex-col gap-0.5">
                        <span className="text-[10px] text-foreground font-medium truncate leading-tight">{item.descricao || "S/ descrição"}</span>
                        <span className="text-[9px] text-muted-foreground truncate italic">{item.favorecido || "--"}</span>
                      </div>
                    </TableCell>
                    <TableCell className="px-4 text-[11px] font-bold text-right text-foreground whitespace-nowrap">
                      {brl(item.valor)}
                    </TableCell>
                    <TableCell className="px-4 text-[11px] font-bold text-right text-foreground whitespace-nowrap opacity-60">
                      {item.valorPortal ? brl(item.valorPortal) : "--"}
                    </TableCell>
                    <TableCell className={cn(
                      "px-4 text-[11px] font-bold text-right whitespace-nowrap",
                      (item.diferenca || 0) > 0 ? "text-amber-400" : (item.diferenca || 0) < 0 ? "text-red-400" : "text-emerald-400"
                    )}>
                      {item.diferenca !== undefined ? brl(item.diferenca) : "--"}
                    </TableCell>
                    <TableCell className="px-4 text-center">
                      <div className="flex flex-col items-center gap-1">
                        <Badge variant="outline" className="h-5 px-1.5 text-[8px] border-white/10 bg-white/5 text-muted-foreground">
                          NÍVEL {item.nivel || 5}
                        </Badge>
                        <span className={cn(
                          "text-[9px] font-bold",
                          (item.score || 0) >= 75 ? "text-emerald-500" : (item.score || 0) >= 40 ? "text-amber-500" : "text-muted-foreground"
                        )}>
                          {item.score || 0}%
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="px-4 text-center">
                      <Badge 
                        variant="outline" 
                        className={cn(
                          "h-6 px-3 text-[9px] font-bold uppercase tracking-widest border-0 min-w-[90px] justify-center",
                          item.status === "Conciliado" && "bg-emerald-500/10 text-emerald-500 ring-1 ring-inset ring-emerald-500/20",
                          item.status === "Divergente" && "bg-amber-500/10 text-amber-500 ring-1 ring-inset ring-amber-500/20",
                          item.status === "Pendente" && "bg-muted text-muted-foreground ring-1 ring-inset ring-white/10",
                          item.status === "Recusado" && "bg-red-500/10 text-red-500 ring-1 ring-inset ring-red-500/20"
                        )}
                      >
                        <span className="flex items-center gap-1.5">
                          {item.status === "Conciliado" && <CheckCircle2 className="h-2.5 w-2.5" />}
                          {item.status === "Divergente" && <AlertTriangle className="h-2.5 w-2.5" />}
                          {item.status === "Pendente" && <XCircle className="h-2.5 w-2.5" />}
                          {item.status}
                        </span>
                      </Badge>
                      {item.motivoDivergencia && (
                        <div className="text-[8px] text-amber-500/70 mt-1 italic font-medium uppercase tracking-tighter">
                          {item.motivoDivergencia}
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Justification / Help Panel */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-4 rounded-xl bg-primary/5 border border-primary/10 flex items-start gap-4">
          <div className="h-8 w-8 rounded-lg bg-primary/20 flex items-center justify-center shrink-0">
            <ShieldCheck className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-foreground uppercase tracking-widest mb-1">Painel de Justificativa</h4>
            <p className="text-[10px] text-muted-foreground leading-relaxed">
              Registros divergentes foram identificados por discrepância de valores inferiores a R$ 20,00 (Tarifas) ou montantes superiores vinculados a Juros/IOF. Administradores podem realizar a conciliação manual clicando em cada linha.
            </p>
          </div>
        </div>
        
        <div className="p-4 rounded-xl bg-amber-500/5 border border-amber-500/10 flex items-start gap-4">
          <div className="h-8 w-8 rounded-lg bg-amber-500/20 flex items-center justify-center shrink-0">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-amber-500 uppercase tracking-widest mb-1">Exportação Inteligente</h4>
            <p className="text-[10px] text-muted-foreground leading-relaxed">
              O relatório detalhado com o score de confiança e a memória de cálculo dos Níveis 3 e 4 já foi gerado e enviado para o seu sino de notificações.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
