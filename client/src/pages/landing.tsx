import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function Landing() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-white">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <div className="flex items-center justify-center space-x-3 mb-6">
            <div className="w-12 h-12 bg-primary-500 rounded-xl flex items-center justify-center">
              <i className="fas fa-wallet text-white text-xl"></i>
            </div>
            <h1 className="text-4xl font-bold text-gray-900">SendWise</h1>
          </div>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            The ultimate collaborative financial management platform for households, families, and teams.
          </p>
          <Button
            onClick={() => window.location.href = '/api/login'}
            className="btn-primary px-8 py-3 text-lg"
          >
            Get Started - Sign In
          </Button>
        </div>

        <div className="grid md:grid-cols-3 gap-8 mb-16">
          <Card>
            <CardHeader>
              <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center mb-4">
                <i className="fas fa-users text-primary-600 text-xl"></i>
              </div>
              <CardTitle>Collaborative Tracking</CardTitle>
              <CardDescription>
                Share wallets with family members, roommates, or team members with role-based permissions.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <div className="w-12 h-12 bg-success-100 rounded-lg flex items-center justify-center mb-4">
                <i className="fas fa-chart-line text-success-600 text-xl"></i>
              </div>
              <CardTitle>Smart Analytics</CardTitle>
              <CardDescription>
                Get insights into your spending patterns with detailed reports and budget tracking.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <div className="w-12 h-12 bg-warning-50 rounded-lg flex items-center justify-center mb-4">
                <i className="fas fa-shield-alt text-warning-500 text-xl"></i>
              </div>
              <CardTitle>Secure & Private</CardTitle>
              <CardDescription>
                Bank-level security with encrypted data and role-based access controls.
              </CardDescription>
            </CardHeader>
          </Card>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-8">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Key Features</h2>
            <p className="text-gray-600">Everything you need to manage your finances collaboratively</p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            <div className="space-y-6">
              <div className="flex items-start space-x-4">
                <div className="w-8 h-8 bg-primary-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <i className="fas fa-wallet text-primary-600"></i>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Multi-Wallet System</h3>
                  <p className="text-gray-600">Create separate wallets for different purposes - household expenses, personal spending, savings goals.</p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <div className="w-8 h-8 bg-primary-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <i className="fas fa-user-cog text-primary-600"></i>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Role-Based Permissions</h3>
                  <p className="text-gray-600">Owner, Manager, Contributor, and Viewer roles with granular access controls.</p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <div className="w-8 h-8 bg-primary-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <i className="fas fa-tags text-primary-600"></i>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Smart Categorization</h3>
                  <p className="text-gray-600">Pre-built categories with the ability to create custom ones for your specific needs.</p>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="flex items-start space-x-4">
                <div className="w-8 h-8 bg-primary-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <i className="fas fa-chart-pie text-primary-600"></i>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Comprehensive Reports</h3>
                  <p className="text-gray-600">Monthly summaries, category breakdowns, and spending trend analysis.</p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <div className="w-8 h-8 bg-primary-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <i className="fas fa-calculator text-primary-600"></i>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Budget Tracking</h3>
                  <p className="text-gray-600">Set budgets for categories and track your progress with visual indicators.</p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <div className="w-8 h-8 bg-primary-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <i className="fas fa-mobile-alt text-primary-600"></i>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Real-time Sync</h3>
                  <p className="text-gray-600">All changes sync instantly across all team members and devices.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
