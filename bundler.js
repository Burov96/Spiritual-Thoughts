// bundle-code.js

const fs = require('fs');
const path = require('path');

// Configuration
const outputFile = 'bundled-code.md'; // Use .md for better readability
const directoriesToInclude = ['app', 'lib', 'prisma', 'hooks', 'components']; // Adjust as needed
const excludePatterns = ['**/node_modules/**', '**/public/**', '**/*.map']; // Exclude node_modules, public, and sourcemaps

// Helper function to check exclusion
const isExcluded = (filePath) => {
  return excludePatterns.some(pattern => {
    const regex = new RegExp(pattern.replace(/\*\*/g, '.*').replace(/\*/g, '[^/]*'));
    return regex.test(filePath);
  });
};

// Initialize bundled code
let bundledCode = '# Bundled Next.js Application Code\n\n';

// Function to walk through directories and collect files
const walkDir = (dir, callback) => {
  fs.readdirSync(dir).forEach(file => {
    const fullPath = path.join(dir, file);
    const relPath = path.relative(__dirname, fullPath);
    
    if (isExcluded(relPath)) return;

    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      walkDir(fullPath, callback);
    } else if (['.js', '.jsx', '.ts', '.tsx', '.json', '.mjs', '.cjs'].includes(path.extname(file))) {
      callback(fullPath, relPath);
    }
  });
};

// Collect and concatenate files
directoriesToInclude.forEach(dir => {
  const dirPath = path.join(__dirname, dir);
  if (fs.existsSync(dirPath)) {
    walkDir(dirPath, (fullPath, relPath) => {
      try {
        const content = fs.readFileSync(fullPath, 'utf8');
        bundledCode += `## File: ${relPath}\n\`\`\`${path.extname(fullPath).substring(1)}\n${content}\n\`\`\`\n\n`;
      } catch (err) {
        console.error(`Error reading file ${fullPath}: ${err}`);
      }
    });
  }
});

// Write to output file
fs.writeFileSync(path.join(__dirname, outputFile), bundledCode, 'utf8');
console.log(`Bundled code written to ${outputFile}`);
