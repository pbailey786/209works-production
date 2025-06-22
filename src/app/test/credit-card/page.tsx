'use client';

import CreditBalanceCard from '@/components/credits/CreditBalanceCard';

export default function TestCreditCardPage() {
  const testCredits = {
    universal: 10,
    total: 15,
    expiringCount: 2,
    expiringDate: '2024-02-15',
    // Legacy fields
    jobPost: 3,
    featuredPost: 1,
    socialGraphic: 1,
  };

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-2xl font-bold mb-6">Credit Balance Card Test</h1>
      
      <div className="max-w-md">
        <CreditBalanceCard
          credits={testCredits}
          hasActiveSubscription={true}
          onAddCredits={() => alert('Add Credits clicked')}
          onSubscribe={() => alert('Subscribe clicked')}
        />
      </div>
    </div>
  );
}
