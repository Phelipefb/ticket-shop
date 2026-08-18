"use client";

import Link from "next/link";
import { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import type { PublicEvent } from "@/lib/api";

gsap.registerPlugin(useGSAP);

type EventGridProps = {
  events: PublicEvent[];
};

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

export function EventGrid({ events }: EventGridProps) {
  const container = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const cards = gsap.utils.toArray<HTMLElement>("[data-event-card]");

      const media = gsap.matchMedia();

      media.add("(prefers-reduced-motion: no-preference)", () => {
        gsap.from(cards, {
          opacity: 0,
          y: 24,
          duration: 0.45,
          stagger: 0.09,
          ease: "power2.out",
          onComplete: () => {
            gsap.set(cards, { clearProps: "transform,opacity" });
          },
        });
      });

      return () => media.revert();
    },
    { scope: container },
  );

  return (
    <div ref={container} className="grid gap-5 md:grid-cols-2">
      {events.map((event) => (
        <Link
          key={event.id}
          href={`/events/${event.id}`}
          data-event-card
          className="block rounded-2xl border border-white/10 bg-zinc-900 p-6 transition hover:-translate-y-1 hover:border-amber-400/50"
        >
          <div className="flex items-start justify-between gap-6">
            <div>
              <p className="text-sm font-medium text-amber-400">
                {formatDate(event.startsAt)}
              </p>

              <h3 className="mt-3 text-2xl font-bold">{event.title}</h3>

              <p className="mt-3 line-clamp-2 text-sm leading-6 text-zinc-400">
                {event.overview ?? "Sessão especial em cartaz."}
              </p>
            </div>

            <span className="shrink-0 text-lg font-bold">
              {formatPrice(event.price)}
            </span>
          </div>

          <div className="mt-6 flex flex-wrap gap-2 text-sm text-zinc-300">
            <span className="rounded-full bg-white/5 px-3 py-1">
              {event.venueName}
            </span>

            <span className="rounded-full bg-white/5 px-3 py-1">
              {event.seatCount} assentos
            </span>
          </div>
        </Link>
      ))}
    </div>
  );
}
