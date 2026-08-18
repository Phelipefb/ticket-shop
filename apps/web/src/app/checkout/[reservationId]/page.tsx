"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { type FormEvent, useEffect, useRef, useState } from "react";
import {
  processPayment,
  type PaymentResult,
  type Reservation,
} from "@/lib/api";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
function formatPrice(price: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(price);
}

gsap.registerPlugin(useGSAP);
export default function CheckoutPage() {
  const params = useParams<{ reservationId: string }>();
  const reservationId = params.reservationId;
  const router = useRouter();

  const [reservation, setReservation] = useState<Reservation | null>(null);
  const [cardNumber, setCardNumber] = useState("4242 4242 4242 4242");
  const [result, setResult] = useState<PaymentResult | null>(null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const successCardRef = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      if (!result?.ticket) {
        return;
      }

      const media = gsap.matchMedia();

      media.add("(prefers-reduced-motion: no-preference)", () => {
        gsap.from("[data-success-item]", {
          opacity: 0,
          y: 24,
          duration: 0.55,
          stagger: 0.1,
          ease: "power3.out",
          clearProps: "transform,opacity",
        });
      });

      return () => media.revert();
    },
    {
      scope: successCardRef,
      dependencies: [result?.ticket?.id],
      revertOnUpdate: true,
    },
  );

  useEffect(() => {
    const savedReservation = sessionStorage.getItem("cinepass:reservation");

    if (!savedReservation) {
      return;
    }

    try {
      const parsedReservation = JSON.parse(savedReservation) as Reservation;

      if (parsedReservation.id === reservationId) {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setReservation(parsedReservation);
      }
    } catch {
      sessionStorage.removeItem("cinepass:reservation");
    }
  }, [reservationId]);

  function handleLeaveCheckout() {
    sessionStorage.removeItem("cinepass:reservation");

    if (window.history.length > 1) {
      router.back();
      return;
    }

    router.push("/");
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const accessToken = localStorage.getItem("cinepass:accessToken");

    if (!accessToken) {
      setError("Entre na sua conta antes de processar o pagamento.");
      return;
    }

    setError("");
    setIsLoading(true);

    try {
      const paymentResult = await processPayment(
        accessToken,
        reservationId,
        cardNumber,
      );

      setResult(paymentResult);
      sessionStorage.removeItem("cinepass:reservation");
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Não foi possível processar o pagamento.";

      setError(message);
    } finally {
      setIsLoading(false);
    }
  }

  if (result?.payment.status === "DECLINED") {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#101114] px-6 text-zinc-100">
        <section className="w-full max-w-lg rounded-3xl border border-red-400/30 bg-zinc-900 p-8">
          <p className="text-sm font-bold tracking-[0.18em] text-red-300">
            PAGAMENTO RECUSADO
          </p>

          <h1 className="mt-4 text-3xl font-bold">
            Não foi possível confirmar sua compra.
          </h1>

          <p className="mt-4 leading-7 text-zinc-400">
            O assento foi liberado. Escolha outro assento e tente novamente.
          </p>

          <Link
            href="/"
            className="mt-8 inline-flex rounded-xl bg-amber-400 px-4 py-3 font-bold text-zinc-950"
          >
            Voltar para programação
          </Link>
        </section>
      </main>
    );
  }

  if (result?.ticket) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#101114] px-6 text-zinc-100">
        <section
          ref={successCardRef}
          className="w-full max-w-lg rounded-3xl border border-emerald-400/30 bg-zinc-900 p-8"
        >
          <p
            data-success-item
            className="text-sm font-bold tracking-[0.18em] text-emerald-300"
          >
            PAGAMENTO APROVADO
          </p>

          <h1 data-success-item className="mt-4 text-3xl font-bold">
            Ingresso gerado!
          </h1>

          <dl
            data-success-item
            className="mt-8 space-y-4 border-y border-white/10 py-6"
          >
            <div>
              <dt className="text-xs font-semibold text-zinc-500">EVENTO</dt>
              <dd className="mt-1 font-medium">{result.ticket.eventTitle}</dd>
            </div>

            <div>
              <dt className="text-xs font-semibold text-zinc-500">ASSENTO</dt>
              <dd className="mt-1 font-medium">{result.ticket.seatLabel}</dd>
            </div>

            <div>
              <dt className="text-xs font-semibold text-zinc-500">
                CÓDIGO DO INGRESSO
              </dt>
              <dd className="mt-1 break-all font-mono text-sm text-amber-300">
                {result.ticket.code}
              </dd>
            </div>
          </dl>

          <p data-success-item className="mt-5 text-sm text-zinc-400">
            Seu QR Code e os dados completos do ingresso já estão disponíveis na
            sua conta.
          </p>

          <div data-success-item className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/tickets"
              className="inline-flex rounded-xl bg-amber-400 px-4 py-3 font-bold text-zinc-950"
            >
              Ver meus ingressos
            </Link>

            <Link
              href="/"
              className="inline-flex rounded-xl border border-white/10 px-4 py-3 font-bold text-zinc-200 transition hover:border-amber-400 hover:text-amber-300"
            >
              Voltar para programação
            </Link>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#101114] px-6 py-12 text-zinc-100">
      <section className="w-full max-w-lg rounded-3xl border border-white/10 bg-zinc-900 p-7 sm:p-9">
        <div className="flex items-center justify-between">
          <Link
            href="/"
            className="text-lg font-black tracking-tight text-zinc-100"
          >
            CINE<span className="text-amber-400">PASS</span>
          </Link>

          <AlertDialog>
            <AlertDialogTrigger
              type="button"
              aria-label="Fechar checkout"
              title="Fechar checkout"
              className="flex size-10 items-center justify-center rounded-full border border-white/10 text-2xl leading-none text-zinc-300 transition hover:border-amber-400 hover:text-amber-300"
            >
              ×
            </AlertDialogTrigger>

            <AlertDialogContent className="border border-white/10 bg-zinc-900 p-6 text-zinc-100">
              <AlertDialogHeader>
                <AlertDialogTitle>Deseja sair do checkout?</AlertDialogTitle>
                <AlertDialogDescription className="text-zinc-400">
                  Você voltará para a escolha de lugares e precisará iniciar o
                  pagamento novamente.
                </AlertDialogDescription>
              </AlertDialogHeader>

              <AlertDialogFooter className="-mx-6 -mb-6 border-white/10 bg-zinc-950/60 p-4">
                <AlertDialogCancel className="border-white/10 text-zinc-100 hover:border-amber-400">
                  Continuar no checkout
                </AlertDialogCancel>

                <AlertDialogAction
                  onClick={handleLeaveCheckout}
                  className="bg-amber-400 text-zinc-950 hover:bg-amber-300"
                >
                  Sair do checkout
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>

        <p className="mt-10 text-sm font-bold tracking-[0.18em] text-amber-400">
          PAGAMENTO SIMULADO
        </p>

        <h1 className="mt-3 text-3xl font-bold">Confirme sua reserva</h1>

        <div className="mt-6 rounded-2xl bg-white/5 p-4 text-sm">
          {reservation ? (
            <>
              <p className="font-semibold">{reservation.event.title}</p>
              <p className="mt-1 text-zinc-400">
                Assento {reservation.seat.label} ·{" "}
                {formatPrice(reservation.event.price)}
              </p>
            </>
          ) : (
            <p className="text-zinc-400">
              Reserva:{" "}
              <span className="font-mono text-zinc-200">{reservationId}</span>
            </p>
          )}
        </div>

        <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <Label htmlFor="cardNumber" className="text-zinc-200">
              Número do cartão de teste
            </Label>

            <Input
              id="cardNumber"
              value={cardNumber}
              onChange={(event) => setCardNumber(event.target.value)}
              inputMode="numeric"
              required
              className="h-12 rounded-xl border-white/10 bg-zinc-950 px-4 text-zinc-100 focus-visible:border-amber-400"
            />
          </div>

          <div className="rounded-xl border border-white/10 bg-zinc-950/60 p-4 text-xs leading-6 text-zinc-400">
            <p>
              <strong className="text-emerald-300">Aprovar:</strong> 4242 4242
              4242 4242
            </p>
            <p>
              <strong className="text-red-300">Recusar:</strong> 4000 0000 0000
              0002
            </p>
          </div>

          {error ? (
            <Alert
              variant="destructive"
              className="border-red-400/30 bg-red-400/10 text-red-200"
            >
              <AlertDescription className="text-red-200">
                {error}
              </AlertDescription>
            </Alert>
          ) : null}

          <Button
            type="submit"
            disabled={isLoading}
            className="h-12 w-full rounded-xl font-bold"
          >
            {isLoading ? "Processando..." : "Pagar e gerar ingresso"}
          </Button>
        </form>
      </section>
    </main>
  );
}
