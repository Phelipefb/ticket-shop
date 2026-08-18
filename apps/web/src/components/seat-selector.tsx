"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { createReservation, type EventSeat, type Reservation } from "@/lib/api";

gsap.registerPlugin(useGSAP);

type SeatSelectorProps = {
  eventId: string;
  price: number;
  initialSeats: EventSeat[];
};

function formatPrice(price: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(price);
}

function formatDate(date: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    timeStyle: "short",
  }).format(new Date(date));
}

function getAvailabilityLabel(availability: EventSeat["availability"]) {
  if (availability === "SOLD") return "Vendido";
  if (availability === "RESERVED") return "Em reserva";

  return "Disponível";
}

function getSeatClassName(seat: EventSeat, isSelected: boolean) {
  const commonClassName =
    "flex aspect-square items-center justify-center rounded-md border text-xs font-semibold transition";

  if (seat.availability === "SOLD") {
    return `${commonClassName} cursor-not-allowed border-zinc-800 bg-zinc-800 text-zinc-600`;
  }

  if (seat.availability === "RESERVED") {
    return `${commonClassName} cursor-not-allowed border-amber-400/20 bg-amber-400/15 text-amber-300`;
  }

  if (isSelected) {
    return `${commonClassName} border-amber-300 bg-amber-400 text-zinc-950 ring-2 ring-amber-200/50`;
  }

  return `${commonClassName} border-emerald-400/20 bg-emerald-400/15 text-emerald-300 hover:border-emerald-300 hover:bg-emerald-400/25`;
}

export function SeatSelector({
  eventId,
  price,
  initialSeats,
}: SeatSelectorProps) {
  const router = useRouter();
  const [seats, setSeats] = useState(initialSeats);
  const [selectedSeatId, setSelectedSeatId] = useState<string | null>(null);
  const [reservation, setReservation] = useState<Reservation | null>(null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const seatMapRef = useRef<HTMLDivElement>(null);

  const { contextSafe } = useGSAP({ scope: seatMapRef });

  const handleSeatSelection = contextSafe(
    (seatId: string, button: HTMLButtonElement) => {
      setError("");
      setSelectedSeatId(seatId);

      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        return;
      }

      gsap.fromTo(
        button,
        { scale: 0.7 },
        {
          keyframes: [
            {
              scale: 1.22,
              duration: 0.25,
              ease: "power3.out",
            },
            {
              scale: 1,
              duration: 0.45,
              ease: "elastic.out(1, 0.4)",
            },
          ],
          overwrite: "auto",
        },
      );
    },
  );

  const selectedSeat = seats.find((seat) => seat.id === selectedSeatId) ?? null;

  const seatsByRow = seats.reduce<Record<string, EventSeat[]>>((rows, seat) => {
    rows[seat.row] ??= [];
    rows[seat.row].push(seat);

    return rows;
  }, {});

  async function handleReservation() {
    if (!selectedSeat) {
      return;
    }

    const accessToken = localStorage.getItem("cinepass:accessToken");

    if (!accessToken) {
      setError("Entre na sua conta antes de reservar um assento.");
      return;
    }

    setError("");
    setIsLoading(true);

    try {
      const createdReservation = await createReservation(
        accessToken,
        eventId,
        selectedSeat.id,
      );

      setReservation(createdReservation);
      sessionStorage.setItem(
        "cinepass:reservation",
        JSON.stringify(createdReservation),
      );

      router.push(`/checkout/${createdReservation.id}`);
      setSeats((currentSeats) =>
        currentSeats.map((seat) =>
          seat.id === selectedSeat.id
            ? { ...seat, availability: "RESERVED" }
            : seat,
        ),
      );
      setSelectedSeatId(null);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Não foi possível reservar o assento.";

      setError(message);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <section className="rounded-3xl border border-white/10 bg-zinc-900 p-6 sm:p-8">
      <div className="flex items-center justify-between gap-4">
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

        <span className="shrink-0 rounded-full bg-white/5 px-3 py-1 text-sm text-zinc-300">
          {seats.length} lugares
        </span>
      </div>

      <div
        ref={seatMapRef}
        className="mx-auto mt-10 max-w-md overflow-x-auto pb-2"
      >
        <div className="rounded-t-full bg-zinc-700 py-2 text-center text-xs font-bold tracking-[0.3em] text-zinc-300">
          TELA
        </div>

        <div className="mt-8 min-w-max space-y-3">
          {Object.entries(seatsByRow).map(([row, rowSeats]) => (
            <div key={row} className="flex items-center gap-3">
              <span className="w-4 text-xs font-bold text-zinc-500">{row}</span>

              <div
                className="grid gap-2"
                style={{
                  gridTemplateColumns: `repeat(${rowSeats.length}, minmax(2rem, 1fr))`,
                }}
              >
                {rowSeats.map((seat) => {
                  const isSelected = seat.id === selectedSeatId;
                  const isAvailable = seat.availability === "AVAILABLE";

                  return (
                    <button
                      key={seat.id}
                      type="button"
                      disabled={
                        !isAvailable || isLoading || Boolean(reservation)
                      }
                      title={`${seat.label}: ${getAvailabilityLabel(seat.availability)}`}
                      aria-pressed={isSelected}
                      onClick={(event) => {
                        handleSeatSelection(seat.id, event.currentTarget);
                      }}
                      className={getSeatClassName(seat, isSelected)}
                    >
                      {seat.number}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {reservation ? (
        <div className="mt-8 rounded-2xl border border-amber-400/30 bg-amber-400/10 p-4 text-sm text-amber-100">
          Assento {reservation.seat.label} reservado até{" "}
          {formatDate(reservation.expiresAt)}. O pagamento será o próximo passo.
        </div>
      ) : (
        <div className="mt-8 border-t border-white/10 pt-6">
          <p className="text-sm text-zinc-400">
            {selectedSeat
              ? `Assento ${selectedSeat.label} selecionado`
              : "Selecione um assento disponível."}
          </p>

          {error ? (
            <p className="mt-3 rounded-xl border border-red-400/30 bg-red-400/10 px-4 py-3 text-sm text-red-200">
              {error}
            </p>
          ) : null}

          <button
            type="button"
            disabled={!selectedSeat || isLoading}
            onClick={handleReservation}
            className="mt-4 w-full rounded-xl bg-amber-400 px-4 py-3 font-bold text-zinc-950 transition hover:bg-amber-300 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isLoading
              ? "Reservando..."
              : selectedSeat
                ? `Reservar por ${formatPrice(price)}`
                : "Escolha um assento"}
          </button>
        </div>
      )}
    </section>
  );
}
