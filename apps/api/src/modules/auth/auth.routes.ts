import bcrypt from "bcrypt";
import { Router } from "express";
import { z } from "zod";
import { prisma } from "../../lib/prisma.js";

export const authRouter = Router();

const registerSchema = z.object({
  name: z.string().trim().min(2).max(100),
  email: z
    .string()
    .trim()
    .email()
    .transform((value) => value.toLowerCase()),
  password: z.string().min(8).max(72),
});

authRouter.post("/register", async (request, response) => {
  const validation = registerSchema.safeParse(request.body);

  if (!validation.success) {
    return response.status(400).json({
      message: "Dados inválidos.",
      errors: validation.error.flatten().fieldErrors,
    });
  }

  const { name, email, password } = validation.data;

  const existingUser = await prisma.user.findUnique({
    where: { email },
  });

  if (existingUser) {
    return response.status(409).json({
      message: "Já existe um usuário com este e-mail.",
    });
  }

  const passwordHash = await bcrypt.hash(password, 12);

  const user = await prisma.user.create({
    data: {
      name,
      email,
      passwordHash,
      role: "CUSTOMER",
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      createdAt: true,
    },
  });

  return response.status(201).json({ user });
});
