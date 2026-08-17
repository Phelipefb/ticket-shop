import Link from "next/link";
import { notFound } from "next/navigation";
import { getSharedTicket } from "@/lib/api";
import { BackButton } from "@/components/back-button";

function formatDate(date: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "full",
    timeStyle: "short",
  }).format(new Date(date));
}

function getStatusLabel(status: "ACTIVE" | "USED" | "VOID") {
  if (status === "USED") return "Já utilizado";
  if (status === "VOID") return "Cancelado";

  return "Válido para entrada";
}

export default async function SharedTicketPage({
  params,
}: {
  params: Promise<{ shareToken: string }>;
}) {
  const { shareToken } = await params;
  const ticket = await getSharedTicket(shareToken);

  if (!ticket) {
    notFound();
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#101114] px-6 py-12 text-zinc-100">
      <section className="w-full max-w-lg overflow-hidden rounded-3xl border border-white/10 bg-zinc-900">
        <div className="border-b border-white/10 p-7">
          <div className="flex items-center justify-between">
            <BackButton />

            <Link href="/" className="text-lg font-black tracking-tight">
              CINE<span className="text-amber-400">PASS</span>
            </Link>
          </div>

          <p className="mt-8 text-xs font-bold tracking-[0.18em] text-amber-400">
            INGRESSO COMPARTILHADO
          </p>

          <h1 className="mt-3 text-3xl font-bold">{ticket.event.title}</h1>
        </div>

        <div className="space-y-6 p-7">
          <div className="rounded-2xl border border-emerald-400/30 bg-emerald-400/10 px-4 py-3 text-center text-sm font-bold text-emerald-200">
            {getStatusLabel(ticket.status)}
          </div>

          <dl className="space-y-5">
            <div>
              <dt className="text-xs font-semibold text-zinc-500">
                DATA E HORÁRIO
              </dt>
              <dd className="mt-1 text-zinc-200">
                {formatDate(ticket.event.startsAt)}
              </dd>
            </div>

            <div>
              <dt className="text-xs font-semibold text-zinc-500">LOCAL</dt>
              <dd className="mt-1 text-zinc-200">
                {ticket.event.venueName}
                {ticket.event.venueAddress
                  ? ` · ${ticket.event.venueAddress}`
                  : ""}
              </dd>
            </div>

            <div>
              <dt className="text-xs font-semibold text-zinc-500">ASSENTO</dt>
              <dd className="mt-1 text-xl font-bold text-amber-300">
                {ticket.seat.label}
              </dd>
            </div>

            <div>
              <dt className="text-xs font-semibold text-zinc-500">
                CÓDIGO DO INGRESSO
              </dt>
              <dd className="mt-1 break-all font-mono text-sm text-zinc-300">
                {ticket.code}
              </dd>
            </div>
          </dl>

          <p className="border-t border-white/10 pt-5 text-xs leading-5 text-zinc-500">
            Esta é uma visualização pública e somente leitura. A validação do
            ingresso deve ser feita pela equipe de portaria.
          </p>
        </div>
      </section>
    </main>
  );
}
