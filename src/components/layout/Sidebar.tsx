"use client";

import Link from "next/link";
import { usePathname, useParams, useSearchParams, useRouter } from "next/navigation";
import { useEffect } from "react";
import { motion } from "framer-motion";
import { LayoutDashboard, Activity, FileText, Settings, Rocket, ArrowLeft, StickyNote, FolderTree, MessageSquare } from "lucide-react";
import { cn } from "@/lib/utils";

export function Sidebar() {
 const pathname = usePathname();
 const params = useParams();
 const id = params.id as string;
 const router = useRouter();

 const searchParams = useSearchParams();
 const queryString = searchParams.toString();
 const suffix = queryString ? `?${queryString}` : '';

 const navItems = [
 { name: "Dashboard", href: `/project/${id}/dashboard`, icon: LayoutDashboard },
 { name: "Resources", href: `/project/${id}/resources`, icon: FolderTree },
 { name: "Data Analysis", href: `/project/${id}/analysis`, icon: Activity },
 { name: "Reports", href: `/project/${id}/reports`, icon: FileText },
 { name: "Notes", href: `/project/${id}/notes`, icon: StickyNote },
 { name: "Team Chat", href: `/project/${id}/chat`, icon: MessageSquare },
 ];

 useEffect(() => {
 const handleKeyDown = (e: KeyboardEvent) => {
 if ((e.metaKey || e.ctrlKey) && e.shiftKey) {
 switch (e.key) {
 case '1':
 e.preventDefault();
 router.push(`/project/${id}/dashboard${suffix}`);
 break;
 case '2':
 e.preventDefault();
 router.push(`/project/${id}/notes${suffix}`);
 break;
 case '3':
 e.preventDefault();
 router.push(`/project/${id}/reports${suffix}`);
 break;
 case '4':
 e.preventDefault();
 router.push(`/project/${id}/analysis${suffix}`);
 break;
 case '5':
 e.preventDefault();
 router.push(`/project/${id}/chat${suffix}`);
 break;
 }
 }
 };
 window.addEventListener('keydown', handleKeyDown);
 return () => window.removeEventListener('keydown', handleKeyDown);
 }, [id, suffix, router]);

 return (
 <aside className="w-64 h-screen border-r border-[#393552] bg-[#2a273f]/80 backdrop-blur-xl flex flex-col fixed left-0 top-0">
 <div className="p-6 flex flex-col gap-4">
 <Link href="/" className="flex items-center gap-2 text-[#908caa] hover:text-[#e0def4] text-sm transition-colors w-fit">
 <ArrowLeft size={16} /> Back to Hub
 </Link>
 <div className="flex items-center gap-3">
 <div className="p-2 bg-[#ea9a97]/20 rounded-xl text-[#ea9a97]">
 <Rocket size={24} />
 </div>
 <h1 className="text-xl font-bold tracking-wider text-[#e0def4]">Project</h1>
 </div>
 </div>

 <nav className="flex-1 px-4 py-2 space-y-2">
 {navItems.map((item) => {
 const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
 
 return (
 <Link key={item.name} href={`${item.href}${suffix}`}>
 <motion.div
 whileHover={{ x: 4, backgroundColor: "rgba(57, 53, 82, 0.8)" }}
 whileTap={{ scale: 0.98 }}
 className={cn(
 "flex items-center gap-3 px-4 py-3 rounded-xl transition-colors relative overflow-hidden",
 isActive ? "text-[#e0def4]" : "text-[#908caa] hover:text-[#e0def4]"
 )}
 >
 {isActive && (
 <motion.div
 layoutId="activeTab"
 className="absolute inset-0 bg-[#393552] rounded-xl z-0"
 initial={false}
 transition={{ type: "spring", stiffness: 300, damping: 30 }}
 />
 )}
 <div className="relative z-10 flex items-center gap-3">
 <item.icon size={20} className={isActive ? "text-[#ea9a97]" : ""} />
 <span className="font-medium">{item.name}</span>
 </div>
 </motion.div>
 </Link>
 );
 })}
 </nav>

 <div className="p-4 border-t border-[#393552]">
 <button className="flex items-center gap-3 px-4 py-3 text-[#908caa] hover:text-[#e0def4] transition-colors rounded-xl hover:bg-[#393552]/50 w-full">
 <Settings size={20} />
 <span className="font-medium">Settings</span>
 </button>
 </div>
 </aside>
 );
}
