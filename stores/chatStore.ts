"use client";

import { create } from "zustand";

interface ChatStore {
  isConnected: boolean;
  chatClient: any;
  setConnected: (connected: boolean) => void;
  setChatClient: (client: any) => void;
}

export const useChatStore = create<ChatStore>((set) => ({
  isConnected: false,
  chatClient: null,
  setConnected: (connected) => set({ isConnected: connected }),
  setChatClient: (client) => set({ chatClient: client }),
}));

