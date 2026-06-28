import { Sidebar } from "@/components/layout/Sidebar";
import { CommandPalette } from "@/components/ui/CommandPalette";

export default function ProjectLayout({
 children,
}: Readonly<{
 children: React.ReactNode;
}>) {
 return (
 <div className="flex h-screen overflow-hidden">
 <Sidebar />
 <main className="flex-1 ml-64 p-8 h-full overflow-hidden flex flex-col">
 <CommandPalette />
 {children}
 </main>
 </div>
 );
}
