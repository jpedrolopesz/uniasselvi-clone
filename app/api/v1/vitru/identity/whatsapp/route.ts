import { readFile } from "node:fs/promises";
import path from "node:path";
import { loadUserIndex } from "@/lib/data/load-user-index";

interface WhatsAppIdentity {
  phone: string;
  userId: string;
  enabled: boolean;
}

interface WhatsAppIdentityFile {
  identities: WhatsAppIdentity[];
}

function normalizePhone(value: string): string {
  return value.replace(/^whatsapp:/i, "").replace(/\D/g, "");
}

export async function GET(request: Request) {
  const phone = normalizePhone(
    new URL(request.url).searchParams.get("phone")?.trim() ?? ""
  );

  if (!phone) {
    return Response.json(
      {
        ok: false,
        error: { code: "INVALID_REQUEST", message: "phone é obrigatório." },
      },
      { status: 400 }
    );
  }

  try {
    const filePath = path.join(
      process.cwd(),
      ".vitru",
      "whatsapp-identities.local.json"
    );
    const identities = JSON.parse(
      await readFile(filePath, "utf8")
    ) as WhatsAppIdentityFile;
    const identity = identities.identities.find(
      (item) => item.enabled && normalizePhone(item.phone) === phone
    );

    if (!identity) {
      return Response.json(
        {
          ok: false,
          error: {
            code: "WHATSAPP_IDENTITY_NOT_FOUND",
            message: "Telefone não vinculado a um aluno.",
          },
        },
        { status: 404 }
      );
    }

    const index = await loadUserIndex();
    const student = index.users.find((item) => item.id === identity.userId);
    if (!student) {
      return Response.json(
        {
          ok: false,
          error: { code: "STUDENT_NOT_FOUND", message: "Aluno não encontrado." },
        },
        { status: 404 }
      );
    }

    return Response.json(
      {
        ok: true,
        data: {
          userId: student.id,
          displayLabel: student.label,
          phoneVerified: true,
        },
        meta: { version: "v1", source: "local-development-mapping" },
      },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (error) {
    console.error("Falha ao identificar telefone do WhatsApp", error);
    return Response.json(
      {
        ok: false,
        error: {
          code: "IDENTITY_UNAVAILABLE",
          message: "Não foi possível identificar o aluno.",
        },
      },
      { status: 500 }
    );
  }
}
