import { useState } from 'react';
import { Link, useLocation } from 'wouter';
import { 
  Home, 
  CreditCard, 
  Wallet, 
  BarChart3, 
  Settings, 
  Users, 
  Menu,
  X,
  Target,
  FileText
} from 'lucide-react';
import { Button } from '@/components/ui/button';

const navigationItems = [
  { href: '/dashboard', icon: Home, label: 'Dashboard' },
  { href: '/transactions', icon: CreditCard, label: 'Transactions' },
  { href: '/wallets', icon: Wallet, label: 'Wallets' },
  { href: '/goals', icon: Target, label: 'Goals' },
  { href: '/analytics', icon: BarChart3, label: 'Analytics' },
  { href: '/reports', icon: FileText, label: 'Reports' },
  { href: '/team', icon: Users, label: 'Team' },
  { href: '/settings', icon: Settings, label: 'Settings' },
];

export default function MobileNavigation() {
  const [isOpen, setIsOpen] = useState(false);
  const [location] = useLocation();

  const toggleMenu = () => setIsOpen(!isOpen);
  const closeMenu = () => setIsOpen(false);

  return (
    <>
      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-200 mobile-header">
        <div className="flex items-center justify-between px-4 py-3 mobile-safe">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white text-lg font-bold">💰</span>
            </div>
            <h1 className="text-lg font-semibold text-gray-900">SpendWise Pro</h1>
          </div>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleMenu}
            className="touch-friendly"
          >
            {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      {/* Mobile Sidebar Backdrop */}
      {isOpen && (
        <div 
          className="mobile-sidebar-backdrop md:hidden"
          onClick={closeMenu}
        />
      )}

      {/* Mobile Sidebar */}
      <aside className={`mobile-sidebar md:hidden ${!isOpen ? 'closed' : ''}`}>
        <div className="p-4 mobile-header">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center">
              <span className="text-white text-xl">💰</span>
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">SpendWise Pro</h2>
              <p className="text-sm text-gray-500">Expense Tracker</p>
            </div>
          </div>
        </div>

        <nav className="px-4 space-y-1">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            const isActive = location === item.href;
            
            return (
              <Link key={item.href} href={item.href} onClick={closeMenu}>
                <div className={`
                  flex items-center gap-3 px-3 py-3 rounded-lg transition-colors touch-friendly
                  ${isActive 
                    ? 'bg-blue-50 text-blue-700 border-l-4 border-blue-700' 
                    : 'text-gray-700 hover:bg-gray-50'
                  }
                `}>
                  <Icon className={`h-5 w-5 ${isActive ? 'text-blue-700' : 'text-gray-500'}`} />
                  <span className="font-medium">{item.label}</span>
                </div>
              </Link>
            );
          })}
        </nav>

        <div className="mt-8 p-4 border-t border-gray-200">
          <div className="flex items-center gap-3 p-3">
            <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
              <span className="text-gray-600 text-sm">👤</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                Your Account
              </p>
              <p className="text-xs text-gray-500 truncate">
                Manage settings
              </p>
            </div>
          </div>
        </div>
      </aside>

      {/* Bottom Navigation for Mobile */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-200 mobile-bottom">
        <div className="flex justify-around py-2 mobile-safe">
          {navigationItems.slice(0, 4).map((item) => {
            const Icon = item.icon;
            const isActive = location === item.href;
            
            return (
              <Link key={item.href} href={item.href}>
                <div className={`
                  flex flex-col items-center justify-center p-2 min-w-[60px] touch-friendly
                  ${isActive ? 'text-blue-600' : 'text-gray-500'}
                `}>
                  <Icon className="h-5 w-5" />
                  <span className="text-xs mt-1 font-medium">{item.label}</span>
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Spacer for mobile layout */}
      <div className="md:hidden h-16" /> {/* Top spacer */}
      <div className="md:hidden h-20" /> {/* Bottom spacer */}
    </>
  );
}