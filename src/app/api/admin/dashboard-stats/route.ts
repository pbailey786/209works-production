import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check if user is admin (you can implement your own admin check logic)
    // For now, we'll allow any authenticated user to access admin stats for demo
    
    // Get total users count
    const totalUsers = await prisma.user.count();

    // Get jobs posted today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const jobsPostedToday = await prisma.job.count({
      where: {
        createdAt: {
          gte: today,
          lt: tomorrow,
        }
      }
    });

    // Get flags/reports count (mock for now)
    const flagsReports = Math.floor(Math.random() * 10) + 1;

    // Get API/LLM usage (mock for now)
    const apiLlmUsage = Math.floor(Math.random() * 2000) + 1000;

    // Get active jobs count
    const activeJobs = await prisma.job.count({
      where: {
        status: 'ACTIVE'
      }
    });

    // Get total revenue (mock calculation based on credits purchased)
    const totalRevenue = Math.floor(Math.random() * 50000) + 10000;

    return NextResponse.json({
      totalUsers,
      jobsPostedToday,
      flagsReports,
      apiLlmUsage,
      activeJobs,
      totalRevenue,
    });

  } catch (error) {
    console.error('Error fetching admin dashboard stats:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
