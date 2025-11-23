// app/therapist/chat/page.tsx
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';

// Force client-side rendering only
export const dynamic = 'force-dynamic';

export default function TherapistChatPage() {
  const router = useRouter();
  const { isLoggedIn, user } = useAuthStore();
  
  // Redirect non-therapist users
  useEffect(() => {
    if (!isLoggedIn || (user && user.role !== 'admin')) {
      router.push('/login');
    }
  }, [isLoggedIn, user, router]);

  // Show a message to use the admin dashboard instead
  return (
    <div className="min-h-screen bg-gradient-to-b from-secondary to-accent flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-soft p-8 max-w-md text-center">
        <div className="text-6xl mb-4">💬</div>
        <h1 className="text-2xl font-bold text-text mb-4">Therapist Chat</h1>
        <p className="text-text/70 mb-6">
          Please use the Admin Dashboard to access the chat feature with full functionality.
        </p>
        <button
          onClick={() => router.push('/admin')}
          className="px-6 py-3 bg-primary text-white rounded-xl font-semibold hover:bg-primary-hover transition-colors"
        >
          Go to Admin Dashboard
        </button>
      </div>
    </div>
  );
}
