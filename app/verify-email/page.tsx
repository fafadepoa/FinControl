import Link from "next/link";
import { verifyEmailToken } from "@/lib/auth/registration";
import { PublicAuthShell } from "@/components/public-auth-shell";

export default async function VerifyEmailPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const sp = await searchParams;
  const token = sp.token ?? "";
  const result = await verifyEmailToken(token);

  return (
    <PublicAuthShell
      badge="Verificacao"
      title={result.ok ? "E-mail confirmado com sucesso" : "Nao foi possivel confirmar o e-mail"}
      description={
        result.ok
          ? "Sua conta administrativa foi ativada. Agora voce ja pode entrar e concluir a configuracao da empresa."
          : result.reason
      }
      accent="admin"
    >
      <div className="space-y-4 rounded-[1.5rem] border border-slate-200/70 bg-white/70 p-6">
        <div className={result.ok ? "fc-alert-success" : "fc-alert-error"}>
          {result.ok
            ? "Tudo certo: o seu acesso ja esta liberado para o painel administrativo."
            : "Verifique se o link esta completo ou solicite um novo cadastro."}
        </div>
        <div className="flex flex-wrap gap-3">
          <Link href="/admin/login" className="fc-btn-primary">
            Ir para login admin
          </Link>
          <Link href="/login" className="fc-btn-secondary">
            Login colaborador
          </Link>
        </div>
      </div>
    </PublicAuthShell>
  );
}
