import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";

import { AuthProvider } from "@/hooks/use-auth";
import { ProtectedRoute } from "@/lib/protected-route";
import AuthPage from "@/pages/auth-page";
import HomePage from "@/pages/home-page";
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
  return (
    <Switch>
      <Route path="/auth" component={AuthPage} />
      <Route path="/" component={HomePage} />
      <ProtectedRoute path="/dashboard" component={Dashboard} />
      <ProtectedRoute path="/wallets" component={Wallets} />
      <ProtectedRoute path="/transactions" component={Transactions} />
      <ProtectedRoute path="/goals" component={Goals} />
      <ProtectedRoute path="/analytics" component={Analytics} />
      <ProtectedRoute path="/reports" component={Reports} />
      <ProtectedRoute path="/budgets" component={Budgets} />
      <ProtectedRoute path="/household-budgets" component={HouseholdBudgets} />
      <ProtectedRoute path="/team" component={Team} />
      <ProtectedRoute path="/settings" component={Settings} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Toaster />
        <Router />
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
