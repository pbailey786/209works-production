#!/usr/bin/env node

/**
 * Setup NextAuth v4 compatibility layer for v5 upgrade
 * This creates a compatibility shim in node_modules
 */

const fs = require('fs');
const path = require('path');

console.log('🔧 Setting up NextAuth v4 compatibility layer...');

try {
  // Create compatibility file in node_modules
  const nextAuthPath = path.join(__dirname, '..', 'node_modules', 'next-auth');
  const nextFilePath = path.join(nextAuthPath, 'next.js');
  
  // Ensure directory exists
  if (!fs.existsSync(nextAuthPath)) {
    console.log('⚠️ NextAuth not found in node_modules, skipping compatibility setup');
    process.exit(0);
  }
  
  // Create compatibility file
  const compatibilityCode = `
// NextAuth v4 compatibility layer for v5 upgrade
// This file provides backward compatibility for existing imports

const { auth } = require('../../../src/auth');

// Export getServerSession for v4 compatibility
module.exports = {
  getServerSession: auth,
};

// Named exports
module.exports.getServerSession = auth;
`;
  
  fs.writeFileSync(nextFilePath, compatibilityCode);
  
  console.log('✅ NextAuth compatibility layer created successfully');
  console.log('📂 Created:', nextFilePath);
  
} catch (error) {
  console.log('⚠️ Could not create compatibility layer:', error.message);
  console.log('This is non-critical - build will continue with warnings');
}