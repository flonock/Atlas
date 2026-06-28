"use client";

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, FileText, CheckCircle2, Navigation, Activity, ArrowRight, Folder } from 'lucide-react';
import { useRouter, useParams } from 'next/navigation';

interface SearchResult {
 id: string;
 title: string;
 type: 'Navigation' | 'Task' | 'Note' | 'Report';
 subtitle?: string;
 icon: React.ElementType;
 action: () => void;
}

export function CommandPalette() {
 const [isOpen, setIsOpen] = useState(false);
 const [query, setQuery] = useState("");
 const [selectedIndex, setSelectedIndex] = useState(0);
 const inputRef = useRef<HTMLInputElement>(null);
 
 const router = useRouter();
 const params = useParams();
 const projectId = params?.id as string;

 const [tasks, setTasks] = useState<unknown[]>([]);
 const [notes, setNotes] = useState<unknown[]>([]);
 const [reports, setReports] = useState<unknown[]>([]);
 const [projectPath, setProjectPath] = useState<string>("");

 useEffect(() => {
 const handleKeyDown = (e: KeyboardEvent) => {
 if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
 e.preventDefault();
 setIsOpen((prev) => !prev);
 }
 if (e.key === 'Escape' && isOpen) {
 setIsOpen(false);
 }
 };
 window.addEventListener('keydown', handleKeyDown);
 return () => window.removeEventListener('keydown', handleKeyDown);
 }, [isOpen]);

 useEffect(() => {
 if (isOpen && projectId) {
 // eslint-disable-next-line react-hooks/set-state-in-effect
 setQuery("");
 setSelectedIndex(0);
 setTimeout(() => inputRef.current?.focus(), 100);

 // Fetch all project data
 const fetchData = async () => {
 try {
 if (typeof window !== 'undefined' && (window as unknown).electronAPI) {
 const api = (window as unknown).electronAPI;
 const projectStr = await api.readFile('/home/apollon/atlas-workspace/projects.json');
 const projects = JSON.parse(projectStr);
 const project = projects.find((p: unknown) => p.id === projectId);
 if (!project) return;
 
 const path = project.path;
 setProjectPath(path);

 const pathModule = await api.path();
 
 // Fetch Tasks
 const tasksFile = pathModule.join(path, '.atlas', 'tasks.json');
 try {
 const tasksStr = await api.readFile(tasksFile);
 setTasks(JSON.parse(tasksStr));
 } catch (e) {
 setTasks([]);
 }

 // Fetch Notes
 try {
 const notesData = await api.invoke('get-project-notes', path);
 setNotes(notesData);
 } catch (e) {
 setNotes([]);
 }

 // Fetch Reports
 try {
 const reportsData = await api.invoke('get-project-reports', path);
 setReports(reportsData);
 } catch (e) {
 setReports([]);
 }
 }
 } catch (e) {
 console.error("Failed to load data for command palette", e);
 }
 };
 
 fetchData();
 }
 }, [isOpen, projectId]);

 const results = useMemo<SearchResult[]>(() => {
 if (!projectId) return [];

 const navItems: SearchResult[] = [
 { id: 'nav-dash', title: 'Go to Dashboard', subtitle: 'Project overview and tasks', type: 'Navigation', icon: Activity, action: () => router.push(`/project/${projectId}/dashboard?path=${encodeURIComponent(projectPath)}`) },
 { id: 'nav-notes', title: 'Go to Notes', subtitle: 'Markdown notes', type: 'Navigation', icon: FileText, action: () => router.push(`/project/${projectId}/notes?path=${encodeURIComponent(projectPath)}`) },
 { id: 'nav-reports', title: 'Go to Reports', subtitle: 'LaTeX and structured reports', type: 'Navigation', icon: Folder, action: () => router.push(`/project/${projectId}/reports?path=${encodeURIComponent(projectPath)}`) },
 { id: 'nav-analysis', title: 'Go to Data Analysis', subtitle: 'Scientific Plotter integration', type: 'Navigation', icon: Navigation, action: () => router.push(`/project/${projectId}/analysis?path=${encodeURIComponent(projectPath)}`) },
 ];

 const taskItems: SearchResult[] = tasks.map(t => ({
 id: `task-${t.id}`,
 title: t.title,
 subtitle: `Task • ${t.status}`,
 type: 'Task',
 icon: CheckCircle2,
 action: () => router.push(`/project/${projectId}/dashboard?path=${encodeURIComponent(projectPath)}`)
 }));

 const noteItems: SearchResult[] = notes.map(n => ({
 id: `note-${n.name}`,
 title: n.name,
 subtitle: `Note`,
 type: 'Note',
 icon: FileText,
 action: () => router.push(`/project/${projectId}/notes?path=${encodeURIComponent(projectPath)}`)
 }));

 const reportItems: SearchResult[] = reports.map(r => ({
 id: `report-${r.name}`,
 title: r.name,
 subtitle: r.type === 'folder' ? 'LaTeX Project' : 'Markdown Report',
 type: 'Report',
 icon: r.type === 'folder' ? Folder : FileText,
 action: () => router.push(`/project/${projectId}/reports?path=${encodeURIComponent(projectPath)}`)
 }));

 const allItems = [...navItems, ...taskItems, ...noteItems, ...reportItems];

 if (!query.trim()) return navItems; // show navigation defaults when empty

 const q = query.toLowerCase();
 return allItems.filter(item => 
 item.title.toLowerCase().includes(q) || 
 (item.subtitle && item.subtitle.toLowerCase().includes(q))
 );
 }, [query, tasks, notes, reports, projectId, projectPath, router]);

 useEffect(() => {
 // eslint-disable-next-line react-hooks/set-state-in-effect
 setSelectedIndex(0);
 }, [query]);

 const handleKeyDown = (e: React.KeyboardEvent) => {
 if (e.key === 'ArrowDown') {
 e.preventDefault();
 setSelectedIndex(i => (i < results.length - 1 ? i + 1 : i));
 } else if (e.key === 'ArrowUp') {
 e.preventDefault();
 setSelectedIndex(i => (i > 0 ? i - 1 : 0));
 } else if (e.key === 'Enter') {
 e.preventDefault();
 if (results[selectedIndex]) {
 results[selectedIndex].action();
 setIsOpen(false);
 }
 }
 };

 return (
 <AnimatePresence>
 {isOpen && (
 <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh] px-4">
 <motion.div 
 initial={{ opacity: 0 }} 
 animate={{ opacity: 1 }} 
 exit={{ opacity: 0 }} 
 className="absolute inset-0 bg-black/60 backdrop-blur-sm"
 onClick={() => setIsOpen(false)}
 />
 <motion.div 
 initial={{ opacity: 0, scale: 0.95, y: -20 }} 
 animate={{ opacity: 1, scale: 1, y: 0 }} 
 exit={{ opacity: 0, scale: 0.95, y: -20 }} 
 className="w-full max-w-2xl bg-[#2a273f] border border-[#393552] rounded-lg shadow-2xl overflow-hidden relative z-10 flex flex-col max-h-[70vh]"
 >
 <div className="flex items-center px-4 py-4 border-b border-[#393552]">
 <Search className="text-[#908caa] mr-3" size={24} />
 <input
 ref={inputRef}
 value={query}
 onChange={(e) => setQuery(e.target.value)}
 onKeyDown={handleKeyDown}
 placeholder="Search tasks, notes, reports, or navigate..."
 className="flex-1 bg-transparent border-none outline-none text-[#e0def4] text-xl placeholder-[#6e6a86]"
 />
 <div className="flex gap-1">
 <kbd className="bg-[#232136] text-[#908caa] text-xs px-2 py-1 rounded border border-[#393552]">ESC</kbd>
 </div>
 </div>

 <div className="flex-1 overflow-y-auto p-2">
 {results.length === 0 ? (
 <div className="py-12 text-center text-[#908caa]">
  No results found for &quot;{query}&quot;
 </div>
 ) : (
 results.map((result, i) => (
 <div
 key={result.id}
 onMouseEnter={() => setSelectedIndex(i)}
 onClick={() => { result.action(); setIsOpen(false); }}
 className={`flex items-center justify-between p-3 rounded-lg cursor-pointer transition-colors ${i === selectedIndex ? 'bg-[#393552] text-[#e0def4]' : 'text-[#908caa]'}`}
 >
 <div className="flex items-center gap-4">
 <div className={`p-2 rounded-lg flex items-center justify-center ${i === selectedIndex ? 'bg-[#c4a7e7] text-[#232136]' : 'bg-[#232136] text-[#6e6a86]'}`}>
 <result.icon size={18} />
 </div>
 <div className="flex flex-col">
 <span className="font-bold">{result.title}</span>
 {result.subtitle && <span className="text-xs opacity-70">{result.subtitle}</span>}
 </div>
 </div>
 {i === selectedIndex && <ArrowRight size={16} className="text-[#c4a7e7]" />}
 </div>
 ))
 )}
 </div>
 
 <div className="bg-[#232136] border-t border-[#393552] p-3 flex items-center justify-between text-xs text-[#6e6a86]">
 <div className="flex gap-4">
 <span className="flex items-center gap-1"><kbd className="bg-[#2a273f] px-1.5 py-0.5 rounded border border-[#393552]">↑</kbd> <kbd className="bg-[#2a273f] px-1.5 py-0.5 rounded border border-[#393552]">↓</kbd> to navigate</span>
 <span className="flex items-center gap-1"><kbd className="bg-[#2a273f] px-1.5 py-0.5 rounded border border-[#393552]">Enter</kbd> to select</span>
 </div>
 </div>
 </motion.div>
 </div>
 )}
 </AnimatePresence>
 );
}
