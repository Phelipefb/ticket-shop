import Link from "next/link";
import { notFound } from "next/navigation";
import { getEventDetails, type EventSeat } from "@/lib/api";
import { Header } from "@/components/header";

function formatDate(date: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "full",
    timeStyle: "short",
  }).format(new Date(date));
}

function formatPrice(price: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(price);
}

function getSeatClassName(availability: EventSeat["availability"]) {
  const commonClassName =
    "flex aspect-square items-center justify-center rounded-md text-xs font-semibold";

  if (availability === "SOLD") {
    return `${commonClassName} bg-zinc-800 text-zinc-600`;
  }

  if (availability === "RESERVED") {
    return `${commonClassName} bg-amber-400/15 text-amber-300`;
  }

  return `${commonClassName} bg-emerald-400/15 text-emerald-300`;
}

function getAvailabilityLabel(availability: EventSeat["availability"]) {
  if (availability === "SOLD") return "Vendido";
  if (availability === "RESERVED") return "Em reserva";

  return "Disponível";
}

export default async function EventDetailsPage({
  params,
}: {
  params: Promise<{ eventId: string }>;
}) {
  const { eventId } = await params;
  const event = await getEventDetails(eventId);

  if (!event) {
    notFound();
  }

  const seatsByRow = event.seats.reduce<Record<string, EventSeat[]>>(
    (rows, seat) => {
      rows[seat.row] ??= [];
      rows[seat.row].push(seat);

      return rows;
    },
    {},
  );

  return (
    <main className="min-h-screen bg-[#101114] text-zinc-100">
      <Header />

      <section className="mx-auto max-w-6xl px-6 py-12">
        <Link
          href="/"
          className="text-sm font-medium text-amber-400 hover:text-amber-300"
        >
          ← Voltar para programação
        </Link>

        <div className="mt-8 grid gap-10 lg:grid-cols-[1fr_1.2fr]">
          <article>
            <p className="text-sm font-semibold tracking-[0.18em] text-amber-400">
              SESSÃO
            </p>

            <h1 className="mt-4 text-4xl font-bold tracking-tight">
              {event.title}
            </h1>

            <p className="mt-6 leading-7 text-zinc-400">
              {event.overview ?? "Sessão especial em cartaz."}
            </p>

            <dl className="mt-10 space-y-5 border-t border-white/10 pt-6">
              <div>
                <dt className="text-xs font-semibold tracking-wider text-zinc-500">
                  DATA E HORÁRIO
                </dt>
                <dd className="mt-1 text-zinc-200">
                  {formatDate(event.startsAt)}
                </dd>
              </div>

              <div>
                <dt className="text-xs font-semibold tracking-wider text-zinc-500">
                  LOCAL
                </dt>
                <dd className="mt-1 text-zinc-200">
                  {event.venueName}
                  {event.venueAddress ? ` · ${event.venueAddress}` : ""}
                </dd>
              </div>

              <div>
                <dt className="text-xs font-semibold tracking-wider text-zinc-500">
                  INGRESSO
                </dt>
                <dd className="mt-1 text-2xl font-bold text-amber-400">
                  {formatPrice(event.price)}
                </dd>
              </div>
            </dl>
          </article>

          <section className="rounded-3xl border border-white/10 bg-zinc-900 p-6 sm:p-8">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold">Mapa de assentos</h2>
                <div className="mt-3 flex flex-wrap gap-3 text-xs">
                  <span className="flex items-center gap-1.5 text-emerald-300">
                    <i className="size-2 rounded-sm bg-emerald-400" />
                    Disponível
                  </span>

                  <span className="flex items-center gap-1.5 text-amber-300">
                    <i className="size-2 rounded-sm bg-amber-400" />
                    Em reserva
                  </span>

                  <span className="flex items-center gap-1.5 text-zinc-500">
                    <i className="size-2 rounded-sm bg-zinc-700" />
                    Vendido
                  </span>
                </div>
              </div>

              <span className="rounded-full bg-white/5 px-3 py-1 text-sm text-zinc-300">
                {event.seats.length} lugares
              </span>
            </div>

            <div className="mx-auto mt-10 max-w-md">
              <div className="rounded-t-full bg-zinc-700 py-2 text-center text-xs font-bold tracking-[0.3em] text-zinc-300">
                TELA
              </div>

              <div className="mt-8 space-y-3">
                {Object.entries(seatsByRow).map(([row, seats]) => (
                  <div key={row} className="flex items-center gap-3">
                    <span className="w-4 text-xs font-bold text-zinc-500">
                      {row}
                    </span>

                    <div className="grid flex-1 grid-cols-8 gap-2">
                      {seats.map((seat) => (
                        <span
                          key={seat.id}
                          title={`${seat.label}: ${getAvailabilityLabel(seat.availability)}`}
                          className={getSeatClassName(seat.availability)}
                        >
                          {seat.number}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        </div>
      </section>
    </main>
  );
}
