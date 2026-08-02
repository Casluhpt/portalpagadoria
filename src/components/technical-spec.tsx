import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

interface TechnicalSpecProps {
  className?: string;
}

export function TechnicalSpec({ className }: TechnicalSpecProps) {
  return (
    <div className={cn("rounded-lg bg-indigo-50/50 border border-indigo-100 dark:bg-indigo-900/10 dark:border-indigo-900/30 overflow-hidden", className)}>
      <div className="bg-indigo-100/50 px-4 py-2 border-b border-indigo-100 dark:bg-indigo-900/30 dark:border-indigo-900/50 flex justify-between items-center">
        <h3 className="text-xs font-bold text-indigo-900 dark:text-indigo-300">Documentação Técnica e Engenharia de Prompt v2.0.0</h3>
        <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-medium">Especificação de Arquitetura</span>
      </div>
      <ScrollArea className="h-[250px] w-full p-4">
        <div className="text-[11px] leading-relaxed text-indigo-800 dark:text-indigo-300 whitespace-pre-line space-y-4">
          <p className="font-medium italic">
            Aqui está o compilado detalhado das informações fornecidas, estruturado especificamente no formato de especificações técnicas e requisitos de interface para ferramentas de desenvolvimento ágil como Lovable, v0 ou Bolt. O conteúdo foi setorizado de forma rigorosa e limpa, eliminando elementos informais e focando na precisão técnica dos fluxos e regras de negócio.
          </p>
          
          <div className="space-y-2">
            <h4 className="font-bold border-b border-indigo-200/50 pb-1">1. Módulo de Configurações e Canal de Suporte Técnico</h4>
            <div className="pl-2 space-y-2">
              <p><strong>Localização e Interface do Usuário</strong></p>
              <ul className="list-disc pl-4 space-y-1">
                <li>Incorporar na aba Configurações uma nova funcionalidade intitulada "Dúvidas, Sugestões e Melhorias".</li>
                <li>Apresentar ao usuário um formulário simplificado de envio contendo: Assunto (Bug, Erro, Melhoria), Anexo (Opcional) e Comentário.</li>
              </ul>
              <p><strong>Regras de Negócio e Back-end</strong></p>
              <ul className="list-disc pl-4 space-y-1">
                <li>Identificação automatizada do usuário via sessão autenticada.</li>
                <li>Disparo simultâneo de notificação ao administrador e inserção na "Central de Divergências".</li>
                <li>Mensagem de sucesso: "Enviado com sucesso! Obrigado por compartilhar."</li>
              </ul>
            </div>
          </div>

          <div className="space-y-2">
            <h4 className="font-bold border-b border-indigo-200/50 pb-1">2. Sistema de Fila Virtual e Controle de Concorrência</h4>
            <div className="pl-2 space-y-2">
              <p><strong>Localização e Objetivo</strong></p>
              <p>Operação na seção Pagamentos Diversos para gerenciar acesso simultâneo e mitigar conflitos de concorrência.</p>
              <p><strong>Fluxo de Entrada e Interface de Espera</strong></p>
              <ul className="list-disc pl-4 space-y-1">
                <li>Botão "Entrar na Fila" aloca usuário na estrutura de dados.</li>
                <li>Painel em tempo real: Posição, total retido, operador ativo, cronômetro e próximo da fila.</li>
                <li>Modo estritamente leitura enquanto retido na fila.</li>
              </ul>
              <p><strong>Liberação de Acesso e Alternância</strong></p>
              <ul className="list-disc pl-4 space-y-1">
                <li>Desbloqueio de interface ao atingir 1ª posição com sinalização visual.</li>
                <li>Botão "Encerrar Pagamento" ou timeout transaciona privilégio automaticamente.</li>
              </ul>
            </div>
          </div>

          <div className="space-y-2">
            <h4 className="font-bold border-b border-indigo-200/50 pb-1">3. Atualização Estrutural do Módulo de Despesas Fixas</h4>
            <div className="pl-2 space-y-2">
              <p><strong>Lançamentos e Regras de Competência</strong></p>
              <ul className="list-disc pl-4 space-y-1">
                <li>Lançamento ilimitado de notas fiscais para PJ, Penhora, Pensão e Fornecedores.</li>
                <li>Atributos obrigatórios: Nº Nota, Pedido, Valor, Emissão, Vencimento e Lançamento.</li>
                <li>Cálculo automático de Competência (M-1) com override manual.</li>
                <li>Segmentação PJ: Mensal, Adiantamento, Antecipação e PPR.</li>
              </ul>
              <p><strong>Gestão Orçamentária e Saldos</strong></p>
              <ul className="list-disc pl-4 space-y-1">
                <li>Deduzir valor da NF do saldo disponível do pedido automaticamente.</li>
                <li>Trava impeditiva ou alerta explícito em caso de violação de teto orçamentário.</li>
                <li>Rastreabilidade: pedido antigo/novo, conta, CC, empresa, ref PJ e SAP.</li>
              </ul>
            </div>
          </div>

          <div className="space-y-2 pt-2">
            <h4 className="font-bold border-b border-indigo-200/50 pb-1">4. Requisitos de Arquitetura e Engenharia de Software</h4>
            <ul className="list-disc pl-4 space-y-1">
              <li><strong>Escalabilidade:</strong> Modelagem extensível para integração com ERPs externos.</li>
              <li><strong>Tempo Real:</strong> Sincronização de estados via protocolos de baixa latência (WebSockets/Realtime).</li>
              <li><strong>Diretriz Visual:</strong> Padrões financeiros sóbrios (cinza industrial/azul escuro) com destaques funcionais.</li>
            </ul>
          </div>
        </div>
      </ScrollArea>
    </div>
  );
}
