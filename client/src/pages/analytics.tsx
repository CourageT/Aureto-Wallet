import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Sidebar from '@/components/layout/sidebar';
import TopBar from '@/components/layout/topbar';
import MobileNavigation from '@/components/layout/mobile-navigation';
import { 
  BarChart3, 
  Brain, 
  TrendingUp, 
  AlertCircle, 
  DollarSign, 
  Target,
  PieChart,
  Lightbulb,
  Zap,
  Activity
} from 'lucide-react';
import { format } from 'date-fns';

interface FinancialSummary {
  totalIncome: number;
  totalExpenses: number;
  netCashFlow: number;
  transactionCount: number;
  walletCount: number;
}

interface SpendingAnalysis {
  topCategories: { category: string; amount: number }[];
  insights: string[];
}

interface AIInsight {
  id: string;
  title: string;
  message: string;
  type: string;
  priority: 'high' | 'normal' | 'low';
  actionable?: boolean;
}

interface Prediction {
  period: string;
  predictedAmount: number;
  confidence: number;
  factors: string[];
}

interface Recommendation {
  id: string;
  title: string;
  description: string;
  type: string;
  priority: string;
  estimatedSavings?: number;
  estimatedBenefit?: string;
}

export default function Analytics() {
  const { data: financialSummary, isLoading: loadingSummary } = useQuery<FinancialSummary>({
    queryKey: ['/api/reports/financial-summary'],
  });

  const { data: spendingAnalysis, isLoading: loadingAnalysis } = useQuery<SpendingAnalysis>({
    queryKey: ['/api/reports/spending-analysis'],
  });

  const { data: categoryBreakdown, isLoading: loadingBreakdown } = useQuery({
    queryKey: ['/api/reports/category-breakdown'],
  });

  const { data: aiInsights = [], isLoading: loadingInsights } = useQuery<AIInsight[]>({
    queryKey: ['/api/ai/insights'],
  });

  const { data: spendingPrediction, isLoading: loadingPrediction } = useQuery<Prediction>({
    queryKey: ['/api/ai/predictions/spending'],
  });

  const { data: recommendations = [], isLoading: loadingRecommendations } = useQuery<Recommendation[]>({
    queryKey: ['/api/ai/recommendations'],
  });

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'destructive';
      case 'medium': return 'secondary';
      case 'low': return 'outline';
      default: return 'secondary';
    }
  };

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'spending_analysis': return <BarChart3 className="h-5 w-5 text-blue-600" />;
      case 'cash_flow': return <TrendingUp className="h-5 w-5 text-green-600" />;
      case 'budget': return <Target className="h-5 w-5 text-orange-600" />;
      default: return <Lightbulb className="h-5 w-5 text-yellow-600" />;
    }
  };

  return (
    <>
      {/* Mobile Navigation */}
      <MobileNavigation />
      
      <div className="min-h-screen flex bg-gray-50">
        {/* Desktop Sidebar */}
        <div className="hidden md:block">
          <Sidebar />
        </div>
        
        <main className="flex-1 overflow-auto">
          {/* Desktop TopBar */}
          <div className="hidden md:block">
            <TopBar title="Analytics" subtitle="AI-powered insights and financial analytics" />
          </div>
          
          <div className="p-4 md:p-6 pt-20 md:pt-6 pb-24 md:pb-6 space-y-6">
            <div className="hidden md:block">
              <h1 className="text-3xl font-bold">Financial Analytics</h1>
              <p className="text-muted-foreground">AI-powered insights and comprehensive financial analysis</p>
            </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="insights">AI Insights</TabsTrigger>
          <TabsTrigger value="predictions">Predictions</TabsTrigger>
          <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Financial Summary */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Income</CardTitle>
                <TrendingUp className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  ${loadingSummary ? '...' : financialSummary?.totalIncome.toLocaleString() || '0'}
                </div>
                <p className="text-xs text-muted-foreground">
                  This month
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
                <DollarSign className="h-4 w-4 text-red-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">
                  ${loadingSummary ? '...' : financialSummary?.totalExpenses.toLocaleString() || '0'}
                </div>
                <p className="text-xs text-muted-foreground">
                  This month
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Net Cash Flow</CardTitle>
                <Activity className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold ${
                  (financialSummary?.netCashFlow || 0) >= 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  ${loadingSummary ? '...' : financialSummary?.netCashFlow.toLocaleString() || '0'}
                </div>
                <p className="text-xs text-muted-foreground">
                  {(financialSummary?.netCashFlow || 0) >= 0 ? 'Surplus' : 'Deficit'}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Transactions</CardTitle>
                <BarChart3 className="h-4 w-4 text-gray-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {loadingSummary ? '...' : financialSummary?.transactionCount || '0'}
                </div>
                <p className="text-xs text-muted-foreground">
                  This month
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Top Categories */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PieChart className="h-5 w-5" />
                Top Spending Categories
              </CardTitle>
              <CardDescription>Your highest expense categories this month</CardDescription>
            </CardHeader>
            <CardContent>
              {loadingAnalysis ? (
                <div className="text-center py-8">Loading analysis...</div>
              ) : spendingAnalysis?.topCategories.length ? (
                <div className="space-y-4">
                  {spendingAnalysis.topCategories.map((category, index) => (
                    <div key={category.category} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-2 h-2 rounded-full bg-blue-500" />
                        <span className="font-medium">{category.category}</span>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold">${category.amount.toFixed(2)}</div>
                        <div className="text-sm text-muted-foreground">#{index + 1}</div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No spending data available
                </div>
              )}
            </CardContent>
          </Card>

          {/* Category Breakdown */}
          <Card>
            <CardHeader>
              <CardTitle>Category Breakdown</CardTitle>
              <CardDescription>Detailed breakdown of all categories</CardDescription>
            </CardHeader>
            <CardContent>
              {loadingBreakdown ? (
                <div className="text-center py-8">Loading breakdown...</div>
              ) : categoryBreakdown?.length ? (
                <div className="space-y-3">
                  {categoryBreakdown.map((item: any) => (
                    <div key={item.category} className="flex items-center justify-between p-3 rounded-lg border">
                      <div>
                        <div className="font-medium">{item.category}</div>
                        <div className="text-sm text-muted-foreground">
                          {item.transactionCount} transactions
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold">${item.totalAmount.toFixed(2)}</div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No category data available
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="insights" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-5 w-5 text-purple-600" />
                AI-Generated Insights
              </CardTitle>
              <CardDescription>Personalized insights based on your spending patterns</CardDescription>
            </CardHeader>
            <CardContent>
              {loadingInsights ? (
                <div className="text-center py-8">Generating insights...</div>
              ) : aiInsights.length ? (
                <div className="space-y-4">
                  {aiInsights.map((insight) => (
                    <div key={insight.id} className="flex items-start gap-4 p-4 rounded-lg border">
                      <div className="flex-shrink-0">
                        {getInsightIcon(insight.type)}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-semibold">{insight.title}</h3>
                          <Badge variant={getPriorityColor(insight.priority)}>
                            {insight.priority}
                          </Badge>
                        </div>
                        <p className="text-muted-foreground">{insight.message}</p>
                        {insight.actionable && (
                          <Button variant="outline" size="sm" className="mt-2">
                            Take Action
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No insights available yet. Add more transactions to get personalized insights.
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="predictions" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-yellow-600" />
                Spending Predictions
              </CardTitle>
              <CardDescription>AI predictions for your future spending</CardDescription>
            </CardHeader>
            <CardContent>
              {loadingPrediction ? (
                <div className="text-center py-8">Generating predictions...</div>
              ) : spendingPrediction ? (
                <div className="space-y-6">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-blue-600 mb-2">
                      ${spendingPrediction.predictedAmount.toLocaleString()}
                    </div>
                    <div className="text-muted-foreground">
                      Predicted spending for {spendingPrediction.period}
                    </div>
                    <div className="mt-2">
                      <Badge variant="outline">
                        {Math.round(spendingPrediction.confidence * 100)}% confidence
                      </Badge>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-3">Prediction Factors</h4>
                    <div className="space-y-2">
                      {spendingPrediction.factors.map((factor, index) => (
                        <div key={index} className="flex items-center gap-2 text-sm">
                          <div className="w-2 h-2 rounded-full bg-blue-500" />
                          {factor}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No prediction data available yet. Add more transactions to get predictions.
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="recommendations" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5 text-green-600" />
                Personalized Recommendations
              </CardTitle>
              <CardDescription>AI-powered suggestions to improve your finances</CardDescription>
            </CardHeader>
            <CardContent>
              {loadingRecommendations ? (
                <div className="text-center py-8">Generating recommendations...</div>
              ) : recommendations.length ? (
                <div className="space-y-4">
                  {recommendations.map((rec) => (
                    <div key={rec.id} className="p-4 rounded-lg border">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-semibold">{rec.title}</h3>
                        <Badge variant={getPriorityColor(rec.priority)}>
                          {rec.priority}
                        </Badge>
                      </div>
                      <p className="text-muted-foreground mb-3">{rec.description}</p>
                      
                      {rec.estimatedSavings && (
                        <div className="text-sm text-green-600 mb-2">
                          Potential savings: ${rec.estimatedSavings.toLocaleString()}
                        </div>
                      )}
                      
                      {rec.estimatedBenefit && (
                        <div className="text-sm text-blue-600 mb-2">
                          {rec.estimatedBenefit}
                        </div>
                      )}
                      
                      <Button variant="outline" size="sm">
                        Implement Suggestion
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No recommendations available yet. Add more financial data to get personalized suggestions.
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
          </div>
        </main>
      </div>
    </>
  );
}