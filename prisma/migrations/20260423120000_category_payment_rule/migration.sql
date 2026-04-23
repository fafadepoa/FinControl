-- Regra de pagamento informativa na categoria (combustível / equivalente).
ALTER TABLE "Category" ADD COLUMN "paymentRule" "FuelEntryMode" NOT NULL DEFAULT 'FREE';
ALTER TABLE "Category" ADD COLUMN "dailyRate" DECIMAL(65, 30);
ALTER TABLE "Category" ADD COLUMN "kmRate" DECIMAL(65, 30);
