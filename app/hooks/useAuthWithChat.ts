// hooks/useAuthWithChat.ts
import { useEffect } from 'react';
import { useCometChat } from '@/app/context/CometChatContext';
import axios from 'axios';

export function useAuthWithChat(user: any) {
  const { isInitialized, loginToChat } = useCometChat();

  useEffect(() => {
    if (user && isInitialized) {
      // Get CometChat token from your backend
      axios.post('/api/auth/cometchat-token')
        .then((response) => {
          return loginToChat(response.data.authToken);
        })
        .catch((error) => {
          console.error('Failed to login to CometChat:', error);
        });
    }
  }, [user, isInitialized]);
}