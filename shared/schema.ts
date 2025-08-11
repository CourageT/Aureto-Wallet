import { sql } from 'drizzle-orm';
import {
  index,
  jsonb,
  pgTable,
  timestamp,
  varchar,
  text,
  decimal,
  boolean,
  integer,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table (required for Replit Auth)
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table (required for Replit Auth)
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Wallets table
export const wallets = pgTable("wallets", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  type: varchar("type", { length: 50 }).notNull(), // 'personal', 'shared', 'savings_goal'
  currency: varchar("currency", { length: 3 }).notNull().default('USD'),
  balance: decimal("balance", { precision: 12, scale: 2 }).notNull().default('0.00'),
  goalAmount: decimal("goal_amount", { precision: 12, scale: 2 }),
  goalDate: timestamp("goal_date"),
  isArchived: boolean("is_archived").notNull().default(false),
  createdBy: varchar("created_by").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Wallet members table (for shared wallets and permissions)
export const walletMembers = pgTable("wallet_members", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  walletId: varchar("wallet_id").notNull(),
  userId: varchar("user_id").notNull(),
  role: varchar("role", { length: 50 }).notNull(), // 'owner', 'manager', 'contributor', 'viewer'
  permissions: jsonb("permissions"), // Additional granular permissions
  joinedAt: timestamp("joined_at").defaultNow(),
  invitedBy: varchar("invited_by"),
});

// Categories table
export const categories = pgTable("categories", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  type: varchar("type", { length: 20 }).notNull().default('expense'), // 'income', 'expense'
  icon: varchar("icon", { length: 100 }),
  color: varchar("color", { length: 7 }),
  isDefault: boolean("is_default").notNull().default(false),
  parentId: varchar("parent_id"), // For subcategories
  createdBy: varchar("created_by"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Transactions table
export const transactions = pgTable("transactions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  walletId: varchar("wallet_id").notNull(),
  categoryId: varchar("category_id").notNull(),
  type: varchar("type", { length: 20 }).notNull(), // 'income', 'expense'
  amount: decimal("amount", { precision: 12, scale: 2 }).notNull(),
  description: text("description"),
  date: timestamp("date").notNull(),
  receipt: varchar("receipt"), // URL to receipt image
  tags: jsonb("tags"), // Array of tag strings
  createdBy: varchar("created_by").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Budgets table
export const budgets = pgTable("budgets", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  walletId: varchar("wallet_id").notNull(),
  categoryId: varchar("category_id").notNull(),
  name: varchar("name", { length: 255 }).notNull().default('Budget'),
  description: text("description"),
  amount: decimal("amount", { precision: 12, scale: 2 }).notNull(),
  period: varchar("period", { length: 20 }).notNull(), // 'daily', 'weekly', 'monthly', 'quarterly', 'yearly', 'custom'
  budgetType: varchar("budget_type", { length: 20 }).notNull().default('category'), // 'category', 'detailed', 'mixed'
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date"),
  isActive: boolean("is_active").notNull().default(true),
  createdBy: varchar("created_by").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Budget items table (for detailed item-level budgeting)
export const budgetItems = pgTable("budget_items", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  budgetId: varchar("budget_id").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  unit: varchar("unit", { length: 50 }), // 'kg', 'liters', 'pieces', etc.
  plannedQuantity: decimal("planned_quantity", { precision: 10, scale: 3 }),
  plannedUnitPrice: decimal("planned_unit_price", { precision: 12, scale: 2 }),
  plannedAmount: decimal("planned_amount", { precision: 12, scale: 2 }).notNull(),
  actualQuantity: decimal("actual_quantity", { precision: 10, scale: 3 }).default('0'),
  actualUnitPrice: decimal("actual_unit_price", { precision: 12, scale: 2 }).default('0'),
  actualAmount: decimal("actual_amount", { precision: 12, scale: 2 }).default('0'),
  isPurchased: boolean("is_purchased").notNull().default(false),
  purchaseDate: timestamp("purchase_date"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Wallet invitations table
export const walletInvitations = pgTable("wallet_invitations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  walletId: varchar("wallet_id").notNull(),
  email: varchar("email").notNull(),
  role: varchar("role", { length: 50 }).notNull(),
  invitedBy: varchar("invited_by").notNull(),
  status: varchar("status", { length: 20 }).notNull().default('pending'), // 'pending', 'accepted', 'declined', 'expired'
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Financial goals table
export const goals = pgTable("goals", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  walletId: varchar("wallet_id"), // Optional: can be linked to specific wallet
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  targetAmount: decimal("target_amount", { precision: 12, scale: 2 }).notNull(),
  currentAmount: decimal("current_amount", { precision: 12, scale: 2 }).notNull().default('0.00'),
  targetDate: timestamp("target_date"),
  category: varchar("category", { length: 100 }), // 'emergency_fund', 'vacation', 'house', etc.
  priority: varchar("priority", { length: 20 }).default('medium'), // 'high', 'medium', 'low'
  isActive: boolean("is_active").notNull().default(true),
  achievedAt: timestamp("achieved_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Notifications table
export const notifications = pgTable("notifications", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  type: varchar("type", { length: 50 }).notNull(), // 'budget_alert', 'goal_milestone', 'transaction_anomaly', etc.
  title: varchar("title", { length: 255 }).notNull(),
  message: text("message").notNull(),
  data: jsonb("data"), // Additional structured data
  isRead: boolean("is_read").notNull().default(false),
  priority: varchar("priority", { length: 20 }).default('normal'), // 'high', 'normal', 'low'
  actionUrl: varchar("action_url"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Smart alerts/rules table
export const alerts = pgTable("alerts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  walletId: varchar("wallet_id"),
  name: varchar("name", { length: 255 }).notNull(),
  type: varchar("type", { length: 50 }).notNull(), // 'spending_limit', 'budget_threshold', 'unusual_activity', etc.
  conditions: jsonb("conditions").notNull(), // Rule conditions as JSON
  actions: jsonb("actions").notNull(), // Actions to take as JSON
  isActive: boolean("is_active").notNull().default(true),
  lastTriggered: timestamp("last_triggered"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Reports table for custom reports
export const reports = pgTable("reports", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  type: varchar("type", { length: 50 }).notNull(), // 'spending', 'income', 'budget', 'custom'
  config: jsonb("config").notNull(), // Report configuration as JSON
  schedule: jsonb("schedule"), // For scheduled reports
  lastGenerated: timestamp("last_generated"),
  isPublic: boolean("is_public").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// User preferences table
export const userPreferences = pgTable("user_preferences", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().unique(),
  currency: varchar("currency", { length: 3 }).default('USD'),
  timezone: varchar("timezone", { length: 50 }).default('UTC'),
  dateFormat: varchar("date_format", { length: 20 }).default('YYYY-MM-DD'),
  language: varchar("language", { length: 10 }).default('en'),
  theme: varchar("theme", { length: 20 }).default('light'), // 'light', 'dark', 'auto'
  aiPreferences: jsonb("ai_preferences"), // AI/ML settings
  notificationPreferences: jsonb("notification_preferences"),
  privacySettings: jsonb("privacy_settings"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ one, many }) => ({
  walletMembers: many(walletMembers),
  transactions: many(transactions),
  budgets: many(budgets),
  categories: many(categories),
  invitations: many(walletInvitations),
  goals: many(goals),
  notifications: many(notifications),
  alerts: many(alerts),
  reports: many(reports),
  preferences: one(userPreferences),
}));

export const walletsRelations = relations(wallets, ({ one, many }) => ({
  creator: one(users, {
    fields: [wallets.createdBy],
    references: [users.id],
  }),
  members: many(walletMembers),
  transactions: many(transactions),
  budgets: many(budgets),
  invitations: many(walletInvitations),
}));

export const walletMembersRelations = relations(walletMembers, ({ one }) => ({
  wallet: one(wallets, {
    fields: [walletMembers.walletId],
    references: [wallets.id],
  }),
  user: one(users, {
    fields: [walletMembers.userId],
    references: [users.id],
  }),
  invitedByUser: one(users, {
    fields: [walletMembers.invitedBy],
    references: [users.id],
  }),
}));

export const categoriesRelations = relations(categories, ({ one, many }) => ({
  parent: one(categories, {
    fields: [categories.parentId],
    references: [categories.id],
  }),
  children: many(categories),
  creator: one(users, {
    fields: [categories.createdBy],
    references: [users.id],
  }),
  transactions: many(transactions),
  budgets: many(budgets),
}));

export const transactionsRelations = relations(transactions, ({ one }) => ({
  wallet: one(wallets, {
    fields: [transactions.walletId],
    references: [wallets.id],
  }),
  category: one(categories, {
    fields: [transactions.categoryId],
    references: [categories.id],
  }),
  creator: one(users, {
    fields: [transactions.createdBy],
    references: [users.id],
  }),
}));

export const budgetsRelations = relations(budgets, ({ one, many }) => ({
  wallet: one(wallets, {
    fields: [budgets.walletId],
    references: [wallets.id],
  }),
  category: one(categories, {
    fields: [budgets.categoryId],
    references: [categories.id],
  }),
  creator: one(users, {
    fields: [budgets.createdBy],
    references: [users.id],
  }),
  items: many(budgetItems),
}));

export const budgetItemsRelations = relations(budgetItems, ({ one }) => ({
  budget: one(budgets, {
    fields: [budgetItems.budgetId],
    references: [budgets.id],
  }),
}));

export const walletInvitationsRelations = relations(walletInvitations, ({ one }) => ({
  wallet: one(wallets, {
    fields: [walletInvitations.walletId],
    references: [wallets.id],
  }),
  invitedByUser: one(users, {
    fields: [walletInvitations.invitedBy],
    references: [users.id],
  }),
}));

export const goalsRelations = relations(goals, ({ one }) => ({
  user: one(users, {
    fields: [goals.userId],
    references: [users.id],
  }),
  wallet: one(wallets, {
    fields: [goals.walletId],
    references: [wallets.id],
  }),
}));

export const notificationsRelations = relations(notifications, ({ one }) => ({
  user: one(users, {
    fields: [notifications.userId],
    references: [users.id],
  }),
}));

export const alertsRelations = relations(alerts, ({ one }) => ({
  user: one(users, {
    fields: [alerts.userId],
    references: [users.id],
  }),
  wallet: one(wallets, {
    fields: [alerts.walletId],
    references: [wallets.id],
  }),
}));

export const reportsRelations = relations(reports, ({ one }) => ({
  user: one(users, {
    fields: [reports.userId],
    references: [users.id],
  }),
}));

export const userPreferencesRelations = relations(userPreferences, ({ one }) => ({
  user: one(users, {
    fields: [userPreferences.userId],
    references: [users.id],
  }),
}));

// Export types
export type User = typeof users.$inferSelect;
export type UpsertUser = typeof users.$inferInsert;
export type Wallet = typeof wallets.$inferSelect;
export type InsertWallet = typeof wallets.$inferInsert;
export type WalletMember = typeof walletMembers.$inferSelect;
export type InsertWalletMember = typeof walletMembers.$inferInsert;
export type Category = typeof categories.$inferSelect;
export type InsertCategory = typeof categories.$inferInsert;
export type Transaction = typeof transactions.$inferSelect;
export type InsertTransaction = typeof transactions.$inferInsert;
export type Budget = typeof budgets.$inferSelect;
export type InsertBudget = typeof budgets.$inferInsert;
export type BudgetItem = typeof budgetItems.$inferSelect;
export type InsertBudgetItem = typeof budgetItems.$inferInsert;
export type WalletInvitation = typeof walletInvitations.$inferSelect;
export type InsertWalletInvitation = typeof walletInvitations.$inferInsert;
export type Goal = typeof goals.$inferSelect;
export type InsertGoal = typeof goals.$inferInsert;
export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = typeof notifications.$inferInsert;
export type Alert = typeof alerts.$inferSelect;
export type InsertAlert = typeof alerts.$inferInsert;
export type Report = typeof reports.$inferSelect;
export type InsertReport = typeof reports.$inferInsert;
export type UserPreferences = typeof userPreferences.$inferSelect;
export type InsertUserPreferences = typeof userPreferences.$inferInsert;

// Composite types for complex queries
export type WalletWithMembers = Wallet & {
  members: (WalletMember & { user: User })[];
  _count: {
    transactions: number;
    members: number;
  };
};

export type WalletMemberWithUser = WalletMember & {
  user: User;
};

export type TransactionWithDetails = Transaction & {
  category: Category;
  wallet: Wallet;
  creator: User;
};

export type GoalWithDetails = Goal & {
  user: User;
  wallet?: Wallet;
};

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertWalletSchema = createInsertSchema(wallets).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertWalletMemberSchema = createInsertSchema(walletMembers).omit({
  id: true,
  joinedAt: true,
});

export const insertCategorySchema = createInsertSchema(categories).omit({
  id: true,
  createdAt: true,
});

export const insertTransactionSchema = createInsertSchema(transactions).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertBudgetSchema = createInsertSchema(budgets).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  amount: z.union([z.string(), z.number()]).transform((val) => String(val)),
});

export const insertBudgetItemSchema = createInsertSchema(budgetItems).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  plannedQuantity: z.union([z.string(), z.number()]).transform((val) => String(val)).optional(),
  plannedUnitPrice: z.union([z.string(), z.number()]).transform((val) => String(val)).optional(),
  plannedAmount: z.union([z.string(), z.number()]).transform((val) => String(val)),
  actualQuantity: z.union([z.string(), z.number()]).transform((val) => String(val)).optional(),
  actualUnitPrice: z.union([z.string(), z.number()]).transform((val) => String(val)).optional(),
  actualAmount: z.union([z.string(), z.number()]).transform((val) => String(val)).optional(),
});

export const insertWalletInvitationSchema = createInsertSchema(walletInvitations).omit({
  id: true,
  createdAt: true,
});

export const insertGoalSchema = createInsertSchema(goals).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertNotificationSchema = createInsertSchema(notifications).omit({
  id: true,
  createdAt: true,
});

export const insertAlertSchema = createInsertSchema(alerts).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertReportSchema = createInsertSchema(reports).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertUserPreferencesSchema = createInsertSchema(userPreferences).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Enhanced insert schemas inferred types  
export type InsertGoalData = z.infer<typeof insertGoalSchema>;
export type InsertNotificationData = z.infer<typeof insertNotificationSchema>;
export type InsertAlertData = z.infer<typeof insertAlertSchema>;
export type InsertReportData = z.infer<typeof insertReportSchema>;
export type InsertUserPreferencesData = z.infer<typeof insertUserPreferencesSchema>;
