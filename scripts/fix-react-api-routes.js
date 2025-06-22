/**
 * Fix React Components in API Routes
 * Converts React components back to proper API route handlers
 */

const fs = require('fs');
const path = require('path');

function createApiRouteTemplate(fileName) {
  return `import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // TODO: Implement ${fileName} GET handler
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
    // TODO: Implement ${fileName} POST handler
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
}

function isReactComponentInApiRoute(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');

    // Check if it's a React component in an API route
    return (
      filePath.includes('/api/') &&
      filePath.endsWith('route.ts') &&
      content.includes('export default function') &&
      content.includes('return (') &&
      content.includes('<div className=')
    );
  } catch (error) {
    return false;
  }
}

function fixApiRoute(filePath) {
  try {
    console.log(`🔧 Fixing React component in API route: ${filePath}`);

    const fileName = path.basename(path.dirname(filePath));
    const template = createApiRouteTemplate(fileName);

    // Create backup
    const backupPath = filePath + '.backup';
    if (fs.existsSync(filePath)) {
      fs.copyFileSync(filePath, backupPath);
    }

    // Write proper API route
    fs.writeFileSync(filePath, template);

    console.log(`✅ Fixed: ${filePath}`);
    return true;
  } catch (error) {
    console.error(`❌ Error fixing ${filePath}:`, error.message);
    return false;
  }
}

function scanForApiRoutes(dir) {
  const results = [];

  if (!fs.existsSync(dir)) return results;

  const items = fs.readdirSync(dir);

  items.forEach(item => {
    const itemPath = path.join(dir, item);
    const stat = fs.statSync(itemPath);

    if (stat.isDirectory()) {
      results.push(...scanForApiRoutes(itemPath));
    } else if (item === 'route.ts' && itemPath.includes('/api/')) {
      results.push(itemPath);
    }
  });

  return results;
}

function main() {
  console.log('🔍 Scanning for React components in API routes...\n');

  const apiDir = 'src/app/api';
  const apiRoutes = scanForApiRoutes(apiDir);

  let fixedCount = 0;
  let totalCount = 0;

  apiRoutes.forEach(routePath => {
    totalCount++;

    if (isReactComponentInApiRoute(routePath)) {
      if (fixApiRoute(routePath)) {
        fixedCount++;
      }
    } else {
      console.log(`ℹ️  API route appears correct: ${routePath}`);
    }
  });

  console.log(`\n📊 API Route Fix Summary:`);
  console.log(`   Routes scanned: ${totalCount}`);
  console.log(`   Routes fixed: ${fixedCount}`);
  console.log(`   Routes correct: ${totalCount - fixedCount}`);

  if (fixedCount > 0) {
    console.log('\n🎯 Next steps:');
    console.log('   1. Run npm run build');
    console.log('   2. Implement actual API logic for each route');
    console.log('   3. Check .backup files for original content');
  }
}

if (require.main === module) {
  main();
}

module.exports = { isReactComponentInApiRoute, fixApiRoute };
