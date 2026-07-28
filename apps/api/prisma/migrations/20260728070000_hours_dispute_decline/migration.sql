-- AlterTable
ALTER TABLE "ProviderProfile" ADD COLUMN IF NOT EXISTS "hours" TEXT;

-- AlterTable
ALTER TABLE "Booking" ADD COLUMN IF NOT EXISTS "declineReason" TEXT;
ALTER TABLE "Booking" ADD COLUMN IF NOT EXISTS "disputeNote" TEXT;
