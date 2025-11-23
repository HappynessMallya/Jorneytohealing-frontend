"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useBookingStore } from "@/stores/bookingStore";
import { useAuthStore } from "@/stores/authStore";
import { bookingsApi, paymentsApi } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/input";
import LoginModal from "@/components/LoginModal";
import SuccessModal from "@/components/SuccessModal";

export default function BookingPage() {
  const router = useRouter();
  const { setBooking } = useBookingStore();
  const { isLoggedIn } = useAuthStore();
  const [sessionType, setSessionType] = useState<"physical" | "online" | null>(null);
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTime, setSelectedTime] = useState("");
  const [loading, setLoading] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [createdBookingId, setCreatedBookingId] = useState<string | null>(null);

  // Available time slots (you can make this dynamic)
  const timeSlots = [
    "9:00 AM",
    "10:00 AM",
    "11:00 AM",
    "1:00 PM",
    "2:00 PM",
    "3:00 PM",
    "4:00 PM",
    "5:00 PM",
  ];

  // Helper function to convert time string (e.g., "12:00 PM") to 24-hour format
  const convertTimeTo24Hour = (timeStr: string): string => {
    const [time, period] = timeStr.split(" ");
    const [hours, minutes] = time.split(":");
    let hour24 = parseInt(hours, 10);
    
    if (period === "PM" && hour24 !== 12) {
      hour24 += 12;
    } else if (period === "AM" && hour24 === 12) {
      hour24 = 0;
    }
    
    return `${hour24.toString().padStart(2, "0")}:${minutes}`;
  };

  // Helper function to format date and time into ISO format
  const formatSessionDate = (date: string, time: string): string => {
    const time24 = convertTimeTo24Hour(time);
    const dateTime = `${date}T${time24}:00`;
    return new Date(dateTime).toISOString();
  };

  const handleSubmit = async () => {
    // Check if user is logged in
    if (!isLoggedIn) {
      setShowLoginModal(true);
      return;
    }

    if (!sessionType || !selectedDate || !selectedTime) {
      alert("Please fill in all fields");
      return;
    }

    setLoading(true);
    try {
      // Format the date in ISO format as expected by the API
      const sessionDateISO = formatSessionDate(selectedDate, selectedTime);
      
      // Create booking
      const booking = await bookingsApi.create({
        sessionType,
        sessionDate: sessionDateISO,
        sessionTime: selectedTime,
      });
      
      // Create payment record with status "pending" in the background
      const sessionPrice = 1000; // Session price in TZS (Tanzanian Shillings)
      try {
        await paymentsApi.create({
          bookingId: booking.id,
          amount: sessionPrice,
          currency: "TZS",
          paymentMethod: "credit_card",
          status: "pending",
        });
      } catch (paymentError: any) {
        console.error("Error creating payment record:", paymentError);
        // Don't block the booking flow if payment creation fails
        // The payment can be created later
      }
      
      // Store booking info
      setBooking({
        sessionType,
        sessionDate: selectedDate,
        sessionTime: selectedTime,
        bookingId: booking.id,
      });
      
      // Show success modal instead of redirecting
      setCreatedBookingId(booking.id);
      setShowSuccessModal(true);
    } catch (error: any) {
      console.error("Error creating booking:", error);
      const errorMessage = error?.response?.data?.message || error?.message || "Failed to create booking. Please try again.";
      alert(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-secondary to-accent py-16">
      <div className="container mx-auto px-4 max-w-3xl">
        <div className="bg-white rounded-2xl p-8 shadow-soft">
          <h1 className="text-4xl font-bold text-text mb-2">Book Your Session</h1>
          <p className="text-text/70 mb-8">
            Choose your preferred session type and time
          </p>

          {/* Session Type Selection */}
          <div className="mb-8">
            <Label className="mb-4 block">Session Type</Label>
            <div className="grid md:grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => setSessionType("physical")}
                className={`p-6 rounded-xl border-2 transition-all duration-300 ${
                  sessionType === "physical"
                    ? "border-primary bg-secondary"
                    : "border-secondary hover:border-primary"
                }`}
              >
                <h3 className="text-xl font-semibold text-text mb-2">
                  Physical Session
                </h3>
                <p className="text-text/70">
                  In-person therapy session at our office
                </p>
              </button>
              <button
                type="button"
                onClick={() => setSessionType("online")}
                className={`p-6 rounded-xl border-2 transition-all duration-300 ${
                  sessionType === "online"
                    ? "border-primary bg-secondary"
                    : "border-secondary hover:border-primary"
                }`}
              >
                <h3 className="text-xl font-semibold text-text mb-2">
                  Online Chat Session
                </h3>
                <p className="text-text/70">
                  Secure online text-based therapy session
                </p>
              </button>
            </div>
          </div>

          {/* Date Selection */}
          <div className="mb-8">
            <Label htmlFor="sessionDate">Select Date</Label>
            <input
              type="date"
              id="sessionDate"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              min={new Date().toISOString().split("T")[0]}
              className="flex h-12 w-full rounded-xl border-2 border-secondary bg-white px-4 py-2 text-text focus:outline-none focus:ring-2 focus:ring-primary mt-2"
            />
          </div>

          {/* Time Selection */}
          <div className="mb-8">
            <Label>Select Time</Label>
            <div className="grid grid-cols-4 gap-3 mt-2">
              {timeSlots.map((time) => (
                <button
                  key={time}
                  type="button"
                  onClick={() => setSelectedTime(time)}
                  className={`p-3 rounded-xl border-2 transition-all duration-300 ${
                    selectedTime === time
                      ? "border-primary bg-secondary text-primary font-semibold"
                      : "border-secondary hover:border-primary"
                  }`}
                >
                  {time}
                </button>
              ))}
            </div>
          </div>

          {/* Submit Button */}
          <Button
            onClick={handleSubmit}
            disabled={loading || !sessionType || !selectedDate || !selectedTime}
            className="w-full"
            size="lg"
          >
            {loading ? "Creating Booking..." : "Book Session"}
          </Button>
        </div>
      </div>

      {/* Login Modal */}
      {showLoginModal && (
        <LoginModal
          isOpen={showLoginModal}
          onClose={() => setShowLoginModal(false)}
          onSuccess={() => {
            setShowLoginModal(false);
            // After successful login, user can try booking again
          }}
        />
      )}

      {/* Success Modal */}
      <SuccessModal
        isOpen={showSuccessModal}
        onClose={() => setShowSuccessModal(false)}
        title="Booking Created Successfully!"
        message={`Your ${sessionType === "physical" ? "physical" : "online"} session has been booked for ${selectedDate} at ${selectedTime}. Please proceed to complete your payment.`}
        buttonText="Proceed to Payment"
        redirectTo="/payment"
      />
    </main>
  );
}

