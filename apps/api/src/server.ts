import cors from "cors";
import dotenv from "dotenv";
import express from "express";

dotenv.config();

const app = express();
const port = Number(process.env.PORT ?? 3333);

app.use(
  cors({
    origin: process.env.WEB_URL ?? "http://localhost:3000",
  }),
);

app.use(express.json());

app.get("/health", (_request, response) => {
  return response.status(200).json({
    status: "ok",
    service: "ticket-shop-api",
  });
});

app.listen(port, () => {
  console.log(`API disponível em http://localhost:${port}`);
});
