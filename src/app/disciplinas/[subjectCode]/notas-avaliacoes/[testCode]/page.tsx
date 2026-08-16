import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import { EmptyState } from "@/components/layout/EmptyState";
import { TestRunner } from "@/components/assessments/TestRunner";
import { CompletedTestSummary } from "@/components/assessments/CompletedTestSummary";
import { resolveActiveUserId } from "@/lib/data/resolve-active-user";
import { loadSubjectTestContent, isEnvelopedTestContent } from "@/lib/data/load-subject-data";

export default async function AnswerTestPage({
  params,
  searchParams,
}: {
  params: Promise<{ subjectCode: string; testCode: string }>;
  searchParams: Promise<{ u?: string | string[] }>;
}) {
  const { subjectCode, testCode } = await params;
  const { u } = await searchParams;
  const activeUserId = await resolveActiveUserId(u);

  const testData = await loadSubjectTestContent(activeUserId, subjectCode, testCode);

  return (
    <AppShell activeUserId={activeUserId}>
      <Link
        href={`/disciplinas/${subjectCode}/notas-avaliacoes`}
        className="mb-6 inline-block w-fit text-sm font-medium text-text-secondary transition hover:text-white"
      >
        ‹ Voltar
      </Link>

      {testData === null ? (
        <EmptyState message={`Prova "${testCode}" não encontrada para esta disciplina.`} />
      ) : isEnvelopedTestContent(testData) ? (
        testData.info.completed === "S" ? (
          <CompletedTestSummary info={testData.info} />
        ) : (
          <TestRunner testContent={testData} />
        )
      ) : (
        <CompletedTestSummary info={testData} />
      )}
    </AppShell>
  );
}
