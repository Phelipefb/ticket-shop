import { getPublishedEvents, type PublicEvent } from "@/lib/api";
import { Header } from "@/components/header";
import { EventGrid } from "@/components/event-grid";

export default async function Home() {
  let events: PublicEvent[] = [];
  let hasError = false;

  try {
    events = await getPublishedEvents();
  } catch {
    hasError = true;
  }

  return (
    <main className="min-h-screen bg-[#101114] text-zinc-100">
      <Header />

      <section className="mx-auto max-w-6xl px-6 pb-16 pt-20">
        <p className="mb-4 text-sm font-semibold tracking-[0.2em] text-amber-400">
          PROGRAMAÇÃO
        </p>

        <h1 className="max-w-3xl text-4xl font-bold tracking-tight sm:text-6xl">
          Escolha uma sessão.
          <br />
          Garanta seu lugar.
        </h1>

        <p className="mt-6 max-w-xl text-lg leading-8 text-zinc-400">
          Filmes, assentos numerados e uma experiência de entrada sem fila.
        </p>
      </section>

      <section className="mx-auto max-w-6xl px-6 pb-24">
        <div className="mb-7 flex items-end justify-between">
          <div>
            <h2 className="text-2xl font-bold">Em cartaz</h2>
            <p className="mt-1 text-sm text-zinc-400">
              Sessões disponíveis para reserva.
            </p>
          </div>

          <span className="hidden rounded-full border border-white/10 px-3 py-1 text-sm text-zinc-400 sm:block">
            {events.length} sessões
          </span>
        </div>

        {hasError ? (
          <div className="rounded-2xl border border-red-400/30 bg-red-400/10 p-6 text-red-200">
            Não foi possível carregar as sessões. Confirme se a API está rodando
            em <code>http://localhost:3333</code>.
          </div>
        ) : events.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-white/15 p-10 text-center text-zinc-400">
            Nenhuma sessão publicada no momento.
          </div>
        ) : (
          <EventGrid events={events} />
        )}
      </section>
    </main>
  );
}
