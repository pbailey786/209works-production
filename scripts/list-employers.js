const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function listEmployers() {
  try {
    const users = await prisma.user.findMany({ 
      where: { role: 'employer' }, 
      select: { email: true, name: true, id: true } 
    });
    
    console.log('Employers:', users);
    
    // Also check existing credits
    for (const user of users) {
      const credits = await prisma.jobPostingCredit.findMany({
        where: { userId: user.id, isUsed: false },
        select: { type: true, expiresAt: true }
      });
      console.log(`${user.email} has ${credits.length} credits:`, credits.map(c => c.type));
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

listEmployers();
