import { AppShell } from "@/components/layout/AppShell";
import { resolveActiveUserId } from "@/lib/data/resolve-active-user";
import { ProfileOnboarding } from "@/components/profile/ProfileOnboarding";

export default async function PerfilPage({
  searchParams,
}: {
  searchParams: Promise<{ u?: string | string[] }>;
}) {
  const { u } = await searchParams;
  const activeUserId = await resolveActiveUserId(u);

  return (
    <AppShell activeUserId={activeUserId}>
      <div className="flex flex-col gap-6 max-w-2xl mx-auto py-6">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Seu Perfil de Aprendizagem</h1>
          <p className="text-text-secondary mt-1">
            Responda as perguntas para receber recomendações personalizadas de estudo e comunidade.
          </p>
        </div>
        <ProfileOnboarding studentId={activeUserId} />
      </div>
    </AppShell>
  );
}
