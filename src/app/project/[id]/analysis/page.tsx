"use client";

import { motion } from "framer-motion";
import { ExternalLink, RefreshCw } from "lucide-react";
import { useState } from "react";

export default function DataAnalysis() {
 const [frameKey, setFrameKey] = useState(0);

 return (
 <div className="h-full flex flex-col space-y-4">
 <motion.div
 initial={{ opacity: 0, y: 20 }}
 animate={{ opacity: 1, y: 0 }}
 className="flex items-center justify-between"
 >
 <div>
 <h1 className="text-3xl font-bold tracking-tight text-[#e0def4]">Data Analysis</h1>
 <p className="text-[#908caa] mt-1">Scientific Plotter Pro Integration</p>
 </div>
 <div className="flex gap-3">
 <button 
 onClick={() => setFrameKey(k => k + 1)}
 className="flex items-center gap-2 bg-[#2a273f] text-[#e0def4] px-4 py-2 rounded-xl font-medium border border-[#393552] hover:bg-[#393552] transition-colors"
 >
 <RefreshCw size={18} />
 <span>Reload Engine</span>
 </button>
 <a
 href="http://localhost:8505"
 target="_blank"
 rel="noreferrer"
 className="flex items-center gap-2 bg-[#3e8fb0] text-[#232136] px-4 py-2 rounded-xl font-bold hover:bg-[#2c6e88] transition-colors"
 >
 <ExternalLink size={18} />
 <span>Open in Browser</span>
 </a>
 </div>
 </motion.div>

 <motion.div
 initial={{ opacity: 0, scale: 0.98 }}
 animate={{ opacity: 1, scale: 1 }}
 transition={{ delay: 0.2 }}
 className="flex-1 glass-panel rounded-2xl overflow-hidden border border-[#393552] relative"
 >
 <iframe
 key={frameKey}
 src="http://localhost:8505"
 className="w-full h-full border-none"
 title="Scientific Plotter"
 />
 </motion.div>
 </div>
 );
}
