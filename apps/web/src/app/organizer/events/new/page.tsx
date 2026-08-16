"use client";

import Link from "next/link";
import { type FormEvent, useState } from "react";
import { Header } from "@/components/header";
import { createEvent, searchMovies, type CatalogMovie } from "@/lib/api";

export default function NewEventPage() {
  const [query, setQuery] = useState("");
  const [movies, setMovies] = useState<CatalogMovie[]>([]);
  const [selectedMovie, setSelectedMovie] = useState<CatalogMovie | null>(null);

  const [title, setTitle] = useState("");
  const [overview, setOverview] = useState("");
  const [startsAt, setStartsAt] = useState("");
  const [venueName, setVenueName] = useState("");
  const [venueAddress, setVenueAddress] = useState("");
  const [price, setPrice] = useState("29.90");
  const [rows, setRows] = useState("5");
  const [seatsPerRow, setSeatsPerRow] = useState("8");

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSearch() {
    const accessToken = localStorage.getItem("cinepass:accessToken");

    if (!accessToken) {
      setError("Entre como organizador para buscar filmes.");
      return;
    }

    if (query.trim().length < 2) {
      setError("Digite pelo menos duas letras para buscar um filme.");
      return;
    }

    setError("");
    setIsSearching(true);

    try {
      setMovies(await searchMovies(accessToken, query));
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Não foi possível buscar os filmes.",
      );
    } finally {
      setIsSearching(false);
    }
  }

  function handleSelectMovie(movie: CatalogMovie) {
    setSelectedMovie(movie);
    setTitle(movie.title);
    setOverview(movie.overview ?? "");
    setMovies([]);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const accessToken = localStorage.getItem("cinepass:accessToken");

    if (!accessToken) {
      setError("Entre como organizador para criar um evento.");
      return;
    }

    setError("");
    setSuccess("");
    setIsSubmitting(true);

    try {
      await createEvent(accessToken, {
        tmdbMovieId: selectedMovie?.id,
        title,
        overview: overview || undefined,
        posterUrl: selectedMovie?.posterUrl ?? undefined,
        startsAt: new Date(startsAt).toISOString(),
        venueName,
        venueAddress: venueAddress || undefined,
        price: Number(price),
        seatLayout: {
          rows: Number(rows),
          seatsPerRow: Number(seatsPerRow),
        },
      });

      setSuccess(
        "Evento publicado com sucesso! Ele já aparece na programação.",
      );
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Não foi possível criar o evento.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#101114] text-zinc-100">
      <Header />

      <section className="mx-auto max-w-3xl px-6 py-12">
        <Link
          href="/"
          className="text-sm font-medium text-amber-400 hover:text-amber-300"
        >
          ← Voltar para programação
        </Link>

        <p className="mt-10 text-sm font-bold tracking-[0.18em] text-amber-400">
          ÁREA DO ORGANIZADOR
        </p>

        <h1 className="mt-3 text-4xl font-bold tracking-tight">
          Criar nova sessão
        </h1>

        <p className="mt-3 leading-7 text-zinc-400">
          Busque um filme no catálogo e defina os dados da sessão e do mapa de
          assentos.
        </p>

        <section className="mt-10 rounded-3xl border border-white/10 bg-zinc-900 p-6 sm:p-8">
          <div>
            <label className="text-sm font-medium text-zinc-200">
              Buscar filme no TMDb
            </label>

            <div className="mt-2 flex gap-3">
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    void handleSearch();
                  }
                }}
                placeholder="Ex.: Matrix"
                className="min-w-0 flex-1 rounded-xl border border-white/10 bg-zinc-950 px-4 py-3 outline-none transition focus:border-amber-400"
              />

              <button
                type="button"
                onClick={() => void handleSearch()}
                disabled={isSearching}
                className="rounded-xl border border-white/10 px-4 py-3 text-sm font-bold transition hover:border-amber-400 disabled:opacity-50"
              >
                {isSearching ? "Buscando..." : "Buscar"}
              </button>
            </div>

            {movies.length > 0 ? (
              <div className="mt-3 overflow-hidden rounded-xl border border-white/10">
                {movies.map((movie) => (
                  <button
                    key={movie.id}
                    type="button"
                    onClick={() => handleSelectMovie(movie)}
                    className="block w-full border-b border-white/10 px-4 py-3 text-left last:border-0 hover:bg-white/5"
                  >
                    <span className="font-medium">{movie.title}</span>
                    {movie.releaseDate ? (
                      <span className="ml-2 text-sm text-zinc-500">
                        ({movie.releaseDate.slice(0, 4)})
                      </span>
                    ) : null}
                  </button>
                ))}
              </div>
            ) : null}

            {selectedMovie ? (
              <p className="mt-3 text-sm text-emerald-300">
                Filme selecionado: {selectedMovie.title}
              </p>
            ) : null}
          </div>

          <form
            className="mt-8 space-y-5 border-t border-white/10 pt-8"
            onSubmit={handleSubmit}
          >
            <label className="block">
              <span className="text-sm font-medium">Título da sessão</span>
              <input
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                required
                className="mt-2 w-full rounded-xl border border-white/10 bg-zinc-950 px-4 py-3 outline-none transition focus:border-amber-400"
              />
            </label>

            <label className="block">
              <span className="text-sm font-medium">Descrição</span>
              <textarea
                value={overview}
                onChange={(event) => setOverview(event.target.value)}
                rows={4}
                className="mt-2 w-full rounded-xl border border-white/10 bg-zinc-950 px-4 py-3 outline-none transition focus:border-amber-400"
              />
            </label>

            <div className="grid gap-5 sm:grid-cols-2">
              <label className="block">
                <span className="text-sm font-medium">Data e horário</span>
                <input
                  type="datetime-local"
                  value={startsAt}
                  onChange={(event) => setStartsAt(event.target.value)}
                  required
                  className="mt-2 w-full rounded-xl border border-white/10 bg-zinc-950 px-4 py-3 outline-none transition focus:border-amber-400"
                />
              </label>

              <label className="block">
                <span className="text-sm font-medium">Preço (R$)</span>
                <input
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={price}
                  onChange={(event) => setPrice(event.target.value)}
                  required
                  className="mt-2 w-full rounded-xl border border-white/10 bg-zinc-950 px-4 py-3 outline-none transition focus:border-amber-400"
                />
              </label>
            </div>

            <label className="block">
              <span className="text-sm font-medium">Nome do local</span>
              <input
                value={venueName}
                onChange={(event) => setVenueName(event.target.value)}
                required
                minLength={2}
                className="mt-2 w-full rounded-xl border border-white/10 bg-zinc-950 px-4 py-3 outline-none transition focus:border-amber-400"
              />
            </label>

            <label className="block">
              <span className="text-sm font-medium">Endereço</span>
              <input
                value={venueAddress}
                onChange={(event) => setVenueAddress(event.target.value)}
                className="mt-2 w-full rounded-xl border border-white/10 bg-zinc-950 px-4 py-3 outline-none transition focus:border-amber-400"
              />
            </label>

            <div className="grid gap-5 sm:grid-cols-2">
              <label className="block">
                <span className="text-sm font-medium">
                  Quantidade de fileiras
                </span>
                <input
                  type="number"
                  min="1"
                  max="26"
                  value={rows}
                  onChange={(event) => setRows(event.target.value)}
                  required
                  className="mt-2 w-full rounded-xl border border-white/10 bg-zinc-950 px-4 py-3 outline-none transition focus:border-amber-400"
                />
              </label>

              <label className="block">
                <span className="text-sm font-medium">
                  Assentos por fileira
                </span>
                <input
                  type="number"
                  min="1"
                  max="50"
                  value={seatsPerRow}
                  onChange={(event) => setSeatsPerRow(event.target.value)}
                  required
                  className="mt-2 w-full rounded-xl border border-white/10 bg-zinc-950 px-4 py-3 outline-none transition focus:border-amber-400"
                />
              </label>
            </div>

            {error ? (
              <p className="rounded-xl border border-red-400/30 bg-red-400/10 px-4 py-3 text-sm text-red-200">
                {error}
              </p>
            ) : null}

            {success ? (
              <p className="rounded-xl border border-emerald-400/30 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-200">
                {success}
              </p>
            ) : null}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full rounded-xl bg-amber-400 px-4 py-3 font-bold text-zinc-950 transition hover:bg-amber-300 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? "Publicando..." : "Publicar evento"}
            </button>
          </form>
        </section>
      </section>
    </main>
  );
}
