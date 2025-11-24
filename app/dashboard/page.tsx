"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/authStore";

// Force dynamic rendering for CometChat
export const dynamic = 'force-dynamic';
import { useCometChat } from "@/app/context/CometChatContext";
import { bookingsApi, paymentsApi, questionnaireApi } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import DashboardSidebar from "@/components/DashboardSidebar";
import BookingDetailsModal from "@/components/BookingDetailsModal";

export default function DashboardPage() {
  const router = useRouter();
  const { isLoggedIn, user, _hasHydrated } = useAuthStore();
  const { isInitialized, isLoggedIn: isCometChatLoggedIn, loginToChat } = useCometChat();
  const [bookings, setBookings] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [questionnaire, setQuestionnaire] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [questionnaireLoading, setQuestionnaireLoading] = useState(false);
  const [activeView, setActiveView] = useState("chat"); // Default to chat
  const [selectedBookingId, setSelectedBookingId] = useState<string | null>(null);
  const [selectedChatUser, setSelectedChatUser] = useState<any | null>(null);
  const [chatUsers, setChatUsers] = useState<any[]>([]);
  const [loadingChatUsers, setLoadingChatUsers] = useState(false);
  const [unreadCounts, setUnreadCounts] = useState<{ [key: string]: number }>({});
  const [showMobileUserList, setShowMobileUserList] = useState(true);
  const [CometChatComponents, setCometChatComponents] = useState<{
    MessageList: React.ComponentType<any> | null;
    MessageComposer: React.ComponentType<any> | null;
  }>({
    MessageList: null,
    MessageComposer: null,
  });

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [bookingsData, paymentsData] = await Promise.all([
        bookingsApi.getMyBookings(),
        paymentsApi.getMyPayments(),
      ]);
      setBookings(bookingsData);
      setPayments(paymentsData);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Wait for Zustand to hydrate before checking auth
    if (!_hasHydrated) {
      return;
    }

    if (!isLoggedIn) {
      router.push("/login");
      return;
    }

    // Redirect admins to admin dashboard
    if (user?.role === "admin") {
      router.push("/admin");
      return;
    }

    fetchData();
  }, [_hasHydrated, isLoggedIn, user, router, fetchData]);

  // Fetch questionnaire when switching to questionnaire view
  const fetchQuestionnaire = useCallback(async () => {
    setQuestionnaireLoading(true);
    try {
      const questionnaireData = await questionnaireApi.getMyQuestionnaire();
      setQuestionnaire(questionnaireData);
    } catch (error: any) {
      // If questionnaire doesn't exist (404), set to null
      if (error?.response?.status === 404) {
        setQuestionnaire(null);
      } else {
        console.error("Error fetching questionnaire:", error);
        setQuestionnaire(null);
      }
    } finally {
      setQuestionnaireLoading(false);
    }
  }, []);

  // Auto-login to CometChat when user is authenticated
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const autoLoginCometChat = async () => {
      if (isLoggedIn && user && isInitialized && !isCometChatLoggedIn) {
        try {
          console.log('🚀 Starting CometChat auto-login for user:', user.id);
          
          // First, try to create the user in CometChat (if they don't exist)
          const createResponse = await fetch('/api/cometchat/user', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              uid: user.id,
              name: user.name,
              avatar: '',
              role: user.role || 'user', // Pass role for filtering
            }),
          });

          if (!createResponse.ok) {
            const errorData = await createResponse.json();
            console.error('❌Failed to create CometChat user:', errorData);
            throw new Error(errorData.message || 'Failed to create user');
          }

          const createData = await createResponse.json();
          console.log('✅ CometChat user created/verified:', createData);

          // Wait a bit for user to be created
          await new Promise(resolve => setTimeout(resolve, 500));

          // Login to CometChat using UID directly (no need for separate auth token)
          console.log('🔑 Logging in to CometChat with UID:', user.id);
          await loginToChat(user.id);
          console.log('✅ Successfully logged into CometChat!');
        } catch (error) {
          console.error('❌ Failed to auto-login to CometChat:', error);
        }
      }
    };

    autoLoginCometChat();
  }, [isLoggedIn, user, isInitialized, isCometChatLoggedIn, loginToChat]);

  // Load CometChat components dynamically (client-side only)
  useEffect(() => {
    if (typeof window !== 'undefined' && activeView === "chat" && isCometChatLoggedIn) {
      import('@cometchat/chat-uikit-react').then((module) => {
        setCometChatComponents({
          MessageList: module.CometChatMessageList,
          MessageComposer: module.CometChatMessageComposer,
        });
      }).catch((error) => {
        console.error('Failed to load CometChat:', error);
      });
    }
  }, [activeView, isCometChatLoggedIn]);

  // Fetch available users for chat
  useEffect(() => {
    if (typeof window !== 'undefined' && activeView === "chat" && isCometChatLoggedIn) {
      const fetchChatUsers = async () => {
        try {
          setLoadingChatUsers(true);
          const { CometChat } = await import('@cometchat/chat-sdk-javascript');
          const usersRequest = new CometChat.UsersRequestBuilder()
            .setLimit(30)
            .build();
          const usersList = await usersRequest.fetchNext();
          
          // Debug: Log all users with their metadata
          console.log('[USER] Total CometChat users fetched:', usersList.length);
          usersList.forEach((u: any) => {
            const metadata = u.getMetadata();
            console.log(`[USER] User: ${u.getName()} (${u.getUid()}) - Role: ${metadata?.role || 'NO METADATA'}`);
          });
          
          // Filter to show ONLY admin users (therapists) - regular users should only chat with admin
          const filteredUsers = usersList.filter((u: any) => {
            const metadata = u.getMetadata();
            const userRole = metadata?.role || 'user';
            const shouldShow = u.getUid() !== user?.id && userRole === 'admin';
            console.log(`[USER] ${u.getName()}: role=${userRole}, shouldShow=${shouldShow}`);
            return shouldShow;
          });
          console.log('[USER] Filtered therapists (admin only):', filteredUsers.length);
          setChatUsers(filteredUsers);

          // Fetch unread message counts
          const unreadPromises = filteredUsers.map(async (u: any) => {
            try {
              const unreadCount = await CometChat.getUnreadMessageCountForUser(u.getUid());
              const count = typeof unreadCount === 'number' ? unreadCount : (unreadCount as any)?.[u.getUid()] || 0;
              return { uid: u.getUid(), count };
            } catch (error) {
              return { uid: u.getUid(), count: 0 };
            }
          });
          const unreadResults = await Promise.all(unreadPromises);
          const unreadMap: { [key: string]: number } = {};
          unreadResults.forEach(result => {
            unreadMap[result.uid] = result.count;
          });
          setUnreadCounts(unreadMap);
        } catch (error) {
          console.error('Error fetching chat users:', error);
        } finally {
          setLoadingChatUsers(false);
        }
      };
      fetchChatUsers();
    }
  }, [activeView, isCometChatLoggedIn, user]);

  // Listen for incoming messages and read receipts (customer side)
  useEffect(() => {
    if (activeView === "chat" && typeof window !== 'undefined' && isCometChatLoggedIn) {
      let listenerID = "customer_message_listener";
      
      const setupMessageListener = async () => {
        try {
          const { CometChat } = await import('@cometchat/chat-sdk-javascript');
          
          CometChat.addMessageListener(
            listenerID,
            new CometChat.MessageListener({
              onTextMessageReceived: (message: any) => {
                console.log('[CUSTOMER] 🔔 New message received from:', message.getSender().getName());
                
                const senderUid = message.getSender().getUid();
                
                // If the message is from the currently selected therapist, mark as read immediately
                if (selectedChatUser && senderUid === selectedChatUser.getUid()) {
                  CometChat.markAsRead(message.getId(), message.getReceiverId(), message.getReceiverType(), message.getSender())
                    .then(() => {
                      console.log('[CUSTOMER] ✅ Auto-marked message as read (chat is open)');
                    })
                    .catch((error: any) => {
                      console.log('[CUSTOMER] Error auto-marking as read:', error);
                    });
                } else {
                  // Update unread count only if chat is not currently open with this therapist
                  setUnreadCounts(prev => ({
                    ...prev,
                    [senderUid]: (prev[senderUid] || 0) + 1
                  }));

                  // Show browser notification
                  if (Notification.permission === "granted") {
                    new Notification(`💬 ${message.getSender().getName()} (Therapist)`, {
                      body: message.getText(),
                      icon: '/icon.png',
                      badge: '/badge.png',
                      tag: 'therapist-message', // Groups notifications
                    });
                  } else if (Notification.permission === "default") {
                    // Request permission if not already asked
                    Notification.requestPermission().then(permission => {
                      console.log('[CUSTOMER] Notification permission:', permission);
                      if (permission === "granted") {
                        new Notification(`💬 ${message.getSender().getName()} (Therapist)`, {
                          body: message.getText(),
                          icon: '/icon.png',
                        });
                      }
                    });
                  }

                  // Play sound notification
                  try {
                    const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBUel5v');
                    audio.volume = 0.5; // Set volume to 50%
                    audio.play().catch(e => console.log('[CUSTOMER] Audio play failed:', e));
                  } catch (e) {
                    console.log('[CUSTOMER] Audio notification failed:', e);
                  }

                  console.log('[CUSTOMER] 🔔 Notification and sound played for message from:', message.getSender().getName());
                }
              },
              onMediaMessageReceived: (message: any) => {
                console.log('[CUSTOMER] 🔔 New media message from:', message.getSender().getName());
                const senderUid = message.getSender().getUid();
                
                // If chat is open with this therapist, mark as read immediately
                if (selectedChatUser && senderUid === selectedChatUser.getUid()) {
                  CometChat.markAsRead(message.getId(), message.getReceiverId(), message.getReceiverType(), message.getSender())
                    .then(() => {
                      console.log('[CUSTOMER] ✅ Auto-marked media as read (chat is open)');
                    })
                    .catch(() => {});
                } else {
                  setUnreadCounts(prev => ({
                    ...prev,
                    [senderUid]: (prev[senderUid] || 0) + 1
                  }));

                  // Show notification for media messages
                  if (Notification.permission === "granted") {
                    new Notification(`💬 ${message.getSender().getName()} (Therapist)`, {
                      body: '📎 Sent a media file',
                      icon: '/icon.png',
                    });
                  }

                  // Play sound
                  try {
                    const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBUel5v');
                    audio.volume = 0.5;
                    audio.play().catch(() => {});
                  } catch (e) {}
                }
              },
              onMessagesRead: (messageReceipt: any) => {
                console.log('[CUSTOMER] ✅ Therapist read your message!', messageReceipt);
              },
              onMessagesDelivered: (messageReceipt: any) => {
                console.log('[CUSTOMER] ✅ Message delivered to therapist', messageReceipt);
              },
            })
          );

          // Request notification permission on first load
          if (Notification.permission === "default") {
            Notification.requestPermission().then(permission => {
              console.log('[CUSTOMER] Notification permission:', permission);
            });
          }
        } catch (error) {
          console.error('[CUSTOMER] Error setting up message listener:', error);
        }
      };

      setupMessageListener();

      return () => {
        import('@cometchat/chat-sdk-javascript').then(({ CometChat }) => {
          CometChat.removeMessageListener(listenerID);
        });
      };
    }
  }, [activeView, isCometChatLoggedIn, selectedChatUser]);

  // Mark messages as read when therapist is selected
  useEffect(() => {
    if (selectedChatUser && isCometChatLoggedIn && activeView === "chat") {
      const markAsRead = async () => {
        try {
          const { CometChat } = await import('@cometchat/chat-sdk-javascript');
          await CometChat.markAsRead(selectedChatUser.getUid(), 'user');
          setUnreadCounts(prev => ({
            ...prev,
            [selectedChatUser.getUid()]: 0
          }));
          console.log('[CUSTOMER] Marked messages as read for:', selectedChatUser.getName());
        } catch (error) {
          console.error('[CUSTOMER] Error marking messages as read:', error);
        }
      };
      const timer = setTimeout(markAsRead, 500);
      return () => clearTimeout(timer);
    }
  }, [selectedChatUser, isCometChatLoggedIn, activeView]);

  // Refetch bookings when switching to bookings view
  useEffect(() => {
    if (activeView === "bookings" || activeView === "sessions") {
      fetchData();
    } else if (activeView === "questionnaire") {
      fetchQuestionnaire();
    }
  }, [activeView, fetchData, fetchQuestionnaire]);

  // Show loading while hydrating
  if (!_hasHydrated) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-secondary to-accent flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-text/70">Loading...</p>
        </div>
      </main>
    );
  }

  if (!isLoggedIn) {
    return null;
  }

  const renderContent = () => {
    switch (activeView) {
      case "chat":
        return (
          <div>
            <div className="mb-4 md:mb-6">
              <h1 className="text-2xl md:text-3xl font-bold text-text mb-2">💬 Chat with Your Therapist</h1>
              <p className="text-text/70 text-sm md:text-base">Connect with your therapist anytime</p>
            </div>
            
            <div className="h-[500px] md:h-[600px] bg-white rounded-2xl shadow-soft overflow-hidden flex flex-col md:flex-row">
              {!isInitialized || !isCometChatLoggedIn ? (
                <div className="flex-1 flex items-center justify-center">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                    <p className="text-text/70">
                      {!isInitialized ? 'Initializing chat...' : 'Logging into chat...'}
                    </p>
                  </div>
                </div>
              ) : (
                <>
                  {/* Users List - Left Side (responsive) */}
                  <div className={`${
                    showMobileUserList || !selectedChatUser ? 'flex' : 'hidden'
                  } md:flex w-full md:w-80 border-b md:border-b-0 md:border-r border-gray-200 flex-col bg-gray-50`}>
                    <div className="p-3 bg-white border-b border-gray-200 flex items-center justify-between">
                      <h3 className="font-semibold text-gray-800 text-sm md:text-base">👥 Available Therapists</h3>
                      {selectedChatUser && (
                        <button
                          onClick={() => setShowMobileUserList(false)}
                          className="md:hidden text-gray-600 hover:text-gray-900"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                    <div className="flex-1 overflow-y-auto">
                      {loadingChatUsers ? (
                        <div className="flex items-center justify-center h-32">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                        </div>
                      ) : chatUsers.length === 0 ? (
                        <div className="p-4 text-center text-gray-500">
                          <p>No therapists available</p>
                        </div>
                      ) : (
                        chatUsers.map((u) => {
                          const unreadCount = unreadCounts[u.uid] || 0;
                          const hasUnread = unreadCount > 0;
                          
                          return (
                            <button
                              key={u.uid}
                              onClick={() => {
                                console.log('✅ Selected therapist:', u.getName());
                                setSelectedChatUser(u);
                                setShowMobileUserList(false); // Hide list on mobile when user is selected
                              }}
                              className={`w-full p-4 border-b border-gray-200 hover:bg-white transition-colors text-left relative ${
                                selectedChatUser?.uid === u.uid 
                                  ? 'bg-white border-l-4 border-l-primary' 
                                  : hasUnread 
                                  ? 'bg-blue-50 border-l-4 border-l-blue-500' 
                                  : ''
                              }`}
                            >
                              <div className="flex items-center gap-3">
                                <div className="relative">
                                  <div className="w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center font-semibold">
                                    {u.getName().charAt(0).toUpperCase()}
                                  </div>
                                  {hasUnread && (
                                    <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold animate-pulse">
                                      {unreadCount > 9 ? '9+' : unreadCount}
                                    </div>
                                  )}
                                </div>
                                <div className="flex-1">
                                  <div className={`font-semibold ${hasUnread ? 'text-gray-900' : 'text-gray-800'}`}>
                                    {u.getName()}
                                    {hasUnread && <span className="ml-2 text-red-500">●</span>}
                                  </div>
                                  <div className="text-xs text-gray-500 flex items-center gap-2">
                                    {u.getStatus() === 'online' ? '🟢 Online' : '⚪ Offline'}
                                    {hasUnread && (
                                      <span className="text-red-500 font-semibold">
                                        • {unreadCount} new
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </button>
                          );
                        })
                      )}
                    </div>
                  </div>

                  {/* Chat Window - Right Side */}
                  <div className={`${
                    showMobileUserList && selectedChatUser ? 'hidden' : 'flex'
                  } md:flex flex-1 flex-col bg-white`}>
                    {!selectedChatUser ? (
                      <div className="flex-1 flex items-center justify-center bg-gray-50">
                        <div className="text-center px-4">
                          <div className="text-4xl md:text-6xl mb-4">💬</div>
                          <h3 className="text-lg md:text-xl font-semibold text-gray-700 mb-2">Select a Therapist</h3>
                          <p className="text-sm md:text-base text-gray-500">Choose someone from the list to start chatting</p>
                        </div>
                      </div>
                    ) : (
                      <div className="flex-1 flex flex-col">
                        {/* Chat Header */}
                        <div className="p-3 md:p-4 border-b border-gray-200 bg-white">
                          <div className="flex items-center gap-2 md:gap-3">
                            {/* Back button for mobile */}
                            <button
                              onClick={() => setShowMobileUserList(true)}
                              className="md:hidden text-gray-600 hover:text-gray-900 p-1"
                            >
                              ←
                            </button>
                            <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-primary text-white flex items-center justify-center font-semibold text-sm md:text-base">
                              {selectedChatUser.getName().charAt(0).toUpperCase()}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="font-semibold text-gray-800 text-sm md:text-base truncate">{selectedChatUser.getName()}</div>
                              <div className="text-xs text-gray-500">
                                {selectedChatUser.getStatus() === 'online' ? '🟢 Online' : '⚪ Offline'}
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Chat Components */}
                        {CometChatComponents.MessageList && CometChatComponents.MessageComposer ? (
                          <>
                            <div className="flex-1 overflow-hidden bg-gray-50">
                              <CometChatComponents.MessageList 
                                user={selectedChatUser}
                                key={`list-${selectedChatUser.uid}`}
                              />
                            </div>
                            <div className="border-t border-gray-200">
                              <CometChatComponents.MessageComposer 
                                user={selectedChatUser}
                                key={`composer-${selectedChatUser.uid}`}
                              />
                            </div>
                          </>
                        ) : (
                          <div className="flex-1 flex items-center justify-center">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        );

      case "bookings":
        return (
          <div>
            <div className="mb-6 flex justify-between items-center">
              <div>
                <h1 className="text-3xl font-bold text-text mb-2">Bookings</h1>
                <p className="text-text/70">Manage your therapy sessions</p>
              </div>
              <Button
                onClick={fetchData}
                disabled={loading}
                variant="outline"
                size="sm"
              >
                {loading ? "Refreshing..." : "Refresh"}
              </Button>
            </div>
          <div className="bg-white rounded-2xl p-8 shadow-soft">
            {loading ? (
              <p className="text-text/70">Loading...</p>
            ) : bookings.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-text/70 mb-4">No bookings yet</p>
                  <Button onClick={() => router.push("/booking")}>
                    Book Your First Session
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {bookings.map((booking) => (
                    <div
                      key={booking.id}
                      className="border-2 border-secondary rounded-xl p-6 hover:border-primary transition-colors"
                    >
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex-1">
                          <span className="font-semibold text-text text-lg">
                            {booking.sessionType === "physical"
                              ? "Physical Session"
                              : "Online Chat"}
                          </span>
                          <p className="text-text/70 text-sm mt-1">
                            {new Date(booking.sessionDate).toLocaleDateString("en-US", {
                              weekday: "long",
                              year: "numeric",
                              month: "long",
                              day: "numeric",
                            })}{" "}
                            at {booking.sessionTime}
                          </p>
                          <p className="text-text/50 text-xs mt-2">
                            Created: {new Date(booking.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          <span
                            className={`px-3 py-1 rounded-full text-sm font-semibold ${
                              booking.status === "confirmed" || booking.status === "completed"
                                ? "bg-primary-lighter text-primary"
                                : booking.status === "pending"
                                ? "bg-yellow-100 text-yellow-700"
                                : "bg-secondary text-text/70"
                            }`}
                          >
                            {booking.status}
                          </span>
                          {booking.paymentStatus && (
                            <span
                              className={`px-3 py-1 rounded-full text-xs font-semibold ${
                                booking.paymentStatus === "paid"
                                  ? "bg-green-100 text-green-700"
                                  : booking.paymentStatus === "not_paid"
                                  ? "bg-red-100 text-red-700"
                                  : booking.paymentStatus === "pending"
                                  ? "bg-yellow-100 text-yellow-700"
                                  : "bg-secondary text-text/70"
                              }`}
                            >
                              {booking.paymentStatus === "not_paid" ? "Not Paid" : booking.paymentStatus}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-3 mt-4">
                        <Button
                          onClick={() => setSelectedBookingId(booking.id)}
                          className="flex-1"
                          size="sm"
                          variant="outline"
                        >
                          View Details
                        </Button>
                        {(booking.paymentStatus === "not_paid" || booking.paymentStatus === "pending") && (
                          <Button
                            onClick={() => {
                              // Store booking ID for payment page
                              setBookings(bookings.map(b => 
                                b.id === booking.id ? { ...b, selected: true } : b
                              ));
                              router.push(`/payment?bookingId=${booking.id}`);
                            }}
                            className="flex-1"
                            size="sm"
                          >
                            Pay Now
                          </Button>
                        )}
                        {(booking.paymentStatus === "paid" || booking.paymentStatus === "completed") && booking.status === "confirmed" && (
                          <Button
                            onClick={() => setActiveView("chat")}
                            className="flex-1"
                            size="sm"
                          >
                            Chat with Therapist
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        );

      case "sessions":
        return (
          <div>
            <div className="mb-6 flex justify-between items-center">
              <div>
                <h1 className="text-3xl font-bold text-text mb-2">Sessions</h1>
                <p className="text-text/70">View your therapy session history</p>
              </div>
              <Button
                onClick={fetchData}
                disabled={loading}
                variant="outline"
                size="sm"
              >
                {loading ? "Refreshing..." : "Refresh"}
              </Button>
            </div>
            <div className="bg-white rounded-2xl p-8 shadow-soft">
              {loading ? (
                <p className="text-text/70">Loading...</p>
              ) : bookings.filter((b) => b.status === "completed" || b.status === "confirmed").length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-text/70">No confirmed or completed sessions yet</p>
                </div>
            ) : (
              <div className="space-y-4">
                {bookings
                    .filter((b) => b.status === "completed" || b.status === "confirmed")
                  .map((booking) => (
                    <div
                      key={booking.id}
                        className="border-2 border-secondary rounded-xl p-6"
                    >
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <span className="font-semibold text-text text-lg">
                          {booking.sessionType === "physical"
                            ? "Physical Session"
                            : "Online Chat"}
                        </span>
                            <p className="text-text/70 text-sm mt-1">
                              {new Date(booking.sessionDate).toLocaleDateString("en-US", {
                                weekday: "long",
                                year: "numeric",
                                month: "long",
                                day: "numeric",
                              })}{" "}
                              at {booking.sessionTime}
                            </p>
                            <p className="text-text/50 text-xs mt-2">
                              Completed: {new Date(booking.updatedAt).toLocaleDateString()}
                            </p>
                          </div>
                          <div className="flex flex-col items-end gap-2">
                        <span className="text-primary text-sm font-semibold">
                          {booking.status}
                        </span>
                            {booking.paymentStatus && (
                              <span
                                className={`px-3 py-1 rounded-full text-xs font-semibold ${
                                  booking.paymentStatus === "paid"
                                    ? "bg-green-100 text-green-700"
                                    : booking.paymentStatus === "not_paid"
                                    ? "bg-red-100 text-red-700"
                                    : booking.paymentStatus === "pending"
                                    ? "bg-yellow-100 text-yellow-700"
                                    : "bg-secondary text-text/70"
                                }`}
                              >
                                {booking.paymentStatus === "not_paid" ? "Not Paid" : booking.paymentStatus}
                              </span>
                            )}
                          </div>
                      </div>
                        <div className="mt-4 flex gap-2">
                          <Button
                            onClick={() => setSelectedBookingId(booking.id)}
                            className="flex-1"
                            size="sm"
                            variant="outline"
                          >
                            View Details
                          </Button>
                          {(booking.paymentStatus === "not_paid" || booking.paymentStatus === "pending") && (
                        <Button
                              onClick={() => {
                                router.push(`/payment?bookingId=${booking.id}`);
                              }}
                              className="flex-1"
                          size="sm"
                        >
                              Pay Now
                        </Button>
                      )}
                        </div>
                    </div>
                  ))}
              </div>
            )}
          </div>
          </div>
        );

      case "payments":
        return (
          <div>
            <div className="mb-6">
              <h1 className="text-3xl font-bold text-text mb-2">Payments</h1>
              <p className="text-text/70">View your payment history</p>
            </div>
          <div className="bg-white rounded-2xl p-8 shadow-soft">
            {loading ? (
              <p className="text-text/70">Loading...</p>
            ) : payments.length === 0 ? (
                <div className="text-center py-12">
              <p className="text-text/70">No payment history</p>
                </div>
            ) : (
              <div className="space-y-4">
                {payments.map((payment) => (
                  <div
                    key={payment.id}
                      className="border-2 border-secondary rounded-xl p-6 hover:border-primary transition-colors"
                    >
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <span className="font-semibold text-text text-lg">
                            {typeof payment.amount === 'number' ? payment.amount.toLocaleString() : parseFloat(payment.amount || '0').toLocaleString()} TZS
                      </span>
                          <p className="text-text/70 text-sm mt-1">
                            {new Date(payment.createdAt).toLocaleDateString("en-US", {
                              weekday: "long",
                              year: "numeric",
                              month: "long",
                              day: "numeric",
                            })}
                          </p>
                          {payment.transactionId && (
                            <p className="text-text/50 text-xs mt-2">
                              Transaction ID: {payment.transactionId}
                            </p>
                          )}
                        </div>
                      <span
                          className={`px-3 py-1 rounded-full text-sm font-semibold ${
                          payment.status === "completed"
                              ? "bg-primary-lighter text-primary"
                              : payment.status === "pending"
                              ? "bg-yellow-100 text-yellow-700"
                              : "bg-secondary text-text/70"
                        }`}
                      >
                        {payment.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        );

      case "questionnaire":
        return (
          <div>
            <div className="mb-6 flex justify-between items-center">
              <div>
                <h1 className="text-3xl font-bold text-text mb-2">My Questionnaire</h1>
                <p className="text-text/70">View and update your therapy preferences</p>
              </div>
              <Button
                onClick={fetchQuestionnaire}
                disabled={questionnaireLoading}
                variant="outline"
                size="sm"
              >
                {questionnaireLoading ? "Refreshing..." : "Refresh"}
              </Button>
            </div>
            <div className="bg-white rounded-2xl p-8 shadow-soft">
              {questionnaireLoading ? (
                <div className="text-center py-12">
                  <p className="text-text/70">Loading questionnaire...</p>
                </div>
              ) : !questionnaire ? (
                <div className="text-center py-12">
                  <p className="text-text/70 mb-6">
                    You haven&apos;t submitted a questionnaire yet. Complete it to help us match you with the best therapist.
                  </p>
                  <Button onClick={() => router.push("/questionnaire")}>
                    Complete Questionnaire
            </Button>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h2 className="text-xl font-semibold text-text">Your Questionnaire</h2>
                      <p className="text-text/70 text-sm mt-1">
                        Submitted: {new Date(questionnaire.createdAt).toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })}
                      </p>
                    </div>
                    <Button onClick={() => router.push("/questionnaire")}>
              Update Questionnaire
            </Button>
                  </div>

                  <div className="space-y-4">
                    {/* Demographics */}
                    {(questionnaire.fullName || questionnaire.ageRange || questionnaire.genderIdentity) && (
                      <div className="p-4 bg-secondary rounded-xl">
                        <h4 className="font-semibold text-text mb-3">Demographics</h4>
                        <div className="grid md:grid-cols-2 gap-3 text-sm">
                          {questionnaire.fullName && (
                            <p className="text-text/70">
                              <strong>Name:</strong> {questionnaire.fullName}
                            </p>
                          )}
                          {questionnaire.ageRange && (
                            <p className="text-text/70">
                              <strong>Age Range:</strong> {questionnaire.ageRange}
                            </p>
                          )}
                          {questionnaire.genderIdentity && (
                            <p className="text-text/70">
                              <strong>Gender:</strong> {questionnaire.genderIdentity}
                            </p>
                          )}
                          {questionnaire.relationshipStatus && (
                            <p className="text-text/70">
                              <strong>Relationship Status:</strong> {questionnaire.relationshipStatus}
                            </p>
                          )}
                          {questionnaire.workOrStudy && (
                            <p className="text-text/70">
                              <strong>Work/Study:</strong> {questionnaire.workOrStudy}
                            </p>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Therapy Information */}
                    {(questionnaire.therapyReasons || questionnaire.therapyGoals || questionnaire.issueDuration) && (
                      <div className="p-4 bg-primary-lighter/30 rounded-xl">
                        <h4 className="font-semibold text-text mb-3">Therapy Information</h4>
                        <div className="space-y-2 text-sm">
                          {questionnaire.therapyReasons && questionnaire.therapyReasons.length > 0 && (
                            <p className="text-text/70">
                              <strong>Reasons:</strong> {questionnaire.therapyReasons.join(", ")}
                            </p>
                          )}
                          {questionnaire.issueDuration && (
                            <p className="text-text/70">
                              <strong>Issue Duration:</strong> {questionnaire.issueDuration}
                            </p>
                          )}
                          {questionnaire.attendedTherapyBefore !== undefined && (
                            <p className="text-text/70">
                              <strong>Previous Therapy:</strong> {questionnaire.attendedTherapyBefore ? "Yes" : "No"}
                            </p>
                          )}
                          {questionnaire.therapyGoals && (
                            <p className="text-text/70">
                              <strong>Goals:</strong> {questionnaire.therapyGoals}
                            </p>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Preferences */}
                    {(questionnaire.sessionPreference || questionnaire.preferredDaysTimes || questionnaire.preferredMethods) && (
                      <div className="p-4 bg-secondary rounded-xl">
                        <h4 className="font-semibold text-text mb-3">Preferences</h4>
                        <div className="space-y-2 text-sm">
                          {questionnaire.sessionPreference && (
                            <p className="text-text/70">
                              <strong>Session Preference:</strong> {questionnaire.sessionPreference}
                            </p>
                          )}
                          {questionnaire.preferredDaysTimes && (
                            <p className="text-text/70">
                              <strong>Preferred Times:</strong> {questionnaire.preferredDaysTimes}
                            </p>
                          )}
                          {questionnaire.preferredMethods && (
                            <p className="text-text/70">
                              <strong>Preferred Methods:</strong> {questionnaire.preferredMethods}
                            </p>
                          )}
                          {questionnaire.comfortLevelSharing !== undefined && (
                            <p className="text-text/70">
                              <strong>Comfort Level (1-5):</strong> {questionnaire.comfortLevelSharing}
                            </p>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Additional Info */}
                    {questionnaire.additionalInfo && (
                      <div className="p-4 bg-secondary rounded-xl">
                        <h4 className="font-semibold text-text mb-2">Additional Information</h4>
                        <p className="text-text/70 text-sm">{questionnaire.additionalInfo}</p>
                      </div>
                    )}
                  </div>

                  <div className="pt-4 border-t border-secondary">
                    <Button onClick={() => router.push("/questionnaire")} className="w-full">
                      Update Questionnaire
              </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-secondary to-accent py-8">
      <div className="container mx-auto px-4 max-w-7xl">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-text">Welcome back, {user?.name}</h1>
        </div>

        <div className="flex flex-col md:flex-row gap-6 md:gap-8">
          {/* Sidebar */}
          <DashboardSidebar activeView={activeView} onViewChange={setActiveView} />

          {/* Main Content */}
          <div className="flex-1 min-w-0">
            {renderContent()}
          </div>
        </div>
      </div>

      {/* Booking Details Modal */}
      <BookingDetailsModal
        bookingId={selectedBookingId}
        onClose={() => setSelectedBookingId(null)}
        onPaymentClick={(bookingId) => {
          router.push(`/payment?bookingId=${bookingId}`);
        }}
      />
    </main>
  );
}

