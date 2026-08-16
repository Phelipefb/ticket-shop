import Link from "next/link";
import { notFound } from "next/navigation";
import { getEventDetails } from "@/lib/api";
import { Header } from "@/components/header";
import { SeatSelector } from "@/components/seat-selector";

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

          <SeatSelector
            eventId={event.id}
            price={event.price}
            initialSeats={event.seats}
          />
        </div>
      </section>
    </main>
  );
}
