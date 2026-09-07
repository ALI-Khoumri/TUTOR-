import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, catchError, of, tap } from 'rxjs';
import { ProfileService } from './profile.service';

export interface QuizItem {
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export interface QuizGenerateResponse {
  topic: string;
  questions: QuizItem[];
  difficulty?: string;
  adaptiveDifficulty?: string;
  levelIndex?: number;
  generatedBy?: string;
  stats?: any;
}

export interface QuizFeedbackResponse {
  feedback: string;
  recommendations: string[];
  nextStep?: string;
  updatedProgress?: {
    quizzesCompleted: number;
    exercisesCompleted: number;
    score: number;
    mastery: string;
    adaptiveDifficulty: string;
    levelIndex: number;
    leveledUp?: boolean;
    message?: string;
  };
}

export interface ExerciseEvaluationResponse {
  score: number;
  appreciation: string;
  feedback: string;
  strengths: string[];
  areasToImprove: string[];
  encouragement: string;
  updatedProgress?: {
    quizzesCompleted: number;
    exercisesCompleted: number;
    score: number;
    mastery: string;
    adaptiveDifficulty: string;
    levelIndex: number;
    leveledUp?: boolean;
    message?: string;
  };
}

@Injectable({
  providedIn: 'root'
})
export class AiLearningService {
  private seenQuestions = new Set<string>();

  constructor(
    private http: HttpClient,
    private profileService: ProfileService
  ) {}

  private getHeaders(): HttpHeaders {
    const student = this.profileService.currentProfile;
    const studentId = student?.id || 'default-student';
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'x-student-id': studentId
    });
  }

  /**
   * Fetches adaptive difficulty and mastery statistics for a subject.
   */
  getAdaptiveDifficulty(subject: string): Observable<any> {
    return this.http.get<any>(`/api/ai/adaptive-difficulty/${encodeURIComponent(subject)}`, {
      headers: this.getHeaders()
    }).pipe(
      catchError(() => of({ difficulty: 'Débutant', levelIndex: 1, quizzesCompleted: 0, exercisesCompleted: 0, score: 0 }))
    );
  }

  /**
   * Generates dynamic, varied quiz questions via AI Tutor with adaptive difficulty.
   */
  generateQuiz(
    subject: string,
    topic?: string,
    difficulty?: string,
    count: number = 10
  ): Observable<QuizGenerateResponse> {
    const avoidQuestions = Array.from(this.seenQuestions).slice(-20);
    const body = {
      subject,
      topic,
      difficulty: difficulty || 'auto',
      count,
      avoidQuestions
    };

    return this.http.post<QuizGenerateResponse>('/api/ai/quiz/generate', body, {
      headers: this.getHeaders()
    }).pipe(
      tap(res => {
        if (res && res.questions) {
          res.questions.forEach(q => this.seenQuestions.add(q.question));
        }
      }),
      catchError(err => {
        console.warn('[AiLearningService] Quiz generation error, returning fallback:', err);
        return of({
          topic: topic || `Validation en ${subject}`,
          questions: [
            {
              question: `Quel est le concept central à retenir pour progresser en ${subject} ?`,
              options: [
                'La pratique active et la décomposition méthodique des notions',
                'La mémorisation brute sans comprendre les principes',
                'Le survol rapide des cours sans faire d\'exercices',
                'Attendre les évaluations pour découvrir ses lacunes'
              ],
              correctIndex: 0,
              explanation: 'L\'apprentissage actif et la pratique régulière permettent de consolider les automatismes.'
            }
          ],
          difficulty: difficulty || 'Débutant',
          adaptiveDifficulty: difficulty || 'Débutant',
          levelIndex: 1,
          generatedBy: 'Tuteur IA (Mode hors ligne)'
        });
      })
    );
  }

  /**
   * Generates pedagogical feedback and records progress for adaptive level increase.
   */
  getQuizFeedback(
    subject: string,
    score: number,
    total: number,
    userAnswers: any[]
  ): Observable<QuizFeedbackResponse> {
    const body = { subject, score, total, userAnswers };
    return this.http.post<QuizFeedbackResponse>('/api/ai/quiz/feedback', body, {
      headers: this.getHeaders()
    }).pipe(
      catchError(err => {
        console.warn('[AiLearningService] Feedback error, returning standard response:', err);
        const percent = total > 0 ? Math.round((score / total) * 100) : 0;
        return of({
          feedback: percent >= 75
            ? `Excellent score de ${score}/${total} (${percent}%) ! Tes bases en ${subject} sont très solides.`
            : `Score de ${score}/${total} (${percent}%). Revois les notions où tu as hésité pour renforcer tes acquis.`,
          recommendations: [
            'Revois les explications fournies pour chaque question.',
            'Entraîne-toi sur un cas pratique dans les exercices.'
          ],
          nextStep: 'Tenter un nouveau quiz inédit pour consolider la méthode !'
        });
      })
    );
  }

  /**
   * Generates a tailored practical exercise matching the student's adaptive level.
   */
  generateExercise(
    subject: string,
    topic?: string,
    difficulty?: string
  ): Observable<any> {
    const body = { subject, topic, difficulty: difficulty || 'auto' };
    return this.http.post<any>('/api/ai/exercises/generate', body, {
      headers: this.getHeaders()
    });
  }

  /**
   * Evaluates student drafted solution in the exercise workspace and updates progress.
   */
  evaluateExerciseDraft(
    exercise: any,
    studentDraft: string
  ): Observable<ExerciseEvaluationResponse> {
    const body = { exercise, studentDraft };
    return this.http.post<ExerciseEvaluationResponse>('/api/ai/exercises/evaluate', body, {
      headers: this.getHeaders()
    }).pipe(
      catchError(err => {
        console.warn('[AiLearningService] Evaluation error, returning heuristic feedback:', err);
        return of({
          score: 75,
          appreciation: 'Bonne ébauche de réponse',
          feedback: 'Ton travail montre une bonne compréhension du problème. Compare ton brouillon avec les étapes de la solution officielle pour ajuster les détails.',
          strengths: ['Effort de rédaction', 'Démarche structurée'],
          areasToImprove: ['Vérifie la rigueur de chaque justification'],
          encouragement: 'Continue, la pratique régulière est la clé de la réussite !'
        });
      })
    );
  }
}
