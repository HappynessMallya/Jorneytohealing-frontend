"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/authStore";
import PostsList from "@/components/PostsList";
import HeroQuestionnaire from "@/components/HeroQuestionnaire";

export default function Home() {
  const router = useRouter();
  const { isLoggedIn } = useAuthStore();

  return (
    <main className="min-h-screen bg-secondary overflow-hidden">
      {/* Hero Section with Questionnaire - BetterHelp Style */}
      <section className="relative bg-primary text-white pt-16 pb-20 md:pb-32 overflow-hidden">
        {/* Organic blob shapes */}
        <div className="absolute top-0 left-0 w-96 h-96 bg-accent-green organic-blob opacity-20 -translate-x-1/2 -translate-y-1/2"></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-accent-green organic-blob opacity-20 translate-x-1/2 translate-y-1/2"></div>
        
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          {/* Progress Indicator - BetterHelp Style */}
          <div className="flex justify-center gap-2 mb-8">
            {Array.from({ length: 6 }).map((_, index) => (
              <div
                key={index}
                className={`h-1 rounded-full transition-all duration-300 ${
                  index === 0 ? "bg-accent-green w-12" : "bg-white/30 w-12"
                }`}
              />
            ))}
          </div>

          <div className="max-w-4xl mx-auto text-center mb-8">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-4 leading-tight">
              Convenient and affordable therapy with{" "}
              <span className="text-accent-green">TherapyPlatform</span>
            </h1>
            <p className="text-lg md:text-xl text-white/90 leading-relaxed max-w-3xl mx-auto">
              TherapyPlatform will match you to one of our licensed therapists based upon your location, preferences, and therapist availability.
            </p>
          </div>

          {/* Questionnaire Card - Embedded in Hero */}
          <HeroQuestionnaire />
        </div>
        
        {/* Wave separator */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-20">
            <path d="M0 120L60 110C120 100 240 80 360 70C480 60 600 60 720 65C840 70 960 80 1080 85C1200 90 1320 90 1380 90L1440 90V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0Z" fill="#F5F7F4"/>
          </svg>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-secondary relative">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-6xl mx-auto">
            {/* Feature 1 */}
            <div className="bg-white rounded-2xl p-8 shadow-soft hover:shadow-medium transition-all duration-300">
              <div className="w-16 h-16 bg-primary-lighter rounded-full flex items-center justify-center mb-6">
                <svg className="w-8 h-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-text mb-3">
                It&apos;s <span className="text-primary">Professional.</span>
              </h3>
              <p className="text-text-light leading-relaxed">
                All therapists are licensed, accredited, and experienced professionals.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="bg-white rounded-2xl p-8 shadow-soft hover:shadow-medium transition-all duration-300">
              <div className="w-16 h-16 bg-primary-lighter rounded-full flex items-center justify-center mb-6">
                <svg className="w-8 h-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-text mb-3">
                It&apos;s <span className="text-primary">Affordable.</span>
              </h3>
              <p className="text-text-light leading-relaxed">
                Therapy is accessible and affordable, with plans starting at competitive rates.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="bg-white rounded-2xl p-8 shadow-soft hover:shadow-medium transition-all duration-300">
              <div className="w-16 h-16 bg-primary-lighter rounded-full flex items-center justify-center mb-6">
                <svg className="w-8 h-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-text mb-3">
                It&apos;s <span className="text-primary">Convenient.</span>
              </h3>
              <p className="text-text-light leading-relaxed">
                Get matched and start therapy from the comfort of your own space, on your schedule.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="bg-white rounded-2xl p-8 shadow-soft hover:shadow-medium transition-all duration-300">
              <div className="w-16 h-16 bg-primary-lighter rounded-full flex items-center justify-center mb-6">
                <svg className="w-8 h-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-text mb-3">
                It&apos;s <span className="text-primary">Effective.</span>
              </h3>
              <p className="text-text-light leading-relaxed">
                Research shows online therapy can be just as effective as in-person sessions.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Join Section */}
      <section className="py-20 bg-white relative overflow-hidden">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-6xl mx-auto">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div>
                <h2 className="text-4xl md:text-5xl font-bold text-text mb-6 leading-tight">
                  Join over <span className="text-primary">6,000,000</span> people worldwide who decided to{" "}
                  <span className="text-primary">get help</span> and{" "}
                  <span className="text-primary">get happy</span> with TherapyPlatform
                </h2>
                <button
                  onClick={() => router.push("/login?signup=true")}
                  className="bg-primary hover:bg-primary-hover text-white px-8 py-4 rounded-full text-lg font-semibold shadow-large transition-all duration-300 transform hover:scale-105 mt-8"
                >
                  Get Started
                </button>
                <div className="mt-8 flex items-center gap-2 text-text-light text-sm">
                  <svg className="w-5 h-5 text-primary" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span>256-bit SSL SECURE</span>
                </div>
              </div>
              <div className="relative">
                <div className="absolute top-0 right-0 w-64 h-64 bg-accent-green organic-blob opacity-30"></div>
                <div className="bg-gradient-to-br from-primary-lighter to-accent-green rounded-3xl p-8 shadow-large relative z-10">
                  <div className="bg-white rounded-2xl p-6">
                    <h3 className="text-2xl font-bold text-text mb-4">Start Your Journey</h3>
                    <p className="text-text-light mb-6">
                      Take our quick questionnaire to get matched with the perfect therapist for you.
                    </p>
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-white font-semibold">1</div>
                        <span className="text-text">Answer a few questions</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-white font-semibold">2</div>
                        <span className="text-text">Get matched with a therapist</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-white font-semibold">3</div>
                        <span className="text-text">Start your healing journey</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Resources Section */}
      <section className="py-20 bg-secondary">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-4xl font-bold text-text mb-12 text-center">
              Resources & Insights
            </h2>
            <PostsList />
          </div>
        </div>
      </section>
    </main>
  );
}
