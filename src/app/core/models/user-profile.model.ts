export type AgeGroup = '6-8' | '9-11' | '12-13' | '14-15';

// ─── Système scolaire MAROCAIN — Cycles Primaire et Collège (6 à 15 ans) ───
export type EducationLevel =
  // Primaire (6 ans → 11/12 ans)
  | '1ère année primaire' | '2ème année primaire' | '3ème année primaire'
  | '4ème année primaire' | '5ème année primaire' | '6ème année primaire'
  // Collège (12 ans → 15 ans)
  | '1ère année collège' | '2ème année collège' | '3ème année collège';

export type AnyEducationLevel = EducationLevel | string;

export function getSchoolCategory(level: AnyEducationLevel): 'primaire' | 'collège' | 'unknown' {
  const primary = ['1ère année primaire', '2ème année primaire', '3ème année primaire', '4ème année primaire', '5ème année primaire', '6ème année primaire'];
  const middle  = ['1ère année collège', '2ème année collège', '3ème année collège'];

  if (primary.includes(level)) return 'primaire';
  if (middle.includes(level))  return 'collège';
  return 'unknown';
}

/**
 * Returns education levels available for a child / teen aged 6 to 15.
 */
export function getEducationLevelsForAge(age: number | null): EducationLevel[] {
  if (!age || age <= 6) return ['1ère année primaire'];
  if (age === 7)  return ['1ère année primaire', '2ème année primaire'];
  if (age === 8)  return ['2ème année primaire', '3ème année primaire'];
  if (age === 9)  return ['3ème année primaire', '4ème année primaire'];
  if (age === 10) return ['4ème année primaire', '5ème année primaire'];
  if (age === 11) return ['5ème année primaire', '6ème année primaire'];
  if (age === 12) return ['6ème année primaire', '1ère année collège'];
  if (age === 13) return ['1ère année collège', '2ème année collège'];
  if (age === 14) return ['2ème année collège', '3ème année collège'];
  // 15 ans
  return ['3ème année collège'];
}

/**
 * Returns helper indicating whether age is in the intended 6-15 range.
 */
export function isAgeInTargetRange(age: number | null): boolean {
  return typeof age === 'number' && age >= 6 && age <= 15;
}

/**
 * Returns available study years helper (kept for interface compatibility).
 */
export function getStudyYearsForAge(age: number | null): string[] {
  return [];
}

export function isAgeEducationLevelValid(age: number | null, level: AnyEducationLevel): boolean {
  if (!age || !level) return false;
  const allowed = getEducationLevelsForAge(age);
  return allowed.includes(level as EducationLevel);
}

export interface DiagnosticResult {
  overallScore: number;
  subjectScores: Record<string, number>;
  strengths: string[];
  weaknesses: string[];
  recommendations: string[];
}

export interface UserProfile {
  id: string;
  name: string;
  firstName: string;
  age: number;
  ageGroup: AgeGroup;
  educationLevel: AnyEducationLevel;
  country: string;
  language: string;
  field: string;
  branch: string;
  school: string;
  fieldOfStudy: string;
  studyYear: string;
  onboardingCompleted: boolean;
  subjects: string[];
  objectives: string[];
  difficulties: string[];
  difficultyExplanation: string;
  learningStyles: string[];
  studyTime: string;
  currentLevels?: Record<string, number>;
  diagnosticResults?: DiagnosticResult;
  progress?: {
    globalProgress: number;
    exercisesCompleted: number;
    quizCompleted: number;
    studyTimeTotal: string;
  };
  weakTopics?: string[];
  strongTopics?: string[];
  learningPreferences?: {
    pace: 'slow' | 'moderate' | 'fast';
    tone: 'guided' | 'balanced' | 'independent';
  };
}

export interface OnboardingProfileInput {
  firstName: string;
  age: number;
  ageGroup: AgeGroup;
  educationLevel: AnyEducationLevel;
  country: string;
  language: string;
  field: string;
  branch: string;
  school: string;
  fieldOfStudy: string;
  studyYear: string;
  subjects: string[];
  objectives: string[];
  difficulties: string[];
  difficultyExplanation: string;
  learningStyles: string[];
  studyTime: string;
  diagnosticResults?: DiagnosticResult;
}