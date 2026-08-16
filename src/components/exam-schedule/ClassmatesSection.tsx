import type { PublicStudentConnection } from "@/lib/types/derived";
import type { RelatedStudentsGroups } from "@/lib/exam-schedule/group-related-students";

function initials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

function StudentConnectionCard({ student }: { student: PublicStudentConnection }) {
  const badges: string[] = [];
  if (student.sameExamDate) badges.push("mesma data");
  if (student.sameExamLocation) badges.push("mesmo local");
  if (student.sameCity) badges.push("mesma cidade");

  return (
    <li className="flex items-center gap-3 rounded-lg bg-bg-app p-3">
      {student.avatarUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={student.avatarUrl}
          alt=""
          className="h-9 w-9 flex-shrink-0 rounded-full object-cover"
        />
      ) : (
        <span
          aria-hidden="true"
          className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-bg-card text-xs font-semibold text-white"
        >
          {initials(student.displayName)}
        </span>
      )}
      <div className="min-w-0">
        <p className="truncate text-sm font-medium text-white">{student.displayName}</p>
        <p className="truncate text-xs text-text-secondary">
          {student.city ? `${student.city}${student.state ? `/${student.state}` : ""}` : "Cidade não informada"}
          {badges.length > 0 && ` · ${badges.join(" · ")}`}
        </p>
      </div>
    </li>
  );
}

function StudentGroup({
  title,
  students,
  emptyMessage,
}: {
  title: string;
  students: PublicStudentConnection[];
  emptyMessage: string;
}) {
  return (
    <div>
      <h3 className="text-sm font-semibold text-white">{title}</h3>
      {students.length === 0 ? (
        <p className="mt-2 text-xs text-text-secondary">{emptyMessage}</p>
      ) : (
        <ul className="mt-2 flex flex-col gap-2">
          {students.map((student) => (
            <StudentConnectionCard key={student.studentId} student={student} />
          ))}
        </ul>
      )}
    </div>
  );
}

interface ClassmatesSectionProps {
  groups: RelatedStudentsGroups;
  examCity: string | null;
  studentCity: string | null;
  showTravelSection: boolean;
}

/**
 * Todo dado aqui já chegou reduzido e filtrado pelo servidor
 * (ver lib/exam-schedule/group-related-students.ts) — este componente só
 * exibe, nunca decide quem aparece. Sem ação de contato: o projeto não tem
 * nenhum recurso de mensageria autorizado entre alunos (ver diagnóstico).
 */
export function ClassmatesSection({
  groups,
  examCity,
  studentCity,
  showTravelSection,
}: ClassmatesSectionProps) {
  return (
    <div className="flex flex-col gap-5 rounded-xl bg-bg-card p-4">
      <StudentGroup
        title="Colegas da sua turma"
        students={groups.classmates}
        emptyMessage="Nenhum colega da sua turma encontrado para esta prova."
      />

      <StudentGroup
        title="Alunos que moram na cidade da prova"
        students={groups.examCityStudents}
        emptyMessage={
          examCity
            ? `Não encontramos alunos que moram em ${examCity} agendados para esta prova.`
            : "Esta prova ainda não tem uma cidade de realização cadastrada."
        }
      />

      {showTravelSection && (
        <StudentGroup
          title={studentCity ? `Colegas que também sairão de ${studentCity}` : "Colegas em deslocamento"}
          students={groups.travelingClassmates}
          emptyMessage={
            studentCity
              ? `Não encontramos outros colegas de ${studentCity} agendados para esta data.`
              : "Cadastre sua cidade para encontrar colegas que também precisarão se deslocar."
          }
        />
      )}
    </div>
  );
}
