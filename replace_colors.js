const fs = require('fs');
const path = require('path');

const replacements = {
  '#232136': '#0B0D17',
  '#2a273f': '#111827',
  '#393552': '#1F2937',
  '#6e6a86': '#4B5563',
  '#908caa': '#8B949E',
  '#e0def4': '#F8F9FA',
  '#eb6f92': '#FF007A',
  '#f6c177': '#FF5D00',
  '#ea9a97': '#FF007A',
  '#3e8fb0': '#00E5FF',
  '#9ccfd8': '#00E5FF',
  '#c4a7e7': '#00E5FF',
  '#b094d6': '#00B3CC',
  '#191724': '#05050A'
};

function processDirectory(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      processDirectory(fullPath);
    } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      let modified = false;
      
      for (const [oldColor, newColor] of Object.entries(replacements)) {
        // Replace case-insensitive, globally
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

processDirectory('./src/components');
processDirectory('./src/app');
