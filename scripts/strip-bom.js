const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.join(process.cwd(), 'prisma', 'migrations');

const stripBom = (filePath) => {
  const content = fs.readFileSync(filePath, 'utf8');
  if (content.charCodeAt(0) !== 0xfeff) {
    return false;
  }
  const cleaned = content.slice(1);
  fs.writeFileSync(filePath, cleaned, 'utf8');
  return true;
};

const walk = (dir, onFile) => {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(fullPath, onFile);
    } else if (entry.isFile()) {
      onFile(fullPath);
    }
  }
};

if (fs.existsSync(ROOT)) {
  const modified = [];
  walk(ROOT, (filePath) => {
    if (path.basename(filePath) !== 'migration.sql') return;
    if (stripBom(filePath)) modified.push(filePath);
  });

  if (modified.length) {
    console.log('[strip-bom] Removed BOM from:');
    for (const filePath of modified) {
      console.log(`- ${path.relative(process.cwd(), filePath)}`);
    }
  } else {
    console.log('[strip-bom] No BOM found in migrations.');
  }
} else {
  console.log('[strip-bom] No prisma/migrations directory found.');
}
