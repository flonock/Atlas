const fs = require('fs');
const path = require('path');

const transcriptPath = '/home/apollon/.gemini/antigravity-cli/brain/9ffc1f55-31a5-499a-82e9-d5c1638a8e8e/.system_generated/logs/transcript_full.jsonl';
const lines = fs.readFileSync(transcriptPath, 'utf8').split('\n').filter(Boolean);

const fileContents = {};

for (const line of lines) {
  try {
    const step = JSON.parse(line);
    
    if (step.type === 'VIEW_FILE' && step.content) {
       const pathMatch = step.content.match(/File Path: `file:\/\/(.+?)`/);
       if (pathMatch) {
           const filepath = decodeURIComponent(pathMatch[1]);
           
           if (!fileContents[filepath]) {
               const contentLines = step.content.split('\n');
               const extractedLines = [];
               let isCode = false;
               
               for (const l of contentLines) {
                   if (l.match(/^1: /)) isCode = true;
                   
                   if (isCode) {
                       const m = l.match(/^\d+: (.*)/);
                       if (m) {
                           extractedLines.push(m[1]);
                       } else if (l.match(/^The above content shows the entire/)) {
                           break;
                       }
                   }
               }
               
               if (extractedLines.length > 0) {
                   fileContents[filepath] = extractedLines.join('\n');
               }
           }
       }
    }
  } catch(e) {}
}

console.log('Files captured:', Object.keys(fileContents));

for (const [filepath, content] of Object.entries(fileContents)) {
  if (filepath.startsWith('/home/apollon/atlas-workspace/src') || filepath.endsWith('globals.css') || filepath.endsWith('electron-main.js')) {
     fs.writeFileSync(filepath, content);
     console.log('Restored:', filepath);
  }
}
