import { NextRequest, NextResponse } from "next/server";
import { resolveActiveUserId } from "@/lib/data/resolve-active-user";
import { loadDisciplines, loadUserData } from "@/lib/data/load-user-data";
import { sortDisciplinesByProgress } from "@/lib/selectors/discipline-selectors";

export async function GET(request: NextRequest) {
  const activeUserId = await resolveActiveUserId(request.nextUrl.searchParams.get("u") ?? undefined);
  const [disciplines, user] = await Promise.all([
    loadDisciplines(activeUserId),
    loadUserData(activeUserId),
  ]);

  return NextResponse.json({
    activeUserId,
    user: user
      ? {
          fullName: user.full_name,
          courseName: user.course_name,
          subscriptionCode: user.subscription_code,
        }
      : null,
    disciplines: sortDisciplinesByProgress(disciplines ?? []),
  });
}
