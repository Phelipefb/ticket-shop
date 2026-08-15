import bcrypt from "bcrypt";
import { Router } from "express";
import { z } from "zod";
import { prisma } from "../../lib/prisma.js";
import jwt from "jsonwebtoken";
import { env } from "../../config/env.js";

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

const loginSchema = z.object({
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

authRouter.post("/login", async (request, response) => {
  const validation = loginSchema.safeParse(request.body);

  if (!validation.success) {
    return response.status(400).json({
      message: "Dados inválidos.",
      errors: validation.error.flatten().fieldErrors,
    });
  }

  const { email, password } = validation.data;

  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) {
    return response.status(401).json({
      message: "E-mail ou senha inválidos.",
    });
  }

  const passwordMatches = await bcrypt.compare(password, user.passwordHash);

  if (!passwordMatches) {
    return response.status(401).json({
      message: "E-mail ou senha inválidos.",
    });
  }

  const accessToken = jwt.sign({ role: user.role }, env.JWT_SECRET, {
    subject: user.id,
    expiresIn: "1h",
  });

  return response.status(200).json({
    accessToken,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    },
  });
});
