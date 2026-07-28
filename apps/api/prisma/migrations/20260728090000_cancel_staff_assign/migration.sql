-- AlterTable
ALTER TABLE "Booking" ADD COLUMN IF NOT EXISTS "cancelReason" TEXT;
ALTER TABLE "Booking" ADD COLUMN IF NOT EXISTS "assignedStaffUserId" TEXT;

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Booking_providerId_scheduledAt_idx" ON "Booking"("providerId", "scheduledAt");
CREATE INDEX IF NOT EXISTS "Booking_assignedStaffUserId_idx" ON "Booking"("assignedStaffUserId");

-- AddForeignKey
DO $$ BEGIN
  ALTER TABLE "Booking" ADD CONSTRAINT "Booking_assignedStaffUserId_fkey"
    FOREIGN KEY ("assignedStaffUserId") REFERENCES "User"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;
