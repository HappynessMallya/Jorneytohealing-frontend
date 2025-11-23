"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

interface QuestionnaireAnswers {
  // Initial selection
  therapyType?: string;
  
  // Section 1: Demographics & Basic Info
  fullName?: string;
  ageRange?: string;
  genderIdentity?: string;
  relationshipStatus?: string;
  workOrStudy?: string;
  employmentStatus?: string;
  financialStatus?: string; // Good, Fair, Poor
  
  // Section 2: Mental Health Screening (PHQ-9 style)
  // Over past 2 weeks frequency questions
  littleInterestOrPleasure?: string; // Not at all, Several days, More than half the days, Nearly every day
  feelingDownDepressedHopeless?: string;
  troubleSleeping?: string;
  feelingTiredLittleEnergy?: string;
  poorAppetiteOrOvereating?: string;
  feelingBadAboutYourself?: string;
  troubleConcentrating?: string;
  movingOrSpeakingSlowly?: string;
  thoughtsOfHurtingYourself?: string;
  feelingNervousAnxious?: string;
  notAbleToStopWorrying?: string;
  difficultyWithDailyTasks?: string; // How difficult problems made daily tasks
  
  // Section 3: Current State & Concerns
  therapyReasons?: string[]; // What brings you to therapy
  issueDuration?: string;
  currentMood?: string;
  experiencingAnxietyPanic?: boolean;
  experiencingDepression?: boolean;
  experiencingChronicPain?: boolean;
  medication?: boolean;
  alcoholUse?: string; // Never, Infrequently, Monthly, Weekly, Daily
  physicalHealth?: string; // Good, Fair, Poor
  eatingHabits?: string; // Good, Fair, Poor
  sleepQuality?: string;
  energyLevels?: string;
  
  // Section 4: Background & Preferences
  religionImportance?: string; // Very important, Important, Somewhat important, Not important at all
  religion?: string; // Christianity, Islam, Judaism, Hinduism, Buddhism, Other, Prefer not to say
  spiritual?: boolean;
  christianBasedTherapy?: boolean;
  sexualOrientation?: string;
  intimacyConcerns?: boolean;
  
  // Section 5: Therapy History & Goals
  attendedTherapyBefore?: boolean;
  therapyExperience?: string;
  therapyGoals?: string;
  therapistExpectations?: string[]; // Listens, Explores past, Teaches skills, etc.
  therapistStylePreference?: string; // Gentle, Somewhat gentle, No preference, Somewhat direct, Direct
  therapistFlexibilityPreference?: string; // Flexible, Somewhat flexible, No preference, Somewhat structured, Structured
  therapistFormalityPreference?: string; // Casual, Somewhat casual, No preference, Somewhat formal, Formal
  therapistGenderPreference?: string;
  culturalBackgroundImportant?: string;
  
  // Section 6: Practical Preferences
  sessionPreference?: string; // Video, Phone, Chat
  preferredDaysTimes?: string;
  preferredMethods?: string;
  comfortLevelSharing?: number;
  languagePreference?: string; // English, Swahili, Other
  location?: string; // Country/city
  availability?: string[];
  
  // Section 7: Additional
  additionalInfo?: string;
  suicidalThoughts?: string; // Never, Over a year ago, Over 3 months ago, etc.
}

interface QuestionnaireStore {
  answers: QuestionnaireAnswers;
  currentStep: number;
  pendingSubmission: boolean; // Flag to indicate if questionnaire is ready to submit
  setAnswer: (key: keyof QuestionnaireAnswers, value: any) => void;
  setAnswers: (answers: Partial<QuestionnaireAnswers>) => void;
  setStep: (step: number) => void;
  setPendingSubmission: (pending: boolean) => void;
  reset: () => void;
}

export const useQuestionnaireStore = create<QuestionnaireStore>()(
  persist(
    (set) => ({
      answers: {},
      currentStep: 1,
      pendingSubmission: false,
      setAnswer: (key, value) =>
        set((state) => ({
          answers: { ...state.answers, [key]: value },
        })),
      setAnswers: (newAnswers) =>
        set((state) => ({
          answers: { ...state.answers, ...newAnswers },
        })),
      setStep: (step) => set({ currentStep: step }),
      setPendingSubmission: (pending) => set({ pendingSubmission: pending }),
      reset: () => set({ answers: {}, currentStep: 1, pendingSubmission: false }),
    }),
    {
      name: "questionnaire-storage",
      storage: createJSONStorage(() => localStorage),
    }
  )
);

