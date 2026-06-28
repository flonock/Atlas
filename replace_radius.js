const fs = require('fs');
const path = require('path');

function processDirectory(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      processDirectory(fullPath);
    } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      let modified = false;
      
      const r2xl = /rounded-2xl/g;
      if (r2xl.test(content)) {
        content = content.replace(r2xl, 'rounded-sm');
        modified = true;
      }
      
      const rxl = /rounded-xl/g;
      if (rxl.test(content)) {
        content = content.replace(rxl, 'rounded-sm');
        modified = true;
      }

      const rlg = /rounded-lg/g;
      if (rlg.test(content)) {
        content = content.replace(rlg, 'rounded-sm');
        modified = true;
      }

      if (modified) {
        fs.writeFileSync(fullPath, content, 'utf8');
        console.log('Updated radius:', fullPath);
      }
    }
  }
}

processDirectory('./src/components');
processDirectory('./src/app');
