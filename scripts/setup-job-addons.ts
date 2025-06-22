#!/usr/bin/env tsx

/**
 * Setup Job Post Addons
 *
 * Creates the specific addons for job posting:
 * - Social Media Bump ($29)
 * - Featured Placement ($29)
 * - Bundle Deal ($50)
 * - Additional Job Posts (+3, +5, +10)
 */

import { config } from 'dotenv';
import {
  PrismaClient,
  PricingTier,
  AddOnCategory,
  AddOnType,
  BillingInterval,
  UserRole,
} from '@prisma/client';

// Load environment variables
config({ path: '.env.local' });
config({ path: '.env' });

const prisma = new PrismaClient();

const JOB_ADDONS = [
  // Job Promotion Addons
  {
    id: 'social-media-bump',
    name: 'Social Media Promotion',
    slug: 'social-media-bump',
    description:
      'Promote your job posting across our social media channels (Instagram, X/Twitter) to reach a wider audience of local job seekers.',
    shortDescription: 'Social media promotion for wider reach',
    category: AddOnCategory.marketing,
    type: AddOnType.one_time,
    price: 29.0,
    billingInterval: BillingInterval.one_time,
    currency: 'USD',
    compatibleTiers: [
      PricingTier.basic,
      PricingTier.essential,
      PricingTier.professional,
      PricingTier.enterprise,
      PricingTier.premium,
    ],
    requiredUserRole: [UserRole.employer],
    featuresIncluded: [
      'Instagram story promotion',
      'X/Twitter post promotion',
      'Targeted to 209 area code region',
      'Professional graphics included',
      'Performance analytics',
    ],
    usageLimits: {
      maxUsesPerJob: 1,
      validityDays: 30,
    },
    dependsOnAddOns: [],
    excludesAddOns: ['social-featured-bundle'],
    isPopular: true,
    isActive: true,
    displayOrder: 1,
    badgeText: 'Popular',
  },

  {
    id: 'featured-placement',
    name: 'Featured Job Placement',
    slug: 'featured-placement',
    description:
      'Boost your job posting to the top of search results and featured sections for maximum visibility to job seekers.',
    shortDescription: 'Premium placement in search results',
    category: AddOnCategory.marketing,
    type: AddOnType.one_time,
    price: 29.0,
    billingInterval: BillingInterval.one_time,
    currency: 'USD',
    compatibleTiers: [
      PricingTier.basic,
      PricingTier.essential,
      PricingTier.professional,
      PricingTier.enterprise,
      PricingTier.premium,
    ],
    requiredUserRole: [UserRole.employer],
    featuresIncluded: [
      'Top placement in search results',
      'Featured in job category pages',
      'Priority in email alerts',
      'Enhanced job listing design',
      '7-day featured duration',
    ],
    usageLimits: {
      maxUsesPerJob: 1,
      validityDays: 7,
    },
    dependsOnAddOns: [],
    excludesAddOns: ['social-featured-bundle'],
    isPopular: true,
    isActive: true,
    displayOrder: 2,
    badgeText: 'Recommended',
  },

  {
    id: 'social-featured-bundle',
    name: 'Complete Promotion Bundle',
    slug: 'social-featured-bundle',
    description:
      'Get both social media promotion AND featured placement at a discounted price. Maximum exposure for your job posting.',
    shortDescription: 'Social media + featured placement bundle',
    category: AddOnCategory.marketing,
    type: AddOnType.one_time,
    price: 50.0,
    billingInterval: BillingInterval.one_time,
    currency: 'USD',
    compatibleTiers: [
      PricingTier.basic,
      PricingTier.essential,
      PricingTier.professional,
      PricingTier.enterprise,
      PricingTier.premium,
    ],
    requiredUserRole: [UserRole.employer],
    featuresIncluded: [
      'All social media promotion features',
      'All featured placement features',
      'Save $8 compared to buying separately',
      'Priority customer support',
      'Extended analytics reporting',
    ],
    usageLimits: {
      maxUsesPerJob: 1,
      validityDays: 30,
    },
    dependsOnAddOns: [],
    excludesAddOns: ['social-media-bump', 'featured-placement'],
    isPopular: true,
    isActive: true,
    displayOrder: 0,
    badgeText: 'Best Value',
  },

  // Additional Job Posts
  {
    id: 'extra-jobs-3',
    name: '+3 Additional Job Posts',
    slug: 'extra-jobs-3',
    description:
      'Add 3 more job postings to your account. Perfect for growing businesses with multiple open positions.',
    shortDescription: '3 additional job postings',
    category: AddOnCategory.recruitment_tools,
    type: AddOnType.one_time,
    price: 99.0,
    billingInterval: BillingInterval.one_time,
    currency: 'USD',
    compatibleTiers: [
      PricingTier.basic,
      PricingTier.essential,
      PricingTier.professional,
      PricingTier.enterprise,
      PricingTier.premium,
    ],
    requiredUserRole: [UserRole.employer],
    featuresIncluded: [
      '3 additional job postings',
      'Same features as base plan',
      'No expiration date',
      'Can be used anytime',
    ],
    usageLimits: {
      jobPostsAdded: 3,
      expirationMonths: 12,
    },
    dependsOnAddOns: [],
    excludesAddOns: ['extra-jobs-5', 'extra-jobs-10'],
    isPopular: false,
    isActive: true,
    displayOrder: 3,
    badgeText: null,
  },

  {
    id: 'extra-jobs-5',
    name: '+5 Additional Job Posts',
    slug: 'extra-jobs-5',
    description:
      'Add 5 more job postings to your account. Great value for companies with multiple hiring needs.',
    shortDescription: '5 additional job postings',
    category: AddOnCategory.recruitment_tools,
    type: AddOnType.one_time,
    price: 149.0,
    billingInterval: BillingInterval.one_time,
    currency: 'USD',
    compatibleTiers: [
      PricingTier.basic,
      PricingTier.essential,
      PricingTier.professional,
      PricingTier.enterprise,
      PricingTier.premium,
    ],
    requiredUserRole: [UserRole.employer],
    featuresIncluded: [
      '5 additional job postings',
      'Same features as base plan',
      'No expiration date',
      'Can be used anytime',
      'Better value than +3 pack',
    ],
    usageLimits: {
      jobPostsAdded: 5,
      expirationMonths: 12,
    },
    dependsOnAddOns: [],
    excludesAddOns: ['extra-jobs-3', 'extra-jobs-10'],
    isPopular: true,
    isActive: true,
    displayOrder: 4,
    badgeText: 'Popular',
  },

  {
    id: 'extra-jobs-10',
    name: '+10 Additional Job Posts',
    slug: 'extra-jobs-10',
    description:
      'Add 10 more job postings to your account. Best value for large-scale hiring or staffing agencies.',
    shortDescription: '10 additional job postings',
    category: AddOnCategory.recruitment_tools,
    type: AddOnType.one_time,
    price: 249.0,
    billingInterval: BillingInterval.one_time,
    currency: 'USD',
    compatibleTiers: [
      PricingTier.basic,
      PricingTier.essential,
      PricingTier.professional,
      PricingTier.enterprise,
      PricingTier.premium,
    ],
    requiredUserRole: [UserRole.employer],
    featuresIncluded: [
      '10 additional job postings',
      'Same features as base plan',
      'No expiration date',
      'Can be used anytime',
      'Best value per job post',
      'Priority customer support',
    ],
    usageLimits: {
      jobPostsAdded: 10,
      expirationMonths: 12,
    },
    dependsOnAddOns: [],
    excludesAddOns: ['extra-jobs-3', 'extra-jobs-5'],
    isPopular: false,
    isActive: true,
    displayOrder: 5,
    badgeText: 'Best Value',
  },
];

async function setupJobAddons() {
  console.log('🚀 Setting up job post addons...');

  try {
    // Create or update each addon
    for (const addon of JOB_ADDONS) {
      console.log(`📦 Creating addon: ${addon.name}`);

      await prisma.addOn.upsert({
        where: { id: addon.id },
        update: {
          ...addon,
          updatedAt: new Date(),
        },
        create: {
          ...addon,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      });

      console.log(`✅ ${addon.name} created/updated successfully`);
    }

    console.log('\n🎉 All job post addons have been set up successfully!');
    console.log('\n📋 Summary:');
    console.log('• Social Media Bump: $29');
    console.log('• Featured Placement: $29');
    console.log('• Complete Bundle: $50 (save $8)');
    console.log('• +3 Job Posts: $99');
    console.log('• +5 Job Posts: $149');
    console.log('• +10 Job Posts: $249');
  } catch (error) {
    console.error('❌ Error setting up addons:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the setup
if (require.main === module) {
  setupJobAddons()
    .then(() => {
      console.log('✅ Setup completed successfully');
      process.exit(0);
    })
    .catch(error => {
      console.error('❌ Setup failed:', error);
      process.exit(1);
    });
}

export { setupJobAddons, JOB_ADDONS };
