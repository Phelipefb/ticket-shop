"use client";

import Link from "next/link";
import { QRCodeSVG } from "qrcode.react";
import { useEffect, useState } from "react";
import { Header } from "@/components/header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { getMyTickets, type Ticket } from "@/lib/api";

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

function getStatusLabel(status: Ticket["status"]) {
  if (status === "USED") return "Utilizado";
  if (status === "VOID") return "Cancelado";

  return "Válido";
}

function getStatusClassName(status: Ticket["status"]) {
  if (status === "USED") {
    return "bg-zinc-700 text-zinc-300";
  }

  if (status === "VOID") {
    return "bg-red-400/15 text-red-300";
  }

  return "bg-emerald-400/15 text-emerald-300";
}

export default function TicketsPage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [copiedTicketId, setCopiedTicketId] = useState("");

  useEffect(() => {
    const accessToken = localStorage.getItem("cinepass:accessToken");

    if (!accessToken) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setError("Entre na sua conta para acessar seus ingressos.");
      setIsLoading(false);
      return;
    }

    getMyTickets(accessToken)
      .then(setTickets)
      .catch((error) => {
        const message =
          error instanceof Error
            ? error.message
            : "Não foi possível carregar os ingressos.";

        setError(message);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, []);

  async function handleShare(ticket: Ticket) {
    const shareUrl = `${window.location.origin}/tickets/share/${ticket.shareToken}`;

    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopiedTicketId(ticket.id);
    } catch {
      window.prompt("Copie o link do ingresso:", shareUrl);
    }
  }

  return (
    <main className="min-h-screen bg-[#101114] text-zinc-100">
      <Header />

      <section className="mx-auto max-w-6xl px-6 py-12">
        <p className="text-sm font-bold tracking-[0.18em] text-amber-400">
          MINHA CONTA
        </p>

        <h1 className="mt-3 text-4xl font-bold tracking-tight">
          Meus ingressos
        </h1>

        <p className="mt-3 max-w-2xl leading-7 text-zinc-400">
          Apresente o QR Code ou o código do ingresso na entrada do evento.
        </p>

        {isLoading ? (
          <p className="mt-10 text-zinc-400">Carregando ingressos...</p>
        ) : error ? (
          <div className="mt-10 rounded-2xl border border-red-400/30 bg-red-400/10 p-6 text-red-200">
            <p>{error}</p>

            <Link
              href="/login"
              className="mt-4 inline-flex font-bold text-amber-300 hover:text-amber-200"
            >
              Ir para login
            </Link>
          </div>
        ) : tickets.length === 0 ? (
          <div className="mt-10 rounded-2xl border border-dashed border-white/15 p-10 text-center">
            <p className="text-zinc-400">
              Você ainda não possui ingressos confirmados.
            </p>

            <Link
              href="/"
              className="mt-5 inline-flex rounded-xl bg-amber-400 px-4 py-3 font-bold text-zinc-950"
            >
              Ver programação
            </Link>
          </div>
        ) : (
          <div className="mt-10 grid gap-6 lg:grid-cols-2">
            {tickets.map((ticket) => (
              <Card
                key={ticket.id}
                className="gap-0 overflow-hidden rounded-3xl border border-white/10 bg-zinc-900 py-0 ring-0"
              >
                <div className="flex items-start justify-between gap-4 border-b border-white/10 p-6">
                  <div>
                    <p className="text-xs font-bold tracking-[0.16em] text-amber-400">
                      INGRESSO
                    </p>
                    <h2 className="mt-2 text-xl font-bold">
                      {ticket.event.title}
                    </h2>
                  </div>

                  <Badge
                    className={`h-auto shrink-0 rounded-full px-3 py-1 text-xs font-bold ${getStatusClassName(ticket.status)}`}
                  >
                    {getStatusLabel(ticket.status)}
                  </Badge>
                </div>

                <div className="grid gap-6 p-6 sm:grid-cols-[1fr_auto]">
                  <dl className="space-y-4 text-sm">
                    <div>
                      <dt className="text-xs font-semibold text-zinc-500">
                        DATA E HORÁRIO
                      </dt>
                      <dd className="mt-1 text-zinc-200">
                        {formatDate(ticket.event.startsAt)}
                      </dd>
                    </div>

                    <div>
                      <dt className="text-xs font-semibold text-zinc-500">
                        LOCAL
                      </dt>
                      <dd className="mt-1 text-zinc-200">
                        {ticket.event.venueName}
                        {ticket.event.venueAddress
                          ? ` · ${ticket.event.venueAddress}`
                          : ""}
                      </dd>
                    </div>

                    <div className="flex gap-8">
                      <div>
                        <dt className="text-xs font-semibold text-zinc-500">
                          ASSENTO
                        </dt>
                        <dd className="mt-1 font-bold text-amber-300">
                          {ticket.seat.label}
                        </dd>
                      </div>

                      <div>
                        <dt className="text-xs font-semibold text-zinc-500">
                          VALOR
                        </dt>
                        <dd className="mt-1 text-zinc-200">
                          {formatPrice(ticket.event.price)}
                        </dd>
                      </div>
                    </div>
                  </dl>

                  <div className="rounded-2xl bg-white p-3">
                    <QRCodeSVG
                      value={ticket.qrPayload}
                      size={132}
                      level="M"
                      includeMargin
                    />
                  </div>
                </div>

                <div className="flex items-end justify-between gap-4 border-t border-dashed border-white/15 px-6 py-4">
                  <div>
                    <p className="text-xs text-zinc-500">CÓDIGO DO INGRESSO</p>
                    <p className="mt-1 break-all font-mono text-xs text-zinc-300">
                      {ticket.code}
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => handleShare(ticket)}
                    className="h-auto shrink-0 rounded-lg border-white/10 px-3 py-2 text-zinc-200 hover:border-amber-400 hover:text-amber-300"
                  >
                    {copiedTicketId === ticket.id
                      ? "Link copiado!"
                      : "Compartilhar"}
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
