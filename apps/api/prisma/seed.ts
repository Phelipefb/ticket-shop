import bcrypt from "bcrypt";
import { prisma } from "../src/lib/prisma.js";

const users = [
  {
    name: "Marina Organizadora",
    email: "organizer@ticketshop.dev",
    password: "Organizer123!",
    role: "ORGANIZER" as const,
  },
  {
    name: "Carlos Cliente",
    email: "cliente1@ticketshop.dev",
    password: "Cliente123!",
    role: "CUSTOMER" as const,
  },
  {
    name: "Beatriz Cliente",
    email: "cliente2@ticketshop.dev",
    password: "Cliente456!",
    role: "CUSTOMER" as const,
  },
  {
    name: "Paulo Portaria",
    email: "portaria@ticketshop.dev",
    password: "Portaria123!",
    role: "GATEKEEPER" as const,
  },
];

const seats = ["A", "B", "C", "D", "E"].flatMap((row) =>
  Array.from({ length: 8 }, (_, index) => {
    const number = index + 1;

    return {
      row,
      number,
      label: `${row}${number}`,
    };
  }),
);

async function main() {
  for (const user of users) {
    const passwordHash = await bcrypt.hash(user.password, 12);

    await prisma.user.upsert({
      where: { email: user.email },
      update: {
        name: user.name,
        passwordHash,
        role: user.role,
      },
      create: {
        name: user.name,
        email: user.email,
        passwordHash,
        role: user.role,
      },
    });
  }

  const organizer = await prisma.user.findUniqueOrThrow({
    where: { email: "organizer@ticketshop.dev" },
  });

  const title = "Cine Horizonte: Sessão Especial";
  const startsAt = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);

  let event = await prisma.event.findFirst({
    where: { title },
  });

  if (event) {
    event = await prisma.event.update({
      where: { id: event.id },
      data: {
        startsAt,
        organizerId: organizer.id,
        status: "PUBLISHED",
      },
    });
  } else {
    event = await prisma.event.create({
      data: {
        title,
        overview:
          "Uma sessão de demonstração para testar a compra de ingressos.",
        startsAt,
        venueName: "Cinema Elite - Sala 1",
        venueAddress: "Av. Principal, 1000",
        price: 29.9,
        capacity: seats.length,
        status: "PUBLISHED",
        organizerId: organizer.id,
      },
    });
  }

  await prisma.seat.createMany({
    data: seats.map((seat) => ({
      ...seat,
      eventId: event.id,
    })),
    skipDuplicates: true,
  });

  console.log("Dados de demonstração criados com sucesso.");
  console.log(`Evento publicado: ${event.title}`);
  console.log(`Assentos disponíveis: ${seats.length}`);
}

main()
  .catch((error) => {
    console.error("Falha ao executar o seed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
