const fs = require("fs");
const path = require("path");
const minimatch = require("minimatch");

// Configuration
const outputFile = "bundled-code.md";
const directoriesToInclude = [
  ".",
  "app",
  "lib",
  "prisma",
  "hooks",
  "components",
  "src",
];
const excludePatterns = [
  "**/node_modules/**",
  "**/public/**",
  "**/*.map",
  outputFile,
  "package-lock.json",
  "**/.next/**",
  "**/.git/**",
  'bundler.js',
  'node_modules',
];

// Helper function to check exclusion with minimatch
const isExcluded = (filePath) => {
  // Convert backslashes to forward slashes for consistent matching
  const normalizedPath = filePath.split(path.sep).join("/");
  return excludePatterns.some((pattern) => minimatch(normalizedPath, pattern));
};

// Generate file tree
const generateFileTree = (dir, prefix = "") => {
  // If the directory itself is excluded, return immediately
  const relDir = path.relative(__dirname, dir);
  if (isExcluded(relDir)) return "";

  let treeOutput = "";
  const items = fs.readdirSync(dir).sort();

  items.forEach((item, index) => {
    const fullPath = path.join(dir, item);
    const relPath = path.relative(__dirname, fullPath);

    if (isExcluded(relPath)) return;

    const stat = fs.statSync(fullPath);
    const isLast = index === items.length - 1;
    const connector = isLast ? "└───" : "├───";

    treeOutput += `${prefix}${connector}${item}\n`;

    if (stat.isDirectory()) {
      const newPrefix = prefix + (isLast ? "    " : "│   ");
      treeOutput += generateFileTree(fullPath, newPrefix);
    }
  });

  return treeOutput;
};

// Initialize bundled code with file tree
let bundledCode = "# Project Structure\n\n``"
bundledCode += generateFileTree(".");
bundledCode += "```\n\n# Bundled Next.js Application Code\n\n";

// Function to walk directories and collect files
const walkDir = (dir, callback) => {
  fs.readdirSync(dir).forEach((file) => {
    const fullPath = path.join(dir, file);
    const relPath = path.relative(__dirname, fullPath);

    if (isExcluded(relPath)) return;

    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      walkDir(fullPath, callback);
    } else if (
      [".js", ".jsx", ".ts", ".tsx", ".json", ".mjs", ".cjs"].includes(
        path.extname(file)
      )
    ) {
      callback(fullPath, relPath);
    }
  });
};

// Process top-level files in the current directory
const processRootFiles = () => {
  fs.readdirSync(__dirname).forEach((file) => {
    const fullPath = path.join(__dirname, file);
    const relPath = path.relative(__dirname, fullPath);

    if (isExcluded(relPath)) return;

    const stat = fs.statSync(fullPath);
    if (
      !stat.isDirectory() &&
      [".js", ".jsx", ".ts", ".tsx", ".json", ".mjs", ".cjs"].includes(
        path.extname(file)
      )
    ) {
      try {
        const content = fs.readFileSync(fullPath, "utf8");
        bundledCode += `## File: ${relPath}\n\`\`\`${path
          .extname(file)
          .substring(1)}\n${content}\n\`\`\`\n\n`;
      } catch (err) {
        console.error(`Error reading file ${fullPath}: ${err}`);
      }
    }
  });
};

// Collect code
processRootFiles();
directoriesToInclude.filter((dir) => dir !== ".").forEach((dir) => {
  const dirPath = path.join(__dirname, dir);
  if (fs.existsSync(dirPath)) {
    walkDir(dirPath, (fullPath, relPath) => {
      try {
        const content = fs.readFileSync(fullPath, "utf8");
        bundledCode += `## File: ${relPath}\n\`\`\`${path
          .extname(fullPath)
          .substring(1)}\n${content}\n\`\`\`\n\n`;
      } catch (err) {
        console.error(`Error reading file ${fullPath}: ${err}`);
      }
    });
  }
});

// Write to output file
fs.writeFileSync(path.join(__dirname, outputFile), bundledCode, "utf8");
console.log(`Bundled code written to ${outputFile}`);
