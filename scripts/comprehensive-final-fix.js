#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Get all TypeScript files in the project
function getAllTsFiles(dir, files = []) {
  const items = fs.readdirSync(dir);
  
  for (const item of items) {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory() && !item.startsWith('.') && item !== 'node_modules') {
      getAllTsFiles(fullPath, files);
    } else if (item.endsWith('.ts') || item.endsWith('.tsx')) {
      files.push(fullPath);
    }
  }
  
  return files;
}

function fixFile(filePath) {
  try {
    if (!fs.existsSync(filePath)) {
      return false;
    }
    
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;
    
    // Fix actions that are missing userId declarations
    if (filePath.includes('/actions/')) {
      if (content.includes('userId') && !content.includes('const { userId } = await auth()')) {
        // Add auth import if missing
        if (!content.includes("import { auth } from '@clerk/nextjs/server'")) {
          content = content.replace(
            /^('use server';?\s*\n)/m,
            "$1import { auth } from '@clerk/nextjs/server';\n"
          );
          modified = true;
        }
        
        // Add userId extraction at the beginning of functions that use it
        content = content.replace(
          /(export\s+async\s+function\s+\w+[^{]*{\s*)/g,
          "$1\n  const { userId } = await auth();\n  if (!userId) {\n    return { success: false, error: 'Unauthorized' };\n  }\n"
        );
        modified = true;
      }
    }
    
    // Fix variable redeclaration issues
    const lines = content.split('\n');
    const seenVars = new Map();
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      // Check for variable redeclarations
      const match = line.match(/^\s*const\s+(\w+)\s*=/);
      if (match) {
        const varName = match[1];
        
        if (seenVars.has(varName)) {
          // This is a redeclaration, rename it
          if (varName === 'user') {
            lines[i] = line.replace(/const\s+user\s*=/, 'const dbUser =');
            modified = true;
          } else if (varName === 'userId') {
            lines[i] = line.replace(/const\s+userId\s*=/, 'const clerkUserId =');
            modified = true;
          } else if (varName === 'dbUser') {
            lines[i] = line.replace(/const\s+dbUser\s*=/, 'const userRecord =');
            modified = true;
          }
        } else {
          seenVars.set(varName, i);
        }
      }
    }
    
    if (modified) {
      content = lines.join('\n');
    }
    
    // Fix missing user variable definitions in API routes
    if (filePath.includes('/api/') && content.includes('user?.') && !content.includes('const user =') && !content.includes('const dbUser =')) {
      // Add user lookup after auth
      content = content.replace(
        /(const\s*{\s*userId\s*}\s*=\s*await\s+auth\(\);?\s*\n)/,
        "$1\n  if (!userId) {\n    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });\n  }\n\n  const user = await prisma.user.findUnique({\n    where: { clerkId: userId },\n  });\n"
      );
      modified = true;
    }
    
    // Fix session references
    content = content.replace(/session\?\.\s*user\?\.\s*email/g, 'user?.email');
    content = content.replace(/session\!\.\s*user\?\.\s*email/g, 'user?.email');
    content = content.replace(/session\.\s*user\?\.\s*email/g, 'user?.email');
    content = content.replace(/session\?\.\s*user\?\.\s*name/g, 'user?.name');
    content = content.replace(/session\!\.\s*user\?\.\s*name/g, 'user?.name');
    content = content.replace(/session\.\s*user\?\.\s*name/g, 'user?.name');
    content = content.replace(/session\?\.\s*user\?\.\s*role/g, 'user?.role');
    content = content.replace(/session\!\.\s*user\?\.\s*role/g, 'user?.role');
    content = content.replace(/session\.\s*user\?\.\s*role/g, 'user?.role');
    content = content.replace(/session\?\.\s*user\?\.\s*id/g, 'user?.id');
    content = content.replace(/session\!\.\s*user\?\.\s*id/g, 'user?.id');
    content = content.replace(/session\.\s*user\?\.\s*id/g, 'user?.id');
    
    // Fix useSession to useUser
    content = content.replace(/const\s*{\s*data:\s*session,?\s*status\s*}\s*=\s*useSession\(\);/g, 'const { user, isLoaded } = useUser();');
    content = content.replace(/const\s*{\s*data:\s*session\s*}\s*=\s*useSession\(\);/g, 'const { user } = useUser();');
    content = content.replace(/useSession\(\)/g, 'useUser()');
    
    // Fix imports
    content = content.replace(/import.*useSession.*from.*next-auth\/react.*\n?/g, "import { useUser } from '@clerk/nextjs';\n");
    content = content.replace(/import.*getServerSession.*from.*next-auth.*\n?/g, "import { auth } from '@clerk/nextjs/server';\n");
    content = content.replace(/import.*Session.*from.*next-auth.*\n?/g, '');
    
    // Fix duplicate redirect imports
    content = content.replace(
      /import\s*{\s*([^}]*),?\s*redirect\s*([^}]*)\s*}\s*from\s*['"]next\/navigation['"];\s*\nimport\s*{\s*redirect\s*}\s*from\s*['"]next\/navigation['"];?/g,
      "import { $1 redirect $2 } from 'next/navigation';"
    );
    
    // Remove duplicate imports
    const importLines = content.split('\n').filter(line => line.trim().startsWith('import'));
    const uniqueImports = [...new Set(importLines)];
    if (importLines.length !== uniqueImports.length) {
      const nonImportLines = content.split('\n').filter(line => !line.trim().startsWith('import'));
      content = uniqueImports.join('\n') + '\n' + nonImportLines.join('\n');
      modified = true;
    }
    
    // Fix user property access
    content = content.replace(/user\?\.\s*emailAddresses\?\.\[0\]\?\.\s*emailAddress/g, 'user?.email');
    content = content.replace(/user\?\.\s*fullName/g, 'user?.name');
    content = content.replace(/user\?\.\s*publicMetadata\?\.\s*role/g, 'user?.role');
    
    if (content !== fs.readFileSync(filePath, 'utf8')) {
      modified = true;
    }
    
    if (modified) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`✅ Fixed: ${filePath}`);
      return true;
    }
    
    return false;
  } catch (error) {
    console.error(`❌ Error fixing ${filePath}:`, error.message);
    return false;
  }
}

function main() {
  console.log('🔧 Starting comprehensive final fix...\n');
  
  // Get all TypeScript files
  const allFiles = getAllTsFiles('./src');
  
  let fixedCount = 0;
  let totalCount = allFiles.length;
  
  allFiles.forEach(filePath => {
    if (fixFile(filePath)) {
      fixedCount++;
    }
  });
  
  console.log(`\n📊 Comprehensive Fix Summary:`);
  console.log(`   Processed: ${totalCount} files`);
  console.log(`   Fixed: ${fixedCount} files`);
  console.log(`   Skipped: ${totalCount - fixedCount} files`);
  
  if (fixedCount > 0) {
    console.log('\n🎯 Next steps:');
    console.log('   1. Review the changes');
    console.log('   2. Run npm run type-check');
    console.log('   3. Test the application');
  }
}

if (require.main === module) {
  main();
}

module.exports = { fixFile };
