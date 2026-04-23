export function parseMoneyBR(input: string): number | null {
  const s = input.replace(/\s/g, "").replace("R$", "").trim();
  if (!s) return null;
  const normalized = s.includes(",")
    ? s.replace(/\./g, "").replace(",", ".")
    : s;
  const n = Number(normalized);
  if (!Number.isFinite(n) || n < 0) return null;
  return Math.round(n * 100) / 100;
}

export function formatBRL(value: number | string | { toString(): string }) {
  const n = typeof value === "number" ? value : Number(value);
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(Number.isFinite(n) ? n : 0);
}

function formatCentsToMask(cents: number) {
  const safeCents = Math.max(0, Math.floor(cents));
  const integerPart = Math.floor(safeCents / 100);
  const decimalPart = safeCents % 100;
  const integerFormatted = new Intl.NumberFormat("pt-BR", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(integerPart);
  return `R$ ${integerFormatted},${decimalPart.toString().padStart(2, "0")}`;
}

export function maskMoneyInput(raw: string) {
  const digits = raw.replace(/\D/g, "");
  return formatCentsToMask(Number(digits || "0"));
}

export function moneyInputFromValue(value: string | number | null | undefined) {
  if (value == null || value === "") return "R$ 0,00";
  if (typeof value === "number") return formatCentsToMask(Math.round(value * 100));
  const parsed = parseMoneyBR(value);
  if (parsed == null) return "R$ 0,00";
  return formatCentsToMask(Math.round(parsed * 100));
}

export function optionalMoneyFieldValue(maskedValue: string) {
  const parsed = parseMoneyBR(maskedValue);
  if (parsed == null || parsed <= 0) return "";
  return maskedValue;
}
