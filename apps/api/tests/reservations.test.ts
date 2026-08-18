import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import request from "supertest";
import { beforeEach, describe, expect, it } from "vitest";
import { app } from "../src/app.js";
import { env } from "../src/config/env.js";
import { prisma } from "../src/lib/prisma.js";

describe("POST /reservations", () => {
  let customerOneId: string;
  let customerTwoId: string;
  let eventId: string;
  let seatId: string;

  beforeEach(async () => {
    await prisma.ticketValidation.deleteMany();
    await prisma.ticket.deleteMany();
    await prisma.payment.deleteMany();
    await prisma.reservation.deleteMany();
    await prisma.seat.deleteMany();
    await prisma.event.deleteMany();
    await prisma.user.deleteMany();

    const passwordHash = await bcrypt.hash("Password123!", 4);

    const organizer = await prisma.user.create({
      data: {
        name: "Organizador de teste",
        email: "organizer@test.dev",
        passwordHash,
        role: "ORGANIZER",
      },
    });

    const customerOne = await prisma.user.create({
      data: {
        name: "Cliente um",
        email: "customer-one@test.dev",
        passwordHash,
        role: "CUSTOMER",
      },
    });

    const customerTwo = await prisma.user.create({
      data: {
        name: "Cliente dois",
        email: "customer-two@test.dev",
        passwordHash,
        role: "CUSTOMER",
      },
    });

    const event = await prisma.event.create({
      data: {
        title: "Sessão de teste",
        startsAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        venueName: "Sala de teste",
        price: 25,
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

    customerOneId = customerOne.id;
    customerTwoId = customerTwo.id;
    eventId = event.id;
    seatId = seat.id;
  });

  it("impede que dois clientes reservem o mesmo assento", async () => {
    const firstToken = jwt.sign({ role: "CUSTOMER" }, env.JWT_SECRET, {
      subject: customerOneId,
      expiresIn: "1h",
    });

    const secondToken = jwt.sign({ role: "CUSTOMER" }, env.JWT_SECRET, {
      subject: customerTwoId,
      expiresIn: "1h",
    });

    const firstReservation = await request(app)
      .post("/reservations")
      .set("Authorization", `Bearer ${firstToken}`)
      .send({ eventId, seatId });

    expect(firstReservation.status).toBe(201);
    expect(firstReservation.body.reservation.status).toBe("PENDING_PAYMENT");

    const duplicateReservation = await request(app)
      .post("/reservations")
      .set("Authorization", `Bearer ${secondToken}`)
      .send({ eventId, seatId });

    expect(duplicateReservation.status).toBe(409);
    expect(duplicateReservation.body.message).toBe(
      "Este assento está reservado por outro cliente.",
    );
  });
});
