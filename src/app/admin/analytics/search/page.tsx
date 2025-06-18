import { auth as getServerSession } from "@/auth";
import { redirect } from 'next/navigation';
import { hasPermission, Permission } from '@/lib/rbac/permissions';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Search, 
  TrendingUp, 
  TrendingDown,
  MessageSquare,
  Target,
  Users,
  Clock,
  BarChart3,
  Filter,
  Eye
} from 'lucide-react';
import type { Session } from 'next-auth';

export const metadata = {
  title: 'Search Analytics | Admin Dashboard',
  description: 'Track search behavior and JobsGPT usage analytics',
};

export default async function SearchAnalyticsPage() {
  const session = await getServerSession() as Session | null;

  // Check authentication and permissions
  if (!session) {
    redirect('/signin?redirect=/admin/analytics/search');
  }

  const userRole = session!.user?.role || 'guest';
  if (!hasPermission(userRole, Permission.VIEW_ANALYTICS)) {
    redirect('/admin');
  }

  // Mock search analytics data (replace with real analytics)
  const searchData = {
    overview: {
      totalSearches: 15420,
      uniqueSearchers: 3892,
      avgSearchesPerUser: 3.96,
      searchSuccessRate: 78.5, // percentage of searches that led to job views
      jobsGptSessions: 2340,
      avgSessionLength: 12.5, // minutes
      conversionRate: 23.8 // percentage of searches that led to applications
    },
    topSearchTerms: [
      { term: 'software engineer', count: 1245, trend: 'up', change: 15.2, results: 89 },
      { term: 'nurse', count: 987, trend: 'up', change: 8.7, results: 156 },
      { term: 'warehouse', count: 834, trend: 'down', change: -3.4, results: 234 },
      { term: 'customer service', count: 756, trend: 'up', change: 12.1, results: 178 },
      { term: 'teacher', count: 689, trend: 'up', change: 6.8, results: 67 },
      { term: 'manager', count: 623, trend: 'down', change: -1.2, results: 145 },
      { term: 'driver', count: 567, trend: 'up', change: 9.3, results: 203 },
      { term: 'receptionist', count: 445, trend: 'up', change: 18.9, results: 45 },
      { term: 'mechanic', count: 398, trend: 'down', change: -5.7, results: 78 },
      { term: 'sales', count: 356, trend: 'up', change: 7.4, results: 167 }
    ],
    jobsGptQueries: [
      { query: 'What jobs are available for recent graduates?', count: 234, category: 'Career Guidance' },
      { query: 'Show me remote work opportunities', count: 198, category: 'Work Preferences' },
      { query: 'What\'s the average salary for nurses in Stockton?', count: 167, category: 'Salary Inquiry' },
      { query: 'Help me find part-time jobs', count: 145, category: 'Work Schedule' },
      { query: 'What skills do I need for software engineering?', count: 134, category: 'Skill Development' },
      { query: 'Find jobs near me', count: 123, category: 'Location-based' },
      { query: 'What companies are hiring in Modesto?', count: 112, category: 'Company Research' },
      { query: 'How do I write a better resume?', count: 98, category: 'Career Advice' },
      { query: 'What are the best paying jobs in the 209?', count: 87, category: 'Salary Inquiry' },
      { query: 'Show me healthcare jobs', count: 76, category: 'Industry Search' }
    ],
    searchPatterns: {
      byTimeOfDay: [
        { hour: '6 AM', searches: 45 },
        { hour: '7 AM', searches: 89 },
        { hour: '8 AM', searches: 156 },
        { hour: '9 AM', searches: 234 },
        { hour: '10 AM', searches: 289 },
        { hour: '11 AM', searches: 312 },
        { hour: '12 PM', searches: 345 },
        { hour: '1 PM', searches: 298 },
        { hour: '2 PM', searches: 267 },
        { hour: '3 PM', searches: 234 },
        { hour: '4 PM', searches: 198 },
        { hour: '5 PM', searches: 167 }
      ],
      byCategory: [
        { category: 'Healthcare', searches: 2340, percentage: 15.2 },
        { category: 'Technology', searches: 2156, percentage: 14.0 },
        { category: 'Retail', searches: 1890, percentage: 12.3 },
        { category: 'Manufacturing', searches: 1678, percentage: 10.9 },
        { category: 'Education', searches: 1456, percentage: 9.4 },
        { category: 'Transportation', searches: 1234, percentage: 8.0 },
        { category: 'Food Service', searches: 1123, percentage: 7.3 },
        { category: 'Administrative', searches: 987, percentage: 6.4 },
        { category: 'Construction', searches: 856, percentage: 5.6 },
        { category: 'Other', searches: 1700, percentage: 11.0 }
      ]
    },
    noResultsQueries: [
      { query: 'blockchain developer', count: 45, suggestions: ['software developer', 'web developer'] },
      { query: 'marine biologist', count: 23, suggestions: ['environmental scientist', 'research assistant'] },
      { query: 'astronaut', count: 12, suggestions: ['aerospace engineer', 'pilot'] },
      { query: 'video game designer', count: 34, suggestions: ['graphic designer', 'software developer'] },
      { query: 'professional athlete', count: 8, suggestions: ['fitness trainer', 'sports coach'] }
    ]
  };

  const formatPercentage = (value: number) => `${value.toFixed(1)}%`;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Search Analytics</h1>
        <p className="text-muted-foreground">
          Track search behavior, popular queries, and JobsGPT usage patterns
        </p>
      </div>

      {/* Overview Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Searches</CardTitle>
            <Search className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{searchData.overview.totalSearches.toLocaleString()}</div>
            <div className="flex items-center text-xs text-muted-foreground">
              <TrendingUp className="mr-1 h-3 w-3 text-green-500" />
              <span className="text-green-600">+12.5%</span>
              <span className="ml-1">from last month</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Unique Searchers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{searchData.overview.uniqueSearchers.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              {searchData.overview.avgSearchesPerUser.toFixed(1)} searches per user
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Search Success Rate</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatPercentage(searchData.overview.searchSuccessRate)}</div>
            <div className="flex items-center text-xs text-muted-foreground">
              <TrendingUp className="mr-1 h-3 w-3 text-green-500" />
              <span className="text-green-600">+3.2%</span>
              <span className="ml-1">improvement</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">JobsGPT Sessions</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{searchData.overview.jobsGptSessions.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              {searchData.overview.avgSessionLength.toFixed(1)} min avg session
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Additional Metrics */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatPercentage(searchData.overview.conversionRate)}</div>
            <p className="text-xs text-muted-foreground">
              Searches that led to job applications
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Session Length</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{searchData.overview.avgSessionLength} min</div>
            <p className="text-xs text-muted-foreground">
              Average JobsGPT conversation time
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Top Search Terms */}
      <Card>
        <CardHeader>
          <CardTitle>Top Search Terms</CardTitle>
          <CardDescription>Most popular search queries and their trends</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {searchData.topSearchTerms.map((term, index) => (
              <div key={index} className="flex items-center justify-between border rounded-lg p-3">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium text-muted-foreground">#{index + 1}</span>
                  <div>
                    <h3 className="font-medium">"{term.term}"</h3>
                    <p className="text-sm text-muted-foreground">{term.count.toLocaleString()} searches • {term.results} results</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {term.trend === 'up' ? (
                    <TrendingUp className="h-4 w-4 text-green-500" />
                  ) : (
                    <TrendingDown className="h-4 w-4 text-red-500" />
                  )}
                  <span className={`text-sm font-medium ${term.trend === 'up' ? 'text-green-600' : 'text-red-600'}`}>
                    {term.trend === 'up' ? '+' : ''}{term.change}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* JobsGPT Popular Queries */}
      <Card>
        <CardHeader>
          <CardTitle>Popular JobsGPT Queries</CardTitle>
          <CardDescription>Most common AI chat queries and their categories</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {searchData.jobsGptQueries.map((query, index) => (
              <div key={index} className="border rounded-lg p-3">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-medium text-sm">"{query.query}"</h3>
                  <Badge variant="outline" className="ml-2">
                    {query.category}
                  </Badge>
                </div>
                <div className="flex items-center gap-2">
                  <MessageSquare className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">{query.count} times asked</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Search Patterns */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Search by Category</CardTitle>
            <CardDescription>Distribution of searches across job categories</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {searchData.searchPatterns.byCategory.map((category, index) => (
                <div key={index} className="flex items-center justify-between">
                  <span className="text-sm font-medium">{category.category}</span>
                  <div className="flex items-center gap-2">
                    <div className="w-24 bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full" 
                        style={{ width: `${category.percentage}%` }}
                      ></div>
                    </div>
                    <span className="text-sm text-muted-foreground w-12">{category.percentage}%</span>
                    <span className="text-sm font-medium w-16">{category.searches.toLocaleString()}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>No Results Queries</CardTitle>
            <CardDescription>Searches that returned no results</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {searchData.noResultsQueries.map((query, index) => (
                <div key={index} className="border rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-medium text-sm">"{query.query}"</h3>
                    <span className="text-sm text-muted-foreground">{query.count} searches</span>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    <span className="font-medium">Suggestions:</span> {query.suggestions.join(', ')}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
