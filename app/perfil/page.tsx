import { AppShell } from "@/components/layout/AppShell";
import { resolveActiveUserId } from "@/lib/data/resolve-active-user";
import { ProfileOnboarding } from "@/components/profile/ProfileOnboarding";
import { getDb } from "@/lib/db/client";
import { learningProfiles } from "@/lib/db/schema/learning-profile";
import { eq } from "drizzle-orm";

export default async function PerfilPage({
  searchParams,
}: {
  searchParams: Promise<{ u?: string | string[] }>;
}) {
  const { u } = await searchParams;
  const activeUserId = await resolveActiveUserId(u);

  // Carrega perfil existente (se houver)
  let existingProfile = null;
  try {
    const db = await getDb();
    const rows = await db
      .select()
      .from(learningProfiles)
      .where(eq(learningProfiles.studentId, activeUserId))
      .limit(1);
    if (rows.length > 0) existingProfile = rows[0];
  } catch {
    // Tabela pode não existir ainda — tudo bem
  }

  return (
    <AppShell activeUserId={activeUserId}>
      <div className="flex flex-col gap-6 max-w-2xl mx-auto py-6">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Seu Perfil de Aprendizagem</h1>
          <p className="text-text-secondary mt-1">
            Responda as perguntas abaixo para receber recomendações personalizadas de estudo
            e ser conectado a comunidades relevantes.
          </p>
        </div>

        {existingProfile && existingProfile.completeness >= 80 ? (
          <div className="rounded-xl bg-bg-card border border-border-subtle p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-accent-green/20 flex items-center justify-center">
                <span className="text-accent-green text-lg">✓</span>
              </div>
              <div>
                <p className="font-semibold text-text-primary">Perfil completo!</p>
                <p className="text-sm text-text-secondary">
                  Estilo: <span className="capitalize text-brand-yellow">{existingProfile.primaryStyle}</span>
                  {" · "}Completude: {Math.round(existingProfile.completeness)}%
                </p>
              </div>
            </div>
            <ProfileOnboarding studentId={activeUserId} initialProfile={existingProfile} />
          </div>
        ) : (
          <ProfileOnboarding studentId={activeUserId} initialProfile={existingProfile} />
        )}
      </div>
    </AppShell>
  );
}
