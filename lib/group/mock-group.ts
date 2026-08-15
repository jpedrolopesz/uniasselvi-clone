/**
 * Conteúdo estático do grupo de apadrinhamento.
 *
 * O grupo não é uma turma nem um grupo de estudos entre pares: é uma rede de
 * apoio em que um veterano acompanha um punhado de calouros e responde
 * dúvidas sobre a faculdade e sobre o curso.
 *
 * Não existe backend de mensagens, de metas nem de vínculo veterano/calouro
 * em lib/db/schema — e, como registra lib/types/raw/classmates.ts, o projeto
 * não tem fonte real de múltiplos alunos. Enquanto isso não existir, a página
 * vive deste módulo; a UI consome só os tipos abaixo, então trocar por
 * loaders de verdade não deve exigir mudança nos componentes.
 *
 * Os calouros são os colegas sintéticos da turma FLD6835406 já usados em
 * public/data/shared/classmates, para o grupo seguir coerente com o resto da
 * ficção do app. Diego Alves está na fixture mas foi deixado de fora de
 * propósito: seu registro tem `allow_classmates_to_see_me: false`, e
 * incluí-lo num roster visível contrariaria o consentimento que o próprio
 * dado declara. O veterano é uma pessoa sintética nova — nenhuma fixture
 * modela alguém de semestre mais avançado, e um padrinho por definição não é
 * colega de turma.
 */

export type GroupRole = "veterano" | "calouro";

export interface GroupMember {
  id: string;
  name: string;
  /** Iniciais do avatar; evita depender de imagem externa. */
  initials: string;
  role: GroupRole;
  /** Semestre do veterano / cidade do calouro — o que identifica cada papel. */
  detail: string;
  online: boolean;
  isMe?: boolean;
}

export interface GroupMessage {
  id: string;
  authorId: string;
  /** Horário já formatado — ver a nota sobre hidratação em lib/community/mock-feed.ts. */
  time: string;
  text: string;
}

export interface WeeklyGoal {
  id: string;
  title: string;
  detail: string;
  /** Disciplina relacionada, quando houver, para linkar em /disciplinas/<code>. */
  subjectCode?: string;
  done: boolean;
}

export const GROUP_NAME = "Rede de Apoio — Engenharia de Software";

export const MEMBERS: GroupMember[] = [
  {
    id: "marcos",
    name: "Marcos Pereira",
    initials: "MP",
    role: "veterano",
    detail: "7º semestre • padrinho do grupo",
    online: true,
  },
  { id: "joao", name: "João Pedro", initials: "JP", role: "calouro", detail: "Blumenau", online: true, isMe: true },
  { id: "ana", name: "Ana Souza", initials: "AS", role: "calouro", detail: "Chapecó", online: true },
  { id: "bruno", name: "Bruno Lima", initials: "BL", role: "calouro", detail: "Chapecó", online: true },
  { id: "carla", name: "Carla Mendes", initials: "CM", role: "calouro", detail: "Florianópolis", online: false },
];

export const VETERAN = MEMBERS.find((m) => m.role === "veterano")!;

export const MESSAGES: GroupMessage[] = [
  {
    id: "m1",
    authorId: "marcos",
    time: "08:50",
    text: "Bom dia, pessoal! Semana de avaliação chegando. Podem mandar dúvida aqui a qualquer hora — eu respondo entre uma aula e outra.",
  },
  {
    id: "m2",
    authorId: "ana",
    time: "09:12",
    text: "Marcos, uma dúvida boba: a nota da avaliação virtual substitui a da prova presencial ou as duas somam?",
  },
  {
    id: "m3",
    authorId: "marcos",
    time: "09:20",
    text: "Não é boba, todo mundo erra isso no primeiro semestre. As duas compõem a média final com pesos diferentes — dá pra conferir o cálculo no simulador de média dentro da disciplina.",
  },
  {
    id: "m4",
    authorId: "bruno",
    time: "09:31",
    text: "E se eu não conseguir ir no dia agendado da prova? Perco a nota?",
  },
  {
    id: "m5",
    authorId: "marcos",
    time: "09:38",
    text: "Não. Você remarca pelo próprio agendamento enquanto o prazo estiver aberto, e ainda existe a segunda chamada. O que você não pode é deixar passar sem avisar ninguém.",
  },
  {
    id: "m6",
    authorId: "joao",
    time: "09:40",
    text: "Marcos, o Desafio Profissional é individual mesmo? Vi gente dizendo que dava pra fazer em dupla.",
  },
  {
    id: "m7",
    authorId: "marcos",
    time: "09:47",
    text: "Esse é individual — o nome na avaliação já diz. Tem outros trabalhos que são em grupo, mas aí o enunciado deixa explícito. Na dúvida, sempre confere no plano de ensino antes de dividir tarefa com alguém.",
  },
  {
    id: "m8",
    authorId: "carla",
    time: "10:02",
    text: "Eu ainda me perco pra achar as aulas gravadas. É dentro da trilha de aprendizagem?",
  },
  {
    id: "m9",
    authorId: "marcos",
    time: "10:09",
    text: "Fica na página da disciplina, num bloco separado da trilha. Coloquei isso como meta da semana pra vocês baterem o olho — é o tipo de coisa que economiza muita hora depois.",
  },
  {
    id: "m10",
    authorId: "joao",
    time: "10:21",
    text: "Fechou, valeu! Já vou olhar hoje à noite.",
  },
];

export const WEEKLY_GOALS: WeeklyGoal[] = [
  {
    id: "g1",
    title: "Localizar as aulas gravadas de cada disciplina",
    detail: "Saber onde ficam antes da semana de prova",
    done: true,
  },
  {
    id: "g2",
    title: "Conferir a média no simulador da disciplina",
    detail: "Entender o peso de cada avaliação",
    subjectCode: "MAT24",
    done: true,
  },
  {
    id: "g3",
    title: "Confirmar data e local da prova presencial",
    detail: "Dá pra remarcar enquanto o prazo estiver aberto",
    done: true,
  },
  {
    id: "g4",
    title: "Ler o plano de ensino do Desafio Profissional",
    detail: "É individual — conferir antes de combinar com alguém",
    subjectCode: "GTI03",
    done: false,
  },
  {
    id: "g5",
    title: "Trazer uma dúvida para a call de quinta",
    detail: "Quinta-feira, 20h — com o Marcos",
    done: false,
  },
];
