import { Router } from "express";
import { prisma } from "../../lib/prisma.js";
import { z } from "zod";
import { authenticate, authorize } from "../../middlewares/authenticate.js";

export const eventsRouter = Router();

const createEventSchema = z.object({
  tmdbMovieId: z.number().int().positive().optional(),
  title: z.string().trim().min(1).max(200),
  overview: z.string().trim().max(2000).optional(),
  posterUrl: z.string().url().optional(),
  tmdbRating: z.coerce.number().min(0).max(10).optional(),
  startsAt: z.coerce.date().refine((date) => date > new Date(), {
    message: "A data da sessão deve estar no futuro.",
  }),
  venueName: z.string().trim().min(2).max(150),
  venueAddress: z.string().trim().min(5).max(250).optional(),
  price: z.coerce.number().positive().max(100000),
  seatLayout: z.object({
    rows: z.coerce.number().int().min(1).max(26),
    seatsPerRow: z.coerce.number().int().min(1).max(50),
  }),
});

const updateEventSchema = createEventSchema
  .omit({ seatLayout: true })
  .partial();

eventsRouter.post(
  "/",
  authenticate,
  authorize("ORGANIZER"),
  async (request, response) => {
    const validation = createEventSchema.safeParse(request.body);

    if (!validation.success) {
      return response.status(400).json({
        message: "Dados inválidos.",
        errors: validation.error.flatten().fieldErrors,
      });
    }

    if (!request.auth) {
      return response.status(401).json({
        message: "Usuário não autenticado.",
      });
    }

    const organizerId = request.auth.userId;
    const {
      tmdbMovieId,
      title,
      overview,
      posterUrl,
      tmdbRating,
      startsAt,
      venueName,
      venueAddress,
      price,
      seatLayout,
    } = validation.data;

    const rows = Array.from({ length: seatLayout.rows }, (_, index) =>
      String.fromCharCode(65 + index),
    );

    const seats = rows.flatMap((row) =>
      Array.from({ length: seatLayout.seatsPerRow }, (_, index) => {
        const number = index + 1;

        return {
          row,
          number,
          label: `${row}${number}`,
        };
      }),
    );

    const event = await prisma.$transaction(async (transaction) => {
      const createdEvent = await transaction.event.create({
        data: {
          tmdbMovieId,
          title,
          overview,
          posterUrl,
          tmdbRating,
          startsAt,
          venueName,
          venueAddress,
          price,
          capacity: seats.length,
          status: "PUBLISHED",
          organizerId,
        },
      });

      await transaction.seat.createMany({
        data: seats.map((seat) => ({
          ...seat,
          eventId: createdEvent.id,
        })),
      });

      return createdEvent;
    });

    return response.status(201).json({
      event: {
        ...event,
        price: event.price.toNumber(),
        seatCount: seats.length,
      },
    });
  },
);

eventsRouter.patch(
  "/:eventId",
  authenticate,
  authorize("ORGANIZER"),
  async (request, response) => {
    const validation = updateEventSchema.safeParse(request.body);

    if (!validation.success) {
      return response.status(400).json({
        message: "Dados inválidos.",
        errors: validation.error.flatten().fieldErrors,
      });
    }

    const organizerId = request.auth?.userId;

    if (!organizerId) {
      return response.status(401).json({ message: "Usuário não autenticado." });
    }

    const eventId = Array.isArray(request.params.eventId)
      ? request.params.eventId[0]
      : request.params.eventId;

    const event = await prisma.event.findFirst({
      where: { id: eventId, organizerId },
    });

    if (!event) {
      return response.status(404).json({
        message: "Evento não encontrado para este organizador.",
      });
    }

    const changesCriticalData = ["startsAt", "venueName", "venueAddress", "price"]
      .some((field) => field in validation.data);

    if (changesCriticalData) {
      const reservationsCount = await prisma.reservation.count({
        where: {
          eventId: event.id,
          status: { in: ["PENDING_PAYMENT", "CONFIRMED"] },
        },
      });

      if (reservationsCount > 0) {
        return response.status(409).json({
          message: "Não é possível alterar data, local ou preço após iniciar vendas.",
        });
      }
    }

    const updatedEvent = await prisma.event.update({
      where: { id: event.id },
      data: validation.data,
    });

    return response.status(200).json({
      event: { ...updatedEvent, price: updatedEvent.price.toNumber() },
    });
  },
);

eventsRouter.get(
  "/mine",
  authenticate,
  authorize("ORGANIZER"),
  async (request, response) => {
    const organizerId = request.auth?.userId;

    if (!organizerId) {
      return response.status(401).json({ message: "Usuário não autenticado." });
    }

    const events = await prisma.event.findMany({
      where: { organizerId },
      orderBy: { startsAt: "asc" },
      select: {
        id: true, title: true, startsAt: true, venueName: true,
        price: true, status: true, posterUrl: true,
      },
    });

    return response.json({
      events: events.map((event) => ({ ...event, price: event.price.toNumber() })),
    });
  },
);

eventsRouter.delete(
  "/:eventId",
  authenticate,
  authorize("ORGANIZER"),
  async (request, response) => {
    const organizerId = request.auth?.userId;
    const eventId = Array.isArray(request.params.eventId) ? request.params.eventId[0] : request.params.eventId;
    const event = await prisma.event.findFirst({ where: { id: eventId, organizerId } });

    if (!event) return response.status(404).json({ message: "Evento não encontrado." });

    await prisma.event.update({ where: { id: event.id }, data: { status: "CANCELLED" } });
    return response.status(204).send();
  },
);

eventsRouter.get("/", async (_request, response) => {
  const events = await prisma.event.findMany({
    where: {
      status: "PUBLISHED",
      posterUrl: {
        not: null,
      },
      startsAt: {
        gte: new Date(),
      },
    },
    orderBy: {
      startsAt: "asc",
    },
    select: {
      id: true,
      title: true,
      overview: true,
      posterUrl: true,
      tmdbRating: true,
      startsAt: true,
      venueName: true,
      venueAddress: true,
      price: true,
      capacity: true,
      _count: {
        select: {
          seats: true,
        },
      },
    },
  });

  const formattedEvents = events.map(({ price, _count, ...event }) => ({
    ...event,
    price: price.toNumber(),
    seatCount: _count.seats,
  }));

  return response.status(200).json({
    events: formattedEvents,
  });
});

eventsRouter.get("/:eventId", async (request, response) => {
  const { eventId } = request.params;

  const event = await prisma.event.findFirst({
    where: {
      id: eventId,
      status: "PUBLISHED",
      startsAt: {
        gte: new Date(),
      },
    },
    select: {
      id: true,
      title: true,
      overview: true,
      posterUrl: true,
      tmdbRating: true,
      startsAt: true,
      venueName: true,
      venueAddress: true,
      price: true,
      capacity: true,
      seats: {
        orderBy: [{ row: "asc" }, { number: "asc" }],
        select: {
          id: true,
          row: true,
          number: true,
          label: true,
          ticket: {
            select: {
              id: true,
            },
          },
          reservations: {
            where: {
              status: "PENDING_PAYMENT",
              expiresAt: {
                gt: new Date(),
              },
            },
            select: {
              id: true,
            },
          },
        },
      },
    },
  });

  if (!event) {
    return response.status(404).json({
      message: "Evento não encontrado ou indisponível.",
    });
  }

  return response.status(200).json({
    event: {
      ...event,
      price: event.price.toNumber(),
      seats: event.seats.map(({ ticket, reservations, ...seat }) => ({
        ...seat,
        availability: ticket
          ? "SOLD"
          : reservations.length > 0
            ? "RESERVED"
            : "AVAILABLE",
      })),
    },
  });
});
