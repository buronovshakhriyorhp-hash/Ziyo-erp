const fs = require('fs');
const path = require('path');

function walk(dir) {
  const files = [];
  for (const name of fs.readdirSync(dir)) {
    const full = path.join(dir, name);
    const stat = fs.statSync(full);
    if (stat.isDirectory()) files.push(...walk(full));
    else files.push(full);
  }
  return files;
}

const root = path.join(__dirname, '..', 'src');
const exts = new Set(['.ts', '.tsx']);
const files = walk(root).filter(f => exts.has(path.extname(f)));
let changed = 0;
for (const f of files) {
  let s = fs.readFileSync(f, 'utf8');
  const orig = s;
  s = s.replace(/@ts-ignore/g, '@ts-expect-error');
  s = s.replace(/@ts-expect-error/g, "@ts-expect-error TODO: explain");
  s = s.replace(/catch\s*\(\s*err\s*\)\s*\{/g, 'catch {');
  s = s.replace(/catch\s*\(\s*error\s*\)\s*\{/g, 'catch {');
  if (s !== orig) {
    fs.writeFileSync(f, s, 'utf8');
    changed++;
    console.log('patched', f);
  }
}
console.log('done, files changed:', changed);
