import { Router } from "express";
import { authenticate, authorize } from "../../middlewares/authenticate.js";
import { prisma } from "../../lib/prisma.js";

export const ticketsRouter = Router();

ticketsRouter.get(
  "/me",
  authenticate,
  authorize("CUSTOMER"),
  async (request, response) => {
    if (!request.auth) {
      return response.status(401).json({
        message: "Usuário não autenticado.",
      });
    }

    const tickets = await prisma.ticket.findMany({
      where: {
        reservation: {
          customerId: request.auth.userId,
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      include: {
        reservation: {
          include: {
            event: {
              select: {
                title: true,
                startsAt: true,
                venueName: true,
                venueAddress: true,
                price: true,
              },
            },
          },
        },
        seat: {
          select: {
            label: true,
          },
        },
      },
    });

    return response.status(200).json({
      tickets: tickets.map((ticket) => ({
        id: ticket.id,
        code: ticket.code,
        qrPayload: ticket.code,
        shareToken: ticket.shareToken,
        status: ticket.status,
        usedAt: ticket.usedAt,
        createdAt: ticket.createdAt,
        event: {
          title: ticket.reservation.event.title,
          startsAt: ticket.reservation.event.startsAt,
          venueName: ticket.reservation.event.venueName,
          venueAddress: ticket.reservation.event.venueAddress,
          price: ticket.reservation.event.price.toNumber(),
        },
        seat: ticket.seat,
      })),
    });
  },
);

ticketsRouter.get("/share/:shareToken", async (request, response) => {
  const { shareToken } = request.params;

  const ticket = await prisma.ticket.findUnique({
    where: { shareToken },
    include: {
      reservation: {
        include: {
          event: {
            select: {
              title: true,
              startsAt: true,
              venueName: true,
              venueAddress: true,
              price: true,
            },
          },
        },
      },
      seat: {
        select: {
          label: true,
        },
      },
    },
  });

  if (!ticket || ticket.status === "VOID") {
    return response.status(404).json({
      message: "Ingresso não encontrado.",
    });
  }

  return response.status(200).json({
    ticket: {
      id: ticket.id,
      code: ticket.code,
      qrPayload: ticket.code,
      status: ticket.status,
      usedAt: ticket.usedAt,
      event: {
        title: ticket.reservation.event.title,
        startsAt: ticket.reservation.event.startsAt,
        venueName: ticket.reservation.event.venueName,
        venueAddress: ticket.reservation.event.venueAddress,
        price: ticket.reservation.event.price.toNumber(),
      },
      seat: ticket.seat,
    },
  });
});
