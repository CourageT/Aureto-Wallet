import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";

const navigation = [
  { name: "Dashboard", href: "/", icon: "fas fa-home" },
  { name: "Wallets", href: "/wallets", icon: "fas fa-wallet" },
  { name: "Transactions", href: "/transactions", icon: "fas fa-exchange-alt" },
  { name: "Goals", href: "/goals", icon: "fas fa-bullseye" },
  { name: "Analytics", href: "/analytics", icon: "fas fa-chart-bar" },
  { name: "Reports", href: "/reports", icon: "fas fa-chart-line" },
  { name: "Budgets", href: "/budgets", icon: "fas fa-calculator" },
  { name: "Team", href: "/team", icon: "fas fa-users" },
  { name: "Settings", href: "/settings", icon: "fas fa-cog" },
];

export default function Sidebar() {
  const [location] = useLocation();
  const { user } = useAuth();

  return (
    <aside className="w-64 bg-white shadow-lg border-r border-gray-200 hidden lg:flex flex-col">
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-primary-500 rounded-lg flex items-center justify-center">
            <i className="fas fa-wallet text-white text-lg"></i>
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">SpendWise Pro</h1>
            <p className="text-sm text-gray-500">Financial Management</p>
          </div>
        </div>
      </div>
      
      <nav className="flex-1 p-4 space-y-2">
        {navigation.map((item) => {
          const isActive = location === item.href;
          return (
            <Link key={item.name} href={item.href}>
              <a className={cn("sidebar-nav-item", isActive && "active")}>
                <i className={`${item.icon} w-5`}></i>
                <span>{item.name}</span>
              </a>
            </Link>
          );
        })}
      </nav>
      
      <div className="p-4 border-t border-gray-200">
        <div className="flex items-center space-x-3 px-4 py-3">
          <img
            src={user?.profileImageUrl || "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face"}
            alt="User avatar"
            className="w-10 h-10 rounded-full object-cover"
          />
          <div>
            <p className="text-sm font-medium text-gray-900">
              {user?.firstName || user?.email || "User"}
            </p>
            <p className="text-xs text-gray-500">Account Owner</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
