import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { env } from "../config/env.js";

type UserRole = "ORGANIZER" | "CUSTOMER" | "GATEKEEPER";

const userRoles: UserRole[] = ["ORGANIZER", "CUSTOMER", "GATEKEEPER"];

function isUserRole(value: unknown): value is UserRole {
  return typeof value === "string" && userRoles.includes(value as UserRole);
}

export function authenticate(
  request: Request,
  response: Response,
  next: NextFunction,
) {
  const authorization = request.headers.authorization;

  if (!authorization?.startsWith("Bearer ")) {
    return response.status(401).json({
      message: "Token de autenticação não informado.",
    });
  }

  const token = authorization.replace("Bearer ", "");

  try {
    const decoded = jwt.verify(token, env.JWT_SECRET);

    if (
      typeof decoded === "string" ||
      typeof decoded.sub !== "string" ||
      !isUserRole(decoded.role)
    ) {
      return response.status(401).json({
        message: "Token inválido.",
      });
    }

    request.auth = {
      userId: decoded.sub,
      role: decoded.role,
    };

    return next();
  } catch {
    return response.status(401).json({
      message: "Token inválido ou expirado.",
    });
  }
}
