"use client";

import { useEffect, useState, useRef } from 'react';
import { initSocket } from '../../lib/socket';
import MessageInput from './MessageInput';

export default function ChatWindow({ senderId, receiverId }) {
  const [messages, setMessages] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef(null);
  const socket = useRef(null);

  const fetchMessages = async () => {
    try {
      const response = await fetch(
        `/api/messages?senderId=${senderId}&receiverId=${receiverId}`
      );
      const data = await response.json();
      console.log(data) 
      setMessages(data);
      setLoading(false);
      scrollToBottom();
    } catch (error) {
      console.error('Failed to fetch messages:', error);
      setLoading(false);
    }
  };

  useEffect(() => {
    socket.current = initSocket();
    fetchMessages();
    socket.current.on('receiveMessage', handleNewMessage);
    socket.current.on('userTyping', handleUserTyping);

    return () => {
      if (socket.current) {
        socket.current.off('receiveMessage');
        socket.current.off('userTyping');
      }
    };
  }, [senderId, receiverId]);

  const handleNewMessage = (message) => {
    if (
      (message.senderId === senderId && message.receiverId === receiverId) ||
      (message.senderId === receiverId && message.receiverId === senderId)
    ) {
      fetchMessages(); 
    }
  };

  const handleUserTyping = (data) => {
    if (data.senderId === receiverId) {
      setIsTyping(true);
      setTimeout(() => setIsTyping(false), 2000);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto p-4">
        {loading ? (
          <div>Loading messages...</div>
        ) : (
          <>
            {messages.map((message) => (
              <div
                key={message.id}
                className={`text-black font-mono italic my-2 p-2 rounded-lg max-w-[70%] ${
                  message.senderId !== senderId
                    ? 'ml-auto bg-blue-500 text-white'
                    : 'bg-gray-200'
                }`}
              >
                {message.content}
              </div>
            ))}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>
      {isTyping && (
        <div className="px-4 text-sm text-gray-500">User is typing... </div>
      )}
      <MessageInput
        senderId={senderId}
        receiverId={receiverId}
        socket={socket.current}
        onMessageSent={fetchMessages} 
      />
    </div>
  );
}
