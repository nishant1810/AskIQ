import React, { useState, useRef, useEffect } from 'react';
import { URL } from './constants';

const UserIcon = () => (
  <svg
    className="w-6 h-6 text-blue-400"
    fill="currentColor"
    viewBox="0 0 24 24"
  >
    <circle cx="12" cy="8" r="4" />
    <path d="M6 20c0-3.31 5.33-3.31 6 0" />
  </svg>
);

const BotIcon = () => (
  <svg
    className="w-6 h-6 text-green-400"
    fill="currentColor"
    viewBox="0 0 24 24"
  >
    <rect x="6" y="7" width="12" height="10" rx="2" ry="2" />
    <circle cx="9" cy="12" r="1" fill="white" />
    <circle cx="15" cy="12" r="1" fill="white" />
  </svg>
);

function App() {
  const [loading, setLoading] = useState(false);
  const [question, setQuestion] = useState('');
  const [chat, setChat] = useState([]);
  const [conversations, setConversations] = useState(() => {
    const saved = localStorage.getItem('askiq_chats');
    return saved ? JSON.parse(saved) : [];
  });
  const [activeChatIndex, setActiveChatIndex] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const resultRef = useRef(null);

  const saveConversation = (messages) => {
    const updated = [...conversations, { title: messages[0]?.text, messages }];
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

    const payload = {
      contents: [{ parts: [{ text: question }] }]
    };

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
        setActiveChatIndex(conversations.length);
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
    setSidebarOpen(false); // Auto-close sidebar on conversation load for smaller screens
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
  };

  useEffect(() => {
    resultRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chat]);

  return (
    <div className="flex h-screen bg-zinc-900 text-white overflow-hidden">

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 h-full bg-zinc-800 text-sm flex flex-col transition-transform duration-300
          ${sidebarOpen ? 'translate-x-0 w-72' : '-translate-x-full w-72'} 
          border-r border-zinc-700 z-40`}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-700">
          <h1 className="text-xl font-bold">AskIQ</h1>
          <button
            onClick={() => setSidebarOpen(false)}
            aria-label="Close sidebar"
            className="text-zinc-400 hover:text-white transition"
          >
            ✕
          </button>
        </div>

        {/* New Chat button at top */}
        <div className="flex flex-col p-4 space-y-2 border-b border-zinc-700">
          <button
            onClick={startNewChat}
            className="bg-blue-600 hover:bg-blue-700 rounded py-2 font-semibold"
          >
            + New Chat
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto p-2">
          {conversations.length === 0 && (
            <p className="text-zinc-400 p-4 text-center">No conversations yet.</p>
          )}
          {conversations.map((conv, idx) => (
            <button
              key={idx}
              onClick={() => loadConversation(idx)}
              className={`w-full text-left px-3 py-2 rounded-md truncate
                ${
                  activeChatIndex === idx
                    ? 'bg-zinc-600 text-white font-semibold'
                    : 'hover:bg-zinc-700 text-zinc-300'
                }`}
              title={conv.title || `Conversation ${idx + 1}`}
            >
              {conv.title || `Conversation ${idx + 1}`}
            </button>
          ))}
        </nav>

        {/* Clear Chats button near bottom */}
        <div className="flex flex-col p-4 space-y-2 border-t border-zinc-700">
          <button
            onClick={clearAllChats}
            className="bg-red-600 hover:bg-red-700 rounded py-2 font-semibold"
          >
            🗑 Clear Chats
          </button>
        </div>

        <div className="p-4 text-xs text-zinc-500 border-t border-zinc-700">
          AskIQ &copy; 2025
        </div>
      </aside>

      {/* Overlay for small screens */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black opacity-50 z-30 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main content area */}
      <main className="flex-1 flex flex-col justify-between p-6 ml-0 md:ml-72 transition-all duration-300">
        
        {/* Hamburger toggle */}
        <button
          onClick={() => setSidebarOpen(true)}
          aria-label="Open sidebar"
          className="md:hidden mb-4 text-zinc-400 hover:text-white focus:outline-none"
        >
          <svg
            className="w-8 h-8"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            viewBox="0 0 24 24"
          >
            <line x1="3" y1="12" x2="21" y2="12" />
            <line x1="3" y1="6" x2="21" y2="6" />
            <line x1="3" y1="18" x2="21" y2="18" />
          </svg>
        </button>

        {/* Chat Display */}
        <div className="overflow-y-auto flex-1 space-y-4 pr-4 flex flex-col">
          {chat.map((msg, idx) => (
            <div
              key={idx}
              className={`flex items-start max-w-3xl ${
                msg.type === 'user' ? 'self-end flex-row-reverse' : 'self-start'
              }`}
            >
              <div className={`flex-shrink-0 ${msg.type === 'user' ? 'ml-2' : 'mr-2'}`}>
                {msg.type === 'user' ? <UserIcon /> : <BotIcon />}
              </div>
              <div className={`p-3 rounded-xl ${msg.type === 'user' ? 'bg-blue-600 text-right text-white' : 'bg-zinc-700 text-left text-white'}`}>
                {msg.text}
              </div>
            </div>
          ))}
          <div ref={resultRef} />
        </div>

        {/* Input Area */}
        <div
          className="mt-4 bg-zinc-800 w-full max-w-3xl mx-auto p-1 pr-5 rounded-4xl
            border border-zinc-700 flex h-16"
        >
          <input
            type="text"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') askQuestion();
            }}
            className="w-full h-full p-3 bg-transparent text-white outline-none"
            placeholder="Ask me anything..."
          />

          <button
            onClick={askQuestion}
            disabled={loading}
            className={`text-white p-3 rounded-md hover:bg-gray-800 transition ${
              loading ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            {loading ? '...' : 'Ask'}
          </button>
        </div>
      </main>
    </div>
  );
}

export default App;
