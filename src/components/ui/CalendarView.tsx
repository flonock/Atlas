"use client";

import React, { useState } from 'react';
import { Task } from './KanbanBoard';
import { 
 addMonths, subMonths, format, startOfMonth, endOfMonth, 
 startOfWeek, endOfWeek, eachDayOfInterval, isSameMonth, 
 isSameDay, parseISO, differenceInDays, addDays, startOfDay
} from 'date-fns';
import { ChevronLeft, ChevronRight, Clock } from 'lucide-react';
import { DndContext, useDraggable, useDroppable, DragEndEvent, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';

interface CalendarViewProps {
 tasks: Task[];
 onTaskUpdate: (task: Task) => void;
 onEditTask?: (task: Task) => void;
}

function DraggableTask({ task, date, onEditTask }: { task: Task, date: Date, onEditTask?: (task: Task) => void }) {
 const dateStr = format(date, 'yyyy-MM-dd');
 const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
 id: `task-${task.id}-${dateStr}`,
 data: {
 task,
 sourceDate: date
 }
 });

 const style = {
 transform: CSS.Translate.toString(transform),
 opacity: isDragging ? 0.5 : 1,
 };

 const isStart = task.startDate ? isSameDay(parseISO(task.startDate), date) : isSameDay(parseISO(task.due), date);
 const isEnd = task.endDate ? isSameDay(parseISO(task.endDate), date) : isSameDay(parseISO(task.due), date);

 let roundedClass = "";
 if (isStart && isEnd) roundedClass = "rounded-lg";
 else if (isStart) roundedClass = "rounded-l-lg rounded-r-none border-r-0";
 else if (isEnd) roundedClass = "rounded-r-lg rounded-l-none border-l-0";
 else roundedClass = "rounded-none border-x-0";

 let bgColor = "bg-[#393552]";
 let textColor = "text-[#e0def4]";
 
 if (task.type === 'Phase') {
 bgColor = "bg-[#c4a7e7]/20";
 textColor = "text-[#c4a7e7]";
 } else if (task.type === 'Milestone') {
 bgColor = "bg-[#f6c177]/20";
 textColor = "text-[#f6c177]";
 } else if (task.type === 'Event') {
 bgColor = "bg-[#eb6f92]/20";
 textColor = "text-[#eb6f92]";
 }

 return (
 <div 
 ref={setNodeRef} 
 style={style} 
 {...attributes} 
 {...listeners}
 onDoubleClick={(e) => { e.stopPropagation(); onEditTask?.(task); }}
 className={`text-xs px-2 py-1 mb-1 truncate cursor-grab active:cursor-grabbing border border-[#6e6a86]/30 hover:border-[#c4a7e7] transition-colors ${roundedClass} ${bgColor} ${textColor} relative z-10`}
 title={`${task.title} (${task.status})`}
 >
 {isStart ? task.title : '\u00A0'}
 </div>
 );
}

function DayCell({ date, currentMonth, tasks, onEditTask }: { date: Date, currentMonth: Date, tasks: Task[], onEditTask?: (task: Task) => void }) {
 const dateStr = format(date, 'yyyy-MM-dd');
 const { setNodeRef, isOver } = useDroppable({
 id: `day-${dateStr}`,
 data: { date }
 });

 const isCurrentMonth = isSameMonth(date, currentMonth);
 const isToday = isSameDay(date, new Date());

 return (
 <div 
 ref={setNodeRef}
 className={`min-h-[120px] p-2 border-r border-b border-[#393552] transition-colors
 ${isCurrentMonth ? 'bg-[#232136]' : 'bg-[#232136]/50'}
 ${isOver ? 'bg-[#c4a7e7]/10' : ''}
 `}
 >
 <div className="flex justify-between items-start mb-2">
 <span className={`text-sm font-bold w-7 h-7 flex items-center justify-center rounded-full
 ${isToday ? 'bg-[#eb6f92] text-[#232136]' : (isCurrentMonth ? 'text-[#e0def4]' : 'text-[#6e6a86]')}
 `}>
 {format(date, 'd')}
 </span>
 </div>
 <div className="flex flex-col gap-0.5">
 {tasks.map(task => (
 <DraggableTask key={`${task.id}-${dateStr}`} task={task} date={date} onEditTask={onEditTask} />
 ))}
 </div>
 </div>
 );
}

export function CalendarView({ tasks, onTaskUpdate, onEditTask }: CalendarViewProps) {
 const [currentDate, setCurrentDate] = useState(new Date());

 const sensors = useSensors(
 useSensor(PointerSensor, {
 activationConstraint: {
 distance: 5,
 },
 })
 );

 const handleDragEnd = (event: DragEndEvent) => {
 const { active, over } = event;
 if (!over) return;

 const activeData = active.data.current;
 const overData = over.data.current;

 if (activeData && overData) {
 const task = activeData.task as Task;
 const sourceDate = activeData.sourceDate as Date;
 const targetDate = overData.date as Date;

 const daysOffset = differenceInDays(startOfDay(targetDate), startOfDay(sourceDate));

 if (daysOffset !== 0) {
 const updatedTask = { ...task };
 
 if (task.startDate) {
 updatedTask.startDate = format(addDays(parseISO(task.startDate), daysOffset), 'yyyy-MM-dd');
 }
 
 if (task.endDate) {
 updatedTask.endDate = format(addDays(parseISO(task.endDate), daysOffset), 'yyyy-MM-dd');
 }
 
 if (task.due && !task.endDate) {
 updatedTask.due = format(addDays(parseISO(task.due), daysOffset), 'yyyy-MM-dd');
 }

 onTaskUpdate(updatedTask);
 }
 }
 };

 const monthStart = startOfMonth(currentDate);
 const monthEnd = endOfMonth(monthStart);
 const startDate = startOfWeek(monthStart, { weekStartsOn: 1 }); // Monday start
 const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 });
 const dateFormat = "MMMM yyyy";
 const days = eachDayOfInterval({ start: startDate, end: endDate });

 const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

 return (
 <div className="h-full flex flex-col bg-[#2a273f] rounded-lg border border-[#393552] overflow-hidden">
 <div className="flex items-center justify-between p-4 border-b border-[#393552] bg-[#232136]">
 <div className="flex items-center gap-4">
 <Clock className="text-[#c4a7e7]" size={24} />
 <h2 className="text-2xl font-bold text-[#e0def4]">{format(currentDate, dateFormat)}</h2>
 </div>
 <div className="flex items-center gap-2">
 <button 
 onClick={() => setCurrentDate(new Date())}
 className="px-4 py-2 text-sm font-bold text-[#908caa] hover:text-[#e0def4] bg-[#2a273f] rounded-lg border border-[#393552] transition-colors"
 >
 Today
 </button>
 <div className="flex rounded-lg border border-[#393552] overflow-hidden">
 <button onClick={() => setCurrentDate(subMonths(currentDate, 1))} className="p-2 bg-[#2a273f] text-[#908caa] hover:text-[#e0def4] hover:bg-[#393552] transition-colors">
 <ChevronLeft size={20} />
 </button>
 <button onClick={() => setCurrentDate(addMonths(currentDate, 1))} className="p-2 bg-[#2a273f] text-[#908caa] hover:text-[#e0def4] hover:bg-[#393552] border-l border-[#393552] transition-colors">
 <ChevronRight size={20} />
 </button>
 </div>
 </div>
 </div>

 <div className="grid grid-cols-7 border-b border-[#393552] bg-[#232136]">
 {weekDays.map(day => (
 <div key={day} className="p-3 text-center text-xs font-bold text-[#908caa] ">
 {day}
 </div>
 ))}
 </div>

 <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
 <div className="flex-1 overflow-y-auto">
 <div className="grid grid-cols-7 border-l border-t border-[#393552]">
 {days.map((day) => {
 // Find tasks active on this day
 const activeTasks = tasks.filter(t => {
 const tStartStr = t.startDate || t.due;
 const tEndStr = t.endDate || t.due;
 if (!tStartStr || !tEndStr) return false;
 
 try {
 const s = startOfDay(parseISO(tStartStr));
 const e = startOfDay(parseISO(tEndStr));
 const current = startOfDay(day);
 
 // Handle case where start is after end (invalid data)
 if (s > e) return false;
 
 return current >= s && current <= e;
 } catch {
 return false;
 }
 });

 return (
 <DayCell 
 key={day.toString()} 
 date={day} 
 currentMonth={currentDate} 
 tasks={activeTasks}
 onEditTask={onEditTask}
 />
 );
 })}
 </div>
 </div>
 </DndContext>
 </div>
 );
}
