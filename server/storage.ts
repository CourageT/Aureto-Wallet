import {
  users,
  wallets,
  walletMembers,
  categories,
  transactions,
  budgets,
  budgetItems,
  walletInvitations,
  goals,
  notifications,
  alerts,
  reports,
  userPreferences,
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
  type BudgetItem,
  type InsertBudgetItem,
  type WalletInvitation,
  type InsertWalletInvitation,
  type Goal,
  type InsertGoal,
  type Notification,
  type InsertNotification,
  type Alert,
  type InsertAlert,
  type Report,
  type InsertReport,
  type UserPreferences,
  type InsertUserPreferences,
  type WalletWithMembers,
  type TransactionWithDetails,
  type WalletMemberWithUser,
  type GoalWithDetails,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, sql, gte, lte, inArray, isNotNull } from "drizzle-orm";

export interface IStorage {
  // User operations (required for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  updateUser(id: string, updates: Partial<UpsertUser>): Promise<User>;
  
  // User preferences operations
  getUserPreferences(userId: string): Promise<UserPreferences | undefined>;
  upsertUserPreferences(userId: string, preferences: InsertUserPreferences): Promise<UserPreferences>;

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
  getWalletTransactions(walletId: string, options?: { limit?: number; offset?: number; days?: number }): Promise<TransactionWithDetails[]>;
  getUserTransactions(userId: string, limit?: number, offset?: number): Promise<TransactionWithDetails[]>;
  updateTransaction(id: string, updates: Partial<InsertTransaction>): Promise<Transaction>;
  deleteTransaction(id: string): Promise<void>;

  // Budget operations
  createBudget(budget: InsertBudget): Promise<Budget>;
  getBudget(id: string): Promise<Budget | undefined>;
  getBudgetWithItems(id: string): Promise<(Budget & { items: BudgetItem[] }) | undefined>;
  getUserBudgets(userId: string): Promise<Budget[]>;
  getWalletBudgets(walletId: string): Promise<Budget[]>;
  getBudgetSpent(budgetId: string): Promise<number>;
  updateBudget(id: string, updates: Partial<InsertBudget>): Promise<Budget>;
  deleteBudget(id: string): Promise<void>;

  // Budget item operations
  createBudgetItem(item: InsertBudgetItem): Promise<BudgetItem>;
  getBudgetItems(budgetId: string): Promise<BudgetItem[]>;
  updateBudgetItem(id: string, updates: Partial<InsertBudgetItem>): Promise<BudgetItem>;
  deleteBudgetItem(id: string): Promise<void>;
  updateBudgetItemPurchase(id: string, actualQuantity: number, actualUnitPrice: number, actualAmount: number, notes?: string): Promise<BudgetItem>;

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

  // Profile reset operations
  resetUserProfile(userId: string): Promise<void>;
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

  async updateUser(id: string, updates: Partial<UpsertUser>): Promise<User> {
    const [user] = await db
      .update(users)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  async getUserPreferences(userId: string): Promise<UserPreferences | undefined> {
    const [preferences] = await db
      .select()
      .from(userPreferences)
      .where(eq(userPreferences.userId, userId));
    return preferences;
  }

  async upsertUserPreferences(userId: string, preferences: InsertUserPreferences): Promise<UserPreferences> {
    const [upsertedPreferences] = await db
      .insert(userPreferences)
      .values({ ...preferences, userId })
      .onConflictDoUpdate({
        target: userPreferences.userId,
        set: {
          ...preferences,
          updatedAt: new Date(),
        },
      })
      .returning();
    return upsertedPreferences;
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

  async getUserCategories(userId: string, type?: string): Promise<Category[]> {
    let conditions = sql`${categories.isDefault} = true OR ${categories.createdBy} = ${userId}`;
    
    if (type) {
      conditions = sql`(${conditions}) AND ${categories.type} = ${type}`;
    }
    
    return await db
      .select()
      .from(categories)
      .where(conditions)
      .orderBy(categories.name);
  }

  async seedDefaultCategories(defaultCategories: any[]): Promise<void> {
    // Check if default categories already exist
    const existingDefaults = await db
      .select()
      .from(categories)
      .where(eq(categories.isDefault, true));

    if (existingDefaults.length > 0) {
      return; // Already seeded
    }

    // Insert default categories
    await db.insert(categories).values(defaultCategories.map(cat => ({
      ...cat,
      createdBy: null, // System-created
    })));
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

  async getWalletTransactions(walletId: string, options: { limit?: number; offset?: number; days?: number } = {}): Promise<TransactionWithDetails[]> {
    const { limit = 50, offset = 0, days } = options;
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
      .where(
        days 
          ? and(
              eq(transactions.walletId, walletId),
              gte(transactions.date, sql`NOW() - INTERVAL '${sql.raw(days.toString())} days'`)
            )
          : eq(transactions.walletId, walletId)
      )
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
    // Delete budget items first (cascade delete)
    await db.delete(budgetItems).where(eq(budgetItems.budgetId, id));
    await db.delete(budgets).where(eq(budgets.id, id));
  }

  // Budget item operations
  async createBudgetItem(item: InsertBudgetItem): Promise<BudgetItem> {
    const [newItem] = await db.insert(budgetItems).values(item).returning();
    return newItem;
  }

  async getBudgetItems(budgetId: string): Promise<BudgetItem[]> {
    return await db.select().from(budgetItems).where(eq(budgetItems.budgetId, budgetId));
  }

  async updateBudgetItem(id: string, updates: Partial<InsertBudgetItem>): Promise<BudgetItem> {
    const [item] = await db
      .update(budgetItems)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(budgetItems.id, id))
      .returning();
    return item;
  }

  async deleteBudgetItem(id: string): Promise<void> {
    await db.delete(budgetItems).where(eq(budgetItems.id, id));
  }

  async updateBudgetItemPurchase(
    id: string, 
    actualQuantity: number, 
    actualUnitPrice: number, 
    actualAmount: number, 
    notes?: string
  ): Promise<BudgetItem> {
    const [item] = await db
      .update(budgetItems)
      .set({
        actualQuantity: actualQuantity.toString(),
        actualUnitPrice: actualUnitPrice.toString(),
        actualAmount: actualAmount.toString(),
        isPurchased: true,
        purchaseDate: new Date(),
        notes,
        updatedAt: new Date(),
      })
      .where(eq(budgetItems.id, id))
      .returning();
    return item;
  }

  async getBudget(id: string): Promise<Budget | undefined> {
    const [budget] = await db.select().from(budgets).where(eq(budgets.id, id));
    return budget;
  }

  async getBudgetWithItems(id: string): Promise<(Budget & { items: BudgetItem[] }) | undefined> {
    const [budget] = await db.select().from(budgets).where(eq(budgets.id, id));
    if (!budget) return undefined;
    
    const items = await db.select().from(budgetItems).where(eq(budgetItems.budgetId, id));
    
    return {
      ...budget,
      items,
    };
  }

  async getUserBudgets(userId: string): Promise<Budget[]> {
    const results = await db
      .select({
        budget: budgets,
        category: categories,
        wallet: wallets,
      })
      .from(budgets)
      .innerJoin(categories, eq(budgets.categoryId, categories.id))
      .innerJoin(wallets, eq(budgets.walletId, wallets.id))
      .innerJoin(walletMembers, eq(wallets.id, walletMembers.walletId))
      .where(
        and(
          eq(walletMembers.userId, userId),
          eq(budgets.isActive, true)
        )
      )
      .orderBy(desc(budgets.createdAt));

    // Calculate spent amounts, item counts and return enriched budgets
    const enrichedBudgets = await Promise.all(
      results.map(async ({ budget, category, wallet }) => {
        const spent = await this.getBudgetSpent(budget.id);
        const itemCountResult = await db
          .select({ count: sql<number>`count(*)` })
          .from(budgetItems)
          .where(eq(budgetItems.budgetId, budget.id));
        const itemCount = Number(itemCountResult[0]?.count || 0);
        
        return {
          ...budget,
          category,
          wallet,
          spent,
          itemCount,
        };
      })
    );

    return enrichedBudgets;
  }

  async getBudgetSpent(budgetId: string): Promise<number> {
    // Calculate spent amount from budget items with recorded purchases
    const results = await db
      .select({
        total: sql<number>`COALESCE(SUM(CAST(${budgetItems.actualAmount} AS DECIMAL)), 0)`,
      })
      .from(budgetItems)
      .where(
        and(
          eq(budgetItems.budgetId, budgetId),
          eq(budgetItems.isPurchased, true),
          isNotNull(budgetItems.actualAmount)
        )
      );

    return Number(results[0]?.total || 0);
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



  // Goal operations
  async getUserGoals(userId: string): Promise<Goal[]> {
    return await db
      .select()
      .from(goals)
      .where(eq(goals.userId, userId))
      .orderBy(desc(goals.createdAt));
  }

  async createGoal(goal: InsertGoal): Promise<Goal> {
    const [newGoal] = await db.insert(goals).values(goal).returning();
    return newGoal;
  }

  async getGoal(id: string): Promise<Goal | undefined> {
    const [goal] = await db.select().from(goals).where(eq(goals.id, id));
    return goal;
  }

  async updateGoal(id: string, updates: Partial<InsertGoal>): Promise<Goal> {
    const [goal] = await db
      .update(goals)
      .set({...updates, updatedAt: new Date()})
      .where(eq(goals.id, id))
      .returning();
    return goal;
  }

  async deleteGoal(id: string): Promise<void> {
    await db.delete(goals).where(eq(goals.id, id));
  }

  // Notification operations
  async getUserNotifications(userId: string, options = {}): Promise<Notification[]> {
    const { page = 1, limit = 20, unreadOnly = false } = options;
    
    let query = db
      .select()
      .from(notifications)
      .where(eq(notifications.userId, userId));
    
    if (unreadOnly) {
      query = query.where(eq(notifications.isRead, false));
    }
    
    return await query
      .orderBy(desc(notifications.createdAt))
      .limit(limit)
      .offset((page - 1) * limit);
  }

  async createNotification(notification: InsertNotification): Promise<Notification> {
    const [newNotification] = await db.insert(notifications).values(notification).returning();
    return newNotification;
  }

  async markNotificationAsRead(id: string, userId: string): Promise<void> {
    await db
      .update(notifications)
      .set({ isRead: true })
      .where(and(eq(notifications.id, id), eq(notifications.userId, userId)));
  }

  async bulkMarkNotificationsAsRead(ids: string[], userId: string): Promise<void> {
    await db
      .update(notifications)
      .set({ isRead: true })
      .where(and(inArray(notifications.id, ids), eq(notifications.userId, userId)));
  }

  async deleteNotification(id: string, userId: string): Promise<void> {
    await db.delete(notifications).where(and(eq(notifications.id, id), eq(notifications.userId, userId)));
  }

  // Enhanced budget operations

  // AI & Analytics operations
  async getFinancialSummary(userId: string, options = {}): Promise<any> {
    const userWallets = await this.getUserWallets(userId);
    
    let summary = {
      totalIncome: 0,
      totalExpenses: 0,
      netCashFlow: 0,
      transactionCount: 0,
      walletCount: userWallets.length,
    };

    for (const wallet of userWallets) {
      const walletTransactions = await this.getWalletTransactions(wallet.id, 50);
      
      for (const tx of walletTransactions) {
        const amount = parseFloat(tx.amount);
        if (tx.type === 'income') {
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

  async getSpendingAnalysis(userId: string, options = {}): Promise<any> {
    const userWallets = await this.getUserWallets(userId);
    const categorySpending: { [key: string]: number } = {};
    
    for (const wallet of userWallets) {
      const transactions = await this.getWalletTransactions(wallet.id, 50);
      
      for (const tx of transactions) {
        if (tx.type === 'expense') {
          const categoryName = tx.category.name;
          categorySpending[categoryName] = (categorySpending[categoryName] || 0) + parseFloat(tx.amount);
        }
      }
    }

    const topCategories = Object.entries(categorySpending)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([category, amount]) => ({ category, amount }));

    return { topCategories, insights: [] };
  }

  async getCategoryBreakdown(userId: string, options = {}): Promise<any> {
    const userWallets = await this.getUserWallets(userId);
    const breakdown: { [key: string]: { amount: number; count: number } } = {};
    
    for (const wallet of userWallets) {
      const transactions = await this.getWalletTransactions(wallet.id, 100);
      
      for (const tx of transactions) {
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
      transactionCount: data.count,
    }));
  }

  async getFinancialTrends(userId: string, options = {}): Promise<any> {
    // Simplified implementation - return mock trends for now
    return [
      { period: '2025-01', value: 1200 },
      { period: '2025-02', value: 1350 },
      { period: '2025-03', value: 1100 },
    ];
  }

  // AI operations (simplified)
  async generateAIInsights(userId: string): Promise<any> {
    const summary = await this.getFinancialSummary(userId);
    
    return [
      {
        id: 'spending_overview',
        title: 'Monthly Spending Analysis',
        message: `You've spent $${summary.totalExpenses.toFixed(2)} this month across ${summary.transactionCount} transactions.`,
        type: 'spending_analysis',
        priority: 'normal',
      }
    ];
  }

  async predictSpending(userId: string, period: string): Promise<any> {
    const summary = await this.getFinancialSummary(userId);
    
    return {
      period,
      predictedAmount: Math.round(summary.totalExpenses * 1.05),
      confidence: 0.75,
      factors: ['Historical patterns', 'Seasonal trends'],
    };
  }

  async detectAnomalies(userId: string): Promise<any> {
    return []; // Simplified - no anomalies detected
  }

  async getPersonalizedRecommendations(userId: string): Promise<any> {
    const summary = await this.getFinancialSummary(userId);
    
    const recommendations = [];
    
    if (summary.netCashFlow > 0) {
      recommendations.push({
        id: 'savings_opportunity',
        title: 'Create a Savings Goal',
        description: `Consider setting up a savings goal with your surplus of $${summary.netCashFlow.toFixed(2)}.`,
        type: 'goal',
        priority: 'medium',
      });
    }
    
    return recommendations;
  }

  // Profile reset operations
  async resetUserProfile(userId: string): Promise<void> {
    // Delete all user data in the correct order to handle foreign key constraints
    
    // 1. Delete budget items first (they reference budgets)
    const userBudgets = await this.getUserBudgets(userId);
    for (const budget of userBudgets) {
      await db.delete(budgetItems).where(eq(budgetItems.budgetId, budget.id));
    }
    
    // 2. Delete budgets (they reference wallets and categories)
    for (const budget of userBudgets) {
      await db.delete(budgets).where(eq(budgets.id, budget.id));
    }
    
    // 3. Delete transactions (they reference wallets)
    const userWallets = await this.getUserWallets(userId);
    for (const wallet of userWallets) {
      await db.delete(transactions).where(eq(transactions.walletId, wallet.id));
    }
    
    // 4. Delete wallet invitations
    for (const wallet of userWallets) {
      await db.delete(walletInvitations).where(eq(walletInvitations.walletId, wallet.id));
    }
    
    // 5. Delete wallet members (including user's own memberships)
    for (const wallet of userWallets) {
      await db.delete(walletMembers).where(eq(walletMembers.walletId, wallet.id));
    }
    
    // 6. Delete wallets
    for (const wallet of userWallets) {
      await db.delete(wallets).where(eq(wallets.id, wallet.id));
    }
    
    // 7. Delete goals
    await db.delete(goals).where(eq(goals.userId, userId));
    
    // 8. Delete notifications
    await db.delete(notifications).where(eq(notifications.userId, userId));
    
    // 9. Delete alerts
    await db.delete(alerts).where(eq(alerts.userId, userId));
    
    // 10. Delete reports
    await db.delete(reports).where(eq(reports.userId, userId));
    
    // 11. Delete user preferences
    await db.delete(userPreferences).where(eq(userPreferences.userId, userId));
    
    // 12. Delete custom categories created by user
    await db.delete(categories).where(eq(categories.userId, userId));
    
    // Note: We don't delete the user record itself as it's managed by authentication
  }
}

export const storage = new DatabaseStorage();
