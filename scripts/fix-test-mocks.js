/**
 * Fix Test Mock Statements Script
 * Fixes malformed mock statements in test files
 */

const fs = require('fs');

function fixMockStatements(content) {
  // Fix malformed prismaMock statements
  // Pattern: prismaMock.someVariable as any as any.$2.mockResolvedValue($3 as any);
  content = content.replace(
    /prismaMock\.([a-zA-Z_$][a-zA-Z0-9_$]*) as any as any\.\$2\.mockResolvedValue\(\$3 as any\);/g,
    'prismaMock.job.findUnique.mockResolvedValue($1 as any);'
  );

  // Fix patterns like: prismaMock.123 as any.$2.mockResolvedValue($3 as any);
  content = content.replace(
    /prismaMock\.(\d+) as any\.\$2\.mockResolvedValue\(\$3 as any\);/g,
    'prismaMock.job.findMany.mockResolvedValue([] as any);'
  );

  // Fix patterns like: prismaMock.mockJobs.slice(0, 10.$2.mockResolvedValue($3 as any));
  content = content.replace(
    /prismaMock\.([a-zA-Z_$][a-zA-Z0-9_$]*)\.slice\(0, (\d+)\.\$2\.mockResolvedValue\(\$3 as any\)\);/g,
    'prismaMock.job.findMany.mockResolvedValue($1.slice(0, $2) as any);'
  );

  // Fix patterns like: prismaMock.[] as any as any.$2.mockResolvedValue($3 as any);
  content = content.replace(
    /prismaMock\.\[\] as any as any\.\$2\.mockResolvedValue\(\$3 as any\);/g,
    'prismaMock.job.findMany.mockResolvedValue([] as any);'
  );

  // Fix patterns like: prismaMock.{ ...object, prop: value } as any as any.$2.mockResolvedValue($3 as any);
  content = content.replace(
    /prismaMock\.\{ ([^}]+) \} as any as any\.\$2\.mockResolvedValue\(\$3 as any\);/g,
    'prismaMock.job.update.mockResolvedValue({ $1 } as any);'
  );

  // Fix specific variable patterns
  content = content.replace(
    /prismaMock\.mockJobs\.slice\(0, 10\.\$2\.mockResolvedValue\(\$3 as any\)\);/g,
    'prismaMock.job.findMany.mockResolvedValue(mockJobs.slice(0, 10) as any);'
  );

  content = content.replace(
    /prismaMock\.stocktonJobs as any as any\.\$2\.mockResolvedValue\(\$3 as any\);/g,
    'prismaMock.job.findMany.mockResolvedValue(stocktonJobs as any);'
  );

  content = content.replace(
    /prismaMock\.highPayingJobs as any as any\.\$2\.mockResolvedValue\(\$3 as any\);/g,
    'prismaMock.job.findMany.mockResolvedValue(highPayingJobs as any);'
  );

  content = content.replace(
    /prismaMock\.engineerJobs as any as any\.\$2\.mockResolvedValue\(\$3 as any\);/g,
    'prismaMock.job.findMany.mockResolvedValue(engineerJobs as any);'
  );

  content = content.replace(
    /prismaMock\.mockUser as any as any\.\$2\.mockResolvedValue\(\$3 as any\);/g,
    'prismaMock.user.findUnique.mockResolvedValue(mockUser as any);'
  );

  content = content.replace(
    /prismaMock\.mockJob as any as any\.\$2\.mockResolvedValue\(\$3 as any\);/g,
    'prismaMock.job.findUnique.mockResolvedValue(mockJob as any);'
  );

  content = content.replace(
    /prismaMock\.newJob as any as any\.\$2\.mockResolvedValue\(\$3 as any\);/g,
    'prismaMock.job.create.mockResolvedValue(newJob as any);'
  );

  content = content.replace(
    /prismaMock\.updatedJob as any as any\.\$2\.mockResolvedValue\(\$3 as any\);/g,
    'prismaMock.job.update.mockResolvedValue(updatedJob as any);'
  );

  content = content.replace(
    /prismaMock\.otherUser as any as any\.\$2\.mockResolvedValue\(\$3 as any\);/g,
    'prismaMock.user.findUnique.mockResolvedValue(otherUser as any);'
  );

  content = content.replace(
    /prismaMock\.null as any as any\.\$2\.mockResolvedValue\(\$3 as any\);/g,
    'prismaMock.job.findUnique.mockResolvedValue(null);'
  );

  content = content.replace(
    /prismaMock\.jobWithApplications as any as any\.\$2\.mockResolvedValue\(\$3 as any\);/g,
    'prismaMock.job.findUnique.mockResolvedValue(jobWithApplications as any);'
  );

  // Fix any remaining generic patterns
  content = content.replace(
    /prismaMock\.([a-zA-Z_$][a-zA-Z0-9_$]*) as any as any\.\$2\.mockResolvedValue\(\$3 as any\);/g,
    'prismaMock.job.findUnique.mockResolvedValue($1 as any);'
  );

  return content;
}

function fixTestFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    const originalContent = content;

    content = fixMockStatements(content);

    if (content !== originalContent) {
      fs.writeFileSync(filePath, content);
      console.log(`✅ Fixed: ${filePath}`);
      return true;
    } else {
      console.log(`ℹ️  No changes: ${filePath}`);
      return false;
    }
  } catch (error) {
    console.error(`❌ Error fixing ${filePath}:`, error.message);
    return false;
  }
}

function main() {
  console.log('🔧 Fixing test mock statements...\n');

  const testFiles = [
    'src/__tests__/integration/api/jobs.test.ts',
    'src/__tests__/utils/test-helpers.tsx'
  ];

  let fixedCount = 0;

  for (const file of testFiles) {
    if (fixTestFile(file)) {
      fixedCount++;
    }
  }

  console.log(`\n📊 Summary:`);
  console.log(`   Files processed: ${testFiles.length}`);
  console.log(`   Files fixed: ${fixedCount}`);

  if (fixedCount > 0) {
    console.log('\n🎉 Test mock statements have been fixed!');
    console.log('💡 Run "npm run type-check" to verify the fixes.');
  } else {
    console.log('\n✨ All test files are already correct!');
  }
}

if (require.main === module) {
  main();
}

module.exports = { fixMockStatements, fixTestFile };
