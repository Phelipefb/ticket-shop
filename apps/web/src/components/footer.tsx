import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t border-white/10 bg-[#101114] text-zinc-400">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-6 py-7 text-sm sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Link
            href="/"
            className="text-base font-black tracking-tight text-zinc-100"
          >
            CINE<span className="text-amber-400">PASS</span>
          </Link>

          <p className="mt-1">
            © 2026 CinePass. Projeto desenvolvido para o Desafio Elite Dev.
          </p>
        </div>

        <nav className="flex items-center gap-4">
          <Link href="/" className="transition hover:text-amber-300">
            Programação
          </Link>

          <a
            href="https://github.com/Phelipefb/ticket-shop"
            target="_blank"
            rel="noreferrer"
            className="transition hover:text-amber-300"
          >
            GitHub
          </a>
        </nav>
      </div>
    </footer>
  );
}
