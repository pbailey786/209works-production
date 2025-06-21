/**
 * Fix JSX Syntax Errors
 * Addresses malformed JSX syntax patterns causing TypeScript errors
 */

const fs = require('fs');
const path = require('path');

function fixJSXSyntaxErrors(content, filePath) {
  let hasChanges = false;
  const originalContent = content;

  // 1. Fix malformed arrow function syntax in event handlers
  // Pattern: onChange={(e => should be onChange={(e) =>
  content = content.replace(/onChange=\{\(([a-zA-Z_$][a-zA-Z0-9_$]*) =>/g, 'onChange={($1) =>');
  content = content.replace(/onClick=\{\(([a-zA-Z_$][a-zA-Z0-9_$]*) =>/g, 'onClick={($1) =>');
  content = content.replace(/onSubmit=\{\(([a-zA-Z_$][a-zA-Z0-9_$]*) =>/g, 'onSubmit={($1) =>');
  content = content.replace(/onFocus=\{\(([a-zA-Z_$][a-zA-Z0-9_$]*) =>/g, 'onFocus={($1) =>');
  content = content.replace(/onBlur=\{\(([a-zA-Z_$][a-zA-Z0-9_$]*) =>/g, 'onBlur={($1) =>');
  content = content.replace(/onKeyDown=\{\(([a-zA-Z_$][a-zA-Z0-9_$]*) =>/g, 'onKeyDown={($1) =>');
  content = content.replace(/onKeyUp=\{\(([a-zA-Z_$][a-zA-Z0-9_$]*) =>/g, 'onKeyUp={($1) =>');

  // 2. Fix malformed function calls in onClick handlers
  // Pattern: onClick={(functionName) as any} should be onClick={functionName}
  content = content.replace(/onClick=\{\(([a-zA-Z_$][a-zA-Z0-9_$]*)\) as any\}/g, 'onClick={$1}');
  content = content.replace(/onClick=\{\(([a-zA-Z_$][a-zA-Z0-9_$]*)\)\}/g, 'onClick={$1}');

  // 3. Fix malformed JSX closing brackets
  // Pattern: ) as any})) should be ))}
  content = content.replace(/\) as any\}\)\)/g, '))}');
  content = content.replace(/\}\) as any\}\)/g, '})}');

  // 4. Fix malformed JSX expressions with missing parentheses
  // Pattern: {variable as any} should be {variable}
  content = content.replace(/\{([a-zA-Z_$][a-zA-Z0-9_$]*) as any\}/g, '{$1}');

  // 5. Fix malformed template literals in JSX
  // Pattern: className={`class ${condition ? 'true' : 'false'`} (missing closing brace)
  content = content.replace(/className=\{\`([^`]+)\`([^}]*)\}/g, (match, template, rest) => {
    if (!rest.includes('}')) {
      return `className={\`${template}\`}`;
    }
    return match;
  });

  // 6. Fix missing closing JSX tags
  // Look for unclosed div tags and other common patterns
  const lines = content.split('\n');
  const fixedLines = [];
  let openTags = [];
  
  for (let i = 0; i < lines.length; i++) {
    let line = lines[i];
    
    // Track opening tags
    const openTagMatches = line.match(/<([a-zA-Z][a-zA-Z0-9]*)[^>]*(?<!\/)\>/g);
    if (openTagMatches) {
      openTagMatches.forEach(tag => {
        const tagName = tag.match(/<([a-zA-Z][a-zA-Z0-9]*)/)[1];
        openTags.push(tagName);
      });
    }
    
    // Track self-closing tags (remove from stack)
    const selfClosingMatches = line.match(/<([a-zA-Z][a-zA-Z0-9]*)[^>]*\/\>/g);
    if (selfClosingMatches) {
      selfClosingMatches.forEach(tag => {
        const tagName = tag.match(/<([a-zA-Z][a-zA-Z0-9]*)/)[1];
        const index = openTags.lastIndexOf(tagName);
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
        const index = openTags.lastIndexOf(tagName);
        if (index !== -1) {
          openTags.splice(index, 1);
        }
      });
    }
    
    fixedLines.push(line);
  }

  // 7. Fix specific JSX syntax patterns
  // Fix: } as any})) patterns
  content = content.replace(/\} as any\}\)\)/g, '})}');
  
  // Fix: missing parentheses in arrow functions
  content = content.replace(/=\{e =>/g, '={(e) =>');
  content = content.replace(/=\{event =>/g, '={(event) =>');
  content = content.replace(/=\{value =>/g, '={(value) =>');

  // 8. Fix malformed JSX attribute syntax
  // Pattern: attribute={value as any} should be attribute={value}
  content = content.replace(/(\w+)=\{([^}]+) as any\}/g, '$1={$2}');

  // 9. Fix missing React Fragment syntax
  // If we see multiple root elements, wrap in Fragment
  if (content.includes('JSX expressions must have one parent element')) {
    // This is a more complex fix that would require AST parsing
    // For now, we'll add a comment to manually fix
    content = content.replace(
      /return \(/,
      'return (\n    // TODO: Wrap multiple root elements in React.Fragment or <></>'
    );
  }

  // 10. Fix common JSX closing tag issues
  content = content.replace(/\<\/([A-Z][a-zA-Z0-9]*)\s*\>/g, '</$1>');

  if (content !== originalContent) {
    hasChanges = true;
  }

  return { content, hasChanges };
}

function fixFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const { content: newContent, hasChanges } = fixJSXSyntaxErrors(content, filePath);

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
    
    if (stat.isDirectory() && !['node_modules', '.next', '.git', 'dist'].includes(item)) {
      getAllTSXFiles(fullPath, files);
    } else if (stat.isFile() && item.endsWith('.tsx')) {
      files.push(fullPath);
    }
  }
  
  return files;
}

function main() {
  console.log('🔧 Fixing JSX syntax errors...\n');

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
      console.log(`📊 Progress: ${processedCount}/${allFiles.length} files processed...`);
    }
  }

  console.log(`\n📊 JSX Syntax Fix Summary:`);
  console.log(`   Files processed: ${processedCount}`);
  console.log(`   Files fixed: ${fixedCount}`);

  if (fixedCount > 0) {
    console.log('\n🔧 JSX syntax fixes complete!');
    console.log('💡 Run "npm run type-check" to see the impact.');
  } else {
    console.log('\n✨ No JSX syntax fixes needed!');
  }
}

if (require.main === module) {
  main();
}

module.exports = { fixJSXSyntaxErrors, fixFile };
