const fs = require('fs');
const path = require('path');

function walk(dir) {
  let results = [];
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
  return results;
}

const files = walk('./app').concat(walk('./components'));
let modifiedCount = 0;

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  if (content.includes('formatAmount(') && file !== path.resolve('./components/FormattedAmount.tsx')) {
    
    // We only want to replace instances inside JSX curly braces like {formatAmount(amount)} 
    // or as part of a template literal `${formatAmount(amount)}`.
    // It's safer to just inject import { FormattedAmount } from '@/components/FormattedAmount'
    // and replace `{formatAmount(X)}` with `<FormattedAmount amount={X} />`
    
    let original = content;

    // Pattern 1: {formatAmount(X)}
    content = content.replace(/\{formatAmount\(([^)]+)\)\}/g, '<FormattedAmount amount={$1} />');
    
    // Pattern 2: ${formatAmount(X)} -> wait, inside template literals it's harder.
    // Let's just leave template literals for now or replace them with logic?
    // Actually, in `BudgetManagement.tsx`, there are template literals: `This category is over by ${formatAmount(..)}`
    
    if (content !== original) {
      if (!content.includes('FormattedAmount')) {
        content = `import { FormattedAmount } from '@/components/FormattedAmount';\n` + content;
      } else if (original.includes('FormattedAmount') === false) {
        content = `import { FormattedAmount } from '@/components/FormattedAmount';\n` + content;
      }
      fs.writeFileSync(file, content, 'utf8');
      console.log('Updated: ' + file);
      modifiedCount++;
    }
  }
});

console.log('Total files modified: ' + modifiedCount);
