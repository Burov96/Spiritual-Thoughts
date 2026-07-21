"use client";

import { useEffect, useState, useRef, useCallback, memo } from 'react';
import MessageInput from './MessageInput';

const MessageItem = memo(({ message, isSender }) => (
  <div
    className={`text-black font-mono italic my-2 p-2 rounded-lg max-w-[70%] ${
      isSender 
        ? 'ml-auto bg-blue-500 text-white' 
        : 'bg-gray-200'
    }`}
  >
    {message.content}
    <div className="text-xs opacity-50">
      {new Date(message.createdAt).toLocaleTimeString()}
    </div>
  </div>
), (prev, next) => 
  prev.message.id === next.message.id && 
  prev.isSender === next.isSender
);

export default function ChatWindow({ senderId, receiverId }) {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isOtherUserTyping, setIsOtherUserTyping] = useState(false);
  const messagesEndRef = useRef(null);
  const prevMessagesRef = useRef([]);

  const fetchMessages = useCallback(async () => {
    try {
      const messagesResponse = await fetch(
        `/api/messages?senderId=${senderId}&receiverId=${receiverId}`
      );
      
      if (!messagesResponse.ok) {
        console.error('Messages response status:', messagesResponse.status);
        return;
      }
  
      const messagesData = await messagesResponse.json();
      setMessages(messagesData);
      
      if (prevMessagesRef.current.length !== messagesData.length) {
        scrollToBottom();
      }
      prevMessagesRef.current = messagesData;
    } catch (error) {
      console.error('Failed to fetch messages:', error);
    } finally {
      setLoading(false);
    }
  }, [senderId, receiverId]);
  
  
  const checkTypingStatus = useCallback(async () => {
    try {
      const response = await fetch(`/api/messages/typing?senderId=${receiverId}`);
      if (response.ok) {
        const data = await response.json();
        setIsOtherUserTyping(data.isTyping);
      }
    } catch (error) {
      console.error('Failed to check typing status:', error);
    }
  }, [receiverId]);
  
  

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);
  

  useEffect(() => {
    fetchMessages();
    const messageInterval = setInterval(fetchMessages, 20000);
    const typingInterval = setInterval(checkTypingStatus, 10000);
    
    return () => {
      clearInterval(messageInterval);
      clearInterval(typingInterval);
    };
  }, [fetchMessages, checkTypingStatus]);
  

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto p-4">
        {loading ? (
          <div>Loading messages...</div>
        ) : (
          <>
            {messages.map((message) => (
              <MessageItem
                key={message.id}
                message={message}
                isSender={message.senderId === senderId}
              />
            ))}
            {isOtherUserTyping && (
              <div className="text-gray-500 text-sm italic">
                User is typing...
              </div>
            )}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>
      <MessageInput
        senderId={senderId}
        receiverId={receiverId}
        onMessageSent={fetchMessages}
      />
    </div>
  );
}
