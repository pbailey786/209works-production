import PlaceholderPage from '@/components/PlaceholderPage';

export default function EmployerReferralPage() {
  return (
    <PlaceholderPage
      title="Referral Program"
      description="Refer other employers to 209jobs and earn valuable rewards! Our referral program helps you save on hiring costs while helping other businesses discover quality talent through our platform."
      icon="🤝"
      quickActions={[
        {
          title: 'Get Referral Link',
          label: 'Get Referral Link',
          description: 'Generate your unique referral link to share',
          icon: '🔗',
          disabled: true,
        },
        {
          title: 'View My Referrals',
          label: 'View My Referrals',
          description: 'Track your referral status and earnings',
          icon: '📊',
          disabled: true,
        },
        {
          title: 'Referral Materials',
          label: 'Referral Materials',
          description: 'Download marketing materials to share',
          icon: '📁',
          disabled: true,
        },
        {
          title: 'Invite via Email',
          label: 'Invite via Email',
          description: 'Send referral invites directly to contacts',
          icon: '📧',
          disabled: true,
        },
      ]}
      sections={[
        {
          title: 'Program Benefits',
          description: 'Rewards and benefits for successful referrals',
          wireframeType: 'cards',
          items: [
            'Free job credits for successful referrals',
            'Bonus credits for multiple referrals',
            'Extended subscription benefits',
            'Priority support access',
            'Exclusive feature previews',
            'Annual referral bonuses',
          ],
        },
        {
          title: 'How It Works',
          description: 'Simple steps to start earning referral rewards',
          wireframeType: 'list',
          items: [
            'Get your unique referral link from your dashboard',
            'Share the link with other employers in your network',
            'Your contact signs up and creates their first job posting',
            'You receive credits once they become a paying customer',
            'Track all your referrals and earnings in real-time',
            'Redeem earned credits for job postings or upgrades',
          ],
        },
        {
          title: 'Referral Tracking Dashboard',
          description: 'Monitor your referral performance and earnings',
          wireframeType: 'table',
          items: [
            'Referee Name',
            'Sign-up Date',
            'Status',
            'Earned Credits',
            'Actions',
          ],
        },
        {
          title: 'Reward Tiers',
          description: 'Different reward levels based on referral activity',
          wireframeType: 'cards',
          items: [
            'Bronze: 1-2 referrals - 5 credits each',
            'Silver: 3-5 referrals - 7 credits each + bonus',
            'Gold: 6-10 referrals - 10 credits each + premium bonus',
            'Platinum: 11+ referrals - 15 credits each + VIP benefits',
          ],
        },
        {
          title: 'Sharing Tools',
          description: 'Tools and materials to help you share effectively',
          wireframeType: 'buttons',
          items: [
            'Copy Referral Link',
            'Share on LinkedIn',
            'Email Template',
            'Social Media Kit',
            'Print Materials',
            'Custom Landing Page',
          ],
        },
        {
          title: 'Referral Analytics',
          description: 'Detailed insights into your referral performance',
          wireframeType: 'chart',
          items: [
            'Total referrals sent vs. successful conversions',
            'Monthly referral activity trends',
            'Credit earnings over time',
            'Most effective sharing channels',
            'Referral conversion rates',
          ],
        },
        {
          title: 'Program Terms',
          description:
            'Important terms and conditions for the referral program',
          wireframeType: 'list',
          items: [
            'Referral credits are non-transferable and expire after 12 months',
            'Referred employers must be new to the platform',
            'Credits are awarded after successful payment processing',
            'Self-referrals and fraudulent activity will void rewards',
            'Program terms may change with 30-day notice',
            'Maximum of 50 referrals per calendar year per account',
          ],
        },
        {
          title: 'Support & Resources',
          description: 'Get help maximizing your referral success',
          wireframeType: 'form',
          items: [
            'Referral Best Practices Guide',
            'Marketing Template Library',
            'Success Stories & Case Studies',
            'Contact Referral Support',
          ],
        },
      ]}
    />
  );
}
