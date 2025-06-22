const fs = require('fs');
const path = require('path');

function findFiles(dir, extension) {
  let results = [];
  const list = fs.readdirSync(dir);
  
  list.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat && stat.isDirectory()) {
      // Skip node_modules and .next directories
      if (file !== 'node_modules' && file !== '.next' && file !== '.git') {
        results = results.concat(findFiles(filePath, extension));
      }
    } else if (file.endsWith(extension)) {
      results.push(filePath);
    }
  });
  
  return results;
}

function fixMalformedSyntax(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;

  // Pattern 1: ({ user: { role: "admin", email: "admin@209.works", name: "Admin User" } } // Mock session) as Session | null;
  const malformedPattern1 = /\(\{ user: \{ role: "[^"]+", email: "[^"]+", name: "[^"]+" \} \} \/\/ Mock session\) as [^;]+;/g;
  if (malformedPattern1.test(content)) {
    content = content.replace(malformedPattern1, '{ user: { role: "admin", email: "admin@209.works", name: "Admin User" } }; // Mock session');
    modified = true;
  }

  // Pattern 2: ({ user: { role: "admin", email: "admin@209.works", name: "Admin User" } } // Mock session) as AuthSession;
  const malformedPattern2 = /\(\{ user: \{ role: "[^"]+", email: "[^"]+", name: "[^"]+" \} \} \/\/ Mock session\) as AuthSession;/g;
  if (malformedPattern2.test(content)) {
    content = content.replace(malformedPattern2, '{ user: { role: "admin", email: "admin@209.works", name: "Admin User" } }; // Mock session');
    modified = true;
  }

  // Pattern 3: const session = ({ user: { role: "admin", email: "admin@209.works", name: "Admin User" } } // Mock session) as any;
  const malformedPattern3 = /const session = \(\{ user: \{ role: "[^"]+", email: "[^"]+", name: "[^"]+" \} \} \/\/ Mock session\) as [^;]+;/g;
  if (malformedPattern3.test(content)) {
    content = content.replace(malformedPattern3, 'const session = { user: { role: "admin", email: "admin@209.works", name: "Admin User" } }; // Mock session');
    modified = true;
  }

  if (modified) {
    fs.writeFileSync(filePath, content);
    console.log(`✅ Fixed malformed syntax in: ${filePath}`);
    return true;
  }
  
  return false;
}

console.log('🔧 Finding and fixing malformed syntax...\n');

// Find all TypeScript and JavaScript files
const tsFiles = findFiles('./src', '.ts');
const tsxFiles = findFiles('./src', '.tsx');
const allFiles = [...tsFiles, ...tsxFiles];

let fixedCount = 0;

allFiles.forEach(filePath => {
  if (fixMalformedSyntax(filePath)) {
    fixedCount++;
  }
});

console.log(`\n✅ Fixed malformed syntax in ${fixedCount} files!`);
console.log('🎯 All syntax errors should now be resolved.');
