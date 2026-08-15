/**
 * Conteúdo estático do feed de comunidades.
 *
 * Ainda não existe backend de comunidade: nenhuma tabela em lib/db/schema
 * cobre posts/votos/comentários, e nenhum endpoint do AVA foi identificado
 * para isso. Enquanto essa origem não existir, a página vive deste módulo —
 * a UI toda consome estes tipos, então trocar por um loader de verdade
 * (nos moldes de lib/data/load-*.ts) não deve exigir mudança nos componentes.
 *
 * As comunidades espelham as disciplinas reais da matriz de Engenharia de
 * Software, e o `slug` é o mesmo namespace de `materia` usado pelo RAG de
 * transcrições (ver services/transcribing-service/README.md): uma pergunta
 * feita em r/probabilidade-e-estatistica filtra o retrieval para o corpus
 * daquela disciplina.
 */

export interface Community {
  /** Namespace da comunidade, exibido como r/<slug>. Igual ao `materia` do RAG. */
  slug: string;
  name: string;
  /**
   * Código da disciplina correspondente em /disciplinas/<subjectCode>.
   * Ausente nas comunidades transversais (empregabilidade, empreendedorismo),
   * que são do curso inteiro e não têm disciplina para linkar.
   */
  subjectCode?: string;
  members: number;
  online: number;
  description: string;
}

export type PostTag = "Dúvida" | "Material" | "Discussão" | "Aviso";

export interface Post {
  id: string;
  communitySlug: string;
  author: string;
  /**
   * Idade já formatada ("há 5 h") em vez de timestamp: o feed é um client
   * component, e derivar o texto de Date.now() renderizaria valores
   * diferentes no servidor e no cliente, quebrando a hidratação.
   */
  age: string;
  title: string;
  body: string;
  score: number;
  comments: number;
  tag: PostTag;
  pinned?: boolean;
}

export const COMMUNITIES: Community[] = [
  {
    slug: "probabilidade-e-estatistica",
    name: "Probabilidade e Estatística",
    subjectCode: "MAT24",
    members: 1284,
    online: 37,
    description:
      "Dúvidas, resumos e resolução de exercícios da MAT24. Poste o enunciado junto com o que você já tentou.",
  },
  {
    slug: "mineracao-de-dados",
    name: "Mineração de Dados",
    subjectCode: "114480",
    members: 942,
    online: 24,
    description: "Clustering, classificação e pré-processamento. Compartilhe notebooks e datasets.",
  },
  {
    slug: "sistemas-e-aplicacoes-distribuidas",
    name: "Sistemas e Aplicações Distribuídas",
    subjectCode: "GTI04",
    members: 767,
    online: 18,
    description: "Concorrência, consistência e tolerância a falhas na prática.",
  },
  {
    slug: "modelagem-e-gestao-de-processos-de-negocios",
    name: "Modelagem e Gestão de Processos de Negócios",
    subjectCode: "GTI03",
    members: 613,
    online: 9,
    description: "BPMN, indicadores e estudos de caso da GTI03.",
  },
  {
    slug: "estudo-contemporaneo-e-transversal",
    name: "Estudo Contemporâneo e Transversal",
    subjectCode: "159490",
    members: 508,
    online: 6,
    description: "Relações Étnico-Raciais, Cultura e Direitos Humanos.",
  },
  {
    slug: "dicas-de-empregabilidade",
    name: "Dicas de Empregabilidade",
    members: 3420,
    online: 96,
    description:
      "Vagas, currículo, entrevistas e primeiro emprego na área. Aberta a alunos de todos os cursos e semestres.",
  },
  {
    slug: "empreendedorismo",
    name: "Empreendedorismo",
    members: 2105,
    online: 61,
    description:
      "Tirar a ideia do papel: validação, primeiros clientes, MEI e gestão de negócio próprio.",
  },
];

export const POSTS: Post[] = [
  {
    id: "p1",
    communitySlug: "probabilidade-e-estatistica",
    author: "monitoria.mat24",
    age: "há 2 h",
    title: "Fixado: como pedir ajuda em exercício de probabilidade",
    body:
      "Antes de postar, inclua o enunciado completo, o que você já tentou e onde travou. Respostas prontas sem raciocínio serão removidas — o objetivo aqui é você chegar na resposta, não recebê-la.",
    score: 214,
    comments: 12,
    tag: "Aviso",
    pinned: true,
  },
  {
    id: "p9",
    communitySlug: "dicas-de-empregabilidade",
    author: "nucleo.carreiras",
    age: "há 3 h",
    title: "Como descrever trabalhos da faculdade no currículo sem parecer inflado",
    body:
      "Recrutador não quer saber o nome da disciplina. Descreva o problema, a ferramenta e o resultado: 'analisei 12 mil registros com K-Means para segmentar evasão' vale mais do que 'cursei Mineração de Dados'.",
    score: 186,
    comments: 41,
    tag: "Material",
  },
  {
    id: "p2",
    communitySlug: "probabilidade-e-estatistica",
    author: "joao.zamonelo",
    age: "há 5 h",
    title: "Não entendi a diferença entre espaço amostral e evento aleatório",
    body:
      "Na aula da unidade 1 o professor fala que o espaço amostral é um conjunto e não um valor, mas na hora de resolver exercício eu continuo confundindo os dois. Alguém tem um jeito simples de separar isso na cabeça?",
    score: 128,
    comments: 34,
    tag: "Dúvida",
  },
  {
    id: "p3",
    communitySlug: "mineracao-de-dados",
    author: "leticia.borges",
    age: "há 8 h",
    title: "Resumo: quando usar K-Means e quando usar hierárquico",
    body:
      "Montei uma tabela comparando os dois para a avaliação. K-Means precisa do k definido antes e assume clusters esféricos; o hierárquico te dá o dendrograma e você corta onde quiser, mas custa mais caro em base grande.",
    score: 97,
    comments: 21,
    tag: "Material",
  },
  {
    id: "p10",
    communitySlug: "empreendedorismo",
    author: "marina.tavares",
    age: "há 9 h",
    title: "Validei minha ideia com 30 entrevistas antes de escrever uma linha de código",
    body:
      "Ia começar pelo sistema, como todo mundo da nossa área faz. Parei e fui conversar com 30 donos de petshop. Descobri que o problema real não era agendamento, era cobrança de inadimplente. Mudou o produto inteiro.",
    score: 152,
    comments: 47,
    tag: "Discussão",
  },
  {
    id: "p4",
    communitySlug: "sistemas-e-aplicacoes-distribuidas",
    author: "rafael.nascimento",
    age: "há 11 h",
    title: "Alguém conseguiu rodar o exemplo de replicação da unidade 3?",
    body:
      "Meu nó secundário aceita a conexão mas nunca recebe o log de replicação. Já conferi porta e firewall. Se alguém tiver um docker-compose que funcione, agradeço demais.",
    score: 64,
    comments: 17,
    tag: "Dúvida",
  },
  {
    id: "p5",
    communitySlug: "probabilidade-e-estatistica",
    author: "camila.duarte",
    age: "há 14 h",
    title: "Simulador de média: confere com a nota real de vocês?",
    body:
      "Fiz o cálculo na mão e deu 0,3 de diferença do simulador. Desconfio que ele não está considerando o peso da avaliação prática. Alguém comparou?",
    score: 51,
    comments: 28,
    tag: "Discussão",
  },
  {
    id: "p6",
    communitySlug: "modelagem-e-gestao-de-processos-de-negocios",
    author: "andre.marques",
    age: "há 1 d",
    title: "Modelo BPMN do estudo de caso, revisado pelo mediador",
    body:
      "Subi a versão corrigida depois do feedback: os gateways paralelos que eu tinha usado no início eram exclusivos. Vale olhar antes de entregar o seu.",
    score: 43,
    comments: 8,
    tag: "Material",
  },
  {
    id: "p11",
    communitySlug: "dicas-de-empregabilidade",
    author: "joao.zamonelo",
    age: "há 1 d",
    title: "Consegui estágio no 3º semestre — o que perguntaram na entrevista técnica",
    body:
      "Nada de algoritmo em quadro branco. Foi SQL básico, uma pergunta sobre versionamento e muita conversa sobre um projeto que eu tinha no GitHub. Levem um projeto que vocês consigam explicar de ponta a ponta.",
    score: 134,
    comments: 39,
    tag: "Discussão",
  },
  {
    id: "p12",
    communitySlug: "empreendedorismo",
    author: "escritorio.inovacao",
    age: "há 1 d",
    title: "MEI, Simples ou PJ: qual faz sentido para quem está começando a faturar",
    body:
      "Resumo do que muda em imposto, limite de faturamento e emissão de nota em cada regime. Se você está pegando freela na área, provavelmente MEI já resolve até o teto anual.",
    score: 88,
    comments: 19,
    tag: "Material",
  },
  {
    id: "p7",
    communitySlug: "estudo-contemporaneo-e-transversal",
    author: "bianca.rocha",
    age: "há 1 d",
    title: "Indicação de leitura complementar para a unidade 2",
    body:
      "O capítulo do livro é bem denso. Encontrei um artigo curto que cobre o mesmo conteúdo de forma mais direta e ajudou muito a fechar a atividade.",
    score: 29,
    comments: 5,
    tag: "Material",
  },
  {
    id: "p8",
    communitySlug: "mineracao-de-dados",
    author: "thiago.alves",
    age: "há 2 d",
    title: "Meu dataset tem muito valor faltante — imputar ou descartar?",
    body:
      "São ~18% de nulos em duas colunas numéricas. Descartar a linha me faz perder quase um quinto da base. Média/mediana resolve ou vai enviesar o cluster?",
    score: 22,
    comments: 13,
    tag: "Discussão",
  },
];
