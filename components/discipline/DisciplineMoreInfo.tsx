import type { ComponentType, SVGProps } from "react";
import Link from "next/link";
import {
  BarChartIcon,
  BookOpenIcon,
  CalculatorIcon,
  ChatBubbleIcon,
  FileTextIcon,
  InboxIcon,
  ListIcon,
  MessageIcon,
  MonitorIcon,
  UsersIcon,
} from "@/components/icons";

interface InfoItem {
  label: string;
  Icon: ComponentType<SVGProps<SVGSVGElement>>;
}

const INFO_ITEMS: InfoItem[] = [
  { label: "Plano de ensino", Icon: ListIcon },
  { label: "Evolução da disciplina", Icon: BarChartIcon },
  { label: "Simulador média", Icon: CalculatorIcon },
  { label: "Materiais complementares", Icon: FileTextIcon },
  { label: "Livro da disciplina", Icon: BookOpenIcon },
  { label: "Laboratório/Brinquedoteca (Relatório)", Icon: InboxIcon },
  { label: "Sala virtual - Teams", Icon: MonitorIcon },
  { label: "Fale com coordenador", Icon: UsersIcon },
];

interface DisciplineMoreInfoProps {
  subjectCode: string;
}

/**
 * Seção "Saiba mais sobre a disciplina" / "Fale com a gente" da página real da
 * disciplina. Puramente visual por ora — só "Fale com mediador" tem rota própria
 * (os demais itens não têm dado equivalente em disciplines.json).
 */
export function DisciplineMoreInfo({ subjectCode }: DisciplineMoreInfoProps) {
  return (
    <div className="flex flex-col gap-8">
      <section className="flex flex-col gap-4">
        <h2 className="text-xl font-bold uppercase tracking-tight text-white">
          Saiba mais sobre a disciplina
        </h2>
        <div className="rounded-3xl bg-bg-card p-6 md:p-8">
          <div className="grid grid-cols-2 gap-x-6 gap-y-8 sm:grid-cols-3">
            {INFO_ITEMS.map(({ label, Icon }) => (
              <div key={label} className="flex flex-col items-center gap-3 text-center">
                <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-teal-600 text-black/80">
                  <Icon className="h-7 w-7" />
                </div>
                <span className="text-sm font-semibold text-white">{label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="text-xl font-bold uppercase tracking-tight text-white">Fale com a gente</h2>
        <div className="rounded-3xl bg-bg-card p-6 md:p-8">
          <div className="flex flex-wrap gap-4">
            <Link
              data-vitru-id={`discipline:${subjectCode}:mediator`}
              href={`/disciplinas/${subjectCode}/fale-com-mediador`}
              className="flex items-center gap-3 rounded-xl bg-brand-yellow px-6 py-4 text-sm font-bold uppercase tracking-tight text-black shadow-md transition hover:bg-brand-yellow-dark"
            >
              <ChatBubbleIcon className="h-5 w-5" />
              Fale com mediador
            </Link>
            <div className="flex items-center gap-3 rounded-xl bg-brand-yellow px-6 py-4 text-sm font-bold uppercase tracking-tight text-black shadow-md">
              <MessageIcon className="h-5 w-5" />
              Atendimento via chat
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
