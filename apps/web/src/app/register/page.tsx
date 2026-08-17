"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { type FormEvent, useState } from "react";
import { register } from "@/lib/api";
import { BackButton } from "@/components/back-button";

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (password !== confirmPassword) {
      setError("As senhas precisam ser iguais.");
      return;
    }

    setError("");
    setIsLoading(true);

    try {
      await register(name, email, password);
      router.push("/login");
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Não foi possível criar a conta.",
      );
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#101114] px-6 py-12 text-zinc-100">
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

        <h1 className="mt-10 text-3xl font-bold">Criar conta</h1>
        <p className="mt-2 text-sm leading-6 text-zinc-400">
          Cadastre-se para reservar assentos e comprar ingressos.
        </p>

        <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
          <label className="block">
            <span className="text-sm font-medium">Nome</span>
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              required
              minLength={2}
              autoComplete="name"
              className="mt-2 w-full rounded-xl border border-white/10 bg-zinc-950 px-4 py-3 outline-none transition focus:border-amber-400"
            />
          </label>

          <label className="block">
            <span className="text-sm font-medium">E-mail</span>
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
              autoComplete="email"
              className="mt-2 w-full rounded-xl border border-white/10 bg-zinc-950 px-4 py-3 outline-none transition focus:border-amber-400"
            />
          </label>

          <label className="block">
            <span className="text-sm font-medium">Senha</span>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
              minLength={8}
              autoComplete="new-password"
              className="mt-2 w-full rounded-xl border border-white/10 bg-zinc-950 px-4 py-3 outline-none transition focus:border-amber-400"
            />
          </label>

          <label className="block">
            <span className="text-sm font-medium">Confirmar senha</span>
            <input
              type="password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              required
              minLength={8}
              autoComplete="new-password"
              className="mt-2 w-full rounded-xl border border-white/10 bg-zinc-950 px-4 py-3 outline-none transition focus:border-amber-400"
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
            {isLoading ? "Criando conta..." : "Criar conta"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-zinc-400">
          Já possui uma conta?{" "}
          <Link href="/login" className="font-bold text-amber-300">
            Entrar
          </Link>
        </p>
      </section>
    </main>
  );
}
