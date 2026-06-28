const fs = require('fs');
const path = require('path');

const replacements = {
  '#0B0D17': '#232136',
  '#111827': '#2a273f',
  '#1F2937': '#393552',
  '#4B5563': '#6e6a86',
  '#8B949E': '#908caa',
  '#F8F9FA': '#e0def4',
  '#FF007A': '#eb6f92',
  '#FF5D00': '#f6c177',
  '#00E5FF': '#c4a7e7',
  '#00B3CC': '#b094d6',
  '#05050A': '#191724'
};

function processDirectory(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      processDirectory(fullPath);
    } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts') || fullPath.endsWith('.css')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      let modified = false;
      
      for (const [oldColor, newColor] of Object.entries(replacements)) {
        const regex = new RegExp(oldColor, 'gi');
        if (regex.test(content)) {
          content = content.replace(regex, newColor);
          modified = true;
        }
      }
      
      if (modified) {
        fs.writeFileSync(fullPath, content, 'utf8');
        console.log('Updated:', fullPath);
      }
    }
  }
}

processDirectory('./src');
console.log('Done fixing remaining colors.');
