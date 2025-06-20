#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Files that need comprehensive fixes
const filesToFix = [
  // All files with remaining errors - we'll process them all
];

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

// Comprehensive replacement patterns
const replacements = [
  // Fix duplicate prisma imports
  {
    pattern: /import\s*{\s*prisma\s*}\s*from\s*['"][^'"]*auth\/prisma['"];\s*\n/g,
    replacement: ''
  },
  
  // Fix user property access patterns
  {
    pattern: /user\?\.\s*publicMetadata\?\.\s*role/g,
    replacement: 'user?.role'
  },
  
  // Fix session references that should be user
  {
    pattern: /session\!\.\s*user\?\.\s*email/g,
    replacement: 'user?.email'
  },
  {
    pattern: /session\?\.\s*user\?\.\s*email/g,
    replacement: 'user?.email'
  },
  {
    pattern: /session\!\.\s*user\?\.\s*name/g,
    replacement: 'user?.name'
  },
  {
    pattern: /session\?\.\s*user\?\.\s*name/g,
    replacement: 'user?.name'
  },
  {
    pattern: /session\!\.\s*user\?\.\s*role/g,
    replacement: 'user?.role'
  },
  {
    pattern: /session\?\.\s*user\?\.\s*role/g,
    replacement: 'user?.role'
  },
  {
    pattern: /session\!\.\s*user\?\.\s*id/g,
    replacement: 'user?.id'
  },
  {
    pattern: /session\?\.\s*user\?\.\s*id/g,
    replacement: 'user?.id'
  },
  {
    pattern: /session\.\s*user\?\.\s*email/g,
    replacement: 'user?.email'
  },
  {
    pattern: /session\.\s*user\?\.\s*name/g,
    replacement: 'user?.name'
  },
  {
    pattern: /session\.\s*user\?\.\s*role/g,
    replacement: 'user?.role'
  },
  {
    pattern: /session\.\s*user\?\.\s*id/g,
    replacement: 'user?.id'
  },
  {
    pattern: /session\.\s*user\.email/g,
    replacement: 'user?.email'
  },
  {
    pattern: /session\.\s*user\.name/g,
    replacement: 'user?.name'
  },
  {
    pattern: /session\.\s*user\.role/g,
    replacement: 'user?.role'
  },
  {
    pattern: /session\.\s*user\.id/g,
    replacement: 'user?.id'
  },
  
  // Fix useSession to useUser
  {
    pattern: /const\s*{\s*data:\s*session,?\s*status\s*}\s*=\s*useUser\(\);/g,
    replacement: 'const { user, isLoaded } = useUser();'
  },
  {
    pattern: /const\s*{\s*data:\s*session\s*}\s*=\s*useUser\(\);/g,
    replacement: 'const { user } = useUser();'
  },
  
  // Fix getServerSession references
  {
    pattern: /const\s+session\s*=\s*await\s+getServerSession\(\)\s*as\s*any;?/g,
    replacement: `const { userId } = await auth();
    if (!userId) {
      redirect('/signin');
    }
    
    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
    });`
  },
  {
    pattern: /const\s+session\s*=\s*await\s+getServerSession\(\);?/g,
    replacement: `const { userId } = await auth();
    if (!userId) {
      redirect('/signin');
    }
    
    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
    });`
  },
  
  // Fix Session type references
  {
    pattern: /as\s+Session\s*\|\s*null/g,
    replacement: ''
  },
  {
    pattern: /:\s*Session\s*\|\s*null/g,
    replacement: ''
  },
  
  // Fix clerkId type issues
  {
    pattern: /where:\s*{\s*clerkId:\s*userId\s*}/g,
    replacement: 'where: { clerkId: userId! }'
  },
  
  // Add missing imports
  {
    pattern: /^(import.*from.*clerk.*;\s*\n)/m,
    replacement: '$1import { redirect } from \'next/navigation\';\n'
  },
];

function fixFile(filePath) {
  try {
    if (!fs.existsSync(filePath)) {
      return false;
    }
    
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;
    
    // Skip if file doesn't contain problematic patterns
    if (!content.includes('session') && 
        !content.includes('useSession') && 
        !content.includes('getServerSession') &&
        !content.includes('publicMetadata') &&
        !content.includes('auth/prisma')) {
      return false;
    }
    
    // Apply all replacements
    replacements.forEach(({ pattern, replacement }) => {
      if (pattern.test && pattern.test(content)) {
        content = content.replace(pattern, replacement);
        modified = true;
      }
    });
    
    // Fix variable redeclaration issues
    const lines = content.split('\n');
    const seenVars = new Set();
    const filteredLines = [];
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      // Check for variable redeclaration
      const userMatch = line.match(/^\s*const\s+(user|userId)\s*=/);
      if (userMatch) {
        const varName = userMatch[1];
        const varKey = `${varName}_${i}`;
        
        if (seenVars.has(varName)) {
          // Rename the variable
          const newVarName = varName === 'user' ? 'dbUser' : 'clerkUserId';
          const newLine = line.replace(new RegExp(`\\b${varName}\\b`), newVarName);
          filteredLines.push(newLine);
          modified = true;
        } else {
          seenVars.add(varName);
          filteredLines.push(line);
        }
      } else {
        filteredLines.push(line);
      }
    }
    
    if (modified) {
      content = filteredLines.join('\n');
      
      // Clean up duplicate imports
      content = content.replace(/import\s*{\s*redirect\s*}\s*from\s*['"]next\/navigation['"];\s*\nimport\s*{\s*redirect\s*}\s*from\s*['"]next\/navigation['"];?/g, 
        "import { redirect } from 'next/navigation';");
      
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
  console.log('🔧 Starting comprehensive error fixes...\n');
  
  // Get all TypeScript files
  const allFiles = getAllTsFiles('./src');
  
  let fixedCount = 0;
  let totalCount = allFiles.length;
  
  allFiles.forEach(filePath => {
    if (fixFile(filePath)) {
      fixedCount++;
    }
  });
  
  console.log(`\n📊 Fix Summary:`);
  console.log(`   Processed: ${totalCount} files`);
  console.log(`   Fixed: ${fixedCount} files`);
  console.log(`   Skipped: ${totalCount - fixedCount} files`);
  
  if (fixedCount > 0) {
    console.log('\n🎯 Next steps:');
    console.log('   1. Review the changes');
    console.log('   2. Run npm run type-check');
    console.log('   3. Address any remaining manual fixes');
  }
}

if (require.main === module) {
  main();
}

module.exports = { fixFile, replacements };
