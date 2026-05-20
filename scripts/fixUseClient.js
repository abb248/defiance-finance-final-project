const fs = require('fs');
const path = require('path');

function walk(dir) {
  let results = [];
  try {
    const list = fs.readdirSync(dir);
    list.forEach(function(file) {
      file = path.join(dir, file);
      const stat = fs.statSync(file);
      if (stat && stat.isDirectory() && !file.includes('node_modules') && !file.includes('.next') && !file.includes('.git')) {
        results = results.concat(walk(file));
      } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
        results.push(file);
      }
    });
  } catch(e) {}
  return results;
}

const files = walk('./app').concat(walk('./components'));

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  // Pattern: Line 1 is FormattedAmount import, Line 2 is 'use client' or "use client"
  if (content.startsWith("import { FormattedAmount }")) {
    const lines = content.split('\n');
    // Check if line 2 (index 1) has 'use client'
    const line2 = (lines[1] || '').trim();
    if (line2 === "'use client';" || line2 === '"use client";' || line2 === "'use client'" || line2 === '"use client"') {
      // Swap: put 'use client' first, then the import
      const useClientLine = lines[1];
      lines[1] = lines[0];
      lines[0] = useClientLine;
      fs.writeFileSync(file, lines.join('\n'), 'utf8');
      console.log('Fixed: ' + file);
    }
  }
});

console.log('Done.');
