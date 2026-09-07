export type AgeGroup = '6-12' | '13-16' | '17-20' | '21-30' | '31+';

// ─── Système scolaire MAROCAIN ─────────────────────────────────────────────
export type EducationLevel =
  // Primaire (6 ans → 12 ans)
  | '1ère année primaire' | '2ème année primaire' | '3ème année primaire'
  | '4ème année primaire' | '5ème année primaire' | '6ème année primaire'
  // Collège (12 ans → 15 ans)
  | '1ère année collège' | '2ème année collège' | '3ème année collège'
  // Lycée qualifiant (15 ans → 18 ans)
  | 'Tronc commun' | '1ère année Bac' | '2ème année Bac'
  // Supérieur
  | 'Université / Grandes Écoles';

export type AnyEducationLevel = EducationLevel | string;

export function getSchoolCategory(level: AnyEducationLevel): 'primaire' | 'collège' | 'lycée' | 'supérieur' | 'unknown' {
  const primary = ['1ère année primaire', '2ème année primaire', '3ème année primaire', '4ème année primaire', '5ème année primaire', '6ème année primaire'];
  const middle  = ['1ère année collège', '2ème année collège', '3ème année collège'];
  const high    = ['Tronc commun', '1ère année Bac', '2ème année Bac'];
  const higher  = ['Université / Grandes Écoles'];

  if (primary.includes(level)) return 'primaire';
  if (middle.includes(level))  return 'collège';
  if (high.includes(level))    return 'lycée';
  if (higher.includes(level))  return 'supérieur';
  return 'unknown';
}

/**
 * Returns education levels available for a given age — Système MAROCAIN.
 */
export function getEducationLevelsForAge(age: number | null): EducationLevel[] {
  if (!age || age < 6) return ['1ère année primaire'];

  if (age === 6)  return ['1ère année primaire', '2ème année primaire'];
  if (age === 7)  return ['1ère année primaire', '2ème année primaire', '3ème année primaire'];
  if (age === 8)  return ['2ème année primaire', '3ème année primaire', '4ème année primaire'];
  if (age === 9)  return ['3ème année primaire', '4ème année primaire', '5ème année primaire'];
  if (age === 10) return ['4ème année primaire', '5ème année primaire', '6ème année primaire'];
  if (age === 11) return ['5ème année primaire', '6ème année primaire', '1ère année collège'];
  if (age === 12) return ['6ème année primaire', '1ère année collège', '2ème année collège'];
  if (age === 13) return ['1ère année collège', '2ème année collège', '3ème année collège'];
  if (age === 14) return ['2ème année collège', '3ème année collège', 'Tronc commun'];
  if (age === 15) return ['3ème année collège', 'Tronc commun', '1ère année Bac'];
  if (age === 16) return ['Tronc commun', '1ère année Bac', '2ème année Bac'];
  if (age === 17) return ['1ère année Bac', '2ème année Bac', 'Université / Grandes Écoles'];
  // 18 ans et +
  return ['2ème année Bac', 'Université / Grandes Écoles'];
}

/**
 * Returns available higher-education years for the student's age — Système MAROCAIN.
 */
export function getStudyYearsForAge(age: number | null): string[] {
  if (!age || age < 17) return ['1ère année'];
  if (age <= 18) return ['1ère année', '2ème année'];
  if (age <= 20) return ['1ère année', '2ème année', '3ème année (Licence)'];
  if (age === 21) return ['1ère année', '2ème année', '3ème année (Licence)', 'Master 1'];
  return ['1ère année', '2ème année', '3ème année (Licence)', 'Master 1', 'Master 2', 'Doctorat'];
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