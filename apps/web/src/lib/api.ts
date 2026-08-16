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
