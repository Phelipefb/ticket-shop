import jwt from "jsonwebtoken";
import request from "supertest";
import { beforeEach, describe, expect, it } from "vitest";
import { app } from "../src/app.js";
import { env } from "../src/config/env.js";
import { prisma } from "../src/lib/prisma.js";

describe("POST /payments", () => {
  let customerId: string;
  let reservationId: string;

  beforeEach(async () => {
    await prisma.ticketValidation.deleteMany();
    await prisma.ticket.deleteMany();
    await prisma.payment.deleteMany();
    await prisma.reservation.deleteMany();
    await prisma.seat.deleteMany();
    await prisma.event.deleteMany();
    await prisma.user.deleteMany();

    const organizer = await prisma.user.create({
      data: {
        name: "Organizador de teste",
        email: "organizer-payment@test.dev",
        passwordHash: "not-used-in-this-test",
        role: "ORGANIZER",
      },
    });

    const customer = await prisma.user.create({
      data: {
        name: "Cliente de teste",
        email: "customer-payment@test.dev",
        passwordHash: "not-used-in-this-test",
        role: "CUSTOMER",
      },
    });

    const event = await prisma.event.create({
      data: {
        title: "Sessão de pagamento",
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
        status: "PENDING_PAYMENT",
        expiresAt: new Date(Date.now() + 10 * 60 * 1000),
      },
    });

    customerId = customer.id;
    reservationId = reservation.id;
  });

  function createCustomerToken() {
    return jwt.sign({ role: "CUSTOMER" }, env.JWT_SECRET, {
      subject: customerId,
      expiresIn: "1h",
    });
  }

  it("aprova o pagamento e gera um ingresso", async () => {
    const response = await request(app)
      .post("/payments")
      .set("Authorization", `Bearer ${createCustomerToken()}`)
      .send({
        reservationId,
        cardNumber: "4242 4242 4242 4242",
      });

    expect(response.status).toBe(200);
    expect(response.body.payment.status).toBe("APPROVED");
    expect(response.body.reservation.status).toBe("CONFIRMED");
    expect(response.body.ticket.code).toMatch(/^TKT-/);

    const ticket = await prisma.ticket.findUnique({
      where: { reservationId },
    });

    expect(ticket).not.toBeNull();
    expect(ticket?.status).toBe("ACTIVE");
  });

  it("recusa o pagamento e libera a reserva", async () => {
    const response = await request(app)
      .post("/payments")
      .set("Authorization", `Bearer ${createCustomerToken()}`)
      .send({
        reservationId,
        cardNumber: "4000 0000 0000 0002",
      });

    expect(response.status).toBe(200);
    expect(response.body.payment.status).toBe("DECLINED");
    expect(response.body.reservation.status).toBe("PAYMENT_DECLINED");

    const ticket = await prisma.ticket.findUnique({
      where: { reservationId },
    });

    expect(ticket).toBeNull();
  });
});
