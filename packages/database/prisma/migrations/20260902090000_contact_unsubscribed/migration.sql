-- AlterTable: add opt-out flag so contacts can unsubscribe from email.
ALTER TABLE "contacts" ADD COLUMN "unsubscribed" BOOLEAN NOT NULL DEFAULT false;
