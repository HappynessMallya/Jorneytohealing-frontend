const COMETCHAT_CONSTANTS = {
  APP_ID: process.env.NEXT_PUBLIC_COMETCHAT_APP_ID || "16712913472aea194",
  // Valid regions: "us", "eu", or "in" (NOT "tz")
  REGION: process.env.NEXT_PUBLIC_COMETCHAT_REGION || "us",
  AUTH_KEY: process.env.NEXT_PUBLIC_COMETCHAT_AUTH_KEY || "a9872929281e6788d558b02a78db2dc306e02786",
};

export const initCometChat = async () => {
  // Only run on client side
  if (typeof window === 'undefined') {
    return;
  }

  console.log('🔧 CometChat Config:', {
    APP_ID: COMETCHAT_CONSTANTS.APP_ID,
    REGION: COMETCHAT_CONSTANTS.REGION,
    AUTH_KEY: COMETCHAT_CONSTANTS.AUTH_KEY.substring(0, 10) + '...',
  });

  // Dynamic imports to avoid SSR issues
  const { UIKitSettingsBuilder, CometChatUIKit } = await import("@cometchat/chat-uikit-react");
  
  const UIKitSettings = new UIKitSettingsBuilder()
    .setAppId(COMETCHAT_CONSTANTS.APP_ID)
    .setRegion(COMETCHAT_CONSTANTS.REGION)
    .setAuthKey(COMETCHAT_CONSTANTS.AUTH_KEY)
    .subscribePresenceForAllUsers()
    .build();

  await CometChatUIKit.init(UIKitSettings);
  console.log('✅ CometChat UIKit initialized');
};