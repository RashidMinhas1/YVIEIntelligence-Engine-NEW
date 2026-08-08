const fs = require('fs');
const path = require('path');

const baseDir = 'C:\\\\Users\\\\HC\\\\Desktop\\\\viral clip\\\\YouTube-Viral-Intelligence\\\\next-app';

function readFile(p) {
    return fs.readFileSync(path.join(baseDir, p), 'utf-8');
}

function writeFile(p, content) {
    fs.writeFileSync(path.join(baseDir, p), content, 'utf-8');
}

// 1. Fix SceneCard.tsx
const scPath = 'src/components/studio/panels/SceneCard.tsx';
let scContent = readFile(scPath);
scContent = scContent.replace(/visual: v/g, "visualNotes: v");
scContent = scContent.replace(/section\.visual \|\|/g, "section.visualNotes ||");
scContent = scContent.replace(/camera: v/g, "cameraAngle: v");
scContent = scContent.replace(/section\.camera \|\|/g, "section.cameraAngle ||");
scContent = scContent.replace(/\{\.\.\.\(provided\?\.draggableProps \|\| \{\}\)\}/g, "{...(provided?.draggableProps as any)}");
scContent = scContent.replace(/\{\.\.\.\(provided\?\.dragHandleProps \|\| \{\}\)\}/g, "{...(provided?.dragHandleProps as any)}");
writeFile(scPath, scContent);

// 2. Fix storyboard-panel.tsx (add wpm to SceneCardProps usages)
const spPath = 'src/components/studio/panels/storyboard-panel.tsx';
let spContent = readFile(spPath);
spContent = spContent.replace(/globalTheme=\{globalTheme\}/g, "globalTheme={globalTheme}\n                          wpm={wpm}");
writeFile(spPath, spContent);

// 3. Fix studio.spec.ts (tests/e2e/studio.spec.ts)
const tsPath = 'tests/e2e/studio.spec.ts';
let tsContent = readFile(tsPath);
// Some .click({ hasText: "..." }) might still be there if my previous regex missed them, 
// because playwright click doesn't take hasText.
// Instead of complex regex, let's just do a naive replace:
tsContent = tsContent.replace(/\.click\(\{\s*hasText:\s*"Save"\s*\}\)/g, '.filter({ hasText: "Save" }).click()');
tsContent = tsContent.replace(/\.click\(\{\s*hasText:\s*'([^']+)'\s*\}\)/g, '.filter({ hasText: \'$1\' }).click()');
tsContent = tsContent.replace(/\.click\(\{\s*hasText:\s*"([^"]+)"\s*\}\)/g, '.filter({ hasText: "$1" }).click()');
writeFile(tsPath, tsContent);

console.log('Fixed TS errors!');
