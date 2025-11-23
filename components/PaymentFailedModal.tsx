"use client";

interface PaymentFailedModalProps {
  isOpen: boolean;
  onClose: () => void;
  message?: string;
}

export default function PaymentFailedModal({
  isOpen,
  onClose,
  message = "Payment is taking longer than expected. Please check your phone and try again if needed.",
}: PaymentFailedModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl p-8 md:p-10 shadow-large max-w-md w-full animate-in zoom-in-95 duration-200">
        <div className="text-center">
          {/* Error Icon */}
          <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-6">
            <svg
              className="w-10 h-10 text-red-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </div>

          <h2 className="text-2xl md:text-3xl font-bold text-text mb-3">
            Payment Failed
          </h2>
          <p className="text-text-light mb-8 leading-relaxed">{message}</p>

          <button
            onClick={onClose}
            className="w-full h-12 rounded-full bg-primary hover:bg-primary-hover text-white font-semibold text-base shadow-soft hover:shadow-medium transition-all duration-200"
          >
            OK
          </button>
        </div>
      </div>
    </div>
  );
}



