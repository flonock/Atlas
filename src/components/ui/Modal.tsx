import { motion, AnimatePresence } from "framer-motion";
import { X, Check } from "lucide-react";
import { useState, useEffect } from "react";
import { Task } from "./KanbanBoard";

export interface ModalResult {
 id?: string;
 title: string;
 startDate?: string;
 endDate?: string;
 type?: 'Task' | 'Event' | 'Phase' | 'Milestone';
 phaseId?: string;
 dependencies?: string[];
 progress?: number;
 importance?: 'High' | 'Medium' | 'Low';
 recurrence?: 'none' | 'daily' | 'weekly' | 'monthly';
 recurrenceEndDate?: string;
 estimatedHours?: number;
 actualHours?: number;
}

interface ModalProps {
 isOpen: boolean;
 onClose: () => void;
 onSubmit: (result: ModalResult) => void;
 title: string;
 placeholder?: string;
 submitText?: string;
 showAdvanced?: boolean;
 initialStartDate?: string;
 initialEndDate?: string;
 existingTasks?: Task[];
 taskToEdit?: Task | null;
 onDelete?: (id: string) => void;
 onEditNotes?: (task: Task) => void;
}

export function Modal({ isOpen, onClose, onSubmit, onDelete, onEditNotes, title, placeholder = "Enter value...", submitText = "Save", showAdvanced = false, initialStartDate = "", initialEndDate = "", existingTasks = [], taskToEdit = null }: ModalProps) {
 const [inputValue, setInputValue] = useState("");
 const [startDate, setStartDate] = useState("");
 const [endDate, setEndDate] = useState("");
 const [taskType, setTaskType] = useState<'Task' | 'Event' | 'Phase' | 'Milestone'>('Task');
 const [phaseId, setPhaseId] = useState<string>("");
 const [dependencies, setDependencies] = useState<string[]>([]);
 const [progress, setProgress] = useState<number>(0);
 const [importance, setImportance] = useState<'High' | 'Medium' | 'Low'>('Medium');
 const [urgency, setUrgency] = useState<'High' | 'Medium' | 'Low' | ''>('');
 const [recurrence, setRecurrence] = useState<'none' | 'daily' | 'weekly' | 'monthly'>('none');
 const [recurrenceEndDate, setRecurrenceEndDate] = useState<string>("");
 const [estimatedHours, setEstimatedHours] = useState<number | ''>('');
 const [actualHours, setActualHours] = useState<number | ''>('');

 useEffect(() => {
 if (isOpen) {
 if (taskToEdit) {
 // eslint-disable-next-line react-hooks/set-state-in-effect
 setInputValue(taskToEdit.title);
 setStartDate(taskToEdit.startDate || "");
 setEndDate(taskToEdit.endDate || taskToEdit.due || "");
 setTaskType((taskToEdit.type as unknown) || "Task");
 setPhaseId(taskToEdit.phaseId || "");
 setDependencies(taskToEdit.dependencies || []);
 setProgress(taskToEdit.progress || 0);
 setImportance(taskToEdit.importance || "Medium");
 setUrgency(taskToEdit.urgency || "");
 setRecurrence(taskToEdit.recurrence || 'none');
 setRecurrenceEndDate(taskToEdit.recurrenceEndDate || "");
 setEstimatedHours(taskToEdit.estimatedHours ?? '');
 setActualHours(taskToEdit.actualHours ?? '');
 } else {
 setInputValue("");
 setStartDate(initialStartDate);
 setEndDate(initialEndDate);
 setTaskType("Task");
 setPhaseId("");
 setDependencies([]);
 setProgress(0);
 setImportance("Medium");
 setUrgency("");
 setRecurrence('none');
 setRecurrenceEndDate("");
 setEstimatedHours('');
 setActualHours('');
 }
 }
 }, [isOpen, initialStartDate, initialEndDate, taskToEdit]);

 useEffect(() => {
 const handleKeyDown = (e: KeyboardEvent) => {
 if (!isOpen) return;

 if (e.key === 'Escape') {
 e.preventDefault();
 onClose();
 }

 if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
 e.preventDefault();
 if (inputValue.trim()) {
 onSubmit({
 id: taskToEdit?.id,
 title: inputValue.trim(),
 ...(showAdvanced && startDate ? { startDate } : {}),
 ...(showAdvanced ? { endDate: taskType === 'Event' ? startDate : endDate } : {}),
 ...(showAdvanced ? { type: taskType } : {}),
 ...(showAdvanced && taskType !== 'Phase' && phaseId ? { phaseId } : {}),
 ...(showAdvanced && dependencies.length > 0 ? { dependencies } : {}),
 ...(showAdvanced && taskType !== 'Phase' ? { progress } : {}),
 ...(showAdvanced ? { importance } : {}),
 ...(showAdvanced && urgency !== "" ? { urgency } : {}),
 ...(showAdvanced && taskType === 'Event' ? { recurrence, recurrenceEndDate } : {}),
 ...(showAdvanced && estimatedHours !== '' ? { estimatedHours: Number(estimatedHours) } : {}),
 ...(showAdvanced && actualHours !== '' ? { actualHours: Number(actualHours) } : {})
 });
 onClose();
 }
 }
 };

 window.addEventListener('keydown', handleKeyDown);
 return () => window.removeEventListener('keydown', handleKeyDown);
 }, [
 isOpen, inputValue, taskToEdit, showAdvanced, startDate, endDate, taskType, phaseId,
 dependencies, progress, importance, urgency, recurrence, recurrenceEndDate, estimatedHours, actualHours,
 onSubmit, onClose
 ]);

 if (!isOpen) return null;

 const handleSubmit = (e: React.FormEvent) => {
 e.preventDefault();
 if (inputValue.trim()) {
 onSubmit({
 id: taskToEdit?.id,
 title: inputValue.trim(),
 ...(showAdvanced && startDate ? { startDate } : {}),
 ...(showAdvanced ? { endDate: taskType === 'Event' ? startDate : endDate } : {}),
 ...(showAdvanced ? { type: taskType } : {}),
 ...(showAdvanced && taskType !== 'Phase' && phaseId ? { phaseId } : {}),
 ...(showAdvanced && dependencies.length > 0 ? { dependencies } : {}),
 ...(showAdvanced && taskType !== 'Phase' ? { progress } : {}),
 ...(showAdvanced ? { importance } : {}),
 ...(showAdvanced && urgency !== "" ? { urgency } : {}),
 ...(showAdvanced && taskType === 'Event' ? { recurrence, recurrenceEndDate } : {}),
 ...(showAdvanced && estimatedHours !== '' ? { estimatedHours: Number(estimatedHours) } : {}),
 ...(showAdvanced && actualHours !== '' ? { actualHours: Number(actualHours) } : {})
 });
 onClose();
 }
 };

 const availablePhases = existingTasks.filter(t => t.type === 'Phase' && t.id !== taskToEdit?.id);
 const availableDependencies = existingTasks.filter(t => t.id !== taskToEdit?.id);

 const toggleDependency = (id: string) => {
 setDependencies(prev => prev.includes(id) ? prev.filter(d => d !== id) : [...prev, id]);
 };

 return (
 <AnimatePresence>
 <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
 <motion.div
 initial={{ opacity: 0, scale: 0.95 }}
 animate={{ opacity: 1, scale: 1 }}
 exit={{ opacity: 0, scale: 0.95 }}
 className="bg-[#2a273f] border border-[#393552] rounded-lg p-6 w-full max-w-md shadow-2xl max-h-[90vh] overflow-y-auto"
 >
 <div className="flex items-center justify-between mb-6">
 <h2 className="text-xl font-bold text-[#e0def4]">{title}</h2>
 <button onClick={onClose} className="text-[#908caa] hover:text-[#eb6f92] transition-colors">
 <X size={20} />
 </button>
 </div>
 <form onSubmit={handleSubmit} className="space-y-4">
 <div>
 <label className="text-sm font-bold text-[#908caa] block mb-2">Title</label>
 <input
 type="text"
 autoFocus
 value={inputValue}
 onChange={(e) => setInputValue(e.target.value)}
 placeholder={placeholder}
 className="w-full bg-[#232136] border border-[#393552] text-[#e0def4] rounded-lg px-4 py-3 outline-none focus:border-[#c4a7e7] transition-colors"
 />
 </div>
 
 {showAdvanced && (
 <>
 <div className="grid grid-cols-2 gap-4">
 <div>
 <label className="text-sm font-bold text-[#908caa] block mb-2">Type</label>
 <select
 value={taskType}
 onChange={(e) => {
 setTaskType(e.target.value as unknown);
 if (e.target.value === 'Phase') setPhaseId("");
 }}
 className="w-full bg-[#232136] border border-[#393552] text-[#e0def4] rounded-lg px-4 py-3 outline-none focus:border-[#c4a7e7] transition-colors"
 >
 <option value="Task">Task</option>
 <option value="Event">Event</option>
 <option value="Phase">Phase</option>
 <option value="Milestone">Milestone</option>
 </select>
 </div>
 {taskType !== 'Phase' && (
 <div>
 <label className="text-sm font-bold text-[#908caa] block mb-2">Assign to Phase</label>
 <select
 value={phaseId}
 onChange={(e) => setPhaseId(e.target.value)}
 className="w-full bg-[#232136] border border-[#393552] text-[#e0def4] rounded-lg px-4 py-3 outline-none focus:border-[#c4a7e7] transition-colors"
 >
 <option value="">None (Orphan)</option>
 {availablePhases.map(p => (
 <option key={p.id} value={p.id}>{p.title}</option>
 ))}
 </select>
 </div>
 )}
 </div>

 {taskType !== 'Phase' && (
 <div>
 <div className="flex justify-between items-center mb-2">
 <label className="text-sm font-bold text-[#908caa]">Progress</label>
 <span className="text-xs font-bold text-[#c4a7e7]">{progress}%</span>
 </div>
 <input
 type="range"
 min="0"
 max="100"
 value={progress}
 onChange={(e) => setProgress(Number(e.target.value))}
 className="w-full accent-[#c4a7e7] h-2 bg-[#232136] rounded-lg appearance-none cursor-pointer"
 />
 </div>
 )}

 <div className="grid grid-cols-2 gap-4">
 <div className="col-span-2">
 <div className="grid grid-cols-2 gap-4">
 <div>
 <label className="text-sm font-bold text-[#908caa] block mb-2">Importance</label>
 <select
 className="w-full bg-[#2a273f] border border-[#393552] rounded-lg px-4 py-2 text-[#e0def4] focus:outline-none focus:border-[#c4a7e7] transition-colors"
 value={importance}
 onChange={(e) => setImportance(e.target.value as unknown)}
 >
 <option value="High">High</option>
 <option value="Medium">Medium</option>
 <option value="Low">Low</option>
 </select>
 </div>
 <div>
 <label className="text-sm font-bold text-[#908caa] block mb-2">Urgency</label>
 <select
 className="w-full bg-[#2a273f] border border-[#393552] rounded-lg px-4 py-2 text-[#e0def4] focus:outline-none focus:border-[#c4a7e7] transition-colors"
 value={urgency}
 onChange={(e) => setUrgency(e.target.value as unknown)}
 >
 <option value="">Auto (From Due Date)</option>
 <option value="High">High</option>
 <option value="Medium">Medium</option>
 <option value="Low">Low</option>
 </select>
 </div>
 </div>
 </div>
 </div>

 {taskType === 'Event' && (
 <div className="grid grid-cols-2 gap-4 mt-4 col-span-2 border-t border-[#393552] pt-4">
 <div>
 <label className="text-sm font-bold text-[#908caa] block mb-2">Recurrence</label>
 <select
 value={recurrence}
 onChange={(e) => setRecurrence(e.target.value as unknown)}
 className="w-full bg-[#232136] border border-[#393552] text-[#e0def4] rounded-lg px-4 py-3 outline-none focus:border-[#c4a7e7] transition-colors"
 >
 <option value="none">None (One-time)</option>
 <option value="daily">Daily</option>
 <option value="weekly">Weekly</option>
 <option value="monthly">Monthly</option>
 </select>
 </div>
 {recurrence !== 'none' && (
 <div>
 <label className="text-sm font-bold text-[#908caa] block mb-2">Repeat Until (Optional)</label>
 <input
 type="date"
 value={recurrenceEndDate}
 onChange={(e) => setRecurrenceEndDate(e.target.value)}
 className="w-full bg-[#232136] border border-[#393552] text-[#e0def4] rounded-lg px-4 py-3 outline-none focus:border-[#c4a7e7] transition-colors"
 />
 </div>
 )}
 </div>
 )}

 <div className={`grid ${taskType === 'Event' ? 'grid-cols-1' : 'grid-cols-2'} gap-4 mt-4`}>
 <div>
 <label className="text-sm font-bold text-[#908caa] block mb-2">{taskType === 'Event' ? 'Date' : 'Start Date'}</label>
 <input
 type="date"
 value={startDate}
 onChange={(e) => setStartDate(e.target.value)}
 className="w-full bg-[#232136] border border-[#393552] text-[#e0def4] rounded-lg px-4 py-3 outline-none focus:border-[#c4a7e7] transition-colors"
 />
 </div>
 {taskType !== 'Event' && (
 <div>
 <label className="text-sm font-bold text-[#908caa] block mb-2">End Date (Due Date)</label>
 <input
 type="date"
 value={endDate}
 onChange={(e) => setEndDate(e.target.value)}
 className="w-full bg-[#232136] border border-[#393552] text-[#e0def4] rounded-lg px-4 py-3 outline-none focus:border-[#c4a7e7] transition-colors"
 />
 </div>
 )}
 </div>

 {taskType !== 'Phase' && (
 <div className="grid grid-cols-2 gap-4 mt-4">
 <div>
 <label className="text-sm font-bold text-[#908caa] block mb-2">Estimated Hours</label>
 <input
 type="number"
 min="0"
 step="0.5"
 value={estimatedHours}
 onChange={(e) => setEstimatedHours(e.target.value ? Number(e.target.value) : '')}
 className="w-full bg-[#232136] border border-[#393552] text-[#e0def4] rounded-lg px-4 py-3 outline-none focus:border-[#c4a7e7] transition-colors"
 placeholder="e.g. 5"
 />
 </div>
 <div>
 <label className="text-sm font-bold text-[#908caa] block mb-2">Actual Hours</label>
 <input
 type="number"
 min="0"
 step="0.5"
 value={actualHours}
 onChange={(e) => setActualHours(e.target.value ? Number(e.target.value) : '')}
 className="w-full bg-[#232136] border border-[#393552] text-[#e0def4] rounded-lg px-4 py-3 outline-none focus:border-[#c4a7e7] transition-colors"
 placeholder="e.g. 3.5"
 />
 </div>
 </div>
 )}
 
 {taskType !== 'Phase' && availableDependencies.length > 0 && (
 <div>
 <label className="text-sm font-bold text-[#908caa] block mb-2">Dependencies (Must complete before)</label>
 <div className="bg-[#232136] border border-[#393552] rounded-lg p-2 max-h-32 overflow-y-auto space-y-1">
 {availableDependencies.map(dep => (
 <div 
 key={dep.id} 
 onClick={() => toggleDependency(dep.id)}
 className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-colors ${dependencies.includes(dep.id) ? 'bg-[#c4a7e7]/20 text-[#e0def4]' : 'hover:bg-[#2a273f] text-[#908caa]'}`}
 >
 <div className={`w-4 h-4 rounded border flex items-center justify-center ${dependencies.includes(dep.id) ? 'bg-[#c4a7e7] border-[#c4a7e7]' : 'border-[#6e6a86]'}`}>
 {dependencies.includes(dep.id) && <Check size={12} className="text-[#232136]" />}
 </div>
 <span className="text-sm truncate">{dep.title}</span>
 </div>
 ))}
 </div>
 </div>
 )}
 </>
 )}
 
 <div className="flex gap-2 mt-4">
 {taskToEdit && onDelete && (
 <button
 type="button"
 onClick={() => {
 onDelete(taskToEdit.id);
 onClose();
 }}
 className="bg-[#eb6f92]/20 text-[#eb6f92] font-bold py-3 px-4 rounded-lg hover:bg-[#eb6f92]/30 transition-colors"
 >
 Delete
 </button>
 )}
 {taskToEdit && onEditNotes && (
 <button
 type="button"
 onClick={() => {
 onEditNotes(taskToEdit);
 onClose();
 }}
 className="bg-[#3e8fb0]/20 text-[#3e8fb0] font-bold py-3 px-4 rounded-lg hover:bg-[#3e8fb0]/30 transition-colors"
 >
 Edit Notes
 </button>
 )}
 <button
 type="submit"
 disabled={!inputValue.trim()}
 className="flex-1 bg-[#c4a7e7] text-[#232136] font-bold py-3 rounded-lg hover:bg-[#908caa] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
 >
 {submitText}
 </button>
 </div>
 </form>
 </motion.div>
 </div>
 </AnimatePresence>
 );
}
