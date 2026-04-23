"use client";

import { useState } from "react";
import { CategoryKind } from "@prisma/client";
import { maskMoneyInput, moneyInputFromValue, optionalMoneyFieldValue } from "@/lib/money";

export function CategoryEditRulesSection({
  initialKind,
  initialPaymentRule,
  initialLimit,
  initialDailyRate,
  initialKmRate,
}: {
  initialKind: CategoryKind;
  initialPaymentRule: string;
  initialLimit: string;
  initialDailyRate: string;
  initialKmRate: string;
}) {
  const [kind, setKind] = useState<CategoryKind>(initialKind);
  const [paymentRule, setPaymentRule] = useState<string>(initialPaymentRule);
  const [limitAmount, setLimitAmount] = useState(moneyInputFromValue(initialLimit));
  const [dailyRate, setDailyRate] = useState(moneyInputFromValue(initialDailyRate));
  const [kmRate, setKmRate] = useState(moneyInputFromValue(initialKmRate));

  return (
    <>
      <div>
        <label className="fc-label text-xs">Tipo funcional</label>
        <select
          name="kind"
          className="fc-input mt-1"
          value={kind}
          onChange={(e) => setKind(e.target.value as CategoryKind)}
        >
          <option value="DEFAULT">Padrão</option>
          <option value="CUSTOM">Personalizada</option>
          <option value="FUEL">Combustível / regras especiais</option>
        </select>
      </div>

      {kind === CategoryKind.FUEL ? (
        <div className="sm:col-span-2 space-y-3 rounded-lg border border-[var(--fc-glass-border)] p-3">
          <p className="text-xs font-semibold text-fc-heading">Regras de pagamento (referência)</p>
          <div>
            <label className="fc-label text-xs">Modo</label>
            <select
              name="paymentRule"
              className="fc-input mt-1"
              value={paymentRule}
              onChange={(e) => setPaymentRule(e.target.value)}
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
                value={limitAmount}
                onChange={(e) => setLimitAmount(maskMoneyInput(e.target.value))}
                className="fc-input mt-1"
                placeholder="R$ 0,00"
              />
              <input type="hidden" name="limitAmount" value={optionalMoneyFieldValue(limitAmount)} />
            </div>
          ) : (
            <input type="hidden" name="limitAmount" value="" />
          )}
          {paymentRule === "DAILY" ? (
            <div>
              <label className="fc-label text-xs">Valor por diária (R$) *</label>
              <input
                name="dailyRate"
                value={dailyRate}
                onChange={(e) => setDailyRate(maskMoneyInput(e.target.value))}
                className="fc-input mt-1"
                placeholder="R$ 0,00"
              />
            </div>
          ) : (
            <input type="hidden" name="dailyRate" value="" />
          )}
          {paymentRule === "KM" ? (
            <div>
              <label className="fc-label text-xs">Valor por km (R$) *</label>
              <input
                name="kmRate"
                value={kmRate}
                onChange={(e) => setKmRate(maskMoneyInput(e.target.value))}
                className="fc-input mt-1"
                placeholder="R$ 0,00"
              />
            </div>
          ) : (
            <input type="hidden" name="kmRate" value="" />
          )}
        </div>
      ) : (
        <div className="sm:col-span-2">
          <input type="hidden" name="paymentRule" value="FREE" />
          <label className="fc-label text-xs">Limite sugerido (R$) — opcional</label>
          <input
            value={limitAmount}
            onChange={(e) => setLimitAmount(maskMoneyInput(e.target.value))}
            className="fc-input mt-1"
            placeholder="R$ 0,00"
          />
          <input type="hidden" name="limitAmount" value={optionalMoneyFieldValue(limitAmount)} />
          <input type="hidden" name="dailyRate" value="" />
          <input type="hidden" name="kmRate" value="" />
        </div>
      )}
    </>
  );
}
