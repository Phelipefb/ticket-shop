import cors from "cors";
import express from "express";
import { prisma } from "./lib/prisma.js";

const app = express();
const port = Number(process.env.PORT ?? 3333);

app.use(
  cors({
    origin: process.env.WEB_URL ?? "http://localhost:3000",
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

app.listen(port, () => {
  console.log(`API disponível em http://localhost:${port}`);
});
