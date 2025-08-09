import type { Express } from "express";
import { storage } from "./storage";
import { isAuthenticated } from "./replitAuth";
import {
  insertGoalSchema,
  insertNotificationSchema,
  insertAlertSchema,
  insertReportSchema,
  insertUserPreferencesSchema,
  type Goal,
  type Notification,
  type Alert,
  type Report,
  type UserPreferences,
} from "@shared/schema";
import { z } from "zod";

// Enhanced User Management Routes
export function setupUserRoutes(app: Express) {
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

  // Update user profile
  app.patch('/api/users/me', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const updates = req.body;
      
      // Update basic user info if provided
      if (updates.firstName || updates.lastName || updates.email) {
        await storage.updateUser(userId, {
          firstName: updates.firstName,
          lastName: updates.lastName,
          email: updates.email,
        });
      }

      const updatedUser = await storage.getUser(userId);
      res.json(updatedUser);
    } catch (error) {
      console.error("Error updating user profile:", error);
      res.status(500).json({ message: "Failed to update user profile" });
    }
  });

  // Get user preferences
  app.get('/api/users/me/preferences', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const preferences = await storage.getUserPreferences(userId);
      
      res.json(preferences || {
        currency: 'USD',
        timezone: 'UTC',
        language: 'en',
        theme: 'light',
        aiPreferences: { categorization: true, insights: true },
        notificationPreferences: { email: true, push: true },
        privacySettings: { analytics: true, dataSharing: false }
      });
    } catch (error) {
      console.error("Error fetching user preferences:", error);
      res.status(500).json({ message: "Failed to fetch user preferences" });
    }
  });

  // Update user preferences
  app.patch('/api/users/me/preferences', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const preferences = insertUserPreferencesSchema.parse({
        userId,
        ...req.body
      });
      
      const updatedPreferences = await storage.upsertUserPreferences(userId, preferences);
      res.json(updatedPreferences);
    } catch (error) {
      console.error("Error updating user preferences:", error);
      res.status(400).json({ message: "Invalid preferences data" });
    }
  });
}

// Financial Goals Management Routes
export function setupGoalRoutes(app: Express) {
  // List user goals
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

  // Create financial goal
  app.post('/api/goals', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const goalData = insertGoalSchema.parse({
        ...req.body,
        userId,
      });

      const goal = await storage.createGoal(goalData);
      
      // Create notification for goal creation
      await storage.createNotification({
        userId,
        type: 'goal_created',
        title: 'Goal Created',
        message: `Your goal "${goal.name}" has been created successfully!`,
        data: { goalId: goal.id },
      });

      res.json(goal);
    } catch (error) {
      console.error("Error creating goal:", error);
      res.status(400).json({ message: "Failed to create goal" });
    }
  });

  // Get goal details
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

  // Update goal
  app.patch('/api/goals/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const goal = await storage.getGoal(req.params.id);
      
      if (!goal || goal.userId !== userId) {
        return res.status(404).json({ message: "Goal not found" });
      }

      const updates = req.body;
      const updatedGoal = await storage.updateGoal(req.params.id, updates);
      res.json(updatedGoal);
    } catch (error) {
      console.error("Error updating goal:", error);
      res.status(500).json({ message: "Failed to update goal" });
    }
  });

  // Delete goal
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

  // Contribute to goal
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
        updatedAt: new Date(),
      });

      // Check if goal is achieved
      if (newAmount >= parseFloat(goal.targetAmount) && !goal.achievedAt) {
        await storage.updateGoal(req.params.id, { 
          achievedAt: new Date(),
          isActive: false,
        });
        
        // Create achievement notification
        await storage.createNotification({
          userId,
          type: 'goal_achieved',
          title: 'Goal Achieved! 🎉',
          message: `Congratulations! You've achieved your goal "${goal.name}"!`,
          data: { goalId: goal.id, amount: newAmount },
          priority: 'high',
        });
      }

      res.json(updatedGoal);
    } catch (error) {
      console.error("Error contributing to goal:", error);
      res.status(500).json({ message: "Failed to contribute to goal" });
    }
  });
}

// Advanced Budget Management Routes
export function setupEnhancedBudgetRoutes(app: Express) {
  // AI Budget Suggestions
  app.post('/api/budgets/ai-suggestions', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { walletId } = req.body;
      
      // Get recent transaction patterns for AI analysis
      const recentTransactions = await storage.getWalletTransactions(walletId, {
        limit: 100,
        days: 90
      });
      
      // Simple AI-like budget suggestions based on spending patterns
      const categoryTotals = recentTransactions.reduce((acc: any, tx) => {
        const category = tx.category.name;
        if (!acc[category]) acc[category] = 0;
        acc[category] += parseFloat(tx.amount);
        return acc;
      }, {});

      const suggestions = Object.entries(categoryTotals).map(([category, total]: [string, any]) => ({
        category,
        suggestedAmount: Math.ceil(total * 1.1), // 10% buffer
        reasoning: `Based on your average spending of $${(total/3).toFixed(2)} per month`,
      }));

      res.json({ suggestions });
    } catch (error) {
      console.error("Error generating budget suggestions:", error);
      res.status(500).json({ message: "Failed to generate budget suggestions" });
    }
  });

  // Budget Health Check
  app.get('/api/budgets/health-check', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const userWallets = await storage.getUserWallets(userId);
      
      let totalBudgets = 0;
      let exceededBudgets = 0;
      let healthScore = 100;
      
      for (const wallet of userWallets) {
        const budgets = await storage.getWalletBudgets(wallet.id);
        totalBudgets += budgets.length;
        
        for (const budget of budgets) {
          // Check if budget is exceeded
          const spent = await storage.getBudgetSpent(budget.id);
          if (spent > parseFloat(budget.amount)) {
            exceededBudgets++;
            healthScore -= 20;
          }
        }
      }

      res.json({
        healthScore: Math.max(0, healthScore),
        totalBudgets,
        exceededBudgets,
        status: healthScore > 80 ? 'excellent' : healthScore > 60 ? 'good' : 'needs_attention',
      });
    } catch (error) {
      console.error("Error checking budget health:", error);
      res.status(500).json({ message: "Failed to check budget health" });
    }
  });
}

// Notifications & Alerts Routes
export function setupNotificationRoutes(app: Express) {
  // Get user notifications
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

  // Mark notification as read
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

  // Bulk mark as read
  app.post('/api/notifications/bulk-read', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { notificationIds } = req.body;
      
      await storage.bulkMarkNotificationsAsRead(notificationIds, userId);
      res.json({ message: "Notifications marked as read" });
    } catch (error) {
      console.error("Error bulk marking notifications:", error);
      res.status(500).json({ message: "Failed to mark notifications as read" });
    }
  });

  // Delete notification
  app.delete('/api/notifications/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      await storage.deleteNotification(req.params.id, userId);
      res.json({ message: "Notification deleted successfully" });
    } catch (error) {
      console.error("Error deleting notification:", error);
      res.status(500).json({ message: "Failed to delete notification" });
    }
  });
}

// Advanced Analytics & Insights Routes
export function setupAnalyticsRoutes(app: Express) {
  // Financial Summary Report
  app.get('/api/reports/financial-summary', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { period = 'monthly', walletId } = req.query;
      
      const summary = await storage.getFinancialSummary(userId, {
        period: period as string,
        walletId: walletId as string,
      });
      
      res.json(summary);
    } catch (error) {
      console.error("Error generating financial summary:", error);
      res.status(500).json({ message: "Failed to generate financial summary" });
    }
  });

  // Spending Analysis
  app.get('/api/reports/spending-analysis', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { period = 'monthly', category } = req.query;
      
      const analysis = await storage.getSpendingAnalysis(userId, {
        period: period as string,
        category: category as string,
      });
      
      res.json(analysis);
    } catch (error) {
      console.error("Error generating spending analysis:", error);
      res.status(500).json({ message: "Failed to generate spending analysis" });
    }
  });

  // Category Breakdown
  app.get('/api/reports/category-breakdown', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { walletId, startDate, endDate } = req.query;
      
      const breakdown = await storage.getCategoryBreakdown(userId, {
        walletId: walletId as string,
        startDate: startDate as string,
        endDate: endDate as string,
      });
      
      res.json(breakdown);
    } catch (error) {
      console.error("Error generating category breakdown:", error);
      res.status(500).json({ message: "Failed to generate category breakdown" });
    }
  });

  // Financial Trends
  app.get('/api/reports/trends', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { period = 'monthly', metric = 'spending' } = req.query;
      
      const trends = await storage.getFinancialTrends(userId, {
        period: period as string,
        metric: metric as string,
      });
      
      res.json(trends);
    } catch (error) {
      console.error("Error generating financial trends:", error);
      res.status(500).json({ message: "Failed to generate financial trends" });
    }
  });
}

// AI-Powered Features Routes
export function setupAIRoutes(app: Express) {
  // Get AI insights
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

  // Spending Predictions
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

  // Anomaly Detection
  app.get('/api/ai/anomalies', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const anomalies = await storage.detectAnomalies(userId);
      res.json(anomalies);
    } catch (error) {
      console.error("Error detecting anomalies:", error);
      res.status(500).json({ message: "Failed to detect anomalies" });
    }
  });

  // Personalized Recommendations
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
}