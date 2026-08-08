const fs = require('fs');
const path = require('path');

const baseDir = 'C:\\\\Users\\\\HC\\\\Desktop\\\\viral clip\\\\YouTube-Viral-Intelligence\\\\next-app';

function readFile(p) {
    return fs.readFileSync(path.join(baseDir, p), 'utf-8');
}

function writeFile(p, content) {
    fs.writeFileSync(path.join(baseDir, p), content, 'utf-8');
}

const tsPath = 'tests/e2e/studio.spec.ts';
let tsContent = readFile(tsPath);

// We need to replace:
// page.click("button", { hasText: /Create/i });
// with
// page.locator("button", { hasText: /Create/i }).click();
// using regex:
tsContent = tsContent.replace(/page\.click\(([^,]+),\s*(\{\s*hasText:[^\}]+\})\s*\)/g, 'page.locator($1, $2).click()');

writeFile(tsPath, tsContent);
console.log('Fixed playwright script!');
