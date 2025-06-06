// Script to update your user to admin role
// Run with: node scripts/update-user-to-admin.js

require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function updateUserToAdmin() {
  try {
    console.log('🔧 Updating user to admin role...');

    // Get your email from the session - you'll need to replace this with your actual email
    const userEmail = 'paul@voodoo.rodeo'; // Your actual email
    
    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { email: userEmail }
    });

    if (!existingUser) {
      console.log('❌ User not found with email:', userEmail);
      console.log('Available users:');
      
      const allUsers = await prisma.user.findMany({
        select: { email: true, role: true, name: true }
      });
      
      allUsers.forEach(user => {
        console.log(`  - ${user.email} (${user.role}) - ${user.name || 'No name'}`);
      });
      
      return;
    }

    console.log('👤 Found user:', existingUser.email, 'Current role:', existingUser.role);
    
    // Update user to admin
    const updatedUser = await prisma.user.update({
      where: { email: userEmail },
      data: { role: 'admin' }
    });

    console.log('✅ User updated to admin successfully!');
    console.log('📧 Email:', updatedUser.email);
    console.log('👤 New Role:', updatedUser.role);
    console.log('🆔 ID:', updatedUser.id);
    
    console.log('\n🎉 You can now access the admin dashboard with email management!');
    console.log('🔗 Visit: http://localhost:3000/admin');

  } catch (error) {
    console.error('❌ Error updating user to admin:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
updateUserToAdmin();
