"use client";

import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";

type ExpenseSummaryModalProps = {
  dateLabel: string;
  companyName: string;
  categoryName: string;
  amountLabel: string;
  statusLabel: string;
  description: string | null;
  attachmentUrls: string[];
};

function isImageUrl(url: string) {
  return /\.(png|jpe?g|webp|gif)(\?.*)?$/i.test(url);
}

function isPdfUrl(url: string) {
  return /\.pdf(\?.*)?$/i.test(url);
}

export function ExpenseSummaryModal({
  dateLabel,
  companyName,
  categoryName,
  amountLabel,
  statusLabel,
  description,
  attachmentUrls,
}: ExpenseSummaryModalProps) {
  const [open, setOpen] = useState(false);
  const canUseDOM = typeof window !== "undefined";

  useEffect(() => {
    if (!open) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open]);

  const classifiedAttachments = useMemo(
    () =>
      attachmentUrls.map((url) => ({
        url,
        type: isImageUrl(url) ? "image" : isPdfUrl(url) ? "pdf" : "other",
      })),
    [attachmentUrls]
  );

  return (
    <>
      <button
        type="button"
        className="fc-btn-secondary fc-btn-sm"
        onClick={() => setOpen(true)}
      >
        Ver resumo
      </button>

      {open && canUseDOM && createPortal(
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/35 px-4 py-8"
          role="presentation"
          onClick={() => setOpen(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Resumo da despesa"
            className="fc-glass-strong w-full max-w-xl space-y-4 rounded-2xl p-5 md:p-6"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3">
              <h3 className="text-lg font-semibold text-fc-heading">Resumo da despesa</h3>
              <button type="button" className="fc-btn-ghost text-sm" onClick={() => setOpen(false)}>
                Fechar
              </button>
            </div>

            <dl className="grid gap-2 text-sm">
              <div className="flex justify-between gap-4">
                <dt className="text-[var(--fc-text-muted)]">Data</dt>
                <dd>{dateLabel}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-[var(--fc-text-muted)]">Empresa</dt>
                <dd>{companyName}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-[var(--fc-text-muted)]">Categoria</dt>
                <dd>{categoryName}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-[var(--fc-text-muted)]">Valor</dt>
                <dd className="fc-amount">{amountLabel}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-[var(--fc-text-muted)]">Status</dt>
                <dd>{statusLabel}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-[var(--fc-text-muted)]">Descrição</dt>
                <dd className="max-w-[70%] text-right">{description?.trim() ? description : "—"}</dd>
              </div>
            </dl>

            <div className="space-y-2 text-sm">
              <p className="text-[var(--fc-text-muted)]">Comprovantes</p>
              {classifiedAttachments.length === 0 && <p>—</p>}
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
          </div>
        </div>
      , document.body)}
    </>
  );
}
