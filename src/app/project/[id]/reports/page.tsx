"use client";

import { Code, FileText, Plus, FileArchive, Search, Edit3, Columns, Eye, Maximize2, Minimize2, Save, Bold, Italic, Heading1, Heading2, List, Code as CodeIcon, Link as LinkIcon, Printer, Trash2 } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useEffect, useState, useRef } from "react";
import { Modal } from "@/components/ui/Modal";
import { Task } from "@/components/ui/KanbanBoard";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkBreaks from 'remark-breaks';

export default function ProjectReports() {
 const searchParams = useSearchParams();
 const projectPath = searchParams.get('path') || '';

 const [reports, setReports] = useState<unknown[]>([]);
 const [tasks, setTasks] = useState<Task[]>([]);
 const [isModalOpen, setIsModalOpen] = useState(false);
 const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
 const [searchQuery, setSearchQuery] = useState("");
 
 // Editor State
 const [selectedReport, setSelectedReport] = useState<any | null>(null);
 const [reportContent, setReportContent] = useState("");
 const [viewMode, setViewMode] = useState<'edit' | 'preview' | 'split'>('split');
 const [isFullscreen, setIsFullscreen] = useState(false);
 const [isSaving, setIsSaving] = useState(false);
 const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

 const loadData = () => {
 if (typeof window !== "undefined" && (window as unknown).require && projectPath) {
 const { ipcRenderer } = (window as unknown).require("electron");
 ipcRenderer.invoke('get-project-reports', projectPath).then((data: unknown[]) => {
 setReports(data || []);
 
 // If a report is currently selected, refresh its content or deselect if deleted
 if (selectedReport) {
 const stillExists = (data || []).find(r => r.path === selectedReport.path);
 if (!stillExists) setSelectedReport(null);
 }
 });
 ipcRenderer.invoke('get-project-tasks', projectPath).then((data: unknown) => setTasks(data || []));
 }
 };

 useEffect(() => {
 loadData();
 // eslint-disable-next-line react-hooks/exhaustive-deps
 }, [projectPath]);

 useEffect(() => {
 const handleKeyDown = (e: KeyboardEvent) => {
 // Don't trigger Cmd+N if we're typing in the modal input (unless we want to, but standard behavior is fine)
 if ((e.metaKey || e.ctrlKey) && e.key === 'n') {
 e.preventDefault();
 setIsModalOpen(true);
 }

 if ((e.metaKey || e.ctrlKey) && e.key === 's') {
 e.preventDefault();
 // Since handleContentChange auto-saves, we don't strictly need to trigger it,
 // but preventing default stops the browser save dialog.
 }
 };
 window.addEventListener('keydown', handleKeyDown);
 return () => window.removeEventListener('keydown', handleKeyDown);
 }, []);

 const selectReport = async (report: unknown) => {
 setSelectedReport(report);
 if (report.isPdf) {
 setReportContent("PDF Viewer not natively supported. Click 'Open in VS Code' or open externally.");
 setViewMode('preview');
 return;
 }
 if (report.isLatexProject) {
 setReportContent("This is a multi-file LaTeX project directory. Click 'Open in VS Code' to edit the files.");
 setViewMode('preview');
 openInVSCode(report.path);
 return;
 }
 if (typeof window !== "undefined" && (window as unknown).require) {
 const { ipcRenderer } = (window as unknown).require("electron");
 const content = await ipcRenderer.invoke('read-file', report.path);
 setReportContent(content || "");
 if (report.isTex) setViewMode('edit');
 else setViewMode('split');
 }
 };

 const handleContentChange = (newContent: string) => {
 setReportContent(newContent);
 if (selectedReport?.isPdf) return;
 
 setIsSaving(true);
 if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
 
 saveTimeoutRef.current = setTimeout(async () => {
 if (selectedReport && typeof window !== "undefined" && (window as unknown).require) {
 const { ipcRenderer } = (window as unknown).require("electron");
 await ipcRenderer.invoke('save-file', selectedReport.path, newContent);
 setIsSaving(false);
 }
 }, 1000);
 };

 const openInVSCode = (path: string, e?: React.MouseEvent) => {
 if (e) e.stopPropagation();
 if (typeof window !== "undefined" && (window as unknown).require) {
 const { ipcRenderer } = (window as unknown).require("electron");
 ipcRenderer.send("launch-vscode", path);
 }
 };

 const handleDeleteReport = async (path: string, e: React.MouseEvent) => {
 e.stopPropagation();
 if (confirm("Are you sure you want to delete this report? This cannot be undone.")) {
 if (typeof window !== "undefined" && (window as unknown).require) {
 const { ipcRenderer } = (window as unknown).require("electron");
 await ipcRenderer.invoke('delete-file', path);
 if (selectedReport?.path === path) {
 setSelectedReport(null);
 setReportContent("");
 }
 loadData();
 }
 }
 };

 const generateWeeklyUpdate = () => {
 const doneTasks = tasks.filter(t => t.status === 'Done');
 const inProgressTasks = tasks.filter(t => t.status === 'In Progress');
 const toReviewTasks = tasks.filter(t => t.status === 'In Review');
 
 const today = new Date().toLocaleDateString();
 
 let md = `# Weekly Status Report - ${today}\n\n`;
 md += `## Executive Summary\n\n[Add high-level summary here]\n\n`;
 md += `## Progress This Week\n\n`;
 if (doneTasks.length === 0) md += `*No tasks completed this week.*\n\n`;
 doneTasks.forEach(t => md += `- **${t.title}**\n`);
 
 md += `\n## Current Focus (In Progress & Review)\n\n`;
 if (inProgressTasks.length === 0 && toReviewTasks.length === 0) md += `*No active tasks.*\n\n`;
 inProgressTasks.forEach(t => md += `- ${t.title} (In Progress)\n`);
 toReviewTasks.forEach(t => md += `- ${t.title} (In Review)\n`);
 
 return md;
 };

 const handleCreateReport = async (result: unknown) => {
 const filename = result.title;
 if (typeof window !== "undefined" && (window as unknown).require && projectPath) {
 const { ipcRenderer } = (window as unknown).require("electron");
 const pathModule = (window as unknown).require("path");
 
 if (selectedTemplate === 'Weekly Update (Markdown Auto-Generated)') {
 const safeName = filename.endsWith('.md') ? filename : `${filename}.md`;
 const filePath = pathModule.join(projectPath, safeName);
 await ipcRenderer.invoke('save-file', filePath, generateWeeklyUpdate());
 } else if (selectedTemplate === 'Blank Markdown') {
 const safeName = filename.endsWith('.md') ? filename : `${filename}.md`;
 const filePath = pathModule.join(projectPath, safeName);
 await ipcRenderer.invoke('save-file', filePath, `# ${filename}\n\nStart writing your report here...`);
 } else {
 await ipcRenderer.invoke('create-tex-file', projectPath, filename, selectedTemplate);
 }
 loadData();
 }
 };

 const openModalForTemplate = (templateName: string | null) => {
 setSelectedTemplate(templateName);
 setIsModalOpen(true);
 };

 const filteredReports = reports.filter(r => r.name.toLowerCase().includes(searchQuery.toLowerCase()));

 const insertFormat = (format: string) => {
 const textarea = document.getElementById('report-textarea') as HTMLTextAreaElement;
 if (!textarea) return;
 const start = textarea.selectionStart;
 const end = textarea.selectionEnd;
 const text = reportContent;
 let newText = text;
 let newCursorPos = start;

 if (format === 'bold') {
 newText = text.substring(0, start) + "**" + text.substring(start, end) + "**" + text.substring(end);
 newCursorPos = start === end ? start + 2 : end + 4;
 } else if (format === 'italic') {
 newText = text.substring(0, start) + "*" + text.substring(start, end) + "*" + text.substring(end);
 newCursorPos = start === end ? start + 1 : end + 2;
 } else if (format === 'h1') {
 newText = text.substring(0, start) + "\n# " + text.substring(start, end) + text.substring(end);
 newCursorPos = start === end ? start + 3 : end + 3;
 } else if (format === 'h2') {
 newText = text.substring(0, start) + "\n## " + text.substring(start, end) + text.substring(end);
 newCursorPos = start === end ? start + 4 : end + 4;
 } else if (format === 'ul') {
 newText = text.substring(0, start) + "\n- " + text.substring(start, end) + text.substring(end);
 newCursorPos = start === end ? start + 3 : end + 3;
 } else if (format === 'code') {
 newText = text.substring(0, start) + "`" + text.substring(start, end) + "`" + text.substring(end);
 newCursorPos = start === end ? start + 1 : end + 2;
 } else if (format === 'link') {
 newText = text.substring(0, start) + "[" + text.substring(start, end) + "](url)" + text.substring(end);
 newCursorPos = start === end ? start + 1 : end + 7;
 }

 handleContentChange(newText);
 setTimeout(() => {
 textarea.focus();
 textarea.setSelectionRange(newCursorPos, newCursorPos);
 }, 0);
 };

 const handlePrint = () => {
 window.print();
 };

 return (
 <div className={`flex gap-6 h-full transition-all duration-300 ${isFullscreen ? 'fixed inset-0 z-50 bg-[#191724] p-6' : ''}`}>
 <Modal
 isOpen={isModalOpen}
 onClose={() => setIsModalOpen(false)}
 onSubmit={handleCreateReport}
 title={selectedTemplate ? `Create ${selectedTemplate}` : "Create New Report"}
 placeholder="Enter filename (e.g. requirements_doc)..."
 />

 {/* Left Sidebar - Report List & Templates */}
 <div className={`flex flex-col w-1/3 min-w-[300px] max-w-[400px] gap-6 transition-all duration-300 ${isFullscreen ? 'hidden' : 'block'}`}>
 
 {/* Templates Section */}
 <div className="glass-panel rounded-2xl p-6 shrink-0 border border-[#393552]">
 <div className="flex items-center justify-between mb-4">
 <h2 className="text-xl font-bold text-[#e0def4]">Smart Templates</h2>
 <button 
 onClick={() => openModalForTemplate('Blank Markdown')}
 className="p-1.5 bg-[#ea9a97]/20 text-[#ea9a97] rounded-lg hover:bg-[#ea9a97]/30 transition-colors"
 title="New Blank Markdown Report"
 >
 <Plus size={18} />
 </button>
 </div>
 <div className="grid grid-cols-2 gap-3">
 {['Weekly Update (Markdown Auto-Generated)', 'Engineering Technical Memo', 'Beamer Presentation', 'IEEE Conference Paper', 'Comprehensive Design Document'].map((tmpl, idx) => (
 <div 
 key={idx} 
 onClick={() => openModalForTemplate(tmpl)}
 className="p-3 rounded-xl bg-[#2a273f]/50 border border-[#393552] hover:border-[#c4a7e7]/50 cursor-pointer text-center group transition-colors flex flex-col justify-between"
 >
 <FileArchive size={18} className="mx-auto mb-2 text-[#908caa] group-hover:text-[#c4a7e7] transition-colors" />
 <span className="text-xs font-medium text-[#e0def4] leading-tight">{tmpl}</span>
 </div>
 ))}
 </div>
 </div>

 {/* Files Section */}
 <div className="glass-panel rounded-2xl flex-1 flex flex-col overflow-hidden border border-[#393552]">
 <div className="p-6 border-b border-[#393552]">
 <h2 className="text-xl font-bold text-[#e0def4] mb-4">Project Files</h2>
 <div className="relative">
 <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#908caa]" size={18} />
 <input 
 type="text" 
 value={searchQuery}
 onChange={(e) => setSearchQuery(e.target.value)}
 placeholder="Search documents..." 
 className="w-full bg-[#232136] border border-[#393552] text-[#e0def4] rounded-xl pl-10 pr-4 py-2 outline-none focus:border-[#c4a7e7] transition-colors text-sm"
 />
 </div>
 </div>
 <div className="flex-1 overflow-y-auto p-4 space-y-2">
 {filteredReports.length === 0 ? (
 <div className="flex flex-col items-center justify-center h-full text-[#908caa] text-sm italic">
 <FileText size={24} className="mb-2 opacity-50" />
 <p>No documents found.</p>
 </div>
 ) : (
 filteredReports.map((report: unknown, idx) => (
 <div 
 key={idx} 
 onClick={() => selectReport(report)}
 className={`p-3 rounded-xl cursor-pointer transition-colors border flex items-center justify-between group ${selectedReport?.path === report.path ? 'bg-[#c4a7e7]/10 border-[#c4a7e7]' : 'bg-[#2a273f]/50 border-transparent hover:border-[#393552]'}`}
 >
 <div className="flex items-center gap-3 overflow-hidden">
 <div className={`p-2 rounded-lg shrink-0 ${report.isPdf ? 'bg-[#eb6f92]/20 text-[#eb6f92]' : report.isMd ? 'bg-[#f6c177]/20 text-[#f6c177]' : report.isLatexProject ? 'bg-[#9ccfd8]/20 text-[#9ccfd8]' : 'bg-[#3e8fb0]/20 text-[#3e8fb0]'}`}>
 {report.isLatexProject ? <FileArchive size={16} /> : <FileText size={16} />}
 </div>
 <div className="truncate">
 <h4 className={`font-bold text-sm truncate ${selectedReport?.path === report.path ? 'text-[#c4a7e7]' : 'text-[#e0def4]'}`}>{report.name}</h4>
 <p className="text-[10px] text-[#908caa] font-bold mt-0.5">
 {report.isPdf ? 'PDF Document' : report.isMd ? 'Markdown Document' : report.isLatexProject ? 'LaTeX Project Folder' : 'LaTeX Source'}
 </p>
 </div>
 </div>
 <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-all">
 <button 
 onClick={(e) => openInVSCode(report.path, e)}
 className="p-2 bg-[#232136] hover:bg-[#393552] text-[#908caa] hover:text-[#e0def4] rounded-lg transition-colors"
 title="Open in VS Code"
 >
 <Code size={14} />
 </button>
 <button 
 onClick={(e) => handleDeleteReport(report.path, e)}
 className="p-2 bg-[#232136] hover:bg-[#eb6f92]/20 text-[#908caa] hover:text-[#eb6f92] rounded-lg transition-colors"
 title="Delete Report"
 >
 <Trash2 size={14} />
 </button>
 </div>
 </div>
 ))
 )}
 </div>
 </div>
 </div>

 {/* Right Area - Editor/Viewer */}
 <div className={`flex-1 glass-panel rounded-2xl flex flex-col overflow-hidden border border-[#393552]`}>
 {selectedReport ? (
 <>
 <div className="p-6 border-b border-[#393552] flex items-center justify-between bg-[#2a273f]/30">
 <div className="flex items-center gap-4">
 <div className={`p-3 rounded-xl ${selectedReport.isPdf ? 'bg-[#eb6f92]/20 text-[#eb6f92]' : selectedReport.isMd ? 'bg-[#f6c177]/20 text-[#f6c177]' : 'bg-[#3e8fb0]/20 text-[#3e8fb0]'}`}>
 <FileText size={24} />
 </div>
 <div>
 <h2 className="text-2xl font-bold text-[#e0def4] mb-1">{selectedReport.name}</h2>
 <div className="flex items-center gap-3 text-sm text-[#908caa]">
 <span>{selectedReport.isPdf ? 'PDF View' : selectedReport.isMd ? 'Markdown Editor' : 'LaTeX Editor'}</span>
 {isSaving && <span className="text-[#f6c177] flex items-center gap-1 animate-pulse"><Save size={12}/> Auto-saving...</span>}
 </div>
 </div>
 </div>
 <div className="flex items-center gap-2">
 {!selectedReport.isPdf && (
 <div className="flex bg-[#232136] rounded-xl border border-[#393552] p-1 mr-2">
 <button onClick={() => setViewMode('edit')} className={`p-2 rounded-lg transition-colors ${viewMode === 'edit' ? 'bg-[#393552] text-[#e0def4]' : 'text-[#6e6a86] hover:text-[#908caa]'}`} title="Edit"><Edit3 size={16} /></button>
 {selectedReport.isMd && <button onClick={() => setViewMode('split')} className={`p-2 rounded-lg transition-colors hidden lg:block ${viewMode === 'split' ? 'bg-[#393552] text-[#e0def4]' : 'text-[#6e6a86] hover:text-[#908caa]'}`} title="Split View"><Columns size={16} /></button>}
 <button onClick={() => setViewMode('preview')} className={`p-2 rounded-lg transition-colors ${viewMode === 'preview' ? 'bg-[#393552] text-[#e0def4]' : 'text-[#6e6a86] hover:text-[#908caa]'}`} title="Preview"><Eye size={16} /></button>
 </div>
 )}
 {selectedReport.isMd && (
 <button 
 onClick={handlePrint} 
 className="p-2 text-[#908caa] hover:text-[#e0def4] hover:bg-[#393552] rounded-xl transition-colors mr-2 border border-[#393552] bg-[#232136]"
 title="Print to PDF"
 >
 <Printer size={18} />
 </button>
 )}
 <button 
 onClick={() => setIsFullscreen(!isFullscreen)} 
 className="p-2 text-[#908caa] hover:text-[#e0def4] hover:bg-[#393552] rounded-xl transition-colors border border-[#393552] bg-[#232136]"
 title="Toggle Fullscreen"
 >
 {isFullscreen ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
 </button>
 </div>
 </div>
 
 {viewMode !== 'preview' && !selectedReport.isPdf && (
 <div className="flex items-center gap-1 px-4 py-2 bg-[#232136] border-b border-[#393552]">
 <button onMouseDown={(e) => { e.preventDefault(); insertFormat('bold'); }} className="p-1.5 text-[#908caa] hover:text-[#e0def4] hover:bg-[#393552] rounded transition-colors" title="Bold"><Bold size={14}/></button>
 <button onMouseDown={(e) => { e.preventDefault(); insertFormat('italic'); }} className="p-1.5 text-[#908caa] hover:text-[#e0def4] hover:bg-[#393552] rounded transition-colors" title="Italic"><Italic size={14}/></button>
 <div className="w-px h-4 bg-[#393552] mx-1"></div>
 <button onMouseDown={(e) => { e.preventDefault(); insertFormat('h1'); }} className="p-1.5 text-[#908caa] hover:text-[#e0def4] hover:bg-[#393552] rounded transition-colors" title="Heading 1"><Heading1 size={14}/></button>
 <button onMouseDown={(e) => { e.preventDefault(); insertFormat('h2'); }} className="p-1.5 text-[#908caa] hover:text-[#e0def4] hover:bg-[#393552] rounded transition-colors" title="Heading 2"><Heading2 size={14}/></button>
 <div className="w-px h-4 bg-[#393552] mx-1"></div>
 <button onMouseDown={(e) => { e.preventDefault(); insertFormat('ul'); }} className="p-1.5 text-[#908caa] hover:text-[#e0def4] hover:bg-[#393552] rounded transition-colors" title="Bullet List"><List size={14}/></button>
 <button onMouseDown={(e) => { e.preventDefault(); insertFormat('code'); }} className="p-1.5 text-[#908caa] hover:text-[#e0def4] hover:bg-[#393552] rounded transition-colors" title="Code"><CodeIcon size={14}/></button>
 <button onMouseDown={(e) => { e.preventDefault(); insertFormat('link'); }} className="p-1.5 text-[#908caa] hover:text-[#e0def4] hover:bg-[#393552] rounded transition-colors" title="Link"><LinkIcon size={14}/></button>
 </div>
 )}

 <div className="flex-1 flex overflow-hidden bg-[#191724]/50">
 {(viewMode === 'edit' || viewMode === 'split') && !selectedReport.isPdf && (
 <div className={`flex-1 flex flex-col ${viewMode === 'split' ? 'border-r border-[#393552]' : ''}`}>
 <textarea
 id="report-textarea"
 value={reportContent}
 onChange={(e) => handleContentChange(e.target.value)}
 placeholder="Start typing your report here..."
 className="flex-1 w-full bg-transparent text-[#e0def4] p-6 outline-none resize-none font-mono text-sm leading-relaxed"
 spellCheck="false"
 />
 </div>
 )}
 {((viewMode === 'preview' || viewMode === 'split') || selectedReport.isPdf) && (
 <div className={`flex-1 overflow-y-auto p-8 markdown-preview bg-transparent`}>
 {selectedReport.isPdf ? (
 <div className="flex flex-col items-center justify-center h-full text-[#908caa]">
 <FileArchive size={48} className="mb-4 opacity-50 text-[#eb6f92]" />
 <h3 className="text-xl font-bold text-[#e0def4] mb-2">PDF Document</h3>
 <p className="mb-6 text-center max-w-md">Native PDF preview is not currently supported in this pane. Open the file in VS Code or your system PDF viewer.</p>
 <button onClick={() => openInVSCode(selectedReport.path)} className="px-6 py-2 bg-[#3e8fb0]/20 text-[#3e8fb0] rounded-xl font-bold hover:bg-[#3e8fb0]/30 transition-colors">
 Open in VS Code
 </button>
 </div>
 ) : selectedReport.isTex && viewMode === 'preview' ? (
 <div className="flex flex-col items-center justify-center h-full text-[#908caa]">
 <CodeIcon size={48} className="mb-4 opacity-50 text-[#3e8fb0]" />
 <h3 className="text-xl font-bold text-[#e0def4] mb-2">LaTeX Preview Not Available</h3>
 <p className="mb-6 text-center max-w-md">LaTeX files must be compiled into PDFs to be viewed. You can edit the raw source in the editor tab.</p>
 </div>
 ) : reportContent ? (
 <ReactMarkdown remarkPlugins={[remarkGfm, remarkBreaks]}>
 {reportContent}
 </ReactMarkdown>
 ) : (
 <div className="text-[#908caa] italic mt-10 text-center">Document is empty...</div>
 )}
 </div>
 )}
 </div>
 </>
 ) : (
 <div className="flex-1 flex flex-col items-center justify-center text-[#6e6a86] bg-[#191724]/30">
 <div className="relative">
 <FileText size={64} className="mb-4 opacity-20" />
 <Search size={24} className="absolute bottom-4 right-[-8px] text-[#c4a7e7] opacity-80" />
 </div>
 <h3 className="text-xl font-bold text-[#908caa] mb-2 mt-2">No Document Selected</h3>
 <p className="max-w-xs text-center text-sm">Select a report from the sidebar or create a new one using the smart templates.</p>
 </div>
 )}
 </div>
 </div>
 );
}
