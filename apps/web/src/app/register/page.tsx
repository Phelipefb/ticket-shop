"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { type FormEvent, useState } from "react";
import { register } from "@/lib/api";
import { BackButton } from "@/components/back-button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

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
          <div className="space-y-2">
            <Label htmlFor="name" className="text-zinc-200">
              Nome
            </Label>

            <Input
              id="name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              required
              minLength={2}
              autoComplete="name"
              className="h-12 rounded-xl border-white/10 bg-zinc-950 px-4 text-zinc-100 focus-visible:border-amber-400"
            />
          </div>

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
              className="h-12 rounded-xl border-white/10 bg-zinc-950 px-4 text-zinc-100 focus-visible:border-amber-400"
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
              minLength={8}
              autoComplete="new-password"
              className="h-12 rounded-xl border-white/10 bg-zinc-950 px-4 text-zinc-100 focus-visible:border-amber-400"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword" className="text-zinc-200">
              Confirmar senha
            </Label>

            <Input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              required
              minLength={8}
              autoComplete="new-password"
              className="h-12 rounded-xl border-white/10 bg-zinc-950 px-4 text-zinc-100 focus-visible:border-amber-400"
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
            {isLoading ? "Criando conta..." : "Criar conta"}
          </Button>
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
