"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import type { AuthUser } from "@/lib/api";

export function Header() {
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);

  useEffect(() => {
    const savedUser = localStorage.getItem("cinepass:user");

    if (!savedUser) {
      return;
    }

    try {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setUser(JSON.parse(savedUser) as AuthUser);
    } catch {
      localStorage.removeItem("cinepass:user");
      localStorage.removeItem("cinepass:accessToken");
    }
  }, []);

  function handleLogout() {
    localStorage.removeItem("cinepass:user");
    localStorage.removeItem("cinepass:accessToken");
    setUser(null);

    router.push("/");
    router.refresh();
  }

  return (
    <header className="border-b border-white/10">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
        <Link href="/" className="text-lg font-black tracking-tight">
          CINE<span className="text-amber-400">PASS</span>
        </Link>

        {user ? (
          <div className="flex items-center gap-4">
            <span className="hidden text-sm text-zinc-400 sm:block">
              Olá, {user.name}
            </span>

            {user.role === "CUSTOMER" ? (
              <Link
                href="/tickets"
                className="hidden text-sm font-medium text-zinc-300 transition hover:text-amber-300 sm:block"
              >
                Meus ingressos
              </Link>
            ) : null}

            {user.role === "ORGANIZER" ? (
              <Link
                href="/organizer/events"
                className="hidden text-sm font-medium text-zinc-300 transition hover:text-amber-300 sm:block"
              >
                Meus eventos
              </Link>
            ) : null}

            {user.role === "GATEKEEPER" ? (
              <Link
                href="/gate"
                className="hidden text-sm font-medium text-zinc-300 transition hover:text-amber-300 sm:block"
              >
                Portaria
              </Link>
            ) : null}
            <button
              type="button"
              onClick={handleLogout}
              className="rounded-lg border border-white/10 px-3 py-2 text-sm font-medium text-zinc-200 transition hover:border-amber-400 hover:text-amber-300"
            >
              Sair
            </button>
          </div>
        ) : (
          <Link
            href="/login"
            className="rounded-lg bg-amber-400 px-3 py-2 text-sm font-bold text-zinc-950 transition hover:bg-amber-300"
          >
            Entrar
          </Link>
        )}
      </div>
    </header>
  );
}
