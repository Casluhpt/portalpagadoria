function RegistroDialog({
  linha, mes, ano, onClose, onSave, onDelete,
}: {
  linha: LinhaAgrupada; mes: number; ano: number;
  onClose: () => void;
  onSave: (payload: any) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}) {
  const existente = linha.registros[mes - 1];
  
  // Suporte a múltiplos lançamentos (NF com vários pedidos ou rateio)
  const [entries, setEntries] = useState<any[]>(
    existente ? [{ ...existente, valor: String(existente.valor).replace(".", ",") }] : [{ valor: "", numero_pedido: linha.meta.numero_pedido ?? "" }]
  );

  const [tipo, setTipo] = useState<"mensal" | "adiantamento" | "antecipação" | "ppr">((existente?.tipo as any) ?? "mensal");
  const [numeroNf, setNumeroNf] = useState(existente?.numero_nf ?? "");
  const [dataLanc, setDataLanc] = useState(existente?.data_lancamento ?? format(new Date(), "yyyy-MM-dd"));
  const [dataVenc, setDataVenc] = useState(existente?.data_vencimento ?? "");
  const [dataEmissao, setDataEmissao] = useState((existente as any)?.data_emissao ?? "");
  const [competencia, setCompetencia] = useState((existente as any)?.competencia ?? (mes > 1 ? MESES[mes - 2] : MESES[11]));
  const [lancado, setLancado] = useState(!!existente?.lancado);
  const [saving, setSaving] = useState(false);

  const addEntry = () => setEntries([...entries, { valor: "", numero_pedido: linha.meta.numero_pedido ?? "" }]);
  const removeEntry = (i: number) => setEntries(entries.filter((_, idx) => idx !== i));
  const updateEntry = (i: number, field: string, val: string) => {
    const next = [...entries];
    next[i] = { ...next[i], [field]: val };
    setEntries(next);
  };

  const total = entries.reduce((acc, curr) => {
    const v = parseFloat(String(curr.valor).replace(/\./g, "").replace(",", "."));
    return acc + (Number.isFinite(v) ? v : 0);
  }, 0);

  const submit = async () => {
    if (entries.some(e => !parseFloat(String(e.valor).replace(/\./g, "").replace(",", ".")))) {
      toast.error("Informe um valor válido para todos os itens");
      return;
    }
    
    setSaving(true);
    try {
      // Por enquanto, salvamos como um único registro consolidado ou o primeiro se for edição
      // Em uma Fase 3, poderíamos explodir em múltiplos registros no banco
      const first = entries[0];
      const v = parseFloat(String(first.valor).replace(/\./g, "").replace(",", "."));
      
      await onSave({
        id: existente?.id,
        categoria: linha.categoria, descricao: linha.descricao, ano, mes,
        valor: v, tipo,
        numero_pedido: first.numero_pedido || null,
        numero_nf: numeroNf || null,
        data_lancamento: dataLanc || null,
        data_vencimento: dataVenc || null,
        data_emissao: dataEmissao || null,
        competencia: competencia || null,
        lancado,
        // metadata para múltiplos se necessário
        meta: entries.length > 1 ? { entries } : null
      });
    } finally { setSaving(false); }
  };

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{linha.descricao} — {MESES[mes - 1]}/{ano}</DialogTitle>
          <DialogDescription>{linha.categoria} · {linha.meta.empresa_nome ?? "sem empresa"}</DialogDescription>
        </DialogHeader>
        
        <div className="grid grid-cols-1 gap-6 py-4 md:grid-cols-2">
          <div className="space-y-4">
            <div className="flex items-center gap-2 rounded-md border bg-slate-50 p-3">
              <Checkbox id="lancado" checked={lancado} onCheckedChange={(v) => setLancado(!!v)} />
              <Label htmlFor="lancado" className="cursor-pointer text-sm font-medium">
                Já foi lançado no sistema
              </Label>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Tipo de Gasto</Label>
                <Select value={tipo} onValueChange={(v) => setTipo(v as any)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="mensal">Mensal</SelectItem>
                    <SelectItem value="adiantamento">Adiantamento</SelectItem>
                    <SelectItem value="antecipação">Antecipação</SelectItem>
                    <SelectItem value="ppr">PPR</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Competência</Label>
                <Select value={competencia} onValueChange={setCompetencia}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {MESES.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <Label>Nº da Nota Fiscal</Label>
                <Input value={numeroNf} onChange={(e) => setNumeroNf(e.target.value)} placeholder="000.000" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-[11px]">Emissão NF</Label>
                  <Input type="date" value={dataEmissao} onChange={(e) => setDataEmissao(e.target.value)} className="h-8 text-xs" />
                </div>
                <div>
                  <Label className="text-[11px]">Vencimento</Label>
                  <Input type="date" value={dataVenc} onChange={(e) => setDataVenc(e.target.value)} className="h-8 text-xs" />
                </div>
              </div>
              <div>
                <Label className="text-[11px]">Data de Lançamento (Pagamento)</Label>
                <Input type="date" value={dataLanc} onChange={(e) => setDataLanc(e.target.value)} className="h-8 text-xs" />
              </div>
            </div>
          </div>

          <div className="flex flex-col space-y-4 border-l pl-6">
            <div className="flex items-center justify-between">
              <Label className="text-base font-bold">Itens / Rateio</Label>
              <Button variant="ghost" size="sm" onClick={addEntry} className="h-7 text-indigo-600">
                <Plus className="mr-1 h-3 w-3" /> Add Item
              </Button>
            </div>

            <div className="max-h-[300px] space-y-3 overflow-y-auto pr-2">
              {entries.map((entry, i) => (
                <div key={i} className="relative space-y-2 rounded-lg border p-3 pt-4">
                  {entries.length > 1 && (
                    <button 
                      onClick={() => removeEntry(i)}
                      className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-rose-100 text-rose-600 hover:bg-rose-200"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  )}
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label className="text-[10px] uppercase text-muted-foreground">Pedido</Label>
                      <Input 
                        value={entry.numero_pedido} 
                        onChange={(e) => updateEntry(i, 'numero_pedido', e.target.value)} 
                        placeholder="123..."
                        className="h-8 text-xs"
                      />
                    </div>
                    <div>
                      <Label className="text-[10px] uppercase text-muted-foreground">Valor</Label>
                      <Input 
                        value={entry.valor} 
                        onChange={(e) => updateEntry(i, 'valor', e.target.value)} 
                        placeholder="0,00"
                        className="h-8 text-xs"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-auto rounded-md bg-indigo-50 p-3">
              <div className="flex items-center justify-between text-indigo-900">
                <span className="text-xs font-medium uppercase">Total Consolidado</span>
                <span className="text-lg font-bold">{brl(total)}</span>
              </div>
              {linha.meta.valor_previsto_anual && (
                <div className="mt-2 space-y-1">
                  <div className="flex justify-between text-[10px] text-indigo-600">
                    <span>Orçamento Mensal</span>
                    <span>{brl(linha.meta.valor_previsto_anual / 12)}</span>
                  </div>
                  <Progress value={Math.min(100, (total / (linha.meta.valor_previsto_anual / 12)) * 100)} className="h-1 bg-indigo-200" />
                </div>
              )}
            </div>
          </div>
        </div>

        <DialogFooter className="border-t pt-4">
          {existente ? (
            <Button variant="ghost" className="text-destructive hover:bg-rose-50"
              onClick={() => onDelete(existente.id)}>
              <Trash2 className="mr-2 h-4 w-4" /> Remover
            </Button>
          ) : <div />}
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose}>Cancelar</Button>
            <Button onClick={submit} disabled={saving} className="bg-indigo-600 hover:bg-indigo-700">
              {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle2 className="mr-2 h-4 w-4" />}
              {existente ? "Atualizar" : "Confirmar Lançamento"}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
