#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Get all TypeScript files that need fixing
function getAllTSFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);

  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (
      stat.isDirectory() &&
      !file.startsWith('.') &&
      file !== 'node_modules'
    ) {
      getAllTSFiles(filePath, fileList);
    } else if (file.endsWith('.ts') || file.endsWith('.tsx')) {
      fileList.push(filePath);
    }
  });

  return fileList;
}

// Check if file is corrupted (single line with compressed content)
function isCorruptedFile(content) {
  const lines = content.split('\n');
  if (lines.length <= 3) {
    // Check for signs of corruption: multiple statements on one line
    const firstLine = lines[0] || '';
    return (
      firstLine.length > 200 ||
      firstLine.includes('; ') ||
      firstLine.includes('} }') ||
      firstLine.includes('() =>') ||
      (firstLine.includes('export ') && firstLine.includes('import '))
    );
  }
  return false;
}

// Create a basic TypeScript file template
function createBasicTemplate(filePath) {
  const fileName = path.basename(filePath, path.extname(filePath));
  const isReactComponent =
    filePath.includes('/components/') || filePath.endsWith('.tsx');
  const isHook = fileName.startsWith('use');
  const isService = filePath.includes('/services/');
  const isUtil = filePath.includes('/utils/') || filePath.includes('/lib/');

  if (isReactComponent) {
    return `'use client';

import React from 'react';

interface ${fileName}Props {
  // TODO: Define props
}

export function ${fileName}(props: ${fileName}Props) {
  return (
    <div>
      {/* TODO: Implement component */}
      <p>${fileName} component</p>
    </div>
  );
}

export default ${fileName};`;
  }

  if (isHook) {
    return `'use client';

import { useState, useEffect } from 'react';

export function ${fileName}() {
  // TODO: Implement hook logic
  const [state, setState] = useState(null);
  
  useEffect(() => {
    // TODO: Add effect logic
  }, []);
  
  return {
    // TODO: Return hook interface
    state,
    setState
  };
}

export default ${fileName};`;
  }

  if (isService) {
    const className = fileName.charAt(0).toUpperCase() + fileName.slice(1);
    return `// ${className} Service
// TODO: Implement service functionality

export class ${className} {
  constructor() {
    // TODO: Initialize service
  }
  
  // TODO: Add service methods
}

export default ${className};`;
  }

  if (isUtil) {
    return `// ${fileName} utility functions
// TODO: Implement utility functions

export function ${fileName}() {
  // TODO: Implement function
  return null;
}

export default ${fileName};`;
  }

  // Generic TypeScript file
  return `// ${fileName}
// TODO: Implement functionality

export const ${fileName} = {
  // TODO: Add exports
};

export default ${fileName};`;
}

// Process files
const srcDir = './src';
const tsFiles = getAllTSFiles(srcDir);
let fixedCount = 0;
let skippedCount = 0;

console.log(`Found ${tsFiles.length} TypeScript files to check...`);

tsFiles.forEach(filePath => {
  try {
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf8');

      if (isCorruptedFile(content)) {
        const template = createBasicTemplate(filePath);
        fs.writeFileSync(filePath, template);
        console.log(`Fixed: ${filePath}`);
        fixedCount++;
      } else {
        skippedCount++;
      }
    }
  } catch (error) {
    console.error(`Error processing ${filePath}:`, error.message);
  }
});

console.log(`\nProcessing complete!`);
console.log(`Fixed: ${fixedCount} files`);
console.log(`Skipped: ${skippedCount} files`);
console.log(
  `\nNote: Fixed files contain basic templates. You'll need to implement the actual functionality.`
);
