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
      const categories = await storage.getUserCategories(userId);
      res.json(categories);
    } catch (error) {
      console.error("Error fetching categories:", error);
      res.status(500).json({ message: "Failed to fetch categories" });
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

  const httpServer = createServer(app);
  return httpServer;
}
