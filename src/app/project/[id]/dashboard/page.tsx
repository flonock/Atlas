"use client";

import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, Clock, Activity, Plus, LayoutList, Columns, CalendarDays, Edit2, LayoutGrid, Trash2 } from "lucide-react";
import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Modal, ModalResult } from "@/components/ui/Modal";
import { KanbanBoard, Task, getUrgency } from "@/components/ui/KanbanBoard";
import { GanttChart } from "@/components/ui/GanttChart";
import { EisenhowerMatrix } from "@/components/ui/EisenhowerMatrix";
import { VelocityAnalytics } from "@/components/ui/VelocityAnalytics";
import { CalendarView } from "@/components/ui/CalendarView";

export default function ProjectDashboard() {
 const searchParams = useSearchParams();
 const router = useRouter();
 const projectName = searchParams.get('name') || 'Project';
 const projectPath = searchParams.get('path') || '';

 const [tasks, setTasks] = useState<Task[]>([]);
 const [isModalOpen, setIsModalOpen] = useState(false);
 const [taskToEdit, setTaskToEdit] = useState<Task | null>(null);
 const [view, setView] = useState<'Kanban' | 'List' | 'Timeline' | 'Matrix' | 'Velocity' | 'Calendar'>('Kanban');
 const [prefillStart, setPrefillStart] = useState("");
 const [prefillEnd, setPrefillEnd] = useState("");

 useEffect(() => {
 const handleKeyDown = (e: KeyboardEvent) => {
 // Don't trigger shortcuts if we're typing in an input
 if (document.activeElement?.tagName === 'INPUT' || document.activeElement?.tagName === 'TEXTAREA') return;

 // Cmd/Ctrl + N -> New Task
 if ((e.metaKey || e.ctrlKey) && e.key === 'n') {
 e.preventDefault();
 setTaskToEdit(null);
 setIsModalOpen(true);
 }

 // Alt/Option + 1..6 -> Switch views
 if (e.altKey) {
 switch (e.key) {
 case '1': e.preventDefault(); setView('Kanban'); break;
 case '2': e.preventDefault(); setView('List'); break;
 case '3': e.preventDefault(); setView('Calendar'); break;
 case '4': e.preventDefault(); setView('Matrix'); break;
 case '5': e.preventDefault(); setView('Timeline'); break;
 case '6': e.preventDefault(); setView('Velocity'); break;
 }
 }
 };

 window.addEventListener('keydown', handleKeyDown);
 return () => window.removeEventListener('keydown', handleKeyDown);
 }, []);
 const handleTaskUpdate = (updatedTask: Task) => {
 const targetId = updatedTask.parentId || updatedTask.id;
 const newTasks = tasks.map(t => t.id === targetId ? { ...t, ...updatedTask, id: t.id, parentId: undefined } : t);
 saveTasks(newTasks);
 };

 const loadTasks = () => {
 // eslint-disable-next-line @typescript-eslint/no-explicit-any
 if (typeof window !== "undefined" && (window as unknown).require && projectPath) {
 // eslint-disable-next-line @typescript-eslint/no-explicit-any
 const { ipcRenderer } = (window as unknown).require("electron");
 ipcRenderer.invoke('get-project-tasks', projectPath).then((data: unknown) => {
 const loadedTasks = data || [];
 const normalizedTasks = loadedTasks.map((t: unknown) => ({
 ...t,
 progress: t.progress !== undefined ? t.progress : (t.type === 'Event' || t.type === 'Milestone' ? undefined : 0)
 }));
 setTasks(normalizedTasks);
 });
 }
 };

 useEffect(() => {
 loadTasks();
 }, [projectPath]);

 const saveTasks = async (newTasks: Task[]) => {
 setTasks(newTasks);
 // eslint-disable-next-line @typescript-eslint/no-explicit-any
 if (typeof window !== "undefined" && (window as unknown).require && projectPath) {
 // eslint-disable-next-line @typescript-eslint/no-explicit-any
 const { ipcRenderer } = (window as unknown).require("electron");
 await ipcRenderer.invoke('save-project-tasks', projectPath, newTasks);
 }
 };

 const handleCreateOrEditTask = (result: ModalResult) => {
 if (result.id) {
 // Edit existing
 const targetId = taskToEdit?.parentId || result.id;
 const updatedTasks = tasks.map(t => {
 if (t.id === targetId) {
 return {
 ...t,
 title: result.title,
 startDate: result.startDate,
 endDate: result.endDate,
 type: result.type || "Task",
 phaseId: result.phaseId,
 dependencies: result.dependencies || [],
 progress: result.progress,
 importance: result.importance || "Medium",
 due: result.endDate || t.due || "No Due Date",
 recurrence: result.recurrence,
 recurrenceEndDate: result.recurrenceEndDate
 };
 }
 return t;
 });
 saveTasks(updatedTasks);
 } else {
 // Create new
 const newTask: Task = {
 // eslint-disable-next-line react-hooks/purity
 id: Date.now().toString(),
 title: result.title,
 priority: "Medium",
 importance: result.importance || "Medium",
 due: result.endDate || "No Due Date",
 startDate: result.startDate,
 endDate: result.endDate,
 type: result.type || "Task",
 status: "To Do",
 phaseId: result.phaseId,
 dependencies: result.dependencies || [],
 progress: result.progress || 0,
 notes: "",
 recurrence: result.recurrence,
 recurrenceEndDate: result.recurrenceEndDate
 };
 saveTasks([...tasks, newTask]);
 }
 setPrefillStart("");
 setPrefillEnd("");
 setTaskToEdit(null);
 };

 const handleDeleteTask = (taskId: string) => {
    if (window.confirm("Are you sure you want to delete this task? This action cannot be undone.")) {
      const updatedTasks = tasks.filter(t => t.id !== taskId);
      saveTasks(updatedTasks);
      setTaskToEdit(null);
    }
  };

 const handleDoubleClickTask = (task: Task) => {
 const targetId = task.parentId || task.id;
 router.push(`${window.location.pathname.replace('/dashboard', '/notes')}?name=${encodeURIComponent(projectName)}&path=${encodeURIComponent(projectPath)}&taskId=${targetId}`);
 };

 const cycleStatus = (taskId: string) => {
 const task = tasks.find(t => t.id === taskId);
 if (!task) return;
 const targetId = task.parentId || taskId;
 const statuses = ["To Do", "In Progress", "In Review", "Done"];
 const newTasks = tasks.map(t => {
 if (t.id === targetId) {
 const nextIndex = (statuses.indexOf(t.status) + 1) % statuses.length;
 return { ...t, status: statuses[nextIndex] };
 }
 return t;
 });
 saveTasks(newTasks);
 };

 const handleDrawTask = (start: string, end: string) => {
 setPrefillStart(start);
 setPrefillEnd(end);
 setTaskToEdit(null);
 setIsModalOpen(true);
 };

 return (
 <div className="space-y-8 h-full flex flex-col">
 <Modal
 isOpen={isModalOpen}
 onClose={() => {
 setIsModalOpen(false);
 setPrefillStart("");
 setPrefillEnd("");
 setTaskToEdit(null);
 }}
 onSubmit={handleCreateOrEditTask}
 onDelete={handleDeleteTask}
 onEditNotes={handleDoubleClickTask}
 title={taskToEdit ? "Edit Task / Event" : "Create New Task / Event"}
 placeholder="Enter task title (e.g. Design ADCS Mount)..."
 showAdvanced={true}
 initialStartDate={prefillStart}
 initialEndDate={prefillEnd}
 existingTasks={tasks}
 taskToEdit={taskToEdit}
 />

 <motion.div
 initial={{ opacity: 0, y: -20 }}
 animate={{ opacity: 1, y: 0 }}
 className="flex items-center justify-between"
 >
 <div>
 <h1 className="text-3xl font-bold tracking-tight text-[#e0def4]">{projectName}</h1>
 <p className="text-[#908caa] mt-1 truncate max-w-lg">{projectPath}</p>
 </div>
 <div className="flex gap-3">
 <div className="flex bg-[#2a273f] rounded-xl border border-[#393552] p-1">
 <button onClick={() => setView('List')} className={`p-2 rounded-lg transition-colors ${view === 'List' ? 'bg-[#393552] text-[#e0def4]' : 'text-[#6e6a86] hover:text-[#908caa]'}`}><LayoutList size={18} /></button>
 <button onClick={() => setView('Kanban')} className={`p-2 rounded-lg transition-colors ${view === 'Kanban' ? 'bg-[#393552] text-[#e0def4]' : 'text-[#6e6a86] hover:text-[#908caa]'}`}><Columns size={18} /></button>
 <button onClick={() => setView('Calendar')} className={`p-2 rounded-lg transition-colors ${view === 'Calendar' ? 'bg-[#393552] text-[#e0def4]' : 'text-[#6e6a86] hover:text-[#908caa]'}`}><CalendarDays size={18} /></button>
 <button onClick={() => setView('Matrix')} className={`p-2 rounded-lg transition-colors ${view === 'Matrix' ? 'bg-[#393552] text-[#e0def4]' : 'text-[#6e6a86] hover:text-[#908caa]'}`}><LayoutGrid size={18} /></button>
 <button onClick={() => setView('Timeline')} className={`p-2 rounded-lg transition-colors ${view === 'Timeline' ? 'bg-[#393552] text-[#e0def4]' : 'text-[#6e6a86] hover:text-[#908caa]'}`}><Clock size={18} /></button>
 <button onClick={() => setView('Velocity')} className={`p-2 rounded-lg transition-colors ${view === 'Velocity' ? 'bg-[#393552] text-[#e0def4]' : 'text-[#6e6a86] hover:text-[#908caa]'}`}><Activity size={18} /></button>
 </div>
 <button 
 onClick={() => { setTaskToEdit(null); setIsModalOpen(true); }}
 className="flex items-center gap-2 bg-[#c4a7e7] text-[#232136] px-4 py-2 rounded-xl font-bold hover:bg-[#b094d6] transition-colors"
 >
 <Plus size={18} />
 <span>Add Task</span>
 </button>
 </div>
 </motion.div>

 <div className="flex-1 min-h-0">
 <AnimatePresence mode="wait">
 <motion.div
 key={view}
 initial={{ opacity: 0, y: 10 }}
 animate={{ opacity: 1, y: 0 }}
 className="h-full"
 >
 {view === 'List' && (
 <div className="glass-panel p-6 rounded-2xl h-full min-h-[400px]">
 <div className="space-y-4">
 {tasks.map((task) => {
 const urgency = getUrgency(task);
 return (
 <div 
 key={task.id} 
 onDoubleClick={(e) => { e.stopPropagation(); handleDoubleClickTask(task); }}
 className={`flex items-center justify-between p-4 rounded-xl bg-[#2a273f]/50 border hover:border-[#c4a7e7]/50 transition-colors group ${task.status === 'Done' ? 'opacity-50 border-[#393552]' : (task.type === 'Phase' ? 'border-[#c4a7e7]/30' : task.type === 'Event' ? 'border-[#ea9a97]/30' : task.type === 'Milestone' ? 'border-[#f6c177]/30' : 'border-[#393552]/50')}`}
 >
 <div className="flex items-center gap-4 cursor-pointer" onClick={() => cycleStatus(task.id)}>
 <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-colors ${task.status === 'Done' ? 'bg-[#c4a7e7] border-[#c4a7e7]' : 'border-[#6e6a86] group-hover:border-[#c4a7e7]'}`}>
 {task.status === 'Done' && <CheckCircle2 size={14} className="text-[#232136]" />}
 </div>
 <div>
 <h4 className={`font-medium flex items-center gap-2 ${task.status === 'Done' ? 'text-[#908caa] line-through' : 'text-[#e0def4]'}`}>
 {task.title}
 {task.type === 'Phase' && <span className="text-[10px] bg-[#c4a7e7]/20 text-[#c4a7e7] px-2 py-0.5 rounded-full no-underline font-bold">Phase</span>}
 {task.type === 'Event' && <span className="text-[10px] bg-[#ea9a97]/20 text-[#ea9a97] px-2 py-0.5 rounded-full no-underline font-bold">Event</span>}
 {task.type === 'Milestone' && <span className="text-[10px] bg-[#f6c177]/20 text-[#f6c177] px-2 py-0.5 rounded-full no-underline font-bold">Milestone</span>}
 <button 
 onClick={(e) => { e.stopPropagation(); setTaskToEdit(task); setIsModalOpen(true); }}
 className="ml-2 text-[#908caa] opacity-0 group-hover:opacity-100 hover:text-[#e0def4] p-1 rounded transition-all"
 title="Edit Task"
 >
 <Edit2 size={14} />
 </button>
 <button 
 onClick={(e) => { e.stopPropagation(); handleDeleteTask(task.id); }}
 className="ml-1 text-[#eb6f92]/70 opacity-0 group-hover:opacity-100 hover:text-[#eb6f92] p-1 rounded transition-all hover:bg-[#eb6f92]/10"
 title="Delete Task"
 >
 <Trash2 size={14} />
 </button>
 </h4>
 <div className="flex items-center gap-3 text-xs mt-1 flex-wrap">
 <span className={`font-bold ${task.importance === 'High' ? 'text-[#eb6f92]' : task.importance === 'Low' ? 'text-[#908caa]' : 'text-[#f6c177]'}`}>
 {task.importance || 'Medium'} Imp.
 </span>
 <span className="text-[#6e6a86]">•</span>
 <span className={`font-bold ${urgency === 'High' ? 'text-[#eb6f92]' : urgency === 'Low' ? 'text-[#908caa]' : 'text-[#f6c177]'}`}>
 {urgency} Urg.
 </span>
 <span className="text-[#6e6a86]">•</span>
 <span className="text-[#9ccfd8] flex items-center gap-1">
 <Clock size={12} /> {task.endDate || task.due || 'No date'}
 </span>
 </div>
 </div>
 </div>
 
 <div className="flex items-center gap-6">
 {task.type !== 'Event' && task.type !== 'Milestone' && task.progress !== undefined && (
 <div className="w-32">
 <div className="flex justify-between text-[10px] text-[#908caa] mb-1 font-bold">
 <span>PROGRESS</span>
 <span>{Math.round(task.progress)}%</span>
 </div>
 <div className="h-1.5 w-full bg-[#232136] rounded-full overflow-hidden relative">
 <div className="h-full bg-[#c4a7e7] rounded-full transition-all duration-300 pointer-events-none" style={{ width: `${Math.max(0, Math.min(100, task.progress))}%` }} />
 <input 
 type="range" 
 min="0" max="100" 
 value={task.progress} 
 onClick={(e) => e.stopPropagation()}
 onChange={(e) => {
 const newProgress = Number(e.target.value);
 saveTasks(tasks.map(t => t.id === (task.parentId || task.id) ? { ...t, progress: newProgress } : t));
 }}
 className="absolute inset-0 w-full opacity-0 cursor-ew-resize"
 />
 </div>
 </div>
 )}
 
 <div className="text-sm font-medium text-[#908caa] bg-[#393552]/50 px-3 py-1 rounded-md cursor-pointer" onClick={() => cycleStatus(task.id)}>
 {task.status}
 </div>
 </div>
 </div>
 );
 })}
 {tasks.length === 0 && (
 <div className="flex flex-col items-center justify-center h-48 text-[#908caa]">
 <CheckCircle2 size={32} className="mb-2 opacity-50" />
 <p>No tasks yet. Create one to get started!</p>
 </div>
 )}
 </div>
 </div>
 )}

 {view === 'Kanban' && (
 <div className="h-full">
 <KanbanBoard 
 tasks={tasks.filter(t => t.type !== 'Event' && t.type !== 'Milestone')} 
 onTaskUpdate={handleTaskUpdate} 
 onEditTask={(task) => {
 setTaskToEdit(task);
 setIsModalOpen(true);
 }}
 onDoubleClickTask={handleDoubleClickTask}
 onDeleteTask={handleDeleteTask}
 />
 </div>
 )}
 {view === 'Timeline' && (
 <div className="h-full min-h-[400px]">
 <GanttChart 
 tasks={tasks} 
 onTaskUpdate={handleTaskUpdate} 
 onDrawTask={handleDrawTask} 
 onEditTask={(task) => {
 setTaskToEdit(task);
 setIsModalOpen(true);
 }}
 onDoubleClickTask={handleDoubleClickTask}
 onDeleteTask={handleDeleteTask}
 />
 </div>
 )}
 {view === 'Matrix' && (
 <div className="h-full">
 <EisenhowerMatrix 
 tasks={tasks.filter(t => t.type !== 'Event' && t.type !== 'Milestone')} 
 onTaskUpdate={handleTaskUpdate} 
 onEditTask={(task) => {
 setTaskToEdit(task);
 setIsModalOpen(true);
 }}
 onDoubleClickTask={handleDoubleClickTask}
 onDeleteTask={handleDeleteTask}
 />
 </div>
 )}
 {view === 'Velocity' && (
 <div className="h-full">
 <VelocityAnalytics tasks={tasks} />
 </div>
 )}
 {view === 'Calendar' && (
 <div className="h-full">
 <CalendarView 
 tasks={tasks.filter(t => t.type !== 'Phase')} 
 onTaskUpdate={handleTaskUpdate} 
 onEditTask={(task) => {
 setTaskToEdit(task);
 setIsModalOpen(true);
 }}
 />
 </div>
 )}
 </motion.div>
 </AnimatePresence>
 </div>
 </div>
 );
}
