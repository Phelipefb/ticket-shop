export type PublicEvent = {
  id: string;
  title: string;
  overview: string | null;
  posterUrl: string | null;
  startsAt: string;
  venueName: string;
  venueAddress: string | null;
  price: number;
  capacity: number;
  seatCount: number;
};

const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3333";

export async function getPublishedEvents(): Promise<PublicEvent[]> {
  const response = await fetch(`${apiUrl}/events`, {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("Não foi possível carregar os eventos.");
  }

  const data = (await response.json()) as {
    events: PublicEvent[];
  };

  return data.events;
}

export type EventSeat = {
  id: string;
  row: string;
  number: number;
  label: string;
  availability: "AVAILABLE" | "RESERVED" | "SOLD";
};

export type EventDetails = Omit<PublicEvent, "seatCount"> & {
  seats: EventSeat[];
};

export async function getEventDetails(
  eventId: string,
): Promise<EventDetails | null> {
  const response = await fetch(`${apiUrl}/events/${eventId}`, {
    cache: "no-store",
  });

  if (response.status === 404) {
    return null;
  }

  if (!response.ok) {
    throw new Error("Não foi possível carregar a sessão.");
  }

  const data = (await response.json()) as {
    event: EventDetails;
  };

  return data.event;
}

export type AuthUser = {
  id: string;
  name: string;
  email: string;
  role: "ORGANIZER" | "CUSTOMER" | "GATEKEEPER";
};

type LoginResponse = {
  accessToken: string;
  user: AuthUser;
};

export async function login(
  email: string,
  password: string,
): Promise<LoginResponse> {
  let response: Response;

  try {
    response = await fetch(`${apiUrl}/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password }),
    });
  } catch {
    throw new Error(
      "Não foi possível conectar ao serviço. Verifique sua conexão e tente novamente.",
    );
  }

  const data = (await response.json()) as LoginResponse | { message: string };

  if (!response.ok) {
    const message =
      "message" in data ? data.message : "Não foi possível fazer login.";

    throw new Error(message);
  }

  return data as LoginResponse;
}

export type Reservation = {
  id: string;
  status: "PENDING_PAYMENT";
  expiresAt: string;
  event: {
    title: string;
    price: number;
  };
  seat: {
    label: string;
  };
};

export async function cancelReservation(accessToken: string, reservationId: string) {
  const response = await fetch(`${apiUrl}/reservations/${reservationId}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!response.ok) {
    const data = (await response.json()) as { message?: string };
    throw new Error(data.message ?? "Não foi possível cancelar a reserva.");
  }
}

export async function updateEvent(
  accessToken: string,
  eventId: string,
  data: Partial<{
    title: string;
    overview: string;
    startsAt: string;
    venueName: string;
    venueAddress: string;
    price: number;
  }>,
) {
  const response = await fetch(`${apiUrl}/events/${eventId}`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const result = (await response.json()) as { message?: string };
    throw new Error(result.message ?? "Não foi possível atualizar o evento.");
  }
}

export async function createReservation(
  accessToken: string,
  eventId: string,
  seatId: string,
): Promise<Reservation> {
  const response = await fetch(`${apiUrl}/reservations`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({ eventId, seatId }),
  });

  const data = (await response.json()) as
    | { reservation: Reservation }
    | { message: string };

  if (!response.ok) {
    const message =
      "message" in data ? data.message : "Não foi possível reservar o assento.";

    throw new Error(message);
  }

  if (!("reservation" in data)) {
    throw new Error("A API não retornou os dados da reserva.");
  }

  return data.reservation;
}

export type PaymentResult = {
  payment: {
    id: string;
    status: "APPROVED" | "DECLINED";
  };
  reservation: {
    id: string;
    status: "CONFIRMED" | "PAYMENT_DECLINED";
  };
  ticket?: {
    id: string;
    code: string;
    qrPayload: string;
    shareToken: string;
    eventTitle: string;
    seatLabel: string;
    price: number;
  };
};

export async function processPayment(
  accessToken: string,
  reservationId: string,
  cardNumber: string,
): Promise<PaymentResult> {
  const response = await fetch(`${apiUrl}/payments`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({ reservationId, cardNumber }),
  });

  const data = (await response.json()) as PaymentResult | { message: string };

  if (!response.ok) {
    const message =
      "message" in data
        ? data.message
        : "Não foi possível processar o pagamento.";

    throw new Error(message);
  }

  return data as PaymentResult;
}

export type Ticket = {
  id: string;
  code: string;
  qrPayload: string;
  shareToken: string;
  status: "ACTIVE" | "USED" | "VOID";
  usedAt: string | null;
  createdAt: string;
  event: {
    title: string;
    startsAt: string;
    venueName: string;
    venueAddress: string | null;
    price: number;
  };
  seat: {
    label: string;
  };
};

export async function getMyTickets(accessToken: string): Promise<Ticket[]> {
  const response = await fetch(`${apiUrl}/tickets/me`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  const data = (await response.json()) as
    | { tickets: Ticket[] }
    | { message: string };

  if (!response.ok) {
    const message =
      "message" in data
        ? data.message
        : "Não foi possível carregar os ingressos.";

    throw new Error(message);
  }

  if (!("tickets" in data)) {
    throw new Error("A API não retornou os ingressos.");
  }

  return data.tickets;
}

export type SharedTicket = Omit<Ticket, "shareToken" | "createdAt">;

export async function getSharedTicket(
  shareToken: string,
): Promise<SharedTicket | null> {
  const response = await fetch(`${apiUrl}/tickets/share/${shareToken}`, {
    cache: "no-store",
  });

  if (response.status === 404) {
    return null;
  }

  if (!response.ok) {
    throw new Error("Não foi possível carregar o ingresso compartilhado.");
  }

  const data = (await response.json()) as {
    ticket: SharedTicket;
  };

  return data.ticket;
}

export type CatalogMovie = {
  id: number;
  title: string;
  overview: string | null;
  releaseDate: string | null;
  posterUrl: string | null;
};

export async function searchMovies(
  accessToken: string,
  query: string,
): Promise<CatalogMovie[]> {
  const response = await fetch(
    `${apiUrl}/catalog/movies?query=${encodeURIComponent(query)}`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
  );

  const data = (await response.json()) as
    | { movies: CatalogMovie[] }
    | { message: string };

  if (!response.ok) {
    const message =
      "message" in data ? data.message : "Não foi possível buscar os filmes.";

    throw new Error(message);
  }

  if (!("movies" in data)) {
    throw new Error("A API não retornou os filmes.");
  }

  return data.movies;
}

export type CreateEventInput = {
  tmdbMovieId?: number;
  title: string;
  overview?: string;
  posterUrl?: string;
  startsAt: string;
  venueName: string;
  venueAddress?: string;
  price: number;
  seatLayout: {
    rows: number;
    seatsPerRow: number;
  };
};

export async function createEvent(
  accessToken: string,
  input: CreateEventInput,
): Promise<void> {
  const response = await fetch(`${apiUrl}/events`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(input),
  });

  const data = (await response.json()) as
    | { event: { id: string } }
    | { message: string };

  if (!response.ok) {
    const message =
      "message" in data ? data.message : "Não foi possível criar o evento.";

    throw new Error(message);
  }
}

export type TicketValidation = {
  result: "VALID" | "INVALID" | "EVENT_WRONG" | "ALREADY_USED";
  message: string;
  ticket?: {
    eventTitle: string;
    seatLabel: string;
  };
};

export async function validateTicket(
  accessToken: string,
  eventId: string,
  code: string,
): Promise<TicketValidation> {
  const response = await fetch(`${apiUrl}/gate/tickets/validate`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({ eventId, code }),
  });

  const data = (await response.json()) as
    | TicketValidation
    | { message: string };

  if (!response.ok) {
    const message =
      "message" in data ? data.message : "Não foi possível validar o ingresso.";

    throw new Error(message);
  }

  return data as TicketValidation;
}

export async function register(
  name: string,
  email: string,
  password: string,
): Promise<void> {
  const response = await fetch(`${apiUrl}/auth/register`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ name, email, password }),
  });

  const data = (await response.json()) as
    | { user: AuthUser }
    | { message: string };

  if (!response.ok) {
    const message =
      "message" in data ? data.message : "Não foi possível criar a conta.";

    throw new Error(message);
  }
}
