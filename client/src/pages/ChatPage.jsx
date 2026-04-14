import { useState, useRef, useCallback } from "react";
import MainLayout from "../layout/MainLayout";
import ChatWindow from "../components/ChatWindow";
import MessageInput from "../components/MessageInput";
import API from "../services/api";

const WelcomeScreen = () => (
  <div className="flex flex-col items-center justify-center h-full gap-8 px-4">
    <div className="text-center">
      <div className="w-14 h-14 rounded-2xl bg-green-600 flex items-center
                      justify-center text-2xl font-bold mx-auto mb-4">A</div>
      <h1 className="text-3xl font-bold text-white">
        Welcome to <span className="text-green-400">AskIQ</span>
      </h1>
      <p className="text-zinc-500 mt-2">
        RAG-powered AI assistant for your documents
      </p>
    </div>

    <div className="grid grid-cols-3 gap-4 max-w-xl w-full">
      {[
        { icon: "📄", t: "Upload documents", d: "PDF & TXT support" },
        { icon: "🔍", t: "Smart retrieval",  d: "Semantic search" },
        { icon: "💬", t: "Streaming chat",   d: "Real-time answers" },
      ].map((c, i) => (
        <div key={i}
          className="bg-zinc-900 border border-zinc-800 rounded-xl p-4
                     text-center hover:border-zinc-600 transition-colors">
          <div className="text-xl mb-2">{c.icon}</div>
          <p className="text-white text-xs font-medium">{c.t}</p>
          <p className="text-zinc-600 text-xs mt-1">{c.d}</p>
        </div>
      ))}
    </div>

    <p className="text-zinc-700 text-sm">
      Upload a document or type a question to get started
    </p>
  </div>
);

export default function ChatPage() {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading]   = useState(false);
  const [chatId, setChatId]     = useState(null);
  const [error, setError]       = useState("");
  const bottomRef = useRef(null);

  const handleSend = useCallback(async (input) => {
    if (!input.trim() || loading) return;
    setError("");
    setMessages(p => [...p, { role: "user", content: input }]);
    setLoading(true);
    setMessages(p => [...p, { role: "assistant", content: "" }]);

    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/rag/ask`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({ question: input, chatId }),
      });

      if (!res.ok) throw new Error("Bad response");

      const newId = res.headers.get("X-Chat-Id");
      if (newId) setChatId(newId);

      const reader  = res.body.getReader();
      const decoder = new TextDecoder();
      let full = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        full += decoder.decode(value, { stream: true });
        setMessages(p => {
          const u = [...p];
          u[u.length - 1] = { role: "assistant", content: full };
          return u;
        });
      }
    } catch {
      setError("Failed to get response. Please try again.");
      setMessages(p => p.slice(0, -1));
    } finally {
      setLoading(false);
    }
  }, [loading, chatId]);

  const handleNewChat = useCallback(() => {
    setMessages([]); setChatId(null); setError("");
  }, []);

  const handleLoadChat = useCallback(async (id) => {
    try {
      const res = await API.get(`/chat/${id}`);
      setMessages(res.data.messages || []);
      setChatId(id);
    } catch { setError("Failed to load chat"); }
  }, []);

  return (
    <MainLayout onNewChat={handleNewChat} onLoadChat={handleLoadChat}>
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="flex-1 overflow-y-auto px-4 py-6">
          {messages.length === 0
            ? <WelcomeScreen />
            : <ChatWindow messages={messages} loading={loading} />
          }
          <div ref={bottomRef} />
        </div>

        {error && (
          <div className="mx-4 mb-2 flex items-center justify-between
                          bg-red-950 border border-red-800 text-red-400
                          text-sm px-4 py-2 rounded-xl">
            <span>{error}</span>
            <button onClick={() => setError("")}
              className="hover:text-white ml-4">✕</button>
          </div>
        )}

        <MessageInput onSend={handleSend} loading={loading} />
      </div>
    </MainLayout>
  );
}