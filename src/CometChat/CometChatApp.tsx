"use client";

/* eslint-disable react/no-unescaped-entities */
import './styles/CometChatApp.css';
import { AppContextProvider } from './context/AppContext';
import { CometChatHome } from './components/CometChatHome/CometChatHome';
import React, { useEffect, useState } from 'react';
import { useCometChatContext } from './context/CometChatContext';
import useSystemColorScheme from './customHooks';
import useThemeStyles from './customHook/useThemeStyles';

interface CometChatAppProps {
  /** Default user for the chat application (optional). */
  user?: any;
  /** Default group for the chat application (optional). */
  group?: any;
  /** Show or hide group action messages (optional). */
  showGroupActionMessages?: boolean;
}

/**
 * Main application component for the CometChat Builder.
 *
 * @param {CometChatAppProps} props - The component props.
 * @returns {JSX.Element} The rendered CometChatApp component.
 */
function CometChatApp({ user, group, showGroupActionMessages }: CometChatAppProps) {
  const [loggedInUser, setLoggedInUser] = useState<any | null>(null);
  const { styleFeatures, setStyleFeatures } = useCometChatContext();

  const systemTheme = useSystemColorScheme();
  useThemeStyles(styleFeatures, systemTheme, setStyleFeatures, loggedInUser);

  /**
   * Effect to handle login and logout listeners
   */
  useEffect(() => {
    // Only run on client side
    if (typeof window === "undefined") {
      return;
    }

    let CometChatInstance: any = null;

    const setupCometChat = async () => {
      try {
        const { CometChat } = await import('@cometchat/chat-sdk-javascript');
        const { CometChatUIKit } = await import('@cometchat/chat-uikit-react');
        CometChatInstance = CometChat;
        
        // Import CSS
        await import('@cometchat/chat-uikit-react/css-variables.css');

        CometChat.addLoginListener(
          'runnable-sample-app',
          new CometChat.LoginListener({
            loginSuccess: (user: any) => {
              setLoggedInUser(user);
            },
            logoutSuccess: () => {
              setLoggedInUser(null);
            },
          })
        );

        // Fetch currently logged-in user
        CometChatUIKit.getLoggedinUser().then((user: any | null) => {
          if (user) {
            setLoggedInUser(user);
          } else {
            setLoggedInUser(null);
          }
        });
      } catch (error) {
        console.error("Failed to setup CometChat:", error);
      }
    };

    setupCometChat();

    return () => {
      if (CometChatInstance) {
        CometChatInstance.removeLoginListener('runnable-sample-app');
      }
    };
  }, []);

  return (
    <div className="CometChatApp">
      <AppContextProvider>
        {loggedInUser ? <CometChatHome defaultGroup={group} defaultUser={user} showGroupActionMessages={showGroupActionMessages} /> : <LoginPlaceholder />}
      </AppContextProvider>
    </div>
  );
}

export default CometChatApp;

const LoginPlaceholder = () => {
  return (
    <div className="login-placeholder">
      <div className="cometchat-logo" />
      <h3>This is where your website&apos;s login screen should appear.</h3>
    </div>
  );
};
