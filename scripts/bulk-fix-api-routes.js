/**
 * Bulk Fix API Routes
 * Finds and fixes all React components in API route files
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const apiRouteTemplate = `import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // TODO: Implement API handler
    return NextResponse.json(
      { message: 'API endpoint not implemented yet' },
      { status: 501 }
    );
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // TODO: Implement API handler
    return NextResponse.json(
      { message: 'API endpoint not implemented yet' },
      { status: 501 }
    );
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}`;

function findAllApiRoutes() {
  try {
    // Use find command to get all route.ts files in api directory
    const result = execSync('find src/app/api -name "route.ts" -type f', { encoding: 'utf8' });
    return result.trim().split('\n').filter(line => line.length > 0);
  } catch (error) {
    console.error('Error finding API routes:', error.message);
    return [];
  }
}

function isReactComponent(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    return content.includes('export default function') && 
           content.includes('return (') &&
           content.includes('<div className=');
  } catch (error) {
    return false;
  }
}

function fixApiRoute(filePath) {
  try {
    console.log(`🔧 Fixing: ${filePath}`);
    
    // Create backup
    const backupPath = filePath + '.backup';
    if (fs.existsSync(filePath)) {
      fs.copyFileSync(filePath, backupPath);
    }
    
    // Write proper API route
    fs.writeFileSync(filePath, apiRouteTemplate);
    
    return true;
  } catch (error) {
    console.error(`❌ Error fixing ${filePath}:`, error.message);
    return false;
  }
}

function main() {
  console.log('🔍 Finding all API route files...\n');
  
  const apiRoutes = findAllApiRoutes();
  console.log(`Found ${apiRoutes.length} API route files\n`);
  
  let fixedCount = 0;
  let totalCount = 0;
  
  apiRoutes.forEach(routePath => {
    totalCount++;
    
    if (isReactComponent(routePath)) {
      console.log(`🚨 Found React component in API route: ${routePath}`);
      if (fixApiRoute(routePath)) {
        fixedCount++;
      }
    } else {
      console.log(`✅ API route appears correct: ${routePath}`);
    }
  });
  
  console.log(`\n📊 Summary:`);
  console.log(`   Total API routes: ${totalCount}`);
  console.log(`   Fixed: ${fixedCount}`);
  console.log(`   Already correct: ${totalCount - fixedCount}`);
  
  if (fixedCount > 0) {
    console.log('\n🎯 Next steps:');
    console.log('   1. Run npm run build');
    console.log('   2. Implement actual API logic for each route');
  }
}

if (require.main === module) {
  main();
}
