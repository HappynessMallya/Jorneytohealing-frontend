"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/authStore";

export default function Navbar() {
  const router = useRouter();
  const { isLoggedIn, user, logout } = useAuthStore();

  return (
    <nav className="bg-white/95 backdrop-blur-sm sticky top-0 z-50 border-b border-secondary/50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link href="/" className="flex items-center space-x-2 group">
            <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
              <span className="text-white font-bold text-lg">T</span>
            </div>
            <span className="text-xl font-semibold text-primary group-hover:text-primary-hover transition-colors">
              TherapyPlatform
            </span>
          </Link>
          <div className="hidden md:flex gap-6 items-center">
            <Link 
              href="/" 
              className="text-text-light hover:text-primary transition-colors text-sm font-medium"
            >
              Home
            </Link>
            <Link 
              href="/privacy" 
              className="text-text-light hover:text-primary transition-colors text-sm font-medium"
            >
              Privacy
            </Link>
            {isLoggedIn ? (
              <>
                {user?.role === "admin" && (
                  <Link
                    href="/admin"
                    className="text-text-light hover:text-primary transition-colors text-sm font-medium"
                  >
                    Admin
                  </Link>
                )}
                <Link
                  href="/dashboard"
                  className="text-text-light hover:text-primary transition-colors text-sm font-medium"
                >
                  Dashboard
                </Link>
                <button
                  onClick={async () => {
                    await logout();
                    router.push("/");
                  }}
                  className="text-text-light hover:text-primary transition-colors text-sm font-medium"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link 
                  href="/login" 
                  className="text-text-light hover:text-primary transition-colors text-sm font-medium"
                >
                  Login
                </Link>
                <Link
                  href="/login?signup=true"
                  className="bg-primary hover:bg-primary-hover text-white px-5 py-2.5 rounded-full font-semibold text-sm transition-all duration-200 shadow-soft hover:shadow-medium"
                >
                  Get Started
                </Link>
              </>
            )}
          </div>
          {/* Mobile menu button */}
          <div className="md:hidden">
            {!isLoggedIn ? (
              <Link
                href="/login?signup=true"
                className="bg-primary hover:bg-primary-hover text-white px-4 py-2 rounded-full font-semibold text-sm transition-all"
              >
                Get Started
              </Link>
            ) : (
              <Link
                href="/dashboard"
                className="text-primary font-medium text-sm"
              >
                Dashboard
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}

