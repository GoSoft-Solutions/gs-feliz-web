/**
 * Shared enums for the CORE module (Contacts, Campaigns).
 *
 * These mirror the Prisma schema enums in packages/database and are kept
 * here so apps (api, worker, portal, admin) can share the same types
 * without importing the Prisma client directly.
 *
 * Only CORE module enums are defined for now (Phase 1/2). Enums for future
 * modules (Content, Newsletter, Payments, Memberships, Courses, Sessions)
 * are added when those modules are actually implemented.
 */

export enum ContactStatus {
  LEAD = 'LEAD',
  ACTIVE = 'ACTIVE',
  CUSTOMER = 'CUSTOMER',
  INACTIVE = 'INACTIVE',
}

export enum CampaignStatus {
  DRAFT = 'DRAFT',
  ACTIVE = 'ACTIVE',
  PAUSED = 'PAUSED',
  ARCHIVED = 'ARCHIVED',
}

export enum ContentStatus {
  DRAFT = 'DRAFT',
  PUBLISHED = 'PUBLISHED',
  ARCHIVED = 'ARCHIVED',
}

/**
 * Known contact event types. This is intentionally a plain string union
 * (not a DB enum) because the CONTACT_EVENTS model is designed to grow
 * with new event types over time without requiring a migration for each
 * one (see docs/architecture.md).
 */
export type ContactEventType =
  | 'LEAD_CREATED'
  | 'CONTACT_UPDATED'
  | 'CONTENT_DELIVERED'
  | 'CONTENT_VIEWED'
  | 'EMAIL_SENT'
  | 'EMAIL_OPENED'
  | 'OFFER_VIEWED'
  | 'PURCHASE_COMPLETED'
  | 'MEMBERSHIP_ACTIVATED'
  | 'COURSE_ENROLLED'
  | 'SESSION_BOOKED';
