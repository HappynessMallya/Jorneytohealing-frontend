"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useQuestionnaireStore } from "@/stores/questionnaireStore";
import { useAuthStore } from "@/stores/authStore";
import { questionnaireApi } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { Input, Textarea, Label } from "@/components/ui/input";
import LoginModal from "@/components/LoginModal";

export default function QuestionnairePage() {
  const router = useRouter();
  const { isLoggedIn, user, _hasHydrated } = useAuthStore();
  const { answers, currentStep, setAnswer, setStep, pendingSubmission, setPendingSubmission, setAnswers } = useQuestionnaireStore();
  const [loading, setLoading] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [loadingExisting, setLoadingExisting] = useState(true);

  const totalSteps = 3;

  // Load existing questionnaire if user has one
  useEffect(() => {
    const loadExistingQuestionnaire = async () => {
      if (!isLoggedIn) {
        setLoadingExisting(false);
        return;
      }

      try {
        const existingQuestionnaire = await questionnaireApi.getMyQuestionnaire();
        // Pre-fill the form with existing data
        if (existingQuestionnaire) {
          setAnswers({
            fullName: existingQuestionnaire.fullName || "",
            ageRange: existingQuestionnaire.ageRange || "",
            genderIdentity: existingQuestionnaire.genderIdentity || "",
            relationshipStatus: existingQuestionnaire.relationshipStatus || "",
            workOrStudy: existingQuestionnaire.workOrStudy || "",
            therapyReasons: existingQuestionnaire.therapyReasons || [],
            issueDuration: existingQuestionnaire.issueDuration || "",
            attendedTherapyBefore: existingQuestionnaire.attendedTherapyBefore ?? false,
            therapyGoals: existingQuestionnaire.therapyGoals || "",
            sessionPreference: existingQuestionnaire.sessionPreference || "",
            preferredDaysTimes: existingQuestionnaire.preferredDaysTimes || "",
            comfortLevelSharing: existingQuestionnaire.comfortLevelSharing ?? 0,
            preferredMethods: existingQuestionnaire.preferredMethods || "",
            additionalInfo: existingQuestionnaire.additionalInfo || "",
          });
        }
      } catch (error: any) {
        // If questionnaire doesn't exist (404), that's fine - user will create new one
        if (error?.response?.status !== 404) {
          console.error("Error loading existing questionnaire:", error);
        }
      } finally {
        setLoadingExisting(false);
      }
    };

    loadExistingQuestionnaire();
  }, [isLoggedIn, setAnswers]);

  // Check if user just logged in and has pending submission
  useEffect(() => {
    const submitQuestionnaire = async () => {
      if (isLoggedIn && pendingSubmission && !loading) {
        setLoading(true);
        try {
          // Format answers to match API payload structure
          const payload = {
            fullName: answers.fullName || "",
            ageRange: answers.ageRange || "",
            genderIdentity: answers.genderIdentity || "",
            relationshipStatus: answers.relationshipStatus || "",
            workOrStudy: answers.workOrStudy || "",
            therapyReasons: answers.therapyReasons || [],
            issueDuration: answers.issueDuration || "",
            attendedTherapyBefore: answers.attendedTherapyBefore ?? false,
            therapyGoals: answers.therapyGoals || "",
            sessionPreference: answers.sessionPreference || "",
            preferredDaysTimes: answers.preferredDaysTimes || "",
            comfortLevelSharing: answers.comfortLevelSharing ?? 0,
            preferredMethods: answers.preferredMethods || null,
            additionalInfo: answers.additionalInfo || null,
          };
          
          await questionnaireApi.create(payload);
          setPendingSubmission(false);
          router.push("/booking");
        } catch (error: any) {
          console.error("Error submitting questionnaire:", error);
          const errorMessage = error?.response?.data?.message || error?.message || "Failed to submit questionnaire. Please try again.";
          alert(errorMessage);
          setPendingSubmission(false);
        } finally {
          setLoading(false);
        }
      }
    };
    
    submitQuestionnaire();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoggedIn, pendingSubmission]);

  const handleNext = () => {
    if (currentStep < totalSteps) {
      setStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setStep(currentStep - 1);
    }
  };

  const handleSubmit = async () => {
    // If not logged in, show login modal and mark as pending submission
    if (!isLoggedIn) {
      setPendingSubmission(true);
      setShowLoginModal(true);
      return;
    }

    setLoading(true);
    try {
      // Format answers to match API payload structure
      const payload = {
        fullName: answers.fullName || "",
        ageRange: answers.ageRange || "",
        genderIdentity: answers.genderIdentity || "",
        relationshipStatus: answers.relationshipStatus || "",
        workOrStudy: answers.workOrStudy || "",
        therapyReasons: answers.therapyReasons || [],
        issueDuration: answers.issueDuration || "",
        attendedTherapyBefore: answers.attendedTherapyBefore ?? false,
        therapyGoals: answers.therapyGoals || "",
        sessionPreference: answers.sessionPreference || "",
        preferredDaysTimes: answers.preferredDaysTimes || "",
        comfortLevelSharing: answers.comfortLevelSharing ?? 0,
        preferredMethods: answers.preferredMethods || null,
        additionalInfo: answers.additionalInfo || null,
      };
      
      await questionnaireApi.create(payload);
      setPendingSubmission(false);
      router.push("/booking");
    } catch (error: any) {
      console.error("Error submitting questionnaire:", error);
      const errorMessage = error?.response?.data?.message || error?.message || "Failed to submit questionnaire. Please try again.";
      alert(errorMessage);
      setPendingSubmission(false);
    } finally {
      setLoading(false);
    }
  };

  const handleLoginSuccess = () => {
    // This will trigger the useEffect to submit
    setShowLoginModal(false);
  };

  if (loadingExisting) {
    return (
      <main className="min-h-screen bg-secondary py-16 relative overflow-hidden questionnaire-page">
        <div className="container mx-auto px-4 max-w-3xl relative z-20">
          <div className="bg-white rounded-3xl p-8 md:p-10 shadow-large">
            <div className="text-center py-12">
              <p className="text-text/70">Loading questionnaire...</p>
            </div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-secondary py-16 relative overflow-hidden questionnaire-page">
      {/* Organic background shapes */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-accent-green organic-blob opacity-20 translate-x-1/2 -translate-y-1/2 pointer-events-none"></div>
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-accent-green organic-blob opacity-20 -translate-x-1/2 translate-y-1/2 pointer-events-none"></div>
      
      <div className="container mx-auto px-4 max-w-3xl relative z-20">
        <div className="bg-white rounded-3xl p-8 md:p-10 shadow-large">
          <div className="mb-8">
            <h1 className="text-3xl md:text-4xl font-bold text-text mb-3">
              Help us match you to the right therapist
            </h1>
            <p className="text-text-light">
              Step {currentStep} of {totalSteps}
            </p>
          </div>

          {/* Progress Bar - BetterHelp style */}
          <div className="mb-10">
            <div className="flex gap-2">
              {Array.from({ length: totalSteps }).map((_, index) => (
                <div
                  key={index}
                  className={`flex-1 h-1 rounded-full transition-all duration-300 ${
                    index + 1 <= currentStep
                      ? "bg-primary"
                      : "bg-secondary"
                  }`}
                />
              ))}
            </div>
          </div>

          {/* Step 1: About You */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <div>
                <Label htmlFor="fullName" className="text-text font-medium mb-2 block">
                  What&apos;s your full name?
                </Label>
                <Input
                  id="fullName"
                  value={answers.fullName || ""}
                  onChange={(e) => setAnswer("fullName", e.target.value)}
                  placeholder="Enter your full name"
                  className="h-12 rounded-xl border-2 border-secondary focus:border-primary transition-colors"
                />
              </div>
              <div>
                <Label htmlFor="ageRange" className="text-text font-medium mb-2 block">
                  What&apos;s your age range?
                </Label>
                <select
                  id="ageRange"
                  value={answers.ageRange || ""}
                  onChange={(e) => setAnswer("ageRange", e.target.value)}
                  className="flex h-12 w-full rounded-xl border-2 border-secondary bg-white px-4 py-2 text-text focus:outline-none focus:border-primary transition-colors"
                >
                  <option value="">Select age range</option>
                  <option value="18-24">18-24</option>
                  <option value="25-34">25-34</option>
                  <option value="35-44">35-44</option>
                  <option value="45-54">45-54</option>
                  <option value="55-64">55-64</option>
                  <option value="65+">65+</option>
                </select>
              </div>
              <div>
                <Label htmlFor="genderIdentity">What&apos;s your gender identity?</Label>
                <Input
                  id="genderIdentity"
                  value={answers.genderIdentity || ""}
                  onChange={(e) => setAnswer("genderIdentity", e.target.value)}
                  placeholder="e.g., Female, Male, Non-binary, Prefer not to say"
                />
              </div>
              <div>
                <Label htmlFor="relationshipStatus">What&apos;s your relationship status?</Label>
                <select
                  id="relationshipStatus"
                  value={answers.relationshipStatus || ""}
                  onChange={(e) => setAnswer("relationshipStatus", e.target.value)}
                  className="flex h-12 w-full rounded-xl border-2 border-secondary bg-white px-4 py-2 text-text focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="">Select status</option>
                  <option value="Single">Single</option>
                  <option value="In a relationship">In a relationship</option>
                  <option value="Married">Married</option>
                  <option value="Divorced">Divorced</option>
                  <option value="Widowed">Widowed</option>
                  <option value="Prefer not to say">Prefer not to say</option>
                </select>
              </div>
              <div>
                <Label htmlFor="workOrStudy">Do you currently work or study?</Label>
                <Input
                  id="workOrStudy"
                  value={answers.workOrStudy || ""}
                  onChange={(e) => setAnswer("workOrStudy", e.target.value)}
                  placeholder="e.g., Full-time employee, Student, Retired"
                />
              </div>
            </div>
          )}

          {/* Step 2: Therapy Goals */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <div>
                <Label>What brings you to therapy? (select all that apply)</Label>
                <div className="mt-2 space-y-2">
                  {[
                    "Stress",
                    "Anxiety",
                    "Depression",
                    "Relationships",
                    "Trauma",
                    "Self-esteem",
                    "Other",
                  ].map((reason) => (
                    <label key={reason} className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={answers.therapyReasons?.includes(reason) || false}
                        onChange={(e) => {
                          const current = answers.therapyReasons || [];
                          if (e.target.checked) {
                            setAnswer("therapyReasons", [...current, reason]);
                          } else {
                            setAnswer(
                              "therapyReasons",
                              current.filter((r) => r !== reason)
                            );
                          }
                        }}
                        className="w-5 h-5 text-primary focus:ring-primary rounded"
                      />
                      <span className="text-text">{reason}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div>
                <Label htmlFor="issueDuration">How long have you been experiencing this issue?</Label>
                <select
                  id="issueDuration"
                  value={answers.issueDuration || ""}
                  onChange={(e) => setAnswer("issueDuration", e.target.value)}
                  className="flex h-12 w-full rounded-xl border-2 border-secondary bg-white px-4 py-2 text-text focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="">Select duration</option>
                  <option value="Less than a month">Less than a month</option>
                  <option value="1-3 months">1-3 months</option>
                  <option value="3-6 months">3-6 months</option>
                  <option value="6-12 months">6-12 months</option>
                  <option value="More than a year">More than a year</option>
                </select>
              </div>
              <div>
                <Label htmlFor="attendedTherapyBefore">Have you attended therapy before?</Label>
                <select
                  id="attendedTherapyBefore"
                  value={answers.attendedTherapyBefore?.toString() || ""}
                  onChange={(e) =>
                    setAnswer("attendedTherapyBefore", e.target.value === "true")
                  }
                  className="flex h-12 w-full rounded-xl border-2 border-secondary bg-white px-4 py-2 text-text focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="">Select</option>
                  <option value="true">Yes</option>
                  <option value="false">No</option>
                </select>
              </div>
              <div>
                <Label htmlFor="therapyGoals">What are your goals for therapy?</Label>
                <Textarea
                  id="therapyGoals"
                  value={answers.therapyGoals || ""}
                  onChange={(e) => setAnswer("therapyGoals", e.target.value)}
                  placeholder="Share what you hope to achieve..."
                />
              </div>
              <div>
                <Label htmlFor="sessionPreference">Would you prefer in-person or online sessions?</Label>
                <select
                  id="sessionPreference"
                  value={answers.sessionPreference || ""}
                  onChange={(e) => setAnswer("sessionPreference", e.target.value)}
                  className="flex h-12 w-full rounded-xl border-2 border-secondary bg-white px-4 py-2 text-text focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="">Select preference</option>
                  <option value="in-person">In-person</option>
                  <option value="online">Online</option>
                </select>
              </div>
            </div>
          )}

          {/* Step 3: Preferences */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <div>
                <Label htmlFor="preferredDaysTimes">Which days and times generally work best for you?</Label>
                <Textarea
                  id="preferredDaysTimes"
                  value={answers.preferredDaysTimes || ""}
                  onChange={(e) => setAnswer("preferredDaysTimes", e.target.value)}
                  placeholder="e.g., Weekday mornings, Tuesday evenings, etc."
                />
              </div>
              <div>
                <Label htmlFor="preferredMethods">Preferred therapy method (optional)</Label>
                <Input
                  id="preferredMethods"
                  value={answers.preferredMethods || ""}
                  onChange={(e) => setAnswer("preferredMethods", e.target.value)}
                  placeholder="e.g., CBT, Mindfulness, Talk therapy"
                />
              </div>
              <div>
                <Label htmlFor="comfortLevelSharing">
                  How comfortable are you sharing personal information? (1-5)
                </Label>
                <div className="flex items-center space-x-4 mt-2">
                  {[1, 2, 3, 4, 5].map((num) => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => setAnswer("comfortLevelSharing", num)}
                      className={`w-12 h-12 rounded-full border-2 transition-all duration-300 ${
                        answers.comfortLevelSharing === num
                          ? "bg-primary text-white border-primary"
                          : "border-secondary text-text hover:border-primary"
                      }`}
                    >
                      {num}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <Label htmlFor="additionalInfo">Is there anything else you&apos;d like the therapist to know?</Label>
                <Textarea
                  id="additionalInfo"
                  value={answers.additionalInfo || ""}
                  onChange={(e) => setAnswer("additionalInfo", e.target.value)}
                  placeholder="Optional additional information..."
                />
              </div>
            </div>
          )}

          {/* Info Box */}
          <div className="bg-primary-lighter rounded-2xl p-5 mb-8 flex items-start gap-4">
            <div className="w-6 h-6 rounded-full border-2 border-primary flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-primary text-sm font-bold">i</span>
            </div>
            <p className="text-text-light text-sm leading-relaxed">
              Let&apos;s walk through the process of finding the best therapist for you! We&apos;ll start off with some basic questions.
            </p>
          </div>

          {/* Navigation Buttons */}
          <div className="flex justify-between mt-10 pt-8 border-t border-secondary">
            <Button
              variant="outline"
              onClick={handleBack}
              disabled={currentStep === 1}
              className="px-6 py-3 rounded-full border-2 border-secondary hover:border-primary text-text hover:text-primary transition-all"
            >
              Back
            </Button>
            {currentStep < totalSteps ? (
              <Button 
                onClick={handleNext}
                className="px-8 py-3 rounded-full bg-primary hover:bg-primary-hover text-white font-semibold shadow-soft hover:shadow-medium transition-all"
              >
                Next
              </Button>
            ) : (
              <Button 
                onClick={handleSubmit} 
                disabled={loading}
                className="px-8 py-3 rounded-full bg-primary hover:bg-primary-hover text-white font-semibold shadow-soft hover:shadow-medium transition-all"
              >
                {loading ? "Submitting..." : isLoggedIn ? "Submit" : "Login to Submit"}
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Login Modal */}
      <LoginModal
        isOpen={showLoginModal}
        onClose={() => {
          setShowLoginModal(false);
          setPendingSubmission(false);
        }}
        onSuccess={handleLoginSuccess}
      />
    </main>
  );
}

