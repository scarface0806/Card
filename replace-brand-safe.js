const fs = require('fs');
const path = require('path');
const exts = ['.ts', '.tsx', '.js', '.jsx'];
const root = process.cwd();
const ignoreFiles = new Set(['replace-brand-safe.js', 'replace-brand.js']);
const replacements = [
  ['bg-gradient-to-br from-teal-600 to-emerald-600', 'bg-gradient-to-r from-primary to-secondary'],
  ['from-teal-600 to-emerald-600', 'from-primary to-secondary'],
  ['from-teal-500 to-emerald-500', 'from-primary to-secondary'],
  ['from-teal-700 to-emerald-600', 'from-primary-dark to-secondary'],
  ['bg-gradient-to-br from-teal-50 to-emerald-50', 'bg-gradient-to-r from-primary/10 to-secondary/10'],
  ['bg-gradient-to-r from-teal-50 to-emerald-50', 'bg-gradient-to-r from-primary/10 to-secondary/10'],
  ['bg-gradient-to-br from-teal-100 to-emerald-100', 'bg-gradient-to-r from-primary/10 to-secondary/10'],
  ['bg-gradient-to-br from-teal-100/40 to-emerald-100/30', 'bg-gradient-to-r from-primary/20 to-secondary/20'],
  ['bg-teal-600', 'bg-primary'],
  ['bg-teal-700', 'bg-primary-dark'],
  ['bg-teal-500', 'bg-primary'],
  ['bg-teal-400', 'bg-primary/95'],
  ['bg-teal-300', 'bg-primary/90'],
  ['text-teal-400', 'text-primary'],
  ['text-teal-500', 'text-primary'],
  ['text-teal-600', 'text-primary'],
  ['text-teal-700', 'text-primary-dark'],
  ['text-teal-800', 'text-primary-dark'],
  ['text-teal-900', 'text-primary-dark'],
  ['border-teal-500/20', 'border-primary/20'],
  ['border-teal-500', 'border-primary'],
  ['border-teal-600', 'border-primary'],
  ['border-teal-400/15', 'border-primary/15'],
  ['border-teal-300', 'border-primary/30'],
  ['focus:ring-teal-500/20', 'focus:ring-primary/50'],
  ['focus:ring-teal-500/30', 'focus:ring-primary/50'],
  ['focus:ring-teal-400', 'focus:ring-primary/50'],
  ['focus:border-teal-500/60', 'focus:border-primary'],
  ['hover:text-teal-400', 'hover:text-primary'],
  ['hover:text-teal-700', 'hover:text-primary-dark'],
  ['hover:text-teal-900', 'hover:text-primary-dark'],
  ['hover:bg-teal-800', 'hover:bg-primary-dark'],
  ['hover:bg-teal-100', 'hover:bg-primary/20'],
  ['hover:bg-teal-50', 'hover:bg-primary/15'],
  ['bg-emerald-50', 'bg-secondary/10'],
  ['bg-emerald-100', 'bg-secondary/10'],
  ['bg-emerald-200/20', 'bg-secondary/15'],
  ['bg-emerald-300', 'bg-secondary/15'],
  ['bg-emerald-400/15', 'bg-secondary/10'],
  ['bg-emerald-500/10', 'bg-secondary/10'],
  ['bg-emerald-500/20', 'bg-secondary/15'],
  ['text-emerald-300', 'text-primary'],
  ['text-emerald-400', 'text-primary'],
  ['text-emerald-500', 'text-primary'],
  ['text-emerald-600', 'text-primary'],
  ['text-emerald-700', 'text-primary'],
  ['text-emerald-800', 'text-primary'],
  ['from-emerald-200/50', 'from-secondary/20'],
  ['from-emerald-200', 'from-secondary/20'],
  ['from-emerald-500', 'from-secondary'],
  ['to-emerald-500', 'to-secondary'],
  ['from-emerald-700 via-teal-800 to-green-900', 'from-secondary via-primary to-primary-dark'],
  ['from-emerald-300 to-teal-200', 'from-secondary to-primary'],
  ['from-cyan-500 to-teal-500', 'from-secondary to-primary'],
  ['bg-gradient-to-r from-cyan-500 to-teal-500', 'bg-gradient-to-r from-secondary to-primary'],
  ['from-teal-300 to-emerald-300', 'from-primary to-secondary'],
  ['bg-gradient-to-br from-teal-400/20 to-emerald-400/20', 'bg-gradient-to-r from-primary/20 to-secondary/20'],
  ['bg-gradient-to-r from-teal-100/40 to-emerald-100/30', 'bg-gradient-to-r from-primary/20 to-secondary/20'],
  ['bg-gradient-to-br from-teal-500 via-teal-600 to-emerald-600', 'bg-gradient-to-r from-primary via-primary-dark to-secondary'],
  ['border-emerald-500/50', 'border-secondary/50'],
  ['shadow-emerald-500/20', 'shadow-secondary/20'],
  ['shadow-teal-500/10', 'shadow-primary-glow'],
  ['shadow-teal-500/20', 'shadow-primary-glow'],
  ['shadow-teal-500/30', 'shadow-primary-glow'],
  ['bg-teal-300/10', 'bg-primary/10'],
  ['bg-teal-200/30', 'bg-primary/15'],
  ['border-teal-400', 'border-primary/30'],
  ['bg-gradient-to-br from-cyan-500 to-teal-600', 'bg-gradient-to-r from-secondary to-primary'],
  ['bg-gradient-to-br from-teal-500 via-teal-600 to-emerald-600', 'bg-gradient-to-r from-primary via-primary-dark to-secondary'],
  ['bg-gradient-to-r from-teal-500 to-emerald-500', 'bg-gradient-to-r from-primary to-secondary'],
  ['bg-gradient-to-r from-teal-300 to-emerald-300', 'bg-gradient-to-r from-primary to-secondary'],
  ['shadow-lg shadow-primary-glow', 'shadow-lg shadow-primary-glow'],
];

function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (['node_modules', '.git', 'public', 'out', '.next'].includes(entry.name)) continue;
      walk(full);
    } else if (exts.includes(path.extname(entry.name))) {
      if (ignoreFiles.has(path.basename(full))) continue;
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
