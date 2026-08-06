/**
 * PROPOSTO — não espelha nenhum endpoint confirmado. O projeto só tem dados
 * reais para o caso "prova já agendada" (ver `ScheduleDetailRaw` em
 * assessments.ts). Nenhum fixture do projeto contém um caso real de
 * `need_schedule=true` com `has_schedule=false`, então não existe amostra
 * real do formato "opções de data disponíveis para agendar".
 *
 * Este tipo modela a lacuna descrita no diagnóstico da funcionalidade de
 * agendamento: a lista de datas/locais que o aluno escolhe antes de existir
 * um `ScheduleDetailRaw`. Os nomes de campo seguem o padrão em português do
 * restante do domínio de avaliações (ver assessments.ts) para não introduzir
 * uma convenção paralela.
 */
export interface ExamLocationRaw {
  id: string;
  nome: string;
  cep?: string;
  endereco: string;
  numero?: string;
  complemento?: string;
  bairro?: string;
  cidade: string;
  sigla: string;
  /** Só preenchido quando a fonte de dados já tiver coordenadas — o projeto não tem serviço de geocodificação (ver diagnóstico). */
  latitude?: number;
  longitude?: number;
  informacoes_acesso?: string;
}

export interface ExamScheduleOptionRaw {
  id: string;
  /** Formato DD/MM/YYYY, igual a `ScheduleDetailRaw.data`, para reaproveitar `toIsoDateKey`/`formatDateBr` sem conversão adicional. */
  data: string;
  hora_inicio: string;
  hora_fim: string;
  capacity?: number;
  available_slots?: number;
  location: ExamLocationRaw;
}
