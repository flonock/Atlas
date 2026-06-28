"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Folder, FileText, File, Plus, ChevronRight, X, Image as ImageIcon, Code, Link as LinkIcon } from "lucide-react";

interface FileItem {
  name: string;
  isDirectory: boolean;
  path: string;
}

export default function ResourcesPage() {
  const searchParams = useSearchParams();
  const projectName = searchParams.get('name') || 'Project';
  const projectRoot = searchParams.get('path') || '/';

  const [currentPath, setCurrentPath] = useState(projectRoot);
  const [items, setItems] = useState<FileItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [previewFile, setPreviewFile] = useState<{ path: string; name: string; type: string; content: string } | null>(null);
  const [isCreateFolderModalOpen, setIsCreateFolderModalOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [isCreateLinkModalOpen, setIsCreateLinkModalOpen] = useState(false);
  const [newLinkName, setNewLinkName] = useState("");
  const [newLinkUrl, setNewLinkUrl] = useState("");

  const loadDirectory = async (dir: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/fs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "list", dirPath: dir }),
      });
      const data = await res.json();
      if (res.ok) {
        setItems(data.items);
        setCurrentPath(dir);
      } else {
        setError(data.error || "Failed to load directory");
      }
    } catch (err) {
      setError(String(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (projectRoot) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      loadDirectory(projectRoot);
    }
  }, [projectRoot]);

  const handleCreateFolder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFolderName.trim()) return;
    try {
      const res = await fetch("/api/fs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "createFolder", dirPath: currentPath, folderName: newFolderName }),
      });
      if (res.ok) {
        setNewFolderName("");
        setIsCreateFolderModalOpen(false);
        loadDirectory(currentPath);
      } else {
        const data = await res.json();
        alert(data.error || "Failed to create folder");
      }
    } catch (err) {
      alert(String(err));
    }
  };

  const handleCreateLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLinkName.trim() || !newLinkUrl.trim()) return;
    try {
      const res = await fetch("/api/fs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "createLink", dirPath: currentPath, linkName: newLinkName, linkUrl: newLinkUrl }),
      });
      if (res.ok) {
        setNewLinkName("");
        setNewLinkUrl("");
        setIsCreateLinkModalOpen(false);
        loadDirectory(currentPath);
      } else {
        const data = await res.json();
        alert(data.error || "Failed to add link");
      }
    } catch (err) {
      alert(String(err));
    }
  };

  const handleOpenFile = async (item: FileItem) => {
    if (item.isDirectory) {
      loadDirectory(item.path);
    } else {
      try {
        const res = await fetch("/api/fs", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "read", filePath: item.path }),
        });
        const data = await res.json();
        if (res.ok) {
          if (data.type === 'link') {
            window.open(data.content.trim(), '_blank');
          } else {
            setPreviewFile({ path: item.path, name: item.name, type: data.type, content: data.content });
          }
        } else {
          alert(data.error || "Failed to read file");
        }
      } catch (err) {
        alert(String(err));
      }
    }
  };

  const getBreadcrumbs = () => {
    if (!currentPath.startsWith(projectRoot)) return [{ name: projectName, path: projectRoot }];
    
    const relativePath = currentPath.slice(projectRoot.length);
    const parts = relativePath.split('/').filter(Boolean);
    
    const breadcrumbs = [{ name: projectName, path: projectRoot }];
    let accumPath = projectRoot;
    
    for (const part of parts) {
      accumPath = accumPath.endsWith('/') ? accumPath + part : accumPath + '/' + part;
      breadcrumbs.push({ name: part, path: accumPath });
    }
    
    return breadcrumbs;
  };

  const getFileIcon = (name: string) => {
    const ext = name.split('.').pop()?.toLowerCase();
    switch (ext) {
      case 'pdf': return <FileText className="text-[#eb6f92]" size={20} />;
      case 'md':
      case 'txt': return <FileText className="text-[#9ccfd8]" size={20} />;
      case 'png':
      case 'jpg':
      case 'jpeg': return <ImageIcon className="text-[#f6c177]" size={20} />;
      case 'js':
      case 'ts':
      case 'jsx':
      case 'tsx':
      case 'json':
      case 'py': return <Code className="text-[#c4a7e7]" size={20} />;
      case 'link': return <LinkIcon className="text-[#31748f]" size={20} />;
      default: return <File className="text-[#908caa]" size={20} />;
    }
  };

  return (
    <div className="h-full flex flex-col gap-6">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-[#e0def4]">Resources</h1>
          <p className="text-[#908caa] mt-1">Manage and preview project documents and resources.</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={() => setIsCreateLinkModalOpen(true)}
            className="flex items-center gap-2 bg-[#2a273f] text-[#e0def4] px-4 py-2 rounded-xl font-bold border border-[#393552] hover:bg-[#393552] transition-colors"
          >
            <Plus size={18} />
            <span>New Link</span>
          </button>
          <button 
            onClick={() => setIsCreateFolderModalOpen(true)}
            className="flex items-center gap-2 bg-[#2a273f] text-[#e0def4] px-4 py-2 rounded-xl font-bold border border-[#393552] hover:bg-[#393552] transition-colors"
          >
            <Plus size={18} />
            <span>New Folder</span>
          </button>
        </div>
      </motion.div>

      <div className="flex-1 min-h-0 flex gap-6">
        {/* Main File Browser */}
        <div className={`glass-panel rounded-2xl border border-[#393552] flex flex-col flex-1 transition-all duration-300 ${previewFile ? 'w-1/2 max-w-[50%]' : 'w-full'}`}>
          {/* Breadcrumbs */}
          <div className="p-4 border-b border-[#393552] flex items-center gap-2 overflow-x-auto text-sm">
            {getBreadcrumbs().map((bc, idx, arr) => (
              <div key={bc.path} className="flex items-center gap-2 whitespace-nowrap">
                <button 
                  onClick={() => loadDirectory(bc.path)}
                  className={`hover:text-[#e0def4] transition-colors ${idx === arr.length - 1 ? 'text-[#e0def4] font-bold' : 'text-[#908caa]'}`}
                >
                  {bc.name}
                </button>
                {idx < arr.length - 1 && <ChevronRight size={14} className="text-[#6e6a86]" />}
              </div>
            ))}
          </div>

          <div className="flex-1 overflow-y-auto p-2">
            {loading ? (
              <div className="h-full flex items-center justify-center text-[#908caa] animate-pulse">Loading directory...</div>
            ) : error ? (
              <div className="h-full flex flex-col items-center justify-center text-[#eb6f92]">
                <p>Error loading directory:</p>
                <p className="text-sm opacity-80 mt-1">{error}</p>
              </div>
            ) : items.length === 0 ? (
              <div className="h-full flex items-center justify-center text-[#908caa] italic">Directory is empty.</div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                {items.map((item) => (
                  <div 
                    key={item.path}
                    onClick={() => handleOpenFile(item)}
                    className="flex items-center gap-3 p-3 rounded-xl hover:bg-[#393552]/50 cursor-pointer transition-colors border border-transparent hover:border-[#393552] group"
                  >
                    {item.isDirectory ? (
                      <Folder className="text-[#f6c177]" size={20} fill="#f6c177" fillOpacity={0.2} />
                    ) : (
                      getFileIcon(item.name)
                    )}
                    <span className="text-[#e0def4] text-sm truncate flex-1 font-medium">{item.name}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Preview Pane */}
        <AnimatePresence>
          {previewFile && (
            <motion.div
              initial={{ opacity: 0, x: 20, width: 0 }}
              animate={{ opacity: 1, x: 0, width: '50%' }}
              exit={{ opacity: 0, x: 20, width: 0 }}
              className="glass-panel rounded-2xl border border-[#393552] flex flex-col overflow-hidden h-full flex-1"
            >
              <div className="p-4 border-b border-[#393552] flex items-center justify-between bg-[#2a273f]/50">
                <div className="flex items-center gap-3 truncate pr-4">
                  {getFileIcon(previewFile.name)}
                  <h3 className="font-bold text-[#e0def4] truncate">{previewFile.name}</h3>
                </div>
                <button 
                  onClick={() => setPreviewFile(null)}
                  className="p-1.5 text-[#908caa] hover:text-[#ea9a97] hover:bg-[#ea9a97]/10 rounded-lg transition-colors flex-shrink-0"
                >
                  <X size={18} />
                </button>
              </div>
              <div className="flex-1 overflow-auto bg-[#191724]">
                {previewFile.type === 'pdf' ? (
                  <iframe 
                    src={previewFile.content} 
                    className="w-full h-full border-none"
                    title={previewFile.name}
                  />
                ) : (
                  <pre className="p-4 text-sm text-[#e0def4] font-mono whitespace-pre-wrap">
                    {previewFile.content}
                  </pre>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Create Folder Modal */}
      <AnimatePresence>
        {isCreateFolderModalOpen && (
          <div className="fixed inset-0 bg-[#191724]/80 backdrop-blur-sm z-50 flex items-center justify-center">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[#2a273f] border border-[#393552] rounded-2xl p-6 w-full max-w-md shadow-2xl"
            >
              <h2 className="text-xl font-bold text-[#e0def4] mb-4">Create New Folder</h2>
              <form onSubmit={handleCreateFolder}>
                <input
                  type="text"
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  placeholder="Folder name..."
                  autoFocus
                  className="w-full bg-[#191724] text-[#e0def4] border border-[#393552] rounded-xl px-4 py-3 focus:outline-none focus:border-[#c4a7e7] transition-colors mb-6"
                />
                <div className="flex gap-3 justify-end">
                  <button
                    type="button"
                    onClick={() => { setIsCreateFolderModalOpen(false); setNewFolderName(""); }}
                    className="px-4 py-2 text-[#908caa] hover:text-[#e0def4] font-bold transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={!newFolderName.trim()}
                    className="bg-[#c4a7e7] text-[#232136] px-6 py-2 rounded-xl font-bold hover:bg-[#b094d6] transition-colors disabled:opacity-50"
                  >
                    Create
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Create Link Modal */}
      <AnimatePresence>
        {isCreateLinkModalOpen && (
          <div className="fixed inset-0 bg-[#191724]/80 backdrop-blur-sm z-50 flex items-center justify-center">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[#2a273f] border border-[#393552] rounded-2xl p-6 w-full max-w-md shadow-2xl"
            >
              <h2 className="text-xl font-bold text-[#e0def4] mb-4">Add Web Link</h2>
              <form onSubmit={handleCreateLink}>
                <input
                  type="text"
                  value={newLinkName}
                  onChange={(e) => setNewLinkName(e.target.value)}
                  placeholder="Link name..."
                  autoFocus
                  className="w-full bg-[#191724] text-[#e0def4] border border-[#393552] rounded-xl px-4 py-3 focus:outline-none focus:border-[#c4a7e7] transition-colors mb-4"
                />
                <input
                  type="url"
                  value={newLinkUrl}
                  onChange={(e) => setNewLinkUrl(e.target.value)}
                  placeholder="https://..."
                  className="w-full bg-[#191724] text-[#e0def4] border border-[#393552] rounded-xl px-4 py-3 focus:outline-none focus:border-[#c4a7e7] transition-colors mb-6"
                />
                <div className="flex gap-3 justify-end">
                  <button
                    type="button"
                    onClick={() => { setIsCreateLinkModalOpen(false); setNewLinkName(""); setNewLinkUrl(""); }}
                    className="px-4 py-2 text-[#908caa] hover:text-[#e0def4] font-bold transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={!newLinkName.trim() || !newLinkUrl.trim()}
                    className="bg-[#c4a7e7] text-[#232136] px-6 py-2 rounded-xl font-bold hover:bg-[#b094d6] transition-colors disabled:opacity-50"
                  >
                    Add Link
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
