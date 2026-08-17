import request from "supertest";
import { describe, expect, it, vi } from "vitest";

vi.mock("../src/lib/prisma.js", () => ({
  prisma: {
    $queryRaw: vi.fn().mockResolvedValue([{ ok: 1 }]),
  },
}));

import { app } from "../src/app.js";

describe("GET /health", () => {
  it("retorna que a API e o banco estão disponíveis", async () => {
    const response = await request(app).get("/health");

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      status: "ok",
      service: "ticket-shop-api",
      database: "connected",
    });
  });
});
