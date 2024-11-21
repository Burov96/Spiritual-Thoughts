"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useNotification } from "../NotificationProvider";
import ChatWindow from "../components/ChatWindow";
import { Loading } from "../components/Loading";
import { useNavigation } from "../context/NavigationContext";
import { PageWrapper } from "../components/PageWrapper";
import Image from "next/image";


export default function ChatPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { showNotification } = useNotification();
  const [activeChat, setActiveChat] = useState(null);
  const [chatUsers, setChatUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const { direction } = useNavigation();


  useEffect(() => {
    if (status === "unauthenticated") {
      showNotification("Please login first", "failure");
      router.push("/auth/signin");
      return;
    }

    const fetchChatUsers = async () => {
      try {
        const response = await fetch(`/api/messages/users?userId=${session?.user?.id}`);
        const data = await response.json();
        setChatUsers(data);
        setLoading(false);
      } catch (error) {
        console.error("Failed to fetch chat users:", error);
        showNotification("Failed to load chats", "failure");
        setLoading(false);
      }
    };

    if (session?.user?.id) {
      fetchChatUsers();
    }
  }, [activeChat, session, status, router, showNotification]);

  const handleChatSelect = (userId) => {
    setActiveChat(userId);
    // Mark messages as read when opening chat
    fetch("/api/messages/mark-as-read", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        userId: session.user.id,
        senderId: userId,
      }),
    });
  };

  if (loading) {
    return (
      <PageWrapper direction={direction}>
      <Loading />
      </PageWrapper>
      );
  }

  return (
    <PageWrapper direction={direction}>
    <div className="flex h-90 max-h-[30 rem]">
      {/* Sidebar with chat users */}
      <div className="w-1/4 border-r border-gray-200 p-4">
        <h2 className="text-xl font-bold mb-4">Chats</h2>
        <div className="space-y-2">
          {chatUsers.map((user) => (
            <div
              key={user.id}
              onClick={() => handleChatSelect(user.id)}
              className={`p-3 rounded-lg cursor-pointer transition-colors ${
                activeChat === user.id
                  ? "bg-blue-500 text-white"
                  : "hover:bg-opacity-20 hover:bg-gray-500"
              }`}
            >
              <div className="flex items-center space-x-3">
                  <Image
                  width={20}
                  height={20}
                    src={user.profilePicture || "/images/user.png"}
                    alt={user.name}
                    className="w-10 h-10 rounded-full"
                  />
                
                <div>
                    <div className="flex items-center space-x-12">

                  <p className="font-semibold">{user.name}</p>
                  {user.unreadCount > 0 && (
                      <span className="bg-red-500 text-white px-2 py-1 rounded-full text-xs">
                      {user.unreadCount}
                    </span>
                  )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Main chat window */}
      <div className="flex-1">
        {activeChat ? (
          <ChatWindow
            senderId={session.user.id*1}
            receiverId={activeChat}
          />
        ) : (
          <div className="h-full flex items-center justify-center text-gray-500">
            Select a chat to start messaging
          </div>
        )}
      </div>
    </div>
    </PageWrapper>
  );
}
