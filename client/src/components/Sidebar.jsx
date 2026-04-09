import { useState, useEffect, useCallback } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import API from "../services/api";

const formatDate = (d) => {
  const date = new Date(d);
  const now = new Date();
  const days = Math.floor((now - date) / 86400000);
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days} days ago`;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
};

const groupChats = (chats) => {
  const groups = { Today: [], Yesterday: [], "Previous 7 days": [], Older: [] };
  chats.forEach((chat) => {
    const label = formatDate(chat.createdAt);
    if (label === "Today") groups["Today"].push(chat);
    else if (label === "Yesterday") groups["Yesterday"].push(chat);
    else if (label.includes("days ago")) groups["Previous 7 days"].push(chat);
    else groups["Older"].push(chat);
  });
  return groups;
};

// ✅ Get user initial safely
const getUserInitial = (user) => {
  if (user?.name && user.name.trim()) {
    return user.name.trim().charAt(0).toUpperCase();
  }
  if (user?.email) {
    return user.email.charAt(0).toUpperCase();
  }
  return "U";
};

// ✅ Get display name safely
const getDisplayName = (user) => {
  if (user?.name && user.name.trim()) return user.name.trim();
  if (user?.email) return user.email.split("@")[0];
  return "User";
};

export default function Sidebar({
  onNewChat, onLoadChat, currentChatId, onToggleUpload, showUpload,
}) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [chats, setChats] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [tab, setTab] = useState("chats");
  const [loading, setLoading] = useState(false);
  const [hoveredChat, setHoveredChat] = useState(null);
  const [search, setSearch] = useState("");

  const fetchChats = useCallback(async () => {
    try {
      setLoading(true);
      const res = await API.get("/chat");
      setChats(res.data || []);
    } catch {} finally { setLoading(false); }
  }, []);

  const fetchDocs = useCallback(async () => {
    try {
      const res = await API.get("/rag/documents");
      setDocuments(res.data || []);
    } catch {}
  }, []);

  useEffect(() => { fetchChats(); fetchDocs(); }, []);

  const deleteChat = async (e, id) => {
    e.stopPropagation();
    try {
      await API.delete(`/chat/${id}`);
      setChats((p) => p.filter((c) => c._id !== id));
      if (currentChatId === id) onNewChat();
    } catch {}
  };

  const deleteDocument = async (e, id) => {
    e.stopPropagation();
    try {
      await API.delete(`/rag/documents/${id}`);
      setDocuments((p) => p.filter((d) => d._id !== id));
    } catch {
      console.error("Failed to delete document");
    }
  };

  const filteredChats = chats.filter((chat) =>
    chat.title?.toLowerCase().includes(search.toLowerCase())
  );
  const grouped = groupChats(filteredChats);

  return (
    <div className="w-72 bg-[#181818] flex flex-col h-full shrink-0
                    border-r border-zinc-800/50">

      {/* Top Section */}
      <div className="p-4 shrink-0">
        {/* Logo */}
        <div className="flex items-center gap-2.5 px-2 py-2 mb-2">
          <div className="w-8 h-8 rounded-lg bg-green-500 flex items-center
                          justify-center text-sm font-bold text-white">A</div>
          <span className="text-white font-semibold">AskIQ</span>
          <span className="ml-auto text-[10px] bg-green-500/20 text-green-400
                           px-2 py-0.5 rounded-full border border-green-500/30">
            RAG
          </span>
        </div>

        {/* New Chat */}
        <button
          onClick={() => { onNewChat(); fetchChats(); }}
          className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl
                     text-sm text-zinc-300 hover:text-white hover:bg-zinc-700/60
                     transition-all mb-2"
        >
          <span className="text-lg leading-none font-light">+</span>
          New Chat
        </button>

        {/* Upload */}
        <button
          onClick={onToggleUpload}
          className={`w-full flex items-center gap-2 px-3 py-2.5 rounded-xl
                      text-sm transition-all mb-3 ${
            showUpload
              ? "bg-green-500/15 text-green-400 border border-green-500/30"
              : "text-zinc-400 hover:text-white hover:bg-zinc-700/60"
          }`}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
               stroke="currentColor" strokeWidth="2" className="shrink-0">
            <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
            <polyline points="17 8 12 3 7 8"/>
            <line x1="12" y1="3" x2="12" y2="15"/>
          </svg>
          {showUpload ? "Hide upload" : "Upload document"}
        </button>

        {/* Search */}
        <div className="flex items-center bg-zinc-800/80 px-3 py-2 rounded-xl
                        border border-zinc-700/50 focus-within:border-zinc-500
                        transition-colors">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
               stroke="#71717a" strokeWidth="2" className="shrink-0 mr-2">
            <circle cx="11" cy="11" r="8"/>
            <line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input
            type="text"
            placeholder="Search chats..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-transparent outline-none text-sm w-full text-white
                       placeholder-zinc-600"
          />
          {search && (
            <button onClick={() => setSearch("")}
              className="text-zinc-600 hover:text-zinc-400 ml-1">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none"
                   stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18"/>
                <line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Divider */}
      <div className="h-px bg-zinc-800/70 mx-3 shrink-0" />

      {/* Tabs */}
      <div className="flex px-3 pt-2 gap-1 shrink-0">
        {[["chats","Chats"],["docs","Documents"]].map(([key, label]) => (
          <button key={key} onClick={() => setTab(key)}
            className={`flex-1 py-1.5 text-xs rounded-lg font-medium
                        transition-colors ${
              tab === key
                ? "bg-zinc-800 border border-zinc-700 text-white"
                : "text-zinc-500 hover:text-zinc-300"
            }`}>
            {label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-2 py-3 space-y-4">

        {/* Chats Tab */}
        {tab === "chats" && (
          <>
            {loading ? (
              <div className="space-y-2 px-2 pt-1">
                {[1,2,3].map(i => (
                  <div key={i}
                    className="h-9 bg-zinc-800/60 rounded-xl animate-pulse" />
                ))}
              </div>
            ) : filteredChats.length === 0 ? (
              <div className="flex flex-col items-center justify-center
                              py-12 px-4 text-center">
                <div className="w-10 h-10 rounded-full bg-zinc-800/80 flex
                                items-center justify-center mb-3">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
                       stroke="#52525b" strokeWidth="1.5">
                    <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
                  </svg>
                </div>
                <p className="text-zinc-500 text-xs">
                  {search ? "No chats found" : "No conversations yet"}
                </p>
                {!search && (
                  <p className="text-zinc-700 text-xs mt-1">
                    Start a new chat above
                  </p>
                )}
              </div>
            ) : (
              Object.entries(grouped).map(([group, items]) =>
                items.length === 0 ? null : (
                  <div key={group}>
                    <p className="text-[11px] text-zinc-600 font-medium px-3
                                  mb-1 uppercase tracking-wider">{group}</p>
                    {items.map(chat => (
                      <div
                        key={chat._id}
                        onClick={() => onLoadChat(chat._id)}
                        onMouseEnter={() => setHoveredChat(chat._id)}
                        onMouseLeave={() => setHoveredChat(null)}
                        className={`flex items-center justify-between px-3
                                   py-2.5 rounded-xl cursor-pointer
                                   transition-colors ${
                          currentChatId === chat._id
                            ? "bg-zinc-700/80 text-white"
                            : "hover:bg-zinc-800/80 text-zinc-400 hover:text-zinc-200"
                        }`}
                      >
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                          <svg width="13" height="13" viewBox="0 0 24 24"
                               fill="none" stroke="currentColor"
                               strokeWidth="1.75" className="shrink-0 opacity-40">
                            <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
                          </svg>
                          <p className="text-xs font-medium truncate leading-snug">
                            {chat.title || "New chat"}
                          </p>
                        </div>
                        {hoveredChat === chat._id && (
                          <button
                            onClick={(e) => deleteChat(e, chat._id)}
                            className="text-zinc-600 hover:text-red-400 ml-2
                                       p-1 rounded-lg hover:bg-red-400/10
                                       transition-colors shrink-0"
                          >
                            <svg width="12" height="12" viewBox="0 0 24 24"
                                 fill="none" stroke="currentColor" strokeWidth="2">
                              <polyline points="3 6 5 6 21 6"/>
                              <path d="M19 6l-1 14H6L5 6M10 11v6M14 11v6M9 6V4h6v2"/>
                            </svg>
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )
              )
            )}
          </>
        )}

        {/* Documents Tab */}
        {tab === "docs" && (
          <>
            {documents.length === 0 ? (
              <div className="flex flex-col items-center justify-center
                              py-12 px-4 text-center">
                <div className="w-10 h-10 rounded-full bg-zinc-800/80 flex
                                items-center justify-center mb-3">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
                       stroke="#52525b" strokeWidth="1.5">
                    <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
                    <polyline points="14 2 14 8 20 8"/>
                  </svg>
                </div>
                <p className="text-zinc-500 text-xs">No documents yet</p>
                <p className="text-zinc-700 text-xs mt-1">
                  Upload a PDF to get started
                </p>
              </div>
            ) : (
              <div className="space-y-0.5">
                {documents.map(doc => (
                  <div key={doc._id}
                    className="px-3 py-2.5 rounded-xl hover:bg-zinc-800/80
                               transition-colors group">
                    <div className="flex items-start gap-2">
                      <svg width="13" height="13" viewBox="0 0 24 24"
                           fill="none" stroke="#22c55e" strokeWidth="1.75"
                           className="shrink-0 mt-0.5">
                        <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
                        <polyline points="14 2 14 8 20 8"/>
                      </svg>
                      <div className="min-w-0 flex-1">
                        <p className="text-zinc-300 text-xs font-medium truncate">
                          {doc.fileName}
                        </p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-zinc-600 text-[11px]">
                            {doc.chunkCount} chunks
                          </span>
                          <span className={`text-[11px] ${
                            doc.status === "ready"
                              ? "text-green-500" : "text-yellow-500"
                          }`}>
                            {doc.status}
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={(e) => deleteDocument(e, doc._id)}
                        className="opacity-0 group-hover:opacity-100
                                   transition-opacity text-zinc-600
                                   hover:text-red-400 p-1 rounded-lg
                                   hover:bg-red-400/10 shrink-0"
                      >
                        <svg width="12" height="12" viewBox="0 0 24 24"
                             fill="none" stroke="currentColor" strokeWidth="2">
                          <polyline points="3 6 5 6 21 6"/>
                          <path d="M19 6l-1 14H6L5 6M10 11v6M14 11v6M9 6V4h6v2"/>
                        </svg>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* Divider */}
      <div className="h-px bg-zinc-800/70 mx-3 shrink-0" />

      {/* ✅ User Footer */}
      <div className="p-3 shrink-0">
        <div className="flex items-center gap-2.5 px-2 py-2 rounded-xl
                        hover:bg-zinc-800/60 transition-colors group">

          {/* ✅ Avatar with gradient and initial */}
          <div className="w-8 h-8 rounded-full flex items-center justify-center
                          text-white text-sm font-bold shrink-0 uppercase
                          bg-gradient-to-br from-blue-500 to-blue-700">
            {getUserInitial(user)}
          </div>

          <div className="min-w-0 flex-1">
            {/* ✅ Name */}
            <p className="text-white text-xs font-medium truncate leading-snug">
              {getDisplayName(user)}
            </p>
            {/* ✅ Email */}
            {user?.email && (
              <p className="text-zinc-600 text-[11px] truncate">
                {user.email}
              </p>
            )}
          </div>

          {/* Logout */}
          <button
            onClick={() => { logout(); navigate("/login"); }}
            className="opacity-0 group-hover:opacity-100 transition-opacity
                       text-zinc-600 hover:text-red-400 p-1.5 rounded-lg
                       hover:bg-red-400/10"
            title="Logout"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                 stroke="currentColor" strokeWidth="1.75">
              <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/>
              <polyline points="16 17 21 12 16 7"/>
              <line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}