"use client";

import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { ExpenseStatus, FuelEntryMode } from "@prisma/client";
import { payExpenseWithCredit, setExpenseStatusForm } from "@/lib/actions/expenses";
import { formatBRL } from "@/lib/money";

type AdminExpenseRow = {
  id: string;
  createdAt: string;
  userEmail: string;
  userId: string;
  userRole: "ADMIN" | "USER";
  /** Saldo atual de crédito do autor da despesa (USER ou ADMIN). */
  userCreditBalance: string | null;
  companyName: string;
  categoryName: string;
  fuelEntryMode: FuelEntryMode | null;
  amount: string;
  status: ExpenseStatus;
  description: string | null;
  attachmentUrls: string[];
};

function statusLabel(s: ExpenseStatus) {
  switch (s) {
    case "PENDING":
      return "Aguardando validação";
    case "APPROVED":
      return "Aprovada";
    case "REJECTED":
      return "Rejeitada";
    case "PAID":
      return "Paga";
    default:
      return s;
  }
}

function fuelEntryModeLabel(mode: FuelEntryMode | null) {
  if (!mode) return null;
  if (mode === "DAILY") return "Por diária";
  if (mode === "KM") return "Por km";
  return "Livre";
}

function isImageUrl(url: string) {
  return /\.(png|jpe?g|webp|gif)(\?.*)?$/i.test(url);
}

function isPdfUrl(url: string) {
  return /\.pdf(\?.*)?$/i.test(url);
}

export function AdminExpensesTable({ rows }: { rows: AdminExpenseRow[] }) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const canUseDOM = typeof window !== "undefined";

  useEffect(() => {
    if (!selectedId) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setSelectedId(null);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [selectedId]);

  const selected = useMemo(() => rows.find((r) => r.id === selectedId) ?? null, [rows, selectedId]);

  const classifiedAttachments = useMemo(() => {
    if (!selected) return [];
    return selected.attachmentUrls.map((url) => ({
      url,
      type: isImageUrl(url) ? "image" : isPdfUrl(url) ? "pdf" : "other",
    }));
  }, [selected]);

  const creditPayInfo = useMemo(() => {
    if (!selected || selected.status !== "APPROVED") return null;
    const balanceNum = selected.userCreditBalance != null ? Number(selected.userCreditBalance) : 0;
    const expenseNum = Number(selected.amount);
    return {
      balanceNum,
      expenseNum,
      hasNoCredit: balanceNum <= 0,
      insufficient: balanceNum > 0 && balanceNum < expenseNum,
      canPay: balanceNum >= expenseNum,
    };
  }, [selected]);

  return (
    <>
      <div className="fc-glass fc-table-shell overflow-hidden p-0">
        <table className="min-w-[960px]">
          <thead className="fc-glass-table-head">
            <tr>
              <th>Data</th>
              <th>Colaborador</th>
              <th>Empresa</th>
              <th>Categoria</th>
              <th>Valor</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((e) => (
              <tr
                key={e.id}
                className="cursor-pointer"
                onClick={() => setSelectedId(e.id)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") setSelectedId(e.id);
                }}
                tabIndex={0}
                role="button"
                aria-label={`Abrir detalhes da despesa de ${e.userEmail}`}
              >
                <td className="whitespace-nowrap text-[var(--fc-text-muted)]">{e.createdAt}</td>
                <td>{e.userEmail}</td>
                <td>{e.companyName}</td>
                <td>
                  {e.categoryName}
                  {e.fuelEntryMode ? (
                    <span className="ml-2 rounded border border-[var(--fc-glass-border)] px-2 py-0.5 text-[11px] text-[var(--fc-text-muted)]">
                      {fuelEntryModeLabel(e.fuelEntryMode)}
                    </span>
                  ) : null}
                </td>
                <td className="fc-amount">{formatBRL(Number(e.amount))}</td>
                <td>{statusLabel(e.status)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {canUseDOM &&
        selected &&
        createPortal(
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/35 px-4 py-8"
            role="presentation"
            onClick={() => setSelectedId(null)}
          >
            <div
              role="dialog"
              aria-modal="true"
              aria-label="Detalhes da despesa"
              className="fc-glass-strong w-full max-w-2xl space-y-5 rounded-2xl p-5 md:p-6"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="flex items-start justify-between gap-3">
                <h3 className="text-lg font-semibold text-fc-heading">Detalhes da despesa</h3>
                <button type="button" className="fc-btn-ghost text-sm" onClick={() => setSelectedId(null)}>
                  Fechar
                </button>
              </div>

              <dl className="grid gap-2 text-sm">
                <div className="flex justify-between gap-4">
                  <dt className="text-[var(--fc-text-muted)]">Data</dt>
                  <dd>{selected.createdAt}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-[var(--fc-text-muted)]">Colaborador</dt>
                  <dd>{selected.userEmail}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-[var(--fc-text-muted)]">Empresa</dt>
                  <dd>{selected.companyName}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-[var(--fc-text-muted)]">Categoria</dt>
                  <dd>{selected.categoryName}</dd>
                </div>
                {selected.fuelEntryMode ? (
                  <div className="flex justify-between gap-4">
                    <dt className="text-[var(--fc-text-muted)]">Tipo combustível</dt>
                    <dd>{fuelEntryModeLabel(selected.fuelEntryMode)}</dd>
                  </div>
                ) : null}
                <div className="flex justify-between gap-4">
                  <dt className="text-[var(--fc-text-muted)]">Valor</dt>
                  <dd className="fc-amount">{formatBRL(Number(selected.amount))}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-[var(--fc-text-muted)]">Status atual</dt>
                  <dd>{statusLabel(selected.status)}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-[var(--fc-text-muted)]">Descrição</dt>
                  <dd className="max-w-[70%] text-right">{selected.description?.trim() ? selected.description : "-"}</dd>
                </div>
              </dl>

              <div className="space-y-2 text-sm">
                <p className="text-[var(--fc-text-muted)]">Comprovantes</p>
                {classifiedAttachments.length === 0 && <p>-</p>}
                {classifiedAttachments.length > 0 && (
                  <div className="space-y-3">
                    {classifiedAttachments.map((attachment, index) => (
                      <div key={`${attachment.url}-${index}`}>
                        {attachment.type === "image" && (
                          <a href={attachment.url} target="_blank" rel="noreferrer" className="inline-block">
                            <img
                              src={attachment.url}
                              alt={`Comprovante ${index + 1}`}
                              className="max-h-72 w-auto max-w-full rounded-lg border border-[var(--fc-glass-border)] object-contain"
                            />
                          </a>
                        )}
                        {attachment.type === "pdf" && (
                          <a href={attachment.url} target="_blank" rel="noreferrer" className="fc-link inline-flex items-center gap-2">
                            <span className="rounded border border-[var(--fc-glass-border-bright)] px-1.5 py-0.5 text-xs font-semibold">
                              PDF
                            </span>
                            Abrir comprovante PDF {index + 1}
                          </a>
                        )}
                        {attachment.type === "other" && (
                          <a href={attachment.url} target="_blank" rel="noreferrer" className="fc-link">
                            Abrir comprovante {index + 1}
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="space-y-3 border-t border-[var(--fc-glass-border)] pt-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-[var(--fc-text-muted)]">
                  Ações de status
                </p>
                <div className="flex flex-wrap gap-2">
                  {Object.values(ExpenseStatus).map((nextStatus) => (
                    <form key={nextStatus} action={setExpenseStatusForm}>
                      <input type="hidden" name="expenseId" value={selected.id} />
                      <input type="hidden" name="nextStatus" value={nextStatus} />
                      <button type="submit" className={nextStatus === "REJECTED" ? "fc-btn-danger fc-btn-sm" : "fc-btn-secondary fc-btn-sm"}>
                        {statusLabel(nextStatus)}
                      </button>
                    </form>
                  ))}
                </div>
                {selected.status === "APPROVED" && creditPayInfo && (
                  <div className="space-y-2 border-t border-[var(--fc-glass-border)] pt-3">
                    <p className="text-xs text-[var(--fc-text-muted)]">
                      Saldo de crédito do autor:{" "}
                      <span className="font-medium text-fc-heading">
                        {formatBRL(creditPayInfo.balanceNum)}
                      </span>
                    </p>
                    {creditPayInfo.hasNoCredit && (
                      <p className="text-xs text-[var(--fc-text-muted)]">
                        Nao ha saldo de credito para este colaborador. Registre um credito em{" "}
                        <strong>Admin &gt; Créditos</strong> antes de pagar por crédito.
                      </p>
                    )}
                    {creditPayInfo.insufficient && (
                      <p className="text-xs text-[var(--fc-text-muted)]">
                        Saldo de crédito insuficiente para esta despesa (necessário{" "}
                        <span className="font-medium text-fc-heading">
                          {formatBRL(creditPayInfo.expenseNum)}
                        </span>
                        ).
                      </p>
                    )}
                    {creditPayInfo.canPay && (
                      <form action={payExpenseWithCredit}>
                        <input type="hidden" name="expenseId" value={selected.id} />
                        <button type="submit" className="fc-btn-pay">
                          Pagar com crédito
                        </button>
                      </form>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>,
          document.body
        )}
    </>
  );
}
