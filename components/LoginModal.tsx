"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/authStore";
import { authApi } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function LoginModal({ isOpen, onClose, onSuccess }: LoginModalProps) {
  const router = useRouter();
  const { login } = useAuthStore();
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    name: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (isLogin) {
        const response = await authApi.login({
          email: formData.email,
          password: formData.password,
        });
        await login(response.user, response.token);
        // Redirect admins to admin dashboard
        if (response.user.role === "admin") {
          router.push("/admin");
        }
        onSuccess();
        onClose();
      } else {
        const response = await authApi.register({
          email: formData.email,
          password: formData.password,
          name: formData.name,
        });
        await login(response.user, response.token);
        onSuccess();
        onClose();
      }
    } catch (err: any) {
      setError(err.response?.data?.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-3xl p-8 md:p-10 shadow-large max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl md:text-3xl font-bold text-text">
            {isLogin ? "Login to Continue" : "Create Account"}
          </h2>
          <button
            onClick={onClose}
            className="text-text-light hover:text-text transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <p className="text-text-light mb-6">
          {isLogin
            ? "Sign in to submit your questionnaire"
            : "Create an account to continue"}
        </p>

        {error && (
          <div className="bg-red-50 border-2 border-red-200 text-red-700 rounded-xl p-4 mb-6">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {!isLogin && (
            <div>
              <Label htmlFor="modal-name" className="text-text font-medium mb-2 block">
                Full Name
              </Label>
              <Input
                id="modal-name"
                type="text"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                required={!isLogin}
                placeholder="Enter your full name"
                className="h-12 rounded-xl border-2 border-secondary focus:border-primary transition-colors"
              />
            </div>
          )}

          <div>
            <Label htmlFor="modal-email" className="text-text font-medium mb-2 block">
              Email
            </Label>
            <Input
              id="modal-email"
              type="email"
              value={formData.email}
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
              required
              placeholder="Enter your email"
              className="h-12 rounded-xl border-2 border-secondary focus:border-primary transition-colors"
            />
          </div>

          <div>
            <Label htmlFor="modal-password" className="text-text font-medium mb-2 block">
              Password
            </Label>
            <Input
              id="modal-password"
              type="password"
              value={formData.password}
              onChange={(e) =>
                setFormData({ ...formData, password: e.target.value })
              }
              required
              placeholder="Enter your password"
              minLength={6}
              className="h-12 rounded-xl border-2 border-secondary focus:border-primary transition-colors"
            />
          </div>

          <Button 
            type="submit" 
            disabled={loading} 
            className="w-full h-12 rounded-full bg-primary hover:bg-primary-hover text-white font-semibold text-base shadow-soft hover:shadow-medium transition-all duration-200"
          >
            {loading ? "Processing..." : isLogin ? "Sign In" : "Create Account"}
          </Button>
        </form>

        <div className="mt-6 text-center">
          <button
            type="button"
            onClick={() => setIsLogin(!isLogin)}
            className="text-primary hover:text-primary-hover font-medium transition-colors"
          >
            {isLogin
              ? "Don't have an account? Sign up"
              : "Already have an account? Sign in"}
          </button>
        </div>
      </div>
    </div>
  );
}

