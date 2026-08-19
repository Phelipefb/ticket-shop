"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { PublicEvent } from "@/lib/api";

type EventCarouselProps = {
  events: PublicEvent[];
};

function formatDate(date: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date));
}

function formatPrice(price: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(price);
}

export function EventCarousel({ events }: EventCarouselProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [expandedEventId, setExpandedEventId] = useState<string | null>(null);

  useEffect(() => {
    if (events.length < 2 || isPaused) return;

    const timer = window.setInterval(() => {
      setActiveIndex((current) => (current + 1) % events.length);
    }, 6500);

    return () => window.clearInterval(timer);
  }, [events.length, isPaused]);

  if (events.length === 0) return null;

  const goToSlide = (index: number) => {
    setActiveIndex((index + events.length) % events.length);
  };

  return (
    <section className="mx-auto max-w-6xl px-6 pb-12 pt-10 sm:pt-14">
      <div
        className="group relative overflow-hidden rounded-3xl border border-white/10 bg-zinc-900 shadow-2xl shadow-black/25"
        aria-roledescription="carrossel"
        aria-label="Eventos em destaque"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
        onFocus={() => setIsPaused(true)}
        onBlur={() => setIsPaused(false)}
      >
        {events.map((event, index) => {
          const isActive = index === activeIndex;

          return (
            <article
              key={event.id}
              aria-hidden={!isActive}
              className={`transition-opacity duration-700 ease-out ${
                isActive
                  ? "relative min-h-[430px] opacity-100 sm:min-h-[400px]"
                  : "pointer-events-none absolute inset-0 opacity-0"
              }`}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-zinc-950 via-zinc-950/95 to-zinc-950/55" />

              <div className="absolute right-0 top-0 h-full w-1/2 bg-[radial-gradient(circle_at_top,_#f59e0b33,_transparent_60%)] sm:w-[46%]" />

              {event.posterUrl ? (
                <img
                  src={event.posterUrl}
                  alt=""
                  className="absolute right-0 top-0 h-full w-1/2 rounded-2xl p-5 object-contain sm:w-[46%] sm:p-7"
                />
              ) : null}

              <div className="relative flex min-h-[430px] max-w-2xl flex-col justify-center pb-20 pl-20 pr-14 pt-9 sm:min-h-[400px] sm:pb-24 sm:pl-28 sm:pr-20 sm:pt-12">
                <p className="text-xs font-bold tracking-[0.22em] text-amber-400">
                  EVENTO EM DESTAQUE
                </p>

                <h1 className="mt-4 text-3xl font-bold tracking-tight text-white sm:text-5xl">
                  {event.title}
                </h1>

                <p
                  className={`mt-4 max-w-xl text-sm leading-6 text-zinc-300 sm:text-base ${
                    expandedEventId === event.id ? "" : "line-clamp-2"
                  }`}
                >
                  {event.overview ?? "Uma sessão especial para você garantir seu lugar."}
                </p>

                {event.overview ? (
                  <button
                    type="button"
                    onClick={() =>
                      setExpandedEventId((current) =>
                        current === event.id ? null : event.id,
                      )
                    }
                    className="mt-2 w-fit text-sm font-semibold text-amber-400 transition hover:text-amber-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-300"
                    aria-expanded={expandedEventId === event.id}
                  >
                    {expandedEventId === event.id ? "Ler menos" : "Ler mais"}
                  </button>
                ) : null}

                <div className="mt-6 flex flex-wrap gap-2 text-sm">
                  <span className="rounded-full bg-white/10 px-3 py-1.5 text-zinc-100">
                    {formatDate(event.startsAt)}
                  </span>
                  <span className="rounded-full bg-white/10 px-3 py-1.5 text-zinc-100">
                    {event.venueName}
                  </span>
                  {event.tmdbRating !== null ? (
                    <span className="rounded-full bg-amber-400/15 px-3 py-1.5 text-amber-300">
                      ★ {event.tmdbRating.toFixed(1)} / 10
                    </span>
                  ) : null}
                </div>

                <div className="mt-8 flex items-center gap-5">
                  <Link
                    href={`/events/${event.id}`}
                    tabIndex={isActive ? 0 : -1}
                    className="rounded-xl bg-amber-400 px-5 py-3 text-sm font-bold text-zinc-950 transition hover:bg-amber-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-300"
                  >
                    Ver sessão · {formatPrice(event.price)}
                  </Link>
                  <span className="text-sm text-zinc-400">
                    {event.seatCount} assentos disponíveis
                  </span>
                </div>
              </div>
            </article>
          );
        })}

        {events.length > 1 ? (
          <>
            <button
              type="button"
              onClick={() => goToSlide(activeIndex - 1)}
              className="absolute left-4 top-1/2 grid size-10 -translate-y-1/2 place-items-center rounded-full border border-white/15 bg-zinc-950/70 text-xl text-white opacity-0 transition hover:bg-zinc-800 focus-visible:opacity-100 group-hover:opacity-100"
              aria-label="Evento anterior"
            >
              ←
            </button>
            <button
              type="button"
              onClick={() => goToSlide(activeIndex + 1)}
              className="absolute right-4 top-1/2 grid size-10 -translate-y-1/2 place-items-center rounded-full border border-white/15 bg-zinc-950/70 text-xl text-white opacity-0 transition hover:bg-zinc-800 focus-visible:opacity-100 group-hover:opacity-100"
              aria-label="Próximo evento"
            >
              →
            </button>

            <div className="absolute bottom-5 left-7 flex gap-2 sm:left-12">
              {events.map((event, index) => (
                <button
                  key={event.id}
                  type="button"
                  onClick={() => goToSlide(index)}
                  className={`h-2 rounded-full transition-all ${
                    index === activeIndex ? "w-7 bg-amber-400" : "w-2 bg-white/40 hover:bg-white/70"
                  }`}
                  aria-label={`Mostrar evento ${index + 1}: ${event.title}`}
                  aria-current={index === activeIndex ? "true" : undefined}
                />
              ))}
            </div>
          </>
        ) : null}
      </div>
    </section>
  );
}
