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
const MAX_RECEIPTS = 5;

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
  const [receipts, setReceipts] = useState<File[]>([]);
  const [receiptPreviewUrls, setReceiptPreviewUrls] = useState<Array<{ name: string; url: string }>>([]);
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
  const hasReceipts = receipts.length > 0;

  useEffect(() => {
    if (receipts.length === 0) {
      setReceiptPreviewUrls([]);
      return;
    }
    const previews = receipts
      .filter((file) => file.type.startsWith("image/"))
      .map((file) => ({ name: file.name, url: URL.createObjectURL(file) }));
    setReceiptPreviewUrls(previews);
    return () => previews.forEach((preview) => URL.revokeObjectURL(preview.url));
  }, [receipts]);

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

  function onSelectReceipts(event: React.ChangeEvent<HTMLInputElement>) {
    const selectedFiles = Array.from(event.target.files ?? []);
    if (selectedFiles.length === 0) return;
    const current = receipts;
    const merged = [...current];
    for (const file of selectedFiles) {
      const exists = merged.some(
        (existing) =>
          existing.name === file.name &&
          existing.size === file.size &&
          existing.lastModified === file.lastModified
      );
      if (!exists) merged.push(file);
    }
    if (merged.length > MAX_RECEIPTS) {
      setError(`Você pode anexar no máximo ${MAX_RECEIPTS} comprovantes.`);
      setReceipts(merged.slice(0, MAX_RECEIPTS));
    } else {
      setError(null);
      setReceipts(merged);
    }
    // Permite selecionar o mesmo arquivo novamente em seguida, se necessário.
    event.currentTarget.value = "";
  }

  function removeReceipt(index: number) {
    setReceipts((prev) => prev.filter((_, i) => i !== index));
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
        receipts,
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
          <label className="fc-label">Comprovantes (opcional)</label>
          <input
            type="file"
            accept="image/*,application/pdf"
            multiple
            className="fc-file-input"
            onChange={onSelectReceipts}
          />
          <p className="text-xs text-[var(--fc-text-subtle)]">
            Até 5 arquivos (PDF ou imagem), máximo de 5 MB por arquivo.
          </p>
          {hasReceipts && (
            <div className="mt-3 space-y-2 rounded-lg border border-[var(--fc-glass-border)] bg-[rgba(255,255,255,0.55)] p-3">
              <p className="text-xs font-semibold text-[var(--fc-text-muted)]">
                {receipts.length} arquivo(s) selecionado(s)
              </p>
              {receiptPreviewUrls.length > 0 && (
                <div className="grid gap-2 sm:grid-cols-2">
                  {receiptPreviewUrls.map((preview) => (
                    <div key={preview.name} className="space-y-1">
                      <img
                        src={preview.url}
                        alt={`Preview do comprovante ${preview.name}`}
                        className="max-h-36 w-auto max-w-full rounded-lg border border-[var(--fc-glass-border)] object-contain"
                      />
                      <p className="truncate text-xs text-[var(--fc-text-muted)]">{preview.name}</p>
                    </div>
                  ))}
                </div>
              )}
              <ul className="space-y-1 text-xs text-[var(--fc-text-muted)]">
                {receipts.map((file, index) => (
                  <li key={`${file.name}-${file.lastModified}`} className="flex items-center justify-between gap-2">
                    <span className="truncate">{file.name}</span>
                    <button
                      type="button"
                      onClick={() => removeReceipt(index)}
                      className="fc-btn-ghost text-xs"
                    >
                      Remover
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
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
              <dt className="text-[var(--fc-text-muted)]">Comprovantes</dt>
              <dd className="text-fc-heading">
                {!hasReceipts && "—"}
                {hasReceipts && (
                  <div className="space-y-2">
                    <p className="text-xs text-[var(--fc-text-muted)]">
                      {receipts.length} arquivo(s) selecionado(s)
                    </p>
                    {receiptPreviewUrls.length > 0 && (
                      <div className="grid gap-2 sm:grid-cols-2">
                        {receiptPreviewUrls.map((preview) => (
                          <div key={preview.name} className="space-y-1">
                            <img
                              src={preview.url}
                              alt={`Preview do comprovante ${preview.name}`}
                              className="max-h-40 w-auto max-w-full rounded-lg border border-[var(--fc-glass-border)] object-contain"
                            />
                            <p className="text-xs text-[var(--fc-text-muted)]">{preview.name}</p>
                          </div>
                        ))}
                      </div>
                    )}
                    <ul className="space-y-1 text-xs text-[var(--fc-text-muted)]">
                      {receipts.map((file) => (
                        <li key={`${file.name}-${file.lastModified}`}>{file.name}</li>
                      ))}
                    </ul>
                  </div>
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
