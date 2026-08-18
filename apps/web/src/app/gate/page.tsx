"use client";

import type { Html5QrcodeScanner } from "html5-qrcode";
import { type FormEvent, useEffect, useState } from "react";
import { Header } from "@/components/header";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  getPublishedEvents,
  validateTicket,
  type PublicEvent,
  type TicketValidation,
} from "@/lib/api";

function getResultClassName(result: TicketValidation["result"]) {
  if (result === "VALID") {
    return "border-emerald-400/30 bg-emerald-400/10 text-emerald-100";
  }

  if (result === "ALREADY_USED") {
    return "border-amber-400/30 bg-amber-400/10 text-amber-100";
  }

  return "border-red-400/30 bg-red-400/10 text-red-100";
}

function getResultTitle(result: TicketValidation["result"]) {
  if (result === "VALID") return "Entrada liberada";
  if (result === "ALREADY_USED") return "Ingresso já utilizado";
  if (result === "EVENT_WRONG") return "Ingresso de outro evento";

  return "Ingresso inválido";
}

export default function GatePage() {
  const [events, setEvents] = useState<PublicEvent[]>([]);
  const [eventId, setEventId] = useState("");
  const [code, setCode] = useState("");
  const [result, setResult] = useState<TicketValidation | null>(null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    getPublishedEvents()
      .then((loadedEvents) => {
        setEvents(loadedEvents);
        setEventId(loadedEvents[0]?.id ?? "");
      })
      .catch(() => {
        setError("Não foi possível carregar os eventos.");
      });
  }, []);

  useEffect(() => {
    let scanner: Html5QrcodeScanner | undefined;
    let isActive = true;

    void import("html5-qrcode").then(({ Html5QrcodeScanner }) => {
      if (!isActive) {
        return;
      }

      scanner = new Html5QrcodeScanner(
        "qr-reader",
        {
          fps: 10,
          qrbox: {
            width: 220,
            height: 220,
          },
        },
        false,
      );

      scanner.render(
        (decodedText) => {
          setCode(decodedText);
        },
        () => {
          // Erros durante a procura por um QR Code são esperados e ignorados.
        },
      );
    });

    return () => {
      isActive = false;

      if (scanner) {
        void scanner.clear();
      }
    };
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const accessToken = localStorage.getItem("cinepass:accessToken");

    if (!accessToken) {
      setError("Entre como usuário de portaria para validar ingressos.");
      return;
    }

    if (!eventId || !code.trim()) {
      setError("Selecione o evento e informe ou leia o código do ingresso.");
      return;
    }

    setError("");
    setResult(null);
    setIsLoading(true);

    try {
      setResult(await validateTicket(accessToken, eventId, code.trim()));
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Não foi possível validar o ingresso.",
      );
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#101114] text-zinc-100">
      <Header />

      <section className="mx-auto max-w-5xl px-6 py-12">
        <p className="text-sm font-bold tracking-[0.18em] text-amber-400">
          PORTARIA
        </p>

        <h1 className="mt-3 text-4xl font-bold tracking-tight">
          Validar ingresso
        </h1>

        <p className="mt-3 max-w-2xl leading-7 text-zinc-400">
          Selecione o evento, use a câmera para ler o QR Code ou informe o
          código manualmente.
        </p>

        <div className="mt-10 grid gap-8 lg:grid-cols-[1fr_1fr]">
          <section className="rounded-3xl border border-white/10 bg-zinc-900 p-6">
            <h2 className="text-lg font-bold">Leitor de QR Code</h2>
            <p className="mt-2 text-sm text-zinc-400">
              Autorize o uso da câmera quando o navegador solicitar.
            </p>

            <div
              id="qr-reader"
              className="mt-6 overflow-hidden rounded-2xl bg-zinc-950 p-2"
            />
          </section>

          <section className="rounded-3xl border border-white/10 bg-zinc-900 p-6">
            <h2 className="text-lg font-bold">Validação manual</h2>

            <form className="mt-6 space-y-5" onSubmit={handleSubmit}>
              <div className="space-y-2">
                <Label htmlFor="eventId" className="text-zinc-200">
                  Evento
                </Label>

                <Select
                  value={eventId}
                  onValueChange={(value) => setEventId(value ?? "")}
                  disabled={events.length === 0}
                >
                  <SelectTrigger
                    id="eventId"
                    className="h-12 w-full rounded-xl border-white/10 bg-zinc-950 px-4 text-zinc-100 focus-visible:border-amber-400"
                  >
                    <SelectValue placeholder="Carregando eventos..." />
                  </SelectTrigger>

                  <SelectContent className="bg-zinc-900 text-zinc-100">
                    {events.map((event) => (
                      <SelectItem key={event.id} value={event.id}>
                        {event.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="ticketCode" className="text-zinc-200">
                  Código do ingresso
                </Label>

                <Input
                  id="ticketCode"
                  value={code}
                  onChange={(event) => setCode(event.target.value)}
                  placeholder="TKT-..."
                  required
                  className="h-12 rounded-xl border-white/10 bg-zinc-950 px-4 font-mono text-sm text-zinc-100 focus-visible:border-amber-400"
                />
              </div>

              {error ? (
                <Alert
                  variant="destructive"
                  className="border-red-400/30 bg-red-400/10 text-red-200"
                >
                  <AlertDescription className="text-red-200">
                    {error}
                  </AlertDescription>
                </Alert>
              ) : null}
              <Button
                type="submit"
                disabled={isLoading}
                className="h-12 w-full rounded-xl font-bold"
              >
                {isLoading ? "Validando..." : "Validar ingresso"}
              </Button>
            </form>

            {result ? (
              <div
                className={`mt-6 rounded-2xl border p-5 ${getResultClassName(result.result)}`}
              >
                <p className="font-bold">{getResultTitle(result.result)}</p>
                <p className="mt-2 text-sm">{result.message}</p>

                {result.ticket ? (
                  <p className="mt-3 text-sm">
                    {result.ticket.eventTitle} · Assento{" "}
                    {result.ticket.seatLabel}
                  </p>
                ) : null}
              </div>
            ) : null}
          </section>
        </div>
      </section>
    </main>
  );
}
