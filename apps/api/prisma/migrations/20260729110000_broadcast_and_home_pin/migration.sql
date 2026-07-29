-- Open broadcast bookings + customer home pin
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "homeLat" DOUBLE PRECISION;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "homeLng" DOUBLE PRECISION;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "homeAddress" TEXT;

ALTER TABLE "Booking" ALTER COLUMN "providerId" DROP NOT NULL;
ALTER TABLE "Booking" ALTER COLUMN "serviceId" DROP NOT NULL;
ALTER TABLE "Booking" ADD COLUMN IF NOT EXISTS "broadcastCategory" "ServiceCategory";
ALTER TABLE "Booking" ADD COLUMN IF NOT EXISTS "broadcastMode" "ServiceMode";
ALTER TABLE "Booking" ADD COLUMN IF NOT EXISTS "broadcastRadiusKm" DOUBLE PRECISION;
ALTER TABLE "Booking" ADD COLUMN IF NOT EXISTS "claimedAt" TIMESTAMP(3);

CREATE INDEX IF NOT EXISTS "Booking_status_broadcastCategory_idx" ON "Booking"("status", "broadcastCategory");
