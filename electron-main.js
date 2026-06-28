const { app, BrowserWindow, ipcMain } = require('electron');
const { spawn } = require('child_process');
const path = require('path');

let mainWindow;
let streamlitProcess;

function createWindow () {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    title: 'Atlas Workspace',
    autoHideMenuBar: true,
    backgroundColor: '#232136',
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      webviewTag: true
    }
  });

  // Load the Next.js app on port 3005 to avoid collision with uni-workspace
  mainWindow.loadURL('http://localhost:3005');
  
  // Start the scientific plotter in the background
  startStreamlit();
}

function startStreamlit() {
  const plotterDir = '/home/apollon/scientific_plotter';
  // Add plotterDir to PYTHONPATH
  const env = Object.assign({}, process.env, { PYTHONPATH: `${plotterDir}:${process.env.PYTHONPATH || ''}` });
  
  streamlitProcess = spawn(
    '/home/apollon/scientific_plotter/venv/bin/python', 
    ['-m', 'streamlit', 'run', 'app/main.py', '--server.port', '8505', '--server.headless', 'true'], 
    { cwd: plotterDir, env: env }
  );
  
  streamlitProcess.stdout.on('data', (data) => {
    console.log(`Streamlit: ${data}`);
  });
  
  streamlitProcess.stderr.on('data', (data) => {
    console.error(`Streamlit Error: ${data}`);
  });
}

const fs = require('fs');
const os = require('os');
const { dialog } = require('electron');

const CONFIG_DIR = path.join(os.homedir(), '.config', 'atlas-workspace');
const PROJECTS_FILE = path.join(CONFIG_DIR, 'projects.json');

// Ensure config dir exists
if (!fs.existsSync(CONFIG_DIR)) {
  fs.mkdirSync(CONFIG_DIR, { recursive: true });
}

// IPC Handlers
ipcMain.handle('select-folder', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openDirectory']
  });
  if (result.canceled) return null;
  return result.filePaths[0];
});

ipcMain.handle('get-projects', () => {
  if (!fs.existsSync(PROJECTS_FILE)) return [];
  try {
    return JSON.parse(fs.readFileSync(PROJECTS_FILE, 'utf-8'));
  } catch (e) {
    return [];
  }
});

ipcMain.handle('add-project', (event, project) => {
  let projects = [];
  if (fs.existsSync(PROJECTS_FILE)) {
    try { projects = JSON.parse(fs.readFileSync(PROJECTS_FILE, 'utf-8')); } catch (e) {}
  }
  projects.push(project);
  fs.writeFileSync(PROJECTS_FILE, JSON.stringify(projects, null, 2));
  return projects;
});

ipcMain.handle('get-project-tasks', (event, folderPath) => {
  const atlasDir = path.join(folderPath, '.atlas');
  const tasksFile = path.join(atlasDir, 'tasks.json');
  if (!fs.existsSync(tasksFile)) return [];
  try {
    return JSON.parse(fs.readFileSync(tasksFile, 'utf-8'));
  } catch (e) {
    return [];
  }
});

ipcMain.handle('save-project-tasks', (event, folderPath, tasks) => {
  const atlasDir = path.join(folderPath, '.atlas');
  const tasksFile = path.join(atlasDir, 'tasks.json');
  if (!fs.existsSync(atlasDir)) {
    fs.mkdirSync(atlasDir, { recursive: true });
  }
  fs.writeFileSync(tasksFile, JSON.stringify(tasks, null, 2));
  return true;
});

ipcMain.handle('get-project-mattermost', (event, folderPath) => {
  const atlasDir = path.join(folderPath, '.atlas');
  const mattermostFile = path.join(atlasDir, 'mattermost.json');
  if (!fs.existsSync(mattermostFile)) return "";
  try {
    const data = JSON.parse(fs.readFileSync(mattermostFile, 'utf-8'));
    return data.url || "";
  } catch (e) {
    return "";
  }
});

ipcMain.handle('save-project-mattermost', (event, folderPath, url) => {
  const atlasDir = path.join(folderPath, '.atlas');
  const mattermostFile = path.join(atlasDir, 'mattermost.json');
  if (!fs.existsSync(atlasDir)) {
    fs.mkdirSync(atlasDir, { recursive: true });
  }
  fs.writeFileSync(mattermostFile, JSON.stringify({ url }, null, 2));
  return true;
});

ipcMain.handle('get-project-reports', (event, folderPath) => {
  if (!fs.existsSync(folderPath)) return [];
  try {
    const files = fs.readdirSync(folderPath, { withFileTypes: true });
    let reports = [];

    files.forEach(dirent => {
      if (dirent.name === '.atlas') return;
      if (dirent.isDirectory()) {
        const subPath = path.join(folderPath, dirent.name);
        try {
          const subFiles = fs.readdirSync(subPath);
          if (subFiles.some(f => f.endsWith('.tex'))) {
            reports.push({
              name: dirent.name,
              path: subPath,
              isPdf: false,
              isMd: false,
              isTex: false,
              isLatexProject: true
            });
          }
        } catch (e) {}
      } else if (dirent.isFile()) {
        if (dirent.name.endsWith('.tex') || dirent.name.endsWith('.pdf') || dirent.name.endsWith('.md')) {
          reports.push({
            name: dirent.name,
            path: path.join(folderPath, dirent.name),
            isPdf: dirent.name.endsWith('.pdf'),
            isMd: dirent.name.endsWith('.md'),
            isTex: dirent.name.endsWith('.tex'),
            isLatexProject: false
          });
        }
      }
    });

    return reports;
  } catch (e) {
    return [];
  }
});

ipcMain.handle('create-tex-file', (event, folderPath, filename, templateName) => {
  if (!fs.existsSync(folderPath)) return false;
  
  if (templateName === 'Engineering Technical Memo' || templateName === 'Beamer Presentation') {
    let safeName = filename.endsWith('.tex') ? filename : `${filename}.tex`;
    const filePath = path.join(folderPath, safeName);
    let content = "";
    
    if (templateName === 'Engineering Technical Memo') {
      content = `\\documentclass[11pt]{article}\n\\usepackage[margin=1in]{geometry}\n\\usepackage{fancyhdr}\n\\usepackage{graphicx}\n\\usepackage{amsmath}\n\\usepackage{siunitx}\n\n\\pagestyle{fancy}\n\\fancyhf{}\n\\rhead{Date: \\today}\n\\lhead{Technical Memo}\n\n\\begin{document}\n\\begin{center}\n    \\Large\\textbf{TECHNICAL MEMORANDUM}\n\\end{center}\n\\vspace{1em}\n\\noindent\\textbf{TO:} \\\\\n\\textbf{FROM:} \\\\\n\\textbf{DATE:} \\today \\\\\n\\textbf{SUBJECT:} ${filename}\n\\rule{\\textwidth}{0.4pt}\n\n\\section{Introduction}\n\n\\section{Analysis}\n\n\\section{Conclusion}\n\n\\end{document}`;
    } else if (templateName === 'Beamer Presentation') {
      content = `\\documentclass{beamer}\n\\usetheme{Madrid}\n\\usepackage{graphicx}\n\\usepackage{amsmath}\n\n\\title{${filename}}\n\\author{Engineering Team}\n\\date{\\today}\n\n\\begin{document}\n\n\\begin{frame}\n  \\titlepage\n\\end{frame}\n\n\\begin{frame}{Overview}\n  \\begin{itemize}\n    \\item First point\n    \\item Second point\n  \\end{itemize}\n\\end{frame}\n\n\\end{document}`;
    }
    
    try {
      fs.writeFileSync(filePath, content);
      return true;
    } catch (e) {
      return false;
    }
  } 
  else if (templateName === 'IEEE Conference Paper' || templateName === 'Comprehensive Design Document') {
    const projectDir = path.join(folderPath, filename);
    if (!fs.existsSync(projectDir)) {
      fs.mkdirSync(projectDir, { recursive: true });
    }
    
    if (templateName === 'IEEE Conference Paper') {
      fs.writeFileSync(path.join(projectDir, 'main.tex'), `\\documentclass[conference]{IEEEtran}\n\\usepackage{amsmath, amssymb, amsfonts}\n\\usepackage{algorithmic}\n\\usepackage{graphicx}\n\\usepackage{siunitx}\n\\usepackage{hyperref}\n\n\\begin{document}\n\n\\title{${filename}}\n\\author{\\IEEEauthorblockN{1\\textsuperscript{st} Given Name Surname}\n\\IEEEauthorblockA{\\textit{dept. name of organization (of Aff.)} \\\\\n\\textit{name of organization (of Aff.)}\\\\\nCity, Country \\\\\nemail address or ORCID}}\n\n\\maketitle\n\n\\begin{abstract}\nThis document is a model and instructions for LaTeX.\n\\end{abstract}\n\n\\begin{IEEEkeywords}\ncomponent, formatting, style, styling, insert\n\\end{IEEEkeywords}\n\n\\section{Introduction}\n\n\\section{Methodology}\n\n\\section{Conclusion}\n\n\\bibliographystyle{IEEEtran}\n\\bibliography{references}\n\n\\end{document}`);
      fs.writeFileSync(path.join(projectDir, 'references.bib'), `% Add your BibTeX references here`);
      fs.mkdirSync(path.join(projectDir, 'figures'), { recursive: true });
    } else if (templateName === 'Comprehensive Design Document') {
      fs.writeFileSync(path.join(projectDir, 'main.tex'), `\\documentclass[12pt, a4paper]{report}\n\\usepackage{graphicx}\n\\usepackage{amsmath}\n\\usepackage{siunitx}\n\\usepackage{hyperref}\n\\usepackage{booktabs}\n\n\\title{Comprehensive Design Document:\\\\ ${filename}}\n\\author{Engineering Team}\n\\date{\\today}\n\n\\begin{document}\n\\maketitle\n\\tableofcontents\n\\listoffigures\n\n\\chapter{Introduction}\n\\input{chapters/intro.tex}\n\n\\chapter{System Architecture}\n\\input{chapters/architecture.tex}\n\n\\bibliographystyle{plain}\n\\bibliography{references}\n\\end{document}`);
      fs.mkdirSync(path.join(projectDir, 'chapters'), { recursive: true });
      fs.writeFileSync(path.join(projectDir, 'chapters', 'intro.tex'), `% Introduction chapter content`);
      fs.writeFileSync(path.join(projectDir, 'chapters', 'architecture.tex'), `% Architecture chapter content`);
      fs.writeFileSync(path.join(projectDir, 'references.bib'), `% Add your BibTeX references here`);
      fs.mkdirSync(path.join(projectDir, 'figures'), { recursive: true });
    }
    return true;
  }
  
  return false;
});

ipcMain.handle('read-file', (event, filePath) => {
  if (!fs.existsSync(filePath)) return null;
  try {
    return fs.readFileSync(filePath, 'utf-8');
  } catch (e) {
    return null;
  }
});

ipcMain.handle('save-file', (event, filePath, content) => {
  try {
    fs.writeFileSync(filePath, content, 'utf-8');
    return true;
  } catch (e) {
    return false;
  }
});

ipcMain.handle('delete-file', (event, targetPath) => {
  try {
    if (fs.existsSync(targetPath)) {
      fs.rmSync(targetPath, { recursive: true, force: true });
      return true;
    }
    return false;
  } catch (e) {
    console.error('Delete error:', e);
    return false;
  }
});

// IPC for launching VS Code
ipcMain.on('launch-vscode', (event, projectPath) => {
  const vscodeProcess = spawn('code', [`"${projectPath}"`], { shell: true });
  vscodeProcess.on('error', (err) => {
    console.error('Failed to start VS Code:', err);
  });
});

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (streamlitProcess) {
    streamlitProcess.kill();
  }
  app.quit();
});
