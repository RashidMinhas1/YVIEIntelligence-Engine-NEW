const fs = require('fs');
const path = require('path');
const dir = 'C:\\Users\\HC\\Desktop\\viral clip\\YouTube-Viral-Intelligence\\next-app\\src\\components\\discovery-v2\\stages';
const files = fs.readdirSync(dir);
files.forEach(f => {
  if (f.endsWith('.tsx')) {
    const fp = path.join(dir, f);
    let content = fs.readFileSync(fp, 'utf8');
    content = content.replace(/\\`/g, '`');
    content = content.replace(/\\\$/g, '$');
    fs.writeFileSync(fp, content);
  }
});
