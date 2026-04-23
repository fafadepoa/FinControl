/**
 * Rode na máquina local com .env carregado:
 *   npx tsx scripts/check-email-env.ts
 *
 * Ou com dotenv:
 *   npm run check:email
 */
import "dotenv/config";
import { getEmailEnvIssues } from "../lib/email/diagnostics";

const issues = getEmailEnvIssues();

if (issues.length > 0) {
  console.error("[check:email] Configuração incompleta:\n");
  for (const line of issues) {
    console.error(`  - ${line}`);
  }
  console.error("\nAjuste o .env e rode de novo (ou use GET /api/health/email em produção).");
  process.exit(1);
}

console.log("[check:email] OK — envio de e-mail deve funcionar com os valores atuais.");
process.exit(0);
