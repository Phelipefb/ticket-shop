"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { type FormEvent, useState } from "react";
import { login } from "@/lib/api";

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
        <Link
          href="/"
          className="text-lg font-black tracking-tight text-zinc-100"
        >
          CINE<span className="text-amber-400">PASS</span>
        </Link>

        <h1 className="mt-10 text-3xl font-bold">Entrar</h1>
        <p className="mt-2 text-sm leading-6 text-zinc-400">
          Use sua conta para reservar assentos e acessar seus ingressos.
        </p>

        <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
          <label className="block">
            <span className="text-sm font-medium text-zinc-200">E-mail</span>
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
              autoComplete="email"
              className="mt-2 w-full rounded-xl border border-white/10 bg-zinc-950 px-4 py-3 text-zinc-100 outline-none transition placeholder:text-zinc-600 focus:border-amber-400"
            />
          </label>

          <label className="block">
            <span className="text-sm font-medium text-zinc-200">Senha</span>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
              autoComplete="current-password"
              className="mt-2 w-full rounded-xl border border-white/10 bg-zinc-950 px-4 py-3 text-zinc-100 outline-none transition placeholder:text-zinc-600 focus:border-amber-400"
            />
          </label>

          {error ? (
            <p className="rounded-xl border border-red-400/30 bg-red-400/10 px-4 py-3 text-sm text-red-200">
              {error}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full rounded-xl bg-amber-400 px-4 py-3 font-bold text-zinc-950 transition hover:bg-amber-300 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isLoading ? "Entrando..." : "Entrar"}
          </button>
        </form>
      </section>
    </main>
  );
}
