-- Live tracking freshness for customer map
ALTER TABLE "Booking" ADD COLUMN IF NOT EXISTS "providerLocationUpdatedAt" TIMESTAMP(3);
