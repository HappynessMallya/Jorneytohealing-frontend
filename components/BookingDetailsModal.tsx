"use client";

import { useState, useEffect } from "react";
import { bookingsApi } from "@/lib/api-client";
import { Button } from "@/components/ui/button";

interface BookingDetails {
  id: string;
  userId: string;
  sessionType: string;
  sessionDate: string;
  sessionTime: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  paymentStatus: string;
  payment: any | null;
  user?: {
    id: string;
    name: string;
    email: string;
  };
}

interface BookingDetailsModalProps {
  bookingId: string | null;
  onClose: () => void;
  onPaymentClick?: (bookingId: string) => void;
}

export default function BookingDetailsModal({
  bookingId,
  onClose,
  onPaymentClick,
}: BookingDetailsModalProps) {
  const [booking, setBooking] = useState<BookingDetails | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (bookingId) {
      fetchBookingDetails();
    }
  }, [bookingId]);

  const fetchBookingDetails = async () => {
    if (!bookingId) return;

    setLoading(true);
    setError(null);
    try {
      const data = await bookingsApi.getById(bookingId);
      setBooking(data);
    } catch (err: any) {
      console.error("Error fetching booking details:", err);
      setError(err?.response?.data?.message || "Failed to load booking details");
    } finally {
      setLoading(false);
    }
  };

  if (!bookingId) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl shadow-soft max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b-2 border-secondary p-6 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-text">Booking Details</h2>
          <button
            onClick={onClose}
            className="text-text/70 hover:text-text transition-colors text-2xl"
            aria-label="Close"
          >
            ×
          </button>
        </div>

        <div className="p-6">
          {loading ? (
            <div className="text-center py-12">
              <p className="text-text/70">Loading booking details...</p>
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <p className="text-red-600 mb-4">{error}</p>
              <Button onClick={fetchBookingDetails} variant="outline">
                Retry
              </Button>
            </div>
          ) : booking ? (
            <div className="space-y-6">
              {/* Session Type */}
              <div>
                <h3 className="text-sm font-semibold text-text/70 mb-2">Session Type</h3>
                <p className="text-lg font-semibold text-text">
                  {booking.sessionType === "physical" ? "Physical Session" : "Online Chat Session"}
                </p>
              </div>

              {/* Date and Time */}
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <h3 className="text-sm font-semibold text-text/70 mb-2">Date</h3>
                  <p className="text-text">
                    {new Date(booking.sessionDate).toLocaleDateString("en-US", {
                      weekday: "long",
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </p>
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-text/70 mb-2">Time</h3>
                  <p className="text-text">{booking.sessionTime}</p>
                </div>
              </div>

              {/* Status */}
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <h3 className="text-sm font-semibold text-text/70 mb-2">Status</h3>
                  <span
                    className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${
                      booking.status === "confirmed" || booking.status === "completed"
                        ? "bg-primary-lighter text-primary"
                        : booking.status === "pending"
                        ? "bg-yellow-100 text-yellow-700"
                        : "bg-secondary text-text/70"
                    }`}
                  >
                    {booking.status}
                  </span>
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-text/70 mb-2">Payment Status</h3>
                  <span
                    className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${
                      booking.paymentStatus === "paid"
                        ? "bg-green-100 text-green-700"
                        : booking.paymentStatus === "not_paid"
                        ? "bg-red-100 text-red-700"
                        : "bg-secondary text-text/70"
                    }`}
                  >
                    {booking.paymentStatus === "not_paid" ? "Not Paid" : booking.paymentStatus}
                  </span>
                </div>
              </div>

              {/* User Information (if available) */}
              {booking.user && (
                <div>
                  <h3 className="text-sm font-semibold text-text/70 mb-2">Client Information</h3>
                  <div className="bg-secondary/50 rounded-xl p-4 space-y-2">
                    <p className="text-text">
                      <span className="font-semibold">Name:</span> {booking.user.name}
                    </p>
                    <p className="text-text">
                      <span className="font-semibold">Email:</span> {booking.user.email}
                    </p>
                  </div>
                </div>
              )}

              {/* Payment Information */}
              {booking.payment && (
                <div>
                  <h3 className="text-sm font-semibold text-text/70 mb-2">Payment Information</h3>
                  <div className="bg-secondary/50 rounded-xl p-4 space-y-2">
                    <p className="text-text">
                      <span className="font-semibold">Amount:</span> {typeof booking.payment.amount === 'number' ? booking.payment.amount.toLocaleString() : parseFloat(booking.payment.amount || '0').toLocaleString()} TZS
                    </p>
                    {booking.payment.transactionId && (
                      <p className="text-text">
                        <span className="font-semibold">Transaction ID:</span> {booking.payment.transactionId}
                      </p>
                    )}
                    <p className="text-text">
                      <span className="font-semibold">Status:</span> {booking.payment.status}
                    </p>
                  </div>
                </div>
              )}

              {/* Timestamps */}
              <div className="grid md:grid-cols-2 gap-4 pt-4 border-t-2 border-secondary">
                <div>
                  <h3 className="text-sm font-semibold text-text/70 mb-2">Created</h3>
                  <p className="text-text text-sm">
                    {new Date(booking.createdAt).toLocaleString("en-US", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-text/70 mb-2">Last Updated</h3>
                  <p className="text-text text-sm">
                    {new Date(booking.updatedAt).toLocaleString("en-US", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-4 border-t-2 border-secondary">
                {(booking.paymentStatus === "not_paid" || booking.paymentStatus === "pending") && onPaymentClick && (
                  <Button
                    onClick={() => {
                      onPaymentClick(booking.id);
                      onClose();
                    }}
                    className="flex-1"
                  >
                    Pay Now
                  </Button>
                )}
                <Button onClick={onClose} variant="outline" className="flex-1">
                  Close
                </Button>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

