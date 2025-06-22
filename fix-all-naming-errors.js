#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Function to convert kebab-case to camelCase
function kebabToCamelCase(str) {
  return str.replace(/-([a-z])/g, (match, letter) => letter.toUpperCase());
}

// Function to convert kebab-case to PascalCase
function kebabToPascalCase(str) {
  return str.replace(/(^|-)([a-z])/g, (match, dash, letter) => letter.toUpperCase());
}

// Get all TypeScript files that might have naming issues
function getAllTSFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory() && !file.startsWith('.') && file !== 'node_modules') {
      getAllTSFiles(filePath, fileList);
    } else if ((file.endsWith('.ts') || file.endsWith('.tsx')) && file.includes('-')) {
      fileList.push(filePath);
    }
  });
  
  return fileList;
}

function fixFileContent(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const fileName = path.basename(filePath, path.extname(filePath));
    const isReactComponent = filePath.endsWith('.tsx');
    
    // Only process files with hyphens in the name
    if (!fileName.includes('-')) {
      return null;
    }
    
    // Convert kebab-case names to valid JavaScript identifiers
    const camelCaseName = kebabToCamelCase(fileName);
    const pascalCaseName = kebabToPascalCase(fileName);
    
    let newContent = content;
    
    // Fix variable/function names with hyphens
    newContent = newContent.replace(new RegExp(`\\b${fileName}\\b`, 'g'), camelCaseName);
    
    // Fix interface names for React components
    if (isReactComponent) {
      newContent = newContent.replace(
        new RegExp(`interface ${fileName}Props`, 'g'),
        `interface ${pascalCaseName}Props`
      );
      newContent = newContent.replace(
        new RegExp(`export function ${fileName}`, 'g'),
        `export function ${pascalCaseName}`
      );
      newContent = newContent.replace(
        new RegExp(`${fileName}Props`, 'g'),
        `${pascalCaseName}Props`
      );
    }
    
    // Fix export statements
    newContent = newContent.replace(
      new RegExp(`export const ${fileName}`, 'g'),
      `export const ${camelCaseName}`
    );
    newContent = newContent.replace(
      new RegExp(`export function ${fileName}`, 'g'),
      `export function ${camelCaseName}`
    );
    newContent = newContent.replace(
      new RegExp(`export default ${fileName}`, 'g'),
      `export default ${camelCaseName}`
    );
    
    // Fix class names
    newContent = newContent.replace(
      new RegExp(`class ${fileName}`, 'g'),
      `class ${pascalCaseName}`
    );
    
    return newContent;
  } catch (error) {
    console.error(`Error reading ${filePath}:`, error.message);
    return null;
  }
}

const srcDir = './src';
const tsFiles = getAllTSFiles(srcDir);
let fixedCount = 0;

console.log(`Found ${tsFiles.length} TypeScript files with hyphens to fix...`);

tsFiles.forEach(filePath => {
  const fixedContent = fixFileContent(filePath);
  if (fixedContent) {
    fs.writeFileSync(filePath, fixedContent);
    console.log(`Fixed: ${filePath}`);
    fixedCount++;
  }
});

console.log(`\nFixed ${fixedCount} files with naming errors.`);
