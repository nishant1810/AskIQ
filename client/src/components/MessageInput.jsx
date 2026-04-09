import { useState, useCallback } from "react";

export default function MessageInput({ onSend, loading }) {
  const [input, setInput] = useState("");

  const send = useCallback(() => {
    if (!input.trim() || loading) return;
    onSend(input.trim());
    setInput("");
  }, [input, loading, onSend]);

  const onKey = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  return (
    <div className="px-4 pb-5 pt-2">
      <div className={`max-w-3xl mx-auto flex items-end gap-3 bg-zinc-900
                       rounded-2xl px-4 py-3 border-2 transition-all ${
        loading
          ? "border-zinc-700"
          : "border-zinc-700 focus-within:border-green-500/70"
      }`}>
        <textarea
          rows={1}
          value={input}
          disabled={loading}
          placeholder="Ask anything about your documents…"
          onChange={e => {
            setInput(e.target.value);
            e.target.style.height = "auto";
            e.target.style.height =
              Math.min(e.target.scrollHeight, 160) + "px";
          }}
          onKeyDown={onKey}
          className="flex-1 bg-transparent outline-none text-white text-sm
                     resize-none leading-relaxed placeholder-zinc-600
                     disabled:opacity-40"
          style={{ minHeight: "24px" }}
        />

        <button
          onClick={send}
          disabled={!input.trim() || loading}
          className={`w-9 h-9 rounded-xl flex items-center justify-center
                      transition-all shrink-0 mb-0.5 ${
            input.trim() && !loading
              ? "bg-green-500 hover:bg-green-400 text-white"
              : "bg-zinc-800 text-zinc-600 cursor-not-allowed"
          }`}
        >
          {loading ? (
            <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24"
                 fill="none">
              <circle cx="12" cy="12" r="10" stroke="currentColor"
                      strokeWidth="3" className="opacity-20"/>
              <path fill="currentColor" className="opacity-80"
                    d="M4 12a8 8 0 018-8v8H4z"/>
            </svg>
          ) : (
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none"
                 stroke="currentColor" strokeWidth="2.5">
              <path d="M22 2L11 13M22 2L15 22L11 13L2 9L22 2Z"
                    strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          )}
        </button>
      </div>

      <p className="text-center text-zinc-700 text-xs mt-2.5">
        Enter to send · Shift+Enter for new line ·
        AskIQ may make mistakes
      </p>
    </div>
  );
}