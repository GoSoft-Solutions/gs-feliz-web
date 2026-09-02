-- AlterTable: add welcome-email fields to campaigns
-- These carry the email that is sent automatically when a contact
-- subscribes through a campaign's capture page (danielcorral.com.mx/news/<slug>).
ALTER TABLE "campaigns"
  ADD COLUMN "email_subject" TEXT,
  ADD COLUMN "email_html" TEXT,
  ADD COLUMN "email_from_name" TEXT,
  ADD COLUMN "email_reply_to" TEXT;
