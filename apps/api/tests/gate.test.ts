import jwt from "jsonwebtoken";
import request from "supertest";
import { beforeEach, describe, expect, it } from "vitest";
import { app } from "../src/app.js";
import { env } from "../src/config/env.js";
import { prisma } from "../src/lib/prisma.js";

describe("POST /gate/tickets/validate", () => {
  let gatekeeperId: string;
  let eventId: string;
  let ticketCode: string;

  beforeEach(async () => {
    await prisma.ticket.deleteMany();
    await prisma.payment.deleteMany();
    await prisma.reservation.deleteMany();
    await prisma.seat.deleteMany();
    await prisma.event.deleteMany();
    await prisma.user.deleteMany();

    const organizer = await prisma.user.create({
      data: {
        name: "Organizador de teste",
        email: "organizer-gate@test.dev",
        passwordHash: "not-used-in-this-test",
        role: "ORGANIZER",
      },
    });

    const customer = await prisma.user.create({
      data: {
        name: "Cliente de teste",
        email: "customer-gate@test.dev",
        passwordHash: "not-used-in-this-test",
        role: "CUSTOMER",
      },
    });

    const gatekeeper = await prisma.user.create({
      data: {
        name: "Portaria de teste",
        email: "gatekeeper@test.dev",
        passwordHash: "not-used-in-this-test",
        role: "GATEKEEPER",
      },
    });

    const event = await prisma.event.create({
      data: {
        title: "Sessão de portaria",
        startsAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        venueName: "Sala de teste",
        price: 30,
        capacity: 1,
        status: "PUBLISHED",
        organizerId: organizer.id,
      },
    });

    const seat = await prisma.seat.create({
      data: {
        eventId: event.id,
        row: "A",
        number: 1,
        label: "A1",
      },
    });

    const reservation = await prisma.reservation.create({
      data: {
        eventId: event.id,
        seatId: seat.id,
        customerId: customer.id,
        status: "CONFIRMED",
        expiresAt: new Date(Date.now() + 10 * 60 * 1000),
      },
    });

    ticketCode = "TKT-gate-test";

    await prisma.ticket.create({
      data: {
        reservationId: reservation.id,
        seatId: seat.id,
        code: ticketCode,
        qrTokenHash: "hash-for-test-only",
        shareToken: "share-token-for-test-only",
      },
    });

    gatekeeperId = gatekeeper.id;
    eventId = event.id;
  });

  function createGatekeeperToken() {
    return jwt.sign({ role: "GATEKEEPER" }, env.JWT_SECRET, {
      subject: gatekeeperId,
      expiresIn: "1h",
    });
  }

  it("aceita o ingresso uma vez e bloqueia uma segunda entrada", async () => {
    const validResponse = await request(app)
      .post("/gate/tickets/validate")
      .set("Authorization", `Bearer ${createGatekeeperToken()}`)
      .send({
        eventId,
        code: ticketCode,
      });

    expect(validResponse.status).toBe(200);
    expect(validResponse.body.result).toBe("VALID");

    const repeatedResponse = await request(app)
      .post("/gate/tickets/validate")
      .set("Authorization", `Bearer ${createGatekeeperToken()}`)
      .send({
        eventId,
        code: ticketCode,
      });

    expect(repeatedResponse.status).toBe(200);
    expect(repeatedResponse.body.result).toBe("ALREADY_USED");

    const ticket = await prisma.ticket.findUniqueOrThrow({
      where: { code: ticketCode },
    });

    expect(ticket.status).toBe("USED");
    expect(ticket.validatedById).toBe(gatekeeperId);
  });

  it("informa quando o código do ingresso não existe", async () => {
    const response = await request(app)
      .post("/gate/tickets/validate")
      .set("Authorization", `Bearer ${createGatekeeperToken()}`)
      .send({
        eventId,
        code: "TKT-inexistente",
      });

    expect(response.status).toBe(200);
    expect(response.body.result).toBe("INVALID");
  });
});
