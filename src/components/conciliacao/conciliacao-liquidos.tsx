import { useState, useMemo } from "react";
import { 
  Search, 
  Calendar, 
  ChevronDown, 
  Download, 
  Filter, 
  FileSpreadsheet, 
  AlertTriangle, 
  CheckCircle2, 
  XCircle,
  Clock,
  Trash2,
  ChevronRight,
  ShieldCheck,
  FileText
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

interface Divergencia {
  id: string;
  data: string;
  empresa: string;
  arquivoOrigem: string;
  valorControle: number;
  valorBanco: number;
  rejeitado: number;
  diferenca: number;
  ajuste: number;
  justificativa: string;
  status: "Divergente" | "Rejeitado" | "Conciliado";
}

const DUMMY_DATA: Divergencia[] = [
  {
    id: "1",
    data: "2026-07-20",
    empresa: "PROFARMA",
    arquivoOrigem: "Controle de Pagamentos (valor maior)",
    valorControle: 5265379.57,
    valorBanco: 5225756.16,
    rejeitado: 0,
    diferenca: 39623.41,
    ajuste: 0,
    justificativa: "",
    status: "Divergente"
  },
  {
    id: "2",
    data: "2026-07-21",
    empresa: "PROFARMA",
    arquivoOrigem: "Extrato Bancário (pagamento rejeitado)",
    valorControle: 15357.93,
    valorBanco: 14430.13,
    rejeitado: 927.80,
    diferenca: 0,
    ajuste: 927.80,
    justificativa: "Pagamento rejeitado - Pagamento...",
    status: "Rejeitado"
  },
  {
    id: "3",
    data: "2026-07-22",
    empresa: "PROFARMA",
    arquivoOrigem: "Extrato Bancário (pagamento rejeitado)",
    valorControle: 40833.87,
    valorBanco: 40522.07,
    rejeitado: 311.80,
    diferenca: 0,
    ajuste: 311.80,
    justificativa: "Pagamento rejeitado - Pagamento...",
    status: "Rejeitado"
  },
  {
    id: "4",
    data: "2026-07-23",
    empresa: "PROFARMA",
    arquivoOrigem: "Extrato Bancário (pagamento rejeitado)",
    valorControle: 95417.40,
    valorBanco: 94923.80,
    rejeitado: 493.60,
    diferenca: 493.60,
    ajuste: 0,
    justificativa: "",
    status: "Rejeitado"
  }
];

export function ConciliacaoLiquidosView() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedEmpresa, setSelectedEmpresa] = useState("todas");
  const [selectedStatus, setSelectedStatus] = useState("todos");
  const [selectedDate, setSelectedDate] = useState("");

  const brl = (n: number) => 
    n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  const filteredData = useMemo(() => {
    return DUMMY_DATA.filter(item => {
      const matchesSearch = item.empresa.toLowerCase().includes(searchTerm.toLowerCase()) || 
                           item.arquivoOrigem.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesEmpresa = selectedEmpresa === "todas" || item.empresa.toLowerCase() === selectedEmpresa.toLowerCase();
      const matchesStatus = selectedStatus === "todos" || item.status.toLowerCase() === selectedStatus.toLowerCase();
      const matchesDate = !selectedDate || item.data === selectedDate;
      
      return matchesSearch && matchesEmpresa && matchesStatus && matchesDate;
    });
  }, [searchTerm, selectedEmpresa, selectedStatus, selectedDate]);

  return (
    <div className="space-y-6">
      {/* Filters Bar - Refined like the reference */}
      <div className="flex flex-wrap items-center gap-3 p-4 rounded-xl bg-card/40 backdrop-blur-md border border-white/10 shadow-lg">
        <div className="flex items-center gap-2 mr-2">
          <FileText className="h-5 w-5 text-primary/70" />
          <h2 className="text-sm font-bold text-foreground">Divergências diárias</h2>
          <Badge variant="secondary" className="h-5 px-1.5 text-[10px] bg-white/5 border-white/10 text-muted-foreground">
            {filteredData.length} linhas
          </Badge>
        </div>

        <div className="flex-1 min-w-[200px] relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input 
            placeholder="Buscar empresa ou descrição..." 
            className="pl-9 h-9 bg-white/5 border-white/10 text-xs focus-visible:ring-primary/30"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <Select value={selectedEmpresa} onValueChange={setSelectedEmpresa}>
          <SelectTrigger className="w-[160px] h-9 bg-white/5 border-white/10 text-xs">
            <SelectValue placeholder="Todas as empresas" />
          </SelectTrigger>
          <SelectContent className="bg-background/95 backdrop-blur-xl border-white/10">
            <SelectItem value="todas">Todas as empresas</SelectItem>
            <SelectItem value="profarma">PROFARMA</SelectItem>
          </SelectContent>
        </Select>

        <Select value={selectedStatus} onValueChange={setSelectedStatus}>
          <SelectTrigger className="w-[140px] h-9 bg-white/5 border-white/10 text-xs">
            <SelectValue placeholder="Somente..." />
          </SelectTrigger>
          <SelectContent className="bg-background/95 backdrop-blur-xl border-white/10">
            <SelectItem value="todos">Todos os status</SelectItem>
            <SelectItem value="divergente">Divergentes</SelectItem>
            <SelectItem value="rejeitado">Rejeitados</SelectItem>
            <SelectItem value="conciliado">Conciliados</SelectItem>
          </SelectContent>
        </Select>

        <div className="relative">
          <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input 
            type="date" 
            className="pl-9 h-9 w-[150px] bg-white/5 border-white/10 text-xs [color-scheme:dark]"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
          />
        </div>

        <Button 
          variant="ghost" 
          size="sm" 
          className="h-9 px-3 text-xs text-red-400 hover:text-red-300 hover:bg-red-500/10 gap-2 border border-red-500/20"
          onClick={() => {
            setSearchTerm("");
            setSelectedEmpresa("todas");
            setSelectedStatus("todos");
            setSelectedDate("");
          }}
        >
          <Trash2 className="h-3.5 w-3.5" />
          Limpar Conciliação
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
                <TableHead className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground px-4">Empresa</TableHead>
                <TableHead className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground px-4">Arquivo de Origem</TableHead>
                <TableHead className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground text-right px-4">Valor Controle</TableHead>
                <TableHead className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground text-right px-4">Valor Banco</TableHead>
                <TableHead className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground text-right px-4">Rejeitado</TableHead>
                <TableHead className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground text-right px-4">Diferença</TableHead>
                <TableHead className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground text-right px-4">Ajuste</TableHead>
                <TableHead className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground px-4">Justificativa</TableHead>
                <TableHead className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground px-4 text-center">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredData.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={11} className="h-32 text-center text-muted-foreground text-xs italic">
                    Nenhum registro encontrado com os filtros aplicados.
                  </TableCell>
                </TableRow>
              ) : (
                filteredData.map((item) => (
                  <TableRow key={item.id} className="hover:bg-white/5 border-white/5 group transition-colors">
                    <TableCell className="px-4">
                      <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/50 group-hover:text-primary transition-transform group-hover:translate-x-0.5" />
                    </TableCell>
                    <TableCell className="px-4 text-[11px] font-medium text-foreground whitespace-nowrap">
                      {format(new Date(item.data), "dd/MM/yyyy")}
                    </TableCell>
                    <TableCell className="px-4 text-[11px] font-bold text-foreground">
                      {item.empresa}
                    </TableCell>
                    <TableCell className="px-4 text-[10px] text-muted-foreground leading-tight max-w-[180px]">
                      {item.arquivoOrigem}
                    </TableCell>
                    <TableCell className="px-4 text-[11px] font-bold text-right text-foreground whitespace-nowrap">
                      {brl(item.valorControle)}
                    </TableCell>
                    <TableCell className="px-4 text-[11px] font-bold text-right text-foreground whitespace-nowrap">
                      {brl(item.valorBanco)}
                    </TableCell>
                    <TableCell className={cn(
                      "px-4 text-[11px] font-bold text-right whitespace-nowrap",
                      item.rejeitado > 0 ? "text-red-400" : "text-foreground/40"
                    )}>
                      {brl(item.rejeitado)}
                    </TableCell>
                    <TableCell className={cn(
                      "px-4 text-[11px] font-bold text-right whitespace-nowrap",
                      item.diferenca > 0 ? "text-amber-400" : "text-emerald-400"
                    )}>
                      {brl(item.diferenca)}
                    </TableCell>
                    <TableCell className={cn(
                      "px-4 text-[11px] font-bold text-right whitespace-nowrap",
                      item.ajuste > 0 ? "text-blue-400" : "text-foreground/40"
                    )}>
                      {item.ajuste > 0 ? brl(item.ajuste) : "--"}
                    </TableCell>
                    <TableCell className="px-4 text-[10px] text-muted-foreground italic truncate max-w-[150px]">
                      {item.justificativa || "--"}
                    </TableCell>
                    <TableCell className="px-4 text-center">
                      <Badge 
                        variant="outline" 
                        className={cn(
                          "h-6 px-3 text-[9px] font-bold uppercase tracking-widest border-0",
                          item.status === "Divergente" && "bg-amber-500/10 text-amber-500 ring-1 ring-inset ring-amber-500/20",
                          item.status === "Rejeitado" && "bg-red-500/10 text-red-500 ring-1 ring-inset ring-red-500/20",
                          item.status === "Conciliado" && "bg-emerald-500/10 text-emerald-500 ring-1 ring-inset ring-emerald-500/20"
                        )}
                      >
                        <span className="flex items-center gap-1.5">
                          {item.status === "Divergente" && <AlertTriangle className="h-2.5 w-2.5" />}
                          {item.status === "Rejeitado" && <XCircle className="h-2.5 w-2.5" />}
                          {item.status === "Conciliado" && <CheckCircle2 className="h-2.5 w-2.5" />}
                          {item.status}
                        </span>
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Footer Info Area - Refined aesthetics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-4 rounded-xl bg-primary/5 border border-primary/10 flex items-start gap-4">
          <div className="h-8 w-8 rounded-lg bg-primary/20 flex items-center justify-center shrink-0">
            <ShieldCheck className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-foreground uppercase tracking-widest mb-1">Inteligência de Liquidação</h4>
            <p className="text-[10px] text-muted-foreground leading-relaxed">
              O sistema identifica automaticamente discrepâncias entre a base de controle Profarma e os extratos bancários consolidados, categorizando por níveis de criticidade e facilitando a reconciliação de pagamentos rejeitados.
            </p>
          </div>
        </div>
        
        <div className="p-4 rounded-xl bg-amber-500/5 border border-amber-500/10 flex items-start gap-4">
          <div className="h-8 w-8 rounded-lg bg-amber-500/20 flex items-center justify-center shrink-0">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-amber-500 uppercase tracking-widest mb-1">Pendências de Ajuste</h4>
            <p className="text-[10px] text-muted-foreground leading-relaxed">
              Registros marcados como "Divergente" requerem ação manual ou justificativa para fechamento da competência. O "Ajuste" reflete a correção aplicada para equilibrar o saldo Profarma vs Banco.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
