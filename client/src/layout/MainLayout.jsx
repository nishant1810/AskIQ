import { useState, useCallback } from "react";
import Sidebar from "../components/Sidebar";
import FileUpload from "../components/FileUpload";

export default function MainLayout({ children, onNewChat, onLoadChat }) {
  const [showUpload, setShowUpload] = useState(false);
  const [currentChatId, setCurrentChatId] = useState(null);

  const handleNewChat = useCallback(() => {
    setCurrentChatId(null);
    if (onNewChat) onNewChat();
  }, [onNewChat]);

  const handleLoadChat = useCallback((id) => {
    setCurrentChatId(id);
    if (onLoadChat) onLoadChat(id);
  }, [onLoadChat]);

  return (
    <div className="h-screen flex bg-[#0f0f0f] text-white overflow-hidden">
      <Sidebar
        onNewChat={handleNewChat}
        onLoadChat={handleLoadChat}
        currentChatId={currentChatId}
        onToggleUpload={() => setShowUpload(p => !p)}
        showUpload={showUpload}
      />

      <div className="flex-1 flex flex-col overflow-hidden">
        {/* ✅ Upload panel only — no top bar */}
        {showUpload && (
          <div className="border-b border-zinc-800 bg-[#141414] px-5 shrink-0">
            <FileUpload onUploadSuccess={() => setShowUpload(false)} />
          </div>
        )}

        {/* Content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {children}
        </div>
      </div>
    </div>
  );
}