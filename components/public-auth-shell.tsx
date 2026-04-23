import type { ReactNode } from "react";
import Link from "next/link";
import { PublicBrand } from "@/components/public-brand";

export function PublicAuthShell({
  badge,
  title,
  description,
  children,
  accent = "collaborator",
  backHref = "/",
  backLabel = "Voltar para a pagina inicial",
}: {
  badge: string;
  title: string;
  description: string;
  children: ReactNode;
  accent?: "collaborator" | "admin";
  backHref?: string;
  backLabel?: string;
}) {
  const accentClass =
    accent === "admin" ? "fc-public-panel fc-public-panel-admin" : "fc-public-panel fc-public-panel-user";

  return (
    <div className="fc-public-screen flex flex-1 items-center px-4 py-6 md:px-6 md:py-8">
      <div className="mx-auto grid min-h-[720px] w-full max-w-6xl overflow-hidden rounded-[2rem] border border-white/12 bg-[var(--fc-surface-1)] shadow-[0_28px_100px_rgba(18,30,68,0.25)] lg:grid-cols-[1.05fr_0.95fr]">
        <aside className={accentClass}>
          <div className="relative z-10 flex h-full flex-col justify-between gap-10 p-8 md:p-10">
            <div className="flex items-start justify-between gap-4">
              <PublicBrand />
              <span className="rounded-full border border-white/20 bg-white/10 px-4 py-1 text-[0.7rem] font-semibold uppercase tracking-[0.24em] text-white/75">
                {badge}
              </span>
            </div>

            <div className="space-y-6">
              <div className="fc-public-dot-grid" aria-hidden="true" />
              <div className="space-y-4">
                <p className="text-sm font-medium uppercase tracking-[0.24em] text-cyan-200">FinControl Platform</p>
                <h1 className="text-4xl font-semibold leading-tight tracking-[-0.04em] text-white md:text-5xl">
                  Sua operacao de despesas com um fluxo claro para admin e colaborador.
                </h1>
                <p className="max-w-xl text-base leading-7 text-white/78">
                  Organize o primeiro acesso da empresa, conduza o cadastro administrativo e entregue uma experiencia
                  simples para o colaborador entrar, enviar despesas e recuperar a senha.
                </p>
              </div>
            </div>

            <div className="grid gap-3 text-sm text-white/80 sm:grid-cols-2">
              <div className="rounded-2xl border border-white/14 bg-white/8 p-4 backdrop-blur-sm">
                <p className="font-semibold text-white">Cadastro guiado</p>
                <p className="mt-2">A conta administrativa ja nasce pronta para iniciar a configuracao da empresa.</p>
              </div>
              <div className="rounded-2xl border border-white/14 bg-white/8 p-4 backdrop-blur-sm">
                <p className="font-semibold text-white">Acesso separado</p>
                <p className="mt-2">Cada perfil entra pela rota correta com textos e orientacoes mais claras.</p>
              </div>
            </div>
          </div>
        </aside>

        <section className="flex items-center justify-center px-4 py-8 md:px-8 md:py-10">
          <div className="w-full max-w-xl space-y-6">
            <div className="flex items-center justify-between gap-4">
              <Link href={backHref} className="fc-public-back-link">
                <span aria-hidden="true">←</span>
                {backLabel}
              </Link>
              <div className="hidden text-xs font-medium uppercase tracking-[0.22em] text-slate-400 sm:block">
                Jornada publica
              </div>
            </div>

            <div className="space-y-3">
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--fc-primary)]">{badge}</p>
              <h2 className="text-3xl font-semibold leading-tight tracking-[-0.03em] text-[var(--fc-heading)] md:text-[2.35rem]">
                {title}
              </h2>
              <p className="text-[0.96rem] leading-7 text-[var(--fc-text-muted)]">{description}</p>
            </div>

            {children}
          </div>
        </section>
      </div>
    </div>
  );
}
