import { Router } from "express";
import { z } from "zod";
import { authenticate, authorize } from "../../middlewares/authenticate.js";
import { prisma } from "../../lib/prisma.js";

export const reservationsRouter = Router();

const createReservationSchema = z.object({
  eventId: z.string().min(1),
  seatId: z.string().min(1),
});

class ReservationError extends Error {
  constructor(
    public statusCode: number,
    message: string,
  ) {
    super(message);
  }
}

reservationsRouter.post(
  "/",
  authenticate,
  authorize("CUSTOMER"),
  async (request, response) => {
    const validation = createReservationSchema.safeParse(request.body);

    if (!validation.success) {
      return response.status(400).json({
        message: "Informe o evento e o assento.",
      });
    }

    if (!request.auth) {
      return response.status(401).json({
        message: "Usuário não autenticado.",
      });
    }

    const { eventId, seatId } = validation.data;
    const customerId = request.auth.userId;
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 10 * 60 * 1000);

    try {
      const reservation = await prisma.$transaction(async (transaction) => {
        const lockedSeats = await transaction.$queryRaw<Array<{ id: string }>>`
            SELECT "id"
            FROM "Seat"
            WHERE "id" = ${seatId} AND "eventId" = ${eventId}
            FOR UPDATE
          `;

        if (lockedSeats.length === 0) {
          throw new ReservationError(
            404,
            "Assento não encontrado para este evento.",
          );
        }

        const event = await transaction.event.findFirst({
          where: {
            id: eventId,
            status: "PUBLISHED",
            startsAt: {
              gt: now,
            },
          },
          select: {
            id: true,
            title: true,
            price: true,
          },
        });

        if (!event) {
          throw new ReservationError(
            404,
            "Evento não encontrado ou indisponível.",
          );
        }

        await transaction.reservation.updateMany({
          where: {
            seatId,
            status: "PENDING_PAYMENT",
            expiresAt: {
              lte: now,
            },
          },
          data: {
            status: "EXPIRED",
          },
        });

        const ticket = await transaction.ticket.findUnique({
          where: { seatId },
        });

        if (ticket) {
          throw new ReservationError(409, "Este assento já foi vendido.");
        }

        const activeReservation = await transaction.reservation.findFirst({
          where: {
            seatId,
            OR: [
              {
                status: "CONFIRMED",
              },
              {
                status: "PENDING_PAYMENT",
                expiresAt: {
                  gt: now,
                },
              },
            ],
          },
        });

        if (activeReservation) {
          throw new ReservationError(
            409,
            "Este assento está reservado por outro cliente.",
          );
        }

        return transaction.reservation.create({
          data: {
            eventId,
            seatId,
            customerId,
            status: "PENDING_PAYMENT",
            expiresAt,
          },
          include: {
            event: {
              select: {
                title: true,
                price: true,
              },
            },
            seat: {
              select: {
                label: true,
              },
            },
          },
        });
      });

      return response.status(201).json({
        reservation: {
          id: reservation.id,
          status: reservation.status,
          expiresAt: reservation.expiresAt,
          event: {
            title: reservation.event.title,
            price: reservation.event.price.toNumber(),
          },
          seat: reservation.seat,
        },
      });
    } catch (error) {
      if (error instanceof ReservationError) {
        return response.status(error.statusCode).json({
          message: error.message,
        });
      }

      console.error("Falha ao criar reserva:", error);

      return response.status(500).json({
        message: "Não foi possível criar a reserva.",
      });
    }
  },
);
