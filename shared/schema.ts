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
  amount: decimal("amount", { precision: 12, scale: 2 }).notNull(),
  period: varchar("period", { length: 20 }).notNull(), // 'monthly', 'weekly', 'yearly'
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date"),
  isActive: boolean("is_active").notNull().default(true),
  createdBy: varchar("created_by").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
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

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  walletMembers: many(walletMembers),
  transactions: many(transactions),
  budgets: many(budgets),
  categories: many(categories),
  invitations: many(walletInvitations),
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

export const budgetsRelations = relations(budgets, ({ one }) => ({
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
});

export const insertWalletInvitationSchema = createInsertSchema(walletInvitations).omit({
  id: true,
  createdAt: true,
});

// Types
export type UpsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertWallet = z.infer<typeof insertWalletSchema>;
export type Wallet = typeof wallets.$inferSelect;
export type InsertWalletMember = z.infer<typeof insertWalletMemberSchema>;
export type WalletMember = typeof walletMembers.$inferSelect;
export type InsertCategory = z.infer<typeof insertCategorySchema>;
export type Category = typeof categories.$inferSelect;
export type InsertTransaction = z.infer<typeof insertTransactionSchema>;
export type Transaction = typeof transactions.$inferSelect;
export type InsertBudget = z.infer<typeof insertBudgetSchema>;
export type Budget = typeof budgets.$inferSelect;
export type InsertWalletInvitation = z.infer<typeof insertWalletInvitationSchema>;
export type WalletInvitation = typeof walletInvitations.$inferSelect;

// Extended types with relations
export type WalletWithMembers = Wallet & {
  members: (WalletMember & { user: User })[];
  _count?: {
    transactions: number;
    members: number;
  };
};

export type TransactionWithDetails = Transaction & {
  category: Category;
  wallet: Wallet;
  creator: User;
};

export type WalletMemberWithUser = WalletMember & {
  user: User;
};
