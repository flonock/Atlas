import React from "react";
import {
 DndContext,
 closestCorners,
 KeyboardSensor,
 PointerSensor,
 useSensor,
 useSensors,
 DragEndEvent,
 useDroppable,
} from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy, useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Clock, Edit2, Trash2 } from "lucide-react";
import { differenceInDays, parseISO, isValid } from "date-fns";

export interface Task {
 id: string;
 title: string;
 priority: string;
 importance?: 'High' | 'Medium' | 'Low';
 urgency?: 'High' | 'Medium' | 'Low';
 due: string;
 status: string;
 startDate?: string;
 endDate?: string;
 dependencies?: string[];
 type?: 'Task' | 'Phase' | 'Event' | 'Milestone';
 phaseId?: string;
 progress?: number;
 notes?: string;
 recurrence?: 'none' | 'daily' | 'weekly' | 'monthly';
 recurrenceEndDate?: string;
 parentId?: string;
 estimatedHours?: number;
 actualHours?: number;
}

export function getUrgency(task: Task): 'High' | 'Medium' | 'Low' {
 if (task.urgency) return task.urgency;
 const dateStr = task.endDate || task.due;
 if (!dateStr || dateStr === 'No Due Date' || dateStr === 'No date') return 'Low';
 const parsed = parseISO(dateStr);
 if (!isValid(parsed)) return 'Low';
 const days = differenceInDays(parsed, new Date());
 if (days <= 3) return 'High';
 if (days <= 7) return 'Medium';
 return 'Low';
}

export function resolveDependencies(task: Task, allTasks: Task[]): string[] {
  if (!task.dependencies) return [];
  const resolved = new Set<string>();
  for (const depId of task.dependencies) {
    const depTask = allTasks.find(t => t.id === depId);
    if (depTask?.type === 'Phase') {
      const phaseTasks = allTasks.filter(t => t.phaseId === depTask.id);
      if (phaseTasks.length > 0) {
        const sorted = [...phaseTasks].sort((a, b) => {
           const dateA = a.endDate || a.due || a.startDate || "";
           const dateB = b.endDate || b.due || b.startDate || "";
           return dateB.localeCompare(dateA);
        });
        resolved.add(sorted[0].id);
      } else {
        resolved.add(depId);
      }
    } else {
      resolved.add(depId);
    }
  }
  return Array.from(resolved);
}

const STATUSES = ["To Do", "In Progress", "In Review", "Done"];

interface KanbanBoardProps {
 tasks: Task[];
 onTaskUpdate?: (task: Task) => void;
 onEditTask?: (task: Task) => void;
 onDeleteTask?: (taskId: string) => void;
 onDoubleClickTask?: (task: Task) => void;
}

function SortableTaskItem({ task, allTasks, onProgressChange, onEdit, onDelete, onDoubleClickTask }: { task: Task, allTasks: Task[], onProgressChange: (id: string, p: number) => void, onEdit?: (t: Task) => void, onDelete?: (id: string) => void, onDoubleClickTask?: (t: Task) => void }) {
 const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: task.id });

 const style = {
 transform: CSS.Transform.toString(transform),
 transition,
 opacity: isDragging ? 0.5 : 1,
 };

 let typeColor = "bg-[#c4a7e7]/20 text-[#c4a7e7]";
 let borderColor = "border-[#c4a7e7]/30";
 if (task.type === 'Phase') {
 typeColor = "bg-[#c4a7e7]/20 text-[#c4a7e7]";
 borderColor = "border-[#c4a7e7]/50";
 } else if (task.type === 'Event') {
 typeColor = "bg-[#eb6f92]/20 text-[#eb6f92]";
 borderColor = "border-[#eb6f92]/50";
 } else {
 borderColor = isDragging ? 'border-[#c4a7e7]' : 'border-[#393552]';
 }

 const urgency = getUrgency(task);

 const isBlocked = resolveDependencies(task, allTasks).some(depId => {
 const depTask = allTasks.find(t => t.id === depId);
 return depTask && depTask.status !== 'Done';
 });

 return (
 <div
 ref={setNodeRef}
 style={style}
 {...attributes}
 {...listeners}
 onDoubleClick={(e) => { e.stopPropagation(); onDoubleClickTask?.(task); }}
 className={`p-4 rounded-lg bg-[#2a273f] border ${borderColor} hover:border-[#c4a7e7]/50 cursor-grab active:cursor-grabbing mb-3 relative overflow-hidden`}
 >
 <div className="flex justify-between items-start mb-2">
 <h4 className="font-medium text-[#e0def4] text-sm pr-2 leading-tight">{task.title}</h4>
 <div className="flex items-center gap-1">
 {isBlocked && (
 <span className="text-[10px] px-2 py-0.5 rounded-full font-bold flex-shrink-0 bg-[#eb6f92]/20 text-[#eb6f92]" title="Waiting on dependencies">
 Blocked
 </span>
 )}
 {task.type && task.type !== 'Task' && (
 <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold flex-shrink-0 ${typeColor}`}>
 {task.type}
 </span>
 )}
 <button 
 onPointerDown={(e) => { e.stopPropagation(); onEdit?.(task); }}
 className="text-[#908caa] hover:text-[#e0def4] p-1.5 rounded-md hover:bg-[#393552] transition-colors cursor-pointer"
 title="Edit Task"
 >
 <Edit2 size={12} />
 </button>
 <button 
 onPointerDown={(e) => { e.stopPropagation(); onDelete?.(task.id); }}
 className="text-[#eb6f92]/70 hover:text-[#eb6f92] p-1.5 rounded-md hover:bg-[#eb6f92]/10 transition-colors cursor-pointer"
 title="Delete Task"
 >
 <Trash2 size={12} />
 </button>
 </div>
 </div>
 
 <div className="flex items-center gap-2 text-xs mt-3 flex-wrap">
 <span className={`font-bold ${task.importance === 'High' ? 'text-[#eb6f92]' : task.importance === 'Low' ? 'text-[#908caa]' : 'text-[#f6c177]'}`}>
 {task.importance || 'Medium'} Imp.
 </span>
 <span className="text-[#6e6a86]">•</span>
 <span className={`font-bold ${urgency === 'High' ? 'text-[#eb6f92]' : urgency === 'Low' ? 'text-[#908caa]' : 'text-[#f6c177]'}`}>
 {urgency} Urg.
 </span>
 <span className="text-[#6e6a86]">•</span>
 <span className="text-[#c4a7e7] flex items-center gap-1">
 <Clock size={12} /> {task.endDate || task.due || 'No date'}
 </span>
 {(task.estimatedHours !== undefined || task.actualHours !== undefined) && (
 <>
 <span className="text-[#6e6a86]">•</span>
 <span className="text-[#c4a7e7] flex items-center gap-1 font-bold">
 ⏱️ {task.actualHours || 0} / {task.estimatedHours || 0}h
 </span>
 </>
 )}
 </div>

 {task.type !== 'Event' && task.progress !== undefined && (
 <div className="mt-4">
 <div className="flex justify-between text-[10px] text-[#908caa] mb-1 font-bold">
 <span>PROGRESS</span>
 <span>{Math.round(task.progress)}%</span>
 </div>
 <div className="h-1.5 w-full bg-[#232136] rounded-full overflow-hidden relative">
 <div className="h-full bg-[#c4a7e7] rounded-full pointer-events-none" style={{ width: `${Math.max(0, Math.min(100, task.progress))}%` }} />
 <input 
 type="range" 
 min="0" 
 max="100" 
 value={task.progress} 
 onPointerDown={(e) => e.stopPropagation()}
 onChange={(e) => onProgressChange(task.id, Number(e.target.value))}
 className="absolute inset-0 w-full opacity-0 cursor-ew-resize"
 />
 </div>
 </div>
 )}
 </div>
 );
}

function KanbanColumn({ status, tasks, allTasks, onProgressChange, onEditTask, onDeleteTask, onDoubleClickTask }: { status: string, tasks: Task[], allTasks: Task[], onProgressChange: (id: string, p: number) => void, onEditTask?: (task: Task) => void, onDeleteTask?: (taskId: string) => void, onDoubleClickTask?: (task: Task) => void }) {
 const { setNodeRef } = useDroppable({ id: status });

 return (
 <div className="flex-1 min-w-[280px] bg-[#232136] rounded-lg p-4 border border-[#393552]/50 flex flex-col">
 <div className="flex justify-between items-center mb-4">
 <h3 className="font-bold text-[#908caa] text-sm">{status}</h3>
 <span className="bg-[#393552] text-[#e0def4] text-xs font-bold px-2 py-1 rounded-md">{tasks.length}</span>
 </div>
 <div ref={setNodeRef} className="flex-1">
 <SortableContext id={status} items={tasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
 {tasks.map(task => (
 <SortableTaskItem 
 key={task.id} 
 task={task} 
 allTasks={allTasks} 
 onProgressChange={onProgressChange} 
 onEdit={onEditTask} 
 onDelete={onDeleteTask}
 onDoubleClickTask={onDoubleClickTask}
 />
 ))}
 {tasks.length === 0 && (
 <div className="h-24 rounded-lg border-2 border-dashed border-[#393552] flex items-center justify-center text-[#6e6a86] text-sm">
 Drop here
 </div>
 )}
 </SortableContext>
 </div>
 </div>
 );
}

export function KanbanBoard({ tasks, onTaskUpdate, onEditTask, onDeleteTask, onDoubleClickTask }: KanbanBoardProps) {
 const sensors = useSensors(
 useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
 useSensor(KeyboardSensor)
 );

 const handleDragEnd = (event: DragEndEvent) => {
 const { active, over } = event;
 if (!over) return;

 const activeId = active.id as string;
 const overId = over.id as string;

 const activeIndex = tasks.findIndex(t => t.id === activeId);
 if (activeIndex === -1) return;

 const activeTask = tasks[activeIndex];
 let newStatus = activeTask.status;

 if (STATUSES.includes(overId)) {
 newStatus = overId;
 } else {
 const overTaskIndex = tasks.findIndex(t => t.id === overId);
 if (overTaskIndex !== -1) {
 newStatus = tasks[overTaskIndex].status;
 }
 }

 if (newStatus !== activeTask.status && onTaskUpdate) {
 onTaskUpdate({ ...activeTask, status: newStatus });
 }
 };

 const handleProgressChange = (id: string, progress: number) => {
 const task = tasks.find(t => t.id === id);
 if (task && onTaskUpdate) {
 onTaskUpdate({ ...task, progress });
 }
 };

 return (
 <div className="flex gap-4 overflow-x-auto pb-4 h-full min-h-[500px]">
 <DndContext sensors={sensors} collisionDetection={closestCorners} onDragEnd={handleDragEnd}>
 {STATUSES.map(status => (
 <KanbanColumn 
 key={status} 
 status={status} 
 tasks={tasks.filter(t => t.status === status)} 
 allTasks={tasks}
 onProgressChange={handleProgressChange}
 onEditTask={onEditTask}
 onDeleteTask={onDeleteTask}
 onDoubleClickTask={onDoubleClickTask}
 />
 ))}
 </DndContext>
 </div>
 );
}
