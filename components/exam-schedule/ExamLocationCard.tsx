import type { ExamSessionLocation } from "@/lib/types/derived";

interface ExamLocationCardProps {
  location: ExamSessionLocation;
}

function buildAddressLine(location: ExamSessionLocation): string | null {
  const parts = [
    location.address,
    location.number,
    location.complement,
    location.district,
  ].filter(Boolean);
  if (parts.length === 0) return null;
  return parts.join(", ");
}

function buildMapQuery(location: ExamSessionLocation): string | null {
  if (location.latitude !== undefined && location.longitude !== undefined) {
    return `${location.latitude},${location.longitude}`;
  }
  const addressLine = buildAddressLine(location);
  const cityState = [location.city, location.state].filter(Boolean).join(" - ");
  const full = [addressLine, cityState].filter(Boolean).join(", ");
  return full || null;
}

/**
 * Sem chave de API nem SDK de mapas (ver diagnóstico da funcionalidade):
 * embed do Google Maps via URL pública (`output=embed`) — sem custo, sem
 * dependência nova, sem coleta de dado do aluno (a query é o endereço da
 * prova, já institucional). Quando não há endereço suficiente, mostra só o
 * cartão de texto — nunca um mapa vazio ou quebrado.
 */
export function ExamLocationCard({ location }: ExamLocationCardProps) {
  const addressLine = buildAddressLine(location);
  const mapQuery = buildMapQuery(location);
  const hasCity = Boolean(location.city && location.state);

  return (
    <div className="flex flex-col gap-3 rounded-xl bg-bg-card p-4">
      <div>
        <h3 className="text-sm font-semibold text-white">{location.name}</h3>
        {addressLine ? (
          <p className="mt-1 text-sm text-text-secondary">{addressLine}</p>
        ) : (
          <p className="mt-1 text-sm text-text-secondary">Endereço incompleto para esta prova.</p>
        )}
        <p className="text-sm text-text-secondary">
          {hasCity ? `${location.city} - ${location.state}` : "Cidade da prova não cadastrada."}
          {location.postalCode ? ` · CEP ${location.postalCode}` : ""}
        </p>
        {location.accessInfo && (
          <p className="mt-2 text-xs text-text-secondary">{location.accessInfo}</p>
        )}
      </div>

      {mapQuery ? (
        <>
          <div className="overflow-hidden rounded-lg" style={{ height: 220 }}>
            <iframe
              title={`Mapa do local: ${location.name}`}
              src={`https://www.google.com/maps?q=${encodeURIComponent(mapQuery)}&output=embed`}
              className="h-full w-full border-0"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>
          <a
            href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(mapQuery)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="w-fit rounded-full bg-bg-app px-4 py-2 text-xs font-semibold text-white transition hover:brightness-110"
          >
            Ver rota no mapa ↗
          </a>
        </>
      ) : (
        <p className="rounded-lg bg-bg-app p-3 text-xs text-text-secondary">
          Mapa indisponível — endereço insuficiente para localizar o local no mapa.
        </p>
      )}
    </div>
  );
}
