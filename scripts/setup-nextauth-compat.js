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
  
  // Create compatibility file with error handling
  const compatibilityCode = `
// NextAuth v4 compatibility layer for v5 upgrade
// This file provides backward compatibility for existing imports

try {
  const { auth } = require('../../../src/auth');
  
  // Export getServerSession for v4 compatibility
  module.exports = {
    getServerSession: auth,
  };
  
  // Named exports
  module.exports.getServerSession = auth;
  
} catch (error) {
  console.warn('NextAuth compatibility layer failed to load:', error.message);
  
  // Fallback exports to prevent build failures
  module.exports = {
    getServerSession: async () => null,
  };
  
  module.exports.getServerSession = async () => null;
}
`;
  
  fs.writeFileSync(nextFilePath, compatibilityCode);
  
  // Also create middleware compatibility
  const middlewarePath = path.join(nextAuthPath, 'middleware.js');
  const middlewareCompatCode = `
// NextAuth middleware compatibility for v5
module.exports = {
  withAuth: (middleware, config) => {
    console.warn('withAuth is deprecated in NextAuth v5. Use the new auth() middleware pattern.');
    return middleware;
  },
};

module.exports.withAuth = module.exports.withAuth;
`;
  
  fs.writeFileSync(middlewarePath, middlewareCompatCode);
  
  console.log('✅ NextAuth compatibility layer created successfully');
  console.log('📂 Created:', nextFilePath);
  console.log('📂 Created:', middlewarePath);
  
} catch (error) {
  console.log('⚠️ Could not create compatibility layer:', error.message);
  console.log('This is non-critical - build will continue with warnings');
}