import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import {
  insertWalletSchema,
  insertTransactionSchema,
  insertCategorySchema,
  insertBudgetSchema,
  insertWalletInvitationSchema,
  insertGoalSchema,
  insertUserPreferencesSchema,
} from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Seed default categories
  app.post('/api/seed-categories', isAuthenticated, async (req: any, res) => {
    try {
      const defaultCategories = [
        { name: 'Housing', icon: 'home', color: '#3B82F6', isDefault: true },
        { name: 'Food & Dining', icon: 'shopping-cart', color: '#EF4444', isDefault: true },
        { name: 'Transportation', icon: 'car', color: '#10B981', isDefault: true },
        { name: 'Healthcare', icon: 'heart', color: '#F59E0B', isDefault: true },
        { name: 'Entertainment', icon: 'film', color: '#8B5CF6', isDefault: true },
        { name: 'Personal Care', icon: 'user', color: '#06B6D4', isDefault: true },
        { name: 'Education', icon: 'book', color: '#84CC16', isDefault: true },
        { name: 'Miscellaneous', icon: 'more-horizontal', color: '#6B7280', isDefault: true },
      ];

      for (const category of defaultCategories) {
        await storage.createCategory(category);
      }

      res.json({ message: 'Default categories created successfully' });
    } catch (error) {
      console.error("Error seeding categories:", error);
      res.status(500).json({ message: "Failed to seed categories" });
    }
  });

  // Wallet routes
  app.get('/api/wallets', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const wallets = await storage.getUserWallets(userId);
      res.json(wallets);
    } catch (error) {
      console.error("Error fetching wallets:", error);
      res.status(500).json({ message: "Failed to fetch wallets" });
    }
  });

  app.post('/api/wallets', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const walletData = insertWalletSchema.parse({
        ...req.body,
        createdBy: userId,
      });

      const wallet = await storage.createWallet(walletData);
      res.status(201).json(wallet);
    } catch (error) {
      console.error("Error creating wallet:", error);
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid wallet data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to create wallet" });
      }
    }
  });

  app.get('/api/wallets/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const walletId = req.params.id;

      // Check if user has access to this wallet
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

  app.put('/api/wallets/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const walletId = req.params.id;

      // Check if user has permission to edit
      const member = await storage.getWalletMember(walletId, userId);
      if (!member || !['owner', 'manager'].includes(member.role)) {
        return res.status(403).json({ message: "Insufficient permissions" });
      }

      const updates = insertWalletSchema.partial().parse(req.body);
      const wallet = await storage.updateWallet(walletId, updates);
      res.json(wallet);
    } catch (error) {
      console.error("Error updating wallet:", error);
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid wallet data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to update wallet" });
      }
    }
  });

  // Transaction routes
  app.get('/api/wallets/:walletId/transactions', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const walletId = req.params.walletId;
      const limit = parseInt(req.query.limit as string) || 50;
      const offset = parseInt(req.query.offset as string) || 0;

      // Check if user has access to this wallet
      const member = await storage.getWalletMember(walletId, userId);
      if (!member) {
        return res.status(403).json({ message: "Access denied" });
      }

      const transactions = await storage.getWalletTransactions(walletId, limit, offset);
      res.json(transactions);
    } catch (error) {
      console.error("Error fetching transactions:", error);
      res.status(500).json({ message: "Failed to fetch transactions" });
    }
  });

  app.post('/api/transactions', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const transactionData = insertTransactionSchema.parse({
        ...req.body,
        createdBy: userId,
        date: req.body.date ? new Date(req.body.date) : new Date(),
      });

      // Check if user has permission to add transactions to this wallet
      const member = await storage.getWalletMember(transactionData.walletId, userId);
      if (!member || !['owner', 'manager', 'contributor'].includes(member.role)) {
        return res.status(403).json({ message: "Insufficient permissions" });
      }

      const transaction = await storage.createTransaction(transactionData);
      res.status(201).json(transaction);
    } catch (error) {
      console.error("Error creating transaction:", error);
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid transaction data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to create transaction" });
      }
    }
  });

  app.get('/api/transactions/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const transactionId = req.params.id;

      const transaction = await storage.getTransaction(transactionId);
      if (!transaction) {
        return res.status(404).json({ message: "Transaction not found" });
      }

      // Check if user has access to this wallet
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

  app.put('/api/transactions/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const transactionId = req.params.id;

      const existingTransaction = await storage.getTransaction(transactionId);
      if (!existingTransaction) {
        return res.status(404).json({ message: "Transaction not found" });
      }

      // Check if user has permission to edit
      const member = await storage.getWalletMember(existingTransaction.walletId, userId);
      if (!member || !['owner', 'manager', 'contributor'].includes(member.role)) {
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
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid transaction data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to update transaction" });
      }
    }
  });

  app.delete('/api/transactions/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const transactionId = req.params.id;

      const existingTransaction = await storage.getTransaction(transactionId);
      if (!existingTransaction) {
        return res.status(404).json({ message: "Transaction not found" });
      }

      // Check if user has permission to delete
      const member = await storage.getWalletMember(existingTransaction.walletId, userId);
      if (!member || !['owner', 'manager'].includes(member.role)) {
        return res.status(403).json({ message: "Insufficient permissions" });
      }

      await storage.deleteTransaction(transactionId);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting transaction:", error);
      res.status(500).json({ message: "Failed to delete transaction" });
    }
  });

  // Category routes
  app.get('/api/categories', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const type = req.query.type as string;
      const categories = await storage.getUserCategories(userId, type);
      res.json(categories);
    } catch (error) {
      console.error("Error fetching categories:", error);
      res.status(500).json({ message: "Failed to fetch categories" });
    }
  });

  // Seed default categories
  app.post('/api/categories/seed', isAuthenticated, async (req: any, res) => {
    try {
      const defaultCategories = [
        // Income categories
        { name: 'Salary', type: 'income', icon: 'fas fa-briefcase', color: '#22c55e', isDefault: true },
        { name: 'Freelance', type: 'income', icon: 'fas fa-laptop', color: '#3b82f6', isDefault: true },
        { name: 'Investment', type: 'income', icon: 'fas fa-chart-line', color: '#8b5cf6', isDefault: true },
        { name: 'Business', type: 'income', icon: 'fas fa-building', color: '#06b6d4', isDefault: true },
        { name: 'Other Income', type: 'income', icon: 'fas fa-plus-circle', color: '#10b981', isDefault: true },
        
        // Expense categories
        { name: 'Food & Dining', type: 'expense', icon: 'fas fa-utensils', color: '#f59e0b', isDefault: true },
        { name: 'Transportation', type: 'expense', icon: 'fas fa-car', color: '#ef4444', isDefault: true },
        { name: 'Shopping', type: 'expense', icon: 'fas fa-shopping-bag', color: '#8b5cf6', isDefault: true },
        { name: 'Entertainment', type: 'expense', icon: 'fas fa-film', color: '#06b6d4', isDefault: true },
        { name: 'Bills & Utilities', type: 'expense', icon: 'fas fa-file-invoice-dollar', color: '#64748b', isDefault: true },
        { name: 'Healthcare', type: 'expense', icon: 'fas fa-heart', color: '#dc2626', isDefault: true },
        { name: 'Education', type: 'expense', icon: 'fas fa-graduation-cap', color: '#7c3aed', isDefault: true },
        { name: 'Travel', type: 'expense', icon: 'fas fa-plane', color: '#059669', isDefault: true },
        { name: 'Home & Garden', type: 'expense', icon: 'fas fa-home', color: '#d97706', isDefault: true },
        { name: 'Personal Care', type: 'expense', icon: 'fas fa-spa', color: '#be185d', isDefault: true },
        { name: 'Other Expenses', type: 'expense', icon: 'fas fa-minus-circle', color: '#6b7280', isDefault: true },
      ];

      await storage.seedDefaultCategories(defaultCategories);
      res.json({ message: "Default categories seeded successfully" });
    } catch (error) {
      console.error("Error seeding categories:", error);
      res.status(500).json({ message: "Failed to seed categories" });
    }
  });

  app.post('/api/categories', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const categoryData = insertCategorySchema.parse({
        ...req.body,
        createdBy: userId,
        isDefault: false,
      });

      const category = await storage.createCategory(categoryData);
      res.status(201).json(category);
    } catch (error) {
      console.error("Error creating category:", error);
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid category data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to create category" });
      }
    }
  });

  // Wallet member routes
  app.get('/api/wallets/:walletId/members', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const walletId = req.params.walletId;

      // Check if user has access to this wallet
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

  app.put('/api/wallets/:walletId/members/:userId/role', isAuthenticated, async (req: any, res) => {
    try {
      const currentUserId = req.user.claims.sub;
      const walletId = req.params.walletId;
      const targetUserId = req.params.userId;
      const { role } = req.body;

      // Check if current user has permission to manage roles
      const currentMember = await storage.getWalletMember(walletId, currentUserId);
      if (!currentMember || !['owner', 'manager'].includes(currentMember.role)) {
        return res.status(403).json({ message: "Insufficient permissions" });
      }

      // Validate role
      const validRoles = ['owner', 'manager', 'contributor', 'viewer'];
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

  app.delete('/api/wallets/:walletId/members/:userId', isAuthenticated, async (req: any, res) => {
    try {
      const currentUserId = req.user.claims.sub;
      const walletId = req.params.walletId;
      const targetUserId = req.params.userId;

      // Check if current user has permission to remove members
      const currentMember = await storage.getWalletMember(walletId, currentUserId);
      if (!currentMember || !['owner', 'manager'].includes(currentMember.role)) {
        return res.status(403).json({ message: "Insufficient permissions" });
      }

      await storage.removeWalletMember(walletId, targetUserId);
      res.status(204).send();
    } catch (error) {
      console.error("Error removing wallet member:", error);
      res.status(500).json({ message: "Failed to remove wallet member" });
    }
  });

  // Invitation routes
  app.post('/api/wallets/:walletId/invitations', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const walletId = req.params.walletId;

      // Check if user has permission to invite
      const member = await storage.getWalletMember(walletId, userId);
      if (!member || !['owner', 'manager'].includes(member.role)) {
        return res.status(403).json({ message: "Insufficient permissions" });
      }

      const invitationData = insertWalletInvitationSchema.parse({
        ...req.body,
        walletId,
        invitedBy: userId,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      });

      const invitation = await storage.createWalletInvitation(invitationData);
      res.status(201).json(invitation);
    } catch (error) {
      console.error("Error creating invitation:", error);
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid invitation data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to create invitation" });
      }
    }
  });

  // Analytics routes
  app.get('/api/wallets/:walletId/summary', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const walletId = req.params.walletId;
      const startDate = new Date(req.query.startDate as string || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000));
      const endDate = new Date(req.query.endDate as string || new Date());

      // Check if user has access to this wallet
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

  app.get('/api/wallets/:walletId/category-spending', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const walletId = req.params.walletId;
      const startDate = new Date(req.query.startDate as string || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000));
      const endDate = new Date(req.query.endDate as string || new Date());

      // Check if user has access to this wallet
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

  // Budget routes
  app.get('/api/wallets/:walletId/budgets', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const walletId = req.params.walletId;

      // Check if user has access to this wallet
      const member = await storage.getWalletMember(walletId, userId);
      if (!member) {
        return res.status(403).json({ message: "Access denied" });
      }

      const budgets = await storage.getWalletBudgets(walletId);
      res.json(budgets);
    } catch (error) {
      console.error("Error fetching budgets:", error);
      res.status(500).json({ message: "Failed to fetch budgets" });
    }
  });

  app.post('/api/budgets', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const budgetData = insertBudgetSchema.parse({
        ...req.body,
        createdBy: userId,
        startDate: new Date(req.body.startDate),
        endDate: req.body.endDate ? new Date(req.body.endDate) : undefined,
      });

      // Check if user has permission to create budgets for this wallet
      const member = await storage.getWalletMember(budgetData.walletId, userId);
      if (!member || !['owner', 'manager'].includes(member.role)) {
        return res.status(403).json({ message: "Insufficient permissions" });
      }

      const budget = await storage.createBudget(budgetData);
      res.status(201).json(budget);
    } catch (error) {
      console.error("Error creating budget:", error);
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid budget data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to create budget" });
      }
    }
  });

  // Enhanced User Management Routes
  // Get current user profile with preferences
  app.get('/api/users/me', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      const preferences = await storage.getUserPreferences(userId);
      
      res.json({
        ...user,
        preferences: preferences || {
          currency: 'USD',
          timezone: 'UTC',
          language: 'en',
          theme: 'light'
        }
      });
    } catch (error) {
      console.error("Error fetching user profile:", error);
      res.status(500).json({ message: "Failed to fetch user profile" });
    }
  });

  // Update user preferences
  app.patch('/api/users/me/preferences', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
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

  // Financial Goals Routes
  app.get('/api/goals', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const goals = await storage.getUserGoals(userId);
      res.json(goals);
    } catch (error) {
      console.error("Error fetching goals:", error);
      res.status(500).json({ message: "Failed to fetch goals" });
    }
  });

  app.post('/api/goals', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      console.log('Creating goal for user:', userId, 'with data:', req.body);
      
      // Parse the target date if provided
      let goalData = {
        ...req.body,
        userId,
      };
      
      if (goalData.targetDate && goalData.targetDate !== null) {
        goalData.targetDate = new Date(goalData.targetDate);
      } else {
        delete goalData.targetDate;
      }

      const parsedData = insertGoalSchema.parse(goalData);
      console.log('Parsed goal data:', parsedData);

      const goal = await storage.createGoal(parsedData);
      console.log('Created goal:', goal);
      
      // Create notification for goal creation (optional, handle gracefully if fails)
      try {
        await storage.createNotification({
          userId,
          type: 'goal_created',
          title: 'Goal Created',
          message: `Your goal "${goal.name}" has been created successfully!`,
          data: { goalId: goal.id },
        });
      } catch (notificationError) {
        console.warn('Failed to create notification for goal creation:', notificationError);
      }

      res.status(201).json(goal);
    } catch (error) {
      console.error("Error creating goal:", error);
      if (error instanceof z.ZodError) {
        res.status(400).json({ 
          message: "Invalid goal data", 
          errors: error.errors,
          details: error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ')
        });
      } else {
        res.status(500).json({ 
          message: "Failed to create goal",
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }
  });

  app.get('/api/goals/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
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

  app.put('/api/goals/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
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

  app.delete('/api/goals/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
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

  app.post('/api/goals/:id/contribute', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
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
        currentAmount: newAmount.toString(),
      });

      // Check if goal is achieved
      if (newAmount >= parseFloat(goal.targetAmount) && !goal.achievedAt) {
        await storage.updateGoal(req.params.id, { 
          achievedAt: new Date(),
          isActive: false,
        });
        
        // Create achievement notification (handle gracefully if fails)
        try {
          await storage.createNotification({
            userId,
            type: 'goal_achieved',
            title: 'Goal Achieved! 🎉',
            message: `Congratulations! You've achieved your goal "${goal.name}"!`,
            data: { goalId: goal.id, amount: newAmount },
            priority: 'high',
          });
        } catch (notificationError) {
          console.warn('Failed to create achievement notification:', notificationError);
        }
      }

      res.json(updatedGoal);
    } catch (error) {
      console.error("Error contributing to goal:", error);
      res.status(500).json({ message: "Failed to contribute to goal" });
    }
  });

  // Notifications Routes
  app.get('/api/notifications', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { page = 1, limit = 20, unreadOnly } = req.query;
      
      const notifications = await storage.getUserNotifications(userId, {
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        unreadOnly: unreadOnly === 'true',
      });
      
      res.json(notifications);
    } catch (error) {
      console.error("Error fetching notifications:", error);
      res.status(500).json({ message: "Failed to fetch notifications" });
    }
  });

  app.patch('/api/notifications/:id/read', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      await storage.markNotificationAsRead(req.params.id, userId);
      res.json({ message: "Notification marked as read" });
    } catch (error) {
      console.error("Error marking notification as read:", error);
      res.status(500).json({ message: "Failed to mark notification as read" });
    }
  });

  // Advanced Analytics Routes
  app.get('/api/reports/financial-summary', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const summary = await storage.getFinancialSummary(userId);
      res.json(summary);
    } catch (error) {
      console.error("Error generating financial summary:", error);
      res.status(500).json({ message: "Failed to generate financial summary" });
    }
  });

  app.get('/api/reports/spending-analysis', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const analysis = await storage.getSpendingAnalysis(userId);
      res.json(analysis);
    } catch (error) {
      console.error("Error generating spending analysis:", error);
      res.status(500).json({ message: "Failed to generate spending analysis" });
    }
  });

  app.get('/api/reports/category-breakdown', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const breakdown = await storage.getCategoryBreakdown(userId);
      res.json(breakdown);
    } catch (error) {
      console.error("Error generating category breakdown:", error);
      res.status(500).json({ message: "Failed to generate category breakdown" });
    }
  });

  // AI-Powered Routes
  app.get('/api/ai/insights', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const insights = await storage.generateAIInsights(userId);
      res.json(insights);
    } catch (error) {
      console.error("Error generating AI insights:", error);
      res.status(500).json({ message: "Failed to generate AI insights" });
    }
  });

  app.get('/api/ai/predictions/spending', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { period = 'next_month' } = req.query;
      const predictions = await storage.predictSpending(userId, period as string);
      res.json(predictions);
    } catch (error) {
      console.error("Error generating spending predictions:", error);
      res.status(500).json({ message: "Failed to generate spending predictions" });
    }
  });

  app.get('/api/ai/recommendations', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const recommendations = await storage.getPersonalizedRecommendations(userId);
      res.json(recommendations);
    } catch (error) {
      console.error("Error generating recommendations:", error);
      res.status(500).json({ message: "Failed to generate recommendations" });
    }
  });

  // Additional Budget Management Routes
  app.get('/api/budgets', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const userBudgets = await storage.getUserBudgets(userId);
      res.json(userBudgets);
    } catch (error) {
      console.error("Error fetching user budgets:", error);
      res.status(500).json({ message: "Failed to fetch budgets" });
    }
  });

  app.put('/api/budgets/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const budgetId = req.params.id;
      
      const existingBudget = await storage.getBudget(budgetId);
      if (!existingBudget) {
        return res.status(404).json({ message: "Budget not found" });
      }

      // Check permissions
      const member = await storage.getWalletMember(existingBudget.walletId, userId);
      if (!member || !['owner', 'manager'].includes(member.role)) {
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

  app.delete('/api/budgets/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const budgetId = req.params.id;
      
      const existingBudget = await storage.getBudget(budgetId);
      if (!existingBudget) {
        return res.status(404).json({ message: "Budget not found" });
      }

      // Check permissions
      const member = await storage.getWalletMember(existingBudget.walletId, userId);
      if (!member || !['owner', 'manager'].includes(member.role)) {
        return res.status(403).json({ message: "Insufficient permissions" });
      }

      await storage.deleteBudget(budgetId);
      res.json({ message: "Budget deleted successfully" });
    } catch (error) {
      console.error("Error deleting budget:", error);
      res.status(500).json({ message: "Failed to delete budget" });
    }
  });



  const httpServer = createServer(app);
  return httpServer;
}
