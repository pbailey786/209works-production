const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function addTestSubscription(userEmail) {
  try {
    console.log(`🧪 Adding test subscription to ${userEmail}...`);

    // Find the user
    const user = await prisma.user.findUnique({
      where: { email: userEmail },
      select: { id: true, role: true, name: true, email: true }
    });

    if (!user) {
      console.error(`❌ User not found: ${userEmail}`);
      return;
    }

    if (user.role !== 'employer') {
      console.error(`❌ User is not an employer: ${user.role}`);
      return;
    }

    console.log(`✅ Found user: ${user.name || user.email} (${user.id})`);

    // Check if user already has an active subscription
    const existingSubscription = await prisma.subscription.findFirst({
      where: {
        userId: user.id,
        status: 'active',
      },
    });

    if (existingSubscription) {
      console.log(`✅ User already has an active subscription: ${existingSubscription.id}`);
      return;
    }

    // Create a test subscription
    const subscription = await prisma.subscription.create({
      data: {
        userId: user.id,
        email: user.email,
        stripeSubscriptionId: `sub_test_${Date.now()}`,
        tier: 'starter',
        billingCycle: 'monthly',
        status: 'active',
        startDate: new Date(),
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
        price: 19900, // $199.00 in cents
      },
    });

    console.log(`✅ Created test subscription: ${subscription.id}`);

    // Update user's current tier
    await prisma.user.update({
      where: { id: user.id },
      data: {
        currentTier: 'starter',
        subscriptionEndsAt: subscription.endDate,
      },
    });

    console.log(`✅ Updated user tier to: standard`);

    // Verify the subscription
    const verifySubscription = await prisma.subscription.findFirst({
      where: {
        userId: user.id,
        status: 'active',
      },
    });

    console.log(`🎉 User now has active subscription:`, {
      id: verifySubscription.id,
      tier: verifySubscription.tier,
      status: verifySubscription.status,
      endDate: verifySubscription.endDate,
    });

    console.log(`🔗 Test the modal: http://localhost:3000/employers/create-job-post`);

  } catch (error) {
    console.error('❌ Error adding test subscription:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Parse command line arguments
const args = process.argv.slice(2);
const userEmail = args[0];

if (!userEmail) {
  console.log('Usage: node scripts/add-test-subscription.js <email>');
  console.log('Example: node scripts/add-test-subscription.js digitalstele@gmail.com');
  process.exit(1);
}

addTestSubscription(userEmail);
