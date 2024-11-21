"use client";

import { useState, useEffect } from "react";
import { io } from "socket.io-client";

let socket;

export default function MessageInput({ senderId, receiverId, onMessageSent }) {
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);

  const roomId = `${Math.min(senderId, receiverId)}-${Math.max(senderId, receiverId)}`;

  useEffect(() => {
    // Connect to the Socket.IO server
    socket = io("/", { path: "/api/socket" }); // Match the path used in server.js

    // Join the chat room
    socket.emit("joinRoom", { roomId });

    return () => {
      socket.disconnect(); // Clean up when component unmounts
    };
  }, [roomId]);

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
      socket.emit("newMessage", { roomId, message: newMessage });

      setText("");
      onMessageSent();
    } catch (error) {
      console.error("Error sending message:", error);
    } finally {
      setSending(false);
    }
  };

  const handleTyping = () => {
    text!=="" && socket.emit("typing", { roomId, user: senderId });
  };

  return (
    <form onSubmit={handleSubmit} className="text-black p-4 border-t">
      <div className="flex gap-2">
        <input
          type="text"
          value={text}
          onChange={(e) => {
            setText(e.target.value);
            handleTyping();
          }}
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
  );
}
