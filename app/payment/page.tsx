"use client";

import { useState, useEffect, Suspense, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useBookingStore } from "@/stores/bookingStore";
import { bookingsApi, paymentsApi, bongoPayApi } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import PaymentFailedModal from "@/components/PaymentFailedModal";

function PaymentForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { booking, setBooking } = useBookingStore();
  const [loading, setLoading] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>("mobile_money");
  const [paymentStatus, setPaymentStatus] = useState<"idle" | "processing" | "success" | "failed">("idle");
  const [bookingInfo, setBookingInfo] = useState<any>(null);
  const [loadingBooking, setLoadingBooking] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState<string>("");
  const [pollingAttempts, setPollingAttempts] = useState(0);
  const [orderId, setOrderId] = useState<string | null>(null);
  const [paymentId, setPaymentId] = useState<string | null>(null);
  const [showPaymentFailedModal, setShowPaymentFailedModal] = useState(false);
  const [paymentFailedMessage, setPaymentFailedMessage] = useState<string>("");
  const pollingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isPollingCancelledRef = useRef<boolean>(false);
  const [pollingLogs, setPollingLogs] = useState<string[]>([]);
  const [countdown, setCountdown] = useState<number>(0);
  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Cleanup polling timeout and countdown on unmount
  useEffect(() => {
    return () => {
      if (pollingTimeoutRef.current) {
        clearTimeout(pollingTimeoutRef.current);
      }
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
      }
    };
  }, []);

  // Polling function to check payment status (defined before useEffect)
  // Poll for 40 seconds: 8 attempts at 5 seconds each
  const pollPaymentStatus = async (orderId: string, paymentId: string, maxAttempts: number = 8) => {
    let attempts = 0;
    isPollingCancelledRef.current = false;
    // Don't clear logs - keep the initial logs from POST success
    // setPollingLogs([]);
    
    const startCountdown = (seconds: number) => {
      setCountdown(seconds);
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
      }
      countdownIntervalRef.current = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            if (countdownIntervalRef.current) {
              clearInterval(countdownIntervalRef.current);
            }
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    };
    
    const poll = async (): Promise<void> => {
      // Check if polling was cancelled
      if (isPollingCancelledRef.current) {
        console.log("🛑 Polling cancelled by user");
        setPollingLogs((prev) => [...prev, "🛑 Polling cancelled by user"]);
        return;
      }
      
      attempts++;
      setPollingAttempts(attempts);
      
      const logMessage = `🔄 GET Request #${attempts}/${maxAttempts} - GET https://bongopay.vastlabs.co.tz/api/v1/payment/status/${orderId}`;
      console.log(logMessage);
      setPollingLogs((prev) => [...prev, logMessage]);
      
      try {
        const statusResponse = await bongoPayApi.getPaymentStatus(orderId);
        
        // Check again if cancelled after API call
        if (isPollingCancelledRef.current) {
          console.log("🛑 Polling cancelled by user after status check");
          setPollingLogs((prev) => [...prev, "🛑 Polling cancelled by user"]);
          return;
        }
        
        const statusLog = `📊 Response #${attempts}: Status = ${statusResponse.payment_status}`;
        const transactionInfo = statusResponse.transaction_id 
          ? `Transaction ID: ${statusResponse.transaction_id}` 
          : statusResponse.selcom_transaction_id 
          ? `Selcom Transaction ID: ${statusResponse.selcom_transaction_id}`
          : 'Transaction ID: N/A';
        const responseDetails = `   Order ID: ${statusResponse.order_id}, Amount: ${statusResponse.amount}, ${transactionInfo}`;
        console.log(`📊 GET Status Response (Attempt ${attempts}):`, {
          order_id: statusResponse.order_id,
          payment_status: statusResponse.payment_status,
          amount: statusResponse.amount,
          transaction_id: statusResponse.transaction_id,
          selcom_transaction_id: statusResponse.selcom_transaction_id,
        });
        setPollingLogs((prev) => [...prev, statusLog, responseDetails]);
        
        // Check for both "COMPLETE" and "COMPLETED" (API might return either)
        if (statusResponse.payment_status === "COMPLETE" || statusResponse.payment_status === "COMPLETED") {
          const successLog = "✅ Payment status is COMPLETED!";
          console.log(successLog);
          setPollingLogs((prev) => [...prev, successLog]);
          
          // Clear any pending polling timeout
          if (pollingTimeoutRef.current) {
            clearTimeout(pollingTimeoutRef.current);
            pollingTimeoutRef.current = null;
          }
          
          // Clear countdown
          if (countdownIntervalRef.current) {
            clearInterval(countdownIntervalRef.current);
            setCountdown(0);
          }
          
          // Stop polling immediately
          isPollingCancelledRef.current = true;
          
          // Payment completed - update our backend
          if (!paymentId) {
            console.error("❌ Payment ID not available, cannot update payment status");
            setPaymentStatus("success");
            setLoading(false);
            alert("Payment completed, but unable to update payment record. Please contact support.");
            return;
          }
          
          try {
            // Get transaction ID from BongoPay response (should always be present when COMPLETED)
            const transactionId = statusResponse.transaction_id || statusResponse.selcom_transaction_id;
            
            console.log("🔍 Extracted transaction IDs:", {
              transaction_id: statusResponse.transaction_id,
              selcom_transaction_id: statusResponse.selcom_transaction_id,
              using: transactionId || 'fallback'
            });
            
            if (!transactionId) {
              console.warn("⚠️ No transaction_id found in BongoPay response, using fallback");
              setPollingLogs((prev) => [...prev, "⚠️ Warning: No transaction_id in response, using fallback"]);
            } else {
              setPollingLogs((prev) => [...prev, `✅ Transaction ID captured: ${transactionId}`]);
            }
            
            // Amount from aggregator is in TZS (no conversion needed)
            // Ensure amount is a number
            const amount = typeof statusResponse.amount === 'number' 
              ? statusResponse.amount 
              : parseFloat(statusResponse.amount) || 1000;
            
            const updatePayload = {
              status: "completed",
              amount: amount, // Amount in TZS as number
              transactionId: transactionId || `txn_${Date.now()}`, // Use transaction_id from BongoPay (always present)
              paymentMethod: selectedPaymentMethod,
              paymentAggregatorResponse: {
                status: "completed",
                order_id: statusResponse.order_id,
                transaction_id: statusResponse.transaction_id,
                selcom_transaction_id: statusResponse.selcom_transaction_id,
              },
            };
            
            const updateLog = "🔄 Updating payment in backend...";
            console.log(updateLog);
            console.log("📤 Payload being sent to backend:", JSON.stringify(updatePayload, null, 2));
            setPollingLogs((prev) => [...prev, updateLog, `📤 Payload: ${JSON.stringify(updatePayload)}`]);
            await paymentsApi.updatePaymentWithAggregator(paymentId, updatePayload);
            
            const backendSuccessLog = "✅ Payment updated successfully in backend";
            console.log(backendSuccessLog);
            setPollingLogs((prev) => [...prev, backendSuccessLog]);
            
            setPaymentStatus("success");
            setLoading(false);
            
            // Redirect after a short delay
            setTimeout(() => {
              const sessionType = currentBooking?.sessionType || bookingInfo?.sessionType;
              if (sessionType === "online") {
        router.push("/chat");
      } else {
        router.push("/dashboard");
      }
            }, 2000);
          } catch (updateError: any) {
            console.error("❌ Error updating payment status:", updateError);
            setPollingLogs((prev) => [...prev, "❌ Error updating payment in backend"]);
            // Payment is complete on aggregator side, but failed to update our backend
            // Still show success but log the error
            setPaymentStatus("success");
            setLoading(false);
            alert("Payment completed, but there was an issue updating the status. Please contact support.");
          }
          return;
        } else if (statusResponse.payment_status === "FAILED") {
          const failedLog = "❌ Payment status is FAILED";
          console.log(failedLog);
          setPollingLogs((prev) => [...prev, failedLog]);
          if (countdownIntervalRef.current) {
            clearInterval(countdownIntervalRef.current);
            setCountdown(0);
          }
          setPaymentStatus("failed");
          setLoading(false);
          setPaymentFailedMessage("Payment failed. Please try again.");
          setShowPaymentFailedModal(true);
          return;
        }
        
        // If still pending and haven't reached max attempts, continue polling
        if (attempts < maxAttempts && statusResponse.payment_status === "PENDING") {
          const pendingLog = `⏳ Payment still PENDING, retrying in 5 seconds... (${attempts}/${maxAttempts})`;
          console.log(pendingLog);
          setPollingLogs((prev) => [...prev, pendingLog]);
          
          // Start countdown
          startCountdown(5);
          
          // Poll every 5 seconds - store timeout ref so we can cancel it
          pollingTimeoutRef.current = setTimeout(() => {
            if (!isPollingCancelledRef.current) {
              poll();
            }
          }, 5000);
        } else if (attempts >= maxAttempts) {
          // Max attempts reached (40 seconds), still pending
          const timeoutLog = "⏰ Max polling attempts reached (40 seconds), payment still pending";
          console.log(timeoutLog);
          setPollingLogs((prev) => [...prev, timeoutLog]);
          console.log("❌ Payment failed - not updating backend status");
          if (countdownIntervalRef.current) {
            clearInterval(countdownIntervalRef.current);
            setCountdown(0);
          }
          setPaymentStatus("failed");
          setLoading(false);
          // Show modal instead of alert
          setPaymentFailedMessage("Payment is taking longer than expected. Please check your phone and try again if needed.");
          setShowPaymentFailedModal(true);
        }
      } catch (error: any) {
        console.error(`❌ Error polling payment status (Attempt ${attempts}):`, error);
        console.error("Polling error details:", {
          message: error.message,
          response: error.response?.data,
        });
        setPollingLogs((prev) => [...prev, `❌ Error: ${error.message}`]);
        // If it's not the last attempt, continue polling
        if (attempts < maxAttempts && !isPollingCancelledRef.current) {
          console.log(`🔄 Retrying in 5 seconds... (Attempt ${attempts}/${maxAttempts})`);
          pollingTimeoutRef.current = setTimeout(() => {
            if (!isPollingCancelledRef.current) {
              poll();
            }
          }, 5000);
        } else {
          console.error("❌ Max attempts reached, stopping polling");
          setPaymentStatus("failed");
          setLoading(false);
          setPaymentFailedMessage("Unable to verify payment status. Please check your phone or contact support.");
          setShowPaymentFailedModal(true);
        }
      }
    };
    
    // Start polling immediately (no delay for resume)
    poll();
  };

  // Check if bookingId is in URL params (from dashboard "Pay Now" button)
  useEffect(() => {
    const bookingIdFromUrl = searchParams.get("bookingId");
    const currentBookingId = bookingIdFromUrl || booking?.bookingId;
    
    if (currentBookingId && !bookingInfo) {
      // Load booking info from API
      setLoadingBooking(true);
      bookingsApi.getById(currentBookingId)
        .then((bookingData) => {
          setBookingInfo(bookingData);
          // Set paymentId if available from booking
          if (bookingData.payment?.id) {
            setPaymentId(bookingData.payment.id);
          }
          // Set order_id to bookingId (we use bookingId as order_id)
          setOrderId(bookingData.id);
          
          // Set booking in store for consistency
          setBooking({
            sessionType: bookingData.sessionType,
            sessionDate: new Date(bookingData.sessionDate).toISOString().split("T")[0],
            sessionTime: bookingData.sessionTime,
            bookingId: bookingData.id,
          });
          
          // Don't auto-start polling - user must click "Pay Now" button
          // The order_id is set so it can be used when user initiates payment
        })
        .catch((error) => {
          console.error("Error loading booking:", error);
          alert("Failed to load booking information");
          router.push("/dashboard");
        })
        .finally(() => {
          setLoadingBooking(false);
        });
    } else if (!booking && !bookingIdFromUrl) {
      router.push("/booking");
    } else if (currentBookingId && bookingInfo && !orderId) {
      // If we already have booking info, set order_id
      setOrderId(currentBookingId);
      
      // Don't auto-start polling - user must click "Pay Now" button
      // The order_id is set so it can be used when user initiates payment
    }
  }, [searchParams, booking, router, setBooking]);

  // Use booking from store or from API
  const currentBooking = booking || bookingInfo;

  const handlePayment = async () => {
    const bookingId = currentBooking?.bookingId || bookingInfo?.id;
    if (!bookingId) return;

    if (!selectedPaymentMethod) {
      alert("Please select a payment method");
      return;
    }

    if (!phoneNumber || phoneNumber.trim() === "") {
      alert("Please enter your phone number");
      return;
    }

    // Normalize phone number: accept both 255... and 0... formats
    // Convert 0... to 255... format
    let normalizedPhone = phoneNumber.replace(/\s+/g, ""); // Remove spaces
    
    // If starts with 0, replace with 255
    if (normalizedPhone.startsWith("0")) {
      normalizedPhone = "255" + normalizedPhone.substring(1);
    }
    
    // Validate phone number format (should be 12 digits starting with 255)
    const phoneRegex = /^255\d{9}$/;
    if (!phoneRegex.test(normalizedPhone)) {
      alert("Please enter a valid phone number (e.g., 255759123123 or 0759123123)");
      return;
    }

    setLoading(true);
    setPaymentStatus("processing");
    setPollingAttempts(0);
    
    try {
      const sessionPrice = 1000; // Session price in TZS (Tanzanian Shillings)
      // TZS doesn't use cents, so amount is sent directly as 1000
      
      // Get or create payment record
      let currentPaymentId = paymentId;
      
      // If payment doesn't exist, get it from booking or create it
      if (!currentPaymentId) {
        // Try to get payment from booking
        if (bookingInfo?.payment?.id) {
          currentPaymentId = bookingInfo.payment.id;
        } else {
          // Create payment record if it doesn't exist
          try {
            const paymentResponse = await paymentsApi.create({
              bookingId,
              amount: sessionPrice,
              currency: "TZS",
              paymentMethod: selectedPaymentMethod,
              status: "pending",
            });
            currentPaymentId = paymentResponse.id;
            setPaymentId(currentPaymentId);
          } catch (createError: any) {
            console.error("Error creating payment record:", createError);
            // Continue anyway - we can still process with aggregator
          }
        }
      }
      
      // Use bookingId as order_id (simpler and already stored)
      const orderIdToUse = bookingId;
      setOrderId(orderIdToUse);
      
      // Normalize phone number for sending (convert 0... to 255...)
      let normalizedPhone = phoneNumber.replace(/\s+/g, "");
      if (normalizedPhone.startsWith("0")) {
        normalizedPhone = "255" + normalizedPhone.substring(1);
      }
      
      // Create payment with BongoPay aggregator
      console.log("🔄 Creating payment with BongoPay aggregator...");
      console.log("Request payload:", {
        phone: normalizedPhone,
        amount: sessionPrice,
        order_id: orderIdToUse,
        callback_url: `${window.location.origin}/api/payment/callback`,
      });

      const aggregatorResponse = await bongoPayApi.createPayment({
        phone: normalizedPhone, // Use normalized phone (always 255...)
        amount: sessionPrice, // Amount in TZS (1000)
        order_id: orderIdToUse, // Use bookingId as order_id
        callback_url: `${window.location.origin}/api/payment/callback`,
      });
      
      console.log("✅ BongoPay POST response received:", aggregatorResponse);
      
      // Check for SUCCESS result (BongoPay returns result: "SUCCESS")
      if (aggregatorResponse.result === "SUCCESS") {
        console.log("✅ Payment creation successful, starting status checks immediately...");
        
        // Add initial log to show we're about to start checking
        setPollingLogs(["✅ Payment created successfully", "🔄 Starting to check payment status in 2 seconds..."]);
        
        // Start polling immediately (or with minimal 2 second delay to let push notification be sent)
        setTimeout(() => {
          console.log("🔄 Starting to poll payment status...");
          const startLog = "🔄 Starting GET requests to check payment status...";
          setPollingLogs((prev) => [...prev, startLog]);
          
          if (currentPaymentId) {
            pollPaymentStatus(orderIdToUse, currentPaymentId);
          } else {
            // If we don't have paymentId, we can't update it later
            // But we can still poll and show status
            pollPaymentStatus(orderIdToUse, "");
          }
        }, 2000); // Minimal delay (2 seconds) before first poll
      } else {
        console.error("❌ Payment creation failed:", aggregatorResponse);
        throw new Error(aggregatorResponse.message || "Failed to create payment with aggregator");
      }
    } catch (error: any) {
      console.error("❌ Error processing payment:", error);
      console.error("Payment error details:", {
        message: error.message,
        response: error.response?.data,
        stack: error.stack,
      });
      setPaymentStatus("failed");
      setLoading(false);
      const errorMessage = error?.response?.data?.message || error?.message || "Payment failed. Please try again.";
      console.error("Error message to show user:", errorMessage);
      alert(errorMessage);
    }
  };

  const handleCancelPayment = () => {
    console.log("🛑 User cancelled payment");
    
    // Stop polling
    isPollingCancelledRef.current = true;
    
    // Clear any pending polling timeout
    if (pollingTimeoutRef.current) {
      clearTimeout(pollingTimeoutRef.current);
      pollingTimeoutRef.current = null;
    }
    
    // Clear countdown
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
      setCountdown(0);
    }
    
    // Reset states
    setLoading(false);
    setPaymentStatus("failed");
    setPollingAttempts(0);
    setPollingLogs((prev) => [...prev, "🛑 Payment cancelled by user"]);
    
    // Show payment failed modal with cancellation message
    setPaymentFailedMessage("Payment was cancelled. Please try again when you're ready to complete the payment.");
    setShowPaymentFailedModal(true);
  };

  if (loadingBooking) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-secondary to-accent py-16 flex items-center justify-center">
        <div className="text-center">
          <p className="text-text/70">Loading booking information...</p>
        </div>
      </main>
    );
  }

  if (!currentBooking) {
    return null;
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-secondary to-accent py-16">
      <div className="container mx-auto px-4 max-w-3xl">
        <div className="bg-white rounded-2xl p-8 shadow-soft">
          <h1 className="text-4xl font-bold text-text mb-2">Complete Payment</h1>
          <p className="text-text/70 mb-8">Review your booking details</p>

          {/* Booking Summary */}
          <div className="bg-secondary rounded-xl p-6 mb-8">
            <h2 className="text-xl font-semibold text-text mb-4">Booking Summary</h2>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-text/70">Session Type:</span>
                <span className="text-text font-semibold">
                  {currentBooking.sessionType === "physical" ? "Physical Session" : "Online Chat Session"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-text/70">Date:</span>
                <span className="text-text font-semibold">
                  {currentBooking.sessionDate 
                    ? (typeof currentBooking.sessionDate === "string" && currentBooking.sessionDate.includes("T")
                      ? new Date(currentBooking.sessionDate).toLocaleDateString()
                      : currentBooking.sessionDate)
                    : bookingInfo?.sessionDate 
                    ? new Date(bookingInfo.sessionDate).toLocaleDateString()
                    : "N/A"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-text/70">Time:</span>
                <span className="text-text font-semibold">
                  {currentBooking.sessionTime || bookingInfo?.sessionTime || "N/A"}
                </span>
              </div>
              {bookingInfo && (
                <>
                  <div className="flex justify-between pt-2 border-t border-primary/20">
                    <span className="text-text/70">Booking Status:</span>
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                      bookingInfo.status === "confirmed"
                        ? "bg-primary-lighter text-primary"
                        : bookingInfo.status === "pending"
                        ? "bg-yellow-100 text-yellow-700"
                        : "bg-secondary text-text/70"
                    }`}>
                      {bookingInfo.status}
                    </span>
                  </div>
                  {bookingInfo.paymentStatus && (
                    <div className="flex justify-between">
                      <span className="text-text/70">Payment Status:</span>
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                        bookingInfo.paymentStatus === "paid"
                          ? "bg-green-100 text-green-700"
                          : bookingInfo.paymentStatus === "not_paid"
                          ? "bg-red-100 text-red-700"
                          : "bg-yellow-100 text-yellow-700"
                      }`}>
                        {bookingInfo.paymentStatus === "not_paid" ? "Not Paid" : bookingInfo.paymentStatus}
                      </span>
              </div>
                  )}
                </>
              )}
              <div className="flex justify-between pt-4 border-t border-primary/20">
                <span className="text-text font-semibold">Total:</span>
                <span className="text-primary text-2xl font-bold">1,000 TZS</span>
              </div>
            </div>
          </div>

          {/* Phone Number Input */}
          <div className="mb-8">
            <Label htmlFor="phone" className="text-text font-semibold mb-2 block">
              Phone Number
            </Label>
            <Input
              id="phone"
              type="tel"
              placeholder="0759123123 or 255759123123"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              disabled={loading || paymentStatus === "processing" || paymentStatus === "success"}
              className="w-full"
            />
            <p className="text-sm text-text/60 mt-2">
              Enter your phone number (e.g., 255759123123 or 0759123123)
            </p>
          </div>

          {/* Payment Method Selection */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-text mb-4">Select Payment Method</h2>
            <div className="grid md:grid-cols-2 gap-4 mb-6">
              {[
                { id: "credit_card", label: "Credit/Debit Card", icon: "💳", disabled: true },
                { id: "mobile_money", label: "Mobile Money", icon: "📱", disabled: false },
                { id: "bank_transfer", label: "Bank Transfer", icon: "🏦", disabled: true },
                { id: "other", label: "Other", icon: "💵", disabled: true },
              ].map((method) => (
                <button
                  key={method.id}
                  type="button"
                  onClick={() => !method.disabled && setSelectedPaymentMethod(method.id)}
                  disabled={method.disabled}
                  className={`p-6 rounded-xl border-2 transition-all duration-300 text-left ${
                    method.disabled
                      ? "border-secondary/30 bg-secondary/20 opacity-40 cursor-not-allowed"
                      : selectedPaymentMethod === method.id
                      ? "border-primary bg-primary/5"
                      : "border-secondary hover:border-primary"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{method.icon}</span>
                    <span className="font-semibold text-text">{method.label}</span>
                  </div>
                </button>
              ))}
            </div>

            {paymentStatus === "processing" && (
              <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4 mb-4">
                <div className="flex items-center gap-3 mb-2">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                  <p className="text-sm text-blue-800 font-semibold">
                    Processing Payment...
                  </p>
                </div>
                <p className="text-sm text-blue-700 mb-3">
                  Please check your phone for the payment prompt.
                </p>
                
                {/* Polling Logs */}
                {pollingLogs.length > 0 && (
                  <div className="bg-white rounded-lg p-3 mb-3 max-h-48 overflow-y-auto">
                    <p className="text-xs font-semibold text-blue-900 mb-2">Payment Status Logs:</p>
                    <div className="space-y-1">
                      {pollingLogs.map((log, index) => (
                        <p key={index} className="text-xs text-blue-800 font-mono">
                          {log}
                        </p>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Countdown and Progress */}
                <div className="space-y-2">
                  {countdown > 0 && (
                    <p className="text-sm text-blue-700 font-semibold">
                      Next check in: {countdown} seconds
                    </p>
                  )}
                  {pollingAttempts > 0 && (
                    <div className="w-full bg-blue-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                        style={{ width: `${Math.min((pollingAttempts / 8) * 100, 100)}%` }}
                      ></div>
                    </div>
                  )}
                  <p className="text-xs text-blue-600">
                    Attempt {pollingAttempts} of 8
                  </p>
                </div>
              </div>
            )}

            {paymentStatus === "success" && (
              <div className="bg-green-50 border-2 border-green-200 rounded-xl p-4 mb-4">
                <p className="text-sm text-green-800">
                  <strong>Payment Successful!</strong> Your payment has been confirmed.
                </p>
              </div>
            )}

            {paymentStatus === "failed" && (
              <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4 mb-4">
                <p className="text-sm text-red-800">
                  <strong>Payment Failed.</strong> Please try again or select a different payment method.
                </p>
              </div>
            )}

            <div className="bg-yellow-50 border-2 border-yellow-200 rounded-xl p-4 mb-4">
              <p className="text-sm text-yellow-800">
                <strong>Note:</strong> A payment record has been created with status &quot;pending&quot;. 
                Once the payment aggregator confirms the payment, the status will be updated to &quot;completed&quot;.
              </p>
            </div>
          </div>

          {/* Payment Button and Cancel Button */}
          <div className="flex gap-3">
            {paymentStatus === "processing" ? (
              <>
                <Button
                  onClick={handleCancelPayment}
                  className="flex-1"
                  size="lg"
                  variant="outline"
                >
                  Cancel Payment
                </Button>
                <Button
                  disabled
                  className="flex-1"
                  size="lg"
                >
                  Processing Payment...
                </Button>
              </>
            ) : (
          <Button
            onClick={handlePayment}
                disabled={loading || !selectedPaymentMethod || !phoneNumber || paymentStatus === "success"}
            className="w-full"
            size="lg"
          >
                {paymentStatus === "success"
                  ? "Payment Successful!"
                  : !selectedPaymentMethod
                  ? "Select Payment Method"
                  : !phoneNumber
                  ? "Enter Phone Number"
                  : loading
                  ? "Processing..."
                  : `Pay 1,000 TZS`}
          </Button>
            )}
          </div>
          
          {paymentStatus === "success" && (
            <p className="text-center text-text/70 text-sm mt-4">
              Redirecting to your dashboard...
            </p>
          )}
        </div>
      </div>

      {/* Payment Failed Modal */}
      <PaymentFailedModal
        isOpen={showPaymentFailedModal}
        onClose={() => {
          setShowPaymentFailedModal(false);
          setPaymentStatus("idle");
          setPaymentFailedMessage("");
        }}
        message={paymentFailedMessage || "Payment is taking longer than expected. Please check your phone and try again if needed."}
      />
    </main>
  );
}

export default function PaymentPage() {
  return (
    <Suspense fallback={
      <main className="min-h-screen bg-gradient-to-b from-secondary to-accent py-16 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-text/70">Loading...</p>
        </div>
      </main>
    }>
      <PaymentForm />
    </Suspense>
  );
}


