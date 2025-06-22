const fs = require('fs');
const path = require('path');

// Get all files that might have syntax errors
const { execSync } = require('child_process');

function getAllFilesWithSyntaxErrors() {
  try {
    const adminFiles = execSync('find src/app/admin -name "*.tsx"', { encoding: 'utf8' });
    const apiFiles = execSync('find src/app/api -name "*.ts"', { encoding: 'utf8' });
    const allFiles = (adminFiles + apiFiles).trim().split('\n').filter(file => file.trim() !== '');
    return allFiles;
  } catch (error) {
    console.log('⚠️  Could not find files automatically');
    return [];
  }
}

const filesToFix = getAllFilesWithSyntaxErrors();

function fixFile(filePath) {
  if (!fs.existsSync(filePath)) {
    console.log(`⚠️  File not found: ${filePath}`);
    return;
  }

  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;

  // Fix the broken permission check syntax
  if (content.includes('if (!true // TODO: Replace with Clerk permissions) {')) {
    content = content.replace(
      /if \(!true \/\/ TODO: Replace with Clerk permissions\) \{\s*redirect\([^)]+\);\s*\}/g,
      `// TODO: Replace with Clerk permissions
  // if (!hasPermission(userRole, Permission.MANAGE_ADS)) {
  //   redirect('/admin');
  // }`
    );
    modified = true;
  }

  // Fix other broken permission patterns
  if (content.includes('if (!user || !true // TODO: Replace with Clerk permissions) {')) {
    content = content.replace(
      /if \(!user \|\| !true \/\/ TODO: Replace with Clerk permissions\) \{\s*redirect\([^)]+\);\s*\}/g,
      `// TODO: Replace with Clerk permissions
  // if (!user || !hasPermission(userRole, Permission.ADMIN_ACCESS)) {
  //   redirect('/');
  // }`
    );
    modified = true;
  }

  // Fix API route permission patterns
  if (content.includes('if (!true // TODO: Replace with Clerk permissions) {')) {
    content = content.replace(
      /if \(!true \/\/ TODO: Replace with Clerk permissions\) \{\s*return NextResponse\.json\([^}]+\}[^}]*\}[^;]*;\s*\}/g,
      `// TODO: Replace with Clerk permissions
    // if (!hasPermission(userRole, Permission.ADMIN_ACCESS)) {
    //   return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    // }`
    );
    modified = true;
  }

  // Fix complex permission patterns with userRole checks
  if (content.includes('if (userRole !== \'admin\' && !true // TODO: Replace with Clerk permissions) {')) {
    content = content.replace(
      /if \(userRole !== 'admin' && !true \/\/ TODO: Replace with Clerk permissions\) \{\s*redirect\([^)]+\);\s*\}/g,
      `// TODO: Replace with Clerk permissions
  // if (userRole !== 'admin' && !hasPermission(userRole, Permission.ADMIN_ACCESS)) {
  //   redirect('/admin');
  // }`
    );
    modified = true;
  }

  // Fix admin user permission patterns
  if (content.includes('if (!adminUser || !true // TODO: Replace with Clerk permissions) {')) {
    content = content.replace(
      /if \(!adminUser \|\| !true \/\/ TODO: Replace with Clerk permissions\) \{\s*return NextResponse\.json\([^}]+\}[^}]*\}[^;]*;\s*\}/g,
      `// TODO: Replace with Clerk permissions
    // if (!adminUser || !hasPermission(userRole, Permission.ADMIN_ACCESS)) {
    //   return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    // }`
    );
    modified = true;
  }

  if (modified) {
    fs.writeFileSync(filePath, content);
    console.log(`✅ Fixed syntax errors in: ${filePath}`);
  } else {
    console.log(`ℹ️  No syntax errors found in: ${filePath}`);
  }
}

console.log('🔧 Fixing syntax errors...\n');

filesToFix.forEach(fixFile);

console.log('\n✅ Syntax error fixes complete!');
