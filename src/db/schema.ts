/**
 * Handoff domain model.
 *
 * Five user-facing concepts: Organisation, Member, Customer, Contact, Request.
 * Everything is scoped by `organisationId`. Contact-facing queries are
 * additionally scoped by `customerId`. Cross-tenant isolation is the #1
 * invariant of this product — enforce it in the query layer, never trust the app.
 */
import { pgTable, text, timestamp, integer, jsonb, pgEnum, uniqueIndex, index } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { nanoid } from "nanoid";

const id = () => text("id").primaryKey().$defaultFn(() => nanoid());
const createdAt = () => timestamp("created_at", { withTimezone: true }).notNull().defaultNow();
const updatedAt = () => timestamp("updated_at", { withTimezone: true }).notNull().defaultNow();

/* ---------- enums ---------- */

export const orgStatus = pgEnum("org_status", ["trialing", "active", "past_due", "cancelled"]);
export const memberRole = pgEnum("member_role", ["owner", "member"]);
export const customerStatus = pgEnum("customer_status", ["active", "archived"]);
export const requestStatus = pgEnum("request_status", [
  "draft",
  "sent",
  "in_progress",
  "submitted",
  "completed",
  "cancelled",
]);
export const itemType = pgEnum("item_type", ["upload", "question", "approval"]);
export const itemStatus = pgEnum("item_status", ["pending", "completed", "changes_requested"]);

/* ---------- Organisation (the tenant) ---------- */

export const organisations = pgTable("organisations", {
  id: id(),
  name: text("name").notNull(),
  slug: text("slug").notNull(), // subdomain: {slug}.handoff.app
  status: orgStatus("status").notNull().default("trialing"),
  // branding applied to the customer-facing workspace + emails
  logoUrl: text("logo_url"),
  accentColor: text("accent_color").default("#4f46e5"),
  // Stripe subscription (billing the firm, not payments-through)
  stripeCustomerId: text("stripe_customer_id"),
  stripeSubscriptionId: text("stripe_subscription_id"),
  trialEndsAt: timestamp("trial_ends_at", { withTimezone: true }),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
}, (t) => [uniqueIndex("org_slug_idx").on(t.slug)]);

/* ---------- Member (internal / staff user) ---------- */

export const members = pgTable("members", {
  id: id(),
  organisationId: text("organisation_id").notNull().references(() => organisations.id, { onDelete: "cascade" }),
  // Staff authenticate via the gate SSO server; this links a Member to their
  // gate identity (the `sub` claim). Contacts do NOT use gate — see authTokens.
  gateUserId: text("gate_user_id").notNull(),
  email: text("email").notNull(),
  name: text("name"),
  role: memberRole("role").notNull().default("member"),
  lastLoginAt: timestamp("last_login_at", { withTimezone: true }),
  createdAt: createdAt(),
}, (t) => [
  uniqueIndex("member_org_email_idx").on(t.organisationId, t.email),
  uniqueIndex("member_gate_user_idx").on(t.gateUserId),
]);

/* ---------- Customer (the client) ---------- */

export const customers = pgTable("customers", {
  id: id(),
  organisationId: text("organisation_id").notNull().references(() => organisations.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  status: customerStatus("status").notNull().default("active"),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
}, (t) => [index("customer_org_idx").on(t.organisationId)]);

/* ---------- Contact (customer user — magic-link identity) ---------- */

export const contacts = pgTable("contacts", {
  id: id(),
  organisationId: text("organisation_id").notNull().references(() => organisations.id, { onDelete: "cascade" }),
  customerId: text("customer_id").notNull().references(() => customers.id, { onDelete: "cascade" }),
  email: text("email").notNull(),
  name: text("name"),
  lastLoginAt: timestamp("last_login_at", { withTimezone: true }),
  createdAt: createdAt(),
}, (t) => [uniqueIndex("contact_customer_email_idx").on(t.customerId, t.email)]);

/* ---------- Request Template (reusable skeleton) ---------- */

export const requestTemplates = pgTable("request_templates", {
  id: id(),
  organisationId: text("organisation_id").notNull().references(() => organisations.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  // ordered item definitions: [{ type, label, config }]
  items: jsonb("items").$type<TemplateItem[]>().notNull().default([]),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
}, (t) => [index("template_org_idx").on(t.organisationId)]);

export type TemplateItem = {
  type: "upload" | "question" | "approval";
  label: string;
  config?: Record<string, unknown>;
};

/* ---------- Request (the wedge) ---------- */

export const requests = pgTable("requests", {
  id: id(),
  organisationId: text("organisation_id").notNull().references(() => organisations.id, { onDelete: "cascade" }),
  customerId: text("customer_id").notNull().references(() => customers.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  status: requestStatus("status").notNull().default("draft"),
  createdByMemberId: text("created_by_member_id").references(() => members.id, { onDelete: "set null" }),
  sentAt: timestamp("sent_at", { withTimezone: true }),
  completedAt: timestamp("completed_at", { withTimezone: true }),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
}, (t) => [
  index("request_org_idx").on(t.organisationId),
  index("request_customer_idx").on(t.customerId),
  index("request_status_idx").on(t.status),
]);

/* ---------- Request Item ---------- */

export const requestItems = pgTable("request_items", {
  id: id(),
  organisationId: text("organisation_id").notNull().references(() => organisations.id, { onDelete: "cascade" }),
  requestId: text("request_id").notNull().references(() => requests.id, { onDelete: "cascade" }),
  type: itemType("type").notNull(),
  label: text("label").notNull(),
  position: integer("position").notNull().default(0),
  status: itemStatus("status").notNull().default("pending"),
  // upload -> nothing here (see files); question -> { answer }; approval -> { fileId, decision, note }
  response: jsonb("response").$type<Record<string, unknown>>(),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
}, (t) => [index("item_request_idx").on(t.requestId)]);

/* ---------- File ---------- */

export const files = pgTable("files", {
  id: id(),
  organisationId: text("organisation_id").notNull().references(() => organisations.id, { onDelete: "cascade" }),
  customerId: text("customer_id").notNull().references(() => customers.id, { onDelete: "cascade" }),
  // if attached to a request item (something the client uploaded); null = shared Files area
  requestItemId: text("request_item_id").references(() => requestItems.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  storageKey: text("storage_key").notNull(), // object-storage path, always tenant/customer scoped
  sizeBytes: integer("size_bytes"),
  contentType: text("content_type"),
  uploadedByContactId: text("uploaded_by_contact_id").references(() => contacts.id, { onDelete: "set null" }),
  uploadedByMemberId: text("uploaded_by_member_id").references(() => members.id, { onDelete: "set null" }),
  createdAt: createdAt(),
}, (t) => [index("file_customer_idx").on(t.customerId)]);

/* ---------- Contact magic-link tokens ---------- */

// Staff (Members) authenticate through gate SSO. Contacts (clients) do NOT:
// they get a frictionless, tenant-scoped magic link with no gate account.
// This table backs only the contact side.
export const authTokens = pgTable("auth_tokens", {
  id: id(),
  tokenHash: text("token_hash").notNull(), // store the hash, never the raw token
  contactId: text("contact_id").notNull().references(() => contacts.id, { onDelete: "cascade" }),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  consumedAt: timestamp("consumed_at", { withTimezone: true }),
  createdAt: createdAt(),
}, (t) => [uniqueIndex("token_hash_idx").on(t.tokenHash)]);

/* ---------- relations ---------- */

export const orgRelations = relations(organisations, ({ many }) => ({
  members: many(members),
  customers: many(customers),
  templates: many(requestTemplates),
}));

export const customerRelations = relations(customers, ({ one, many }) => ({
  organisation: one(organisations, { fields: [customers.organisationId], references: [organisations.id] }),
  contacts: many(contacts),
  requests: many(requests),
  files: many(files),
}));

export const requestRelations = relations(requests, ({ one, many }) => ({
  customer: one(customers, { fields: [requests.customerId], references: [customers.id] }),
  items: many(requestItems),
}));

export const requestItemRelations = relations(requestItems, ({ one, many }) => ({
  request: one(requests, { fields: [requestItems.requestId], references: [requests.id] }),
  files: many(files),
}));
