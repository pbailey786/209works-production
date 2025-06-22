/**
 * Fix JSX Arrow Function Syntax Errors
 * Specifically targets malformed arrow function patterns in JSX
 */

const fs = require('fs');
const path = require('path');

function fixJSXArrowFunctions(content, filePath) {
  let hasChanges = false;
  const originalContent = content;

  // 1. Fix malformed arrow function parameters in event handlers
  // Pattern: onChange={(e => should be onChange={(e) =>
  const eventHandlers = [
    'onChange',
    'onClick',
    'onSubmit',
    'onFocus',
    'onBlur',
    'onKeyDown',
    'onKeyUp',
    'onMouseDown',
    'onMouseUp',
    'onMouseEnter',
    'onMouseLeave',
    'onSelect',
    'onInput',
    'onLoad',
    'onError',
  ];

  for (const handler of eventHandlers) {
    // Fix: handler={(param => to handler={(param) =>
    const pattern = new RegExp(
      `${handler}=\\{\\(([a-zA-Z_$][a-zA-Z0-9_$]*) =>`,
      'g'
    );
    content = content.replace(pattern, `${handler}={($1) =>`);
  }

  // 2. Fix malformed closing brackets in arrow functions
  // Pattern: ) as any})) should be ))}
  content = content.replace(/\) as any\}\)\)/g, '))}');
  content = content.replace(/\}\) as any\}\)/g, '})}');

  // 3. Fix malformed function calls in event handlers
  // Pattern: onClick={(functionName) as any} should be onClick={functionName}
  content = content.replace(
    /onClick=\{\(([a-zA-Z_$][a-zA-Z0-9_$]*)\) as any\}/g,
    'onClick={$1}'
  );
  content = content.replace(
    /onChange=\{\(([a-zA-Z_$][a-zA-Z0-9_$]*)\) as any\}/g,
    'onChange={$1}'
  );
  content = content.replace(
    /onSubmit=\{\(([a-zA-Z_$][a-zA-Z0-9_$]*)\) as any\}/g,
    'onSubmit={$1}'
  );

  // 4. Fix extra parentheses around function names
  // Pattern: onClick={(functionName)} should be onClick={functionName}
  content = content.replace(
    /onClick=\{\(([a-zA-Z_$][a-zA-Z0-9_$]*)\)\}/g,
    'onClick={$1}'
  );
  content = content.replace(
    /onChange=\{\(([a-zA-Z_$][a-zA-Z0-9_$]*)\)\}/g,
    'onChange={$1}'
  );
  content = content.replace(
    /onSubmit=\{\(([a-zA-Z_$][a-zA-Z0-9_$]*)\)\}/g,
    'onSubmit={$1}'
  );

  // 5. Fix malformed arrow function syntax in map/filter/etc
  // Pattern: .map((item => should be .map((item) =>
  content = content.replace(
    /\.map\(\(([a-zA-Z_$][a-zA-Z0-9_$]*) =>/g,
    '.map(($1) =>'
  );
  content = content.replace(
    /\.filter\(\(([a-zA-Z_$][a-zA-Z0-9_$]*) =>/g,
    '.filter(($1) =>'
  );
  content = content.replace(
    /\.forEach\(\(([a-zA-Z_$][a-zA-Z0-9_$]*) =>/g,
    '.forEach(($1) =>'
  );
  content = content.replace(
    /\.find\(\(([a-zA-Z_$][a-zA-Z0-9_$]*) =>/g,
    '.find(($1) =>'
  );
  content = content.replace(
    /\.some\(\(([a-zA-Z_$][a-zA-Z0-9_$]*) =>/g,
    '.some(($1) =>'
  );
  content = content.replace(
    /\.every\(\(([a-zA-Z_$][a-zA-Z0-9_$]*) =>/g,
    '.every(($1) =>'
  );

  // 6. Fix malformed arrow functions in general contexts
  // Pattern: {(param => should be {(param) =>
  content = content.replace(/\{\(([a-zA-Z_$][a-zA-Z0-9_$]*) =>/g, '{($1) =>');

  // 7. Remove unnecessary 'as any' type assertions
  content = content.replace(/\) as any\}/g, ')}');
  content = content.replace(/\} as any\)/g, '})');
  content = content.replace(/([a-zA-Z_$][a-zA-Z0-9_$]*) as any\}/g, '$1}');

  // 8. Fix specific malformed patterns from the error output
  // Pattern: ) as any})) should be ))}
  content = content.replace(/\) as any\}\)\)/g, '))}');

  // 9. Fix missing closing brackets in JSX expressions
  // This is more complex and might need manual review, but we can fix common patterns
  content = content.replace(/\{\s*([^}]+)\s*\}\s*\)/g, '{$1})');

  // 10. Fix malformed template literals in className
  // Pattern: className={`class ${condition ? 'true' : 'false'`} (missing closing brace)
  content = content.replace(
    /className=\{\`([^`]*)\`([^}]*)\s*$/gm,
    'className={`$1`}'
  );

  if (content !== originalContent) {
    hasChanges = true;
  }

  return { content, hasChanges };
}

function fixFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const { content: newContent, hasChanges } = fixJSXArrowFunctions(
      content,
      filePath
    );

    if (hasChanges) {
      fs.writeFileSync(filePath, newContent);
      return true;
    }
    return false;
  } catch (error) {
    console.error(`❌ Error fixing ${filePath}:`, error.message);
    return false;
  }
}

function getAllTSXFiles(dir, files = []) {
  const items = fs.readdirSync(dir);

  for (const item of items) {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);

    if (
      stat.isDirectory() &&
      !['node_modules', '.next', '.git', 'dist'].includes(item)
    ) {
      getAllTSXFiles(fullPath, files);
    } else if (stat.isFile() && item.endsWith('.tsx')) {
      files.push(fullPath);
    }
  }

  return files;
}

function main() {
  console.log('🎯 Fixing JSX arrow function syntax errors...\n');

  const allFiles = getAllTSXFiles('src');
  console.log(`Found ${allFiles.length} TSX files to process...\n`);

  let fixedCount = 0;
  let processedCount = 0;

  for (const file of allFiles) {
    processedCount++;
    if (fixFile(file)) {
      console.log(`✅ Fixed: ${file}`);
      fixedCount++;
    }

    if (processedCount % 50 === 0) {
      console.log(
        `📊 Progress: ${processedCount}/${allFiles.length} files processed...`
      );
    }
  }

  console.log(`\n📊 JSX Arrow Function Fix Summary:`);
  console.log(`   Files processed: ${processedCount}`);
  console.log(`   Files fixed: ${fixedCount}`);

  if (fixedCount > 0) {
    console.log('\n🎯 JSX arrow function fixes complete!');
    console.log('💡 Run "npm run type-check" to see the impact.');
  } else {
    console.log('\n✨ No JSX arrow function fixes needed!');
  }
}

if (require.main === module) {
  main();
}

module.exports = { fixJSXArrowFunctions, fixFile };
