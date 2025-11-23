// contexts/CometChatContext.tsx
'use client';

import { createContext, useContext, useEffect, useState } from 'react';

interface CometChatContextType {
  isInitialized: boolean;
  isLoggedIn: boolean;
  currentUser: any | null;
  loginToChat: (uid: string) => Promise<void>;
  logoutFromChat: () => Promise<void>;
}

const CometChatContext = createContext<CometChatContextType | undefined>(undefined);

export function CometChatProvider({ children }: { children: React.ReactNode }) {
  const [isInitialized, setIsInitialized] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentUser, setCurrentUser] = useState<any | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  useEffect(() => {
    // Only run on client side
    if (typeof window === 'undefined') {
      return;
    }

    const initialize = async () => {
      try {
        console.log('🚀 Initializing CometChat...');
        const { initCometChat } = await import('@/lib/cometchat-init');
        await initCometChat();
        console.log('✅ CometChat initialized successfully');
        setIsInitialized(true);
        
        // Check if user is already logged in
        const { CometChat } = await import('@cometchat/chat-sdk-javascript');
        const user = await CometChat.getLoggedinUser();
        if (user) {
          console.log('✅ Found existing CometChat user session:', user.getUid());
          setIsLoggedIn(true);
          setCurrentUser(user);
        } else {
          console.log('ℹ️ No existing CometChat user session');
        }
      } catch (error) {
        console.error('❌ CometChat initialization failed:', error);
      }
    };

    initialize();
  }, []);

  const loginToChat = async (uid: string) => {
    if (typeof window === 'undefined') {
      return;
    }

    // Prevent duplicate login attempts
    if (isLoggingIn) {
      console.log('⚠️ Login already in progress, skipping...');
      return;
    }

    try {
      setIsLoggingIn(true);
      console.log('🔐 Attempting CometChat login with UID:', uid);
      
      const { CometChat } = await import('@cometchat/chat-sdk-javascript');
      const authKey = process.env.NEXT_PUBLIC_COMETCHAT_AUTH_KEY || 'a9872929281e6788d558b02a78db2dc306e02786';
      
      // Sanitize UID to match what was used during user creation
      const sanitizedUid = uid.replace(/-/g, '_');
      console.log('🔐 Sanitized UID:', sanitizedUid);
      console.log('🔐 Using auth key:', authKey.substring(0, 10) + '...');
      
      // Use CometChat SDK login with UID and AUTH_KEY
      const user = await CometChat.login(sanitizedUid, authKey);
      
      console.log('✅ CometChat login successful! User UID:', user.getUid());
      console.log('✅ User name:', user.getName());
      setIsLoggedIn(true);
      setCurrentUser(user);
    } catch (error: any) {
      // Ignore "already logged in" or "login in progress" errors
      if (error.code === 'ERR_UID_ALREADY_LOGGED_IN' || error.name === 'LOGIN_IN_PROGRESS') {
        console.log('ℹ️ Already logged in or login in progress, ignoring error');
        return;
      }
      console.error('❌ CometChat login failed:', error);
      console.error('❌ Failed with UID:', uid);
      throw error;
    } finally {
      setIsLoggingIn(false);
    }
  };

  const logoutFromChat = async () => {
    if (typeof window === 'undefined') {
      return;
    }

    try {
      const { CometChat } = await import('@cometchat/chat-sdk-javascript');
      await CometChat.logout();
      setIsLoggedIn(false);
      setCurrentUser(null);
      console.log('✅ CometChat logout successful');
    } catch (error) {
      console.error('❌ CometChat logout failed:', error);
      throw error;
    }
  };

  return (
    <CometChatContext.Provider
      value={{ isInitialized, isLoggedIn, currentUser, loginToChat, logoutFromChat }}
    >
      {children}
    </CometChatContext.Provider>
  );
}

export const useCometChat = () => {
  const context = useContext(CometChatContext);
  if (!context) {
    throw new Error('useCometChat must be used within CometChatProvider');
  }
  return context;
};