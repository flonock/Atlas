"use client";


import { Clock, FileText, Search, Maximize2, Minimize2, Save, Eye, Edit3, Columns, Bold, Italic, Heading1, Heading2, List, Code, Link as LinkIcon } from "lucide-react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { useEffect, useState, useRef } from "react";
import { Task } from "@/components/ui/KanbanBoard";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkBreaks from 'remark-breaks';

export default function NotesPage() {
 const searchParams = useSearchParams();
 const router = useRouter();
 const pathname = usePathname();
 const projectPath = searchParams.get('path') || '';
 const initialTaskId = searchParams.get('taskId');

 const [tasks, setTasks] = useState<Task[]>([]);
 const [selectedTaskId, setSelectedTaskId] = useState<string | null>(initialTaskId);
 const [searchQuery, setSearchQuery] = useState("");
 const [isFullscreen, setIsFullscreen] = useState(false);
 
 // Editor state
 const [notes, setNotes] = useState("");
 const [viewMode, setViewMode] = useState<'edit' | 'preview' | 'split'>('split');
 const [isSaving, setIsSaving] = useState(false);
 const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

 const loadTasks = () => {
 if (typeof window !== "undefined" && (window as unknown).require && projectPath) {
 const { ipcRenderer } = (window as unknown).require("electron");
 ipcRenderer.invoke('get-project-tasks', projectPath).then((data: unknown) => {
 const loadedTasks = data || [];
 setTasks(loadedTasks);
 if (initialTaskId && loadedTasks.find((t: Task) => t.id === initialTaskId)) {
 setSelectedTaskId(initialTaskId);
 setNotes(loadedTasks.find((t: Task) => t.id === initialTaskId).notes || "");
 }
 });
 }
 };

 // eslint-disable-next-line react-hooks/exhaustive-deps
 useEffect(() => {
 loadTasks();
 }, [projectPath]);

 useEffect(() => {
 const handleKeyDown = (e: KeyboardEvent) => {
 // Cmd/Ctrl + S -> Save note
 if ((e.metaKey || e.ctrlKey) && e.key === 's') {
 e.preventDefault();
 // Since handleNotesChange auto-saves, we don't strictly need to trigger it,
 // but preventing default stops the browser save dialog.
 }
 
 // Cmd/Ctrl + F -> Focus search (Optional but nice)
 if ((e.metaKey || e.ctrlKey) && e.key === 'f') {
 // Only if we want to add this later, we can just let browser handle search for now
 }
 };
 window.addEventListener('keydown', handleKeyDown);
 return () => window.removeEventListener('keydown', handleKeyDown);
 }, []);

  useEffect(() => {
    if (initialTaskId && initialTaskId !== selectedTaskId) {
      const task = tasks.find(t => t.id === initialTaskId);
      if (task) {
        setSelectedTaskId(task.id);
        setNotes(task.notes || "");
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialTaskId]);

 const saveTasks = async (newTasks: Task[]) => {
 setTasks(newTasks);
 if (typeof window !== "undefined" && (window as unknown).require && projectPath) {
 const { ipcRenderer } = (window as unknown).require("electron");
 await ipcRenderer.invoke('save-project-tasks', projectPath, newTasks);
 setIsSaving(false);
 }
 };

  const handleNotesChange = (newNotes: string) => {
    setNotes(newNotes);
    setIsSaving(true);
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    
    saveTimeoutRef.current = setTimeout(() => {
      if (selectedTaskId) {
        setTasks(prevTasks => {
          const updatedTasks = prevTasks.map(t => t.id === selectedTaskId ? { ...t, notes: newNotes } : t);
          if (typeof window !== "undefined" && (window as unknown).require && projectPath) {
            const { ipcRenderer } = (window as unknown).require("electron");
            ipcRenderer.invoke('save-project-tasks', projectPath, updatedTasks).then(() => {
              setIsSaving(false);
            });
          }
          return updatedTasks;
        });
      }
    }, 1000);
  };

 const insertFormat = (format: string) => {
 const textarea = document.getElementById('notes-textarea') as HTMLTextAreaElement;
 if (!textarea) return;
 const start = textarea.selectionStart;
 const end = textarea.selectionEnd;
 const text = notes;
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

 handleNotesChange(newText);
 
 setTimeout(() => {
 textarea.focus();
 textarea.setSelectionRange(newCursorPos, newCursorPos);
 }, 0);
 };

 const selectTask = (task: Task) => {
 setSelectedTaskId(task.id);
 setNotes(task.notes || "");
 const params = new URLSearchParams(searchParams.toString());
 params.set('taskId', task.id);
 router.replace(`${pathname}?${params.toString()}`);
 };

 const selectedTask = tasks.find(t => t.id === selectedTaskId);
 
 const filteredTasks = tasks.filter(t => 
 t.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
 (t.notes && t.notes.toLowerCase().includes(searchQuery.toLowerCase()))
 );

 return (
 <div className={`flex gap-6 h-full transition-all duration-300 ${isFullscreen ? 'fixed inset-0 z-50 bg-[#191724] p-6' : ''}`}>
 
 {/* Left Sidebar - Task List */}
 <div className={`flex flex-col w-1/3 min-w-[300px] max-w-[400px] glass-panel rounded-2xl overflow-hidden transition-all duration-300 ${isFullscreen ? 'hidden' : 'block'}`}>
 <div className="p-6 border-b border-[#393552]">
 <h2 className="text-xl font-bold text-[#e0def4] mb-4">Notepad</h2>
 <div className="relative">
 <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#908caa]" size={18} />
 <input 
 type="text" 
 value={searchQuery}
 onChange={(e) => setSearchQuery(e.target.value)}
 placeholder="Search tasks or notes..." 
 className="w-full bg-[#232136] border border-[#393552] text-[#e0def4] rounded-xl pl-10 pr-4 py-2 outline-none focus:border-[#c4a7e7] transition-colors text-sm"
 />
 </div>
 </div>
 <div className="flex-1 overflow-y-auto p-4 space-y-2">
 {filteredTasks.map(task => (
 <div 
 key={task.id} 
 onClick={() => selectTask(task)}
 className={`p-4 rounded-xl cursor-pointer transition-colors border ${selectedTaskId === task.id ? 'bg-[#c4a7e7]/10 border-[#c4a7e7]' : 'bg-[#2a273f]/50 border-transparent hover:border-[#393552]'}`}
 >
 <div className="flex justify-between items-start mb-2">
 <h4 className={`font-bold text-sm ${selectedTaskId === task.id ? 'text-[#c4a7e7]' : 'text-[#e0def4]'}`}>{task.title}</h4>
 {task.type && (
 <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold flex-shrink-0 ${task.type === 'Phase' ? 'bg-[#c4a7e7]/20 text-[#c4a7e7]' : task.type === 'Event' ? 'bg-[#ea9a97]/20 text-[#ea9a97]' : 'bg-[#3e8fb0]/20 text-[#3e8fb0]'}`}>
 {task.type}
 </span>
 )}
 </div>
 <p className="text-xs text-[#908caa] line-clamp-2">
 {task.notes ? task.notes : <span className="italic opacity-50">No notes yet...</span>}
 </p>
 </div>
 ))}
 {filteredTasks.length === 0 && (
 <div className="text-center text-[#908caa] mt-8 text-sm">No tasks found</div>
 )}
 </div>
 </div>

 {/* Right Area - Editor */}
 <div className={`flex-1 glass-panel rounded-2xl flex flex-col overflow-hidden`}>
 {selectedTask ? (
 <>
 <div className="p-6 border-b border-[#393552] flex items-center justify-between bg-[#2a273f]/30">
 <div>
 <h2 className="text-2xl font-bold text-[#e0def4] mb-1">{selectedTask.title}</h2>
 <div className="flex items-center gap-3 text-sm text-[#908caa]">
 <span className="flex items-center gap-1"><Clock size={14}/> {selectedTask.due !== 'No Due Date' ? selectedTask.due : 'No date'}</span>
 <span>•</span>
 <span>{selectedTask.status}</span>
 {isSaving && <span className="text-[#f6c177] ml-2 text-xs flex items-center gap-1 animate-pulse"><Save size={12}/> Saving...</span>}
 </div>
 </div>
 <div className="flex items-center gap-2">
 <div className="flex bg-[#232136] rounded-xl border border-[#393552] p-1 mr-2">
 <button onClick={() => setViewMode('edit')} className={`p-2 rounded-lg transition-colors ${viewMode === 'edit' ? 'bg-[#393552] text-[#e0def4]' : 'text-[#6e6a86] hover:text-[#908caa]'}`} title="Edit"><Edit3 size={16} /></button>
 <button onClick={() => setViewMode('split')} className={`p-2 rounded-lg transition-colors hidden lg:block ${viewMode === 'split' ? 'bg-[#393552] text-[#e0def4]' : 'text-[#6e6a86] hover:text-[#908caa]'}`} title="Split View"><Columns size={16} /></button>
 <button onClick={() => setViewMode('preview')} className={`p-2 rounded-lg transition-colors ${viewMode === 'preview' ? 'bg-[#393552] text-[#e0def4]' : 'text-[#6e6a86] hover:text-[#908caa]'}`} title="Preview"><Eye size={16} /></button>
 </div>
 <button 
 onClick={() => setIsFullscreen(!isFullscreen)} 
 className="p-2 text-[#908caa] hover:text-[#e0def4] hover:bg-[#393552] rounded-xl transition-colors"
 title="Toggle Fullscreen"
 >
 {isFullscreen ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
 </button>
 </div>
 </div>
 
 {viewMode !== 'preview' && (
 <div className="flex items-center gap-1 px-4 py-2 bg-[#232136] border-b border-[#393552]">
 <button onMouseDown={(e) => { e.preventDefault(); insertFormat('bold'); }} className="p-1.5 text-[#908caa] hover:text-[#e0def4] hover:bg-[#393552] rounded transition-colors" title="Bold"><Bold size={14}/></button>
 <button onMouseDown={(e) => { e.preventDefault(); insertFormat('italic'); }} className="p-1.5 text-[#908caa] hover:text-[#e0def4] hover:bg-[#393552] rounded transition-colors" title="Italic"><Italic size={14}/></button>
 <div className="w-px h-4 bg-[#393552] mx-1"></div>
 <button onMouseDown={(e) => { e.preventDefault(); insertFormat('h1'); }} className="p-1.5 text-[#908caa] hover:text-[#e0def4] hover:bg-[#393552] rounded transition-colors" title="Heading 1"><Heading1 size={14}/></button>
 <button onMouseDown={(e) => { e.preventDefault(); insertFormat('h2'); }} className="p-1.5 text-[#908caa] hover:text-[#e0def4] hover:bg-[#393552] rounded transition-colors" title="Heading 2"><Heading2 size={14}/></button>
 <div className="w-px h-4 bg-[#393552] mx-1"></div>
 <button onMouseDown={(e) => { e.preventDefault(); insertFormat('ul'); }} className="p-1.5 text-[#908caa] hover:text-[#e0def4] hover:bg-[#393552] rounded transition-colors" title="Bullet List"><List size={14}/></button>
 <button onMouseDown={(e) => { e.preventDefault(); insertFormat('code'); }} className="p-1.5 text-[#908caa] hover:text-[#e0def4] hover:bg-[#393552] rounded transition-colors" title="Code"><Code size={14}/></button>
 <button onMouseDown={(e) => { e.preventDefault(); insertFormat('link'); }} className="p-1.5 text-[#908caa] hover:text-[#e0def4] hover:bg-[#393552] rounded transition-colors" title="Link"><LinkIcon size={14}/></button>
 </div>
 )}

 <div className="flex-1 flex overflow-hidden">
 {(viewMode === 'edit' || viewMode === 'split') && (
 <div className={`flex-1 flex flex-col ${viewMode === 'split' ? 'border-r border-[#393552]' : ''}`}>
 <textarea
 id="notes-textarea"
 autoFocus
 value={notes}
 onChange={(e) => handleNotesChange(e.target.value)}
 placeholder="Start typing your notes here. Markdown is fully supported (e.g. **bold**, *italic*, # Heading, - Lists)..."
 className="flex-1 w-full bg-transparent text-[#e0def4] p-6 outline-none resize-none font-mono text-sm leading-relaxed"
 />
 </div>
 )}
 {(viewMode === 'preview' || viewMode === 'split') && (
 <div className={`flex-1 overflow-y-auto p-8 markdown-preview`}>
 {notes ? (
 <ReactMarkdown remarkPlugins={[remarkGfm, remarkBreaks]}>
 {notes}
 </ReactMarkdown>
 ) : (
 <div className="text-[#908caa] italic mt-10 text-center">Preview will appear here...</div>
 )}
 </div>
 )}
 </div>
 </>
 ) : (
 <div className="flex-1 flex flex-col items-center justify-center text-[#6e6a86]">
 <FileText size={48} className="mb-4 opacity-50" />
 <h3 className="text-xl font-bold text-[#908caa] mb-2">No Task Selected</h3>
 <p>Select a task from the sidebar to start writing notes.</p>
 </div>
 )}
 </div>
 </div>
 );
}
