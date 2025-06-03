#!/usr/bin/env node

/**
 * Environment Variable Generator for 209jobs
 *
 * This script generates secure environment variables for development.
 * Run with: node scripts/generate-env.js
 */

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

// Generate secure random strings
function generateSecret(length = 32) {
  return crypto.randomBytes(length).toString('hex');
}

function generateBase64Secret(length = 32) {
  return crypto.randomBytes(length).toString('base64');
}

// Check if .env already exists
const envPath = path.join(process.cwd(), '.env');
const envExamplePath = path.join(process.cwd(), '.env.example');

if (fs.existsSync(envPath)) {
  console.log('⚠️  .env file already exists!');
  console.log('   To regenerate, delete .env first or run with --force flag');

  if (!process.argv.includes('--force')) {
    process.exit(1);
  }
}

console.log('🔐 Generating secure environment variables...\n');

// Read .env.example as template
let envTemplate = '';
if (fs.existsSync(envExamplePath)) {
  envTemplate = fs.readFileSync(envExamplePath, 'utf8');
} else {
  console.error('❌ .env.example file not found!');
  process.exit(1);
}

// Generate secure values
const secrets = {
  JWT_SECRET: generateSecret(64),
  SESSION_SECRET: generateSecret(64),
  API_KEY_SALT: generateSecret(32),
  ENCRYPTION_KEY: generateBase64Secret(32),
  NEXTAUTH_SECRET: generateSecret(64),
};

// Replace placeholder values with generated secrets
let envContent = envTemplate;

// Replace security secrets
envContent = envContent.replace(
  'JWT_SECRET="your-jwt-secret-at-least-32-characters-long"',
  `JWT_SECRET="${secrets.JWT_SECRET}"`
);

envContent = envContent.replace(
  'SESSION_SECRET="your-session-secret-at-least-32-characters-long"',
  `SESSION_SECRET="${secrets.SESSION_SECRET}"`
);

envContent = envContent.replace(
  'API_KEY_SALT="your-api-key-salt-at-least-16-characters"',
  `API_KEY_SALT="${secrets.API_KEY_SALT}"`
);

envContent = envContent.replace(
  'ENCRYPTION_KEY="your-32-byte-base64-encryption-key"',
  `ENCRYPTION_KEY="${secrets.ENCRYPTION_KEY}"`
);

envContent = envContent.replace(
  'NEXTAUTH_SECRET="your-nextauth-secret"',
  `NEXTAUTH_SECRET="${secrets.NEXTAUTH_SECRET}"`
);

// Set development-friendly defaults
envContent = envContent.replace(
  'UPSTASH_REDIS_REST_URL="your-upstash-redis-url"',
  'UPSTASH_REDIS_REST_URL=""'
);

envContent = envContent.replace(
  'UPSTASH_REDIS_REST_TOKEN="your-upstash-redis-token"',
  'UPSTASH_REDIS_REST_TOKEN=""'
);

// Set development flags
envContent = envContent.replace(
  'SKIP_RATE_LIMIT="false"',
  'SKIP_RATE_LIMIT="true"'
);

// Write the .env file
fs.writeFileSync(envPath, envContent);

console.log('✅ Generated .env file with secure secrets!');
console.log('\n🔑 Generated secrets:');
console.log(`   JWT_SECRET: ${secrets.JWT_SECRET.substring(0, 16)}...`);
console.log(`   SESSION_SECRET: ${secrets.SESSION_SECRET.substring(0, 16)}...`);
console.log(`   API_KEY_SALT: ${secrets.API_KEY_SALT.substring(0, 16)}...`);
console.log(`   ENCRYPTION_KEY: ${secrets.ENCRYPTION_KEY.substring(0, 16)}...`);
console.log(
  `   NEXTAUTH_SECRET: ${secrets.NEXTAUTH_SECRET.substring(0, 16)}...`
);

console.log('\n📝 Next steps:');
console.log('   1. Update database URLs in .env');
console.log('   2. Add your API keys (Google, Stripe, etc.)');
console.log('   3. Configure Redis URLs if using caching');
console.log('   4. Run: npm run build');

console.log('\n⚠️  IMPORTANT: Never commit .env to version control!');
