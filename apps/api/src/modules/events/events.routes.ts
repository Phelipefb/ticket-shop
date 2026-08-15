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
