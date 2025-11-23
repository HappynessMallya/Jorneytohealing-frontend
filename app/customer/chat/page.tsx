// app/customer/chat/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useCometChat } from '@/app/context/CometChatContext';
import { useAuthStore } from '@/stores/authStore';
import { CometChat } from '@cometchat/chat-sdk-javascript';

// Force client-side rendering only
export const dynamic = 'force-dynamic';
export const runtime = 'edge'; // Use edge runtime to skip SSR

export default function CustomerChatPage() {
  const { isLoggedIn: isCometChatLoggedIn, isInitialized } = useCometChat();
  const { isLoggedIn: isAppLoggedIn, user } = useAuthStore();
  const [error, setError] = useState<string | null>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [selectedUser, setSelectedUser] = useState<any | null>(null);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [CometChatComponents, setCometChatComponents] = useState<{
    MessageHeader: React.ComponentType<any> | null;
    MessageList: React.ComponentType<any> | null;
    MessageComposer: React.ComponentType<any> | null;
  }>({
    MessageHeader: null,
    MessageList: null,
    MessageComposer: null,
  });

  useEffect(() => {
    console.log('Customer Chat Page - Status:', {
      isInitialized,
      isCometChatLoggedIn,
      isAppLoggedIn,
      user: user?.name || 'No user'
    });
  }, [isInitialized, isCometChatLoggedIn, isAppLoggedIn, user]);

  // Load CometChat components dynamically
  useEffect(() => {
    if (isCometChatLoggedIn && typeof window !== 'undefined') {
      console.log('🔵 [DEBUG] Loading CometChat components...');
      import('@cometchat/chat-uikit-react').then((module) => {
        console.log('✅ [DEBUG] CometChat module loaded:', Object.keys(module).filter(k => k.includes('Message')));
        console.log('✅ [DEBUG] MessageList exists:', !!module.CometChatMessageList);
        console.log('✅ [DEBUG] MessageComposer exists:', !!module.CometChatMessageComposer);
        setCometChatComponents({
          MessageHeader: module.CometChatMessageHeader,
          MessageList: module.CometChatMessageList,
          MessageComposer: module.CometChatMessageComposer,
        });
        console.log('✅ [DEBUG] Components set successfully');
      }).catch((error) => {
        console.error('❌ [DEBUG] Failed to load CometChat components:', error);
        setError('Failed to load chat interface');
      });
    }
  }, [isCometChatLoggedIn]);

  // Fetch all users
  useEffect(() => {
    if (isCometChatLoggedIn && typeof window !== 'undefined') {
      const fetchUsers = async () => {
        try {
          console.log('🔵 [DEBUG] Starting to fetch users...');
          setLoadingUsers(true);
          const limit = 30;
          const usersRequest = new CometChat.UsersRequestBuilder()
            .setLimit(limit)
            .build();
          
          const usersList = await usersRequest.fetchNext();
          console.log('✅ [DEBUG] Fetched users count:', usersList.length);
          console.log('✅ [DEBUG] Users list:', usersList);
          console.log('✅ [DEBUG] First user:', usersList[0]);
          setUsers(usersList);
        } catch (error) {
          console.error('❌ [DEBUG] Error fetching users:', error);
          setError('Failed to load users');
        } finally {
          setLoadingUsers(false);
          console.log('🔵 [DEBUG] Loading users completed');
        }
      };

      fetchUsers();
    } else {
      console.log('⚠️ [DEBUG] Not fetching users. isCometChatLoggedIn:', isCometChatLoggedIn, 'window:', typeof window);
    }
  }, [isCometChatLoggedIn]);

  if (!isAppLoggedIn) {
    return (
      <div className="flex items-center justify-center h-screen bg-gradient-to-b from-secondary to-accent">
        <div className="text-center p-8 bg-white rounded-2xl shadow-soft max-w-md">
          <h2 className="text-2xl font-bold text-text mb-4">Authentication Required</h2>
          <p className="text-text/70 mb-6">Please login to your account to access the chat.</p>
          <a href="/login" className="px-6 py-3 bg-primary text-white rounded-xl font-semibold hover:bg-primary-hover transition-colors inline-block">
            Go to Login
          </a>
        </div>
      </div>
    );
  }

  if (!isInitialized) {
    return (
      <div className="flex items-center justify-center h-screen bg-gradient-to-b from-secondary to-accent">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-primary mx-auto mb-4"></div>
          <p className="text-text/70 text-lg">Initializing CometChat...</p>
          <p className="text-text/50 text-sm mt-2">This may take a moment</p>
        </div>
      </div>
    );
  }

  if (!isCometChatLoggedIn) {
    return (
      <div className="flex items-center justify-center h-screen bg-gradient-to-b from-secondary to-accent">
        <div className="text-center p-8 bg-white rounded-2xl shadow-soft max-w-md">
          <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-primary mx-auto mb-4"></div>
          <h2 className="text-2xl font-bold text-text mb-2">Connecting to Chat...</h2>
          <p className="text-text/70 mb-4">Setting up your chat session</p>
          <p className="text-text/50 text-sm">If this takes too long, try refreshing the page</p>
          {error && (
            <div className="mt-4 p-4 bg-red-50 border-2 border-red-200 rounded-xl text-red-700 text-sm">
              {error}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen w-full bg-gradient-to-b from-secondary to-accent p-4">
      <div className="h-full max-w-7xl mx-auto">
        <div className="bg-white rounded-2xl shadow-soft h-full overflow-hidden flex flex-col">
          {/* Header */}
          <div className="p-4 border-b border-gray-200">
            <h1 className="text-2xl font-bold text-gray-800">💬 Chat with Therapist</h1>
            <p className="text-sm text-gray-600">Click on a therapist to start chatting</p>
          </div>

          {/* Split View */}
          <div className="flex-1 flex overflow-hidden">
            {/* Users List - Left Side */}
            <div className="w-80 border-r border-gray-200 flex flex-col bg-gray-50">
              <div className="p-3 bg-white border-b border-gray-200">
                <h2 className="font-semibold text-gray-800">👥 Available Users</h2>
              </div>
              <div className="flex-1 overflow-y-auto">
                {loadingUsers ? (
                  <div className="flex items-center justify-center h-32">
                    <div className="text-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
                      <p className="text-sm text-gray-600">Loading...</p>
                    </div>
                  </div>
                ) : users.length === 0 ? (
                  <div className="p-4 text-center text-gray-500">
                    <p>No users found</p>
                  </div>
                ) : (
                  users.map((u, index) => (
                    <button
                      key={u.uid}
                      onClick={(e) => {
                        console.log('🔵 [DEBUG] ========== USER CLICK ==========');
                        console.log('🔵 [DEBUG] Click event fired on user:', u.getName());
                        console.log('🔵 [DEBUG] User UID:', u.uid);
                        console.log('🔵 [DEBUG] User object:', u);
                        console.log('🔵 [DEBUG] Event target:', e.target);
                        console.log('🔵 [DEBUG] Index:', index);
                        console.log('🔵 [DEBUG] Current selectedUser before:', selectedUser?.uid || 'none');
                        setSelectedUser(u);
                        console.log('🔵 [DEBUG] setSelectedUser called with:', u.getName());
                        console.log('🔵 [DEBUG] ====================================');
                      }}
                      className={`w-full p-4 border-b border-gray-200 hover:bg-white transition-colors text-left ${
                        selectedUser?.uid === u.uid ? 'bg-white border-l-4 border-l-primary' : ''
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center font-semibold">
                          {u.getName().charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1">
                          <div className="font-semibold text-gray-800">{u.getName()}</div>
                          <div className="text-xs text-gray-500">{u.getStatus() === 'online' ? '🟢 Online' : '⚪ Offline'}</div>
                        </div>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>

            {/* Chat Window - Right Side */}
            <div className="flex-1 flex flex-col bg-white">
              {/* DEBUG INFO */}
              <div className="p-2 bg-yellow-100 border-b border-yellow-300 text-xs">
                <strong>🔍 DEBUG:</strong> selectedUser = {selectedUser ? `${selectedUser.getName()} (${selectedUser.uid})` : 'NULL'} | 
                Components loaded = {CometChatComponents.MessageList ? 'YES' : 'NO'}
              </div>

              {!selectedUser ? (
                <div className="flex-1 flex items-center justify-center bg-gray-50">
                  <div className="text-center">
                    <div className="text-6xl mb-4">💬</div>
                    <h3 className="text-xl font-semibold text-gray-700 mb-2">Select a User to Start Chatting</h3>
                    <p className="text-gray-500">Choose someone from the list on the left</p>
                    <p className="text-xs text-gray-400 mt-4">DEBUG: Users count = {users.length}</p>
                  </div>
                </div>
              ) : (
                <div className="flex-1 flex flex-col">
                  {/* Chat Header */}
                  <div className="p-4 border-b border-gray-200 bg-white">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center font-semibold">
                        {selectedUser.getName().charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="font-semibold text-gray-800">{selectedUser.getName()}</div>
                        <div className="text-xs text-gray-500">{selectedUser.getStatus() === 'online' ? '🟢 Online' : '⚪ Offline'}</div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Chat Components */}
                  <div className="flex-1 flex flex-col overflow-hidden">
                    {(() => {
                      console.log('🔵 [DEBUG] Rendering chat area for user:', selectedUser.getName());
                      console.log('🔵 [DEBUG] Components available:', {
                        MessageHeader: !!CometChatComponents.MessageHeader,
                        MessageList: !!CometChatComponents.MessageList,
                        MessageComposer: !!CometChatComponents.MessageComposer
                      });
                      return null;
                    })()}
                    {CometChatComponents.MessageList && CometChatComponents.MessageComposer ? (
                      <>
                        <div className="p-2 bg-green-100 text-xs">
                          ✅ Components loaded! Rendering chat for {selectedUser.getName()}
                        </div>
                        {/* Message List */}
                        <div className="flex-1 overflow-hidden bg-gray-50">
                          <CometChatComponents.MessageList 
                            user={selectedUser}
                            key={`list-${selectedUser.uid}`}
                          />
                        </div>
                        {/* Message Composer */}
                        <div className="border-t border-gray-200">
                          <CometChatComponents.MessageComposer 
                            user={selectedUser}
                            key={`composer-${selectedUser.uid}`}
                          />
                        </div>
                      </>
                    ) : (
                      <div className="h-full flex items-center justify-center">
                        <div className="text-center">
                          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                          <p className="text-gray-600">Loading chat components...</p>
                          <p className="text-xs text-gray-400 mt-2">
                            MessageList: {CometChatComponents.MessageList ? '✅' : '❌'} | 
                            MessageComposer: {CometChatComponents.MessageComposer ? '✅' : '❌'}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {error && (
                <div className="p-4 bg-red-50 border-2 border-red-200 rounded-xl text-red-700 text-sm m-4">
                  {error}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}