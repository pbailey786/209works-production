#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🔍 Debugging 500 Errors on /chat and /jobs pages\n');

// 1. Check if .env.local exists and has required variables
console.log('1️⃣ Checking environment configuration...');
const envPath = path.join(__dirname, '.env.local');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf-8');
  const requiredVars = [
    'DATABASE_URL',
    'OPENAI_API_KEY',
    'ANTHROPIC_API_KEY',
    'NEXT_PUBLIC_ENABLE_AI',
    'NEXT_PUBLIC_ENABLE_CLERK_AUTH',
    'NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY',
    'CLERK_SECRET_KEY'
  ];
  
  const missingVars = [];
  const configuredVars = [];
  
  requiredVars.forEach(varName => {
    if (envContent.includes(`${varName}=`)) {
      const value = envContent.match(new RegExp(`${varName}=(.+)`));
      if (value && value[1] && value[1].trim() !== '') {
        configuredVars.push(varName);
      } else {
        missingVars.push(varName);
      }
    } else {
      missingVars.push(varName);
    }
  });
  
  console.log(`✅ Configured: ${configuredVars.join(', ')}`);
  if (missingVars.length > 0) {
    console.log(`❌ Missing or empty: ${missingVars.join(', ')}`);
  }
} else {
  console.log('❌ .env.local file not found!');
}

// 2. Check Prisma setup
console.log('\n2️⃣ Checking Prisma configuration...');
try {
  const prismaSchemaPath = path.join(__dirname, 'prisma', 'schema.prisma');
  if (fs.existsSync(prismaSchemaPath)) {
    console.log('✅ Prisma schema found');
    
    // Check if Prisma client is generated
    const prismaClientPath = path.join(__dirname, 'node_modules', '.prisma', 'client');
    if (fs.existsSync(prismaClientPath)) {
      console.log('✅ Prisma client generated');
    } else {
      console.log('❌ Prisma client not generated. Run: npx prisma generate');
    }
  } else {
    console.log('❌ Prisma schema not found');
  }
} catch (error) {
  console.log('❌ Error checking Prisma:', error.message);
}

// 3. Check feature flags
console.log('\n3️⃣ Checking feature flags...');
const featureFlagsPath = path.join(__dirname, 'src', 'lib', 'feature-flags.ts');
if (fs.existsSync(featureFlagsPath)) {
  const featureFlagsContent = fs.readFileSync(featureFlagsPath, 'utf-8');
  const aiChatEnabled = featureFlagsContent.includes("AI_CHAT: process.env.NEXT_PUBLIC_ENABLE_AI === 'true'");
  console.log(`AI_CHAT feature: ${aiChatEnabled ? '✅ Configured' : '❌ Not found'}`);
} else {
  console.log('❌ Feature flags file not found');
}

// 4. Common issues and solutions
console.log('\n📋 Common Issues and Solutions:\n');

console.log('1. Database Connection Error:');
console.log('   - Ensure DATABASE_URL is set correctly in .env.local');
console.log('   - Run: npx prisma generate');
console.log('   - Run: npx prisma db push (if schema changed)');

console.log('\n2. Missing API Keys:');
console.log('   - Set OPENAI_API_KEY or ANTHROPIC_API_KEY in .env.local');
console.log('   - The chat feature requires at least one AI provider');

console.log('\n3. Authentication Issues:');
console.log('   - Ensure Clerk environment variables are set');
console.log('   - NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY and CLERK_SECRET_KEY required');

console.log('\n4. Feature Flags:');
console.log('   - Set NEXT_PUBLIC_ENABLE_AI=true for chat features');
console.log('   - Set NEXT_PUBLIC_ENABLE_CLERK_AUTH=true for authentication');

console.log('\n5. Quick Fix Commands:');
console.log('   npx prisma generate');
console.log('   npm run dev');

console.log('\n6. Test the endpoints directly:');
console.log('   curl http://localhost:3000/api/chat-job-search -X POST -H "Content-Type: application/json" -d \'{"userMessage":"test"}\'');
console.log('   curl http://localhost:3000/api/jobs/search?q=warehouse');

console.log('\n✨ After fixing issues, restart the development server with: npm run dev');