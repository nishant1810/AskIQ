import { useEffect, useRef } from "react";
import ReactMarkdown from "react-markdown";
import rehypeHighlight from "rehype-highlight";
import remarkGfm from "remark-gfm";
import "highlight.js/styles/github-dark.css";

const CodeBlock = ({ children, className }) => {
  const match = /language-(\w+)/.exec(className || "");
  const code = String(children).replace(/\n$/, "");

  if (!match) {
    return (
      <code className="bg-zinc-700 text-green-400 px-1.5 py-0.5
                       rounded text-xs font-mono">
        {children}
      </code>
    );
  }

  return (
    <div className="group relative my-3 rounded-xl overflow-hidden
                    border border-zinc-700">
      <div className="flex items-center justify-between bg-zinc-900
                      px-4 py-2 border-b border-zinc-700">
        <span className="text-xs font-mono text-zinc-400">{match[1]}</span>
        <button
          onClick={() => navigator.clipboard.writeText(code)}
          className="text-xs text-zinc-500 hover:text-white bg-zinc-800
                     hover:bg-zinc-600 px-2 py-1 rounded transition-all
                     opacity-0 group-hover:opacity-100"
        >
          Copy
        </button>
      </div>
      <pre className="overflow-x-auto m-0 p-4 bg-[#0d0d0d] text-sm">
        <code className={className}>{children}</code>
      </pre>
    </div>
  );
};

const TypingDots = () => (
  <div className="flex gap-1 px-1 py-2 items-end">
    {["dot-1","dot-2","dot-3"].map(cls => (
      <span key={cls} className={`w-2 h-2 rounded-full bg-zinc-400 ${cls}`} />
    ))}
  </div>
);

const Avatar = ({ role }) => (
  <div className={`w-8 h-8 rounded-full flex items-center justify-center
                   text-xs font-bold shrink-0 mt-1
                   ${role === "assistant"
                     ? "bg-green-600 text-white"
                     : "bg-blue-600 text-white"}`}>
    {role === "assistant" ? "AI" : "U"}
  </div>
);

export default function ChatWindow({ messages, loading }) {
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div className="max-w-3xl w-full mx-auto space-y-5 pb-6">
      {messages.map((msg, i) => (
        <div key={i}
          className={`flex gap-3 msg-in ${
            msg.role === "user" ? "flex-row-reverse" : "flex-row"
          }`}
        >
          <Avatar role={msg.role} />
          <div className={`px-4 py-3 rounded-2xl text-sm leading-relaxed
                           max-w-[85%] ${
            msg.role === "user"
              ? "bg-blue-600 text-white rounded-tr-sm"
              : "bg-zinc-800 text-zinc-100 rounded-tl-sm border border-zinc-700"
          }`}>
            {msg.role === "user" ? (
              <p className="whitespace-pre-wrap">{msg.content}</p>
            ) : (
              <div className="md">
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  rehypePlugins={[rehypeHighlight]}
                  components={{ code: CodeBlock }}
                >
                  {msg.content || ""}
                </ReactMarkdown>
                {loading && i === messages.length - 1 && msg.content && (
                  <span className="cursor" />
                )}
              </div>
            )}
          </div>
        </div>
      ))}

      {loading && messages[messages.length - 1]?.content === "" && (
        <div className="flex gap-3 msg-in">
          <Avatar role="assistant" />
          <div className="bg-zinc-800 border border-zinc-700 rounded-2xl
                          rounded-tl-sm px-4">
            <TypingDots />
          </div>
        </div>
      )}

      <div ref={bottomRef} />
    </div>
  );
}