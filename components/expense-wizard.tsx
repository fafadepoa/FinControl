"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createExpense } from "@/lib/actions/expenses";
import { formatBRL, parseMoneyBR } from "@/lib/money";

export type WizardCompany = {
  id: string;
  name: string;
  categories: { id: string; name: string; limitAmount: string | null }[];
};

const STEPS = ["Valor", "Empresa", "Categoria", "Descrição", "Comprovante", "Revisão"] as const;

export function ExpenseWizard({
  companies,
  creditBalanceVisible,
  creditBalanceAmount,
}: {
  companies: WizardCompany[];
  /** Quando false, não exibe o valor (decisão do administrador). */
  creditBalanceVisible: boolean;
  creditBalanceAmount: number;
}) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [amountStr, setAmountStr] = useState("");
  const [companyId, setCompanyId] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [description, setDescription] = useState("");
  const [receipt, setReceipt] = useState<File | null>(null);
  const [receiptPreviewUrl, setReceiptPreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const company = useMemo(
    () => companies.find((c) => c.id === companyId),
    [companies, companyId]
  );
  const category = useMemo(
    () => company?.categories.find((x) => x.id === categoryId),
    [company, categoryId]
  );

  const amountNum = parseMoneyBR(amountStr) ?? 0;
  const limitNum = category?.limitAmount != null ? Number(category.limitAmount) : null;
  const hasImageReceipt = receipt?.type.startsWith("image/") ?? false;

  useEffect(() => {
    if (!receipt || !receipt.type.startsWith("image/")) {
      setReceiptPreviewUrl(null);
      return;
    }

    const objectUrl = URL.createObjectURL(receipt);
    setReceiptPreviewUrl(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [receipt]);

  function next() {
    setError(null);
    if (step === 0) {
      const v = parseMoneyBR(amountStr);
      if (v === null || v <= 0) {
        setError("Informe um valor válido.");
        return;
      }
    }
    if (step === 1 && !companyId) {
      setError("Selecione o centro de custo (empresa).");
      return;
    }
    if (step === 2 && !categoryId) {
      setError("Selecione uma categoria.");
      return;
    }
    if (step === 2 && limitNum != null && amountNum > limitNum) {
      const ok = window.confirm(
        `O valor informado (${formatBRL(amountNum)}) ultrapassa o limite sugerido da categoria (${formatBRL(limitNum)}). Deseja continuar mesmo assim?`
      );
      if (!ok) return;
    }
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
  }

  function back() {
    setError(null);
    setStep((s) => Math.max(s - 1, 0));
  }

  async function submit() {
    setError(null);
    setLoading(true);
    try {
      await createExpense({
        amountStr,
        companyId,
        categoryId,
        description: description.trim() || null,
        receipt,
      });
      router.push("/expenses?created=1");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao enviar.");
    } finally {
      setLoading(false);
    }
  }

  const progressPct = ((step + 1) / STEPS.length) * 100;

  return (
    <div className="fc-glass mx-auto max-w-lg space-y-6 p-6 md:p-8">
      <div>
        <p className="text-sm font-semibold text-fc-cyan">
          ETAPA {(step + 1).toString().padStart(2, "0")}{" "}
          <span className="font-normal text-[var(--fc-text-muted)]">
            de {STEPS.length.toString().padStart(2, "0")}
          </span>
        </p>
        <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-[rgba(15,34,39,0.5)]">
          <div
            className="h-full rounded-full bg-gradient-to-r from-fc-cyan to-fc-green transition-all duration-300"
            style={{ width: `${progressPct}%` }}
          />
        </div>
        <p className="fc-label-strong mt-3">{STEPS[step]}</p>
      </div>

      {error && <div className="fc-alert-error">{error}</div>}

      <div className="rounded-lg border border-[var(--fc-glass-border)] bg-[rgba(15,34,39,0.35)] px-3 py-2 text-sm text-[var(--fc-text-muted)]">
        {creditBalanceVisible ? (
          <>
            Seu saldo de crédito:{" "}
            <span className="font-semibold text-fc-heading">{formatBRL(creditBalanceAmount)}</span>
          </>
        ) : (
          <>O valor do seu saldo de crédito foi oculto pelo administrador.</>
        )}
      </div>

      {step === 0 && (
        <div className="space-y-2">
          <label className="fc-label-strong">Informe o valor a ser solicitado</label>
          <input
            className="fc-input py-3 text-lg text-fc-cyan"
            placeholder="R$ 0,00"
            value={amountStr}
            onChange={(e) => setAmountStr(e.target.value)}
            autoFocus
          />
        </div>
      )}

      {step === 1 && (
        <div className="space-y-2">
          <label className="fc-label">Centro de custo (empresa)</label>
          <select
            className="fc-input"
            value={companyId}
            onChange={(e) => {
              setCompanyId(e.target.value);
              setCategoryId("");
            }}
          >
            <option value="">Selecione…</option>
            {companies.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
      )}

      {step === 2 && company && (
        <div className="space-y-2">
          <label className="fc-label">Categoria</label>
          <select
            className="fc-input"
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
          >
            <option value="">Selecione…</option>
            {company.categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
                {c.limitAmount != null ? ` (limite ${formatBRL(Number(c.limitAmount))})` : ""}
              </option>
            ))}
          </select>
        </div>
      )}

      {step === 3 && (
        <div className="space-y-2">
          <label className="fc-label">Descrição (opcional)</label>
          <textarea
            className="fc-input min-h-[120px]"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Detalhes adicionais"
          />
        </div>
      )}

      {step === 4 && (
        <div className="space-y-2">
          <label className="fc-label">Comprovante (opcional)</label>
          <input
            type="file"
            accept="image/*,application/pdf"
            className="fc-file-input"
            onChange={(e) => setReceipt(e.target.files?.[0] ?? null)}
          />
          <p className="text-xs text-[var(--fc-text-subtle)]">PDF ou imagem, máx. 5 MB.</p>
        </div>
      )}

      {step === 5 && (
        <div className="fc-glass-strong space-y-3 p-4 text-sm">
          <h3 className="font-semibold text-fc-heading">Revisão</h3>
          <dl className="grid gap-2">
            <div className="flex justify-between gap-4">
              <dt className="text-[var(--fc-text-muted)]">Valor</dt>
              <dd className="fc-amount">{formatBRL(amountNum)}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-[var(--fc-text-muted)]">Empresa</dt>
              <dd className="text-fc-heading">{company?.name}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-[var(--fc-text-muted)]">Categoria</dt>
              <dd className="text-fc-heading">{category?.name}</dd>
            </div>
            {description.trim() && (
              <div className="flex justify-between gap-4">
                <dt className="text-[var(--fc-text-muted)]">Descrição</dt>
                <dd className="max-w-[60%] text-right text-fc-heading">{description}</dd>
              </div>
            )}
            <div className="space-y-2">
              <dt className="text-[var(--fc-text-muted)]">Comprovante</dt>
              <dd className="text-fc-heading">
                {!receipt && "—"}
                {receipt && hasImageReceipt && receiptPreviewUrl && (
                  <div className="space-y-2">
                    <img
                      src={receiptPreviewUrl}
                      alt={`Preview do comprovante ${receipt.name}`}
                      className="max-h-56 w-auto max-w-full rounded-lg border border-[var(--fc-glass-border)] object-contain"
                    />
                    <p className="text-xs text-[var(--fc-text-muted)]">{receipt.name}</p>
                  </div>
                )}
                {receipt && (!hasImageReceipt || !receiptPreviewUrl) && (
                  <p>{receipt.name}</p>
                )}
              </dd>
            </div>
          </dl>
        </div>
      )}

      <div className="flex flex-wrap gap-3 pt-2">
        {step > 0 && (
          <button type="button" onClick={back} className="fc-btn-secondary">
            Voltar
          </button>
        )}
        {step < STEPS.length - 1 ? (
          <button type="button" onClick={next} className="fc-btn-primary">
            Continuar
          </button>
        ) : (
          <button
            type="button"
            disabled={loading}
            onClick={submit}
            className="fc-btn-primary disabled:opacity-50"
          >
            {loading ? "Enviando…" : "Solicitar despesa"}
          </button>
        )}
      </div>
    </div>
  );
}
