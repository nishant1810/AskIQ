import { useState, useCallback } from "react";
import ChatWindow from "./ChatWindow";
import MessageInput from "./MessageInput";

const ChatBox = ({ chatId, setChatId }) => {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSend = useCallback(async (input) => {
    if (!input.trim() || loading) return;

    setError("");

    // ✅ Add user message immediately
    setMessages((prev) => [...prev, { role: "user", content: input }]);
    setLoading(true);

    // ✅ Add empty assistant message for streaming
    setMessages((prev) => [...prev, { role: "assistant", content: "" }]);

    try {
      // ✅ Streaming fetch
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/rag/ask`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          body: JSON.stringify({ question: input, chatId }),
        }
      );

      if (!response.ok) throw new Error("Failed to get response");

      // ✅ Get chatId from header
      const newChatId = response.headers.get("X-Chat-Id");
      if (newChatId && setChatId) setChatId(newChatId);

      // ✅ Stream response
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let fullText = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        fullText += chunk;

        // ✅ Update last message in real time
        setMessages((prev) => {
          const updated = [...prev];
          updated[updated.length - 1] = {
            role: "assistant",
            content: fullText,
          };
          return updated;
        });
      }
    } catch (err) {
      setError("Failed to get response. Please try again.");
      setMessages((prev) => prev.slice(0, -1));
    } finally {
      setLoading(false);
    }
  }, [loading, chatId, setChatId]);

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-6">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-zinc-500 text-lg">
              Ask a question or upload a document to get started
            </p>
          </div>
        ) : (
          <ChatWindow messages={messages} loading={loading} />
        )}
      </div>

      {/* Error */}
      {error && (
        <p className="text-red-400 text-sm text-center mx-4 mb-2
                      bg-red-500/10 p-2 rounded">
          {error}
        </p>
      )}

      {/* Input */}
      <MessageInput onSend={handleSend} loading={loading} />
    </div>
  );
};

export default ChatBox;