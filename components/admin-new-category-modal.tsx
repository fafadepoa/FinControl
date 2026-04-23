"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { createCategoryForm } from "@/lib/actions/categories";
import { maskMoneyInput, optionalMoneyFieldValue } from "@/lib/money";

export type AdminCategoryCompany = { id: string; name: string };
export type AdminCategoryUserRow = {
  id: string;
  email: string;
  displayName: string | null;
  active: boolean;
};
export type AdminCategoryCompanyUsers = {
  id: string;
  name: string;
  users: AdminCategoryUserRow[];
};

const TEMPLATES = ["Pedágio", "Alimentação", "Hospedagem", "Combustível", "Transporte"] as const;

export function AdminNewCategoryModal({
  companies,
  companiesWithUsers,
}: {
  companies: AdminCategoryCompany[];
  companiesWithUsers: AdminCategoryCompanyUsers[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);
  const [creationMode, setCreationMode] = useState<"template" | "custom">("template");
  const [companyId, setCompanyId] = useState(companies[0]?.id ?? "");
  const [templateName, setTemplateName] = useState<string>(TEMPLATES[0]);
  const [customName, setCustomName] = useState("");
  const [customIsFuel, setCustomIsFuel] = useState(false);
  const [paymentRule, setPaymentRule] = useState<"FREE" | "DAILY" | "KM">("FREE");
  const [limitAmount, setLimitAmount] = useState("R$ 0,00");
  const [dailyRate, setDailyRate] = useState("R$ 0,00");
  const [kmRate, setKmRate] = useState("R$ 0,00");
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const canUsePortal = typeof document !== "undefined";

  const isFuelFlow = useMemo(() => {
    if (creationMode === "custom") return customIsFuel;
    return normalize(templateName) === "combustivel";
  }, [creationMode, customIsFuel, templateName]);

  const usersForCompany = useMemo(() => {
    return companiesWithUsers.find((c) => c.id === companyId)?.users ?? [];
  }, [companiesWithUsers, companyId]);
  const targetCompanies = useMemo(
    () => companiesWithUsers.filter((company) => company.id !== companyId),
    [companiesWithUsers, companyId],
  );
  const allUserIds = useMemo(() => usersForCompany.map((u) => u.id), [usersForCompany]);
  const selectedInCompanyCount = useMemo(
    () => selectedUserIds.filter((id) => allUserIds.includes(id)).length,
    [allUserIds, selectedUserIds],
  );
  const allSelected = usersForCompany.length > 0 && selectedInCompanyCount === usersForCompany.length;

  useEffect(() => {
    setSelectedUserIds((prev) => prev.filter((id) => allUserIds.includes(id)));
  }, [allUserIds]);

  if (companies.length === 0) return null;

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className="fc-btn-primary">
        + Adicionar categoria
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
                aria-label="Nova categoria"
                className="fc-glass-strong max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl p-6 shadow-xl"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-start justify-between gap-3">
                  <h2 className="text-lg font-semibold text-fc-heading">Adicionar categoria</h2>
                  <button type="button" className="fc-btn-ghost text-sm" onClick={() => setOpen(false)}>
                    Fechar
                  </button>
                </div>

                <form
                  className="mt-4 space-y-4"
                  onSubmit={(e) => {
                    e.preventDefault();
                    const form = e.currentTarget;
                    startTransition(async () => {
                      try {
                        await createCategoryForm(new FormData(form));
                        setLimitAmount("R$ 0,00");
                        setDailyRate("R$ 0,00");
                        setKmRate("R$ 0,00");
                        setSelectedUserIds([]);
                        setOpen(false);
                        router.refresh();
                      } catch (err) {
                        window.alert(err instanceof Error ? err.message : "Não foi possível salvar.");
                      }
                    });
                  }}
                >
                  <input type="hidden" name="mode" value={creationMode} />

                  <div>
                    <label className="fc-label text-xs">Empresa *</label>
                    <select
                      name="companyId"
                      required
                      className="fc-input mt-1"
                      value={companyId}
                      onChange={(e) => setCompanyId(e.target.value)}
                    >
                      {companies.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      className={creationMode === "template" ? "fc-btn-primary fc-btn-sm" : "fc-btn-secondary fc-btn-sm"}
                      onClick={() => setCreationMode("template")}
                    >
                      Categoria padrão
                    </button>
                    <button
                      type="button"
                      className={creationMode === "custom" ? "fc-btn-primary fc-btn-sm" : "fc-btn-secondary fc-btn-sm"}
                      onClick={() => setCreationMode("custom")}
                    >
                      Novo tipo de categoria
                    </button>
                  </div>

                  {creationMode === "template" ? (
                    <div>
                      <label className="fc-label text-xs">Selecione a categoria padrão</label>
                      <select
                        name="templateName"
                        className="fc-input mt-1"
                        value={templateName}
                        onChange={(e) => setTemplateName(e.target.value)}
                      >
                        {TEMPLATES.map((t) => (
                          <option key={t} value={t}>
                            {t}
                          </option>
                        ))}
                      </select>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div>
                        <label className="fc-label text-xs">Nome da categoria *</label>
                        <input
                          name="customName"
                          value={customName}
                          onChange={(e) => setCustomName(e.target.value)}
                          className="fc-input mt-1"
                          placeholder="Ex.: Combustível — Gerente"
                          minLength={2}
                          required={creationMode === "custom"}
                        />
                      </div>
                      <label className="fc-label inline-flex items-center gap-2 text-xs">
                        <input
                          type="checkbox"
                          name="customIsFuel"
                          checked={customIsFuel}
                          onChange={(e) => setCustomIsFuel(e.target.checked)}
                          className="fc-checkbox"
                        />
                        Aplicar regras de pagamento como combustível (diária / km / livre)
                      </label>
                    </div>
                  )}

                  {isFuelFlow ? (
                    <div className="space-y-3 rounded-lg border border-[var(--fc-glass-border)] p-3">
                      <p className="text-xs font-semibold text-fc-heading">Regras de pagamento (referência)</p>
                      <p className="text-xs text-[var(--fc-text-muted)]">
                        O valor da despesa continua sendo informado manualmente; estes campos orientam o colaborador e o
                        administrador.
                      </p>
                      <div>
                        <label className="fc-label text-xs">Modo</label>
                        <select
                          name="paymentRule"
                          className="fc-input mt-1"
                          value={paymentRule}
                          onChange={(e) => setPaymentRule(e.target.value as "FREE" | "DAILY" | "KM")}
                        >
                          <option value="FREE">Livre (limite opcional)</option>
                          <option value="DAILY">Por diária</option>
                          <option value="KM">Por km</option>
                        </select>
                      </div>
                      {paymentRule === "FREE" ? (
                        <div>
                          <label className="fc-label text-xs">Limite sugerido (R$) — opcional</label>
                          <input
                            className="fc-input mt-1"
                            placeholder="R$ 0,00"
                            value={limitAmount}
                            onChange={(e) => setLimitAmount(maskMoneyInput(e.target.value))}
                          />
                          <input type="hidden" name="limitAmount" value={optionalMoneyFieldValue(limitAmount)} />
                        </div>
                      ) : null}
                      {paymentRule === "DAILY" ? (
                        <div>
                          <label className="fc-label text-xs">Valor pago por diária (R$) *</label>
                          <input
                            name="dailyRate"
                            required
                            className="fc-input mt-1"
                            placeholder="R$ 0,00"
                            value={dailyRate}
                            onChange={(e) => setDailyRate(maskMoneyInput(e.target.value))}
                          />
                        </div>
                      ) : null}
                      {paymentRule === "KM" ? (
                        <div>
                          <label className="fc-label text-xs">Valor pago por km (R$) *</label>
                          <input
                            name="kmRate"
                            required
                            className="fc-input mt-1"
                            placeholder="R$ 0,00"
                            value={kmRate}
                            onChange={(e) => setKmRate(maskMoneyInput(e.target.value))}
                          />
                        </div>
                      ) : null}
                    </div>
                  ) : (
                    <div>
                      <label className="fc-label text-xs">Limite sugerido (R$) — opcional</label>
                      <input
                        className="fc-input mt-1"
                        placeholder="R$ 0,00"
                        value={limitAmount}
                        onChange={(e) => setLimitAmount(maskMoneyInput(e.target.value))}
                      />
                      <input type="hidden" name="limitAmount" value={optionalMoneyFieldValue(limitAmount)} />
                      <input type="hidden" name="paymentRule" value="FREE" />
                    </div>
                  )}

                  <div>
                    <label className="fc-label text-xs">Colaboradores com acesso</label>
                    <p className="mt-1 text-xs text-[var(--fc-text-muted)]">
                      Deixe todos desmarcados para liberar a categoria a todos os colaboradores da empresa selecionada.
                    </p>
                    {usersForCompany.length > 0 ? (
                      <div className="mt-2 flex flex-wrap gap-2">
                        <button
                          type="button"
                          className="fc-btn-secondary fc-btn-sm"
                          onClick={() => setSelectedUserIds(allSelected ? [] : allUserIds)}
                        >
                          {allSelected ? "Limpar seleção" : "Selecionar todos"}
                        </button>
                      </div>
                    ) : null}
                    <div className="mt-2 max-h-40 space-y-2 overflow-auto rounded border border-[var(--fc-glass-border)] p-3">
                      {usersForCompany.length === 0 ? (
                        <p className="text-xs text-[var(--fc-text-muted)]">Nenhum colaborador nesta empresa.</p>
                      ) : (
                        usersForCompany.map((u) => (
                          <label key={u.id} className="flex items-center gap-2 text-sm">
                            <input
                              type="checkbox"
                              name="userIds"
                              value={u.id}
                              className="fc-checkbox"
                              checked={selectedUserIds.includes(u.id)}
                              onChange={(e) =>
                                setSelectedUserIds((prev) =>
                                  e.target.checked ? [...prev, u.id] : prev.filter((id) => id !== u.id),
                                )
                              }
                            />
                            <span>{u.displayName?.trim() || u.email}</span>
                          </label>
                        ))
                      )}
                    </div>
                  </div>

                  <div className="space-y-2 rounded-lg border border-[var(--fc-glass-border)] p-3">
                    <label className="fc-label text-xs">Aplicar também em outras empresas (opcional)</label>
                    <p className="text-xs text-[var(--fc-text-muted)]">
                      Para cada empresa selecionada, você pode escolher colaboradores específicos. Se ninguém for
                      marcado, a categoria ficará liberada para todos daquela empresa.
                    </p>
                    {targetCompanies.length === 0 ? (
                      <p className="text-xs text-[var(--fc-text-muted)]">Não há outras empresas disponíveis.</p>
                    ) : (
                      <div className="space-y-3">
                        {targetCompanies.map((company) => (
                          <div key={company.id} className="rounded-md border border-[var(--fc-glass-border)] p-2">
                            <label className="inline-flex items-center gap-2 text-sm font-medium text-fc-heading">
                              <input type="checkbox" name="targetCompanyIds" value={company.id} className="fc-checkbox" />
                              <span>{company.name}</span>
                            </label>
                            <div className="mt-2 max-h-28 space-y-2 overflow-auto pl-6 text-sm">
                              {company.users.length === 0 ? (
                                <p className="text-xs text-[var(--fc-text-muted)]">Sem colaboradores nesta empresa.</p>
                              ) : (
                                company.users.map((u) => (
                                  <label key={u.id} className="flex items-center gap-2">
                                    <input
                                      type="checkbox"
                                      name={`targetUserIds__${company.id}`}
                                      value={u.id}
                                      className="fc-checkbox"
                                    />
                                    <span>{u.displayName?.trim() || u.email}</span>
                                  </label>
                                ))
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="flex flex-wrap justify-end gap-2 pt-2">
                    <button type="button" className="fc-btn-secondary" onClick={() => setOpen(false)}>
                      Cancelar
                    </button>
                    <button type="submit" className="fc-btn-primary" disabled={pending}>
                      {pending ? "Salvando…" : "Salvar categoria"}
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

function normalize(value: string) {
  return value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .trim()
    .toLowerCase();
}
