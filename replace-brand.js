const fs = require('fs');
const path = require('path');
const exts = ['.ts', '.tsx', '.js', '.jsx'];
const root = process.cwd();
const replacements = [
  ['bg-gradient-to-r from-primary to-secondary', 'bg-gradient-to-r from-primary to-secondary'],
  ['bg-gradient-to-r from-primary/10 to-secondary/10', 'bg-gradient-to-r from-primary/10 to-secondary/10'],
  ['bg-gradient-to-r from-primary/10 to-secondary/10', 'bg-gradient-to-r from-primary/10 to-secondary/10'],
  ['from-primary to-secondary', 'from-primary to-secondary'],
  ['from-primary to-secondary', 'from-primary to-secondary'],
  ['from-primary to-secondary', 'from-primary to-secondary'],
  ['bg-primary', 'bg-primary'],
  ['bg-primary-dark', 'bg-primary-dark'],
  ['text-primary', 'text-primary'],
  ['text-primary', 'text-primary'],
  ['text-[#0f2e25]', 'text-[#0f2e25]'],
  ['border-primary/20', 'border-primary/20'],
  ['border-primary/10', 'border-primary/10'],
  ['bg-primary/10', 'bg-primary/10'],
  ['bg-primary/20', 'bg-primary/20'],
  ['bg-primary/15', 'bg-primary/15'],
  ['bg-primary/20', 'bg-primary/20'],
  ['bg-primary/100/10', 'bg-primary/10'],
  ['bg-primary/100/20', 'bg-primary/15'],
  ['hover:bg-primary/10', 'hover:bg-primary/15'],
  ['hover:bg-primary/20', 'hover:bg-primary/20'],
  ['hover:text-primary', 'hover:text-primary'],
  ['hover:text-primary', 'hover:text-primary-dark'],
  ['focus:ring-primary/50', 'focus:ring-primary/50'],
  ['focus:border-primary', 'focus:border-primary'],
  ['shadow-primary-glow', 'shadow-primary-glow'],
  ['shadow-primary-glow', 'shadow-primary-glow'],
  ['shadow-primary-glow', 'shadow-primary-glow'],
  ['shadow-primary-glow', 'shadow-primary-glow'],
  ['bg-primary/10', 'bg-primary/10'],
  ['bg-primary/10', 'bg-primary/10'],
  ['bg-primary/15', 'bg-primary/15'],
  ['border-primary/20', 'border-primary/20'],
  ['bg-primary/100/10', 'bg-primary/10'],
  ['bg-primary/100/20', 'bg-primary/15'],
  ['text-primary', 'text-primary'],
  ['text-primary', 'text-primary'],
  ['text-primary', 'text-primary'],
  ['text-primary', 'text-primary'],
  ['from-primary/20', 'from-primary/20'],
  ['from-primary/20', 'from-primary/20'],
  ['from-secondary', 'from-secondary'],
  ['to-secondary', 'to-secondary'],
  ['text-primary', 'text-primary'],
  ['bg-primary/15', 'bg-primary/15'],
  ['hover:border-primary/30', 'hover:border-primary/30'],
  ['bg-primary/15', 'bg-primary/15'],
  ['bg-primary/100', 'bg-primary'],
  ['bg-primary', 'bg-primary'],
  ['bg-secondary/15', 'bg-secondary/15'],
  ['bg-secondary/10', 'bg-secondary/10'],
  ['bg-primary/100/15', 'bg-secondary/10'],
  ['text-primary', 'text-primary'],
  ['text-primary', 'text-primary'],
  ['border-secondary/20', 'border-secondary/20'],
  ['bg-secondary/15', 'bg-secondary/15'],
  ['bg-secondary/15', 'bg-secondary/15'],
  ['bg-primary', 'bg-primary'],
  ['from-primary', 'from-primary'],
  ['text-primary', 'text-primary'],
  ['text-primary', 'text-secondary'],
  ['bg-secondary', 'bg-secondary']
];

function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (['node_modules', '.git', 'public', 'out', '.next'].includes(entry.name)) continue;
      walk(full);
    } else if (exts.includes(path.extname(entry.name))) {
      let content = fs.readFileSync(full, 'utf8');
      const original = content;
      for (const [from, to] of replacements) {
        content = content.split(from).join(to);
      }
      if (content !== original) {
        fs.writeFileSync(full, content, 'utf8');
        console.log(`Updated: ${full}`);
      }
    }
  }
}

walk(root);
console.log('Replacement pass complete.');
