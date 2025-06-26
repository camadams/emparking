import {
  pgTable,
  text,
  timestamp,
  boolean,
  integer,
  serial,
  uuid,
} from "drizzle-orm/pg-core";

export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified")
    .$defaultFn(() => false)
    .notNull(),
  image: text("image"),
  createdAt: timestamp("created_at")
    .$defaultFn(() => /* @__PURE__ */ new Date())
    .notNull(),
  updatedAt: timestamp("updated_at")
    .$defaultFn(() => /* @__PURE__ */ new Date())
    .notNull(),
});

export const session = pgTable("session", {
  id: text("id").primaryKey(),
  expiresAt: timestamp("expires_at").notNull(),
  token: text("token").notNull().unique(),
  createdAt: timestamp("created_at").notNull(),
  updatedAt: timestamp("updated_at").notNull(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
});

export const account = pgTable("account", {
  id: text("id").primaryKey(),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  idToken: text("id_token"),
  accessTokenExpiresAt: timestamp("access_token_expires_at"),
  refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
  scope: text("scope"),
  password: text("password"),
  createdAt: timestamp("created_at").notNull(),
  updatedAt: timestamp("updated_at").notNull(),
});

export const verification = pgTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").$defaultFn(
    () => /* @__PURE__ */ new Date()
  ),
  updatedAt: timestamp("updated_at").$defaultFn(
    () => /* @__PURE__ */ new Date()
  ),
});

export const dummyTable = pgTable("dummy", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export type Dummy = typeof dummyTable.$inferSelect;
export type NewDummy = typeof dummyTable.$inferInsert;

// Bay table - represents a parking bay owned by a resident
export const bayTable = pgTable("bay", {
  id: serial("id").primaryKey(),
  label: text("label").notNull(), // e.g., "A23"
  note: text("note"), // Optional note for the bay
  isVisible: boolean("is_visible").notNull().default(true),
  ownerId: text("owner_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Availability table - represents when a bay is available for use
export const availabilityTable = pgTable("availability", {
  id: serial("id").primaryKey(),
  bayId: integer("bay_id")
    .notNull()
    .references(() => bayTable.id, { onDelete: "cascade" }),
  isAvailable: boolean("is_available").notNull().default(false),
  availableFrom: timestamp("available_from"),
  availableUntil: timestamp("available_until"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Claim table - represents when someone claims a bay for use
export const claimTable = pgTable("claim", {
  id: serial("id").primaryKey(),
  availabilityId: integer("availability_id")
    .notNull()
    .references(() => availabilityTable.id, { onDelete: "cascade" }),
  claimerId: text("claimer_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  claimedAt: timestamp("claimed_at").notNull().defaultNow(),
  expectedDuration: integer("expected_duration"), // in minutes
  releasedAt: timestamp("released_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Type definitions for our models
export type Bay = typeof bayTable.$inferSelect;
export type NewBay = typeof bayTable.$inferInsert;

export type Availability = typeof availabilityTable.$inferSelect;
export type NewAvailability = typeof availabilityTable.$inferInsert;

export type Claim = typeof claimTable.$inferSelect;
export type NewClaim = typeof claimTable.$inferInsert;
