"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/authStore";
import { useChatStore } from "@/stores/chatStore";
import { chatApi } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function ChatPage() {
  const router = useRouter();
  const { isLoggedIn } = useAuthStore();
  const { chatClient, setChatClient, isConnected } = useChatStore();
  const [hasAccess, setHasAccess] = useState(false);
  const [checking, setChecking] = useState(true);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState("");

  useEffect(() => {
    if (!isLoggedIn) {
      router.push("/login");
      return;
    }

    checkAccess();
  }, [isLoggedIn, router]);

  const checkAccess = async () => {
    try {
      const response = await chatApi.checkAccess();
      setHasAccess(response.hasAccess);
      if (response.hasAccess) {
        // Initialize Stream Chat here
        // For now, we'll use a simple chat interface
        initializeChat();
      }
    } catch (error) {
      console.error("Error checking chat access:", error);
    } finally {
      setChecking(false);
    }
  };

  const initializeChat = async () => {
    // In production, initialize Stream Chat SDK here
    // const StreamChat = require("stream-chat").StreamChat;
    // const client = StreamChat.getInstance(process.env.NEXT_PUBLIC_STREAM_API_KEY);
    // await client.connectUser({ id: user.id, name: user.name }, token);
    // setChatClient(client);
    setChatClient({ initialized: true });
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim()) return;

    // In production, send via Stream Chat
    // For now, just add to local state
    setMessages([...messages, { text: newMessage, sent: true }]);
    setNewMessage("");
  };

  if (checking) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-secondary to-accent flex items-center justify-center">
        <div className="text-text">Checking access...</div>
      </main>
    );
  }

  if (!hasAccess) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-secondary to-accent flex items-center justify-center">
        <div className="bg-white rounded-2xl p-8 shadow-soft max-w-md text-center">
          <h1 className="text-2xl font-bold text-text mb-4">Chat Access Required</h1>
          <p className="text-text/70 mb-6">
            You need to complete a paid booking to access chat.
          </p>
          <Button onClick={() => router.push("/booking")}>Book a Session</Button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-secondary to-accent">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="bg-white rounded-2xl shadow-soft flex flex-col h-[calc(100vh-8rem)]">
          {/* Chat Header */}
          <div className="p-6 border-b border-secondary">
            <h1 className="text-2xl font-bold text-text">Therapy Chat</h1>
            <p className="text-text/70 text-sm">Secure messaging with your therapist</p>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {messages.length === 0 ? (
              <div className="text-center text-text/70 py-8">
                <p>Start a conversation with your therapist</p>
              </div>
            ) : (
              messages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`flex ${msg.sent ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-xs rounded-xl p-4 ${
                      msg.sent
                        ? "bg-primary text-white"
                        : "bg-secondary text-text"
                    }`}
                  >
                    {msg.text}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Message Input */}
          <div className="p-6 border-t border-secondary">
            <div className="flex gap-4">
              <Input
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
                placeholder="Type your message..."
                className="flex-1"
              />
              <Button onClick={handleSendMessage}>Send</Button>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

