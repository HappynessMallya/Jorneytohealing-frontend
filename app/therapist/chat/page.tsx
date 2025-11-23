// app/therapist/chat/page.tsx
'use client';

import { CometChatConversations } from '@cometchat/chat-uikit-react';
import { useCometChat } from '@/app/context/CometChatContext';

// Force client-side rendering only
export const dynamic = 'force-dynamic';
export const runtime = 'edge'; // Use edge runtime to skip SSR

export default function TherapistChatPage() {
  const { isLoggedIn, isInitialized } = useCometChat();

  if (!isInitialized) {
    return <div>Loading chat...</div>;
  }

  if (!isLoggedIn) {
    return <div>Please login to access chat</div>;
  }

  return (
    <div className="h-screen w-full">
      <CometChatConversations />
    </div>
  );
}