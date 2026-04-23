"use client";

import { useState, useTransition } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { postCreditForm } from "@/lib/actions/credits";
import { maskMoneyInput } from "@/lib/money";

type CreditUserOption = {
  id: string;
  email: string;
};

export function AdminNewCreditModal({ users }: { users: CreditUserOption[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [amountStr, setAmountStr] = useState("R$ 0,00");
  const [pending, startTransition] = useTransition();
  const canUsePortal = typeof document !== "undefined";

  return (
    <>
      <button type="button" className="fc-btn-primary" onClick={() => setOpen(true)}>
        Adicionar crédito
      </button>

      {open && canUsePortal
        ? createPortal(
            <div
              className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 px-4 py-8"
              role="presentation"
              onClick={() => setOpen(false)}
            >
              <div
                role="dialog"
                aria-modal="true"
                aria-label="Adicionar crédito"
                className="fc-glass-strong w-full max-w-2xl rounded-2xl p-6 shadow-xl"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-start justify-between gap-3">
                  <h2 className="text-lg font-semibold text-fc-heading">Novo lançamento</h2>
                  <button type="button" className="fc-btn-ghost text-sm" onClick={() => setOpen(false)}>
                    Fechar
                  </button>
                </div>

                <form
                  className="mt-4 grid gap-3 sm:grid-cols-2"
                  onSubmit={(e) => {
                    e.preventDefault();
                    const form = e.currentTarget;
                    startTransition(async () => {
                      try {
                        await postCreditForm(new FormData(form));
                        form.reset();
                        setAmountStr("R$ 0,00");
                        setOpen(false);
                        router.refresh();
                      } catch (err) {
                        window.alert(err instanceof Error ? err.message : "Não foi possível registrar o crédito.");
                      }
                    });
                  }}
                >
                  <div className="sm:col-span-2">
                    <label className="fc-label text-xs">Colaborador *</label>
                    <select name="userId" required className="fc-input mt-1">
                      <option value="">Selecione…</option>
                      {users.map((u) => (
                        <option key={u.id} value={u.id}>
                          {u.email}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="fc-label text-xs">Valor (R$) *</label>
                    <input
                      name="amount"
                      required
                      className="fc-input mt-1"
                      placeholder="R$ 0,00"
                      value={amountStr}
                      onChange={(e) => setAmountStr(maskMoneyInput(e.target.value))}
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="fc-label text-xs">Observação</label>
                    <input name="note" className="fc-input mt-1" />
                  </div>
                  <div className="sm:col-span-2 flex justify-end gap-2 pt-2">
                    <button type="button" className="fc-btn-secondary" onClick={() => setOpen(false)} disabled={pending}>
                      Cancelar
                    </button>
                    <button type="submit" className="fc-btn-primary" disabled={pending}>
                      {pending ? "Registrando…" : "Registrar"}
                    </button>
                  </div>
                </form>
              </div>
            </div>,
            document.body,
          )
        : null}
    </>
  );
}
