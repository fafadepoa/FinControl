-- Tipo de lançamento para categoria de combustível.
CREATE TYPE "FuelEntryMode" AS ENUM ('FREE', 'DAILY', 'KM');

ALTER TABLE "Expense"
ADD COLUMN "fuelEntryMode" "FuelEntryMode";
