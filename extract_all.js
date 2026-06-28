const fs = require('fs');
const path = require('path');

const ids = [
  'ebbfdd0f-7a32-4922-8123-ecfb1978779f',
  'afd52ee2-c934-4cb7-9b76-8833d07feda8',
  'c46fd5f4-fea0-4f81-9148-88c0b070420e'
];

const fileContents = {};

for (const id of ids) {
  const transcriptPath = `/home/apollon/.gemini/antigravity-cli/brain/${id}/.system_generated/logs/transcript_full.jsonl`;
  if (!fs.existsSync(transcriptPath)) continue;

  const lines = fs.readFileSync(transcriptPath, 'utf8').split('\n').filter(Boolean);
  for (const line of lines) {
    try {
      const step = JSON.parse(line);
      if (step.tool_calls) {
        for (const call of step.tool_calls) {
          if (call.function.name === 'default_api:write_to_file') {
            const args = JSON.parse(call.function.arguments);
            if (args.TargetFile && args.CodeContent) {
               fileContents[args.TargetFile] = args.CodeContent;
            }
          }
        }
      }
    } catch(e) {}
  }
}

console.log('Files captured:', Object.keys(fileContents));

for (const [filepath, content] of Object.entries(fileContents)) {
  if (filepath.startsWith('/home/apollon/atlas-workspace/src')) {
     fs.writeFileSync(filepath, content);
     console.log('Restored:', filepath);
  }
}
