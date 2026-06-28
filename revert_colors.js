const fs = require('fs');
const path = require('path');

const directory = '/home/apollon/atlas-workspace/src';

const replacements = [
  // Backgrounds
  { regex: /bg-\[#05050A\]/g, replacement: 'bg-[#232136]' },
  { regex: /bg-\[#0B0D17\]/g, replacement: 'bg-[#232136]' },
  { regex: /bg-\[#111827\]/g, replacement: 'bg-[#2a273f]' },
  { regex: /bg-\[#1F2937\]/g, replacement: 'bg-[#393552]' },
  
  // Borders
  { regex: /border-\[rgba\(0,229,255,0\.2\)\]/g, replacement: 'border-[#393552]' },
  { regex: /border-\[rgba\(0,229,255,0\.3\)\]/g, replacement: 'border-[#44415a]' },
  { regex: /border-\[rgba\(0,229,255,0\.1\)\]/g, replacement: 'border-[#393552]' },
  { regex: /border-\[#1F2937\]/g, replacement: 'border-[#393552]' },
  { regex: /border-\[#00E5FF\]\/30/g, replacement: 'border-[#c4a7e7]/30' },
  { regex: /border-\[#00E5FF\]\/50/g, replacement: 'border-[#c4a7e7]/50' },
  { regex: /border-\[#00E5FF\]/g, replacement: 'border-[#c4a7e7]' },
  
  // Texts
  { regex: /text-\[#F8F9FA\]/g, replacement: 'text-[#e0def4]' },
  { regex: /text-\[#8B949E\]/g, replacement: 'text-[#908caa]' },
  { regex: /text-\[#4B5563\]/g, replacement: 'text-[#6e6a86]' },
  { regex: /text-\[#00E5FF\]/g, replacement: 'text-[#c4a7e7]' },
  { regex: /text-\[#FF007A\]/g, replacement: 'text-[#eb6f92]' },
  { regex: /text-\[#FF5D00\]/g, replacement: 'text-[#f6c177]' },
  
  // Accents & Alphas
  { regex: /bg-\[rgba\(0,229,255,0\.05\)\]/g, replacement: 'bg-[rgba(196,167,231,0.05)]' },
  { regex: /bg-\[rgba\(0,229,255,0\.1\)\]/g, replacement: 'bg-[rgba(196,167,231,0.1)]' },
  { regex: /bg-\[rgba\(0,229,255,0\.02\)\]/g, replacement: 'bg-transparent' },
  { regex: /rgba\(0,\s*229,\s*255,\s*0\.05\)/g, replacement: 'rgba(196, 167, 231, 0.05)' },
  { regex: /rgba\(0,\s*229,\s*255,\s*0\.1\)/g, replacement: 'rgba(196, 167, 231, 0.1)' },
  { regex: /rgba\(0,\s*229,\s*255,\s*0\.2\)/g, replacement: 'rgba(110, 106, 134, 0.2)' },
  { regex: /rgba\(0,\s*229,\s*255,\s*0\.5\)/g, replacement: 'rgba(196, 167, 231, 0.5)' },
  { regex: /rgba\(0,229,255,0\.5\)/g, replacement: 'rgba(196,167,231,0.5)' },
  { regex: /rgba\(0,229,255,0\.02\)/g, replacement: 'rgba(196,167,231,0.02)' },
  { regex: /bg-\[#00B3CC\]/g, replacement: 'bg-[#908caa]' },
  { regex: /bg-\[#00E5FF\]\/10/g, replacement: 'bg-[#c4a7e7]/10' },
  { regex: /bg-\[#00E5FF\]\/20/g, replacement: 'bg-[#c4a7e7]/20' },
  { regex: /bg-\[#00E5FF\]\/50/g, replacement: 'bg-[#c4a7e7]/50' },
  { regex: /bg-\[#00E5FF\]/g, replacement: 'bg-[#c4a7e7]' },
  { regex: /bg-\[#FF007A\]\/10/g, replacement: 'bg-[#eb6f92]/10' },
  { regex: /bg-\[#FF007A\]\/20/g, replacement: 'bg-[#eb6f92]/20' },
  { regex: /bg-\[#FF007A\]/g, replacement: 'bg-[#eb6f92]' },
  { regex: /bg-\[#FF5D00\]\/20/g, replacement: 'bg-[#f6c177]/20' },
  { regex: /bg-\[#FF5D00\]/g, replacement: 'bg-[#f6c177]' },

  // Shadows
  { regex: /shadow-\[0_0_15px_rgba\(0,0,0,0\.8\)\]/g, replacement: 'shadow-lg' },
  { regex: /shadow-\[inset_0_0_20px_rgba\(0,0,0,0\.5\)\]/g, replacement: 'shadow-md' },
  { regex: /shadow-\[0_0_15px_rgba\(0,229,255,0\.2\)\]/g, replacement: 'shadow-md' },
  { regex: /shadow-\[0_0_20px_rgba\(0,229,255,0\.4\)\]/g, replacement: 'shadow-md' },
  { regex: /shadow-\[0_0_40px_rgba\(0,0,0,0\.8\),inset_0_0_20px_rgba\(196, 167, 231, 0\.05\)\]/g, replacement: 'shadow-2xl' },
  { regex: /drop-shadow-\[0_0_5px_rgba\(0,229,255,0\.3\)\]/g, replacement: '' },
  { regex: /drop-shadow-\[0_0_5px_rgba\(0,229,255,0\.5\)\]/g, replacement: '' },
  { regex: /boxShadow: '0 0 12px rgba\(235,111,146,0\.8\)'/g, replacement: "boxShadow: '0 0 8px rgba(235,111,146,0.4)'" },
  { regex: /boxShadow: '0 0 12px rgba\(235,111,146,0\.5\)'/g, replacement: "boxShadow: '0 0 8px rgba(235,111,146,0.4)'" },
  { regex: /drop-shadow-md/g, replacement: 'drop-shadow-sm' },

  // Strokes
  { regex: /stroke-\[#FF007A\]/g, replacement: 'stroke-[#eb6f92]' },
  { regex: /stroke="\#FF007A"/g, replacement: 'stroke="#eb6f92"' },
  { regex: /stroke="\#00E5FF"/g, replacement: 'stroke="#c4a7e7"' },
  { regex: /fill="\#00E5FF"/g, replacement: 'fill="#c4a7e7"' },
  { regex: /fill="\#FF007A"/g, replacement: 'fill="#eb6f92"' },

  // HUD Specific Classes
  { regex: /hud-border/g, replacement: '' },
  { regex: /hud-glow-magenta/g, replacement: '' },
  { regex: /hud-glow/g, replacement: '' },
  { regex: /rounded-sm/g, replacement: 'rounded-lg' },

  // Typography
  { regex: /uppercase tracking-widest/g, replacement: '' },
  { regex: /uppercase tracking-wider/g, replacement: '' },
  { regex: /uppercase tracking-wide/g, replacement: '' },
  { regex: /tracking-widest uppercase/g, replacement: '' },
  { regex: /font-black/g, replacement: 'font-bold' },
  { regex: /text-\[#0B0D17\]/g, replacement: 'text-[#232136]' },
  { regex: /text-\[#05050A\]/g, replacement: 'text-[#232136]' },
  { regex: /bg-\[#0B0D17\]/g, replacement: 'bg-[#232136]' },
  { regex: /bg-\[#05050A\]/g, replacement: 'bg-[#232136]' },
];

function processDirectory(dir) {
  const files = fs.readdirSync(dir);
  
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      processDirectory(fullPath);
    } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      
      replacements.forEach(({ regex, replacement }) => {
        content = content.replace(regex, replacement);
      });
      
      // Clean up multiple spaces that might result from replacing with empty strings
      content = content.replace(/ +/g, ' ');
      // Fix string class concatenations with extra spaces like `className="   flex"` -> `className="flex"`
      content = content.replace(/className="\s+/g, 'className="');
      
      fs.writeFileSync(fullPath, content);
    }
  }
}

processDirectory(directory);
console.log('Done reverting colors and styles.');
