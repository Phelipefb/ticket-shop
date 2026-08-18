"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { type FormEvent, useState } from "react";
import { login } from "@/lib/api";
import { BackButton } from "@/components/back-button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("cliente1@ticketshop.dev");
  const [password, setPassword] = useState("Cliente123!");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const session = await login(email, password);

      localStorage.setItem("cinepass:accessToken", session.accessToken);
      localStorage.setItem("cinepass:user", JSON.stringify(session.user));

      router.push("/");
      router.refresh();
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Não foi possível fazer login.";

      setError(message);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#101114] px-6 text-zinc-100">
      <section className="w-full max-w-md rounded-3xl border border-white/10 bg-zinc-900 p-7 sm:p-9">
        <div className="flex items-center justify-between">
          <BackButton />

          <Link
            href="/"
            className="text-lg font-black tracking-tight text-zinc-100"
          >
            CINE<span className="text-amber-400">PASS</span>
          </Link>
        </div>

        <h1 className="mt-10 text-3xl font-bold">Entrar</h1>
        <p className="mt-2 text-sm leading-6 text-zinc-400">
          Use sua conta para reservar assentos e acessar seus ingressos.
        </p>

        <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <Label htmlFor="email" className="text-zinc-200">
              E-mail
            </Label>

            <Input
              id="email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
              autoComplete="email"
              className="h-12 rounded-xl border-white/10 bg-zinc-950 px-4 text-zinc-100 placeholder:text-zinc-600 focus-visible:border-amber-400"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password" className="text-zinc-200">
              Senha
            </Label>

            <Input
              id="password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
              autoComplete="current-password"
              className="h-12 rounded-xl border-white/10 bg-zinc-950 px-4 text-zinc-100 placeholder:text-zinc-600 focus-visible:border-amber-400"
            />
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
            {isLoading ? "Entrando..." : "Entrar"}
          </Button>
        </form>
        <p className="mt-6 text-center text-sm text-zinc-400">
          Ainda não possui uma conta?{" "}
          <Link href="/register" className="font-bold text-amber-300">
            Criar conta
          </Link>
        </p>
      </section>
    </main>
  );
}
