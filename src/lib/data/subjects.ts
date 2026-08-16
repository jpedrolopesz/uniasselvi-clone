export interface SubjectCatalogEntry {
  subjectCode: string;
  name: string;
  slug: string;
  semester: string;
  hasLearningPath: boolean;
  hasAssessments: boolean;
}

export const SUBJECTS: SubjectCatalogEntry[] = [
  { subjectCode: "GTI03", name: "Modelagem e Gestão de Processos de Negócios", slug: "modelagem-e-gestao-de-processo-de-negocio", semester: "2026/2", hasLearningPath: false, hasAssessments: true },
  { subjectCode: "MAT24", name: "Probabilidade e Estatística", slug: "probabilidade-e-estatistica", semester: "2026/2", hasLearningPath: true, hasAssessments: false },
  { subjectCode: "159490", name: "Estudo Contemporâneo e Transversal: Relações Étnico-Raciais, Cultura e Direitos Humanos", slug: "estudo-contemporaneo-e-transversal-relacoes-etenico-raciais-cultura-e-direitos-humanos", semester: "2026/2", hasLearningPath: false, hasAssessments: false },
  { subjectCode: "GTI04", name: "Sistemas e Aplicações Distribuídas", slug: "sistemas-aplicacoes-distribuidas", semester: "2026/2", hasLearningPath: false, hasAssessments: false },
  { subjectCode: "114480", name: "Mineração de Dados", slug: "mineracao-de-dados", semester: "2026/2", hasLearningPath: false, hasAssessments: false },
  { subjectCode: "159472", name: "Experiência Profissional: Desafios Contemporâneos", slug: "experiencia-profissional-desafios-comtemporaneos", semester: "2026/2", hasLearningPath: false, hasAssessments: false },
  { subjectCode: "173488", name: "Experiência Profissional: Mineração e Análise de Dados", slug: "experiencia-profissional-mineracao-e-analise-de-dados", semester: "2026/2", hasLearningPath: false, hasAssessments: false },
];

export const findSubject = (code: string) => SUBJECTS.find((subject) => subject.subjectCode === code);
