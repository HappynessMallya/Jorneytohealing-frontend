"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";

interface DashboardSidebarProps {
  activeView: string;
  onViewChange: (view: string) => void;
}

export default function DashboardSidebar({ activeView, onViewChange }: DashboardSidebarProps) {
  const router = useRouter();

  const menuItems = [
    {
      id: "chat",
      label: "Chat with Therapist",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
      ),
    },
    {
      id: "bookings",
      label: "Bookings",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      ),
    },
    {
      id: "sessions",
      label: "Sessions",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
        </svg>
      ),
    },
    {
      id: "payments",
      label: "Payments",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
        </svg>
      ),
    },
    {
      id: "questionnaire",
      label: "Questionnaire",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
    },
  ];

  return (
    <aside className="w-full md:w-64 bg-white rounded-2xl shadow-soft p-6 h-fit md:sticky md:top-4">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-text">Dashboard</h2>
        <p className="text-sm text-text/70 mt-1">Manage your therapy journey</p>
      </div>

      <nav className="space-y-2">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onViewChange(item.id)}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 text-left ${
              activeView === item.id
                ? "bg-primary text-white shadow-soft"
                : "text-text hover:bg-secondary hover:text-primary"
            }`}
          >
            <span className={activeView === item.id ? "text-white" : "text-primary"}>
              {item.icon}
            </span>
            <span className="font-medium">{item.label}</span>
          </button>
        ))}
      </nav>

      {/* Quick Actions */}
      <div className="mt-8 pt-8 border-t border-secondary">
        <h3 className="text-sm font-semibold text-text/70 mb-3">Quick Actions</h3>
        <div className="space-y-2">
          <button
            onClick={() => router.push("/booking")}
            className="w-full px-4 py-2 text-sm font-medium text-primary hover:bg-primary-lighter rounded-xl transition-colors"
          >
            Book New Session
          </button>
        </div>
      </div>
    </aside>
  );
}

