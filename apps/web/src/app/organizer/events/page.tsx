"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Header } from "@/components/header";
import { Button } from "@/components/ui/button";
import { deleteEvent, getMyEvents, type OrganizerEvent } from "@/lib/api";

export default function OrganizerEventsPage() {
  const [events, setEvents] = useState<OrganizerEvent[]>([]);
  const [error, setError] = useState("");
  useEffect(() => { const token = localStorage.getItem("cinepass:accessToken"); if (!token) return; void getMyEvents(token).then(setEvents).catch((e) => setError(e.message)); }, []);
  async function remove(eventId: string) {
    if (!window.confirm("Deseja cancelar este evento? Ele deixará de aparecer na programação.")) return;
    const token = localStorage.getItem("cinepass:accessToken"); if (!token) return;
    try { await deleteEvent(token, eventId); setEvents((items) => items.map((event) => event.id === eventId ? { ...event, status: "CANCELLED" } : event)); } catch (e) { setError(e instanceof Error ? e.message : "Não foi possível excluir o evento."); }
  }
  return <main className="min-h-screen bg-[#101114] text-zinc-100"><Header /><section className="mx-auto max-w-5xl px-6 py-12"><div className="flex items-center justify-between"><div><p className="text-sm font-bold tracking-[.18em] text-amber-400">ÁREA DO ORGANIZADOR</p><h1 className="mt-2 text-3xl font-bold">Meus eventos</h1></div><Link href="/organizer/events/new"><Button>Novo evento</Button></Link></div>{error && <p className="mt-6 text-red-300">{error}</p>}<div className="mt-8 grid gap-4">{events.map((event) => <article key={event.id} className="flex flex-wrap items-center gap-4 rounded-2xl border border-white/10 bg-zinc-900 p-5"><div className="min-w-0 flex-1"><h2 className="font-bold">{event.title}</h2><p className="mt-1 text-sm text-zinc-400">{event.venueName} · {new Date(event.startsAt).toLocaleString("pt-BR")}</p><p className="mt-1 text-xs text-zinc-500">{event.status}</p></div><Link href={`/organizer/events/${event.id}/edit`}><Button variant="outline">Editar</Button></Link><Button variant="destructive" onClick={() => void remove(event.id)} disabled={event.status === "CANCELLED"}>Excluir</Button></article>)}</div></section></main>;
}
