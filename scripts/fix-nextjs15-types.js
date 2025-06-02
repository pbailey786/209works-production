const fs = require('fs');
const path = require('path');
const glob = require('glob');

// Find all page.tsx files in the app directory
const pageFiles = glob.sync('src/app/**/page.tsx', {
  ignore: ['**/node_modules/**', '**/.next/**']
});

console.log(`Found ${pageFiles.length} page files to check...`);

let filesUpdated = 0;

pageFiles.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let updated = false;

  // Check if file has params prop
  if (content.includes('params:') && content.includes('{ id: string }') && !content.includes('Promise<{ id: string }>')) {
    // Update params to be Promise
    content = content.replace(/params:\s*{\s*id:\s*string\s*}/g, 'params: Promise<{ id: string }>');
    
    // Update the destructuring to await params
    content = content.replace(/const\s*{\s*id\s*}\s*=\s*params;/g, 'const { id } = await params;');
    
    // If params is used directly without destructuring
    content = content.replace(/params\.id/g, '(await params).id');
    
    updated = true;
  }

  // Check if file has searchParams prop
  if (content.includes('searchParams:') && !content.includes('Promise<')) {
    // Find the interface/type definition for searchParams
    const searchParamsMatch = content.match(/searchParams:\s*([A-Za-z]+[A-Za-z0-9]*)/);
    if (searchParamsMatch) {
      const typeName = searchParamsMatch[1];
      // Update searchParams to be Promise
      content = content.replace(
        new RegExp(`searchParams:\\s*${typeName}`, 'g'),
        `searchParams: Promise<${typeName}>`
      );
      
      // Add await for searchParams
      const functionMatch = content.match(/export\s+default\s+async\s+function\s+\w+\s*\([^)]*\)\s*{/);
      if (functionMatch) {
        const functionEnd = content.indexOf('{', functionMatch.index) + 1;
        const nextLines = content.substring(functionEnd).split('\n');
        
        // Find where to insert the await
        let insertIndex = functionEnd;
        for (let i = 0; i < nextLines.length; i++) {
          if (nextLines[i].trim() && !nextLines[i].includes('const session')) {
            // Insert before the first non-empty line that's not session related
            insertIndex = functionEnd + nextLines.slice(0, i).join('\n').length;
            break;
          }
        }
        
        // Check if params is already awaited
        if (!content.includes('await searchParams')) {
          content = content.slice(0, insertIndex) + 
            '\n  const params = await searchParams;\n' + 
            content.slice(insertIndex);
          
          // Replace all searchParams references with params
          content = content.replace(/searchParams\./g, 'params.');
        }
      }
      
      updated = true;
    }
  }

  if (updated) {
    fs.writeFileSync(file, content);
    filesUpdated++;
    console.log(`Updated: ${file}`);
  }
});

console.log(`\nUpdated ${filesUpdated} files for Next.js 15 compatibility.`);

// Also update route handlers
const routeFiles = glob.sync('src/app/**/route.ts', {
  ignore: ['**/node_modules/**', '**/.next/**']
});

console.log(`\nFound ${routeFiles.length} route files to check...`);

let routesUpdated = 0;

routeFiles.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let updated = false;

  // Check for route handlers with params
  const routeHandlerRegex = /export\s+async\s+function\s+(GET|POST|PUT|PATCH|DELETE)\s*\([^,)]+,\s*{\s*params\s*}\s*:\s*{\s*params:\s*{\s*[^}]+\s*}\s*}\s*\)/g;
  
  if (routeHandlerRegex.test(content)) {
    // Update to use Promise for params
    content = content.replace(
      /{\s*params\s*}\s*:\s*{\s*params:\s*{\s*([^}]+)\s*}\s*}/g,
      '{ params }: { params: Promise<{ $1 }> }'
    );
    
    // Add await for params usage
    content = content.replace(/params\./g, '(await params).');
    
    updated = true;
  }

  if (updated) {
    fs.writeFileSync(file, content);
    routesUpdated++;
    console.log(`Updated route: ${file}`);
  }
});

console.log(`\nUpdated ${routesUpdated} route files for Next.js 15 compatibility.`);
console.log('\nNext.js 15 type fixes completed!'); 