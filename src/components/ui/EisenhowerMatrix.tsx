import React, { useMemo } from "react";
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
import { Task, getUrgency } from "./KanbanBoard";
import { Clock, AlertTriangle, ArrowRightCircle, Trash2, Calendar } from "lucide-react";

interface EisenhowerMatrixProps {
 tasks: Task[];
 onTaskUpdate: (task: Task) => void;
 onEditTask: (task: Task) => void;
 onDeleteTask?: (taskId: string) => void;
 onDoubleClickTask: (task: Task) => void;
}

type QuadrantId = 'Q1' | 'Q2' | 'Q3' | 'Q4';

export function EisenhowerMatrix({ tasks, onTaskUpdate, onEditTask, onDeleteTask, onDoubleClickTask }: EisenhowerMatrixProps) {
 const sensors = useSensors(
 useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
 useSensor(KeyboardSensor)
 );

 const quadrants = useMemo(() => {
 const q1: Task[] = []; // Urgent & Important
 const q2: Task[] = []; // Not Urgent & Important
 const q3: Task[] = []; // Urgent & Not Important
 const q4: Task[] = []; // Not Urgent & Not Important

 tasks.forEach(task => {
 const urgency = getUrgency(task);
 const importance = task.importance || 'Medium';

 const isUrgent = urgency === 'High' || urgency === 'Medium';
 const isImportant = importance === 'High' || importance === 'Medium';

 if (isUrgent && isImportant) q1.push(task);
 else if (!isUrgent && isImportant) q2.push(task);
 else if (isUrgent && !isImportant) q3.push(task);
 else q4.push(task);
 });

 return { Q1: q1, Q2: q2, Q3: q3, Q4: q4 };
 }, [tasks]);

 const handleDragEnd = (event: DragEndEvent) => {
 const { active, over } = event;
 if (!over) return;

 const taskId = active.id as string;
 const task = tasks.find(t => t.id === taskId);
 if (!task) return;

 const overId = over.id as string;
 let newUrgency = task.urgency;
 let newImportance = task.importance;

 // Check if dropped on a quadrant or a task within a quadrant
 let targetQuadrant: QuadrantId | null = null;
 if (['Q1', 'Q2', 'Q3', 'Q4'].includes(overId)) {
 targetQuadrant = overId as QuadrantId;
 } else {
 // Find which quadrant the task we dropped over belongs to
 for (const [qId, qTasks] of Object.entries(quadrants)) {
 if (qTasks.find(t => t.id === overId)) {
 targetQuadrant = qId as QuadrantId;
 break;
 }
 }
 }

 if (targetQuadrant) {
 if (targetQuadrant === 'Q1') {
 newUrgency = 'High';
 newImportance = 'High';
 } else if (targetQuadrant === 'Q2') {
 newUrgency = 'Low';
 newImportance = 'High';
 } else if (targetQuadrant === 'Q3') {
 newUrgency = 'High';
 newImportance = 'Low';
 } else if (targetQuadrant === 'Q4') {
 newUrgency = 'Low';
 newImportance = 'Low';
 }

 if (newUrgency !== task.urgency || newImportance !== task.importance) {
 onTaskUpdate({ ...task, urgency: newUrgency, importance: newImportance });
 }
 }
 };

 return (
 <DndContext sensors={sensors} collisionDetection={closestCorners} onDragEnd={handleDragEnd}>
 <div className="grid grid-cols-2 grid-rows-2 gap-4 h-full min-h-[600px] p-2">
 <Quadrant 
 id="Q1" 
 title="Do First" 
 subtitle="Urgent & Important" 
 tasks={quadrants.Q1} 
 icon={<AlertTriangle size={18} className="text-[#eb6f92]" />} 
 onDoubleClickTask={onDoubleClickTask}
 onDeleteTask={onDeleteTask}
 borderColor="border-[#eb6f92]/40"
 bgColor="bg-[#eb6f92]/5"
 />
 <Quadrant 
 id="Q2" 
 title="Schedule (Q2)" 
 subtitle="Not Urgent, but Important" 
 tasks={quadrants.Q2} 
 icon={<Calendar className="text-[#3e8fb0]" size={18} />} 
 onDoubleClickTask={onDoubleClickTask}
 onDeleteTask={onDeleteTask}
 borderColor="border-[#3e8fb0]/40"
 bgColor="bg-[#3e8fb0]/5"
 />
 <Quadrant 
 id="Q3" 
 title="Delegate (Q3)" 
 subtitle="Urgent, but Not Important" 
 tasks={quadrants.Q3} 
 icon={<ArrowRightCircle className="text-[#f6c177]" size={18} />} 
 onDoubleClickTask={onDoubleClickTask}
 onDeleteTask={onDeleteTask}
 borderColor="border-[#f6c177]/40"
 bgColor="bg-[#f6c177]/5"
 />
 <Quadrant 
 id="Q4" 
 title="Eliminate (Q4)" 
 subtitle="Not Urgent, Not Important" 
 tasks={quadrants.Q4} 
 icon={<Trash2 className="text-[#908caa]" size={18} />} 
 onDoubleClickTask={onDoubleClickTask}
 onDeleteTask={onDeleteTask}
 borderColor="border-[#6e6a86]/40"
 bgColor="bg-[#2a273f]/30"
 />
 </div>
 </DndContext>
 );
}

interface QuadrantProps {
 id: QuadrantId;
 title: string;
 subtitle: string;
 tasks: Task[];
 icon: React.ReactNode;
 onDoubleClickTask: (task: Task) => void;
 onDeleteTask?: (taskId: string) => void;
 borderColor: string;
 bgColor: string;
}

function Quadrant({ id, title, subtitle, tasks, icon, onDoubleClickTask, onDeleteTask, borderColor, bgColor }: QuadrantProps) {
 const { setNodeRef } = useDroppable({ id });

 return (
 <div 
 ref={setNodeRef} 
 className={`rounded-lg border-2 ${borderColor} ${bgColor} flex flex-col overflow-hidden shadow-lg transition-colors`}
 >
 <div className={`p-4 border-b ${borderColor} flex items-center justify-between bg-[#232136]/50`}>
 <div>
 <h3 className="font-bold text-lg text-[#e0def4] flex items-center gap-2">
 {icon} {title}
 </h3>
 <p className="text-xs text-[#908caa] mt-0.5">{subtitle}</p>
 </div>
 <span className="text-xs font-bold text-[#908caa] bg-[#232136] px-2 py-1 rounded-md border border-[#393552]">
 {tasks.length}
 </span>
 </div>
 
 <div className="flex-1 p-4 overflow-y-auto min-h-[150px]">
 <SortableContext items={tasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
 <div className="space-y-3">
 {tasks.map(task => (
 <MatrixTaskCard key={task.id} task={task} onDoubleClick={() => onDoubleClickTask(task)} onDeleteTask={onDeleteTask} />
 ))}
 </div>
 </SortableContext>
 {tasks.length === 0 && (
 <div className="h-full w-full flex items-center justify-center text-[#908caa] text-sm opacity-50 italic border-2 border-dashed border-[#393552] rounded-lg">
 Drop tasks here
 </div>
 )}
 </div>
 </div>
 );
}

function MatrixTaskCard({ task, onDoubleClick, onDeleteTask }: { task: Task, onDoubleClick: () => void, onDeleteTask?: (taskId: string) => void }) {
 const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: task.id });

 const style = {
 transform: CSS.Transform.toString(transform),
 transition,
 opacity: isDragging ? 0.4 : 1,
 };

 return (
 <div
 ref={setNodeRef}
 style={style}
 {...attributes}
 {...listeners}
 onDoubleClick={(e) => { e.stopPropagation(); onDoubleClick(); }}
 className={`glass-panel p-3 rounded-lg border border-[#393552] cursor-grab active:cursor-grabbing hover:border-[#c4a7e7]/50 transition-colors ${task.status === 'Done' ? 'opacity-50' : ''}`}
 >
 <div className="flex items-center gap-2 mb-1 justify-between">
 <h4 className="font-bold text-sm text-[#e0def4] truncate">{task.title}</h4>
 <button 
      onPointerDown={(e) => { e.stopPropagation(); onDeleteTask?.(task.id); }}
      className="text-[#eb6f92]/70 hover:text-[#eb6f92] p-1 rounded hover:bg-[#eb6f92]/10 transition-colors"
      title="Delete Task"
    >
      <Trash2 size={12} />
    </button>
 </div>
 <div className="flex items-center gap-3 text-[10px] font-bold text-[#908caa]">
 {task.type === 'Phase' && <span className="bg-[#c4a7e7]/20 text-[#c4a7e7] px-1.5 py-0.5 rounded uppercase">Phase</span>}
 <span className={`px-1.5 py-0.5 rounded ${task.status === 'Done' ? 'bg-[#c4a7e7]/20 text-[#c4a7e7]' : 'bg-[#393552]/50 text-[#e0def4]'}`}>
 {task.status}
 </span>
 {task.endDate && (
 <span className="flex items-center gap-1">
 <Clock size={10} /> {task.endDate}
 </span>
 )}
 </div>
 </div>
 );
}
