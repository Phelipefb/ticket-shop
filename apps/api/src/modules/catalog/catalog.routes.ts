import { Router } from "express";
import { z } from "zod";
import { env } from "../../config/env.js";
import { authenticate, authorize } from "../../middlewares/authenticate.js";

export const catalogRouter = Router();

const searchMoviesSchema = z.object({
  query: z.string().trim().min(2).max(100),
});

catalogRouter.get(
  "/movies",
  authenticate,
  authorize("ORGANIZER"),
  async (request, response) => {
    const validation = searchMoviesSchema.safeParse(request.query);

    if (!validation.success) {
      return response.status(400).json({
        message: "Informe uma busca com pelo menos dois caracteres.",
      });
    }

    const url = new URL("https://api.themoviedb.org/3/search/movie");

    url.searchParams.set("query", validation.data.query);
    url.searchParams.set("language", "pt-BR");
    url.searchParams.set("include_adult", "false");

    try {
      const tmdbResponse = await fetch(url, {
        headers: {
          Authorization: `Bearer ${env.TMDB_ACCESS_TOKEN}`,
          Accept: "application/json",
        },
      });

      if (!tmdbResponse.ok) {
        console.error(`TMDb respondeu com status ${tmdbResponse.status}.`);

        return response.status(502).json({
          message: "Não foi possível consultar o catálogo de filmes.",
        });
      }

      const data = (await tmdbResponse.json()) as {
        results: Array<{
          id: number;
          title: string;
          overview: string;
          release_date: string;
          poster_path: string | null;
          vote_average: number;
        }>;
      };

      const movies = data.results.map((movie) => ({
        id: movie.id,
        title: movie.title,
        overview: movie.overview,
        releaseDate: movie.release_date || null,
        posterUrl: movie.poster_path
          ? `https://image.tmdb.org/t/p/w500${movie.poster_path}`
          : null,
        tmdbRating: movie.vote_average,
      }));

      return response.status(200).json({ movies });
    } catch (error) {
      console.error("Falha ao consultar o TMDb:", error);

      return response.status(502).json({
        message: "Não foi possível consultar o catálogo de filmes.",
      });
    }
  },
);
