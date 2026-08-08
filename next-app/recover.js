const fs = require('fs');
const readline = require('readline');

const rl = readline.createInterface({
  input: fs.createReadStream('C:/Users/HC/.gemini/antigravity/brain/9886a7a9-75d7-4922-838f-f72e24581641/.system_generated/logs/transcript_full.jsonl')
});

let bestCode = [];

rl.on('line', (line) => {
  if (line.includes('Stage3OutlierVideos.tsx') && line.includes('File Path:')) {
    try {
      const obj = JSON.parse(line);
      
      function walk(o) {
         if (typeof o === 'string' && o.includes('File Path:') && o.includes('Stage3OutlierVideos.tsx')) {
            if (!o.includes('The above content does NOT show the entire file contents')) {
               const lines = o.split('\n');
               const currentCode = [];
               for (const l of lines) {
                  const match = l.match(/^\d+: (.*)/);
                  if (match) {
                     currentCode.push(match[1]);
                  }
               }
               if (currentCode.length > bestCode.length) {
                  bestCode = currentCode;
               }
            }
         } else if (typeof o === 'object' && o !== null) {
            for (const k in o) {
               walk(o[k]);
            }
         }
      }
      walk(obj);
    } catch (e) {}
  }
});

rl.on('close', () => {
  if (bestCode.length > 0) {
    fs.writeFileSync('C:/Users/HC/Desktop/viral clip/YouTube-Viral-Intelligence/next-app/src/components/discovery-v2/stages/Stage3OutlierVideos.tsx', bestCode.join('\n'));
    console.log('Successfully recovered file! Lines:', bestCode.length);
  } else {
    console.log('Could not find view_file output');
  }
});
