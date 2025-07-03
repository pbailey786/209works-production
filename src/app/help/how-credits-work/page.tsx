'use client';

export default function HowCreditsWorkPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="mx-auto max-w-4xl px-4">
        <h1 className="text-3xl font-bold text-[#2d4a3e] mb-8">How Credits Work</h1>
        
        <div className="bg-white rounded-lg p-8 shadow-sm">
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">💳 What are Credits?</h2>
              <p className="text-gray-600">
                Credits are our simple, flexible payment system. One credit equals one job posting. 
                No hidden fees, no complicated pricing - just straightforward hiring.
              </p>
            </div>
            
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">⏰ Do Credits Expire?</h2>
              <p className="text-gray-600">
                No! Your credits never expire. Buy them when you need them, use them when you're ready to hire.
              </p>
            </div>
            
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">📈 Subscription vs Credit Packs</h2>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-gray-600 mb-3">
                  <strong>Monthly Subscriptions:</strong> Get regular credits every month. Perfect for businesses with ongoing hiring needs.
                </p>
                <p className="text-gray-600">
                  <strong>Credit Packs:</strong> One-time purchases for additional credits. Great for seasonal hiring or when you need extra posts.
                </p>
              </div>
            </div>
            
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">🎯 Best Value</h2>
              <p className="text-gray-600">
                The 5-credit pack saves you $46 compared to buying individual credits ($199 vs $245). 
                Pro subscription offers the best per-credit rate at $33.25 per credit.
              </p>
            </div>
          </div>
          
          <div className="mt-8 text-center">
            <button 
              onClick={() => window.close()}
              className="px-6 py-2 bg-[#2d4a3e] text-white rounded-lg hover:bg-[#1d3a2e] transition-colors"
            >
              Got it!
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}