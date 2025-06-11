#!/usr/bin/env node

/**
 * List users in the database for testing
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function listUsers() {
  try {
    console.log('📋 Listing users in database...\n');

    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true
      },
      orderBy: { createdAt: 'desc' }
    });

    if (users.length === 0) {
      console.log('❌ No users found in database');
      return;
    }

    console.log(`✅ Found ${users.length} users:\n`);

    users.forEach((user, index) => {
      console.log(`${index + 1}. ${user.name || 'No name'}`);
      console.log(`   📧 Email: ${user.email}`);
      console.log(`   👤 Role: ${user.role}`);
      console.log(`   📅 Created: ${user.createdAt.toLocaleDateString()}`);
      console.log(`   🆔 ID: ${user.id}`);
      console.log('');
    });

    // Show employers specifically
    const employers = users.filter(u => u.role === 'employer');
    if (employers.length > 0) {
      console.log(`💼 Employers (${employers.length}):`);
      employers.forEach(emp => {
        console.log(`   • ${emp.email} (${emp.name || 'No name'})`);
      });
    }

  } catch (error) {
    console.error('❌ Error listing users:', error);
  } finally {
    await prisma.$disconnect();
  }
}

listUsers();
