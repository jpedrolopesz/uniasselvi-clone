/**
 * PROPOSTO — o projeto não tem nenhuma fonte de dados de múltiplos alunos
 * (sem backend, sem autenticação real, cada "usuário" é uma pasta estática
 * isolada em public/data/user/<id>). Este tipo é a fixture fictícia usada
 * para demonstrar a seção "Colegas" do agendamento de prova, seguindo o
 * mesmo espírito dos usuários fictícios já existentes no projeto
 * (usuario-ficticio-em-dia, usuario-ficticio-baixa-frequencia): dados
 * sintéticos, nunca de pessoas reais.
 *
 * Este é o registro "privado" (lado servidor). Nunca é enviado ao cliente
 * inteiro — a filtragem de autorização/consentimento roda em Server
 * Component e só entrega `PublicStudentConnection` (ver lib/types/derived).
 */
export interface ClassmateRecordRaw {
  student_id: string;
  display_name: string;
  avatar_url?: string;
  city_name: string;
  city_state: string;
  /** Mesmo identificador de turma usado em AssessmentRaw.class / DisciplineRaw.class. */
  class: string;
  course_code: string;
  /** testCode -> estado de agendamento desse colega para a mesma prova, quando aplicável. */
  exam_schedule?: Record<
    string,
    {
      schedule_option_id: string | null;
      location_id: string | null;
    }
  >;
  allow_classmates_to_see_me: boolean;
  allow_students_from_my_city_to_see_me: boolean;
  allow_travel_connection: boolean;
}
