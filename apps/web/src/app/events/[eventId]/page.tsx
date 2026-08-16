import Link from "next/link";
import { notFound } from "next/navigation";
import { getEventDetails, type EventSeat } from "@/lib/api";

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
      <header className="border-b border-white/10">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
          <Link href="/" className="text-lg font-black tracking-tight">
            CINE<span className="text-amber-400">PASS</span>
          </Link>

          <span className="text-sm text-zinc-400">Detalhes da sessão</span>
        </div>
      </header>

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
                <p className="mt-1 text-sm text-zinc-400">
                  Escolha será habilitada no checkout.
                </p>
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
                          className="flex aspect-square items-center justify-center rounded-md bg-emerald-400/15 text-xs font-semibold text-emerald-300"
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
