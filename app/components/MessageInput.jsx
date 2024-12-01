"use client";

import { useEffect, useState } from "react";

export default function MessageInput({ senderId, receiverId, onMessageSent }) {
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [isTyping, setIsTyping] = useState(false);

  useEffect(() => {
    const updateTypingStatus = async (typing) => {
      try {
        await fetch("/api/users/typing", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ typing }),
        });
      } catch (error) {
        console.error("Failed to update typing status:", error);
      }
    };

    if (text.trim().length > 0 && !isTyping) {
      setIsTyping(true);
      updateTypingStatus(true);
    } else if (text.trim().length === 0 && isTyping) {
      setIsTyping(false);
      updateTypingStatus(false);
    }
    
    // Cleanup when component unmounts or text changes
    return () => {
      if (isTyping) {
        setIsTyping(false);
        updateTypingStatus(false);
      }
    };
  }, [text]);

  


  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!text.trim() || sending) return;
    setSending(true);

    try {
      const response = await fetch("/api/messages/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text,
          senderId: parseInt(senderId),
          receiverId: parseInt(receiverId),
        }),
      });

      if (!response.ok) throw new Error("Failed to send message");

      const newMessage = await response.json();
      setMessages((prev) => [...prev, newMessage]); // Optimistically update messages
      setText("");
      setIsTyping(false); 
      onMessageSent();
    } catch (error) {
      console.error("Error sending message:", error);
    } finally {
      setSending(false);
    }
  };

  return (
    <div>
      {/* <div className="messages">
        {messages.map((message, idx) => (
          <p key={idx}>
            <strong>{message.senderId === senderId ? "You" : "Them"}:</strong>{" "}
            {message.content}
          </p>
        ))}
      </div> */}
      <form onSubmit={handleSubmit} className="text-black p-4 border-t">
        <div className="flex gap-2">
          <input
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 p-2 border rounded-lg"
            disabled={sending}
          />
          <button
            type="submit"
            disabled={!text.trim() || sending}
            className={`px-4 py-2 rounded-lg ${
              !text.trim() || sending
                ? "bg-gray-300"
                : "bg-blue-500 text-white hover:bg-blue-600"
            }`}
          >
            Send
          </button>
        </div>
      </form>
    </div>
  );
}
