declare global {
  namespace Express {
    interface Request {
      auth?: {
        userId: string;
        role: "ORGANIZER" | "CUSTOMER" | "GATEKEEPER";
      };
    }
  }
}

export {};
