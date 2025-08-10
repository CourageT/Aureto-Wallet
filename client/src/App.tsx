import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";

import { useAuth } from "@/hooks/useAuth";
import Landing from "@/pages/landing";
import Dashboard from "@/pages/dashboard";
import Wallets from "@/pages/wallets";
import Transactions from "@/pages/transactions";
import Goals from "@/pages/goals";
import Analytics from "@/pages/analytics";
import Reports from "@/pages/reports";
import Budgets from "@/pages/budgets";
import HouseholdBudgets from "@/pages/household-budgets";
import Team from "@/pages/team";
import Settings from "@/pages/settings";
import NotFound from "@/pages/not-found";

function Router() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary-200 border-t-primary-500 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-500">Loading application...</p>
        </div>
      </div>
    );
  }

  return (
    <Switch>
      {!isAuthenticated ? (
        <Route path="/" component={Landing} />
      ) : (
        <>
          <Route path="/" component={Dashboard} />
          <Route path="/dashboard" component={Dashboard} />
          <Route path="/wallets" component={Wallets} />
          <Route path="/transactions" component={Transactions} />
          <Route path="/goals" component={Goals} />
          <Route path="/analytics" component={Analytics} />
          <Route path="/reports" component={Reports} />
          <Route path="/budgets" component={Budgets} />
          <Route path="/household-budgets" component={HouseholdBudgets} />
          <Route path="/team" component={Team} />
          <Route path="/settings" component={Settings} />
        </>
      )}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Toaster />
      <Router />
    </QueryClientProvider>
  );
}

export default App;
