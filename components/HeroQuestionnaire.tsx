"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQuestionnaireStore } from "@/stores/questionnaireStore";
import { useAuthStore } from "@/stores/authStore";

export default function HeroQuestionnaire() {
  const router = useRouter();
  const { isLoggedIn } = useAuthStore();
  const { setAnswer, answers } = useQuestionnaireStore();
  const [selectedType, setSelectedType] = useState<string | null>(null);

  const therapyTypes = [
    { id: "individual", label: "Individual (for myself)", description: "One-on-one therapy sessions" },
    { id: "couples", label: "Couples (for myself and my partner)", description: "Couples counseling sessions" },
    { id: "teen", label: "Teen (for my child)", description: "Therapy for teenagers" },
  ];

  const handleSelect = (type: string) => {
    setSelectedType(type);
    setAnswer("therapyType", type);
    
    // Always allow to proceed to questionnaire, login will be required at the end
    setTimeout(() => {
      router.push("/questionnaire");
    }, 300);
  };

  return (
    <div className="bg-white rounded-t-3xl md:rounded-3xl p-8 md:p-10 shadow-large max-w-2xl mx-auto mt-8">
      <h2 className="text-2xl md:text-3xl font-bold text-text mb-2">
        Help us match you to the right therapist
      </h2>
      <p className="text-text-light mb-8">
        What type of therapy are you looking for?
      </p>

      <div className="space-y-4">
        {therapyTypes.map((type) => (
          <button
            key={type.id}
            onClick={() => handleSelect(type.id)}
            className={`w-full text-left p-5 rounded-2xl border-2 transition-all duration-200 ${
              selectedType === type.id
                ? "bg-primary text-white border-primary shadow-medium"
                : "bg-white text-text border-secondary hover:border-primary hover:shadow-soft"
            }`}
          >
            <div className="font-semibold text-lg mb-1">{type.label}</div>
            <div className={`text-sm ${selectedType === type.id ? "text-white/90" : "text-text-light"}`}>
              {type.description}
            </div>
          </button>
        ))}
      </div>

      <div className="mt-6 bg-primary-lighter rounded-2xl p-4 flex items-start gap-3">
        <div className="w-5 h-5 rounded-full border-2 border-primary flex items-center justify-center flex-shrink-0 mt-0.5">
          <span className="text-primary text-xs font-bold">i</span>
        </div>
        <p className="text-text-light text-sm leading-relaxed">
          Let&apos;s walk through the process of finding the best therapist for you! We&apos;ll start off with some basic questions.
        </p>
      </div>
    </div>
  );
}

