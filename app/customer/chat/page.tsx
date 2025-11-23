// app/customer/chat/page.tsx
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';

// Force client-side rendering only  
export const dynamic = 'force-dynamic';

export default function CustomerChatPage() {
  const router = useRouter();
  const { isLoggedIn, user } = useAuthStore();
  
  // Redirect to dashboard where chat is available
  useEffect(() => {
    if (!isLoggedIn) {
      router.push('/login');
    } else {
      // Redirect to dashboard with chat tab
      router.push('/dashboard');
    }
  }, [isLoggedIn, router]);

  // Show a message while redirecting
  return (
    <div className="min-h-screen bg-gradient-to-b from-secondary to-accent flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-soft p-8 max-w-md text-center">
        <div className="text-6xl mb-4">💬</div>
        <h1 className="text-2xl font-bold text-text mb-4">Customer Chat</h1>
        <p className="text-text/70 mb-6">
          Redirecting you to your dashboard where you can access the chat feature...
        </p>
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
      </div>
    </div>
  );
}
