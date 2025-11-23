"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

interface SuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  message: string;
  buttonText?: string;
  redirectTo?: string;
}

export default function SuccessModal({
  isOpen,
  onClose,
  title,
  message,
  buttonText = "Continue",
  redirectTo,
}: SuccessModalProps) {
  const router = useRouter();

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  const handleContinue = () => {
    onClose();
    if (redirectTo) {
      router.push(redirectTo);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl p-8 md:p-10 shadow-large max-w-md w-full animate-in zoom-in-95 duration-200">
        <div className="text-center">
          {/* Success Icon */}
          <div className="mx-auto w-16 h-16 bg-primary-lighter rounded-full flex items-center justify-center mb-6">
            <svg
              className="w-10 h-10 text-primary"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>

          <h2 className="text-2xl md:text-3xl font-bold text-text mb-3">
            {title}
          </h2>
          <p className="text-text-light mb-8 leading-relaxed">{message}</p>

          <button
            onClick={handleContinue}
            className="w-full h-12 rounded-full bg-primary hover:bg-primary-hover text-white font-semibold text-base shadow-soft hover:shadow-medium transition-all duration-200"
          >
            {buttonText}
          </button>
        </div>
      </div>
    </div>
  );
}

