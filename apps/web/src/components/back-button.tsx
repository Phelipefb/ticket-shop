"use client";

import { useRouter } from "next/navigation";

type BackButtonProps = {
  fallbackHref?: string;
  iconOnly?: boolean;
};

export function BackButton({
  fallbackHref = "/",
  iconOnly = false,
}: BackButtonProps) {
  const router = useRouter();

  function handleBack() {
    if (window.history.length > 1) {
      router.back();
      return;
    }

    router.push(fallbackHref);
  }

  return (
    <button
      type="button"
      onClick={handleBack}
      aria-label={iconOnly ? "Fechar" : "Voltar para a tela anterior"}
      title={iconOnly ? "Fechar" : "Voltar"}
      className={
        iconOnly
          ? "flex size-10 items-center justify-center rounded-full border border-white/10 text-2xl leading-none text-zinc-300 transition hover:border-amber-400 hover:text-amber-300"
          : "text-sm font-medium text-amber-400 transition hover:text-amber-300"
      }
    >
      {iconOnly ? "×" : "← Voltar"}
    </button>
  );
}
