"use client";

import { create } from "zustand";

interface Booking {
  sessionType: "physical" | "online";
  sessionDate: string;
  sessionTime: string;
  bookingId?: string;
}

interface BookingStore {
  booking: Booking | null;
  setBooking: (booking: Booking) => void;
  clearBooking: () => void;
}

export const useBookingStore = create<BookingStore>((set) => ({
  booking: null,
  setBooking: (booking) => set({ booking }),
  clearBooking: () => set({ booking: null }),
}));

