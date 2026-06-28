"use client";

import { motion } from "framer-motion";
import { Folder, Plus, ArrowRight, Rocket } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

type Project = { id: string; name: string; path: string };

export default function Hub() {
 const router = useRouter();
 const [projects, setProjects] = useState<Project[]>([]);

 useEffect(() => {
 // eslint-disable-next-line @typescript-eslint/no-explicit-any
 if (typeof window !== "undefined" && (window as any).require) {
 // eslint-disable-next-line @typescript-eslint/no-explicit-any
 const { ipcRenderer } = (window as any).require("electron");
 ipcRenderer.invoke('get-projects').then(setProjects);
 }
 }, []);

 const handleAddProject = async () => {
 // eslint-disable-next-line @typescript-eslint/no-explicit-any
 if (typeof window !== "undefined" && (window as any).require) {
 // eslint-disable-next-line @typescript-eslint/no-explicit-any
 const { ipcRenderer } = (window as any).require("electron");
 const folderPath = await ipcRenderer.invoke('select-folder');
 if (folderPath) {
 // Auto-name project based on folder name since prompt() isn't supported in Electron
 const name = folderPath.split('/').pop() || 'Unnamed Project';
 const newProject = { id: Date.now().toString(), name, path: folderPath };
 const updated = await ipcRenderer.invoke('add-project', newProject);
 setProjects(updated);
 }
 } else {
 alert("Folder selection requires running in Electron mode.");
 }
 };

 return (
 <div className="flex items-center justify-center min-h-[80vh]">
 <div className="w-full max-w-4xl">
 <motion.div
 initial={{ opacity: 0, y: -20 }}
 animate={{ opacity: 1, y: 0 }}
 className="text-center mb-12"
 >
 <div className="inline-block p-4 bg-[#ea9a97]/20 rounded-2xl text-[#ea9a97] mb-6">
 <Rocket size={48} />
 </div>
 <h1 className="text-4xl font-bold tracking-tight text-[#e0def4] mb-2">Welcome to Atlas</h1>
 <p className="text-[#908caa] text-lg">Select a local engineering project to get started</p>
 </motion.div>

 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
 {projects.map((proj, idx) => (
 <motion.div
 key={proj.id}
 initial={{ opacity: 0, scale: 0.95 }}
 animate={{ opacity: 1, scale: 1 }}
 transition={{ delay: idx * 0.1 }}
 onClick={() => router.push(`/project/${proj.id}/dashboard?path=${encodeURIComponent(proj.path)}&name=${encodeURIComponent(proj.name)}`)}
 className="glass-panel p-6 rounded-2xl cursor-pointer group hover-gradient-border transition-colors"
 >
 <div className="flex items-start justify-between mb-4">
 <div className="p-3 bg-[#393552] rounded-xl text-[#c4a7e7] group-hover:bg-[#c4a7e7] group-hover:text-[#232136] transition-colors">
 <Folder size={24} />
 </div>
 <ArrowRight className="text-[#6e6a86] group-hover:text-[#e0def4] transition-colors" size={20} />
 </div>
 <h3 className="font-bold text-xl text-[#e0def4] mb-1 truncate">{proj.name}</h3>
 <p className="text-sm text-[#908caa] truncate" title={proj.path}>{proj.path}</p>
 </motion.div>
 ))}

 <motion.div
 initial={{ opacity: 0, scale: 0.95 }}
 animate={{ opacity: 1, scale: 1 }}
 transition={{ delay: projects.length * 0.1 }}
 onClick={handleAddProject}
 className="p-6 rounded-2xl border-2 border-dashed border-[#393552] hover:border-[#ea9a97] hover:bg-[#ea9a97]/5 transition-colors cursor-pointer flex flex-col items-center justify-center text-center min-h-[160px] group"
 >
 <div className="p-3 bg-[#393552] rounded-full text-[#908caa] group-hover:bg-[#ea9a97] group-hover:text-[#232136] transition-colors mb-3">
 <Plus size={24} />
 </div>
 <h3 className="font-bold text-[#e0def4]">Add Project</h3>
 <p className="text-sm text-[#908caa] mt-1">Bind a local folder</p>
 </motion.div>
 </div>
 </div>
 </div>
 );
}
