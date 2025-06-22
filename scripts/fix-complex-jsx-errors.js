/**
 * Fix Complex JSX Syntax Errors
 * Addresses remaining complex JSX syntax patterns
 */

const fs = require('fs');
const path = require('path');

function fixComplexJSXErrors(content, filePath) {
  let hasChanges = false;
  const originalContent = content;

  // 1. Fix malformed template literals in onClick handlers
  // Pattern: onClick={(() => window.open(`/path/${variable)}/more`, '_blank'))}
  content = content.replace(
    /onClick=\{\(\(\) => window\.open\(`([^`]*)\$\{([^}]+)\)\}([^`]*)`([^)]*)\)\)\}/g,
    'onClick={() => window.open(`$1\\${$2}$3`$4)}'
  );

  // 2. Fix malformed template literals with mismatched parentheses
  // Pattern: ${variable)} should be ${variable}
  content = content.replace(/\$\{([^}]+)\)\}/g, '${$1}');

  // 3. Fix extra parentheses in arrow functions
  // Pattern: {(() => function())} should be {() => function()}
  content = content.replace(/\{\(\(\) => ([^}]+)\)\}/g, '{() => $1}');

  // 4. Fix malformed JSX expressions with missing closing braces
  // Look for patterns like: className={`class ${condition ? 'true' : 'false'`}
  content = content.replace(
    /className=\{\`([^`]*)\`([^}]*)\s*$/gm,
    'className={`$1`}'
  );

  // 5. Fix malformed arrow function parameters in JSX
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
    'onDoubleClick',
  ];

  for (const handler of eventHandlers) {
    // Fix missing parentheses around parameters
    const pattern = new RegExp(
      `${handler}=\\{\\(([a-zA-Z_$][a-zA-Z0-9_$]*) =>`,
      'g'
    );
    content = content.replace(pattern, `${handler}={($1) =>`);

    // Fix extra parentheses around function calls
    const callPattern = new RegExp(
      `${handler}=\\{\\(([a-zA-Z_$][a-zA-Z0-9_$]*)\\) as any\\}`,
      'g'
    );
    content = content.replace(callPattern, `${handler}={$1}`);

    const callPattern2 = new RegExp(
      `${handler}=\\{\\(([a-zA-Z_$][a-zA-Z0-9_$]*)\\)\\}`,
      'g'
    );
    content = content.replace(callPattern2, `${handler}={$1}`);
  }

  // 6. Fix malformed JSX closing brackets
  // Pattern: ) as any})) should be ))}
  content = content.replace(/\) as any\}\)\)/g, '))}');
  content = content.replace(/\}\) as any\}\)/g, '})}');
  content = content.replace(/\) as any\}/g, ')}');

  // 7. Fix missing closing JSX tags
  // This is more complex, but we can fix some common patterns
  const lines = content.split('\n');
  const fixedLines = [];
  let openTags = [];

  for (let i = 0; i < lines.length; i++) {
    let line = lines[i];

    // Track opening tags (excluding self-closing)
    const openTagMatches = line.match(/<([a-zA-Z][a-zA-Z0-9]*)[^>]*(?<!\/)\>/g);
    if (openTagMatches) {
      openTagMatches.forEach(tag => {
        const tagName = tag.match(/<([a-zA-Z][a-zA-Z0-9]*)/)[1];
        if (
          !['input', 'img', 'br', 'hr', 'meta', 'link'].includes(
            tagName.toLowerCase()
          )
        ) {
          openTags.push({ name: tagName, line: i });
        }
      });
    }

    // Track self-closing tags (remove from consideration)
    const selfClosingMatches = line.match(/<([a-zA-Z][a-zA-Z0-9]*)[^>]*\/\>/g);
    if (selfClosingMatches) {
      selfClosingMatches.forEach(tag => {
        const tagName = tag.match(/<([a-zA-Z][a-zA-Z0-9]*)/)[1];
        const index = openTags.findIndex(t => t.name === tagName);
        if (index !== -1) {
          openTags.splice(index, 1);
        }
      });
    }

    // Track closing tags
    const closeTagMatches = line.match(/<\/([a-zA-Z][a-zA-Z0-9]*)\>/g);
    if (closeTagMatches) {
      closeTagMatches.forEach(tag => {
        const tagName = tag.match(/<\/([a-zA-Z][a-zA-Z0-9]*)/)[1];
        const index = openTags.findIndex(t => t.name === tagName);
        if (index !== -1) {
          openTags.splice(index, 1);
        }
      });
    }

    fixedLines.push(line);
  }

  // 8. Fix specific patterns from error messages
  // Fix: '}' expected, ')' expected, '>' expected patterns
  content = content.replace(/\$\{([^}]+)\)\}/g, '${$1}');
  content = content.replace(
    /\`([^`]*)\$\{([^}]+)\)\}([^`]*)\`/g,
    '`$1${$2}$3`'
  );

  // 9. Fix malformed JSX attribute syntax
  // Pattern: attribute={value as any} should be attribute={value}
  content = content.replace(/(\w+)=\{([^}]+) as any\}/g, '$1={$2}');

  // 10. Fix missing React Fragment syntax for multiple root elements
  // This is a simple check - if we see return ( followed by multiple JSX elements
  const returnMatches = content.match(/return\s*\(\s*\n\s*<[^>]+>/);
  if (returnMatches) {
    // Count JSX elements at the same level
    const jsxElements = content.match(/<[a-zA-Z][^>]*>/g);
    if (jsxElements && jsxElements.length > 1) {
      // This might need React.Fragment wrapping, but we'll leave a comment
      content = content.replace(
        /return\s*\(/,
        'return (\n    // Note: Multiple root elements may need React.Fragment wrapping'
      );
    }
  }

  // 11. Fix common template literal issues
  content = content.replace(
    /\`([^`]*)\$\{([^}]+)\)\}([^`]*)\`/g,
    '`$1${$2}$3`'
  );

  // 12. Fix malformed function calls in JSX
  content = content.replace(
    /\{\(([a-zA-Z_$][a-zA-Z0-9_$]*)\) as any\}/g,
    '{$1}'
  );

  if (content !== originalContent) {
    hasChanges = true;
  }

  return { content, hasChanges };
}

function fixFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const { content: newContent, hasChanges } = fixComplexJSXErrors(
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
  console.log('🔧 Fixing complex JSX syntax errors...\n');

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

  console.log(`\n📊 Complex JSX Fix Summary:`);
  console.log(`   Files processed: ${processedCount}`);
  console.log(`   Files fixed: ${fixedCount}`);

  if (fixedCount > 0) {
    console.log('\n🔧 Complex JSX syntax fixes complete!');
    console.log('💡 Run "npm run type-check" to see the impact.');
  } else {
    console.log('\n✨ No complex JSX syntax fixes needed!');
  }
}

if (require.main === module) {
  main();
}

module.exports = { fixComplexJSXErrors, fixFile };
