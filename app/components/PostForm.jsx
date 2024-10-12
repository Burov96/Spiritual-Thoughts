"use client";

import { useContext, useState } from "react";
import { useSession } from "next-auth/react";
import { NotificationContext } from "../NotificationProvider";

export function PostForm() {
  const { data: session } = useSession();
  const [content, setContent] = useState("");
  const { showNotification } = useContext(NotificationContext);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setContent((prev) => prev.trim());

    if (content.length < 1) {
      showNotification("Please enter a thought first", 'failure');
      return;
    }

    try {
      await fetch("/api/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });
      showNotification("Thought posted successfully", 'success');
      setContent("");
    } catch (error) {
      console.error("Error posting thought:", error);
      showNotification("Failed to post thought", 'failure');
    }
  };

  if (!session) return null;

  return (
    <form onSubmit={handleSubmit} className="flex flex-col space-y-2">
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Share your thought..."
        required
        className="p-2 border rounded"
      />
      <button type="submit" className="px-4 py-2 bg-blue-500 text-white rounded">
        Post Thought
      </button>
    </form>
  );
}
