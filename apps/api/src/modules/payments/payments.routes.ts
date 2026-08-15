import { createHash, randomUUID } from "node:crypto";
import { Router } from "express";
import { z } from "zod";
import { authenticate, authorize } from "../../middlewares/authenticate.js";
import { prisma } from "../../lib/prisma.js";

export const paymentsRouter = Router();

const APPROVED_CARD = "4242424242424242";
const DECLINED_CARD = "4000000000000002";

const paymentSchema = z.object({
  reservationId: z.string().min(1),
  cardNumber: z
    .string()
    .transform((value) => value.replace(/\D/g, ""))
    .refine((value) => value === APPROVED_CARD || value === DECLINED_CARD, {
      message: "Use um cartão de teste válido.",
    }),
});

paymentsRouter.post(
  "/",
  authenticate,
  authorize("CUSTOMER"),
  async (request, response) => {
    const validation = paymentSchema.safeParse(request.body);

    if (!validation.success) {
      return response.status(400).json({
        message:
          "Use 4242 4242 4242 4242 para aprovar ou 4000 0000 0000 0002 para recusar.",
      });
    }

    if (!request.auth) {
      return response.status(401).json({
        message: "Usuário não autenticado.",
      });
    }

    const { reservationId, cardNumber } = validation.data;
    const customerId = request.auth.userId;
    const now = new Date();

    try {
      const result = await prisma.$transaction(async (transaction) => {
        const lockedReservations = await transaction.$queryRaw<
          Array<{ id: string }>
        >`
          SELECT "id"
          FROM "Reservation"
          WHERE "id" = ${reservationId}
          FOR UPDATE
        `;

        if (lockedReservations.length === 0) {
          return { type: "not_found" as const };
        }

        const reservation = await transaction.reservation.findFirst({
          where: {
            id: reservationId,
            customerId,
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

        if (!reservation) {
          return { type: "not_found" as const };
        }

        if (
          reservation.status !== "PENDING_PAYMENT" ||
          reservation.expiresAt <= now
        ) {
          if (
            reservation.status === "PENDING_PAYMENT" &&
            reservation.expiresAt <= now
          ) {
            await transaction.reservation.update({
              where: { id: reservation.id },
              data: { status: "EXPIRED" },
            });
          }

          return { type: "unavailable" as const };
        }

        if (cardNumber === DECLINED_CARD) {
          const payment = await transaction.payment.create({
            data: {
              reservationId: reservation.id,
              amount: reservation.event.price,
              status: "DECLINED",
            },
          });

          await transaction.reservation.update({
            where: { id: reservation.id },
            data: { status: "PAYMENT_DECLINED" },
          });

          return {
            type: "declined" as const,
            payment,
          };
        }

        const payment = await transaction.payment.create({
          data: {
            reservationId: reservation.id,
            amount: reservation.event.price,
            status: "APPROVED",
          },
        });

        await transaction.reservation.update({
          where: { id: reservation.id },
          data: { status: "CONFIRMED" },
        });

        const code = `TKT-${randomUUID()}`;
        const qrTokenHash = createHash("sha256").update(code).digest("hex");
        const shareToken = randomUUID();

        const ticket = await transaction.ticket.create({
          data: {
            reservationId: reservation.id,
            seatId: reservation.seatId,
            code,
            qrTokenHash,
            shareToken,
          },
        });

        return {
          type: "approved" as const,
          payment,
          reservation,
          ticket,
        };
      });

      if (result.type === "not_found") {
        return response.status(404).json({
          message: "Reserva não encontrada.",
        });
      }

      if (result.type === "unavailable") {
        return response.status(409).json({
          message: "Esta reserva expirou ou já foi processada.",
        });
      }

      if (result.type === "declined") {
        return response.status(200).json({
          payment: {
            id: result.payment.id,
            status: result.payment.status,
          },
          reservation: {
            id: reservationId,
            status: "PAYMENT_DECLINED",
          },
        });
      }

      return response.status(200).json({
        payment: {
          id: result.payment.id,
          status: result.payment.status,
        },
        reservation: {
          id: result.reservation.id,
          status: "CONFIRMED",
        },
        ticket: {
          id: result.ticket.id,
          code: result.ticket.code,
          qrPayload: result.ticket.code,
          shareToken: result.ticket.shareToken,
          eventTitle: result.reservation.event.title,
          seatLabel: result.reservation.seat.label,
          price: result.reservation.event.price.toNumber(),
        },
      });
    } catch (error) {
      console.error("Falha ao processar pagamento:", error);

      return response.status(500).json({
        message: "Não foi possível processar o pagamento.",
      });
    }
  },
);
