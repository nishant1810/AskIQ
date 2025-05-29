import React, { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import 'highlight.js/styles/github-dark.css';
import { URL } from './constants';

const UserIcon = () => (
  <svg className="w-6 h-6 text-blue-400" fill="currentColor" viewBox="0 0 24 24">
    <circle cx="12" cy="8" r="4" />
    <path d="M6 20c0-3.31 5.33-3.31 6 0" />
  </svg>
);

const BotIcon = () => (
  <svg className="w-6 h-6 text-green-400" fill="currentColor" viewBox="0 0 24 24">
    <rect x="6" y="7" width="12" height="10" rx="2" ry="2" />
    <circle cx="9" cy="12" r="1" fill="white" />
    <circle cx="15" cy="12" r="1" fill="white" />
  </svg>
);

const getDateKey = (date = new Date()) => date.toISOString().split('T')[0];
const formatDate = (key) => {
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);
  const target = new Date(key);
  if (key === getDateKey(today)) return "Today";
  if (key === getDateKey(yesterday)) return "Yesterday";
  return target.toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' });
};

const CodeBlock = ({ className, children }) => {
  const code = String(children).trim();
  const [copied, setCopied] = useState(false);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="relative">
      <pre className={`${className} rounded-lg overflow-x-auto p-4 bg-zinc-800`}>
        <code>{code}</code>
      </pre>
      <button
        onClick={copyToClipboard}
        className="absolute top-2 right-2 bg-zinc-700 text-xs text-white px-2 py-1 rounded hover:bg-zinc-600"
      >
        {copied ? 'Copied!' : 'Copy'}
      </button>
    </div>
  );
};

function App() {
  const [loading, setLoading] = useState(false);
  const [question, setQuestion] = useState('');
  const [chat, setChat] = useState([]);
  const [conversations, setConversations] = useState(() => {
    const saved = localStorage.getItem('askiq_chats');
    return saved ? JSON.parse(saved) : [];
  });
  const [activeChatIndex, setActiveChatIndex] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [lastDeleted, setLastDeleted] = useState(null);
  const undoTimerRef = useRef(null);
  const resultRef = useRef(null);
  

  const saveConversation = (messages) => {
    const now = new Date();
    const timestamp = now.toLocaleString();
    const dateKey = getDateKey(now);
    const updated = [{ title: messages[0]?.text, messages, timestamp, dateKey }, ...conversations];
    setConversations(updated);
    localStorage.setItem('askiq_chats', JSON.stringify(updated));
  };

  const askQuestion = async () => {
    if (!question.trim()) return;
    const userMsg = { type: 'user', text: question };
    const updatedChat = [...chat, userMsg];
    setChat(updatedChat);
    setQuestion('');
    setLoading(true);
    const now = new Date();
    const payload = { contents: [{ parts: [{  text: `${question}\n(Asked on ${now.toLocaleString()})`}] }] };

    try {
      const response = await fetch(URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      const answer = data?.candidates?.[0]?.content?.parts?.[0]?.text || 'No response received.';
      const botMsg = { type: 'bot', text: answer };
      const fullChat = [...updatedChat, botMsg];
      setChat(fullChat);

      if (activeChatIndex === null) {
        saveConversation(fullChat);
        setActiveChatIndex(0);
      } else {
        const updatedConvs = [...conversations];
        updatedConvs[activeChatIndex].messages = fullChat;
        setConversations(updatedConvs);
        localStorage.setItem('askiq_chats', JSON.stringify(updatedConvs));
      }

    } catch (error) {
      setChat(prev => [...prev, { type: 'bot', text: 'An error occurred. Please try again.' }]);
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const loadConversation = (index) => {
    setActiveChatIndex(index);
    setChat(conversations[index].messages);
    setSidebarOpen(false);
  };

  const startNewChat = () => {
    setQuestion('');
    setChat([]);
    setActiveChatIndex(null);
  };

  const clearAllChats = () => {
    localStorage.removeItem('askiq_chats');
    setConversations([]);
    setChat([]);
    setActiveChatIndex(null);
    setLastDeleted(null);
  };

  const deleteConversation = (idx) => {
    const deleted = conversations[idx];
    const updated = conversations.filter((_, i) => i !== idx);
    setConversations(updated);
    localStorage.setItem('askiq_chats', JSON.stringify(updated));
    setLastDeleted({ chat: deleted, index: idx });
    clearTimeout(undoTimerRef.current);
    undoTimerRef.current = setTimeout(() => setLastDeleted(null), 5000);
    if (idx === activeChatIndex) {
      setChat([]);
      setActiveChatIndex(null);
    } else if (idx < activeChatIndex) {
      setActiveChatIndex(prev => prev - 1);
    }
  };

  const undoDelete = () => {
    if (!lastDeleted) return;
    const updated = [...conversations];
    updated.splice(lastDeleted.index, 0, lastDeleted.chat);
    setConversations(updated);
    localStorage.setItem('askiq_chats', JSON.stringify(updated));
    setLastDeleted(null);
    clearTimeout(undoTimerRef.current);
  };

  useEffect(() => {
    resultRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chat]);

  return (
    <div className="flex h-screen bg-zinc-900 text-white overflow-hidden">
      {/* Sidebar */}
      <aside className={`fixed top-0 left-0 h-full bg-zinc-800 text-sm flex flex-col transition-transform duration-300
        ${sidebarOpen ? 'translate-x-0 w-72' : '-translate-x-full w-72'} border-r border-zinc-700 z-40 md:translate-x-0`}>
        <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-700">
          <h1 className="text-xl font-bold text-center w-full">AskIQ</h1>
        </div>
        <div className="flex flex-col p-4 space-y-2 border-b border-zinc-700">
          <button onClick={startNewChat} className="bg-blue-600 hover:bg-blue-700 rounded py-2 font-semibold">+ New Chat</button>
        </div>
        <div className="p-4">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search chats..."
            className="w-full px-3 py-2 rounded bg-zinc-700 text-white outline-none"
          />
        </div>
        <nav className="flex-1 overflow-y-auto p-2 space-y-2">
          {(() => {
            const groups = {};
            conversations
              .filter((conv) => conv.title?.toLowerCase().includes(searchTerm.toLowerCase()))
              .forEach((conv, idx) => {
                if (!groups[conv.dateKey]) groups[conv.dateKey] = [];
                groups[conv.dateKey].push({ ...conv, index: idx });
              });
            const dateKeys = Object.keys(groups).sort((a, b) => new Date(b) - new Date(a));
            return dateKeys.map((dateKey) => (
              <div key={dateKey}>
                <div className="text-xs text-zinc-400 font-semibold mb-1 ml-2">{formatDate(dateKey)}</div>
                {groups[dateKey].map((conv) => (
                  <div key={conv.index} className={`flex flex-col group px-3 py-2 rounded-md ${
                    activeChatIndex === conv.index
                      ? 'bg-zinc-600 text-white font-semibold'
                      : 'hover:bg-zinc-700 text-zinc-300'
                  }`}>
                    <div className="flex justify-between items-center">
                      <button onClick={() => loadConversation(conv.index)} className="flex-1 text-left truncate">
                        {conv.title || `Conversation ${conv.index + 1}`}
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteConversation(conv.index);
                        }}
                        className="text-zinc-400 hover:text-red-500 transition ml-2"
                      >
                        🗑️
                      </button>
                    </div>
                    <div className="text-xs text-zinc-400 mt-1 pl-1">{conv.timestamp}</div>
                  </div>
                ))}
              </div>
            ));
          })()}
        </nav>
        {lastDeleted && (
          <div className="p-4">
            <button onClick={undoDelete} className="bg-yellow-500 hover:bg-yellow-600 text-black w-full py-2 rounded font-semibold">↩️ Undo Delete</button>
          </div>
        )}
        <div className="flex flex-col p-4 space-y-2 border-t border-zinc-700">
          <button onClick={clearAllChats} className="bg-red-600 hover:bg-red-700 rounded py-2 font-semibold">🗑️ Clear Chats</button>
        </div>
        <div className="p-4 text-xs text-center text-zinc-500 border-t border-zinc-700">AskIQ © 2025</div>
      </aside>

      {/* Sidebar overlay for mobile */}
      {sidebarOpen && <div className="fixed inset-0 bg-black opacity-50 z-30 md:hidden" onClick={() => setSidebarOpen(false)} />}

      {/* Main */}
      <main className="flex-1 flex flex-col justify-between p-6 ml-0 md:ml-72 transition-all duration-300">
        <button onClick={() => setSidebarOpen(true)} className="md:hidden mb-4 text-zinc-400 hover:text-white">
          <svg className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <line x1="3" y1="6" x2="21" y2="6" />
            <line x1="3" y1="12" x2="21" y2="12" />
            <line x1="3" y1="18" x2="21" y2="18" />
          </svg>
        </button>

        {/* Chat window */}
        <div className="overflow-y-auto flex-1 space-y-4 pr-4 flex flex-col">
          {chat.map((msg, idx) => (
            <div key={idx} className={`flex items-start max-w-3xl ${
              msg.type === 'user' ? 'self-end flex-row-reverse' : 'self-start'
            }`}>
              <div className={`flex-shrink-0 ${msg.type === 'user' ? 'ml-2' : 'mr-2'}`}>
                {msg.type === 'user' ? <UserIcon /> : <BotIcon />}
              </div>
              <div className={`p-3 rounded-xl prose prose-invert max-w-full ${
                msg.type === 'user' ? 'bg-blue-600 text-white' : 'bg-zinc-700'
              }`}>
                <ReactMarkdown
                  children={msg.text}
                  remarkPlugins={[remarkGfm]}
                  rehypePlugins={[rehypeHighlight]}
                  components={{ code: CodeBlock }}
                />
              </div>
            </div>
          ))}
          <div ref={resultRef} />
        </div>

        {/* Input */}
        <div className="mt-4 bg-zinc-800 w-full max-w-3xl mx-auto p-1 pr-5 rounded-4xl border border-zinc-700 flex h-16">
          <input
            type="text"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && askQuestion()}
            placeholder="Ask me anything..."
            className="w-full h-full p-3 bg-transparent text-white outline-none"
          />
          <button
            onClick={askQuestion}
            disabled={loading}
            className="bg-zinc-800  hover:bg-green-700 px-4 py-2 rounded text-white font-semibold"
          >
          {loading ? 'Thinking...' : 'Ask'}
          </button>
        </div>
      </main>
    </div>
  );
}

export default App;
