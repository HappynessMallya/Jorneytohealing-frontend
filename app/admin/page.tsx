"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/authStore";

// Force dynamic rendering for CometChat
export const dynamic = 'force-dynamic';
import { usePostsStore } from "@/stores/postsStore";
import { useCometChat } from "@/app/context/CometChatContext";
import { postsApi, adminApi } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { Input, Textarea, Label } from "@/components/ui/input";
import BookingDetailsModal from "@/components/BookingDetailsModal";

export default function AdminPage() {
  const router = useRouter();
  const { isLoggedIn, user, _hasHydrated } = useAuthStore();
  const { isInitialized, isLoggedIn: isCometChatLoggedIn, loginToChat } = useCometChat();
  const [activeTab, setActiveTab] = useState("dashboard");
  const [stats, setStats] = useState<any>(null);
  const [clients, setClients] = useState<any[]>([]);
  const [posts, setPosts] = useState<any[]>([]);
  const [publishedPostsCount, setPublishedPostsCount] = useState<number>(0);
  const [bookings, setBookings] = useState<any[]>([]);
  const [upcomingBookings, setUpcomingBookings] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [questionnaires, setQuestionnaires] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [selectedBookingId, setSelectedBookingId] = useState<string | null>(null);
  const [bookingsLoading, setBookingsLoading] = useState(false);
  const [upcomingBookingsLoading, setUpcomingBookingsLoading] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);
  const [selectedChatUser, setSelectedChatUser] = useState<any | null>(null);
  const [chatUsers, setChatUsers] = useState<any[]>([]);
  const [loadingChatUsers, setLoadingChatUsers] = useState(false);
  const [unreadCounts, setUnreadCounts] = useState<{ [key: string]: number }>({});
  const [showMobileUserList, setShowMobileUserList] = useState(true);
  const [forceRefreshKey, setForceRefreshKey] = useState(0);
  const [CometChatComponents, setCometChatComponents] = useState<{
    MessageList: React.ComponentType<any> | null;
    MessageComposer: React.ComponentType<any> | null;
  }>({
    MessageList: null,
    MessageComposer: null,
  });

  useEffect(() => {
    // Wait for Zustand to hydrate before checking auth
    if (!_hasHydrated) {
      return;
    }

    // Check authentication status
    if (checkingAuth) {
      if (!isLoggedIn) {
        router.push("/login");
        return;
      }
      if (user?.role !== "admin") {
        router.push("/dashboard");
        return;
      }
      setCheckingAuth(false);
    }

    if (isLoggedIn && user?.role === "admin" && !checkingAuth) {
      fetchDashboardStats();
      // Load initial data for tabs
      fetchClients();
      fetchBookings();
      fetchUpcomingBookings();
      fetchPayments();
      fetchPublishedPostsCount();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [_hasHydrated, isLoggedIn, user, router, checkingAuth]);

  const fetchDashboardStats = async () => {
    try {
      const stats = await adminApi.getDashboardStats();
      setStats(stats);
    } catch (error) {
      console.error("Error fetching stats:", error);
      // Don't set stats if API fails - will calculate from loaded data in UI
      setStats(null);
    } finally {
      setLoading(false);
    }
  };

  const fetchClients = async () => {
    try {
      const clients = await adminApi.getClients();
      setClients(clients);
    } catch (error) {
      console.error("Error fetching clients:", error);
      // Keep empty array if API fails
      setClients([]);
    }
  };

  const fetchPosts = async () => {
    try {
      // GET /posts - gets all posts (both published and unpublished)
      const posts = await postsApi.getAll();
      setPosts(posts);
      // Update Zustand store
      const { setPosts: setPostsInStore } = usePostsStore.getState();
      setPostsInStore(posts);
    } catch (error) {
      console.error("Error fetching posts:", error);
    }
  };

  const fetchPublishedPostsCount = async () => {
    try {
      // GET /posts?published=true - gets only published posts
      const publishedPosts = await postsApi.getAll(true);
      setPublishedPostsCount(publishedPosts.length);
    } catch (error) {
      console.error("Error fetching published posts count:", error);
      // Fallback to counting from all posts if available
      if (posts.length > 0) {
        setPublishedPostsCount(posts.filter(p => p.published).length);
      }
    }
  };

  const fetchBookings = async () => {
    setBookingsLoading(true);
    try {
      const bookings = await adminApi.getAllBookings();
      setBookings(bookings);
    } catch (error) {
      console.error("Error fetching bookings:", error);
      // Keep empty array if API fails
      setBookings([]);
    } finally {
      setBookingsLoading(false);
    }
  };

  const fetchUpcomingBookings = async () => {
    setUpcomingBookingsLoading(true);
    try {
      const upcoming = await adminApi.getUpcomingBookings();
      setUpcomingBookings(upcoming);
    } catch (error) {
      console.error("Error fetching upcoming bookings:", error);
      setUpcomingBookings([]);
    } finally {
      setUpcomingBookingsLoading(false);
    }
  };

  const handleUpdateBookingStatus = async (bookingId: string, status: string) => {
    setUpdatingStatus(bookingId);
    try {
      const updatedBooking = await adminApi.updateBookingStatus(bookingId, status);
      // Update the booking in the bookings list
      setBookings(bookings.map(b => b.id === bookingId ? updatedBooking : b));
      // Update in upcoming bookings if it exists there
      setUpcomingBookings(upcomingBookings.map(b => b.id === bookingId ? updatedBooking : b));
      // Refresh both lists
      await Promise.all([fetchBookings(), fetchUpcomingBookings()]);
    } catch (error: any) {
      console.error("Error updating booking status:", error);
      alert(error?.response?.data?.message || "Failed to update booking status");
    } finally {
      setUpdatingStatus(null);
    }
  };

  const fetchPayments = async () => {
    try {
      const payments = await adminApi.getAllPayments();
      setPayments(payments);
    } catch (error) {
      console.error("Error fetching payments:", error);
      // Keep empty array if API fails
      setPayments([]);
    }
  };

  const fetchQuestionnaires = async () => {
    try {
      const questionnaires = await adminApi.getAllQuestionnaires();
      setQuestionnaires(questionnaires);
    } catch (error) {
      console.error("Error fetching questionnaires:", error);
      setQuestionnaires([]);
    }
  };

  // Auto-login to CometChat when admin is authenticated
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const autoLoginCometChat = async () => {
      if (isLoggedIn && user && user.role === 'admin' && isInitialized && !isCometChatLoggedIn) {
        try {
          console.log('🚀 [ADMIN] Starting CometChat auto-login for admin:', user.id);
          console.log('🚀 [ADMIN] User role from store:', user.role);
          
          // Create admin user in CometChat (if they don't exist)
          const createResponse = await fetch('/api/cometchat/user', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              uid: user.id,
              name: user.name,
              avatar: '',
              role: 'admin', // ALWAYS 'admin' for admin users
            }),
          });
          
          console.log('🚀 [ADMIN] CometChat user creation response status:', createResponse.status);

          if (!createResponse.ok) {
            const errorData = await createResponse.json();
            console.error('❌ [ADMIN] Failed to create CometChat user:', errorData);
            throw new Error(errorData.message || 'Failed to create user');
          }

          const createData = await createResponse.json();
          console.log('✅ [ADMIN] CometChat user created/verified:', createData);

          // Wait a bit for user to be created
          await new Promise(resolve => setTimeout(resolve, 500));

          // Login to CometChat using UID directly
          console.log('🔑 [ADMIN] Logging in to CometChat with UID:', user.id);
          await loginToChat(user.id);
          console.log('✅ [ADMIN] Successfully logged into CometChat!');
        } catch (error) {
          console.error('❌ [ADMIN] Failed to auto-login to CometChat:', error);
        }
      }
    };

    autoLoginCometChat();
  }, [isLoggedIn, user, isInitialized, isCometChatLoggedIn, loginToChat]);

  useEffect(() => {
    if (activeTab === "clients") fetchClients();
    if (activeTab === "posts") fetchPosts();
    if (activeTab === "bookings") {
      fetchBookings();
      fetchUpcomingBookings();
    }
    if (activeTab === "sessions") {
      fetchBookings();
      fetchUpcomingBookings();
    }
    if (activeTab === "payments") fetchPayments();
    if (activeTab === "questionnaires") fetchQuestionnaires();
    
    // Load CometChat components dynamically when chat tab is active
    if (activeTab === "chat" && typeof window !== 'undefined' && isCometChatLoggedIn) {
      import('@cometchat/chat-uikit-react').then((module) => {
        setCometChatComponents({
          MessageList: module.CometChatMessageList,
          MessageComposer: module.CometChatMessageComposer,
        });
      }).catch((error) => {
        console.error('Failed to load CometChat:', error);
      });
    }
  }, [activeTab, isCometChatLoggedIn]);

  // Fetch available users for chat when chat tab is active
  useEffect(() => {
    if (activeTab === "chat" && typeof window !== 'undefined' && isCometChatLoggedIn) {
      const fetchChatUsers = async () => {
        try {
          setLoadingChatUsers(true);
          const { CometChat } = await import('@cometchat/chat-sdk-javascript');
          
          console.log('[ADMIN] 🔍 Fetching users from CometChat (attempt:', forceRefreshKey, ')');
          
          // If this is the first fetch (forceRefreshKey === 0), wait longer for metadata to propagate
          if (forceRefreshKey === 0) {
            console.log('[ADMIN] ⏳ First load - waiting 3 seconds for metadata propagation...');
            await new Promise(resolve => setTimeout(resolve, 3000));
          }
          
          const usersRequest = new CometChat.UsersRequestBuilder()
            .setLimit(30)
            .build();
          const usersList = await usersRequest.fetchNext();
          
          // Force refresh each user's metadata from server
          console.log('[ADMIN] 📡 Fetching fresh metadata for each user...');
          const usersWithFreshMetadata = await Promise.all(
            usersList.map(async (u: any) => {
              try {
                // Fetch the user again to get fresh metadata from server
                const freshUser = await CometChat.getUser(u.getUid());
                return freshUser;
              } catch (error) {
                console.warn(`[ADMIN] Could not refresh metadata for ${u.getName()}:`, error);
                return u;
              }
            })
          );
          
          // Debug: Log all users with their metadata
          console.log('[ADMIN] Total CometChat users fetched:', usersWithFreshMetadata.length);
          usersWithFreshMetadata.forEach((u: any) => {
            const metadata = u.getMetadata();
            console.log(`[ADMIN] User: ${u.getName()} (${u.getUid()}) - Role: ${metadata?.role || 'NO METADATA'}`);
          });
          
          // Filter to show ONLY regular users (patients) - admin should only see non-admin users
          const filteredUsers = usersWithFreshMetadata.filter((u: any) => {
            const metadata = u.getMetadata();
            const userRole = metadata?.role || 'user';
            const shouldShow = u.getUid() !== user?.id && userRole !== 'admin';
            console.log(`[ADMIN] ${u.getName()}: role=${userRole}, shouldShow=${shouldShow}`);
            return shouldShow;
          });
          console.log('[ADMIN] Filtered patients (non-admin users):', filteredUsers.length);
          setChatUsers(filteredUsers);

          // Fetch unread message counts for each user
          const unreadPromises = filteredUsers.map(async (u: any) => {
            try {
              const unreadCount = await CometChat.getUnreadMessageCountForUser(u.getUid());
              // Handle both number and object responses
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
          console.log('[ADMIN] Unread counts:', unreadMap);
        } catch (error) {
          console.error('[ADMIN] Error fetching chat users:', error);
        } finally {
          setLoadingChatUsers(false);
        }
      };
      fetchChatUsers();
    }
  }, [activeTab, isCometChatLoggedIn, user, forceRefreshKey]);

  // Listen for incoming messages and update unread counts
  useEffect(() => {
    if (activeTab === "chat" && typeof window !== 'undefined' && isCometChatLoggedIn) {
      let listenerID = "admin_message_listener";
      
      const setupMessageListener = async () => {
        try {
          const { CometChat } = await import('@cometchat/chat-sdk-javascript');
          
          CometChat.addMessageListener(
            listenerID,
            new CometChat.MessageListener({
              onTextMessageReceived: (message: any) => {
                console.log('[ADMIN] 🔔 New message received from:', message.getSender().getName());
                
                const senderUid = message.getSender().getUid();
                
                // If the message is from the currently selected user, mark as read immediately
                if (selectedChatUser && senderUid === selectedChatUser.getUid()) {
                  CometChat.markAsRead(message.getId(), message.getReceiverId(), message.getReceiverType(), message.getSender())
                    .then(() => {
                      console.log('[ADMIN] ✅ Auto-marked message as read (chat is open)');
                    })
                    .catch((error: any) => {
                      console.log('[ADMIN] Error auto-marking as read:', error);
                    });
                } else {
                  // Update unread count only if chat is not currently open with this user
                  setUnreadCounts(prev => ({
                    ...prev,
                    [senderUid]: (prev[senderUid] || 0) + 1
                  }));

                  // Show browser notification
                  if (Notification.permission === "granted") {
                    new Notification(`New message from ${message.getSender().getName()}`, {
                      body: message.getText(),
                      icon: '/icon.png',
                      badge: '/badge.png',
                    });
                  }

                  // Play sound notification
                  try {
                    const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBUel5v');
                    audio.play().catch(e => console.log('Audio play failed:', e));
                  } catch (e) {
                    console.log('Audio notification failed:', e);
                  }
                }
              },
              onMediaMessageReceived: (message: any) => {
                console.log('[ADMIN] 🔔 New media message from:', message.getSender().getName());
                const senderUid = message.getSender().getUid();
                
                // If chat is open with this user, mark as read immediately
                if (selectedChatUser && senderUid === selectedChatUser.getUid()) {
                  CometChat.markAsRead(message.getId(), message.getReceiverId(), message.getReceiverType(), message.getSender())
                    .then(() => {
                      console.log('[ADMIN] ✅ Auto-marked media as read (chat is open)');
                    })
                    .catch(() => {});
                } else {
                  setUnreadCounts(prev => ({
                    ...prev,
                    [senderUid]: (prev[senderUid] || 0) + 1
                  }));
                }
              },
              onMessagesRead: (messageReceipt: any) => {
                console.log('[ADMIN] ✅ Message read receipt received:', messageReceipt);
              },
              onMessagesDelivered: (messageReceipt: any) => {
                console.log('[ADMIN] ✅ Message delivered receipt received:', messageReceipt);
              },
            })
          );

          // Request notification permission
          if (Notification.permission === "default") {
            Notification.requestPermission().then(permission => {
              console.log('[ADMIN] Notification permission:', permission);
            });
          }
        } catch (error) {
          console.error('[ADMIN] Error setting up message listener:', error);
        }
      };

      setupMessageListener();

      // Cleanup listener on unmount
      return () => {
        import('@cometchat/chat-sdk-javascript').then(({ CometChat }) => {
          CometChat.removeMessageListener(listenerID);
        });
      };
    }
  }, [activeTab, isCometChatLoggedIn, selectedChatUser]);

  // Mark messages as read when user is selected AND enable read receipts
  useEffect(() => {
    if (selectedChatUser && isCometChatLoggedIn) {
      const markAsReadAndSendReceipt = async () => {
        try {
          const { CometChat } = await import('@cometchat/chat-sdk-javascript');
          
          // Mark all messages from this user as read
          await CometChat.markAsRead(selectedChatUser.getUid(), 'user');
          
          // Reset unread count for this user immediately
          setUnreadCounts(prev => {
            const newCounts = { ...prev };
            newCounts[selectedChatUser.getUid()] = 0;
            return newCounts;
          });
          
          console.log('[ADMIN] ✅ Marked all messages as read for:', selectedChatUser.getName());
          console.log('[ADMIN] ✅ Read receipts sent to:', selectedChatUser.getName());
          
          // Also fetch latest messages to ensure we have the most recent read status
          const messagesRequest = new CometChat.MessagesRequestBuilder()
            .setUID(selectedChatUser.getUid())
            .setLimit(50)
            .build();
          
          const messages = await messagesRequest.fetchPrevious();
          
          // Mark each message as delivered and read
          messages.forEach((message: any) => {
            if (message.getSender().getUid() === selectedChatUser.getUid()) {
              CometChat.markAsRead(message.getId(), message.getReceiverId(), message.getReceiverType(), message.getSender())
                .then(() => {
                  console.log('[ADMIN] ✅ Sent read receipt for message ID:', message.getId());
                })
                .catch((error: any) => {
                  console.log('[ADMIN] Read receipt already sent or error:', error.message);
                });
            }
          });
        } catch (error) {
          console.error('[ADMIN] Error marking messages as read:', error);
        }
      };
      
      // Small delay to ensure the chat window is fully loaded
      const timer = setTimeout(() => {
        markAsReadAndSendReceipt();
      }, 500);
      
      return () => clearTimeout(timer);
    }
  }, [selectedChatUser, isCometChatLoggedIn]);

  // Show loading while hydrating or checking authentication
  if (!_hasHydrated || checkingAuth || !isLoggedIn || user?.role !== "admin") {
    return (
      <main className="min-h-screen bg-gradient-to-b from-secondary to-accent flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-text/70">
            {!_hasHydrated ? 'Loading...' : 'Loading admin dashboard...'}
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-secondary to-accent">
      <div className="container mx-auto px-4 py-4 md:py-8 max-w-7xl">
        <div className="bg-white rounded-2xl shadow-soft p-4 md:p-8">
          <h1 className="text-2xl md:text-4xl font-bold text-text mb-4 md:mb-8">Admin Portal</h1>

          {/* Tabs */}
          <div className="flex flex-wrap gap-2 md:gap-4 mb-6 md:mb-8 border-b border-secondary pb-4">
            {[
              { id: "dashboard", label: "Dashboard", shortLabel: "📊" },
              { id: "chat", label: "Chat with Patients", shortLabel: "💬" },
              { id: "bookings", label: "Bookings", shortLabel: "📅" },
              { id: "sessions", label: "Sessions", shortLabel: "🎯" },
              { id: "payments", label: "Payments", shortLabel: "💳" },
              { id: "questionnaires", label: "Questionnaires", shortLabel: "📋" },
              { id: "clients", label: "Users", shortLabel: "👥" },
              { id: "posts", label: "Posts", shortLabel: "📝" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-3 md:px-6 py-2 rounded-xl font-semibold transition-all duration-300 text-xs md:text-base ${
                  activeTab === tab.id
                    ? "bg-primary text-white"
                    : "bg-secondary text-text hover:bg-secondary/80"
                }`}
              >
                <span className="md:hidden">{tab.shortLabel}</span>
                <span className="hidden md:inline">{tab.label}</span>
              </button>
            ))}
          </div>

          {/* Dashboard Tab */}
          {activeTab === "dashboard" && (
            <div>
              {loading ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                  <p className="text-text/70">Loading dashboard statistics...</p>
                  </div>
              ) : (
                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <div className="bg-secondary rounded-xl p-6 hover:shadow-medium transition-all">
                    <h3 className="text-text/70 text-sm mb-2 font-medium">Total Clients</h3>
                    <p className="text-3xl font-bold text-text">{stats?.totalClients ?? clients.length}</p>
                    {!stats && (
                      <p className="text-xs text-text/50 mt-1">From loaded data</p>
                    )}
                  </div>
                  <div className="bg-secondary rounded-xl p-6 hover:shadow-medium transition-all">
                    <h3 className="text-text/70 text-sm mb-2 font-medium">Total Bookings</h3>
                    <p className="text-3xl font-bold text-text">{stats?.totalBookings ?? bookings.length}</p>
                    {!stats && (
                      <p className="text-xs text-text/50 mt-1">From loaded data</p>
                    )}
                  </div>
                  <div className="bg-secondary rounded-xl p-6 hover:shadow-medium transition-all">
                    <h3 className="text-text/70 text-sm mb-2 font-medium">Upcoming Sessions</h3>
                    <p className="text-3xl font-bold text-text">
                      {stats?.upcomingSessions ?? bookings.filter(b => b.status === "confirmed").length}
                    </p>
                    {!stats && (
                      <p className="text-xs text-text/50 mt-1">From loaded data</p>
                    )}
                  </div>
                  <div className="bg-secondary rounded-xl p-6 hover:shadow-medium transition-all">
                    <h3 className="text-text/70 text-sm mb-2 font-medium">Total Revenue</h3>
                    <p className="text-3xl font-bold text-primary">
                      {(stats?.totalRevenue ?? payments.filter(p => p.status === "completed").reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0)).toLocaleString('en-US')} TZS
                    </p>
                    {!stats && (
                      <p className="text-xs text-text/50 mt-1">From loaded data</p>
                    )}
                </div>
            </div>
          )}

              {/* Show warning if stats API failed */}
              {/* {!stats && (
                <div className="mt-4 p-4 bg-yellow-50 border-2 border-yellow-200 rounded-xl">
                  <div className="flex items-center gap-2 text-yellow-700">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    <span className="text-sm font-medium">
                      Dashboard statistics API unavailable. Showing data from loaded resources.
                    </span>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      onClick={() => {
                        setLoading(true);
                        fetchDashboardStats();
                      }}
                      className="ml-auto bg-yellow-100 hover:bg-yellow-200 text-yellow-800 border-yellow-300"
                    >
                      Retry
                    </Button>
                  </div>
                </div>
              )} */}
              
              {/* Additional Dashboard Info */}
              <div className="mt-8 grid md:grid-cols-2 gap-6">
                <div className="bg-white border-2 border-secondary rounded-xl p-6">
                  <h3 className="text-xl font-bold text-text mb-4">Quick Overview</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-text/70">Total Users</span>
                      <span className="font-semibold text-text">{clients.length}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-text/70">Total Bookings</span>
                      <span className="font-semibold text-text">{bookings.length}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-text/70">Total Payments</span>
                      <span className="font-semibold text-text">{payments.length}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-text/70">Published Posts</span>
                      <span className="font-semibold text-text">{publishedPostsCount}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-text/70">Draft Posts</span>
                      <span className="font-semibold text-text">{posts.length > 0 ? posts.filter(p => !p.published).length : 0}</span>
                    </div>
                  </div>
                </div>
                
                <div className="bg-white border-2 border-secondary rounded-xl p-6">
                  <h3 className="text-xl font-bold text-text mb-4">Recent Activity</h3>
                  <div className="space-y-3">
                    <div className="text-text/70 text-sm">
                      <p>Questionnaires submitted: {questionnaires.length}</p>
                      <p className="mt-2">Completed sessions: {bookings.filter(b => b.status === "completed").length}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Clients/Users Tab */}
          {activeTab === "clients" && (
            <div>
              <h2 className="text-2xl font-bold text-text mb-6">Registered Users</h2>
              {clients.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-text/70">No users found</p>
                </div>
              ) : (
              <div className="space-y-4">
                {clients.map((client) => (
                  <div
                    key={client.id}
                      className="border-2 border-secondary rounded-xl p-6 hover:border-primary transition-colors"
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-xl font-semibold text-text">{client.name}</h3>
                        <p className="text-text/70">{client.email}</p>
                          <p className="text-text/50 text-xs mt-1">
                            User ID: {client.id}
                          </p>
                      </div>
                        <div className="text-right">
                          <span className="text-sm text-text/70 block mb-2">
                            Joined: {new Date(client.createdAt).toLocaleDateString("en-US", {
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                            })}
                          </span>
                          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-primary-lighter text-primary">
                            {client.role || "user"}
                      </span>
                        </div>
                    </div>
                    {client.questionnaire && (
                      <div className="mt-4 p-4 bg-secondary rounded-xl">
                          <p className="text-sm font-semibold text-text mb-2">Questionnaire Info:</p>
                          <div className="grid md:grid-cols-2 gap-2 text-sm text-text/70">
                            {client.questionnaire.ageRange && (
                              <p>
                          <strong>Age Range:</strong> {client.questionnaire.ageRange}
                        </p>
                            )}
                            {client.questionnaire.therapyGoals && (
                              <p>
                                <strong>Therapy Goals:</strong> {client.questionnaire.therapyGoals.substring(0, 50)}...
                              </p>
                            )}
                          </div>
                      </div>
                    )}
                      <div className="mt-4 pt-4 border-t border-secondary flex justify-between items-center">
                        <div className="flex gap-6 text-sm">
                          <span className="text-text/70">
                            <strong>Bookings:</strong> {client.bookings?.length || 0}
                          </span>
                          <span className="text-text/70">
                            <strong>Payments:</strong> {client.payments?.length || 0}
                          </span>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setActiveTab("chat")}
                        >
                          Chat with User
                        </Button>
                    </div>
                  </div>
                ))}
              </div>
              )}
            </div>
          )}

          {/* Posts Tab */}
          {activeTab === "posts" && (
            <PostsManagement 
              posts={posts} 
              onRefresh={() => {
                fetchPosts();
                fetchPublishedPostsCount();
              }} 
            />
          )}

          {/* Bookings Tab */}
          {activeTab === "bookings" && (
            <div>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-text">Bookings Management</h2>
                <Button
                  onClick={() => {
                    fetchBookings();
                    fetchUpcomingBookings();
                  }}
                  disabled={bookingsLoading || upcomingBookingsLoading}
                  variant="outline"
                  size="sm"
                >
                  {(bookingsLoading || upcomingBookingsLoading) ? "Refreshing..." : "Refresh All"}
                </Button>
              </div>

              {/* Upcoming Bookings Section */}
              <div className="mb-8">
                <h3 className="text-xl font-bold text-text mb-4">Upcoming Bookings</h3>
                {upcomingBookingsLoading ? (
                  <div className="text-center py-8">
                    <p className="text-text/70">Loading upcoming bookings...</p>
                  </div>
                ) : upcomingBookings.length === 0 ? (
                  <div className="text-center py-8 bg-secondary/30 rounded-xl">
                    <p className="text-text/70">No upcoming bookings</p>
                  </div>
                ) : (
              <div className="space-y-4">
                    {upcomingBookings.map((booking) => (
                  <div
                    key={booking.id}
                        className="border-2 border-primary rounded-xl p-6 bg-primary/5 hover:border-primary-dark transition-colors"
                  >
                    <div className="flex justify-between items-start mb-4">
                          <div className="flex-1">
                            <h4 className="text-lg font-semibold text-text">
                              {booking.user?.name || "Unknown User"}
                            </h4>
                            <p className="text-text/70 text-sm">{booking.user?.email || "N/A"}</p>
                            <p className="text-text/50 text-xs mt-2">
                              Booking ID: {booking.id}
                            </p>
                          </div>
                          <div className="flex flex-col items-end gap-2">
                            <span
                              className={`px-3 py-1 rounded-full text-sm font-semibold ${
                                booking.status === "confirmed"
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
                                  booking.paymentStatus === "paid" || booking.paymentStatus === "completed"
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
                        <div className="grid md:grid-cols-2 gap-4 mb-4">
                      <div>
                            <p className="text-sm text-text/70 mb-1">
                              <strong>Session Type:</strong>
                            </p>
                            <p className="text-text font-medium">
                              {booking.sessionType === "physical"
                                ? "Physical Session"
                                : "Online Chat"}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-text/70 mb-1">
                              <strong>Date & Time:</strong>
                            </p>
                            <p className="text-text font-medium">
                              {new Date(booking.sessionDate).toLocaleDateString("en-US", {
                                weekday: "long",
                                year: "numeric",
                                month: "long",
                                day: "numeric",
                              })}{" "}
                              at {booking.sessionTime}
                            </p>
                          </div>
                        </div>
                        <div className="flex gap-3 pt-4 border-t border-secondary">
                          {booking.status === "pending" && (
                            <Button
                              onClick={() => handleUpdateBookingStatus(booking.id, "confirmed")}
                              disabled={updatingStatus === booking.id}
                              className="flex-1"
                              size="sm"
                            >
                              {updatingStatus === booking.id 
                                ? "Confirming..." 
                                : (booking.paymentStatus === "paid" || booking.paymentStatus === "completed")
                                  ? "Confirm Paid Booking"
                                  : "Accept Booking"}
                            </Button>
                          )}
                          <Button
                            onClick={() => setSelectedBookingId(booking.id)}
                            className="flex-1"
                            size="sm"
                            variant="outline"
                          >
                            View Details
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* All Bookings Section */}
              <div>
                <h3 className="text-xl font-bold text-text mb-4">All Bookings</h3>
                {bookingsLoading ? (
                <div className="text-center py-12">
                  <p className="text-text/70">Loading bookings...</p>
                </div>
              ) : bookings.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-text/70">No bookings found</p>
                </div>
              ) : (
              <div className="space-y-4">
                {bookings.map((booking) => (
                  <div
                    key={booking.id}
                      className="border-2 border-secondary rounded-xl p-6 hover:border-primary transition-colors"
                    >
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex-1">
                        <h3 className="text-xl font-semibold text-text">
                            {booking.user?.name || "Unknown User"}
                        </h3>
                          <p className="text-text/70">{booking.user?.email || "N/A"}</p>
                          <p className="text-text/50 text-xs mt-2">
                            Booking ID: {booking.id}
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
                                  : "bg-secondary text-text/70"
                              }`}
                            >
                              {booking.paymentStatus === "not_paid" ? "Not Paid" : booking.paymentStatus}
                            </span>
                          )}
                    </div>
                      </div>
                      <div className="grid md:grid-cols-2 gap-4 mt-4 pt-4 border-t border-secondary">
                        <div>
                          <p className="text-sm text-text/70 mb-1">
                            <strong>Session Type:</strong>
                          </p>
                          <p className="text-text font-medium">
                            {booking.sessionType === "physical"
                              ? "Physical Session"
                              : "Online Chat"}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-text/70 mb-1">
                            <strong>Date & Time:</strong>
                          </p>
                          <p className="text-text font-medium">
                            {new Date(booking.sessionDate).toLocaleDateString("en-US", {
                              weekday: "long",
                              year: "numeric",
                              month: "long",
                              day: "numeric",
                            })}{" "}
                            at {booking.sessionTime}
                          </p>
                        </div>
                      </div>
                      <div className="mt-4 pt-4 border-t border-secondary">
                        <div className="flex gap-3">
                          <Button
                            onClick={() => setSelectedBookingId(booking.id)}
                            className="flex-1"
                            size="sm"
                            variant="outline"
                          >
                            View Details
                          </Button>
                          {booking.status === "pending" && (
                            <Button
                              onClick={() => handleUpdateBookingStatus(booking.id, "confirmed")}
                              disabled={updatingStatus === booking.id}
                              className="flex-1"
                              size="sm"
                            >
                              {updatingStatus === booking.id ? "Confirming..." : "Accept"}
                            </Button>
                          )}
                          {booking.status === "confirmed" && (
                            <Button
                              onClick={() => handleUpdateBookingStatus(booking.id, "completed")}
                              disabled={updatingStatus === booking.id}
                              className="flex-1"
                              size="sm"
                              variant="outline"
                            >
                              {updatingStatus === booking.id ? "Updating..." : "Mark Complete"}
                            </Button>
                          )}
                          {booking.payment && (
                            <Button
                              onClick={() => {
                                // Navigate to payments tab and highlight this payment
                                setActiveTab("payments");
                              }}
                              className="flex-1"
                              size="sm"
                              variant="outline"
                            >
                              View Payment
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                )}
              </div>
            </div>
          )}

          {/* Chat Tab */}
          {activeTab === "chat" && (
            <div>
              <div className="mb-4 md:mb-6">
                <h2 className="text-xl md:text-2xl font-bold text-text mb-2">💬 Chat with Patients</h2>
                <p className="text-text/70 text-sm md:text-base">Connect with patients who have contacted you</p>
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
                        <h3 className="font-semibold text-gray-800 text-sm md:text-base">👥 Patients & Users</h3>
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
                            <p>No users available</p>
                          </div>
                        ) : (
                          chatUsers.map((u) => {
                            const unreadCount = unreadCounts[u.uid] || 0;
                            const hasUnread = unreadCount > 0;
                            
                            return (
                              <button
                                key={u.uid}
                                onClick={() => {
                                  console.log('[ADMIN] ✅ Selected patient:', u.getName());
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
                                          • {unreadCount} new message{unreadCount > 1 ? 's' : ''}
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
                            <h3 className="text-lg md:text-xl font-semibold text-gray-700 mb-2">Select a Patient</h3>
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
          )}

          {/* Sessions Tab - Confirmed and Completed Sessions */}
          {activeTab === "sessions" && (
            <div>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-text">Sessions</h2>
                <Button
                  onClick={() => {
                    fetchBookings();
                    fetchUpcomingBookings();
                  }}
                  disabled={bookingsLoading || upcomingBookingsLoading}
                  variant="outline"
                  size="sm"
                >
                  {(bookingsLoading || upcomingBookingsLoading) ? "Refreshing..." : "Refresh"}
                </Button>
              </div>

              {/* Confirmed Sessions (Ongoing/Upcoming) */}
              <div className="mb-8">
                <h3 className="text-xl font-bold text-text mb-4">Ongoing & Upcoming Sessions</h3>
                {bookingsLoading ? (
                  <div className="text-center py-8">
                    <p className="text-text/70">Loading sessions...</p>
                  </div>
                ) : bookings.filter((b) => b.status === "confirmed").length === 0 ? (
                  <div className="text-center py-8 bg-secondary/30 rounded-xl">
                    <p className="text-text/70">No confirmed sessions</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {bookings
                      .filter((booking) => booking.status === "confirmed")
                      .map((booking) => (
                        <div
                          key={booking.id}
                          className="border-2 border-primary rounded-xl p-6 bg-primary/5 hover:border-primary-dark transition-colors"
                        >
                          <div className="flex justify-between items-start mb-4">
                            <div className="flex-1">
                              <h4 className="text-lg font-semibold text-text">
                                {booking.user?.name || "Unknown User"}
                              </h4>
                              <p className="text-text/70 text-sm">{booking.user?.email || "N/A"}</p>
                              <p className="text-text/50 text-xs mt-2">
                                Booking ID: {booking.id}
                              </p>
                            </div>
                            <div className="flex flex-col items-end gap-2">
                              <span className="px-3 py-1 rounded-full text-sm font-semibold bg-primary-lighter text-primary">
                                Confirmed
                              </span>
                              {booking.paymentStatus && (
                                <span
                                  className={`px-3 py-1 rounded-full text-xs font-semibold ${
                                    booking.paymentStatus === "paid"
                                      ? "bg-green-100 text-green-700"
                                      : booking.paymentStatus === "not_paid"
                                      ? "bg-red-100 text-red-700"
                                      : "bg-secondary text-text/70"
                                  }`}
                                >
                                  {booking.paymentStatus === "not_paid" ? "Not Paid" : booking.paymentStatus}
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="grid md:grid-cols-2 gap-4 mb-4">
                            <div>
                              <p className="text-sm text-text/70 mb-1">
                                <strong>Session Type:</strong>
                              </p>
                              <p className="text-text font-medium">
                                {booking.sessionType === "physical"
                                  ? "Physical Session"
                                  : "Online Chat"}
                              </p>
                            </div>
                            <div>
                              <p className="text-sm text-text/70 mb-1">
                                <strong>Scheduled For:</strong>
                              </p>
                              <p className="text-text font-medium">
                                {new Date(booking.sessionDate).toLocaleDateString("en-US", {
                                  weekday: "long",
                                  year: "numeric",
                                  month: "long",
                                  day: "numeric",
                                })}{" "}
                                at {booking.sessionTime}
                              </p>
                            </div>
                          </div>
                          <div className="flex gap-3 pt-4 border-t border-secondary">
                            <Button
                              onClick={() => handleUpdateBookingStatus(booking.id, "completed")}
                              disabled={updatingStatus === booking.id}
                              className="flex-1"
                              size="sm"
                            >
                              {updatingStatus === booking.id ? "Marking..." : "Mark as Completed"}
                            </Button>
                            <Button
                              onClick={() => setSelectedBookingId(booking.id)}
                              className="flex-1"
                              size="sm"
                              variant="outline"
                            >
                              View Details
                            </Button>
                            {booking.sessionType === "online" && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setActiveTab("chat")}
                              >
                                Open Chat
                              </Button>
                            )}
                          </div>
                        </div>
                      ))}
                  </div>
                )}
              </div>

              {/* Completed Sessions */}
              <div>
                <h3 className="text-xl font-bold text-text mb-4">Completed Sessions</h3>
                {bookingsLoading ? (
                  <div className="text-center py-8">
                    <p className="text-text/70">Loading sessions...</p>
                  </div>
                ) : bookings.filter((b) => b.status === "completed").length === 0 ? (
                  <div className="text-center py-8 bg-secondary/30 rounded-xl">
                    <p className="text-text/70">No completed sessions yet</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {bookings
                      .filter((booking) => booking.status === "completed")
                      .map((booking) => (
                        <div
                          key={booking.id}
                          className="border-2 border-secondary rounded-xl p-6 hover:border-primary transition-colors"
                        >
                          <div className="flex justify-between items-start mb-4">
                            <div className="flex-1">
                              <h4 className="text-lg font-semibold text-text">
                                {booking.user?.name || "Unknown User"}
                              </h4>
                              <p className="text-text/70 text-sm">{booking.user?.email || "N/A"}</p>
                              <p className="text-text/50 text-xs mt-2">
                                Booking ID: {booking.id}
                              </p>
                            </div>
                            <div className="flex flex-col items-end gap-2">
                              <span className="px-3 py-1 rounded-full text-sm font-semibold bg-primary-lighter text-primary">
                                Completed
                              </span>
                              {booking.paymentStatus && (
                                <span
                                  className={`px-3 py-1 rounded-full text-xs font-semibold ${
                                    booking.paymentStatus === "paid"
                                      ? "bg-green-100 text-green-700"
                                      : "bg-secondary text-text/70"
                                  }`}
                                >
                                  {booking.paymentStatus === "not_paid" ? "Not Paid" : booking.paymentStatus}
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="grid md:grid-cols-2 gap-4 mb-4">
                            <div>
                              <p className="text-sm text-text/70 mb-1">
                                <strong>Session Type:</strong>
                              </p>
                              <p className="text-text font-medium">
                                {booking.sessionType === "physical"
                                  ? "Physical Session"
                                  : "Online Chat"}
                              </p>
                            </div>
                            <div>
                              <p className="text-sm text-text/70 mb-1">
                                <strong>Completed On:</strong>
                              </p>
                              <p className="text-text font-medium">
                                {new Date(booking.sessionDate).toLocaleDateString("en-US", {
                                  weekday: "long",
                                  year: "numeric",
                                  month: "long",
                                  day: "numeric",
                                })}{" "}
                                at {booking.sessionTime}
                              </p>
                              {booking.updatedAt && (
                                <p className="text-text/50 text-xs mt-1">
                                  Marked complete: {new Date(booking.updatedAt).toLocaleDateString()}
                                </p>
                              )}
                            </div>
                          </div>
                          <div className="flex gap-3 pt-4 border-t border-secondary">
                            <Button
                              onClick={() => setSelectedBookingId(booking.id)}
                              className="flex-1"
                              size="sm"
                              variant="outline"
                            >
                              View Details
                            </Button>
                            {booking.sessionType === "online" && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setActiveTab("chat")}
                              >
                                View Chat History
                              </Button>
                            )}
                          </div>
                        </div>
                      ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Questionnaires Tab */}
          {activeTab === "questionnaires" && (
            <div>
              <h2 className="text-2xl font-bold text-text mb-6">User Questionnaires</h2>
              {questionnaires.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-text/70">No questionnaires submitted yet</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {questionnaires.map((questionnaire) => (
                    <div
                      key={questionnaire.id}
                      className="border-2 border-secondary rounded-xl p-6 hover:border-primary transition-colors"
                    >
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h3 className="text-xl font-semibold text-text">
                            {questionnaire.user?.name || "Unknown User"}
                          </h3>
                          <p className="text-text/70">{questionnaire.user?.email || "N/A"}</p>
                        </div>
                        <span className="text-sm text-text/70">
                          Submitted: {new Date(questionnaire.createdAt).toLocaleDateString("en-US", {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          })}
                        </span>
                      </div>

                      <div className="mt-4 space-y-4">
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
                        {(questionnaire.therapyType || questionnaire.therapyReasons || questionnaire.therapyGoals) && (
                          <div className="p-4 bg-primary-lighter/30 rounded-xl">
                            <h4 className="font-semibold text-text mb-3">Therapy Information</h4>
                            <div className="space-y-2 text-sm">
                              {questionnaire.therapyType && (
                                <p className="text-text/70">
                                  <strong>Therapy Type:</strong> {questionnaire.therapyType}
                                </p>
                              )}
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

                      <div className="mt-4 pt-4 border-t border-secondary flex justify-between items-center">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setActiveTab("clients");
                            // Could scroll to this user if needed
                          }}
                        >
                          View User Profile
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setActiveTab("chat")}
                        >
                          Chat with User
                        </Button>
                    </div>
                  </div>
                ))}
              </div>
              )}
            </div>
          )}

          {/* Payments Tab */}
          {activeTab === "payments" && (
            <div>
              <h2 className="text-2xl font-bold text-text mb-6">Payment History</h2>
              {payments.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-text/70">No payments found</p>
                </div>
              ) : (
              <div className="space-y-4">
                {payments.map((payment) => (
                  <div
                    key={payment.id}
                      className="border-2 border-secondary rounded-xl p-6 hover:border-primary transition-colors"
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-xl font-semibold text-text">
                            {payment.user?.name || "Unknown User"}
                        </h3>
                          <p className="text-text/70">{payment.user?.email || "N/A"}</p>
                          {payment.bookingId && (
                            <p className="text-text/50 text-xs mt-1">
                              Booking ID: {payment.bookingId}
                            </p>
                          )}
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-primary">
                          {typeof payment.amount === 'number' ? payment.amount.toLocaleString('en-US') : parseFloat(payment.amount || '0').toLocaleString('en-US')} TZS
                        </p>
                        {payment.paymentMethod && (
                          <p className="text-text/70 text-sm mt-1">
                            {payment.paymentMethod}
                          </p>
                        )}
                          <span
                            className={`px-3 py-1 rounded-full text-sm font-semibold inline-block mt-2 ${
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
                      <div className="flex justify-between items-center mt-4 pt-4 border-t border-secondary">
                    <p className="text-text/70 text-sm">
                          {new Date(payment.createdAt).toLocaleDateString("en-US", {
                            weekday: "long",
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          })}
                        </p>
                        {payment.transactionId && (
                          <p className="text-text/50 text-xs">
                            Transaction: {payment.transactionId}
                          </p>
                        )}
                      </div>
                  </div>
                ))}
              </div>
              )}
            </div>
          )}
        </div>

        {/* Booking Details Modal */}
        <BookingDetailsModal
          bookingId={selectedBookingId}
          onClose={() => setSelectedBookingId(null)}
        />
      </div>
    </main>
  );
}

function PostsManagement({ posts, onRefresh }: { posts: any[]; onRefresh: () => void }) {
  const { updatePost, deletePost: removePostFromStore, publishPost: publishPostInStore, unpublishPost: unpublishPostInStore } = usePostsStore();
  const [showCreate, setShowCreate] = useState(false);
  const [editingPost, setEditingPost] = useState<any>(null);
  const [formData, setFormData] = useState({
    title: "",
    body: "",
    imageUrl: "",
    published: false, // Default to false
    scheduledAt: "",
  });
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [loading, setLoading] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith("image/")) {
        alert("Please select an image file");
        return;
      }
      
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert("Image size should be less than 5MB");
        return;
      }

      setImageFile(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
        // Set imageUrl to data URL for preview, will be converted to base64 or uploaded
        setFormData({ ...formData, imageUrl: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = () => {
    setImageFile(null);
    setImagePreview(null);
    setFormData({ ...formData, imageUrl: "" });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setFeedback(null);
    
    try {
      // Prepare payload according to API specification
      // Posts default to published: false
      const payload: any = {
        title: formData.title,
        body: formData.body,
        published: false, // Always false when creating/editing, publish separately
      };

      // Handle image: if file is uploaded, convert to base64 or upload to server
      if (imageFile) {
        // Convert file to base64 data URL (you can also upload to a file storage service)
        const reader = new FileReader();
        const imageDataUrl = await new Promise<string>((resolve, reject) => {
          reader.onloadend = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(imageFile);
        });
        payload.imageUrl = imageDataUrl;
      } else if (formData.imageUrl && !formData.imageUrl.startsWith("data:")) {
        // If it's a regular URL (not a data URL from upload), use it as is
        payload.imageUrl = formData.imageUrl;
      }

      if (formData.scheduledAt) {
        payload.scheduledAt = new Date(formData.scheduledAt).toISOString();
      }

      let savedPost;
      if (editingPost) {
        savedPost = await postsApi.update(editingPost.id, payload);
        updatePost(editingPost.id, savedPost);
        setFeedback({ type: "success", message: "Post updated successfully!" });
      } else {
        savedPost = await postsApi.create(payload);
        setFeedback({ type: "success", message: "Post created successfully!" });
        // Post will be added to store when fetched via onRefresh
      }
      
      // Clear form and close modal after short delay to show success message
      setTimeout(() => {
      setShowCreate(false);
      setEditingPost(null);
        setImageFile(null);
        setImagePreview(null);
        setFormData({ title: "", body: "", imageUrl: "", published: false, scheduledAt: "" });
        setFeedback(null);
      onRefresh();
      }, 1500);
    } catch (error: any) {
      console.error("Error saving post:", error);
      setFeedback({ 
        type: "error", 
        message: error?.response?.data?.message || "Failed to save post. Please try again." 
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    const post = posts.find((p) => p.id === id);
    const postTitle = post?.title || "this post";
    
    if (!confirm(`Are you sure you want to delete "${postTitle}"?\n\nThis action cannot be undone.`)) {
      return;
    }
    
    setLoading(id);
    setFeedback(null);
    try {
      await postsApi.delete(id);
      removePostFromStore(id);
      setFeedback({ type: "success", message: "Post deleted successfully!" });
      setTimeout(() => {
        setFeedback(null);
      onRefresh();
      }, 1500);
    } catch (error: any) {
      console.error("Error deleting post:", error);
      setFeedback({ 
        type: "error", 
        message: error?.response?.data?.message || "Failed to delete post. Please try again." 
      });
      setTimeout(() => setFeedback(null), 3000);
    } finally {
      setLoading(null);
    }
  };

  const handlePublish = async (id: string) => {
    setLoading(id);
    setFeedback(null);
    try {
      await postsApi.publish(id);
      publishPostInStore(id);
      setFeedback({ type: "success", message: "Post published successfully!" });
      setTimeout(() => {
        setFeedback(null);
        onRefresh(); // This will refresh both posts and published count
      }, 1500);
    } catch (error: any) {
      console.error("Error publishing post:", error);
      setFeedback({
        type: "error",
        message: error?.response?.data?.message || "Failed to publish post. Please try again."
      });
      setTimeout(() => setFeedback(null), 3000);
    } finally {
      setLoading(null);
    }
  };

  const handleUnpublish = async (id: string) => {
    setLoading(id);
    setFeedback(null);
    try {
      await postsApi.unpublish(id);
      unpublishPostInStore(id);
      setFeedback({ type: "success", message: "Post unpublished successfully!" });
      setTimeout(() => {
        setFeedback(null);
        onRefresh(); // This will refresh both posts and published count
      }, 1500);
    } catch (error: any) {
      console.error("Error unpublishing post:", error);
      setFeedback({
        type: "error",
        message: error?.response?.data?.message || "Failed to unpublish post. Please try again."
      });
      setTimeout(() => setFeedback(null), 3000);
    } finally {
      setLoading(null);
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-text">Manage Posts</h2>
        <Button onClick={() => setShowCreate(true)}>Create New Post</Button>
      </div>

      {/* Feedback Messages */}
      {feedback && (
        <div
          className={`mb-6 p-4 rounded-xl border-2 ${
            feedback.type === "success"
              ? "bg-green-50 border-green-200 text-green-700"
              : "bg-red-50 border-red-200 text-red-700"
          }`}
        >
          <div className="flex items-center gap-3">
            {feedback.type === "success" ? (
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            )}
            <span className="font-medium">{feedback.message}</span>
          </div>
        </div>
      )}

      {showCreate && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <h3 className="text-2xl font-bold text-text mb-6">
              {editingPost ? "Edit Post" : "Create New Post"}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  required
                />
              </div>
              <div>
                <Label htmlFor="body">Content</Label>
                <Textarea
                  id="body"
                  value={formData.body}
                  onChange={(e) =>
                    setFormData({ ...formData, body: e.target.value })
                  }
                  required
                  rows={10}
                />
              </div>
              <div>
                <Label htmlFor="image">Image (optional)</Label>
                <div className="space-y-3">
                  <div className="flex gap-3">
                    <label
                      htmlFor="image-upload"
                      className="flex-1 cursor-pointer"
                    >
                      <div className="h-12 rounded-xl border-2 border-dashed border-secondary hover:border-primary transition-colors flex items-center justify-center text-text/70 hover:text-primary">
                        <span className="text-sm font-medium">
                          {imageFile ? "Change Image" : "Upload Image"}
                        </span>
                      </div>
                      <input
                        id="image-upload"
                        type="file"
                        accept="image/*"
                        onChange={handleImageChange}
                        className="hidden"
                      />
                    </label>
                    {imagePreview && (
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleRemoveImage}
                        className="h-12"
                      >
                        Remove
                      </Button>
                    )}
                  </div>
                  
                  {imagePreview && (
                    <div className="mt-3">
                      <img
                        src={imagePreview}
                        alt="Preview"
                        className="w-full h-48 object-cover rounded-xl border-2 border-secondary"
                      />
                    </div>
                  )}
                  
                  <div className="text-sm text-text/70">
                    <p>Or enter image URL:</p>
                <Input
                  id="imageUrl"
                      type="text"
                      value={formData.imageUrl && !formData.imageUrl.startsWith("data:") ? formData.imageUrl : ""}
                      onChange={(e) => {
                        if (!e.target.value.startsWith("data:")) {
                          setFormData({ ...formData, imageUrl: e.target.value });
                          setImageFile(null);
                          setImagePreview(null);
                        }
                      }}
                      placeholder="https://example.com/image.jpg"
                      className="mt-2"
                />
              </div>
                </div>
              </div>
              <div>
                <Label htmlFor="scheduledAt">Schedule Post (optional)</Label>
                <Input
                  id="scheduledAt"
                  type="datetime-local"
                  value={formData.scheduledAt}
                  onChange={(e) =>
                    setFormData({ ...formData, scheduledAt: e.target.value })
                  }
                  className="h-12 rounded-xl border-2 border-secondary focus:border-primary transition-colors"
                />
                <p className="text-text/50 text-xs mt-1">
                  Leave empty to publish immediately
                </p>
              </div>
              <div className="flex gap-4">
                <Button type="submit" disabled={saving}>
                  {saving ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Saving...
                    </>
                  ) : (
                    "Save"
                  )}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowCreate(false);
                    setEditingPost(null);
                    setImageFile(null);
                    setImagePreview(null);
                    setFeedback(null);
                    setFormData({ title: "", body: "", imageUrl: "", published: false, scheduledAt: "" });
                  }}
                  disabled={saving}
                >
                  Cancel
                </Button>
              </div>
              
              {/* Feedback in modal */}
              {feedback && (
                <div
                  className={`mt-4 p-3 rounded-xl border-2 ${
                    feedback.type === "success"
                      ? "bg-green-50 border-green-200 text-green-700"
                      : "bg-red-50 border-red-200 text-red-700"
                  }`}
                >
                  <div className="flex items-center gap-2 text-sm">
                    {feedback.type === "success" ? (
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    ) : (
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                      </svg>
                    )}
                    <span>{feedback.message}</span>
                  </div>
                </div>
              )}
            </form>
          </div>
        </div>
      )}

      <div className="space-y-4">
        {posts.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-text/70">No posts found. Create your first post!</p>
          </div>
        ) : (
          posts.map((post) => (
          <div
            key={post.id}
              className="border-2 border-secondary rounded-xl p-6 hover:border-primary transition-colors"
          >
            <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <h3 className="text-xl font-semibold text-text mb-1">{post.title}</h3>
                <p className="text-text/70 text-sm">
                    Created: {new Date(post.createdAt).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })}
                    {post.scheduledAt && (
                      <span className="ml-3">
                        | Scheduled: {new Date(post.scheduledAt).toLocaleDateString()}
                      </span>
                    )}
                </p>
              </div>
              <span
                className={`px-3 py-1 rounded-full text-sm font-semibold ${
                  post.published
                      ? "bg-primary-lighter text-primary"
                      : "bg-secondary text-text/70"
                }`}
              >
                {post.published ? "Published" : "Draft"}
              </span>
            </div>
              
              {post.imageUrl && (
                <div className="mb-4">
                  <img
                    src={post.imageUrl}
                    alt={post.title}
                    className="w-full h-48 object-cover rounded-xl border-2 border-secondary"
                  />
                </div>
              )}
              
            <p className="text-text/70 mb-4 line-clamp-3">{post.body}</p>
              
              <div className="flex flex-wrap gap-3 pt-4 border-t border-secondary">
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setEditingPost(post);
                    setImageFile(null);
                    if (post.imageUrl) {
                      setImagePreview(post.imageUrl);
                    } else {
                      setImagePreview(null);
                    }
                  setFormData({
                    title: post.title,
                    body: post.body,
                    imageUrl: post.imageUrl || "",
                    published: post.published,
                      scheduledAt: post.scheduledAt 
                        ? new Date(post.scheduledAt).toISOString().slice(0, 16)
                        : "",
                  });
                  setShowCreate(true);
                }}
                  disabled={loading === post.id}
              >
                Edit
              </Button>
                
                {/* Show Publish button for unpublished posts */}
                {!post.published && (
                  <Button
                    size="sm"
                    onClick={() => handlePublish(post.id)}
                    disabled={loading === post.id}
                    className="bg-primary hover:bg-primary-hover text-white"
                  >
                    {loading === post.id ? "Publishing..." : "Publish"}
                  </Button>
                )}
                
                {/* Show Unpublish and other options for published posts */}
                {post.published && (
                  <>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleUnpublish(post.id)}
                      disabled={loading === post.id}
                      className="bg-yellow-50 hover:bg-yellow-100 text-yellow-700 border-yellow-200"
                    >
                      {loading === post.id ? "Unpublishing..." : "Unpublish"}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        // View post on home page (if you have a post detail page)
                        window.open(`/posts/${post.id}`, '_blank');
                      }}
                      className="bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-200"
                    >
                      View
                    </Button>
                  </>
                )}
                
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleDelete(post.id)}
                  disabled={loading === post.id}
                  className="bg-red-50 hover:bg-red-100 text-red-700 border-red-200"
              >
                  {loading === post.id ? "Deleting..." : "Delete"}
              </Button>
            </div>
          </div>
          ))
        )}
      </div>
    </div>
  );
}

