import {
  users,
  wallets,
  walletMembers,
  categories,
  transactions,
  budgets,
  walletInvitations,
  type User,
  type UpsertUser,
  type Wallet,
  type InsertWallet,
  type WalletMember,
  type InsertWalletMember,
  type Category,
  type InsertCategory,
  type Transaction,
  type InsertTransaction,
  type Budget,
  type InsertBudget,
  type WalletInvitation,
  type InsertWalletInvitation,
  type WalletWithMembers,
  type TransactionWithDetails,
  type WalletMemberWithUser,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, sql, gte, lte, inArray } from "drizzle-orm";

export interface IStorage {
  // User operations (required for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;

  // Wallet operations
  createWallet(wallet: InsertWallet): Promise<Wallet>;
  getWallet(id: string): Promise<Wallet | undefined>;
  getWalletWithMembers(id: string): Promise<WalletWithMembers | undefined>;
  getUserWallets(userId: string): Promise<WalletWithMembers[]>;
  updateWallet(id: string, updates: Partial<InsertWallet>): Promise<Wallet>;
  deleteWallet(id: string): Promise<void>;

  // Wallet member operations
  addWalletMember(member: InsertWalletMember): Promise<WalletMember>;
  getWalletMember(walletId: string, userId: string): Promise<WalletMember | undefined>;
  getWalletMembers(walletId: string): Promise<WalletMemberWithUser[]>;
  updateWalletMemberRole(walletId: string, userId: string, role: string): Promise<WalletMember>;
  removeWalletMember(walletId: string, userId: string): Promise<void>;

  // Category operations
  getCategories(): Promise<Category[]>;
  getUserCategories(userId: string): Promise<Category[]>;
  createCategory(category: InsertCategory): Promise<Category>;
  updateCategory(id: string, updates: Partial<InsertCategory>): Promise<Category>;
  deleteCategory(id: string): Promise<void>;

  // Transaction operations
  createTransaction(transaction: InsertTransaction): Promise<Transaction>;
  getTransaction(id: string): Promise<TransactionWithDetails | undefined>;
  getWalletTransactions(walletId: string, limit?: number, offset?: number): Promise<TransactionWithDetails[]>;
  getUserTransactions(userId: string, limit?: number, offset?: number): Promise<TransactionWithDetails[]>;
  updateTransaction(id: string, updates: Partial<InsertTransaction>): Promise<Transaction>;
  deleteTransaction(id: string): Promise<void>;

  // Budget operations
  createBudget(budget: InsertBudget): Promise<Budget>;
  getWalletBudgets(walletId: string): Promise<Budget[]>;
  updateBudget(id: string, updates: Partial<InsertBudget>): Promise<Budget>;
  deleteBudget(id: string): Promise<void>;

  // Invitation operations
  createWalletInvitation(invitation: InsertWalletInvitation): Promise<WalletInvitation>;
  getWalletInvitations(walletId: string): Promise<WalletInvitation[]>;
  getPendingInvitations(email: string): Promise<WalletInvitation[]>;
  updateInvitationStatus(id: string, status: string): Promise<WalletInvitation>;

  // Analytics operations
  getWalletSummary(walletId: string, startDate: Date, endDate: Date): Promise<{
    totalIncome: number;
    totalExpenses: number;
    balance: number;
    transactionCount: number;
  }>;
  getCategorySpending(walletId: string, startDate: Date, endDate: Date): Promise<{
    categoryId: string;
    categoryName: string;
    totalAmount: number;
    transactionCount: number;
  }[]>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  // Wallet operations
  async createWallet(wallet: InsertWallet): Promise<Wallet> {
    const [newWallet] = await db.insert(wallets).values(wallet).returning();
    
    // Add creator as owner
    await db.insert(walletMembers).values({
      walletId: newWallet.id,
      userId: wallet.createdBy,
      role: 'owner',
    });

    return newWallet;
  }

  async getWallet(id: string): Promise<Wallet | undefined> {
    const [wallet] = await db.select().from(wallets).where(eq(wallets.id, id));
    return wallet;
  }

  async getWalletWithMembers(id: string): Promise<WalletWithMembers | undefined> {
    const wallet = await this.getWallet(id);
    if (!wallet) return undefined;

    const members = await this.getWalletMembers(id);
    const transactionCount = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(transactions)
      .where(eq(transactions.walletId, id));

    return {
      ...wallet,
      members,
      _count: {
        transactions: transactionCount[0]?.count || 0,
        members: members.length,
      },
    };
  }

  async getUserWallets(userId: string): Promise<WalletWithMembers[]> {
    const userMemberships = await db
      .select({
        wallet: wallets,
        member: walletMembers,
      })
      .from(walletMembers)
      .innerJoin(wallets, eq(walletMembers.walletId, wallets.id))
      .where(eq(walletMembers.userId, userId))
      .orderBy(desc(wallets.createdAt));

    const walletIds = userMemberships.map(um => um.wallet.id);
    
    if (walletIds.length === 0) return [];

    // Get all members for these wallets
    const allMembers = await db
      .select({
        member: walletMembers,
        user: users,
      })
      .from(walletMembers)
      .innerJoin(users, eq(walletMembers.userId, users.id))
      .where(inArray(walletMembers.walletId, walletIds));

    // Get transaction counts
    const transactionCounts = await db
      .select({
        walletId: transactions.walletId,
        count: sql<number>`count(*)::int`,
      })
      .from(transactions)
      .where(inArray(transactions.walletId, walletIds))
      .groupBy(transactions.walletId);

    // Group members by wallet
    const membersByWallet = allMembers.reduce((acc, { member, user }) => {
      if (!acc[member.walletId]) acc[member.walletId] = [];
      acc[member.walletId].push({ ...member, user });
      return acc;
    }, {} as Record<string, WalletMemberWithUser[]>);

    const transactionCountsByWallet = transactionCounts.reduce((acc, tc) => {
      acc[tc.walletId] = tc.count;
      return acc;
    }, {} as Record<string, number>);

    return userMemberships.map(({ wallet }) => ({
      ...wallet,
      members: membersByWallet[wallet.id] || [],
      _count: {
        transactions: transactionCountsByWallet[wallet.id] || 0,
        members: membersByWallet[wallet.id]?.length || 0,
      },
    }));
  }

  async updateWallet(id: string, updates: Partial<InsertWallet>): Promise<Wallet> {
    const [wallet] = await db
      .update(wallets)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(wallets.id, id))
      .returning();
    return wallet;
  }

  async deleteWallet(id: string): Promise<void> {
    await db.delete(wallets).where(eq(wallets.id, id));
  }

  // Wallet member operations
  async addWalletMember(member: InsertWalletMember): Promise<WalletMember> {
    const [newMember] = await db.insert(walletMembers).values(member).returning();
    return newMember;
  }

  async getWalletMember(walletId: string, userId: string): Promise<WalletMember | undefined> {
    const [member] = await db
      .select()
      .from(walletMembers)
      .where(and(eq(walletMembers.walletId, walletId), eq(walletMembers.userId, userId)));
    return member;
  }

  async getWalletMembers(walletId: string): Promise<WalletMemberWithUser[]> {
    const members = await db
      .select({
        member: walletMembers,
        user: users,
      })
      .from(walletMembers)
      .innerJoin(users, eq(walletMembers.userId, users.id))
      .where(eq(walletMembers.walletId, walletId));

    return members.map(({ member, user }) => ({ ...member, user }));
  }

  async updateWalletMemberRole(walletId: string, userId: string, role: string): Promise<WalletMember> {
    const [member] = await db
      .update(walletMembers)
      .set({ role })
      .where(and(eq(walletMembers.walletId, walletId), eq(walletMembers.userId, userId)))
      .returning();
    return member;
  }

  async removeWalletMember(walletId: string, userId: string): Promise<void> {
    await db
      .delete(walletMembers)
      .where(and(eq(walletMembers.walletId, walletId), eq(walletMembers.userId, userId)));
  }

  // Category operations
  async getCategories(): Promise<Category[]> {
    return await db.select().from(categories).where(eq(categories.isDefault, true));
  }

  async getUserCategories(userId: string): Promise<Category[]> {
    return await db
      .select()
      .from(categories)
      .where(
        sql`${categories.isDefault} = true OR ${categories.createdBy} = ${userId}`
      )
      .orderBy(categories.name);
  }

  async createCategory(category: InsertCategory): Promise<Category> {
    const [newCategory] = await db.insert(categories).values(category).returning();
    return newCategory;
  }

  async updateCategory(id: string, updates: Partial<InsertCategory>): Promise<Category> {
    const [category] = await db
      .update(categories)
      .set(updates)
      .where(eq(categories.id, id))
      .returning();
    return category;
  }

  async deleteCategory(id: string): Promise<void> {
    await db.delete(categories).where(eq(categories.id, id));
  }

  // Transaction operations
  async createTransaction(transaction: InsertTransaction): Promise<Transaction> {
    const [newTransaction] = await db.insert(transactions).values(transaction).returning();
    
    // Update wallet balance
    const amount = parseFloat(transaction.amount);
    const balanceChange = transaction.type === 'income' ? amount : -amount;
    
    await db
      .update(wallets)
      .set({
        balance: sql`${wallets.balance} + ${balanceChange}`,
        updatedAt: new Date(),
      })
      .where(eq(wallets.id, transaction.walletId));

    return newTransaction;
  }

  async getTransaction(id: string): Promise<TransactionWithDetails | undefined> {
    const [result] = await db
      .select({
        transaction: transactions,
        category: categories,
        wallet: wallets,
        creator: users,
      })
      .from(transactions)
      .innerJoin(categories, eq(transactions.categoryId, categories.id))
      .innerJoin(wallets, eq(transactions.walletId, wallets.id))
      .innerJoin(users, eq(transactions.createdBy, users.id))
      .where(eq(transactions.id, id));

    if (!result) return undefined;

    return {
      ...result.transaction,
      category: result.category,
      wallet: result.wallet,
      creator: result.creator,
    };
  }

  async getWalletTransactions(walletId: string, limit = 50, offset = 0): Promise<TransactionWithDetails[]> {
    const results = await db
      .select({
        transaction: transactions,
        category: categories,
        wallet: wallets,
        creator: users,
      })
      .from(transactions)
      .innerJoin(categories, eq(transactions.categoryId, categories.id))
      .innerJoin(wallets, eq(transactions.walletId, wallets.id))
      .innerJoin(users, eq(transactions.createdBy, users.id))
      .where(eq(transactions.walletId, walletId))
      .orderBy(desc(transactions.date), desc(transactions.createdAt))
      .limit(limit)
      .offset(offset);

    return results.map(result => ({
      ...result.transaction,
      category: result.category,
      wallet: result.wallet,
      creator: result.creator,
    }));
  }

  async getUserTransactions(userId: string, limit = 50, offset = 0): Promise<TransactionWithDetails[]> {
    const results = await db
      .select({
        transaction: transactions,
        category: categories,
        wallet: wallets,
        creator: users,
      })
      .from(transactions)
      .innerJoin(categories, eq(transactions.categoryId, categories.id))
      .innerJoin(wallets, eq(transactions.walletId, wallets.id))
      .innerJoin(users, eq(transactions.createdBy, users.id))
      .where(eq(transactions.createdBy, userId))
      .orderBy(desc(transactions.date), desc(transactions.createdAt))
      .limit(limit)
      .offset(offset);

    return results.map(result => ({
      ...result.transaction,
      category: result.category,
      wallet: result.wallet,
      creator: result.creator,
    }));
  }

  async updateTransaction(id: string, updates: Partial<InsertTransaction>): Promise<Transaction> {
    const [transaction] = await db
      .update(transactions)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(transactions.id, id))
      .returning();
    return transaction;
  }

  async deleteTransaction(id: string): Promise<void> {
    // Get transaction details for balance adjustment
    const [transaction] = await db
      .select()
      .from(transactions)
      .where(eq(transactions.id, id));

    if (transaction) {
      // Reverse the balance change
      const amount = parseFloat(transaction.amount);
      const balanceChange = transaction.type === 'income' ? -amount : amount;
      
      await db
        .update(wallets)
        .set({
          balance: sql`${wallets.balance} + ${balanceChange}`,
          updatedAt: new Date(),
        })
        .where(eq(wallets.id, transaction.walletId));
    }

    await db.delete(transactions).where(eq(transactions.id, id));
  }

  // Budget operations
  async createBudget(budget: InsertBudget): Promise<Budget> {
    const [newBudget] = await db.insert(budgets).values(budget).returning();
    return newBudget;
  }

  async getWalletBudgets(walletId: string): Promise<Budget[]> {
    return await db
      .select()
      .from(budgets)
      .where(and(eq(budgets.walletId, walletId), eq(budgets.isActive, true)));
  }

  async updateBudget(id: string, updates: Partial<InsertBudget>): Promise<Budget> {
    const [budget] = await db
      .update(budgets)
      .set(updates)
      .where(eq(budgets.id, id))
      .returning();
    return budget;
  }

  async deleteBudget(id: string): Promise<void> {
    await db.delete(budgets).where(eq(budgets.id, id));
  }

  // Invitation operations
  async createWalletInvitation(invitation: InsertWalletInvitation): Promise<WalletInvitation> {
    const [newInvitation] = await db.insert(walletInvitations).values(invitation).returning();
    return newInvitation;
  }

  async getWalletInvitations(walletId: string): Promise<WalletInvitation[]> {
    return await db
      .select()
      .from(walletInvitations)
      .where(eq(walletInvitations.walletId, walletId))
      .orderBy(desc(walletInvitations.createdAt));
  }

  async getPendingInvitations(email: string): Promise<WalletInvitation[]> {
    return await db
      .select()
      .from(walletInvitations)
      .where(
        and(
          eq(walletInvitations.email, email),
          eq(walletInvitations.status, 'pending'),
          gte(walletInvitations.expiresAt, new Date())
        )
      );
  }

  async updateInvitationStatus(id: string, status: string): Promise<WalletInvitation> {
    const [invitation] = await db
      .update(walletInvitations)
      .set({ status })
      .where(eq(walletInvitations.id, id))
      .returning();
    return invitation;
  }

  // Analytics operations
  async getWalletSummary(walletId: string, startDate: Date, endDate: Date): Promise<{
    totalIncome: number;
    totalExpenses: number;
    balance: number;
    transactionCount: number;
  }> {
    const results = await db
      .select({
        type: transactions.type,
        totalAmount: sql<number>`sum(${transactions.amount})::numeric`,
        count: sql<number>`count(*)::int`,
      })
      .from(transactions)
      .where(
        and(
          eq(transactions.walletId, walletId),
          gte(transactions.date, startDate),
          lte(transactions.date, endDate)
        )
      )
      .groupBy(transactions.type);

    const summary = {
      totalIncome: 0,
      totalExpenses: 0,
      balance: 0,
      transactionCount: 0,
    };

    results.forEach(result => {
      if (result.type === 'income') {
        summary.totalIncome = parseFloat(result.totalAmount?.toString() || '0');
      } else {
        summary.totalExpenses = parseFloat(result.totalAmount?.toString() || '0');
      }
      summary.transactionCount += result.count;
    });

    summary.balance = summary.totalIncome - summary.totalExpenses;

    return summary;
  }

  async getCategorySpending(walletId: string, startDate: Date, endDate: Date): Promise<{
    categoryId: string;
    categoryName: string;
    totalAmount: number;
    transactionCount: number;
  }[]> {
    const results = await db
      .select({
        categoryId: categories.id,
        categoryName: categories.name,
        totalAmount: sql<number>`sum(${transactions.amount})::numeric`,
        transactionCount: sql<number>`count(*)::int`,
      })
      .from(transactions)
      .innerJoin(categories, eq(transactions.categoryId, categories.id))
      .where(
        and(
          eq(transactions.walletId, walletId),
          eq(transactions.type, 'expense'),
          gte(transactions.date, startDate),
          lte(transactions.date, endDate)
        )
      )
      .groupBy(categories.id, categories.name)
      .orderBy(desc(sql`sum(${transactions.amount})`));

    return results.map(result => ({
      categoryId: result.categoryId,
      categoryName: result.categoryName,
      totalAmount: parseFloat(result.totalAmount?.toString() || '0'),
      transactionCount: result.transactionCount,
    }));
  }
}

export const storage = new DatabaseStorage();
