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
