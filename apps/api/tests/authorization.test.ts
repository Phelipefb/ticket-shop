import jwt from "jsonwebtoken";
import request from "supertest";
import { beforeEach, describe, expect, it } from "vitest";
import { app } from "../src/app.js";
import { env } from "../src/config/env.js";
import { prisma } from "../src/lib/prisma.js";

describe("controle de permissões", () => {
  let customerId: string;
  let organizerId: string;

  beforeEach(async () => {
    await prisma.ticketValidation.deleteMany();
    await prisma.ticket.deleteMany();
    await prisma.payment.deleteMany();
    await prisma.reservation.deleteMany();
    await prisma.seat.deleteMany();
    await prisma.event.deleteMany();
    await prisma.user.deleteMany();

    const customer = await prisma.user.create({
      data: {
        name: "Cliente de teste",
        email: "customer-auth@test.dev",
        passwordHash: "not-used-in-this-test",
        role: "CUSTOMER",
      },
    });

    const organizer = await prisma.user.create({
      data: {
        name: "Organizador de teste",
        email: "organizer-auth@test.dev",
        passwordHash: "not-used-in-this-test",
        role: "ORGANIZER",
      },
    });

    customerId = customer.id;
    organizerId = organizer.id;
  });

  it("impede que um cliente crie eventos ou valide ingressos", async () => {
    const customerToken = jwt.sign({ role: "CUSTOMER" }, env.JWT_SECRET, {
      subject: customerId,
      expiresIn: "1h",
    });

    const createEventResponse = await request(app)
      .post("/events")
      .set("Authorization", `Bearer ${customerToken}`)
      .send({});

    const validateTicketResponse = await request(app)
      .post("/gate/tickets/validate")
      .set("Authorization", `Bearer ${customerToken}`)
      .send({});

    expect(createEventResponse.status).toBe(403);
    expect(validateTicketResponse.status).toBe(403);
  });

  it("impede que um organizador valide ingressos", async () => {
    const organizerToken = jwt.sign({ role: "ORGANIZER" }, env.JWT_SECRET, {
      subject: organizerId,
      expiresIn: "1h",
    });

    const response = await request(app)
      .post("/gate/tickets/validate")
      .set("Authorization", `Bearer ${organizerToken}`)
      .send({});

    expect(response.status).toBe(403);
  });
});
