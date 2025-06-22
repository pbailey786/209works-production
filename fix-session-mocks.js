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

function fixSessionMocks(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;

  // Pattern 1: { user: { role: "admin" } } without email
  if (content.includes('{ user: { role: "admin" } }')) {
    content = content.replace(
      /\{ user: \{ role: "admin" \} \}/g,
      '{ user: { role: "admin", email: "admin@209.works", name: "Admin User" } }'
    );
    modified = true;
  }

  // Pattern 2: { user: { role: "employer" } } without email
  if (content.includes('{ user: { role: "employer" } }')) {
    content = content.replace(
      /\{ user: \{ role: "employer" \} \}/g,
      '{ user: { role: "employer", email: "employer@209.works", name: "Employer User" } }'
    );
    modified = true;
  }

  // Pattern 3: { user: { role: "jobseeker" } } without email
  if (content.includes('{ user: { role: "jobseeker" } }')) {
    content = content.replace(
      /\{ user: \{ role: "jobseeker" \} \}/g,
      '{ user: { role: "jobseeker", email: "jobseeker@209.works", name: "Job Seeker" } }'
    );
    modified = true;
  }

  // Pattern 4: Generic role without quotes
  const rolePattern = /\{ user: \{ role: ([a-zA-Z]+) \} \}/g;
  if (rolePattern.test(content)) {
    content = content.replace(rolePattern, (match, role) => {
      return `{ user: { role: "${role}", email: "${role}@209.works", name: "${role.charAt(0).toUpperCase() + role.slice(1)} User" } }`;
    });
    modified = true;
  }

  if (modified) {
    fs.writeFileSync(filePath, content);
    console.log(`✅ Fixed session mocks in: ${filePath}`);
    return true;
  }
  
  return false;
}

console.log('🔧 Finding and fixing session mock issues...\n');

// Find all TypeScript and JavaScript files
const tsFiles = findFiles('./src', '.ts');
const tsxFiles = findFiles('./src', '.tsx');
const allFiles = [...tsFiles, ...tsxFiles];

let fixedCount = 0;

allFiles.forEach(filePath => {
  if (fixSessionMocks(filePath)) {
    fixedCount++;
  }
});

console.log(`\n✅ Fixed session mocks in ${fixedCount} files!`);
console.log('🎯 All session mocks now include email and name properties.');
