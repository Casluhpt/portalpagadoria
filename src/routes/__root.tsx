import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";
import { Toaster } from "sonner";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { PasswordExpirationGuard } from "@/components/password-expiration-guard";
import { PresenceHeartbeat } from "@/components/presence-heartbeat";
import { BackButton } from "@/components/back-button";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          This page didn't load
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Something went wrong on our end. You can try refreshing or head back home.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Try again
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Painel — Dashboard" },
      { name: "description", content: "Dashboard organizado para acompanhar suas informações e métricas." },
      { name: "author", content: "Lovable" },
      { property: "og:title", content: "Painel — Dashboard" },
      { property: "og:description", content: "Dashboard organizado para acompanhar suas informações e métricas." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "Painel — Dashboard" },
      { name: "twitter:description", content: "Dashboard organizado para acompanhar suas informações e métricas." },
      { property: "og:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/9e0efddf-25f3-48a7-a81d-6b5d3513c176/id-preview-843d2090--b115d0ef-31c1-4eaf-ba75-a15cccb4115b.lovable.app-1784053619178.png" },
      { name: "twitter:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/9e0efddf-25f3-48a7-a81d-6b5d3513c176/id-preview-843d2090--b115d0ef-31c1-4eaf-ba75-a15cccb4115b.lovable.app-1784053619178.png" },
    ],
    links: [
      {
        rel: "stylesheet",
        href: appCss,
      },
      { rel: "icon", href: "/favicon.ico", type: "image/x-icon" },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body className="group/body">
        <div className="fixed top-0 left-0 z-[9999] opacity-0 group-hover/body:opacity-100 pointer-events-none p-2 bg-black/50 text-white text-[10px] whitespace-pre-wrap">
          Correção e Addons do Portal da Pagadoria v1.6.0{"\n"}{"\n"}
          correções:{"\n"}
          Verificação dos erros apresentados no portal da pagadoria.{"\n"}
          identificação dos erros apresentados no card “resultados principais”{"\n"}{"\n"}
          verificar erros e estabilidades referente ao card de “Dashboard Executivo” e avalie a melhor construção de visão gestor referente a apresentação de resultados e vincule no “dashboard Gerencial” que se encontra no lado esquerdo no modo de governança.{"\n"}{"\n"}
          adicionar na administração de usuários o setor “Pagadoria” que vai ser vinculado diretamente ao Administrador do site.{"\n"}{"\n"}
          limpeza de dados na “base” da “provisão diária”.{"\n"}
          &shy;{"\n"}
          la base de provisão será preenchido de forma automática de acordo com oque é necessário retirando as informações da base de "pagamentos diversos" nesse caso será de forma automática diariamente.{"\n"}{"\n"}
          separe a base da provisão por mês também.{"\n"}{"\n"}
          Mude o formato da data da base da provisão, exemplo.: "2026-07-15" e deixe em formato "15/07/2026"{"\n"}{"\n"}
          o card de “provisão diária” deverá constar com uma opção de botão de ação chamada de “Fechamento de competência”, dando uma opção para renomear em formato padrão que salvara em formato Excel uma base completa em “fechamento de competência” nessa área será separada por card, e com os meses definidos dos salvos. Assim que o fechamento for realizado deverá limpar a “base” de “provisão diária” para iniciar um novo ciclo.{"\n"}
          na tela de "fechamento de competência" coloque um botão vermelho no superior e deixe isso como informativo.{"\n"}{"\n"}
          &nbsp;{"\n"}{"\n"}
          O setor informado como “Visitante” deverá ter a nomenclatura de “Gerência/Visitante”{"\n"}{"\n"}
          Adicionar:{"\n"}
          um modulo na lateral esquerda chamada de “material de apoio”&gt; somente o administrador poderá adicionar informações referente ao suporte do portal, porém todos os usuários poderão acessar para tirar duvidas ou até mesmo baixar em modo pdf o material.{"\n"}{"\n"}
          na aba de “material de apoio” colocar uma caixa de pesquisa e perguntar qual e a duvida da pessoa, oferecendo sugestões do que tem dentro dos materiais ou oque o portal oferece.{"\n"}{"\n"}
          o material deverá ficar personalizado de acordo o portal.{"\n"}{"\n"}
          Na tela principal na parte centro superior adicionar uma caixa de busca/pesquisar de central de busca total para pesquisar tudo relacionado ou vinculado ao portal da pagadoria exemplo.: matricula, usuário, empresa, colaborador, fornecedor, competências e cards, fazer um direcionamento direto após o clique no resultado pesquisado.{"\n"}
          na mesma caixa de busca adicionar uma IA assistente da pagadoria, que também será vinculado ao card ao um modulo na barra lateral esquerda chamada de “material de apoio” que servira como ajuda e busca.{"\n"}{"\n"}
          ao perfil de usuário adicionar a opção do modo claro/noturno/usuario e colocar uma opção para ativar de forma automática de acordo com a hora que o usuário tiver interesse.{"\n"}{"\n"}
          nas bases de todos os card deverão ser padronizadas de acordo com o modelo mais completo (assim apresentando uma opção de base mais completa e padronizada).{"\n"}{"\n"}
          no material de apoio de a opção de favoritar/desfavoritar. o conteúdo que o usuário quiser.{"\n"}{"\n"}
          No material de apoio de uma opção de clicar em todos os conteúdos e no favoritos. Assim todo conteúdo favoritado será direcionado para verificação na pasta.{"\n"}{"\n"}
          as novas bases dos cards deverão contar com um novo modelo de “modo de importação” dando opção caixa para selecionar “incremental (adicionar aos existentes)” e “substituir a base (apagar tudo antes)”.{"\n"}{"\n"}
          o card de “pagamentos diversos” devera constar com uma opção de botão de ação chamada de “Fechamento de competência”, dando uma opção para renomear em formato padrão que salvara em formato Excel uma base completa em “fechamento de competência” nessa área será separada por card, e com os meses definidos dos salvos. Assim que o fechamento for realizado deverá limpar a base de pagamentos diversos para iniciar um novo ciclo.{"\n"}
          na tela de "fechamento de competência" coloque um botão vermelho no superior e deixe isso como informativo.{"\n"}{"\n"}
          quando a competência de “pagamentos diversos” for fechada é para notificar todos os colaboradores pelo menos 2/1 dias antes (notificando no portal e no email).{"\n"}{"\n"}{"\n"}
          Conciliação bancaria.{"\n"}
          PRIMEIRA ETAPA{"\n"}
          eu preciso que na conciliação seja apresentado uma opção de seleção da competência tanto aberta tanto fechada da “base pagamentos diversos”, deverá ser apresentado de forma completa para avaliação dos valores. poderá ter a opção de selecionar mais de um mês ou mais de uma competência. Será importada uma planilha com a nomenclatura “Varejo” ou “Distribuição” com empresas, valores, datas, que eu preciso que o sistema faça uma avaliação dos valores que batem de acordo com a empresa, datas e valores. Caso o não concilie de acordo, preciso que o sistema comece a somar quais valores seriam exatos dentro do arquivo enviado seguindo empresa, e a data ou datas proximas, trazendo a diferença e apontando em destaque. Após encontrar os valores. Fechar dando a opção de baixar o arquivo em excel com duas sheets, primeira sheet “Distribuição” ou “Varejo”” com a apresentação do primeira planilha importada e a segunda sheet com as diferenças encontradas que batem com o valor da primeira sheet apresentada.{"\n"}
          NA SEGUNDA ETAPA{"\n"}
          eu vou precisar que a base de pagamentos diversos seja referencia para fazer a conciliação semanal, a conciliação será filtrada por data. exemplo.: “de xx/xx/xxxx a xx/xx/xxxx” e isso ele precisara fazer um arquivo em formato excel com os títulos da base de “pagamentos diversos” e com as datas filtradas.{"\n"}{"\n"}
          após baixado deve ser notificado no sino dando a opção de baixar diretamente o arquivo, porém também deve ser direcionado para “base de anexos” aonde terá uma pasta chamada de “conciliação bancaria” que apresentara as opções das conciliações semanais baixadas.{"\n"}{"\n"}{"\n"}
          Adicionar opções de atalho com o CRLT em todo portal da pagadoria, as opções para entender oque cada opção faz pode ficar disponível no “material de apoio”.{"\n"}{"\n"}
          Todo arquivo extraído/baixado deverá aparecer no sino de notificações.{"\n"}{"\n"}
          ## 16. PROTEÇÃO, BACKUP E INTEGRIDADE{"\n"}{"\n"}
          &nbsp;{"\n"}{"\n"}
          Aplicar regras fortes de proteção dos dados:{"\n"}
          - Não permitir exclusão física em nenhum módulo{"\n"}
          - Manter histórico integral de alterações{"\n"}
          - Registrar todas as ações críticas{"\n"}
          - Criar snapshots mensais da competência no momento do fechamento{"\n"}
          - Garantir que competências arquivadas sejam somente leitura{"\n"}
          - Permitir restauração apenas pelo Administrador{"\n"}
          - Preservar registros excluídos logicamente{"\n"}
          - Impedir alteração de logs por usuários{"\n"}
          - Impedir alteração manual de campos automáticos de auditoria{"\n"}
          - Registrar data, hora, usuário e tipo de ação em todas as operações{"\n"}
          - Bloquear acesso direto por URL para áreas restritas{"\n"}
          - Exigir justificativa em ações administrativas críticas{"\n"}{"\n"}
          &nbsp;{"\n"}
          Ações críticas que exigem log:{"\n"}
          - Criação de competência{"\n"}
          - Fechamento de competência{"\n"}
          - Arquivamento de competência{"\n"}
          - Reabertura de competência{"\n"}
          - Edição administrativa após fechamento{"\n"}
          - Exclusão lógica{"\n"}
          - Restauração de registro{"\n"}
          - Alteração de permissão{"\n"}
          - Importação de Excel{"\n"}
          - Exportação de relatório{"\n"}
          - Acesso negado a área restrita{"\n"}
          - Tentativa de login administrativo{"\n"}
          - Alteração em parâmetros{"\n"}
          - Integração automática com a Base da Provisão Diária{"\n"}
          - Ajuste manual em dado integrado da provisão{"\n"}{"\n"}
          processo de aprovação.{"\n"}
          no "processo de aprovação" será importado um arquivo com tabela dinâmica em formato excel apresentando as informações para a “base” de processo de aprovação que dessas informações será necessário para construção do DashBoard do processo de aprovação, assim o arquivo ficara mais leve e poderemos, dê opção para de fechamento da competência dando a opção de colocar o nome. Após fechado apagar a base para importar as próximas do zero. A competência fechada devera ser apresentada na “base de anexos” e terá uma pasta exclusiva com o nome de “processo de aprovação”.{"\n"}{"\n"}
          dentro das configurações avançadas a opção de administrador o site deverá mostrar uma opção para erros, sobrecargas, vírus, armazenamento da nuvem do portal da pagadoria, entre outros detalhes do diagnóstico do portal.{"\n"}{"\n"}{"\n"}
          no modulo na barra lateral esquerda aonde está sendo apresentado o nome “administração do portal” deverá ser renomeado de “Administração de Comunicados” dentro dele devera ter a opção de excluir comunicados anteriores para os usuários. Opção de selecionar mais de um comunicado para poder excluir.{"\n"}{"\n"}
          dentro do modulo deixa a opção ativa também de enviar somente pelo portal ou pelo email ou pelo os dois.{"\n"}{"\n"}{"\n"}
          Na opção do sino deverá ter opção de silenciar as notificações do portal, 4/8/12 horas ou para sempre, e opção de tirar a silencioso.{"\n"}{"\n"}
          na parte de “administração de usuários” de uma opção para ver visão ampla (todos os usuários) ou por grupo (visão por setor).{"\n"}{"\n"}{"\n"}
          controle do e-social.{"\n"}{"\n"}
          fazer acompanhamento de janeiro a dezembro do que de fato foi lançado ou não foi lançado, a base será para acompanhar e nela terá as informações de bandeira, n° empresa, empresa, nome da coligada, CNPJ, VALOR DO INSS, IRRF, FGTS, PIS juntamente com a opção se foi lançado que terá a opção de colocar o n° do fopag (ex.:1234567) e terá a opção de colocar DCOMP=Compensado.{"\n"}{"\n"}
          caso algum valor não tenha dado baixa(com o n° do fopag ou DCOMP) deverá ser notificado para termos ciência ao usuário que fara o padrão de lançamentos.{"\n"}{"\n"}{"\n"}
          é obrigatório que tenha uma opção nas configurações avançadas que seja enviado por e-mail todos final dos dias a “base” de “pagamentos diversos” para um usuário administrador definido, por questões de segurança, isso pode ser definitivo ou desativado pelas configurações do administrador.{"\n"}{"\n"}
          Atualizar o módulo Despesas Fixas (mantendo toda a estrutura já existente) com as seguintes melhorias:{"\n"}{"\n"}
          Permitir múltiplos lançamentos de notas fiscais no mesmo mês, sem limite de quantidade, para PJ, Penhora e Pensão e Fornecedores.{"\n"}
          Cada nota deve conter: número da nota, número do pedido, valor, data de emissão, data de vencimento e data de lançamento. A data de lançamento deve ser preenchida automaticamente com a data atual do sistema, mas permanecer editável quando necessário.{"\n"}
          A competência deve ser preenchida automaticamente com o mês anterior ao lançamento, porém também deve ser editável em casos excepcionais.{"\n"}
          Na base PJ, permitir diferentes tipos de lançamento, como Mensal, Adiantamento, Antecipação e PPR, mantendo todos vinculados ao mesmo número de pedido.{"\n"}
          Cada número de pedido deve possuir um valor limite (saldo inicial/orçamento) informado no cadastro. Todas as notas vinculadas a esse pedido devem consumir automaticamente esse saldo, atualizando em tempo real o valor consumido e o saldo disponível, impedindo ou alertando quando o limite for ultrapassado (conforme a regra de negócio).{"\n"}
          Manter o cadastro com pedido antigo, pedido novo, conta, centro de custo, empresa, referencial PJ e código SAP (quando aplicável).{"\n"}
          Adicionar um valor previsto anual para cada registro, permitindo acompanhar previsto, realizado, saldo disponível e consumo.{"\n"}
          O Dashboard deve apresentar os totais separados de PJ, Penhora e Pensão e Fornecedores, além de um consolidado geral mensal e anual com a soma de todas as categorias.{"\n"}
          Permitir marcar registros como Suspensos, exigindo um motivo. Registros suspensos não devem aparecer nas previsões nem na lista principal, mas devem permanecer no histórico e poder ser reativados.{"\n"}
          Após o fechamento/lançamento de um mês, ele deve ser ocultado automaticamente da visualização principal, com uma opção para exibir novamente os meses ocultos e permitir edição, caso necessário.{"\n"}
          Implementar seleção múltipla utilizando Ctrl + clique do mouse, permitindo selecionar vários registros para ações em lote (como excluir, suspender ou outras ações disponíveis).{"\n"}
          Manter uma busca rápida por número do pedido, número da nota, empresa, centro de custo, conta e demais campos relevantes, facilitando a localização dos registros.{"\n"}
          A estrutura deve permanecer preparada para futuras integrações com bases de centro de custo, contas contábeis e demais cadastros corporativos, sem comprometer a arquitetura atual.
        </div>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();

  return (
    <QueryClientProvider client={queryClient}>
      <PasswordExpirationGuard />
      <PresenceHeartbeat />
      <BackButton />
      {/* Required: nested routes render here. Removing <Outlet /> breaks all child routes. */}
      <Outlet />
      <Toaster position="top-right" richColors closeButton />
    </QueryClientProvider>
  );
}
