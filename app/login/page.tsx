"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuthStore } from "@/stores/authStore";

// Force dynamic rendering
export const dynamic = 'force-dynamic';
import { authApi } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import SuccessModal from "@/components/SuccessModal";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login } = useAuthStore();
  const [isLogin, setIsLogin] = useState(true);

  useEffect(() => {
    // Check if signup parameter is in URL
    const signupParam = searchParams.get("signup");
    if (signupParam === "true") {
      setIsLogin(false);
    }
  }, [searchParams]);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    name: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showSuccessModal, setShowSuccessModal] = useState(false);

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
        // Redirect admins to admin dashboard, users to regular dashboard
        if (response.user.role === "admin") {
          router.push("/admin");
        } else {
          router.push("/dashboard");
        }
      } else {
        const response = await authApi.register({
          email: formData.email,
          password: formData.password,
          name: formData.name,
        });
        await login(response.user, response.token);
        // Show success modal before redirecting
        setShowSuccessModal(true);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-secondary flex items-center justify-center py-16 relative overflow-hidden">
      {/* Organic background shapes */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-accent-green organic-blob opacity-20 -translate-x-1/2 -translate-y-1/2"></div>
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-accent-green organic-blob opacity-20 translate-x-1/2 translate-y-1/2"></div>
      
      <div className="container mx-auto px-4 max-w-md relative z-10">
        <div className="bg-white rounded-3xl p-8 md:p-10 shadow-large">
          <div className="text-center mb-8">
            <h1 className="text-3xl md:text-4xl font-bold text-text mb-2">
              {isLogin ? "Welcome Back" : "Create Your Account"}
            </h1>
            <p className="text-text-light mt-2">
              {isLogin
                ? "Sign in to continue your healing journey"
                : "Start your journey to wellness today"}
            </p>
          </div>

          {error && (
            <div className="bg-red-50 border-2 border-red-200 text-red-700 rounded-xl p-4 mb-6">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {!isLogin && (
              <div>
                <Label htmlFor="name" className="text-text font-medium mb-2 block">
                  Full Name
                </Label>
                <Input
                  id="name"
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
              <Label htmlFor="email" className="text-text font-medium mb-2 block">
                Email
              </Label>
              <Input
                id="email"
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
              <Label htmlFor="password" className="text-text font-medium mb-2 block">
                Password
              </Label>
              <Input
                id="password"
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

      {/* Success Modal */}
      <SuccessModal
        isOpen={showSuccessModal}
        onClose={() => setShowSuccessModal(false)}
        title="Welcome to Your Journey to Healing! 🎉"
        message="Your account has been created successfully. Let's get started by matching you with the right therapist."
        buttonText="Start Questionnaire"
        redirectTo="/questionnaire"
      />
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <main className="min-h-screen bg-secondary flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-text/70">Loading...</p>
        </div>
      </main>
    }>
      <LoginForm />
    </Suspense>
  );
}
