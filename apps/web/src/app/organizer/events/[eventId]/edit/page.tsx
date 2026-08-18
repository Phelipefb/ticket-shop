"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { getEventDetails, updateEvent } from "@/lib/api";
import { Header } from "@/components/header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export default function EditEventPage() {
  const { eventId } = useParams<{ eventId: string }>();
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [overview, setOverview] = useState("");
  const [startsAt, setStartsAt] = useState("");
  const [venueName, setVenueName] = useState("");
  const [venueAddress, setVenueAddress] = useState("");
  const [price, setPrice] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    void getEventDetails(eventId).then((event) => {
      if (!event) return setError("Evento não encontrado.");
      setTitle(event.title); setOverview(event.overview ?? "");
      setStartsAt(new Date(event.startsAt).toISOString().slice(0, 16));
      setVenueName(event.venueName); setVenueAddress(event.venueAddress ?? "");
      setPrice(String(event.price));
    });
  }, [eventId]);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const token = localStorage.getItem("cinepass:accessToken");
    if (!token) return setError("Entre como organizador para editar o evento.");
    try {
      await updateEvent(token, eventId, { title, overview, startsAt: new Date(startsAt).toISOString(), venueName, venueAddress, price: Number(price) });
      router.push(`/events/${eventId}`);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Não foi possível atualizar o evento."); }
  }

  return <main className="min-h-screen bg-[#101114] text-zinc-100"><Header /><form onSubmit={submit} className="mx-auto max-w-2xl space-y-5 px-6 py-12"><h1 className="text-3xl font-bold">Editar sessão</h1>{error && <p className="text-red-300">{error}</p>}<div><Label>Título</Label><Input value={title} onChange={(e) => setTitle(e.target.value)} required /></div><div><Label>Descrição</Label><Textarea value={overview} onChange={(e) => setOverview(e.target.value)} /></div><div><Label>Data e horário</Label><Input type="datetime-local" value={startsAt} onChange={(e) => setStartsAt(e.target.value)} required /></div><div><Label>Local</Label><Input value={venueName} onChange={(e) => setVenueName(e.target.value)} required /></div><div><Label>Endereço</Label><Input value={venueAddress} onChange={(e) => setVenueAddress(e.target.value)} /></div><div><Label>Preço</Label><Input type="number" step="0.01" value={price} onChange={(e) => setPrice(e.target.value)} required /></div><Button type="submit">Salvar alterações</Button></form></main>;
}
