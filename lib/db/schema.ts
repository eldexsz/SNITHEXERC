import { bigint, pgTable, text, timestamp } from 'drizzle-orm/pg-core'

export const licenseKeys = pgTable('license_keys', {
  id: bigint('id', { mode: 'number' }).primaryKey().generatedByDefaultAsIdentity(),
  key: text('key').notNull().unique(),
  status: text('status').notNull().default('active'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
})

export type LicenseKeyRow = typeof licenseKeys.$inferSelect
