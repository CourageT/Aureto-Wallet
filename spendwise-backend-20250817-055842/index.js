var __defProp = Object.defineProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// server/index.ts
import dotenv2 from "dotenv";
import express2 from "express";

// server/routes.ts
import { createServer } from "http";

// shared/schema.ts
var schema_exports = {};
__export(schema_exports, {
  alerts: () => alerts,
  alertsRelations: () => alertsRelations,
  budgetItems: () => budgetItems,
  budgetItemsRelations: () => budgetItemsRelations,
  budgets: () => budgets,
  budgetsRelations: () => budgetsRelations,
  categories: () => categories,
  categoriesRelations: () => categoriesRelations,
  goals: () => goals,
  goalsRelations: () => goalsRelations,
  insertAlertSchema: () => insertAlertSchema,
  insertBudgetItemSchema: () => insertBudgetItemSchema,
  insertBudgetSchema: () => insertBudgetSchema,
  insertCategorySchema: () => insertCategorySchema,
  insertGoalSchema: () => insertGoalSchema,
  insertNotificationSchema: () => insertNotificationSchema,
  insertReportSchema: () => insertReportSchema,
  insertTransactionSchema: () => insertTransactionSchema,
  insertUserPreferencesSchema: () => insertUserPreferencesSchema,
  insertUserSchema: () => insertUserSchema,
  insertWalletInvitationSchema: () => insertWalletInvitationSchema,
  insertWalletMemberSchema: () => insertWalletMemberSchema,
  insertWalletSchema: () => insertWalletSchema,
  notifications: () => notifications,
  notificationsRelations: () => notificationsRelations,
  reports: () => reports,
  reportsRelations: () => reportsRelations,
  sessions: () => sessions,
  transactions: () => transactions,
  transactionsRelations: () => transactionsRelations,
  userPreferences: () => userPreferences,
  userPreferencesRelations: () => userPreferencesRelations,
  users: () => users,
  usersRelations: () => usersRelations,
  walletInvitations: () => walletInvitations,
  walletInvitationsRelations: () => walletInvitationsRelations,
  walletMembers: () => walletMembers,
  walletMembersRelations: () => walletMembersRelations,
  wallets: () => wallets,
  walletsRelations: () => walletsRelations
});
import { sql } from "drizzle-orm";
import {
  index,
  jsonb,
  pgTable,
  timestamp,
  varchar,
  text,
  decimal,
  boolean
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
var sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull()
  },
  (table) => [index("IDX_session_expire").on(table.expire)]
);
var users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique().notNull(),
  username: varchar("username").unique(),
  password: varchar("password"),
  // For basic auth (hashed)
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  authProvider: varchar("auth_provider").notNull().default("basic"),
  // 'basic', 'google'
  googleId: varchar("google_id").unique(),
  // For Google OAuth
  emailVerified: boolean("email_verified").default(false),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});
var wallets = pgTable("wallets", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  type: varchar("type", { length: 50 }).notNull(),
  // 'personal', 'shared', 'savings_goal'
  currency: varchar("currency", { length: 3 }).notNull().default("USD"),
  balance: decimal("balance", { precision: 12, scale: 2 }).notNull().default("0.00"),
  goalAmount: decimal("goal_amount", { precision: 12, scale: 2 }),
  goalDate: timestamp("goal_date"),
  isArchived: boolean("is_archived").notNull().default(false),
  createdBy: varchar("created_by").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});
var walletMembers = pgTable("wallet_members", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  walletId: varchar("wallet_id").notNull(),
  userId: varchar("user_id").notNull(),
  role: varchar("role", { length: 50 }).notNull(),
  // 'owner', 'manager', 'contributor', 'viewer'
  permissions: jsonb("permissions"),
  // Additional granular permissions
  joinedAt: timestamp("joined_at").defaultNow(),
  invitedBy: varchar("invited_by")
});
var categories = pgTable("categories", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  type: varchar("type", { length: 20 }).notNull().default("expense"),
  // 'income', 'expense'
  icon: varchar("icon", { length: 100 }),
  color: varchar("color", { length: 7 }),
  isDefault: boolean("is_default").notNull().default(false),
  parentId: varchar("parent_id"),
  // For subcategories
  createdBy: varchar("created_by"),
  createdAt: timestamp("created_at").defaultNow()
});
var transactions = pgTable("transactions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  walletId: varchar("wallet_id").notNull(),
  categoryId: varchar("category_id").notNull(),
  type: varchar("type", { length: 20 }).notNull(),
  // 'income', 'expense'
  amount: decimal("amount", { precision: 12, scale: 2 }).notNull(),
  description: text("description"),
  date: timestamp("date").notNull(),
  receipt: varchar("receipt"),
  // URL to receipt image
  tags: jsonb("tags"),
  // Array of tag strings
  createdBy: varchar("created_by").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});
var budgets = pgTable("budgets", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  walletId: varchar("wallet_id").notNull(),
  categoryId: varchar("category_id").notNull(),
  name: varchar("name", { length: 255 }).notNull().default("Budget"),
  description: text("description"),
  amount: decimal("amount", { precision: 12, scale: 2 }).notNull(),
  period: varchar("period", { length: 20 }).notNull(),
  // 'daily', 'weekly', 'monthly', 'quarterly', 'yearly', 'custom'
  budgetType: varchar("budget_type", { length: 20 }).notNull().default("category"),
  // 'category', 'detailed', 'mixed'
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date"),
  isActive: boolean("is_active").notNull().default(true),
  createdBy: varchar("created_by").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});
var budgetItems = pgTable("budget_items", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  budgetId: varchar("budget_id").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  unit: varchar("unit", { length: 50 }),
  // 'kg', 'liters', 'pieces', etc.
  plannedQuantity: decimal("planned_quantity", { precision: 10, scale: 3 }),
  plannedUnitPrice: decimal("planned_unit_price", { precision: 12, scale: 2 }),
  plannedAmount: decimal("planned_amount", { precision: 12, scale: 2 }).notNull(),
  actualQuantity: decimal("actual_quantity", { precision: 10, scale: 3 }).default("0"),
  actualUnitPrice: decimal("actual_unit_price", { precision: 12, scale: 2 }).default("0"),
  actualAmount: decimal("actual_amount", { precision: 12, scale: 2 }).default("0"),
  isPurchased: boolean("is_purchased").notNull().default(false),
  purchaseDate: timestamp("purchase_date"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});
var walletInvitations = pgTable("wallet_invitations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  walletId: varchar("wallet_id").notNull(),
  email: varchar("email").notNull(),
  role: varchar("role", { length: 50 }).notNull(),
  invitedBy: varchar("invited_by").notNull(),
  status: varchar("status", { length: 20 }).notNull().default("pending"),
  // 'pending', 'accepted', 'declined', 'expired'
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow()
});
var goals = pgTable("goals", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  walletId: varchar("wallet_id"),
  // Optional: can be linked to specific wallet
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  targetAmount: decimal("target_amount", { precision: 12, scale: 2 }).notNull(),
  currentAmount: decimal("current_amount", { precision: 12, scale: 2 }).notNull().default("0.00"),
  targetDate: timestamp("target_date"),
  category: varchar("category", { length: 100 }),
  // 'emergency_fund', 'vacation', 'house', etc.
  priority: varchar("priority", { length: 20 }).default("medium"),
  // 'high', 'medium', 'low'
  isActive: boolean("is_active").notNull().default(true),
  achievedAt: timestamp("achieved_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});
var notifications = pgTable("notifications", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  type: varchar("type", { length: 50 }).notNull(),
  // 'budget_alert', 'goal_milestone', 'transaction_anomaly', etc.
  title: varchar("title", { length: 255 }).notNull(),
  message: text("message").notNull(),
  data: jsonb("data"),
  // Additional structured data
  isRead: boolean("is_read").notNull().default(false),
  priority: varchar("priority", { length: 20 }).default("normal"),
  // 'high', 'normal', 'low'
  actionUrl: varchar("action_url"),
  createdAt: timestamp("created_at").defaultNow()
});
var alerts = pgTable("alerts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  walletId: varchar("wallet_id"),
  name: varchar("name", { length: 255 }).notNull(),
  type: varchar("type", { length: 50 }).notNull(),
  // 'spending_limit', 'budget_threshold', 'unusual_activity', etc.
  conditions: jsonb("conditions").notNull(),
  // Rule conditions as JSON
  actions: jsonb("actions").notNull(),
  // Actions to take as JSON
  isActive: boolean("is_active").notNull().default(true),
  lastTriggered: timestamp("last_triggered"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});
var reports = pgTable("reports", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  type: varchar("type", { length: 50 }).notNull(),
  // 'spending', 'income', 'budget', 'custom'
  config: jsonb("config").notNull(),
  // Report configuration as JSON
  schedule: jsonb("schedule"),
  // For scheduled reports
  lastGenerated: timestamp("last_generated"),
  isPublic: boolean("is_public").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});
var userPreferences = pgTable("user_preferences", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().unique(),
  currency: varchar("currency", { length: 3 }).default("USD"),
  timezone: varchar("timezone", { length: 50 }).default("UTC"),
  dateFormat: varchar("date_format", { length: 20 }).default("YYYY-MM-DD"),
  language: varchar("language", { length: 10 }).default("en"),
  theme: varchar("theme", { length: 20 }).default("light"),
  // 'light', 'dark', 'auto'
  aiPreferences: jsonb("ai_preferences"),
  // AI/ML settings
  notificationPreferences: jsonb("notification_preferences"),
  privacySettings: jsonb("privacy_settings"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});
var usersRelations = relations(users, ({ one, many }) => ({
  walletMembers: many(walletMembers),
  transactions: many(transactions),
  budgets: many(budgets),
  categories: many(categories),
  invitations: many(walletInvitations),
  goals: many(goals),
  notifications: many(notifications),
  alerts: many(alerts),
  reports: many(reports),
  preferences: one(userPreferences)
}));
var walletsRelations = relations(wallets, ({ one, many }) => ({
  creator: one(users, {
    fields: [wallets.createdBy],
    references: [users.id]
  }),
  members: many(walletMembers),
  transactions: many(transactions),
  budgets: many(budgets),
  invitations: many(walletInvitations)
}));
var walletMembersRelations = relations(walletMembers, ({ one }) => ({
  wallet: one(wallets, {
    fields: [walletMembers.walletId],
    references: [wallets.id]
  }),
  user: one(users, {
    fields: [walletMembers.userId],
    references: [users.id]
  }),
  invitedByUser: one(users, {
    fields: [walletMembers.invitedBy],
    references: [users.id]
  })
}));
var categoriesRelations = relations(categories, ({ one, many }) => ({
  parent: one(categories, {
    fields: [categories.parentId],
    references: [categories.id]
  }),
  children: many(categories),
  creator: one(users, {
    fields: [categories.createdBy],
    references: [users.id]
  }),
  transactions: many(transactions),
  budgets: many(budgets)
}));
var transactionsRelations = relations(transactions, ({ one }) => ({
  wallet: one(wallets, {
    fields: [transactions.walletId],
    references: [wallets.id]
  }),
  category: one(categories, {
    fields: [transactions.categoryId],
    references: [categories.id]
  }),
  creator: one(users, {
    fields: [transactions.createdBy],
    references: [users.id]
  })
}));
var budgetsRelations = relations(budgets, ({ one, many }) => ({
  wallet: one(wallets, {
    fields: [budgets.walletId],
    references: [wallets.id]
  }),
  category: one(categories, {
    fields: [budgets.categoryId],
    references: [categories.id]
  }),
  creator: one(users, {
    fields: [budgets.createdBy],
    references: [users.id]
  }),
  items: many(budgetItems)
}));
var budgetItemsRelations = relations(budgetItems, ({ one }) => ({
  budget: one(budgets, {
    fields: [budgetItems.budgetId],
    references: [budgets.id]
  })
}));
var walletInvitationsRelations = relations(walletInvitations, ({ one }) => ({
  wallet: one(wallets, {
    fields: [walletInvitations.walletId],
    references: [wallets.id]
  }),
  invitedByUser: one(users, {
    fields: [walletInvitations.invitedBy],
    references: [users.id]
  })
}));
var goalsRelations = relations(goals, ({ one }) => ({
  user: one(users, {
    fields: [goals.userId],
    references: [users.id]
  }),
  wallet: one(wallets, {
    fields: [goals.walletId],
    references: [wallets.id]
  })
}));
var notificationsRelations = relations(notifications, ({ one }) => ({
  user: one(users, {
    fields: [notifications.userId],
    references: [users.id]
  })
}));
var alertsRelations = relations(alerts, ({ one }) => ({
  user: one(users, {
    fields: [alerts.userId],
    references: [users.id]
  }),
  wallet: one(wallets, {
    fields: [alerts.walletId],
    references: [wallets.id]
  })
}));
var reportsRelations = relations(reports, ({ one }) => ({
  user: one(users, {
    fields: [reports.userId],
    references: [users.id]
  })
}));
var userPreferencesRelations = relations(userPreferences, ({ one }) => ({
  user: one(users, {
    fields: [userPreferences.userId],
    references: [users.id]
  })
}));
var insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});
var insertWalletSchema = createInsertSchema(wallets).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});
var insertWalletMemberSchema = createInsertSchema(walletMembers).omit({
  id: true,
  joinedAt: true
});
var insertCategorySchema = createInsertSchema(categories).omit({
  id: true,
  createdAt: true
});
var insertTransactionSchema = createInsertSchema(transactions).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});
var insertBudgetSchema = createInsertSchema(budgets).omit({
  id: true,
  createdAt: true,
  updatedAt: true
}).extend({
  amount: z.union([z.string(), z.number()]).transform((val) => String(val))
});
var insertBudgetItemSchema = createInsertSchema(budgetItems).omit({
  id: true,
  createdAt: true,
  updatedAt: true
}).extend({
  plannedQuantity: z.union([z.string(), z.number()]).transform((val) => String(val)).optional(),
  plannedUnitPrice: z.union([z.string(), z.number()]).transform((val) => String(val)).optional(),
  plannedAmount: z.union([z.string(), z.number()]).transform((val) => String(val)),
  actualQuantity: z.union([z.string(), z.number()]).transform((val) => String(val)).optional(),
  actualUnitPrice: z.union([z.string(), z.number()]).transform((val) => String(val)).optional(),
  actualAmount: z.union([z.string(), z.number()]).transform((val) => String(val)).optional()
});
var insertWalletInvitationSchema = createInsertSchema(walletInvitations).omit({
  id: true,
  createdAt: true
});
var insertGoalSchema = createInsertSchema(goals).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});
var insertNotificationSchema = createInsertSchema(notifications).omit({
  id: true,
  createdAt: true
});
var insertAlertSchema = createInsertSchema(alerts).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});
var insertReportSchema = createInsertSchema(reports).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});
var insertUserPreferencesSchema = createInsertSchema(userPreferences).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

// server/db.ts
import dotenv from "dotenv";
import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
dotenv.config();
if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?"
  );
}
var pool = new Pool({ connectionString: process.env.DATABASE_URL });
var db = drizzle(pool, { schema: schema_exports });

// server/storage.ts
import { eq, and, desc, sql as sql2, gte, lte, inArray, isNotNull } from "drizzle-orm";
import session from "express-session";
import createMemoryStore from "memorystore";
var DatabaseStorage = class {
  sessionStore;
  constructor() {
    const MemoryStore = createMemoryStore(session);
    this.sessionStore = new MemoryStore({
      checkPeriod: 864e5
      // prune expired entries every 24h
    });
  }
  // User operations
  async getUser(id) {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }
  async upsertUser(userData) {
    const [user] = await db.insert(users).values(userData).onConflictDoUpdate({
      target: users.id,
      set: {
        ...userData,
        updatedAt: /* @__PURE__ */ new Date()
      }
    }).returning();
    return user;
  }
  async updateUser(id, updates) {
    const [user] = await db.update(users).set({ ...updates, updatedAt: /* @__PURE__ */ new Date() }).where(eq(users.id, id)).returning();
    return user;
  }
  async getUserByEmail(email) {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }
  async getUserByUsername(username) {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }
  async createUser(userData) {
    const [user] = await db.insert(users).values(userData).returning();
    return user;
  }
  async getUserPreferences(userId) {
    const [preferences] = await db.select().from(userPreferences).where(eq(userPreferences.userId, userId));
    return preferences;
  }
  async upsertUserPreferences(userId, preferences) {
    const [upsertedPreferences] = await db.insert(userPreferences).values({ ...preferences, userId }).onConflictDoUpdate({
      target: userPreferences.userId,
      set: {
        ...preferences,
        updatedAt: /* @__PURE__ */ new Date()
      }
    }).returning();
    return upsertedPreferences;
  }
  // Wallet operations
  async createWallet(wallet) {
    const [newWallet] = await db.insert(wallets).values(wallet).returning();
    await db.insert(walletMembers).values({
      walletId: newWallet.id,
      userId: wallet.createdBy,
      role: "owner"
    });
    return newWallet;
  }
  async getWallet(id) {
    const [wallet] = await db.select().from(wallets).where(eq(wallets.id, id));
    return wallet;
  }
  async getWalletWithMembers(id) {
    const wallet = await this.getWallet(id);
    if (!wallet) return void 0;
    const members = await this.getWalletMembers(id);
    const transactionCount = await db.select({ count: sql2`count(*)::int` }).from(transactions).where(eq(transactions.walletId, id));
    return {
      ...wallet,
      members,
      _count: {
        transactions: transactionCount[0]?.count || 0,
        members: members.length
      }
    };
  }
  async getUserWallets(userId) {
    const userMemberships = await db.select({
      wallet: wallets,
      member: walletMembers
    }).from(walletMembers).innerJoin(wallets, eq(walletMembers.walletId, wallets.id)).where(eq(walletMembers.userId, userId)).orderBy(desc(wallets.createdAt));
    const walletIds = userMemberships.map((um) => um.wallet.id);
    if (walletIds.length === 0) return [];
    const allMembers = await db.select({
      member: walletMembers,
      user: users
    }).from(walletMembers).innerJoin(users, eq(walletMembers.userId, users.id)).where(inArray(walletMembers.walletId, walletIds));
    const transactionCounts = await db.select({
      walletId: transactions.walletId,
      count: sql2`count(*)::int`
    }).from(transactions).where(inArray(transactions.walletId, walletIds)).groupBy(transactions.walletId);
    const membersByWallet = allMembers.reduce((acc, { member, user }) => {
      if (!acc[member.walletId]) acc[member.walletId] = [];
      acc[member.walletId].push({ ...member, user });
      return acc;
    }, {});
    const transactionCountsByWallet = transactionCounts.reduce((acc, tc) => {
      acc[tc.walletId] = tc.count;
      return acc;
    }, {});
    return userMemberships.map(({ wallet }) => ({
      ...wallet,
      members: membersByWallet[wallet.id] || [],
      _count: {
        transactions: transactionCountsByWallet[wallet.id] || 0,
        members: membersByWallet[wallet.id]?.length || 0
      }
    }));
  }
  async updateWallet(id, updates) {
    const [wallet] = await db.update(wallets).set({ ...updates, updatedAt: /* @__PURE__ */ new Date() }).where(eq(wallets.id, id)).returning();
    return wallet;
  }
  async deleteWallet(id) {
    await db.delete(wallets).where(eq(wallets.id, id));
  }
  // Wallet member operations
  async addWalletMember(member) {
    const [newMember] = await db.insert(walletMembers).values(member).returning();
    return newMember;
  }
  async getWalletMember(walletId, userId) {
    const [member] = await db.select().from(walletMembers).where(and(eq(walletMembers.walletId, walletId), eq(walletMembers.userId, userId)));
    return member;
  }
  async getWalletMembers(walletId) {
    const members = await db.select({
      member: walletMembers,
      user: users
    }).from(walletMembers).innerJoin(users, eq(walletMembers.userId, users.id)).where(eq(walletMembers.walletId, walletId));
    return members.map(({ member, user }) => ({ ...member, user }));
  }
  async updateWalletMemberRole(walletId, userId, role) {
    const [member] = await db.update(walletMembers).set({ role }).where(and(eq(walletMembers.walletId, walletId), eq(walletMembers.userId, userId))).returning();
    return member;
  }
  async removeWalletMember(walletId, userId) {
    await db.delete(walletMembers).where(and(eq(walletMembers.walletId, walletId), eq(walletMembers.userId, userId)));
  }
  // Category operations
  async getCategories() {
    return await db.select().from(categories).where(eq(categories.isDefault, true));
  }
  async getUserCategories(userId, type) {
    let conditions = sql2`${categories.isDefault} = true OR ${categories.createdBy} = ${userId}`;
    if (type) {
      conditions = sql2`(${conditions}) AND ${categories.type} = ${type}`;
    }
    return await db.select().from(categories).where(conditions).orderBy(categories.name);
  }
  async seedDefaultCategories(defaultCategories) {
    const existingDefaults = await db.select().from(categories).where(eq(categories.isDefault, true));
    if (existingDefaults.length > 0) {
      return;
    }
    await db.insert(categories).values(defaultCategories.map((cat) => ({
      ...cat,
      createdBy: null
      // System-created
    })));
  }
  async createCategory(category) {
    const [newCategory] = await db.insert(categories).values(category).returning();
    return newCategory;
  }
  async updateCategory(id, updates) {
    const [category] = await db.update(categories).set(updates).where(eq(categories.id, id)).returning();
    return category;
  }
  async deleteCategory(id) {
    await db.delete(categories).where(eq(categories.id, id));
  }
  // Transaction operations
  async createTransaction(transaction) {
    const [newTransaction] = await db.insert(transactions).values(transaction).returning();
    const amount = parseFloat(transaction.amount);
    const balanceChange = transaction.type === "income" ? amount : -amount;
    await db.update(wallets).set({
      balance: sql2`${wallets.balance} + ${balanceChange}`,
      updatedAt: /* @__PURE__ */ new Date()
    }).where(eq(wallets.id, transaction.walletId));
    return newTransaction;
  }
  async getTransaction(id) {
    const [result] = await db.select({
      transaction: transactions,
      category: categories,
      wallet: wallets,
      creator: users
    }).from(transactions).innerJoin(categories, eq(transactions.categoryId, categories.id)).innerJoin(wallets, eq(transactions.walletId, wallets.id)).innerJoin(users, eq(transactions.createdBy, users.id)).where(eq(transactions.id, id));
    if (!result) return void 0;
    return {
      ...result.transaction,
      category: result.category,
      wallet: result.wallet,
      creator: result.creator
    };
  }
  async getWalletTransactions(walletId, options = {}) {
    const { limit = 50, offset = 0, days } = options;
    const results = await db.select({
      transaction: transactions,
      category: categories,
      wallet: wallets,
      creator: users
    }).from(transactions).innerJoin(categories, eq(transactions.categoryId, categories.id)).innerJoin(wallets, eq(transactions.walletId, wallets.id)).innerJoin(users, eq(transactions.createdBy, users.id)).where(
      days ? and(
        eq(transactions.walletId, walletId),
        gte(transactions.date, sql2`NOW() - INTERVAL '${sql2.raw(days.toString())} days'`)
      ) : eq(transactions.walletId, walletId)
    ).orderBy(desc(transactions.date), desc(transactions.createdAt)).limit(limit).offset(offset);
    return results.map((result) => ({
      ...result.transaction,
      category: result.category,
      wallet: result.wallet,
      creator: result.creator
    }));
  }
  async getUserTransactions(userId, limit = 50, offset = 0) {
    const results = await db.select({
      transaction: transactions,
      category: categories,
      wallet: wallets,
      creator: users
    }).from(transactions).innerJoin(categories, eq(transactions.categoryId, categories.id)).innerJoin(wallets, eq(transactions.walletId, wallets.id)).innerJoin(users, eq(transactions.createdBy, users.id)).where(eq(transactions.createdBy, userId)).orderBy(desc(transactions.date), desc(transactions.createdAt)).limit(limit).offset(offset);
    return results.map((result) => ({
      ...result.transaction,
      category: result.category,
      wallet: result.wallet,
      creator: result.creator
    }));
  }
  async updateTransaction(id, updates) {
    const [transaction] = await db.update(transactions).set({ ...updates, updatedAt: /* @__PURE__ */ new Date() }).where(eq(transactions.id, id)).returning();
    return transaction;
  }
  async deleteTransaction(id) {
    const [transaction] = await db.select().from(transactions).where(eq(transactions.id, id));
    if (transaction) {
      const amount = parseFloat(transaction.amount);
      const balanceChange = transaction.type === "income" ? -amount : amount;
      await db.update(wallets).set({
        balance: sql2`${wallets.balance} + ${balanceChange}`,
        updatedAt: /* @__PURE__ */ new Date()
      }).where(eq(wallets.id, transaction.walletId));
    }
    await db.delete(transactions).where(eq(transactions.id, id));
  }
  // Budget operations
  async createBudget(budget) {
    const [newBudget] = await db.insert(budgets).values(budget).returning();
    return newBudget;
  }
  async getWalletBudgets(walletId) {
    return await db.select().from(budgets).where(and(eq(budgets.walletId, walletId), eq(budgets.isActive, true)));
  }
  async updateBudget(id, updates) {
    const [budget] = await db.update(budgets).set(updates).where(eq(budgets.id, id)).returning();
    return budget;
  }
  async deleteBudget(id) {
    await db.delete(budgetItems).where(eq(budgetItems.budgetId, id));
    await db.delete(budgets).where(eq(budgets.id, id));
  }
  // Budget item operations
  async createBudgetItem(item) {
    const [newItem] = await db.insert(budgetItems).values(item).returning();
    return newItem;
  }
  async getBudgetItems(budgetId) {
    return await db.select().from(budgetItems).where(eq(budgetItems.budgetId, budgetId));
  }
  async updateBudgetItem(id, updates) {
    const [item] = await db.update(budgetItems).set({ ...updates, updatedAt: /* @__PURE__ */ new Date() }).where(eq(budgetItems.id, id)).returning();
    return item;
  }
  async deleteBudgetItem(id) {
    await db.delete(budgetItems).where(eq(budgetItems.id, id));
  }
  async updateBudgetItemPurchase(id, actualQuantity, actualUnitPrice, actualAmount, notes) {
    const [item] = await db.update(budgetItems).set({
      actualQuantity: actualQuantity.toString(),
      actualUnitPrice: actualUnitPrice.toString(),
      actualAmount: actualAmount.toString(),
      isPurchased: true,
      purchaseDate: /* @__PURE__ */ new Date(),
      notes,
      updatedAt: /* @__PURE__ */ new Date()
    }).where(eq(budgetItems.id, id)).returning();
    return item;
  }
  async getBudget(id) {
    const [budget] = await db.select().from(budgets).where(eq(budgets.id, id));
    return budget;
  }
  async getBudgetWithItems(id) {
    const [budget] = await db.select().from(budgets).where(eq(budgets.id, id));
    if (!budget) return void 0;
    const items = await db.select().from(budgetItems).where(eq(budgetItems.budgetId, id));
    return {
      ...budget,
      items
    };
  }
  async getUserBudgets(userId) {
    const results = await db.select({
      budget: budgets,
      category: categories,
      wallet: wallets
    }).from(budgets).innerJoin(categories, eq(budgets.categoryId, categories.id)).innerJoin(wallets, eq(budgets.walletId, wallets.id)).innerJoin(walletMembers, eq(wallets.id, walletMembers.walletId)).where(
      and(
        eq(walletMembers.userId, userId),
        eq(budgets.isActive, true)
      )
    ).orderBy(desc(budgets.createdAt));
    const enrichedBudgets = await Promise.all(
      results.map(async ({ budget, category, wallet }) => {
        const spent = await this.getBudgetSpent(budget.id);
        const itemCountResult = await db.select({ count: sql2`count(*)` }).from(budgetItems).where(eq(budgetItems.budgetId, budget.id));
        const itemCount = Number(itemCountResult[0]?.count || 0);
        return {
          ...budget,
          category,
          wallet,
          spent,
          itemCount
        };
      })
    );
    return enrichedBudgets;
  }
  async getBudgetSpent(budgetId) {
    const results = await db.select({
      total: sql2`COALESCE(SUM(CAST(${budgetItems.actualAmount} AS DECIMAL)), 0)`
    }).from(budgetItems).where(
      and(
        eq(budgetItems.budgetId, budgetId),
        eq(budgetItems.isPurchased, true),
        isNotNull(budgetItems.actualAmount)
      )
    );
    return Number(results[0]?.total || 0);
  }
  // Invitation operations
  async createWalletInvitation(invitation) {
    const [newInvitation] = await db.insert(walletInvitations).values(invitation).returning();
    return newInvitation;
  }
  async getWalletInvitations(walletId) {
    return await db.select().from(walletInvitations).where(eq(walletInvitations.walletId, walletId)).orderBy(desc(walletInvitations.createdAt));
  }
  async getPendingInvitations(email) {
    return await db.select().from(walletInvitations).where(
      and(
        eq(walletInvitations.email, email),
        eq(walletInvitations.status, "pending"),
        gte(walletInvitations.expiresAt, /* @__PURE__ */ new Date())
      )
    );
  }
  async updateInvitationStatus(id, status) {
    const [invitation] = await db.update(walletInvitations).set({ status }).where(eq(walletInvitations.id, id)).returning();
    return invitation;
  }
  // Analytics operations
  async getWalletSummary(walletId, startDate, endDate) {
    const results = await db.select({
      type: transactions.type,
      totalAmount: sql2`sum(${transactions.amount})::numeric`,
      count: sql2`count(*)::int`
    }).from(transactions).where(
      and(
        eq(transactions.walletId, walletId),
        gte(transactions.date, startDate),
        lte(transactions.date, endDate)
      )
    ).groupBy(transactions.type);
    const summary = {
      totalIncome: 0,
      totalExpenses: 0,
      balance: 0,
      transactionCount: 0
    };
    results.forEach((result) => {
      if (result.type === "income") {
        summary.totalIncome = parseFloat(result.totalAmount?.toString() || "0");
      } else {
        summary.totalExpenses = parseFloat(result.totalAmount?.toString() || "0");
      }
      summary.transactionCount += result.count;
    });
    summary.balance = summary.totalIncome - summary.totalExpenses;
    return summary;
  }
  async getCategorySpending(walletId, startDate, endDate) {
    const results = await db.select({
      categoryId: categories.id,
      categoryName: categories.name,
      totalAmount: sql2`sum(${transactions.amount})::numeric`,
      transactionCount: sql2`count(*)::int`
    }).from(transactions).innerJoin(categories, eq(transactions.categoryId, categories.id)).where(
      and(
        eq(transactions.walletId, walletId),
        eq(transactions.type, "expense"),
        gte(transactions.date, startDate),
        lte(transactions.date, endDate)
      )
    ).groupBy(categories.id, categories.name).orderBy(desc(sql2`sum(${transactions.amount})`));
    return results.map((result) => ({
      categoryId: result.categoryId,
      categoryName: result.categoryName,
      totalAmount: parseFloat(result.totalAmount?.toString() || "0"),
      transactionCount: result.transactionCount
    }));
  }
  // Goal operations
  async getUserGoals(userId) {
    return await db.select().from(goals).where(eq(goals.userId, userId)).orderBy(desc(goals.createdAt));
  }
  async createGoal(goal) {
    const [newGoal] = await db.insert(goals).values(goal).returning();
    return newGoal;
  }
  async getGoal(id) {
    const [goal] = await db.select().from(goals).where(eq(goals.id, id));
    return goal;
  }
  async updateGoal(id, updates) {
    const [goal] = await db.update(goals).set({ ...updates, updatedAt: /* @__PURE__ */ new Date() }).where(eq(goals.id, id)).returning();
    return goal;
  }
  async deleteGoal(id) {
    await db.delete(goals).where(eq(goals.id, id));
  }
  // Notification operations
  async getUserNotifications(userId, options = {}) {
    const { page = 1, limit = 20, unreadOnly = false } = options;
    const whereConditions = [eq(notifications.userId, userId)];
    if (unreadOnly) {
      whereConditions.push(eq(notifications.isRead, false));
    }
    return await db.select().from(notifications).where(and(...whereConditions)).orderBy(desc(notifications.createdAt)).limit(limit).offset((page - 1) * limit);
  }
  async createNotification(notification) {
    const [newNotification] = await db.insert(notifications).values(notification).returning();
    return newNotification;
  }
  async markNotificationAsRead(id, userId) {
    await db.update(notifications).set({ isRead: true }).where(and(eq(notifications.id, id), eq(notifications.userId, userId)));
  }
  async bulkMarkNotificationsAsRead(ids, userId) {
    await db.update(notifications).set({ isRead: true }).where(and(inArray(notifications.id, ids), eq(notifications.userId, userId)));
  }
  async deleteNotification(id, userId) {
    await db.delete(notifications).where(and(eq(notifications.id, id), eq(notifications.userId, userId)));
  }
  // Enhanced budget operations
  // AI & Analytics operations
  async getFinancialSummary(userId, options = {}) {
    const userWallets = await this.getUserWallets(userId);
    let summary = {
      totalIncome: 0,
      totalExpenses: 0,
      netCashFlow: 0,
      transactionCount: 0,
      walletCount: userWallets.length
    };
    for (const wallet of userWallets) {
      const walletTransactions = await this.getWalletTransactions(wallet.id, { limit: 50 });
      for (const tx of walletTransactions) {
        const amount = parseFloat(tx.amount);
        if (tx.type === "income") {
          summary.totalIncome += amount;
        } else {
          summary.totalExpenses += amount;
        }
        summary.transactionCount++;
      }
    }
    summary.netCashFlow = summary.totalIncome - summary.totalExpenses;
    return summary;
  }
  async getSpendingAnalysis(userId, options = {}) {
    const userWallets = await this.getUserWallets(userId);
    const categorySpending = {};
    for (const wallet of userWallets) {
      const transactions2 = await this.getWalletTransactions(wallet.id, { limit: 50 });
      for (const tx of transactions2) {
        if (tx.type === "expense") {
          const categoryName = tx.category.name;
          categorySpending[categoryName] = (categorySpending[categoryName] || 0) + parseFloat(tx.amount);
        }
      }
    }
    const topCategories = Object.entries(categorySpending).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([category, amount]) => ({ category, amount }));
    return { topCategories, insights: [] };
  }
  async getCategoryBreakdown(userId, options = {}) {
    const userWallets = await this.getUserWallets(userId);
    const breakdown = {};
    for (const wallet of userWallets) {
      const transactions2 = await this.getWalletTransactions(wallet.id, { limit: 100 });
      for (const tx of transactions2) {
        const categoryName = tx.category.name;
        if (!breakdown[categoryName]) {
          breakdown[categoryName] = { amount: 0, count: 0 };
        }
        breakdown[categoryName].amount += parseFloat(tx.amount);
        breakdown[categoryName].count++;
      }
    }
    return Object.entries(breakdown).map(([category, data]) => ({
      category,
      totalAmount: data.amount,
      transactionCount: data.count
    }));
  }
  async getFinancialTrends(userId, options = {}) {
    return [
      { period: "2025-01", value: 1200 },
      { period: "2025-02", value: 1350 },
      { period: "2025-03", value: 1100 }
    ];
  }
  // AI operations (simplified)
  async generateAIInsights(userId) {
    const summary = await this.getFinancialSummary(userId);
    return [
      {
        id: "spending_overview",
        title: "Monthly Spending Analysis",
        message: `You've spent $${summary.totalExpenses.toFixed(2)} this month across ${summary.transactionCount} transactions.`,
        type: "spending_analysis",
        priority: "normal"
      }
    ];
  }
  async predictSpending(userId, period) {
    const summary = await this.getFinancialSummary(userId);
    return {
      period,
      predictedAmount: Math.round(summary.totalExpenses * 1.05),
      confidence: 0.75,
      factors: ["Historical patterns", "Seasonal trends"]
    };
  }
  async detectAnomalies(userId) {
    return [];
  }
  async getPersonalizedRecommendations(userId) {
    const summary = await this.getFinancialSummary(userId);
    const recommendations = [];
    if (summary.netCashFlow > 0) {
      recommendations.push({
        id: "savings_opportunity",
        title: "Create a Savings Goal",
        description: `Consider setting up a savings goal with your surplus of $${summary.netCashFlow.toFixed(2)}.`,
        type: "goal",
        priority: "medium"
      });
    }
    return recommendations;
  }
  // Profile reset operations
  async resetUserProfile(userId) {
    const userBudgets = await this.getUserBudgets(userId);
    for (const budget of userBudgets) {
      await db.delete(budgetItems).where(eq(budgetItems.budgetId, budget.id));
    }
    for (const budget of userBudgets) {
      await db.delete(budgets).where(eq(budgets.id, budget.id));
    }
    const userWallets = await this.getUserWallets(userId);
    for (const wallet of userWallets) {
      await db.delete(transactions).where(eq(transactions.walletId, wallet.id));
    }
    for (const wallet of userWallets) {
      await db.delete(walletInvitations).where(eq(walletInvitations.walletId, wallet.id));
    }
    for (const wallet of userWallets) {
      await db.delete(walletMembers).where(eq(walletMembers.walletId, wallet.id));
    }
    for (const wallet of userWallets) {
      await db.delete(wallets).where(eq(wallets.id, wallet.id));
    }
    await db.delete(goals).where(eq(goals.userId, userId));
    await db.delete(notifications).where(eq(notifications.userId, userId));
    await db.delete(alerts).where(eq(alerts.userId, userId));
    await db.delete(reports).where(eq(reports.userId, userId));
    await db.delete(userPreferences).where(eq(userPreferences.userId, userId));
    await db.delete(categories).where(eq(categories.createdBy, userId));
  }
};
var storage = new DatabaseStorage();

// server/routes.ts
import { eq as eq2 } from "drizzle-orm";

// server/auth.ts
import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import session2 from "express-session";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
var scryptAsync = promisify(scrypt);
async function hashPassword(password) {
  const salt = randomBytes(16).toString("hex");
  const buf = await scryptAsync(password, salt, 64);
  return `${buf.toString("hex")}.${salt}`;
}
async function comparePasswords(supplied, stored) {
  const [hashed, salt] = stored.split(".");
  const hashedBuf = Buffer.from(hashed, "hex");
  const suppliedBuf = await scryptAsync(supplied, salt, 64);
  return timingSafeEqual(hashedBuf, suppliedBuf);
}
function setupAuth(app2) {
  const sessionSettings = {
    secret: process.env.SESSION_SECRET || "sendwise-secret-key-development-only",
    resave: false,
    saveUninitialized: true,
    store: storage.sessionStore,
    cookie: {
      secure: false,
      // Set to false for development
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1e3,
      // 24 hours
      sameSite: "lax"
    }
  };
  app2.set("trust proxy", 1);
  app2.use(session2(sessionSettings));
  app2.use(passport.initialize());
  app2.use(passport.session());
  passport.use(
    new LocalStrategy(
      { usernameField: "email" },
      async (email, password, done) => {
        try {
          const user = await storage.getUserByEmail(email);
          if (!user) {
            return done(null, false, { message: "Invalid credentials" });
          }
          if (user.authProvider === "google") {
            return done(null, false, {
              message: "This account is linked to Google. Please sign in with your Google account instead."
            });
          }
          if (user.authProvider !== "basic" || !user.password) {
            return done(null, false, { message: "Invalid credentials" });
          }
          const isValidPassword = await comparePasswords(password, user.password);
          if (!isValidPassword) {
            return done(null, false, { message: "Invalid credentials" });
          }
          return done(null, user);
        } catch (error) {
          return done(error);
        }
      }
    )
  );
  if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
    passport.use(
      new GoogleStrategy(
        {
          clientID: process.env.GOOGLE_CLIENT_ID,
          clientSecret: process.env.GOOGLE_CLIENT_SECRET,
          callbackURL: process.env.NODE_ENV === "production" ? `${process.env.PRODUCTION_DOMAIN || "https://cougeon.co.zw"}/api/auth/google/callback` : process.env.REPLIT_DEV_DOMAIN ? `https://${process.env.REPLIT_DEV_DOMAIN}/api/auth/google/callback` : "/api/auth/google/callback"
        },
        async (accessToken, refreshToken, profile, done) => {
          try {
            const email = profile.emails?.[0]?.value;
            if (!email) {
              return done(new Error("No email provided by Google"));
            }
            let user = await storage.getUserByEmail(email);
            if (user) {
              if (!user.googleId && user.authProvider === "basic") {
                user = await storage.updateUser(user.id, {
                  googleId: profile.id,
                  authProvider: "google",
                  profileImageUrl: profile.photos?.[0]?.value,
                  emailVerified: true
                });
              }
            } else {
              user = await storage.createUser({
                email,
                googleId: profile.id,
                firstName: profile.name?.givenName,
                lastName: profile.name?.familyName,
                profileImageUrl: profile.photos?.[0]?.value,
                authProvider: "google",
                emailVerified: true,
                isActive: true
              });
            }
            return done(null, user);
          } catch (error) {
            return done(error);
          }
        }
      )
    );
  }
  passport.serializeUser((user, done) => done(null, user.id));
  passport.deserializeUser(async (id, done) => {
    try {
      const user = await storage.getUser(id);
      done(null, user);
    } catch (error) {
      done(error);
    }
  });
  app2.post("/api/register", async (req, res, next) => {
    try {
      const { email, password, username, firstName, lastName } = req.body;
      if (!email || !password) {
        return res.status(400).json({ message: "Email and password are required" });
      }
      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        return res.status(400).json({ message: "User already exists with this email" });
      }
      if (username) {
        const existingUsername = await storage.getUserByUsername(username);
        if (existingUsername) {
          return res.status(400).json({ message: "Username already taken" });
        }
      }
      const hashedPassword = await hashPassword(password);
      const user = await storage.createUser({
        email,
        username,
        password: hashedPassword,
        firstName,
        lastName,
        authProvider: "basic",
        isActive: true
      });
      const { password: _, ...userResponse } = user;
      req.login(user, (err) => {
        if (err) return next(err);
        res.status(201).json(userResponse);
      });
    } catch (error) {
      console.error("Registration error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  app2.post("/api/login", (req, res, next) => {
    passport.authenticate("local", (err, user, info) => {
      if (err) {
        return res.status(500).json({ message: "Internal server error" });
      }
      if (!user) {
        return res.status(401).json({ message: info?.message || "Invalid credentials" });
      }
      req.login(user, (err2) => {
        if (err2) {
          return res.status(500).json({ message: "Login failed" });
        }
        const { password, ...userResponse } = user;
        res.json(userResponse);
      });
    })(req, res, next);
  });
  app2.get(
    "/api/auth/google",
    passport.authenticate("google", { scope: ["profile", "email"] })
  );
  app2.get(
    "/api/auth/google/callback",
    passport.authenticate("google", { failureRedirect: "/auth?error=google_auth_failed" }),
    (req, res) => {
      res.redirect("/");
    }
  );
  app2.post("/api/logout", (req, res, next) => {
    req.logout((err) => {
      if (err) return next(err);
      res.sendStatus(200);
    });
  });
  app2.get("/api/user", (req, res) => {
    if (!req.isAuthenticated() || !req.user) {
      return res.sendStatus(401);
    }
    const { password, ...userResponse } = req.user;
    res.json(userResponse);
  });
}

// server/routes.ts
import { z as z2 } from "zod";
function isAuthenticated(req, res, next) {
  if (req.isAuthenticated && req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ message: "Unauthorized" });
}
async function registerRoutes(app2) {
  app2.get("/health", (req, res) => {
    res.status(200).json({
      status: "healthy",
      timestamp: (/* @__PURE__ */ new Date()).toISOString(),
      service: "aureto-wallet-backend"
    });
  });
  setupAuth(app2);
  app2.post("/api/seed-categories", isAuthenticated, async (req, res) => {
    try {
      const defaultCategories = [
        { name: "Housing", icon: "\u{1F3E0}", color: "#3B82F6", isDefault: true },
        { name: "Food & Dining", icon: "\u{1F37D}\uFE0F", color: "#EF4444", isDefault: true },
        { name: "Transportation", icon: "\u{1F697}", color: "#10B981", isDefault: true },
        { name: "Healthcare", icon: "\u{1F3E5}", color: "#F59E0B", isDefault: true },
        { name: "Entertainment", icon: "\u{1F3AC}", color: "#8B5CF6", isDefault: true },
        { name: "Personal Care", icon: "\u{1F485}", color: "#06B6D4", isDefault: true },
        { name: "Education", icon: "\u{1F4DA}", color: "#84CC16", isDefault: true },
        { name: "Miscellaneous", icon: "\u{1F4CB}", color: "#6B7280", isDefault: true }
      ];
      for (const category of defaultCategories) {
        await storage.createCategory(category);
      }
      res.json({ message: "Default categories created successfully" });
    } catch (error) {
      console.error("Error seeding categories:", error);
      res.status(500).json({ message: "Failed to seed categories" });
    }
  });
  app2.get("/api/wallets", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user.id;
      const wallets2 = await storage.getUserWallets(userId);
      res.json(wallets2);
    } catch (error) {
      console.error("Error fetching wallets:", error);
      res.status(500).json({ message: "Failed to fetch wallets" });
    }
  });
  app2.post("/api/wallets", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user.id;
      const walletData = insertWalletSchema.parse({
        ...req.body,
        createdBy: userId
      });
      const wallet = await storage.createWallet(walletData);
      res.status(201).json(wallet);
    } catch (error) {
      console.error("Error creating wallet:", error);
      if (error instanceof z2.ZodError) {
        res.status(400).json({ message: "Invalid wallet data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to create wallet" });
      }
    }
  });
  app2.get("/api/wallets/:id", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user.id;
      const walletId = req.params.id;
      const member = await storage.getWalletMember(walletId, userId);
      if (!member) {
        return res.status(403).json({ message: "Access denied" });
      }
      const wallet = await storage.getWalletWithMembers(walletId);
      if (!wallet) {
        return res.status(404).json({ message: "Wallet not found" });
      }
      res.json(wallet);
    } catch (error) {
      console.error("Error fetching wallet:", error);
      res.status(500).json({ message: "Failed to fetch wallet" });
    }
  });
  app2.put("/api/wallets/:id", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user.id;
      const walletId = req.params.id;
      const member = await storage.getWalletMember(walletId, userId);
      if (!member || !["owner", "manager"].includes(member.role)) {
        return res.status(403).json({ message: "Insufficient permissions" });
      }
      const updates = insertWalletSchema.partial().parse(req.body);
      const wallet = await storage.updateWallet(walletId, updates);
      res.json(wallet);
    } catch (error) {
      console.error("Error updating wallet:", error);
      if (error instanceof z2.ZodError) {
        res.status(400).json({ message: "Invalid wallet data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to update wallet" });
      }
    }
  });
  app2.get("/api/wallets/:walletId/transactions", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user.id;
      const walletId = req.params.walletId;
      const limit = parseInt(req.query.limit) || 50;
      const offset = parseInt(req.query.offset) || 0;
      const member = await storage.getWalletMember(walletId, userId);
      if (!member) {
        return res.status(403).json({ message: "Access denied" });
      }
      const transactions2 = await storage.getWalletTransactions(walletId, { limit, offset });
      res.json(transactions2);
    } catch (error) {
      console.error("Error fetching transactions:", error);
      res.status(500).json({ message: "Failed to fetch transactions" });
    }
  });
  app2.post("/api/transactions", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user.id;
      const transactionData = insertTransactionSchema.parse({
        ...req.body,
        createdBy: userId,
        date: req.body.date ? new Date(req.body.date) : /* @__PURE__ */ new Date()
      });
      const member = await storage.getWalletMember(transactionData.walletId, userId);
      if (!member || !["owner", "manager", "contributor"].includes(member.role)) {
        return res.status(403).json({ message: "Insufficient permissions" });
      }
      const transaction = await storage.createTransaction(transactionData);
      res.status(201).json(transaction);
    } catch (error) {
      console.error("Error creating transaction:", error);
      if (error instanceof z2.ZodError) {
        res.status(400).json({ message: "Invalid transaction data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to create transaction" });
      }
    }
  });
  app2.get("/api/transactions/:id", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user.id;
      const transactionId = req.params.id;
      const transaction = await storage.getTransaction(transactionId);
      if (!transaction) {
        return res.status(404).json({ message: "Transaction not found" });
      }
      const member = await storage.getWalletMember(transaction.walletId, userId);
      if (!member) {
        return res.status(403).json({ message: "Access denied" });
      }
      res.json(transaction);
    } catch (error) {
      console.error("Error fetching transaction:", error);
      res.status(500).json({ message: "Failed to fetch transaction" });
    }
  });
  app2.put("/api/transactions/:id", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user.id;
      const transactionId = req.params.id;
      const existingTransaction = await storage.getTransaction(transactionId);
      if (!existingTransaction) {
        return res.status(404).json({ message: "Transaction not found" });
      }
      const member = await storage.getWalletMember(existingTransaction.walletId, userId);
      if (!member || !["owner", "manager", "contributor"].includes(member.role)) {
        return res.status(403).json({ message: "Insufficient permissions" });
      }
      const updates = insertTransactionSchema.partial().parse(req.body);
      if (updates.date) {
        updates.date = new Date(updates.date);
      }
      const transaction = await storage.updateTransaction(transactionId, updates);
      res.json(transaction);
    } catch (error) {
      console.error("Error updating transaction:", error);
      if (error instanceof z2.ZodError) {
        res.status(400).json({ message: "Invalid transaction data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to update transaction" });
      }
    }
  });
  app2.delete("/api/transactions/:id", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user.id;
      const transactionId = req.params.id;
      const existingTransaction = await storage.getTransaction(transactionId);
      if (!existingTransaction) {
        return res.status(404).json({ message: "Transaction not found" });
      }
      const member = await storage.getWalletMember(existingTransaction.walletId, userId);
      if (!member || !["owner", "manager"].includes(member.role)) {
        return res.status(403).json({ message: "Insufficient permissions" });
      }
      await storage.deleteTransaction(transactionId);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting transaction:", error);
      res.status(500).json({ message: "Failed to delete transaction" });
    }
  });
  app2.get("/api/categories", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user.id;
      const type = req.query.type;
      const categories2 = await storage.getUserCategories(userId, type);
      res.json(categories2);
    } catch (error) {
      console.error("Error fetching categories:", error);
      res.status(500).json({ message: "Failed to fetch categories" });
    }
  });
  app2.post("/api/categories/seed", isAuthenticated, async (req, res) => {
    try {
      const defaultCategories = [
        // Income categories
        { name: "Salary", type: "income", icon: "fas fa-briefcase", color: "#22c55e", isDefault: true },
        { name: "Freelance", type: "income", icon: "fas fa-laptop", color: "#3b82f6", isDefault: true },
        { name: "Investment", type: "income", icon: "fas fa-chart-line", color: "#8b5cf6", isDefault: true },
        { name: "Business", type: "income", icon: "fas fa-building", color: "#06b6d4", isDefault: true },
        { name: "Other Income", type: "income", icon: "fas fa-plus-circle", color: "#10b981", isDefault: true },
        // Expense categories
        { name: "Food & Dining", type: "expense", icon: "fas fa-utensils", color: "#f59e0b", isDefault: true },
        { name: "Transportation", type: "expense", icon: "fas fa-car", color: "#ef4444", isDefault: true },
        { name: "Shopping", type: "expense", icon: "fas fa-shopping-bag", color: "#8b5cf6", isDefault: true },
        { name: "Entertainment", type: "expense", icon: "fas fa-film", color: "#06b6d4", isDefault: true },
        { name: "Bills & Utilities", type: "expense", icon: "fas fa-file-invoice-dollar", color: "#64748b", isDefault: true },
        { name: "Healthcare", type: "expense", icon: "fas fa-heart", color: "#dc2626", isDefault: true },
        { name: "Education", type: "expense", icon: "fas fa-graduation-cap", color: "#7c3aed", isDefault: true },
        { name: "Travel", type: "expense", icon: "fas fa-plane", color: "#059669", isDefault: true },
        { name: "Home & Garden", type: "expense", icon: "fas fa-home", color: "#d97706", isDefault: true },
        { name: "Personal Care", type: "expense", icon: "fas fa-spa", color: "#be185d", isDefault: true },
        { name: "Other Expenses", type: "expense", icon: "fas fa-minus-circle", color: "#6b7280", isDefault: true }
      ];
      await storage.seedDefaultCategories(defaultCategories);
      res.json({ message: "Default categories seeded successfully" });
    } catch (error) {
      console.error("Error seeding categories:", error);
      res.status(500).json({ message: "Failed to seed categories" });
    }
  });
  app2.post("/api/categories", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user.id;
      const categoryData = insertCategorySchema.parse({
        ...req.body,
        createdBy: userId,
        isDefault: false
      });
      const category = await storage.createCategory(categoryData);
      res.status(201).json(category);
    } catch (error) {
      console.error("Error creating category:", error);
      if (error instanceof z2.ZodError) {
        res.status(400).json({ message: "Invalid category data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to create category" });
      }
    }
  });
  app2.get("/api/wallets/:walletId/members", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user.id;
      const walletId = req.params.walletId;
      const member = await storage.getWalletMember(walletId, userId);
      if (!member) {
        return res.status(403).json({ message: "Access denied" });
      }
      const members = await storage.getWalletMembers(walletId);
      res.json(members);
    } catch (error) {
      console.error("Error fetching wallet members:", error);
      res.status(500).json({ message: "Failed to fetch wallet members" });
    }
  });
  app2.put("/api/wallets/:walletId/members/:userId/role", isAuthenticated, async (req, res) => {
    try {
      const currentUserId = req.user.id;
      const walletId = req.params.walletId;
      const targetUserId = req.params.userId;
      const { role } = req.body;
      const currentMember = await storage.getWalletMember(walletId, currentUserId);
      if (!currentMember || !["owner", "manager"].includes(currentMember.role)) {
        return res.status(403).json({ message: "Insufficient permissions" });
      }
      const validRoles = ["owner", "manager", "contributor", "viewer"];
      if (!validRoles.includes(role)) {
        return res.status(400).json({ message: "Invalid role" });
      }
      const updatedMember = await storage.updateWalletMemberRole(walletId, targetUserId, role);
      res.json(updatedMember);
    } catch (error) {
      console.error("Error updating member role:", error);
      res.status(500).json({ message: "Failed to update member role" });
    }
  });
  app2.delete("/api/wallets/:walletId/members/:userId", isAuthenticated, async (req, res) => {
    try {
      const currentUserId = req.user.id;
      const walletId = req.params.walletId;
      const targetUserId = req.params.userId;
      const currentMember = await storage.getWalletMember(walletId, currentUserId);
      if (!currentMember || !["owner", "manager"].includes(currentMember.role)) {
        return res.status(403).json({ message: "Insufficient permissions" });
      }
      await storage.removeWalletMember(walletId, targetUserId);
      res.status(204).send();
    } catch (error) {
      console.error("Error removing wallet member:", error);
      res.status(500).json({ message: "Failed to remove wallet member" });
    }
  });
  app2.post("/api/wallets/:walletId/invitations", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user.id;
      const walletId = req.params.walletId;
      const member = await storage.getWalletMember(walletId, userId);
      if (!member || !["owner", "manager"].includes(member.role)) {
        return res.status(403).json({ message: "Insufficient permissions" });
      }
      const invitationData = insertWalletInvitationSchema.parse({
        ...req.body,
        walletId,
        invitedBy: userId,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1e3)
        // 7 days
      });
      const invitation = await storage.createWalletInvitation(invitationData);
      res.status(201).json(invitation);
    } catch (error) {
      console.error("Error creating invitation:", error);
      if (error instanceof z2.ZodError) {
        res.status(400).json({ message: "Invalid invitation data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to create invitation" });
      }
    }
  });
  app2.get("/api/wallets/:walletId/summary", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user.id;
      const walletId = req.params.walletId;
      const startDate = new Date(req.query.startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1e3));
      const endDate = new Date(req.query.endDate || /* @__PURE__ */ new Date());
      const member = await storage.getWalletMember(walletId, userId);
      if (!member) {
        return res.status(403).json({ message: "Access denied" });
      }
      const summary = await storage.getWalletSummary(walletId, startDate, endDate);
      res.json(summary);
    } catch (error) {
      console.error("Error fetching wallet summary:", error);
      res.status(500).json({ message: "Failed to fetch wallet summary" });
    }
  });
  app2.get("/api/wallets/:walletId/category-spending", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user.id;
      const walletId = req.params.walletId;
      const startDate = new Date(req.query.startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1e3));
      const endDate = new Date(req.query.endDate || /* @__PURE__ */ new Date());
      const member = await storage.getWalletMember(walletId, userId);
      if (!member) {
        return res.status(403).json({ message: "Access denied" });
      }
      const categorySpending = await storage.getCategorySpending(walletId, startDate, endDate);
      res.json(categorySpending);
    } catch (error) {
      console.error("Error fetching category spending:", error);
      res.status(500).json({ message: "Failed to fetch category spending" });
    }
  });
  app2.get("/api/budgets", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user.id;
      const budgets2 = await storage.getUserBudgets(userId);
      res.json(budgets2);
    } catch (error) {
      console.error("Error fetching user budgets:", error);
      res.status(500).json({ message: "Failed to fetch budgets" });
    }
  });
  app2.get("/api/wallets/:walletId/budgets", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user.id;
      const walletId = req.params.walletId;
      const member = await storage.getWalletMember(walletId, userId);
      if (!member) {
        return res.status(403).json({ message: "Access denied" });
      }
      const budgets2 = await storage.getWalletBudgets(walletId);
      res.json(budgets2);
    } catch (error) {
      console.error("Error fetching budgets:", error);
      res.status(500).json({ message: "Failed to fetch budgets" });
    }
  });
  app2.post("/api/budgets", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user.id;
      const budgetData = insertBudgetSchema.parse({
        ...req.body,
        createdBy: userId,
        startDate: new Date(req.body.startDate),
        endDate: req.body.endDate ? new Date(req.body.endDate) : void 0
      });
      const member = await storage.getWalletMember(budgetData.walletId, userId);
      if (!member || !["owner", "manager"].includes(member.role)) {
        return res.status(403).json({ message: "Insufficient permissions" });
      }
      const budget = await storage.createBudget(budgetData);
      res.status(201).json(budget);
    } catch (error) {
      console.error("Error creating budget:", error);
      if (error instanceof z2.ZodError) {
        res.status(400).json({ message: "Invalid budget data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to create budget" });
      }
    }
  });
  app2.get("/api/users/me", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user.id;
      const user = await storage.getUser(userId);
      const preferences = await storage.getUserPreferences(userId);
      res.json({
        ...user,
        preferences: preferences || {
          currency: "USD",
          timezone: "UTC",
          language: "en",
          theme: "light"
        }
      });
    } catch (error) {
      console.error("Error fetching user profile:", error);
      res.status(500).json({ message: "Failed to fetch user profile" });
    }
  });
  app2.patch("/api/users/me", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user.id;
      const updates = req.body;
      const { password, id, authProvider, googleId, emailVerified, isActive, createdAt, updatedAt, ...safeUpdates } = updates;
      const updatedUser = await storage.updateUser(userId, safeUpdates);
      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }
      const { password: _, ...userResponse } = updatedUser;
      res.json(userResponse);
    } catch (error) {
      console.error("Error updating user profile:", error);
      res.status(500).json({ message: "Failed to update user profile" });
    }
  });
  app2.patch("/api/users/me/preferences", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user.id;
      const preferences = insertUserPreferencesSchema.partial().parse(req.body);
      const updatedPreferences = await storage.upsertUserPreferences(userId, {
        userId,
        ...preferences
      });
      res.json(updatedPreferences);
    } catch (error) {
      console.error("Error updating user preferences:", error);
      res.status(400).json({ message: "Invalid preferences data" });
    }
  });
  app2.post("/api/users/me/reset", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user.id;
      const { confirmationText } = req.body;
      if (confirmationText !== "delete-all-data-by-courage") {
        return res.status(400).json({
          message: "Invalid confirmation text. Please type exactly: delete-all-data-by-courage"
        });
      }
      await storage.resetUserProfile(userId);
      res.json({
        message: "Profile reset successfully. All data has been deleted.",
        resetAt: (/* @__PURE__ */ new Date()).toISOString()
      });
    } catch (error) {
      console.error("Error resetting user profile:", error);
      res.status(500).json({ message: "Failed to reset profile. Please try again." });
    }
  });
  app2.get("/api/goals", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user.id;
      const goals2 = await storage.getUserGoals(userId);
      res.json(goals2);
    } catch (error) {
      console.error("Error fetching goals:", error);
      res.status(500).json({ message: "Failed to fetch goals" });
    }
  });
  app2.post("/api/goals", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user.id;
      console.log("Creating goal for user:", userId, "with data:", req.body);
      let goalData = {
        ...req.body,
        userId
      };
      if (goalData.targetDate && goalData.targetDate !== null) {
        goalData.targetDate = new Date(goalData.targetDate);
      } else {
        delete goalData.targetDate;
      }
      const parsedData = insertGoalSchema.parse(goalData);
      console.log("Parsed goal data:", parsedData);
      const goal = await storage.createGoal(parsedData);
      console.log("Created goal:", goal);
      try {
        await storage.createNotification({
          userId,
          type: "goal_created",
          title: "Goal Created",
          message: `Your goal "${goal.name}" has been created successfully!`,
          data: { goalId: goal.id }
        });
      } catch (notificationError) {
        console.warn("Failed to create notification for goal creation:", notificationError);
      }
      res.status(201).json(goal);
    } catch (error) {
      console.error("Error creating goal:", error);
      if (error instanceof z2.ZodError) {
        res.status(400).json({
          message: "Invalid goal data",
          errors: error.errors,
          details: error.errors.map((e) => `${e.path.join(".")}: ${e.message}`).join(", ")
        });
      } else {
        res.status(500).json({
          message: "Failed to create goal",
          error: error instanceof Error ? error.message : "Unknown error"
        });
      }
    }
  });
  app2.get("/api/goals/:id", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user.id;
      const goal = await storage.getGoal(req.params.id);
      if (!goal || goal.userId !== userId) {
        return res.status(404).json({ message: "Goal not found" });
      }
      res.json(goal);
    } catch (error) {
      console.error("Error fetching goal:", error);
      res.status(500).json({ message: "Failed to fetch goal" });
    }
  });
  app2.put("/api/goals/:id", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user.id;
      const goal = await storage.getGoal(req.params.id);
      if (!goal || goal.userId !== userId) {
        return res.status(404).json({ message: "Goal not found" });
      }
      const updates = req.body;
      if (updates.targetDate && updates.targetDate !== null) {
        updates.targetDate = new Date(updates.targetDate);
      }
      const updatedGoal = await storage.updateGoal(req.params.id, updates);
      res.json(updatedGoal);
    } catch (error) {
      console.error("Error updating goal:", error);
      res.status(500).json({ message: "Failed to update goal" });
    }
  });
  app2.delete("/api/goals/:id", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user.id;
      const goal = await storage.getGoal(req.params.id);
      if (!goal || goal.userId !== userId) {
        return res.status(404).json({ message: "Goal not found" });
      }
      await storage.deleteGoal(req.params.id);
      res.json({ message: "Goal deleted successfully" });
    } catch (error) {
      console.error("Error deleting goal:", error);
      res.status(500).json({ message: "Failed to delete goal" });
    }
  });
  app2.post("/api/goals/:id/contribute", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user.id;
      const { amount } = req.body;
      if (!amount || parseFloat(amount) <= 0) {
        return res.status(400).json({ message: "Invalid contribution amount" });
      }
      const goal = await storage.getGoal(req.params.id);
      if (!goal || goal.userId !== userId) {
        return res.status(404).json({ message: "Goal not found" });
      }
      const contribution = parseFloat(amount);
      const newAmount = parseFloat(goal.currentAmount) + contribution;
      const updatedGoal = await storage.updateGoal(req.params.id, {
        currentAmount: newAmount.toString()
      });
      if (newAmount >= parseFloat(goal.targetAmount) && !goal.achievedAt) {
        await storage.updateGoal(req.params.id, {
          achievedAt: /* @__PURE__ */ new Date(),
          isActive: false
        });
        try {
          await storage.createNotification({
            userId,
            type: "goal_achieved",
            title: "Goal Achieved! \u{1F389}",
            message: `Congratulations! You've achieved your goal "${goal.name}"!`,
            data: { goalId: goal.id, amount: newAmount },
            priority: "high"
          });
        } catch (notificationError) {
          console.warn("Failed to create achievement notification:", notificationError);
        }
      }
      res.json(updatedGoal);
    } catch (error) {
      console.error("Error contributing to goal:", error);
      res.status(500).json({ message: "Failed to contribute to goal" });
    }
  });
  app2.get("/api/notifications", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user.id;
      const { page = 1, limit = 20, unreadOnly } = req.query;
      const notifications2 = await storage.getUserNotifications(userId, {
        page: parseInt(page),
        limit: parseInt(limit),
        unreadOnly: unreadOnly === "true"
      });
      res.json(notifications2);
    } catch (error) {
      console.error("Error fetching notifications:", error);
      res.status(500).json({ message: "Failed to fetch notifications" });
    }
  });
  app2.patch("/api/notifications/:id/read", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user.id;
      await storage.markNotificationAsRead(req.params.id, userId);
      res.json({ message: "Notification marked as read" });
    } catch (error) {
      console.error("Error marking notification as read:", error);
      res.status(500).json({ message: "Failed to mark notification as read" });
    }
  });
  app2.get("/api/reports/financial-summary", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user.id;
      const summary = await storage.getFinancialSummary(userId);
      res.json(summary);
    } catch (error) {
      console.error("Error generating financial summary:", error);
      res.status(500).json({ message: "Failed to generate financial summary" });
    }
  });
  app2.get("/api/reports/spending-analysis", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user.id;
      const analysis = await storage.getSpendingAnalysis(userId);
      res.json(analysis);
    } catch (error) {
      console.error("Error generating spending analysis:", error);
      res.status(500).json({ message: "Failed to generate spending analysis" });
    }
  });
  app2.get("/api/reports/category-breakdown", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user.id;
      const breakdown = await storage.getCategoryBreakdown(userId);
      res.json(breakdown);
    } catch (error) {
      console.error("Error generating category breakdown:", error);
      res.status(500).json({ message: "Failed to generate category breakdown" });
    }
  });
  app2.get("/api/ai/insights", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user.id;
      const insights = await storage.generateAIInsights(userId);
      res.json(insights);
    } catch (error) {
      console.error("Error generating AI insights:", error);
      res.status(500).json({ message: "Failed to generate AI insights" });
    }
  });
  app2.get("/api/ai/predictions/spending", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user.id;
      const { period = "next_month" } = req.query;
      const predictions = await storage.predictSpending(userId, period);
      res.json(predictions);
    } catch (error) {
      console.error("Error generating spending predictions:", error);
      res.status(500).json({ message: "Failed to generate spending predictions" });
    }
  });
  app2.get("/api/ai/recommendations", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user.id;
      const recommendations = await storage.getPersonalizedRecommendations(userId);
      res.json(recommendations);
    } catch (error) {
      console.error("Error generating recommendations:", error);
      res.status(500).json({ message: "Failed to generate recommendations" });
    }
  });
  app2.get("/api/budgets", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user.id;
      const userBudgets = await storage.getUserBudgets(userId);
      res.json(userBudgets);
    } catch (error) {
      console.error("Error fetching user budgets:", error);
      res.status(500).json({ message: "Failed to fetch budgets" });
    }
  });
  app2.put("/api/budgets/:id", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user.id;
      const budgetId = req.params.id;
      const existingBudget = await storage.getBudget(budgetId);
      if (!existingBudget) {
        return res.status(404).json({ message: "Budget not found" });
      }
      const member = await storage.getWalletMember(existingBudget.walletId, userId);
      if (!member || !["owner", "manager"].includes(member.role)) {
        return res.status(403).json({ message: "Insufficient permissions" });
      }
      const updates = req.body;
      if (updates.startDate) updates.startDate = new Date(updates.startDate);
      if (updates.endDate) updates.endDate = new Date(updates.endDate);
      const updatedBudget = await storage.updateBudget(budgetId, updates);
      res.json(updatedBudget);
    } catch (error) {
      console.error("Error updating budget:", error);
      res.status(500).json({ message: "Failed to update budget" });
    }
  });
  app2.delete("/api/budgets/:id", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user.id;
      const budgetId = req.params.id;
      const existingBudget = await storage.getBudget(budgetId);
      if (!existingBudget) {
        return res.status(404).json({ message: "Budget not found" });
      }
      const member = await storage.getWalletMember(existingBudget.walletId, userId);
      if (!member || !["owner", "manager"].includes(member.role)) {
        return res.status(403).json({ message: "Insufficient permissions" });
      }
      await storage.deleteBudget(budgetId);
      res.json({ message: "Budget deleted successfully" });
    } catch (error) {
      console.error("Error deleting budget:", error);
      res.status(500).json({ message: "Failed to delete budget" });
    }
  });
  app2.get("/api/budgets/:budgetId/items", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user.id;
      const budgetId = req.params.budgetId;
      const budget = await storage.getBudget(budgetId);
      if (!budget) {
        return res.status(404).json({ message: "Budget not found" });
      }
      const member = await storage.getWalletMember(budget.walletId, userId);
      if (!member) {
        return res.status(403).json({ message: "Access denied" });
      }
      const items = await storage.getBudgetItems(budgetId);
      res.json(items);
    } catch (error) {
      console.error("Error fetching budget items:", error);
      res.status(500).json({ message: "Failed to fetch budget items" });
    }
  });
  app2.post("/api/budgets/:budgetId/items", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user.id;
      const budgetId = req.params.budgetId;
      const budget = await storage.getBudget(budgetId);
      if (!budget) {
        return res.status(404).json({ message: "Budget not found" });
      }
      const member = await storage.getWalletMember(budget.walletId, userId);
      if (!member || !["owner", "manager", "contributor"].includes(member.role)) {
        return res.status(403).json({ message: "Insufficient permissions" });
      }
      const itemData = insertBudgetItemSchema.parse({
        ...req.body,
        budgetId
      });
      const item = await storage.createBudgetItem(itemData);
      res.status(201).json(item);
    } catch (error) {
      console.error("Error creating budget item:", error);
      if (error instanceof z2.ZodError) {
        res.status(400).json({ message: "Invalid item data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to create budget item" });
      }
    }
  });
  app2.put("/api/budget-items/:id", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user.id;
      const itemId = req.params.id;
      const items = await storage.getBudgetItems("dummy");
      const item = await db.select().from(budgetItems).where(eq2(budgetItems.id, itemId)).limit(1);
      if (!item.length) {
        return res.status(404).json({ message: "Budget item not found" });
      }
      const budget = await storage.getBudget(item[0].budgetId);
      if (!budget) {
        return res.status(404).json({ message: "Budget not found" });
      }
      const member = await storage.getWalletMember(budget.walletId, userId);
      if (!member || !["owner", "manager", "contributor"].includes(member.role)) {
        return res.status(403).json({ message: "Insufficient permissions" });
      }
      const updates = req.body;
      const updatedItem = await storage.updateBudgetItem(itemId, updates);
      res.json(updatedItem);
    } catch (error) {
      console.error("Error updating budget item:", error);
      res.status(500).json({ message: "Failed to update budget item" });
    }
  });
  app2.put("/api/budget-items/:id/purchase", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user.id;
      const itemId = req.params.id;
      const { actualQuantity, actualUnitPrice, actualAmount, notes } = req.body;
      const item = await db.select().from(budgetItems).where(eq2(budgetItems.id, itemId)).limit(1);
      if (!item.length) {
        return res.status(404).json({ message: "Budget item not found" });
      }
      const budget = await storage.getBudget(item[0].budgetId);
      if (!budget) {
        return res.status(404).json({ message: "Budget not found" });
      }
      const member = await storage.getWalletMember(budget.walletId, userId);
      if (!member || !["owner", "manager", "contributor"].includes(member.role)) {
        return res.status(403).json({ message: "Insufficient permissions" });
      }
      const updatedItem = await storage.updateBudgetItemPurchase(
        itemId,
        parseFloat(actualQuantity),
        parseFloat(actualUnitPrice),
        parseFloat(actualAmount),
        notes
      );
      res.json(updatedItem);
    } catch (error) {
      console.error("Error updating purchase:", error);
      res.status(500).json({ message: "Failed to update purchase" });
    }
  });
  app2.delete("/api/budget-items/:id", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user.id;
      const itemId = req.params.id;
      const item = await db.select().from(budgetItems).where(eq2(budgetItems.id, itemId)).limit(1);
      if (!item.length) {
        return res.status(404).json({ message: "Budget item not found" });
      }
      const budget = await storage.getBudget(item[0].budgetId);
      if (!budget) {
        return res.status(404).json({ message: "Budget not found" });
      }
      const member = await storage.getWalletMember(budget.walletId, userId);
      if (!member || !["owner", "manager"].includes(member.role)) {
        return res.status(403).json({ message: "Insufficient permissions" });
      }
      await storage.deleteBudgetItem(itemId);
      res.json({ message: "Budget item deleted successfully" });
    } catch (error) {
      console.error("Error deleting budget item:", error);
      res.status(500).json({ message: "Failed to delete budget item" });
    }
  });
  const httpServer = createServer(app2);
  return httpServer;
}

// server/vite.ts
import express from "express";
import fs from "fs";
import path2 from "path";
import { createServer as createViteServer, createLogger } from "vite";

// vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";
var vite_config_default = defineConfig({
  plugins: [
    react(),
    runtimeErrorOverlay(),
    ...process.env.NODE_ENV !== "production" && process.env.REPL_ID !== void 0 ? [
      await import("@replit/vite-plugin-cartographer").then(
        (m) => m.cartographer()
      )
    ] : []
  ],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "client", "src"),
      "@shared": path.resolve(import.meta.dirname, "shared"),
      "@assets": path.resolve(import.meta.dirname, "attached_assets")
    }
  },
  root: path.resolve(import.meta.dirname, "client"),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true
  },
  server: {
    fs: {
      strict: true,
      deny: ["**/.*"]
    }
  }
});

// server/vite.ts
import { nanoid } from "nanoid";
var viteLogger = createLogger();
function log(message, source = "express") {
  const formattedTime = (/* @__PURE__ */ new Date()).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true
  });
  console.log(`${formattedTime} [${source}] ${message}`);
}
async function setupVite(app2, server) {
  const serverOptions = {
    middlewareMode: true,
    hmr: { server },
    allowedHosts: true
  };
  const vite = await createViteServer({
    ...vite_config_default,
    configFile: false,
    customLogger: {
      ...viteLogger,
      error: (msg, options) => {
        viteLogger.error(msg, options);
        process.exit(1);
      }
    },
    server: serverOptions,
    appType: "custom"
  });
  app2.use(vite.middlewares);
  app2.use("*", async (req, res, next) => {
    const url = req.originalUrl;
    try {
      const clientTemplate = path2.resolve(
        import.meta.dirname,
        "..",
        "client",
        "index.html"
      );
      let template = await fs.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid()}"`
      );
      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e);
      next(e);
    }
  });
}
function serveStatic(app2) {
  const distPath = path2.resolve(import.meta.dirname, "public");
  if (!fs.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`
    );
  }
  app2.use(express.static(distPath));
  app2.use("*", (_req, res) => {
    res.sendFile(path2.resolve(distPath, "index.html"));
  });
}

// server/index.ts
dotenv2.config();
var app = express2();
app.use(express2.json());
app.use(express2.urlencoded({ extended: false }));
app.use((req, res, next) => {
  const start = Date.now();
  const path3 = req.path;
  let capturedJsonResponse = void 0;
  const originalResJson = res.json;
  res.json = function(bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };
  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path3.startsWith("/api")) {
      let logLine = `${req.method} ${path3} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }
      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "\u2026";
      }
      log(logLine);
    }
  });
  next();
});
(async () => {
  const server = await registerRoutes(app);
  app.use((err, _req, res, _next) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    res.status(status).json({ message });
    throw err;
  });
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }
  const port = parseInt(process.env.PORT || "5000", 10);
  if (process.env.NODE_ENV === "production") {
    server.listen({
      port,
      host: "0.0.0.0",
      reusePort: true
    }, () => {
      log(`serving on port ${port}`);
    });
  } else {
    server.listen(port, "127.0.0.1", () => {
      log(`serving on port ${port}`);
    });
  }
})();
