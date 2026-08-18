import { Router } from "express";
import { z } from "zod";
import { authenticate, authorize } from "../../middlewares/authenticate.js";
import { prisma } from "../../lib/prisma.js";

export const gateRouter = Router();

const validateTicketSchema = z.object({
  eventId: z.string().min(1),
  code: z.string().trim().min(1),
});

gateRouter.post(
  "/tickets/validate",
  authenticate,
  authorize("GATEKEEPER"),
  async (request, response) => {
    const validation = validateTicketSchema.safeParse(request.body);

    if (!validation.success) {
      return response.status(400).json({
        message: "Informe o evento e o código do ingresso.",
      });
    }

    if (!request.auth) {
      return response.status(401).json({
        message: "Usuário não autenticado.",
      });
    }

    const { eventId, code } = validation.data;
    const gatekeeperId = request.auth.userId;

    const ticket = await prisma.ticket.findUnique({
      where: { code },
      include: {
        reservation: {
          select: {
            eventId: true,
            event: {
              select: {
                title: true,
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
      await prisma.ticketValidation.create({
        data: {
          ticketId: ticket?.id,
          eventId,
          gatekeeperId,
          result: "INVALID",
        },
      });

      return response.status(200).json({
        result: "INVALID",
        message: "Ingresso inválido.",
      });
    }

    if (ticket.reservation.eventId !== eventId) {
      await prisma.ticketValidation.create({
        data: {
          ticketId: ticket.id,
          eventId,
          gatekeeperId,
          result: "EVENT_WRONG",
        },
      });

      return response.status(200).json({
        result: "EVENT_WRONG",
        message: "Este ingresso pertence a outro evento.",
      });
    }

    if (ticket.status === "USED") {
      await prisma.ticketValidation.create({
        data: {
          ticketId: ticket.id,
          eventId,
          gatekeeperId,
          result: "ALREADY_USED",
        },
      });

      return response.status(200).json({
        result: "ALREADY_USED",
        message: "Este ingresso já foi utilizado.",
      });
    }

    const wasValidated = await prisma.$transaction(async (transaction) => {
      const updatedTicket = await transaction.ticket.updateMany({
        where: {
          id: ticket.id,
          status: "ACTIVE",
          usedAt: null,
        },
        data: {
          status: "USED",
          usedAt: new Date(),
          validatedById: gatekeeperId,
        },
      });

      if (updatedTicket.count === 0) {
        return false;
      }

      await transaction.ticketValidation.create({
        data: {
          ticketId: ticket.id,
          eventId,
          gatekeeperId,
          result: "VALID",
        },
      });

      return true;
    });

    if (!wasValidated) {
      await prisma.ticketValidation.create({
        data: {
          ticketId: ticket.id,
          eventId,
          gatekeeperId,
          result: "ALREADY_USED",
        },
      });

      return response.status(200).json({
        result: "ALREADY_USED",
        message: "Este ingresso já foi utilizado.",
      });
    }

    return response.status(200).json({
      result: "VALID",
      message: "Ingresso válido. Entrada liberada.",
      ticket: {
        eventTitle: ticket.reservation.event.title,
        seatLabel: ticket.seat.label,
      },
    });
  },
);
