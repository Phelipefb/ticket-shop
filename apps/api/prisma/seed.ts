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

  console.log("Usuários de demonstração criados com sucesso.");
}

main()
  .catch((error) => {
    console.error("Falha ao executar o seed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
