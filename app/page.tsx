import { auth } from "@/auth";
import { PublicBrand } from "@/components/public-brand";
import { UIThemeToggle } from "@/components/ui/theme-toggle";
import Link from "next/link";
import { redirect } from "next/navigation";

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ reauth?: string; callbackUrl?: string; audience?: string }>;
}) {
  const sp = await searchParams;
  const session = await auth();
  if (session?.user) {
    redirect(session.user.role === "ADMIN" ? "/admin" : "/expenses");
  }
  const needsRelogin = sp.reauth === "1";
  const callbackUrl = sp.callbackUrl?.trim() ? sp.callbackUrl : null;
  const collaboratorLoginHref = callbackUrl ? `/login?callbackUrl=${encodeURIComponent(callbackUrl)}` : "/login";
  const adminLoginHref = callbackUrl ? `/admin/login?callbackUrl=${encodeURIComponent(callbackUrl)}` : "/admin/login";
  const reloginText =
    sp.audience === "admin"
      ? "Sua sessão administrativa expirou. Entre novamente para continuar no painel."
      : "Sua sessão expirou. Faça login novamente para continuar de onde parou.";

  return (
    <main className="fc-public-screen flex min-h-screen flex-col">
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-4 py-5 md:px-6">
        <PublicBrand />
        <nav className="hidden items-center gap-6 text-sm font-medium md:flex">
          <a href="#como-funciona" className="fc-public-header-link">
            Como funciona
          </a>
          <a href="#perfis" className="fc-public-header-link">
            Perfis
          </a>
          <a href="#acessos" className="fc-public-header-link">
            Acessos
          </a>
        </nav>
        <div className="flex items-center gap-3">
          <UIThemeToggle />
          <Link href="/register" className="fc-btn-secondary border-white/10 bg-cyan-300/90 px-5 py-3 text-slate-900">
            Cadastre-se
          </Link>
          <Link href={collaboratorLoginHref} className="fc-public-outline">
            Login
          </Link>
        </div>
      </header>

      <section className="mx-auto flex w-full max-w-6xl flex-1 items-center px-4 pb-12 pt-6 md:px-6 md:pb-20 md:pt-10">
        <div className="grid items-center gap-10 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="space-y-8">
            {needsRelogin ? (
              <div className="rounded-2xl border border-cyan-200/35 bg-slate-900/35 p-4 text-sm text-cyan-50 backdrop-blur-sm">
                <p className="font-semibold">Sessão encerrada com segurança</p>
                <p className="mt-1 text-cyan-100/90">{reloginText}</p>
              </div>
            ) : null}
            <div className="space-y-5">
              <span className="inline-flex rounded-full border border-cyan-200/30 bg-slate-900/25 px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-cyan-100">
                Plataforma SaaS de gestão financeira
              </span>
              <h1 className="max-w-3xl text-5xl font-semibold leading-[1.02] tracking-[-0.055em] text-white md:text-6xl">
                A solucao completa para organizar cadastro, login e despesas da sua empresa.
              </h1>
              <p className="max-w-2xl text-lg leading-8 text-slate-100">
                O FinControl agora separa melhor o primeiro acesso do administrador e do colaborador, com landing
                page, fluxo de cadastro mais guiado e autenticação mais clara.
              </p>
            </div>

            <div className="flex flex-wrap gap-4">
              <Link href="/register" className="fc-btn-secondary border-transparent bg-white px-6 py-3 text-slate-900">
                Comecar agora
              </Link>
              <Link href={adminLoginHref} className="fc-public-outline">
                Acesso admin
              </Link>
            </div>

            <div id="como-funciona" className="grid gap-4 sm:grid-cols-3">
              <article className="rounded-3xl border border-white/20 bg-slate-950/28 p-5 text-slate-100 backdrop-blur-sm transition-transform hover:-translate-y-1">
                <p className="text-sm font-semibold text-white">1. Administrador cria a base</p>
                <p className="mt-2 text-sm leading-6">
                  Cadastro com nome da empresa, ativacao por e-mail e acesso inicial ao painel administrativo.
                </p>
              </article>
              <article className="rounded-3xl border border-white/20 bg-slate-950/28 p-5 text-slate-100 backdrop-blur-sm transition-transform hover:-translate-y-1">
                <p className="text-sm font-semibold text-white">2. Colaborador recebe acesso</p>
                <p className="mt-2 text-sm leading-6">
                  O colaborador nao cria empresa: ele recebe credenciais da organizacao e entra no fluxo correto.
                </p>
              </article>
              <article className="rounded-3xl border border-white/20 bg-slate-950/28 p-5 text-slate-100 backdrop-blur-sm transition-transform hover:-translate-y-1">
                <p className="text-sm font-semibold text-white">3. Operacao organizada</p>
                <p className="mt-2 text-sm leading-6">
                  Empresas, centros de custo, creditos e despesas seguem conectados desde o primeiro acesso.
                </p>
              </article>
            </div>
          </div>

          <div className="relative">
            <div className="absolute -left-8 top-16 hidden h-24 w-24 rounded-full bg-cyan-300/30 blur-sm lg:block" />
            <div className="absolute -right-8 bottom-20 hidden h-20 w-20 rounded-full bg-amber-300/30 blur-sm lg:block" />
            <div className="relative rounded-[2rem] border border-white/12 bg-white/10 p-5 backdrop-blur-sm">
              <div className="rounded-[1.6rem] bg-white/96 p-6 text-slate-900 shadow-[0_18px_60px_rgba(15,23,42,0.22)]">
                <div className="grid gap-5 md:grid-cols-2" id="perfis">
                  <section className="rounded-[1.35rem] bg-slate-50 p-5">
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Administrador</p>
                    <h2 className="mt-3 text-2xl font-semibold tracking-[-0.03em] text-slate-900">
                      Cria a conta e estrutura a empresa
                    </h2>
                    <ul className="fc-public-feature-list mt-5 text-sm leading-6">
                      <li>Cadastro completo com e-mail, senha e empresa.</li>
                      <li>Ativa o ambiente inicial e passa a gerir colaboradores.</li>
                      <li>Entra por uma rota dedicada de login administrativo.</li>
                    </ul>
                  </section>

                  <section className="rounded-[1.35rem] bg-slate-50 p-5">
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Colaborador</p>
                    <h2 className="mt-3 text-2xl font-semibold tracking-[-0.03em] text-slate-900">
                      Recebe acesso e usa o app no fluxo certo
                    </h2>
                    <ul className="fc-public-feature-list mt-5 text-sm leading-6">
                      <li>Nao precisa cadastrar empresa no primeiro acesso.</li>
                      <li>Usa o login do colaborador e pode recuperar a senha.</li>
                      <li>Fica vinculado aos centros de custo definidos pelo admin.</li>
                    </ul>
                  </section>
                </div>

                <div
                  id="acessos"
                  className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-[1.35rem] bg-[linear-gradient(135deg,#eef3ff_0%,#f8fbff_100%)] px-5 py-4"
                >
                  <div>
                    <p className="text-sm font-semibold text-slate-900">Entradas publicas organizadas</p>
                    <p className="mt-1 text-sm text-slate-500">
                      Escolha o caminho ideal para administrar a empresa ou acessar como colaborador.
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-3">
                    <Link href={collaboratorLoginHref} className="fc-btn-secondary">
                      Login colaborador
                    </Link>
                    <Link href={adminLoginHref} className="fc-btn-primary">
                      Login admin
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
