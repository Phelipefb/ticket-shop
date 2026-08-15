import cors from "cors";
import express from "express";
import { env } from "./config/env.js";
import { prisma } from "./lib/prisma.js";

const app = express();

app.use(
  cors({
    origin: env.WEB_URL,
  }),
);

app.use(express.json());

app.get("/health", async (_request, response) => {
  try {
    await prisma.$queryRaw`SELECT 1`;

    return response.status(200).json({
      status: "ok",
      service: "ticket-shop-api",
      database: "connected",
    });
  } catch (error) {
    console.error("Falha ao conectar ao banco:", error);

    return response.status(503).json({
      status: "error",
      service: "ticket-shop-api",
      database: "unavailable",
    });
  }
});

app.listen(env.PORT, () => {
  console.log(`API disponível em http://localhost:${env.PORT}`);
});
