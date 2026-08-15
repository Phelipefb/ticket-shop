import { Router } from "express";
import { prisma } from "../../lib/prisma.js";

export const eventsRouter = Router();

eventsRouter.get("/", async (_request, response) => {
  const events = await prisma.event.findMany({
    where: {
      status: "PUBLISHED",
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
    },
  });
});
