#!/usr/bin/env node

const { execSync } = require('child_process');

console.log('🔧 Testing 500 Error Fixes\n');

console.log('1️⃣ Ensuring Prisma client is generated...');
try {
  execSync('npx prisma generate', { stdio: 'inherit' });
  console.log('✅ Prisma client generated successfully\n');
} catch (error) {
  console.log('❌ Failed to generate Prisma client\n');
}

console.log('2️⃣ Starting development server...');
console.log('Please run in a separate terminal: npm run dev');
console.log('Wait for the server to start, then press Enter to continue...\n');

// Wait for user input
const readline = require('readline');
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

rl.question('Press Enter when server is running...', () => {
  rl.close();
  
  console.log('\n3️⃣ Testing API endpoints...\n');
  
  // Test 1: Database connection test
  console.log('Testing database connection...');
  try {
    const dbTest = execSync('curl -s http://localhost:3000/api/debug/test-db', { encoding: 'utf8' });
    console.log('Database test response:', dbTest.substring(0, 200) + '...');
  } catch (error) {
    console.log('❌ Database test failed');
  }
  
  // Test 2: Query test
  console.log('\nTesting Prisma queries...');
  try {
    const queryTest = execSync('curl -s http://localhost:3000/api/debug/test-query', { encoding: 'utf8' });
    console.log('Query test response:', queryTest.substring(0, 200) + '...');
  } catch (error) {
    console.log('❌ Query test failed');
  }
  
  // Test 3: Chat API
  console.log('\nTesting chat API...');
  try {
    const chatTest = execSync(
      'curl -s -X POST http://localhost:3000/api/chat-job-search -H "Content-Type: application/json" -d \'{"userMessage":"test"}\'',
      { encoding: 'utf8' }
    );
    console.log('Chat API response:', chatTest.substring(0, 200) + '...');
  } catch (error) {
    console.log('❌ Chat API test failed');
  }
  
  // Test 4: Jobs search API
  console.log('\nTesting jobs search API...');
  try {
    const jobsTest = execSync('curl -s "http://localhost:3000/api/jobs/search?q=warehouse"', { encoding: 'utf8' });
    console.log('Jobs API response:', jobsTest.substring(0, 200) + '...');
  } catch (error) {
    console.log('❌ Jobs API test failed');
  }
  
  console.log('\n✅ Testing complete!');
  console.log('\n📋 Summary:');
  console.log('1. Fixed AI security middleware to use Clerk instead of mock auth');
  console.log('2. Created safe query builder without case-insensitive mode');
  console.log('3. Updated chat-job-search route to use fixed components');
  console.log('\n🎯 Next steps:');
  console.log('1. Restart your development server: npm run dev');
  console.log('2. Test /chat page in your browser');
  console.log('3. Test /jobs page in your browser');
  console.log('\nIf errors persist, check the console logs for specific error messages.');
});