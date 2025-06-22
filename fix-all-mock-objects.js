const fs = require('fs');
const path = require('path');

function findFiles(dir, extension) {
  let results = [];
  const list = fs.readdirSync(dir);
  
  list.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat && stat.isDirectory()) {
      if (file !== 'node_modules' && file !== '.next' && file !== '.git') {
        results = results.concat(findFiles(filePath, extension));
      }
    } else if (file.endsWith(extension)) {
      results.push(filePath);
    }
  });
  
  return results;
}

function fixAllMockObjects(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;

  // Fix all incomplete mock result objects
  const mockPatterns = [
    // Pattern 1: { ok: true } -> { ok: true, error: null, status: 200, url: null }
    {
      search: /\{ ok: true \}/g,
      replace: '{ ok: true, error: null, status: 200, url: null }'
    },
    // Pattern 2: { ok: false } -> { ok: false, error: "Mock error", status: 400, url: null }
    {
      search: /\{ ok: false \}/g,
      replace: '{ ok: false, error: "Mock error", status: 400, url: null }'
    },
    // Pattern 3: { ok: true, url: '/some/path' } -> add missing properties
    {
      search: /\{ ok: true, url: '([^']+)' \}/g,
      replace: '{ ok: true, error: null, status: 200, url: \'$1\' }'
    },
    // Pattern 4: { user: { email: 'email', role: 'role' } } -> add missing name and id
    {
      search: /\{ user: \{ email: '([^']+)', role: '([^']+)' \} \}/g,
      replace: '{ user: { email: \'$1\', role: \'$2\', name: \'Mock User\', id: \'mock-user-id\' } }'
    },
    // Pattern 5: { email: 'email' } -> add missing sub property
    {
      search: /\{ email: '([^']+)' \}/g,
      replace: '{ email: \'$1\', sub: \'mock-user-id\' }'
    }
  ];

  mockPatterns.forEach(pattern => {
    if (pattern.search.test(content)) {
      content = content.replace(pattern.search, pattern.replace);
      modified = true;
    }
  });

  // Fix specific NextAuth/Clerk related patterns
  const authPatterns = [
    // Fix useSession mock calls
    {
      search: /const session = \{ user: \{ email: '([^']+)', role: '([^']+)' \} \};/g,
      replace: 'const session = { user: { email: \'$1\', role: \'$2\', name: \'Mock User\', id: \'mock-user-id\' } };'
    },
    // Fix signIn result mocks
    {
      search: /const result = \{ ok: true, url: '([^']+)' \};/g,
      replace: 'const result = { ok: true, error: null, status: 200, url: \'$1\' };'
    },
    // Fix token mocks
    {
      search: /const token = \{ email: '([^']+)' \};/g,
      replace: 'const token = { email: \'$1\', sub: \'mock-user-id\' };'
    }
  ];

  authPatterns.forEach(pattern => {
    if (pattern.search.test(content)) {
      content = content.replace(pattern.search, pattern.replace);
      modified = true;
    }
  });

  if (modified) {
    fs.writeFileSync(filePath, content);
    console.log(`✅ Fixed mock objects in: ${filePath}`);
    return true;
  }
  
  return false;
}

console.log('🔧 Fixing ALL mock object issues comprehensively...\n');

// Find all TypeScript and JavaScript files
const tsFiles = findFiles('./src', '.ts');
const tsxFiles = findFiles('./src', '.tsx');
const allFiles = [...tsFiles, ...tsxFiles];

let fixedCount = 0;

allFiles.forEach(filePath => {
  if (fixAllMockObjects(filePath)) {
    fixedCount++;
  }
});

console.log(`\n✅ Fixed mock objects in ${fixedCount} files!`);
console.log('🎯 All mock objects should now have complete properties.');
console.log('🚀 Ready for build!');
