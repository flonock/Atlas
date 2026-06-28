const fs = require('fs');
const path = require('path');

const transcriptPath = '/home/apollon/.gemini/antigravity-cli/brain/ebbfdd0f-7a32-4922-8123-ecfb1978779f/.system_generated/logs/transcript_full.jsonl';

if (!fs.existsSync(transcriptPath)) {
  console.log('No transcript found at', transcriptPath);
  process.exit(1);
}

const lines = fs.readFileSync(transcriptPath, 'utf8').split('\n').filter(Boolean);

const fileContents = {};

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
        if (call.function.name === 'default_api:replace_file_content') {
           // We can't reconstruct the full file easily if it's just a replace
           // But let's see if they did write_to_file
        }
      }
    }
  } catch(e) {}
}

console.log('Files captured:', Object.keys(fileContents));

for (const [filepath, content] of Object.entries(fileContents)) {
  if (filepath.startsWith('/home/apollon/atlas-workspace/src')) {
     fs.writeFileSync(filepath, content);
     console.log('Restored:', filepath);
  }
}
