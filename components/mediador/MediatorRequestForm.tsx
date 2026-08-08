"use client";

import { useState, type FormEvent, type ReactNode } from "react";
import Link from "next/link";
import { BriefcaseIcon, CheckCircleIcon, InfoIcon, UserIcon } from "@/components/icons";

export interface MediatorDisciplineOption {
  code: string;
  description: string;
  mediatorLabel: string | null;
}

interface MediatorRequestFormProps {
  studentName: string;
  statusDescription: string;
  courseName: string;
  disciplines: MediatorDisciplineOption[];
  initialSubjectCode: string;
  backHref: string;
}

const MOTIVOS = [
  "Dúvida sobre conteúdo da disciplina",
  "Dúvida sobre avaliação",
  "Problema com material didático",
  "Solicitação de revisão de nota",
  "Problema técnico na plataforma",
  "Outros",
];

const fieldControlClass =
  "w-full bg-transparent py-2 text-sm text-white outline-none [&>option]:bg-bg-app disabled:text-text-secondary";

export function MediatorRequestForm({
  studentName,
  statusDescription,
  courseName,
  disciplines,
  initialSubjectCode,
  backHref,
}: MediatorRequestFormProps) {
  const [subjectCode, setSubjectCode] = useState(initialSubjectCode);
  const [motivo, setMotivo] = useState("");
  const [comentario, setComentario] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const selected = disciplines.find((d) => d.code === subjectCode);

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!subjectCode || !motivo) {
      setError("Selecione a disciplina e o motivo do atendimento.");
      return;
    }
    setError(null);
    setSubmitted(true);
  }

  if (submitted) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-2xl bg-bg-card p-10 text-center">
        <CheckCircleIcon className="h-10 w-10 text-accent-green" />
        <p className="text-lg font-semibold text-white">Atendimento solicitado com sucesso.</p>
        <p className="max-w-md text-sm text-text-secondary">
          {selected?.mediatorLabel
            ? `${selected.mediatorLabel} vai retornar em breve pelos canais oficiais.`
            : "O mediador responsável vai retornar em breve pelos canais oficiais."}
        </p>
        <Link
          href={backHref}
          className="mt-2 rounded-full bg-brand-yellow px-6 py-3 text-sm font-semibold text-black transition hover:bg-brand-yellow-dark"
        >
          Voltar para a disciplina
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <div className="flex flex-col gap-4 rounded-2xl bg-bg-card p-6">
        <InfoRow icon={<UserIcon className="h-5 w-5 shrink-0 text-teal-500" />} label="Aluno(a)" value={studentName} />
        <InfoRow icon={<InfoIcon className="h-5 w-5 shrink-0 text-teal-500" />} label="Situação" value={statusDescription} />
        <InfoRow icon={<BriefcaseIcon className="h-5 w-5 shrink-0 text-teal-500" />} label="Curso" value={courseName} />
      </div>

      <Field label="Disciplina">
        <select
          value={subjectCode}
          onChange={(e) => setSubjectCode(e.target.value)}
          className={fieldControlClass}
        >
          {disciplines.map((d) => (
            <option key={d.code} value={d.code}>
              {d.description} ({d.code})
            </option>
          ))}
        </select>
      </Field>

      <Field label="Responsável">
        <input
          readOnly
          value={selected?.mediatorLabel ?? "Nenhum mediador vinculado a esta disciplina"}
          className={fieldControlClass}
        />
      </Field>

      <Field label="Motivos">
        <select value={motivo} onChange={(e) => setMotivo(e.target.value)} className={fieldControlClass}>
          <option value="" disabled>
            Selecione um motivo
          </option>
          {MOTIVOS.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>
      </Field>

      <Field label="Comentário do requerimento">
        <textarea
          value={comentario}
          onChange={(e) => setComentario(e.target.value)}
          rows={4}
          placeholder="Descreva sua solicitação (opcional)"
          className={`${fieldControlClass} resize-y placeholder:text-text-secondary/60`}
        />
      </Field>

      {error && <p className="text-center text-sm text-red-400">{error}</p>}

      <button
        type="submit"
        className="mx-auto rounded-xl bg-teal-600 px-8 py-3 text-sm font-bold text-white transition hover:bg-teal-500"
      >
        Solicitar
      </button>
    </form>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <fieldset className="rounded-2xl border border-border-subtle px-4 pb-3">
      <legend className="px-2 text-xs font-medium text-text-secondary">{label}</legend>
      {children}
    </fieldset>
  );
}

function InfoRow({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3 text-sm">
      {icon}
      <span className="text-text-secondary">{label}:</span>
      <span className="font-semibold text-white">{value}</span>
    </div>
  );
}
