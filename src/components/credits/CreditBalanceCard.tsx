'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  CreditCard,
  Sparkles,
  TrendingUp,
  Clock,
  Plus,
  History,
  AlertTriangle
} from 'lucide-react';

interface CreditInfo {
  universal?: number;
  total: number;
  expiringCount: number;
  expiringDate?: string;
}

interface CreditTransaction {
  id: string;
  type: string;
  amount: number;
  isUsed: boolean;
  usedAt?: string;
  expiresAt?: string;
  createdAt: string;
  purchase?: {
    tier: string;
    totalAmount: number;
    purchasedAt: string;
  };
  job?: {
    id: string;
    title: string;
    company: string;
  };
}

interface CreditBalanceCardProps {
  credits: CreditInfo;
  hasActiveSubscription: boolean;
  onAddCredits: () => void;
  onSubscribe: () => void;
}

export default function CreditBalanceCard({
  credits,
  hasActiveSubscription,
  onAddCredits,
  onSubscribe,
}: CreditBalanceCardProps) {
  const [creditHistory, setCreditHistory] = useState<CreditTransaction[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    if (activeTab === 'history') {
      loadCreditHistory();
    }
  }, [activeTab]);

  const loadCreditHistory = async () => {
    setIsLoadingHistory(true);
    try {
      const response = await fetch('/api/credits/history');
      if (response.ok) {
        const data = await response.json();
        setCreditHistory(data.history || []);
      }
    } catch (error) {
      console.error('Failed to load credit history:', error);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getCreditTypeLabel = (type: string) => {
    switch (type) {
      case 'universal':
        return 'Universal Credit';
      case 'job_post':
        return 'Job Post (Legacy)';
      case 'featured_post':
        return 'Featured (Legacy)';
      case 'social_graphic':
        return 'Social (Legacy)';
      default:
        return type;
    }
  };

  const getStatusBadge = (transaction: CreditTransaction) => {
    if (transaction.isUsed) {
      return <Badge variant="default" className="bg-green-100 text-green-800">Used</Badge>;
    }
    
    if (transaction.expiresAt && new Date(transaction.expiresAt) < new Date()) {
      return <Badge variant="destructive">Expired</Badge>;
    }
    
    return <Badge variant="secondary">Available</Badge>;
  };

  return (
    <Card className={`${
      credits.total > 0
        ? 'border-[#9fdf9f]/50 bg-gradient-to-r from-[#9fdf9f]/20 to-[#2d4a3e]/10'
        : 'border-gray-200 bg-white'
    }`}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <div className={`mr-4 flex h-12 w-12 items-center justify-center rounded-lg ${
              credits.total > 0 ? 'bg-[#9fdf9f]/30' : 'bg-[#ff6b35]/10'
            }`}>
              <Sparkles className={`h-6 w-6 ${
                credits.total > 0 ? 'text-[#2d4a3e]' : 'text-[#ff6b35]'
              }`} />
            </div>
            <div>
              <CardTitle className="text-2xl font-bold text-gray-900">
                {credits.total}
              </CardTitle>
              <CardDescription className={`${
                credits.total > 0 ? 'text-[#2d4a3e]' : 'text-gray-600'
              }`}>
                Total Credits {credits.total > 0 ? '✨' : ''}
              </CardDescription>
            </div>
          </div>
          
          {hasActiveSubscription ? (
            <Button
              onClick={onAddCredits}
              className="bg-[#2d4a3e] hover:bg-[#1d3a2e]"
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Credits
            </Button>
          ) : (
            <Button
              onClick={onSubscribe}
              className="bg-[#ff6b35] hover:bg-[#e55a2b]"
            >
              <CreditCard className="mr-2 h-4 w-4" />
              Subscribe
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="history">
              <History className="mr-2 h-4 w-4" />
              History
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            {/* Unified Credit Display */}
            <div className="text-center p-6 bg-gradient-to-r from-blue-50 to-green-50 rounded-lg border border-blue-200">
              <div className="text-4xl font-bold text-[#2d4a3e] mb-2">{credits.total}</div>
              <div className="text-lg font-medium text-gray-700 mb-1">Universal Credits</div>
              <div className="text-sm text-gray-600">Use for any feature: job posts, featured listings, social graphics, and more</div>
            </div>

            {/* Unified Credit System - No Legacy Breakdown */}

            {/* Expiration Warning */}
            {credits.expiringCount > 0 && credits.expiringDate && (
              <div className="flex items-center rounded-lg bg-orange-50 border border-orange-200 p-3">
                <AlertTriangle className="h-5 w-5 text-orange-500 mr-3" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-orange-800">
                    {credits.expiringCount} credits expiring soon
                  </p>
                  <p className="text-xs text-orange-600">
                    Expires on {formatDate(credits.expiringDate)}
                  </p>
                </div>
              </div>
            )}

            {/* Quick Stats */}
            <div className="grid grid-cols-2 gap-4 pt-4 border-t">
              <div className="flex items-center">
                <TrendingUp className="h-4 w-4 text-green-500 mr-2" />
                <div>
                  <div className="text-sm font-medium">Active Credits</div>
                  <div className="text-xs text-gray-600">{credits.total} available</div>
                </div>
              </div>
              <div className="flex items-center">
                <Clock className="h-4 w-4 text-blue-500 mr-2" />
                <div>
                  <div className="text-sm font-medium">Valid Period</div>
                  <div className="text-xs text-gray-600">30-60 days</div>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="history" className="space-y-4">
            {isLoadingHistory ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#2d4a3e] mx-auto"></div>
                <p className="mt-2 text-sm text-gray-600">Loading credit history...</p>
              </div>
            ) : creditHistory.length === 0 ? (
              <div className="text-center py-8">
                <History className="mx-auto h-12 w-12 text-gray-400" />
                <h4 className="mt-4 text-lg font-medium text-gray-900">
                  No credit history yet
                </h4>
                <p className="mt-2 text-sm text-gray-600">
                  Your credit transactions will appear here once you make a purchase.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Type</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Used For</TableHead>
                      <TableHead>Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {creditHistory.slice(0, 10).map((transaction) => (
                      <TableRow key={transaction.id}>
                        <TableCell>
                          <div className="font-medium">
                            {getCreditTypeLabel(transaction.type)}
                          </div>
                          {transaction.purchase && (
                            <div className="text-xs text-gray-500">
                              From {transaction.purchase.tier.replace('_', ' ')} plan
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(transaction)}
                        </TableCell>
                        <TableCell>
                          {transaction.job ? (
                            <div>
                              <div className="font-medium text-sm">{transaction.job.title}</div>
                              <div className="text-xs text-gray-500">{transaction.job.company}</div>
                            </div>
                          ) : (
                            <span className="text-gray-400">—</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            {formatDate(transaction.usedAt || transaction.createdAt)}
                          </div>
                          {transaction.expiresAt && !transaction.isUsed && (
                            <div className="text-xs text-gray-500">
                              Expires {formatDate(transaction.expiresAt)}
                            </div>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                
                {creditHistory.length > 10 && (
                  <div className="text-center">
                    <Button variant="outline" size="sm">
                      View All History
                    </Button>
                  </div>
                )}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
