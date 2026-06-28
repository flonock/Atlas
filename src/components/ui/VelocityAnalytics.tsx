import React, { useMemo } from 'react';
import { Task } from './KanbanBoard';
import { Clock, Activity, TrendingUp, TrendingDown, Target, AlertTriangle } from 'lucide-react';
import { motion } from 'framer-motion';

export function VelocityAnalytics({ tasks }: { tasks: Task[] }) {
 const analytics = useMemo(() => {
 let totalEstimated = 0;
 let totalActual = 0;
 let completedEstimated = 0;
 let completedActual = 0;
 let trackedTasksCount = 0;
 
 const byStatus = {
 "To Do": { estimated: 0, actual: 0, count: 0 },
 "In Progress": { estimated: 0, actual: 0, count: 0 },
 "In Review": { estimated: 0, actual: 0, count: 0 },
 "Done": { estimated: 0, actual: 0, count: 0 }
 };

 tasks.forEach(task => {
 const hasTime = task.estimatedHours || task.actualHours;
 if (hasTime) trackedTasksCount++;
 
 const est = task.estimatedHours || 0;
 const act = task.actualHours || 0;
 
 totalEstimated += est;
 totalActual += act;

 if (task.status === 'Done') {
 completedEstimated += est;
 completedActual += act;
 }

 if (byStatus[task.status as keyof typeof byStatus]) {
 byStatus[task.status as keyof typeof byStatus].estimated += est;
 byStatus[task.status as keyof typeof byStatus].actual += act;
 byStatus[task.status as keyof typeof byStatus].count++;
 }
 });

 const completionRate = totalEstimated > 0 ? (completedEstimated / totalEstimated) * 100 : 0;
 
 // Accuracy = estimated / actual (for completed tasks). If > 1, overestimated. If < 1, underestimated.
 let accuracyRatio = 1;
 if (completedActual > 0) {
 accuracyRatio = completedEstimated / completedActual;
 }

 return {
 totalEstimated,
 totalActual,
 completedEstimated,
 completedActual,
 completionRate,
 accuracyRatio,
 byStatus,
 trackedTasksCount
 };
 }, [tasks]);

 if (tasks.length === 0 || analytics.trackedTasksCount === 0) {
 return (
 <div className="glass-panel p-8 rounded-lg flex flex-col items-center justify-center h-full min-h-[400px] text-[#908caa]">
 <Activity size={48} className="mb-4 opacity-50" />
 <h3 className="text-xl font-bold text-[#e0def4] mb-2">No Time Data Available</h3>
 <p className="max-w-md text-center">
 Edit your tasks to add <strong>Estimated Hours</strong> or <strong>Actual Hours</strong> to see velocity analytics and workload tracking.
 </p>
 </div>
 );
 }

 const accuracyPercent = Math.abs(1 - analytics.accuracyRatio) * 100;
 const isOverestimating = analytics.accuracyRatio > 1;

 return (
 <div className="glass-panel p-6 rounded-lg h-full min-h-[500px] overflow-y-auto">
 <div className="flex items-center gap-3 mb-6">
 <Activity className="text-[#c4a7e7]" size={24} />
 <h2 className="text-xl font-bold text-[#e0def4]">Velocity & Workload</h2>
 </div>

 <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
 <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-[#2a273f]/50 border border-[#393552] rounded-lg p-5">
 <div className="flex items-center gap-2 text-[#908caa] mb-2 font-bold text-sm">
 <Target size={16} /> TOTAL ESTIMATED
 </div>
 <div className="text-3xl font-bold text-[#e0def4]">{analytics.totalEstimated} <span className="text-lg text-[#6e6a86]">hrs</span></div>
 <div className="text-xs text-[#6e6a86] mt-2">Across {analytics.trackedTasksCount} tracked tasks</div>
 </motion.div>
 
 <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-[#2a273f]/50 border border-[#393552] rounded-lg p-5">
 <div className="flex items-center gap-2 text-[#908caa] mb-2 font-bold text-sm">
 <Clock size={16} /> TOTAL ACTUAL
 </div>
 <div className="text-3xl font-bold text-[#e0def4]">{analytics.totalActual} <span className="text-lg text-[#6e6a86]">hrs</span></div>
 <div className="text-xs text-[#6e6a86] mt-2">
 {analytics.totalActual > analytics.totalEstimated && <span className="text-[#eb6f92] font-bold">Exceeded estimate by {analytics.totalActual - analytics.totalEstimated}h</span>}
 {analytics.totalActual <= analytics.totalEstimated && <span className="text-[#c4a7e7] font-bold">Within budget</span>}
 </div>
 </motion.div>

 <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="bg-[#2a273f]/50 border border-[#393552] rounded-lg p-5">
 <div className="flex items-center gap-2 text-[#908caa] mb-2 font-bold text-sm">
 {isOverestimating ? <TrendingDown size={16} className="text-[#c4a7e7]"/> : <TrendingUp size={16} className="text-[#eb6f92]"/>} 
 ESTIMATION ACCURACY
 </div>
 <div className="text-3xl font-bold text-[#e0def4]">
 {analytics.completedActual === 0 ? "N/A" : `${accuracyPercent.toFixed(1)}%`}
 </div>
 <div className="text-xs text-[#6e6a86] mt-2">
 {analytics.completedActual === 0 ? "Complete some tasks to calculate" : (
 isOverestimating 
 ? `You overestimate tasks by ~${accuracyPercent.toFixed(1)}%` 
 : `You underestimate tasks by ~${accuracyPercent.toFixed(1)}%`
 )}
 </div>
 </motion.div>
 </div>

 <h3 className="text-lg font-bold text-[#e0def4] mb-4">Hours by Status</h3>
 <div className="space-y-4">
 {Object.entries(analytics.byStatus).map(([status, data], i) => {
 if (data.count === 0) return null;
 
 // Max bar width reference
 const maxHours = Math.max(analytics.totalEstimated, analytics.totalActual, 1);
 const estWidth = `${(data.estimated / maxHours) * 100}%`;
 const actWidth = `${(data.actual / maxHours) * 100}%`;

 return (
 <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.4 + (i * 0.1) }} key={status} className="bg-[#2a273f]/30 border border-[#393552]/50 rounded-lg p-4">
 <div className="flex justify-between items-center mb-3">
 <span className="font-bold text-[#e0def4] text-sm ">{status} ({data.count} tasks)</span>
 </div>
 
 <div className="space-y-3">
 <div>
 <div className="flex justify-between text-xs text-[#908caa] mb-1">
 <span>Estimated</span>
 <span className="font-bold text-[#c4a7e7]">{data.estimated}h</span>
 </div>
 <div className="h-2 bg-[#232136] rounded-full overflow-hidden">
 <div className="h-full bg-[#c4a7e7] rounded-full" style={{ width: estWidth }} />
 </div>
 </div>

 <div>
 <div className="flex justify-between text-xs text-[#908caa] mb-1">
 <span>Actual</span>
 <span className="font-bold text-[#c4a7e7]">{data.actual}h</span>
 </div>
 <div className="h-2 bg-[#232136] rounded-full overflow-hidden">
 <div className="h-full bg-[#c4a7e7] rounded-full" style={{ width: actWidth }} />
 </div>
 </div>
 </div>
 
 {data.actual > data.estimated && data.estimated > 0 && (
 <div className="mt-3 flex items-center gap-1 text-[10px] text-[#eb6f92] font-bold bg-[#eb6f92]/10 w-fit px-2 py-1 rounded">
 <AlertTriangle size={10} /> OVER BUDGET
 </div>
 )}
 </motion.div>
 );
 })}
 </div>
 </div>
 );
}
