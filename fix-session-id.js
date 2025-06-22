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

function fixSessionId(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;

  // Pattern 1: { user: { role: "admin", email: "admin@209.works", name: "Admin User" } } without id
  if (content.includes('{ user: { role: "admin", email: "admin@209.works", name: "Admin User" } }')) {
    content = content.replace(
      /\{ user: \{ role: "admin", email: "admin@209\.works", name: "Admin User" \} \}/g,
      '{ user: { role: "admin", email: "admin@209.works", name: "Admin User", id: "admin-user-id" } }'
    );
    modified = true;
  }

  // Pattern 2: { user: { role: "employer", email: "employer@209.works", name: "Employer User" } } without id
  if (content.includes('{ user: { role: "employer", email: "employer@209.works", name: "Employer User" } }')) {
    content = content.replace(
      /\{ user: \{ role: "employer", email: "employer@209\.works", name: "Employer User" \} \}/g,
      '{ user: { role: "employer", email: "employer@209.works", name: "Employer User", id: "employer-user-id" } }'
    );
    modified = true;
  }

  // Pattern 3: { user: { role: "jobseeker", email: "jobseeker@209.works", name: "Job Seeker" } } without id
  if (content.includes('{ user: { role: "jobseeker", email: "jobseeker@209.works", name: "Job Seeker" } }')) {
    content = content.replace(
      /\{ user: \{ role: "jobseeker", email: "jobseeker@209\.works", name: "Job Seeker" \} \}/g,
      '{ user: { role: "jobseeker", email: "jobseeker@209.works", name: "Job Seeker", id: "jobseeker-user-id" } }'
    );
    modified = true;
  }

  if (modified) {
    fs.writeFileSync(filePath, content);
    console.log(`✅ Added id to session mocks in: ${filePath}`);
    return true;
  }
  
  return false;
}

console.log('🔧 Adding id property to session mocks...\n');

// Find all TypeScript and JavaScript files
const tsFiles = findFiles('./src', '.ts');
const tsxFiles = findFiles('./src', '.tsx');
const allFiles = [...tsFiles, ...tsxFiles];

let fixedCount = 0;

allFiles.forEach(filePath => {
  if (fixSessionId(filePath)) {
    fixedCount++;
  }
});

console.log(`\n✅ Added id property to session mocks in ${fixedCount} files!`);
console.log('🎯 All session mocks now include id property.');
