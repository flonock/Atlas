"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { MessageSquare, Save, ExternalLink, RefreshCw } from "lucide-react";
import { useParams, useSearchParams } from "next/navigation";

export default function ChatPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const projectId = params.id as string;
  const projectPath = searchParams.get('path');
  const [mattermostUrl, setMattermostUrl] = useState("");
  const [isSaved, setIsSaved] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (typeof window !== "undefined" && (window as any).require && projectPath) {
      const { ipcRenderer } = (window as any).require("electron");
      ipcRenderer.invoke('get-project-mattermost', projectPath).then((url: string) => {
        if (url) {
          setMattermostUrl(url);
          setIsSaved(true);
        }
        setIsLoading(false);
      }).catch(() => {
        setIsLoading(false);
      });
    } else {
      setIsLoading(false);
    }
  }, [projectPath]);

  const handleSave = async () => {
    let urlToSave = mattermostUrl.trim();
    if (urlToSave && !urlToSave.startsWith('http')) {
      urlToSave = `https://${urlToSave}`;
    }
    setMattermostUrl(urlToSave);
    
    if (typeof window !== "undefined" && (window as any).require && projectPath) {
      const { ipcRenderer } = (window as any).require("electron");
      await ipcRenderer.invoke('save-project-mattermost', projectPath, urlToSave);
    }
    setIsSaved(true);
  };

  const handleClear = async () => {
    if (typeof window !== "undefined" && (window as any).require && projectPath) {
      const { ipcRenderer } = (window as any).require("electron");
      await ipcRenderer.invoke('save-project-mattermost', projectPath, "");
    }
    setMattermostUrl("");
    setIsSaved(false);
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <RefreshCw className="animate-spin text-[#908caa]" size={32} />
      </div>
    );
  }

  if (!isSaved) {
    return (
      <div className="flex-1 flex flex-col p-8 overflow-y-auto">
        <div className="max-w-2xl mx-auto w-full mt-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-panel p-8 rounded-2xl border border-[#393552]"
          >
            <div className="flex items-center gap-4 mb-6">
              <div className="p-3 bg-[#ea9a97]/20 rounded-xl text-[#ea9a97]">
                <MessageSquare size={32} />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-[#e0def4]">Integrate Mattermost</h1>
                <p className="text-[#908caa]">Connect your team's Mattermost workspace to this project</p>
              </div>
            </div>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-[#e0def4] mb-2">
                  Mattermost Workspace URL
                </label>
                <div className="flex gap-3">
                  <input
                    type="text"
                    placeholder="https://chat.yourcompany.com"
                    value={mattermostUrl}
                    onChange={(e) => setMattermostUrl(e.target.value)}
                    className="flex-1 bg-[#2a273f] border border-[#393552] rounded-xl px-4 py-3 text-[#e0def4] focus:outline-none focus:border-[#ea9a97] transition-colors"
                  />
                  <button
                    onClick={handleSave}
                    disabled={!mattermostUrl.trim()}
                    className="bg-[#ea9a97] hover:bg-[#ea9a97]/90 text-[#232136] px-6 py-3 rounded-xl font-medium transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Save size={20} />
                    Connect
                  </button>
                </div>
                <p className="text-xs text-[#6e6a86] mt-2">
                  Enter the root URL of your Mattermost instance. It will be embedded directly in this view.
                </p>
              </div>

              <div className="p-4 bg-[#393552]/30 rounded-xl border border-[#393552]">
                <h3 className="text-sm font-semibold text-[#e0def4] mb-2">Why integrate Mattermost?</h3>
                <ul className="text-sm text-[#908caa] space-y-2 list-disc list-inside">
                  <li>Discuss project details without switching contexts</li>
                  <li>Share files and resources directly from the dashboard</li>
                  <li>Keep communication contextualized per project</li>
                </ul>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-screen overflow-hidden bg-white">
      <div className="h-14 bg-[#2a273f] border-b border-[#393552] flex items-center justify-between px-6 shrink-0">
        <div className="flex items-center gap-3">
          <MessageSquare size={18} className="text-[#ea9a97]" />
          <span className="text-[#e0def4] font-medium">Team Chat (Mattermost)</span>
        </div>
        <div className="flex items-center gap-3">
          <a 
            href={mattermostUrl} 
            target="_blank" 
            rel="noreferrer"
            className="text-[#908caa] hover:text-[#e0def4] transition-colors flex items-center gap-1 text-sm"
          >
            <ExternalLink size={16} />
            Open in Browser
          </a>
          <div className="w-px h-4 bg-[#393552]"></div>
          <button 
            onClick={handleClear}
            className="text-[#908caa] hover:text-[#ea9a97] transition-colors text-sm"
          >
            Disconnect
          </button>
        </div>
      </div>
      <div className="flex-1 w-full bg-white relative">
        {/* @ts-expect-error - webview is an Electron-specific element */}
        <webview 
          src={mattermostUrl} 
          className="w-full h-full border-none absolute inset-0"
          allowpopups="true"
          partition="persist:mattermost"
        />
      </div>
    </div>
  );
}
