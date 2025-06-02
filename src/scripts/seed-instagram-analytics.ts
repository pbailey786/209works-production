/**
 * Instagram Analytics Demo Data Seeder
 * Creates sample Instagram posts and analytics data for testing the dashboard
 */

import { PrismaClient, InstagramPostType } from '@prisma/client';

const prisma = new PrismaClient();

const samplePosts = [
  {
    caption: "🚀 Exciting Software Engineer opportunity at TechCorp! Join our innovative team building the future of web applications. Remote-friendly with competitive benefits! #SoftwareEngineer #TechJobs #RemoteWork #WebDevelopment",
    type: "job_listing",
    hashtags: ["#SoftwareEngineer", "#TechJobs", "#RemoteWork", "#WebDevelopment"],
    analytics: {
      impressions: 2500,
      reach: 2100,
      likes: 125,
      comments: 18,
      shares: 12,
      saves: 45,
      profileVisits: 35,
      websiteClicks: 28,
    }
  },
  {
    caption: "💼 Marketing Manager position available at GrowthCo! Lead campaigns that drive real results. Excellent growth opportunities and team culture. Apply now! #MarketingJobs #DigitalMarketing #CareerGrowth #Marketing",
    type: "job_listing",
    hashtags: ["#MarketingJobs", "#DigitalMarketing", "#CareerGrowth", "#Marketing"],
    analytics: {
      impressions: 1800,
      reach: 1500,
      likes: 89,
      comments: 12,
      shares: 8,
      saves: 32,
      profileVisits: 22,
      websiteClicks: 19,
    }
  },
  {
    caption: "🎯 Data Scientist role at DataTech! Work with cutting-edge ML models and big data. Hybrid work model with amazing perks. #DataScience #MachineLearning #BigData #TechCareers",
    type: "job_listing",
    hashtags: ["#DataScience", "#MachineLearning", "#BigData", "#TechCareers"],
    analytics: {
      impressions: 3200,
      reach: 2800,
      likes: 156,
      comments: 24,
      shares: 18,
      saves: 67,
      profileVisits: 48,
      websiteClicks: 41,
    }
  },
  {
    caption: "🌟 Spotlight on InnovateCorp - a company that's revolutionizing the fintech space! Their commitment to work-life balance and innovation makes them a top employer. #CompanySpotlight #Fintech #Innovation #WorkLifeBalance",
    type: "company_highlight",
    hashtags: ["#CompanySpotlight", "#Fintech", "#Innovation", "#WorkLifeBalance"],
    analytics: {
      impressions: 1200,
      reach: 1000,
      likes: 78,
      comments: 9,
      shares: 15,
      saves: 23,
      profileVisits: 18,
      websiteClicks: 12,
    }
  },
  {
    caption: "📈 Industry Insight: The tech job market is booming! 65% increase in remote positions and growing demand for AI/ML skills. Stay ahead of the curve! #TechTrends #JobMarket #RemoteWork #AI",
    type: "industry_news",
    hashtags: ["#TechTrends", "#JobMarket", "#RemoteWork", "#AI"],
    analytics: {
      impressions: 4100,
      reach: 3600,
      likes: 203,
      comments: 31,
      shares: 45,
      saves: 89,
      profileVisits: 67,
      websiteClicks: 52,
    }
  },
  {
    caption: "🔧 UX Designer wanted at DesignStudio! Create beautiful, user-centered experiences. Portfolio review and competitive salary. #UXDesign #UserExperience #DesignJobs #Creative",
    type: "job_listing",
    hashtags: ["#UXDesign", "#UserExperience", "#DesignJobs", "#Creative"],
    analytics: {
      impressions: 1600,
      reach: 1350,
      likes: 94,
      comments: 14,
      shares: 7,
      saves: 38,
      profileVisits: 29,
      websiteClicks: 22,
    }
  },
  {
    caption: "💡 Career Tip Tuesday: Networking isn't just about collecting contacts - it's about building genuine relationships. Quality over quantity always wins! #CareerTips #Networking #ProfessionalDevelopment #CareerAdvice",
    type: "custom",
    hashtags: ["#CareerTips", "#Networking", "#ProfessionalDevelopment", "#CareerAdvice"],
    analytics: {
      impressions: 2800,
      reach: 2400,
      likes: 167,
      comments: 28,
      shares: 34,
      saves: 78,
      profileVisits: 45,
      websiteClicks: 31,
    }
  },
  {
    caption: "🏢 Meet CloudTech - where innovation meets collaboration! Their open office culture and learning opportunities make them a standout employer. #CompanySpotlight #CloudComputing #TechCulture #Innovation",
    type: "company_highlight",
    hashtags: ["#CompanySpotlight", "#CloudComputing", "#TechCulture", "#Innovation"],
    analytics: {
      impressions: 950,
      reach: 820,
      likes: 56,
      comments: 7,
      shares: 9,
      saves: 18,
      profileVisits: 14,
      websiteClicks: 8,
    }
  },
  {
    caption: "⚡ DevOps Engineer opportunity at ScaleCorp! Build and maintain infrastructure that powers millions of users. Kubernetes, AWS, and more! #DevOps #CloudInfrastructure #AWS #Kubernetes #TechJobs",
    type: "job_listing",
    hashtags: ["#DevOps", "#CloudInfrastructure", "#AWS", "#Kubernetes", "#TechJobs"],
    analytics: {
      impressions: 2100,
      reach: 1800,
      likes: 118,
      comments: 16,
      shares: 11,
      saves: 42,
      profileVisits: 33,
      websiteClicks: 25,
    }
  },
  {
    caption: "📊 Market Update: Salary trends show 15% increase for software engineers, 12% for data scientists. The talent shortage continues to drive competitive compensation! #SalaryTrends #TechSalaries #JobMarket #TechCareers",
    type: "industry_news",
    hashtags: ["#SalaryTrends", "#TechSalaries", "#JobMarket", "#TechCareers"],
    analytics: {
      impressions: 3800,
      reach: 3200,
      likes: 189,
      comments: 42,
      shares: 38,
      saves: 95,
      profileVisits: 71,
      websiteClicks: 58,
    }
  }
];

async function seedInstagramAnalytics() {
  console.log('🌱 Starting Instagram analytics seeding...');

  try {
    // Create sample Instagram posts with analytics
    for (let i = 0; i < samplePosts.length; i++) {
      const postData = samplePosts[i];
      const publishedAt = new Date();
      publishedAt.setDate(publishedAt.getDate() - (samplePosts.length - i)); // Spread posts over recent days

      console.log(`Creating post ${i + 1}/${samplePosts.length}: ${postData.caption.substring(0, 50)}...`);

      // Create Instagram post
      const post = await prisma.instagramPost.create({
        data: {
          caption: postData.caption,
          type: postData.type as InstagramPostType,
          hashtags: postData.hashtags,
          publishedAt,
          status: 'published',



        },
      });

      // Calculate engagement metrics
      const analytics = postData.analytics;
      const totalEngagements = analytics.likes + analytics.comments + analytics.shares + analytics.saves;
      const engagementRate = analytics.impressions > 0 ? (totalEngagements / analytics.impressions) * 100 : 0;
      const clickThroughRate = analytics.impressions > 0 ? (analytics.websiteClicks / analytics.impressions) * 100 : 0;

      // Create analytics record
      await prisma.instagramAnalytics.create({
        data: {
          postId: post.id,
          impressions: analytics.impressions,
          reach: analytics.reach,
          likes: analytics.likes,
          comments: analytics.comments,
          shares: analytics.shares,
          saves: analytics.saves,
          profileVisits: analytics.profileVisits,
          websiteClicks: analytics.websiteClicks,
          engagementRate,
          clickThroughRate,
          recordedAt: publishedAt,
        },
      });

      // Add some variation with additional analytics records for some posts (simulating multiple data points)
      if (i % 3 === 0) {
        const nextDay = new Date(publishedAt);
        nextDay.setDate(nextDay.getDate() + 1);
        
        // Simulate slight growth in metrics
        const growthFactor = 1.1 + (Math.random() * 0.2); // 10-30% growth
        
        await prisma.instagramAnalytics.create({
          data: {
            postId: post.id,
            impressions: Math.floor(analytics.impressions * growthFactor),
            reach: Math.floor(analytics.reach * growthFactor),
            likes: Math.floor(analytics.likes * growthFactor),
            comments: Math.floor(analytics.comments * growthFactor),
            shares: Math.floor(analytics.shares * growthFactor),
            saves: Math.floor(analytics.saves * growthFactor),
            profileVisits: Math.floor(analytics.profileVisits * growthFactor),
            websiteClicks: Math.floor(analytics.websiteClicks * growthFactor),
            engagementRate: engagementRate * growthFactor,
            clickThroughRate: clickThroughRate * growthFactor,
            recordedAt: nextDay,
          },
        });
      }
    }

    // Create sample account metrics for the last 30 days
    console.log('Creating account metrics...');
    const today = new Date();
    for (let i = 0; i < 30; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      
      // Simulate realistic account growth
      const baseFollowers = 5000;
      const dailyGrowth = Math.floor(Math.random() * 20) + 5; // 5-25 new followers per day
      const followersCount = baseFollowers + (30 - i) * dailyGrowth;
      
      await prisma.instagramAccountMetrics.create({
        data: {
          accountId: 'demo_account_123',
          date,
          followersCount,
          followingCount: 1200 + Math.floor(Math.random() * 50),
          mediaCount: 250 + i,
          impressions: Math.floor(Math.random() * 5000) + 2000,
          reach: Math.floor(Math.random() * 4000) + 1500,
          profileViews: Math.floor(Math.random() * 300) + 100,
          websiteClicks: Math.floor(Math.random() * 50) + 10,
        },
      });
    }

    console.log('✅ Instagram analytics seeding completed successfully!');
    console.log(`Created ${samplePosts.length} posts with analytics data`);
    console.log('Created 30 days of account metrics');
    
  } catch (error) {
    console.error('❌ Error seeding Instagram analytics:', error);
    throw error;
  }
}

async function main() {
  try {
    await seedInstagramAnalytics();
  } catch (error) {
    console.error('Seeding failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the seeder if this file is executed directly
if (require.main === module) {
  main();
}

export { seedInstagramAnalytics }; 