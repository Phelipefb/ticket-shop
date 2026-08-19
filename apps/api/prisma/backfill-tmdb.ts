import { env } from "../src/config/env.js";
import { prisma } from "../src/lib/prisma.js";

type TmdbMovie = {
  poster_path: string | null;
  vote_average: number;
};

async function main() {
  const events = await prisma.event.findMany({
    where: {
      status: "PUBLISHED",
      tmdbMovieId: { not: null },
    },
    select: {
      id: true,
      title: true,
      tmdbMovieId: true,
    },
  });

  let updated = 0;

  for (const event of events) {
    const response = await fetch(
      `https://api.themoviedb.org/3/movie/${event.tmdbMovieId}?language=pt-BR`,
      {
        headers: {
          Authorization: `Bearer ${env.TMDB_ACCESS_TOKEN}`,
          Accept: "application/json",
        },
      },
    );

    if (!response.ok) {
      console.warn(`TMDb não encontrou dados para: ${event.title}`);
      continue;
    }

    const movie = (await response.json()) as TmdbMovie;

    await prisma.event.update({
      where: { id: event.id },
      data: {
        tmdbRating: movie.vote_average,
        ...(movie.poster_path
          ? { posterUrl: `https://image.tmdb.org/t/p/w500${movie.poster_path}` }
          : {}),
      },
    });

    updated += 1;
    console.log(`Atualizado: ${event.title}`);
  }

  console.log(`Concluído: ${updated} evento(s) atualizado(s).`);
}

main()
  .catch((error) => {
    console.error("Falha ao atualizar dados do TMDb:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
