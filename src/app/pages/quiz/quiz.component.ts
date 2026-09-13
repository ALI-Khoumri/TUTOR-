import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ProfileService } from '../../core/services/profile.service';
import { MockSessionService } from '../../core/services/mock-session.service';
import { AiLearningService, QuizItem, QuizFeedbackResponse } from '../../core/services/ai-learning.service';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-quiz',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule],
  template: `
    <section class="learning-page page-enter" *ngIf="profile$ | async as profile">
      <header class="learning-page__header">
        <div>
          <div class="header-badge-row">
            <span class="ai-tutor-badge" [class.is-ollama]="isOllamaGenerated">
              <mat-icon>{{ isOllamaGenerated ? 'psychology' : 'auto_awesome' }}</mat-icon> {{ generatedBy }}
            </span>
            <span class="adaptive-badge" [class.tier-1]="adaptiveLevelIndex === 1" [class.tier-2]="adaptiveLevelIndex === 2" [class.tier-3]="adaptiveLevelIndex === 3">
              <mat-icon>{{ adaptiveLevelIndex === 3 ? 'military_tech' : adaptiveLevelIndex === 2 ? 'trending_up' : 'school' }}</mat-icon>
              Difficulté adaptative : {{ currentDifficulty }} (Palier {{ adaptiveLevelIndex }}/3)
            </span>
            <span class="anti-repeat-badge">
              <mat-icon>autorenew</mat-icon> Questions renouvelées en continu
            </span>
          </div>
          <h2 class="learning-page__title">Quiz interactifs à progression adaptative</h2>
          <p class="learning-page__copy">
            Des quiz personnalisés générés en direct par ton Tuteur IA. La complexité augmente automatiquement au fur et à mesure de tes réussites pour stimuler ta progression.
          </p>
        </div>
      </header>

      <!-- Subject Switcher -->
      <div class="subject-bar" *ngIf="profile.subjects && profile.subjects.length > 0">
        <span class="subject-bar__label">
          <mat-icon>menu_book</mat-icon> Matière :
        </span>
        <div class="subject-pills">
          <button
            *ngFor="let s of profile.subjects"
            type="button"
            class="subject-pill"
            [class.is-active]="s === currentSubject"
            [disabled]="isLoadingAi"
            (click)="selectSubject(s)"
          >
            {{ s }}
          </button>
        </div>
      </div>

      <!-- Quiz Card / State Machine -->
      <div class="surface quiz-card">

        <!-- STATE 0: AI LOADING -->
        <div class="quiz-loading-state" *ngIf="isLoadingAi">
          <div class="ai-pulse-wrapper">
            <div class="ai-pulse-circle">
              <mat-icon class="pulse-icon">psychology</mat-icon>
            </div>
            <div class="pulse-ring"></div>
          </div>
          <h3 class="loading-title">Le Tuteur IA (Ollama llama3.2) génère ton quiz adaptatif...</h3>
          <p class="loading-sub">
            Génération de questions inédites de niveau <strong>{{ currentDifficulty }}</strong> en <strong>{{ currentSubject }}</strong>
            <span *ngIf="customTopic"> (Thème : {{ customTopic }})</span>.
          </p>
          <div class="loading-progress-indicator">
            <div class="loading-bar-indeterminate"></div>
          </div>
        </div>

        <!-- STATE 1: NOT STARTED -->
        <div class="quiz-intro" *ngIf="quizState === 'idle' && !isLoadingAi">
          
          <!-- Adaptive Tier Card -->
          <div class="adaptive-tier-card">
            <div class="tier-info">
              <div class="tier-icon-wrap" [class.tier-1]="adaptiveLevelIndex === 1" [class.tier-2]="adaptiveLevelIndex === 2" [class.tier-3]="adaptiveLevelIndex === 3">
                <mat-icon>{{ adaptiveLevelIndex === 3 ? 'military_tech' : adaptiveLevelIndex === 2 ? 'trending_up' : 'school' }}</mat-icon>
              </div>
              <div>
                <h4 class="tier-title">Niveau actuel du Tuteur IA : Palier {{ adaptiveLevelIndex }} ({{ currentDifficulty }})</h4>
                <p class="tier-desc">
                  <span *ngIf="adaptiveLevelIndex === 1">Débutant — Questions directes pour ancrer les définitions et règles de base.</span>
                  <span *ngIf="adaptiveLevelIndex === 2">Intermédiaire — Problèmes d'application pratique et calculs intermédiaires.</span>
                  <span *ngIf="adaptiveLevelIndex === 3">Avancé — Cas complexes, synthèse de haut niveau et pièges subtils à déjouer.</span>
                </p>
              </div>
            </div>

            <!-- Mode Selector Switcher -->
            <div class="diff-switcher">
              <span class="diff-switch-label">Niveau cible :</span>
              <div class="diff-pills-row">
                <button
                  type="button"
                  class="diff-mode-btn"
                  [class.is-active]="selectedDifficultyMode === 'auto'"
                  (click)="setDifficultyMode('auto')"
                >
                  ⚡ Auto ({{ adaptiveDifficulty }})
                </button>
                <button
                  type="button"
                  class="diff-mode-btn"
                  [class.is-active]="selectedDifficultyMode === 'Débutant'"
                  (click)="setDifficultyMode('Débutant')"
                >
                  Débutant
                </button>
                <button
                  type="button"
                  class="diff-mode-btn"
                  [class.is-active]="selectedDifficultyMode === 'Intermédiaire'"
                  (click)="setDifficultyMode('Intermédiaire')"
                >
                  Intermédiaire
                </button>
                <button
                  type="button"
                  class="diff-mode-btn"
                  [class.is-active]="selectedDifficultyMode === 'Avancé'"
                  (click)="setDifficultyMode('Avancé')"
                >
                  Avancé
                </button>
              </div>
            </div>

            <!-- Number of Questions Switcher -->
            <div class="count-switcher">
              <span class="count-switch-label">Nombre de questions :</span>
              <div class="count-pills-row">
                <button
                  type="button"
                  class="count-pill-btn"
                  [class.is-active]="selectedQuestionCount === 5"
                  (click)="setQuestionCount(5)"
                >
                  5 questions (Express)
                </button>
                <button
                  type="button"
                  class="count-pill-btn"
                  [class.is-active]="selectedQuestionCount === 10"
                  (click)="setQuestionCount(10)"
                >
                  ⚡ 10 questions (Recommandé)
                </button>
                <button
                  type="button"
                  class="count-pill-btn"
                  [class.is-active]="selectedQuestionCount === 15"
                  (click)="setQuestionCount(15)"
                >
                  🏆 15 questions (Complet)
                </button>
              </div>
            </div>
          </div>

          <div class="topic-customizer">
            <label class="topic-label">
              <mat-icon>tune</mat-icon> Thème spécifique ou notion à travailler (optionnel) :
            </label>
            <div class="topic-input-wrap">
              <input
                type="text"
                [(ngModel)]="customTopic"
                placeholder="Ex: Fonctions dérivées, Mitose, Past perfect, Syntaxe arabe..."
                class="topic-input"
              />
              <button 
                *ngIf="customTopic" 
                type="button" 
                class="clear-topic-btn" 
                (click)="customTopic = ''"
              >
                <mat-icon>close</mat-icon>
              </button>
            </div>
          </div>

          <div class="quiz-meta-grid">
            <div class="meta-box">
              <mat-icon>help_outline</mat-icon>
              <div>
                <strong>{{ currentQuestions.length }} questions</strong>
                <span>Format QCM interactif</span>
              </div>
            </div>
            <div class="meta-box">
              <mat-icon>speed</mat-icon>
              <div>
                <strong>Niveau {{ currentDifficulty }}</strong>
                <span>Palier adaptatif</span>
              </div>
            </div>
            <div class="meta-box highlight-ollama">
              <mat-icon>psychology</mat-icon>
              <div>
                <strong>Tuteur IA (Ollama llama3.2)</strong>
                <span>Génération active en direct</span>
              </div>
            </div>
          </div>

          <div class="intro-actions">
            <button class="btn btn--primary btn--large" (click)="startQuiz()">
              <mat-icon>play_arrow</mat-icon> Démarrer le quiz
            </button>
            <button class="btn btn--secondary btn--large" (click)="loadNewAiQuiz()">
              <mat-icon>refresh</mat-icon> Générer d'autres questions avec Ollama
            </button>
          </div>
        </div>

        <!-- STATE 2: IN PROGRESS -->
        <div class="quiz-play" *ngIf="quizState === 'playing' && !isLoadingAi">
          <div class="quiz-progress-header">
            <div class="quiz-progress-text">
              Question <strong>{{ currentIndex + 1 }}</strong> sur <strong>{{ currentQuestions.length }}</strong>
            </div>
            <div class="quiz-tags-row">
              <span class="quiz-diff-badge" [class.tier-1]="currentDifficulty === 'Débutant'" [class.tier-2]="currentDifficulty === 'Intermédiaire'" [class.tier-3]="currentDifficulty === 'Avancé'">
                {{ currentDifficulty }}
              </span>
              <span class="quiz-source-tag">
                <mat-icon>psychology</mat-icon> Tuteur IA (Ollama)
              </span>
              <span class="quiz-subject-tag">{{ currentSubject }}</span>
              <span class="quiz-topic-tag" *ngIf="currentTopic">{{ currentTopic }}</span>
            </div>
          </div>

          <div class="progress-bar-track">
            <div class="progress-bar-fill" [style.width.%]="((currentIndex + 1) / currentQuestions.length) * 100"></div>
          </div>

          <div class="quiz-question-box">
            <h4 class="quiz-question-title" [class.arabic-font]="isArabicText(currentQuestion.question)" [attr.dir]="isArabicText(currentQuestion.question) ? 'rtl' : 'ltr'">{{ currentQuestion.question }}</h4>

            <div class="quiz-options-list">
              <button
                *ngFor="let opt of currentQuestion.options; let i = index"
                type="button"
                class="quiz-option-btn"
                [class.is-selected]="selectedAnswerIndex === i"
                [class.is-correct]="hasAnswered && i === currentQuestion.correctIndex"
                [class.is-wrong]="hasAnswered && selectedAnswerIndex === i && i !== currentQuestion.correctIndex"
                [disabled]="hasAnswered"
                (click)="answerQuestion(i)"
              >
                <span class="option-letter">{{ ['A', 'B', 'C', 'D'][i] }}</span>
                <span class="option-text" [class.arabic-font]="isArabicText(opt)" [attr.dir]="isArabicText(opt) ? 'rtl' : 'ltr'">{{ opt }}</span>
                <span class="option-feedback" *ngIf="hasAnswered">
                  <mat-icon *ngIf="i === currentQuestion.correctIndex" class="feedback-icon icon-correct">check_circle</mat-icon>
                  <mat-icon *ngIf="selectedAnswerIndex === i && i !== currentQuestion.correctIndex" class="feedback-icon icon-wrong">cancel</mat-icon>
                </span>
              </button>
            </div>
          </div>

          <!-- Explanation Banner with AI Tutor identity -->
          <div class="quiz-explanation-box" *ngIf="hasAnswered">
            <div class="explanation-badge" [class.is-success]="selectedAnswerIndex === currentQuestion.correctIndex">
              <mat-icon>{{ selectedAnswerIndex === currentQuestion.correctIndex ? 'thumb_up' : 'school' }}</mat-icon>
              <span *ngIf="selectedAnswerIndex === currentQuestion.correctIndex">Excellente réponse !</span>
              <span *ngIf="selectedAnswerIndex !== currentQuestion.correctIndex">Analyse du Tuteur IA :</span>
            </div>
            <p class="explanation-text" [class.arabic-font]="isArabicText(currentQuestion.explanation)" [attr.dir]="isArabicText(currentQuestion.explanation) ? 'rtl' : 'ltr'">{{ formatQuizExplanation(currentQuestion.explanation, selectedAnswerIndex === currentQuestion.correctIndex) }}</p>

            <button class="btn btn--primary btn--next" (click)="nextQuestion()">
              <span *ngIf="currentIndex + 1 === currentQuestions.length">Terminer & Bilan du Tuteur</span>
              <span *ngIf="currentIndex + 1 !== currentQuestions.length">Question suivante</span>
              <mat-icon>arrow_forward</mat-icon>
            </button>
          </div>
        </div>

        <!-- STATE 3: FINISHED -->
        <div class="quiz-results" *ngIf="quizState === 'finished' && !isLoadingAi">
          
          <!-- Level-up celebration banner if triggered -->
          <div class="level-up-banner" *ngIf="aiFeedback?.updatedProgress?.leveledUp">
            <div class="level-up-icon">
              <mat-icon>military_tech</mat-icon>
            </div>
            <div>
              <h4 class="level-up-heading">🚀 Félicitations ! Palier supérieur débloqué</h4>
              <p class="level-up-text">
                Grâce à tes excellents résultats en <strong>{{ currentSubject }}</strong>, le Tuteur IA adapte ton parcours et élève la difficulté vers le palier :
                <strong>{{ aiFeedback?.updatedProgress?.adaptiveDifficulty }}</strong> !
              </p>
            </div>
          </div>

          <div class="score-circle-wrap">
            <div class="score-circle" [class.is-high]="scoreRatio >= 0.75" [class.is-med]="scoreRatio >= 0.5 && scoreRatio < 0.75" [class.is-low]="scoreRatio < 0.5">
              <span class="score-number">{{ score }} / {{ currentQuestions.length }}</span>
              <span class="score-percent">{{ scorePercent }}%</span>
            </div>
          </div>

          <h3 class="results-title">
            <span *ngIf="scoreRatio >= 0.75">🎉 Félicitations, excellente maîtrise !</span>
            <span *ngIf="scoreRatio >= 0.5 && scoreRatio < 0.75">👍 Très bon travail, la méthode progresse !</span>
            <span *ngIf="scoreRatio < 0.5">💪 Belle tentative, voici les clés pour progresser !</span>
          </h3>

          <p class="results-subtitle">
            Tu as obtenu <strong>{{ score }}</strong> bonne(s) réponse(s) sur <strong>{{ currentQuestions.length }}</strong> (Niveau {{ currentDifficulty }}).
          </p>

          <!-- AI Tutor Feedback Box -->
          <div class="ai-feedback-card" *ngIf="aiFeedback">
            <div class="ai-feedback-header">
              <mat-icon>psychology</mat-icon>
              <span>Bilan personnalisé de ton Tuteur IA</span>
            </div>
            <p class="ai-feedback-content">{{ aiFeedback.feedback }}</p>
            
            <div class="ai-recommendations" *ngIf="aiFeedback.recommendations?.length">
              <span class="reco-title">Conseils méthodologiques :</span>
              <ul class="reco-list">
                <li *ngFor="let rec of aiFeedback.recommendations">
                  <mat-icon>check_small</mat-icon> {{ rec }}
                </li>
              </ul>
            </div>
          </div>

          <!-- Summary list of answered questions -->
          <div class="results-review-list">
            <div class="review-item" *ngFor="let res of userAnswers; let idx = index" [class.is-correct]="res.isCorrect">
              <div class="review-header">
                <span class="review-icon">
                  <mat-icon>{{ res.isCorrect ? 'check_circle' : 'cancel' }}</mat-icon>
                </span>
                <span class="review-q">Question {{ idx + 1 }} : {{ res.question.question }}</span>
              </div>
              <div class="review-answers">
                <span class="ans-given">Ta réponse : <strong>{{ res.question.options[res.selectedIdx] }}</strong></span>
                <span class="ans-expected" *ngIf="!res.isCorrect">Réponse exacte : <strong>{{ res.question.options[res.question.correctIndex] }}</strong></span>
              </div>
              <div class="review-explanation" *ngIf="!res.isCorrect">
                <mat-icon>info</mat-icon> {{ formatQuizExplanation(res.question.explanation, false) }}
              </div>
            </div>
          </div>

          <div class="results-actions">
            <button class="btn btn--primary btn--pill" (click)="loadNewAiQuiz()">
              <mat-icon>autorenew</mat-icon> ✨ Nouveau quiz IA (Questions inédites)
            </button>
            <button class="btn btn--secondary btn--pill" (click)="restartQuiz()">
              <mat-icon>replay</mat-icon> Recommencer ce quiz
            </button>
          </div>
        </div>

      </div>
    </section>
  `,
  styles: [`
    .learning-page {
      max-width: 900px;
      margin: 0 auto;
      padding: 2rem 1.5rem 4rem;
    }

    .header-badge-row {
      display: flex;
      flex-wrap: wrap;
      gap: 0.6rem;
      margin-bottom: 0.75rem;
    }

    .ai-tutor-badge {
      display: inline-flex;
      align-items: center;
      gap: 0.4rem;
      padding: 0.3rem 0.75rem;
      border-radius: 999px;
      font-size: 0.75rem;
      font-weight: 700;
      background: linear-gradient(135deg, rgba(37, 99, 235, 0.12), rgba(124, 58, 237, 0.12));
      color: #2563eb;
      border: 1px solid rgba(37, 99, 235, 0.25);
    }

    .ai-tutor-badge.is-ollama {
      background: linear-gradient(135deg, rgba(16, 185, 129, 0.15), rgba(37, 99, 235, 0.15));
      color: #059669;
      border-color: rgba(16, 185, 129, 0.35);
      box-shadow: 0 0 10px rgba(16, 185, 129, 0.12);
    }

    .ai-tutor-badge mat-icon {
      font-size: 16px;
      width: 16px;
      height: 16px;
    }

    .adaptive-badge {
      display: inline-flex;
      align-items: center;
      gap: 0.4rem;
      padding: 0.3rem 0.75rem;
      border-radius: 999px;
      font-size: 0.75rem;
      font-weight: 700;
      border: 1px solid transparent;
    }

    .adaptive-badge.tier-1 {
      background: rgba(16, 185, 129, 0.1);
      color: #059669;
      border-color: rgba(16, 185, 129, 0.3);
    }

    .adaptive-badge.tier-2 {
      background: rgba(245, 158, 11, 0.12);
      color: #d97706;
      border-color: rgba(245, 158, 11, 0.35);
    }

    .adaptive-badge.tier-3 {
      background: rgba(124, 58, 237, 0.12);
      color: #7c3aed;
      border-color: rgba(124, 58, 237, 0.35);
    }

    .adaptive-badge mat-icon {
      font-size: 16px;
      width: 16px;
      height: 16px;
    }

    .anti-repeat-badge {
      display: inline-flex;
      align-items: center;
      gap: 0.4rem;
      padding: 0.3rem 0.75rem;
      border-radius: 999px;
      font-size: 0.75rem;
      font-weight: 700;
      background: rgba(100, 116, 139, 0.1);
      color: #475569;
      border: 1px solid rgba(100, 116, 139, 0.25);
    }

    .anti-repeat-badge mat-icon {
      font-size: 16px;
      width: 16px;
      height: 16px;
    }

    .learning-page__title {
      font-size: 1.85rem;
      font-weight: 800;
      color: var(--text);
      margin: 0 0 0.5rem 0;
      letter-spacing: -0.02em;
    }

    .learning-page__copy {
      font-size: 0.95rem;
      color: var(--text-muted);
      margin: 0 0 1.5rem 0;
      line-height: 1.6;
    }

    /* ── Subject Bar ── */
    .subject-bar {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      margin-bottom: 1.5rem;
      padding: 0.6rem 1rem;
      background: var(--surface);
      border-radius: var(--radius-md);
      border: 1px solid var(--border);
      flex-wrap: wrap;
    }

    .subject-bar__label {
      display: flex;
      align-items: center;
      gap: 0.35rem;
      font-size: 0.85rem;
      font-weight: 700;
      color: var(--text-muted);
    }

    .subject-bar__label mat-icon {
      font-size: 18px;
      width: 18px;
      height: 18px;
    }

    .subject-pills {
      display: flex;
      gap: 0.5rem;
      flex-wrap: wrap;
    }

    .subject-pill {
      padding: 0.4rem 0.9rem;
      border-radius: 999px;
      border: 1px solid var(--border);
      background: var(--surface);
      color: var(--text-muted);
      font-size: 0.82rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 180ms ease;
    }

    .subject-pill:hover {
      background: var(--surface-muted);
      color: var(--text);
    }

    .subject-pill.is-active {
      background: var(--accent);
      color: #fff;
      border-color: var(--accent);
      box-shadow: 0 2px 8px rgba(37, 99, 235, 0.25);
    }

    /* ── Quiz Card ── */
    .quiz-card {
      padding: 2.25rem;
      border-radius: var(--radius-lg);
      background: var(--surface);
      border: 1px solid var(--border);
      box-shadow: var(--shadow-sm);
      min-height: 380px;
    }

    .arabic-font {
      font-family: 'Amiri', 'Cairo', serif;
      line-height: 1.85;
      letter-spacing: 0.01em;
    }

    /* Adaptive Tier Card */
    .adaptive-tier-card {
      background: linear-gradient(135deg, rgba(37, 99, 235, 0.04), rgba(124, 58, 237, 0.04));
      border: 1px solid rgba(37, 99, 235, 0.2);
      border-radius: var(--radius-md);
      padding: 1.25rem;
      margin-bottom: 1.5rem;
    }

    .tier-info {
      display: flex;
      align-items: flex-start;
      gap: 0.85rem;
      margin-bottom: 1rem;
    }

    .tier-icon-wrap {
      width: 42px;
      height: 42px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .tier-icon-wrap.tier-1 {
      background: #ecfdf5;
      color: #059669;
    }

    .tier-icon-wrap.tier-2 {
      background: #fffbeb;
      color: #d97706;
    }

    .tier-icon-wrap.tier-3 {
      background: #f5f3ff;
      color: #7c3aed;
    }

    .tier-title {
      font-size: 0.98rem;
      font-weight: 800;
      color: var(--text);
      margin: 0 0 0.25rem 0;
    }

    .tier-desc {
      font-size: 0.82rem;
      color: var(--text-muted);
      margin: 0;
      line-height: 1.4;
    }

    .diff-switcher {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      flex-wrap: wrap;
      padding-top: 0.75rem;
      border-top: 1px dashed rgba(37, 99, 235, 0.2);
    }

    .diff-switch-label {
      font-size: 0.82rem;
      font-weight: 700;
      color: var(--text);
    }

    .diff-pills-row {
      display: flex;
      gap: 0.4rem;
      flex-wrap: wrap;
    }

    .diff-mode-btn {
      padding: 0.3rem 0.75rem;
      border-radius: 999px;
      border: 1px solid var(--border);
      background: #ffffff;
      font-size: 0.78rem;
      font-weight: 600;
      cursor: pointer;
      color: var(--text-muted);
      transition: all 150ms ease;
    }

    .diff-mode-btn.is-active {
      background: var(--accent);
      color: #fff;
      border-color: var(--accent);
    }

    .count-switcher {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      flex-wrap: wrap;
      padding-top: 0.75rem;
      border-top: 1px dashed rgba(37, 99, 235, 0.2);
    }

    .count-switch-label {
      font-size: 0.82rem;
      font-weight: 700;
      color: var(--text);
    }

    .count-pills-row {
      display: flex;
      gap: 0.4rem;
      flex-wrap: wrap;
    }

    .count-pill-btn {
      padding: 0.3rem 0.75rem;
      border-radius: 999px;
      border: 1px solid var(--border);
      background: #ffffff;
      font-size: 0.78rem;
      font-weight: 600;
      cursor: pointer;
      color: var(--text-muted);
      transition: all 150ms ease;
    }

    .count-pill-btn:hover {
      border-color: var(--accent);
      color: var(--accent);
    }

    .count-pill-btn.is-active {
      background: #2563eb;
      color: #ffffff;
      border-color: #2563eb;
      font-weight: 700;
    }

    /* Level-up banner */
    .level-up-banner {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 1rem 1.25rem;
      border-radius: var(--radius-md);
      background: linear-gradient(135deg, #ecfdf5, #dbeafe);
      border: 1.5px solid #10b981;
      margin-bottom: 1.5rem;
      text-align: left;
      animation: fadeIn 300ms ease;
    }

    .level-up-icon {
      width: 44px;
      height: 44px;
      border-radius: 50%;
      background: #10b981;
      color: #fff;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .level-up-heading {
      font-size: 1.05rem;
      font-weight: 800;
      color: #065f46;
      margin: 0 0 0.2rem 0;
    }

    .level-up-text {
      font-size: 0.88rem;
      color: #1e293b;
      margin: 0;
      line-height: 1.4;
    }

    /* ── AI Loading State ── */
    .quiz-loading-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 4rem 1rem;
      text-align: center;
    }

    .ai-pulse-wrapper {
      position: relative;
      width: 80px;
      height: 80px;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 1.5rem;
    }

    .ai-pulse-circle {
      width: 64px;
      height: 64px;
      border-radius: 50%;
      background: linear-gradient(135deg, #2563eb, #7c3aed);
      display: flex;
      align-items: center;
      justify-content: center;
      color: #fff;
      box-shadow: 0 0 20px rgba(37, 99, 235, 0.4);
      z-index: 2;
    }

    .pulse-icon {
      font-size: 32px;
      width: 32px;
      height: 32px;
    }

    .pulse-ring {
      position: absolute;
      inset: 0;
      border-radius: 50%;
      border: 2px solid #3b82f6;
      animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;
    }

    @keyframes ping {
      0% { transform: scale(0.8); opacity: 0.8; }
      100% { transform: scale(1.6); opacity: 0; }
    }

    .loading-title {
      font-size: 1.3rem;
      font-weight: 800;
      color: var(--text);
      margin: 0 0 0.5rem 0;
    }

    .loading-sub {
      font-size: 0.92rem;
      color: var(--text-muted);
      max-width: 480px;
      line-height: 1.5;
      margin: 0 0 1.5rem 0;
    }

    .loading-progress-indicator {
      width: 240px;
      height: 6px;
      background: #e2e8f0;
      border-radius: 999px;
      overflow: hidden;
      position: relative;
    }

    .loading-bar-indeterminate {
      position: absolute;
      height: 100%;
      width: 40%;
      background: linear-gradient(90deg, #2563eb, #7c3aed);
      border-radius: 999px;
      animation: indeterminate 1.4s ease-in-out infinite;
    }

    @keyframes indeterminate {
      0% { left: -40%; }
      50% { left: 40%; width: 60%; }
      100% { left: 100%; width: 40%; }
    }

    /* ── Topic customizer ── */
    .topic-customizer {
      background: var(--surface-muted, #f8fafc);
      padding: 1rem 1.25rem;
      border-radius: var(--radius-md);
      border: 1px solid var(--border);
      margin-bottom: 1.5rem;
    }

    .topic-label {
      display: flex;
      align-items: center;
      gap: 0.4rem;
      font-size: 0.84rem;
      font-weight: 700;
      color: var(--text);
      margin-bottom: 0.5rem;
    }

    .topic-label mat-icon {
      font-size: 16px;
      width: 16px;
      height: 16px;
      color: var(--accent);
    }

    .topic-input-wrap {
      position: relative;
      display: flex;
      align-items: center;
    }

    .topic-input {
      width: 100%;
      padding: 0.65rem 0.85rem;
      border-radius: var(--radius-sm);
      border: 1px solid var(--border);
      background: #ffffff;
      font-size: 0.9rem;
      color: var(--text);
      box-sizing: border-box;
    }

    .topic-input:focus {
      outline: none;
      border-color: var(--accent);
      box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.15);
    }

    .clear-topic-btn {
      position: absolute;
      right: 8px;
      background: none;
      border: none;
      color: var(--text-muted);
      cursor: pointer;
      display: flex;
      align-items: center;
    }

    .quiz-meta-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
      gap: 1rem;
      margin: 1.5rem 0 2rem;
    }

    .meta-box {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 1rem;
      border-radius: var(--radius-md);
      background: var(--surface-muted, #f8fafc);
      border: 1px solid var(--border);
    }

    .meta-box mat-icon {
      font-size: 24px;
      width: 24px;
      height: 24px;
      color: var(--accent);
    }

    .meta-box div {
      display: flex;
      flex-direction: column;
    }

    .meta-box strong {
      font-size: 0.92rem;
      color: var(--text);
    }

    .meta-box span {
      font-size: 0.78rem;
      color: var(--text-muted);
    }

    .meta-box.highlight-ollama {
      background: linear-gradient(135deg, rgba(37, 99, 235, 0.08), rgba(16, 185, 129, 0.08));
      border: 1px solid rgba(16, 185, 129, 0.35);
      box-shadow: 0 2px 10px rgba(16, 185, 129, 0.1);
    }

    .meta-box.highlight-ollama mat-icon {
      color: #059669;
    }

    .quiz-source-tag {
      display: inline-flex;
      align-items: center;
      gap: 0.35rem;
      padding: 0.25rem 0.6rem;
      border-radius: 999px;
      font-size: 0.72rem;
      font-weight: 700;
      background: linear-gradient(135deg, rgba(37, 99, 235, 0.1), rgba(16, 185, 129, 0.1));
      color: #059669;
      border: 1px solid rgba(16, 185, 129, 0.3);
    }

    .quiz-source-tag mat-icon {
      font-size: 14px;
      width: 14px;
      height: 14px;
    }

    .intro-actions {
      display: flex;
      gap: 1rem;
      flex-wrap: wrap;
    }

    /* ── In Progress ── */
    .quiz-progress-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 0.75rem;
      flex-wrap: wrap;
      gap: 0.5rem;
    }

    .quiz-progress-text {
      font-size: 0.88rem;
      color: var(--text-muted);
    }

    .quiz-tags-row {
      display: flex;
      gap: 0.5rem;
      align-items: center;
    }

    .quiz-diff-badge {
      font-size: 0.72rem;
      font-weight: 700;
      padding: 0.2rem 0.6rem;
      border-radius: 999px;
      text-transform: uppercase;
    }

    .quiz-diff-badge.tier-1 {
      background: #dcfce7;
      color: #15803d;
    }

    .quiz-diff-badge.tier-2 {
      background: #fef3c7;
      color: #b45309;
    }

    .quiz-diff-badge.tier-3 {
      background: #ede9fe;
      color: #6d28d9;
    }

    .quiz-subject-tag {
      font-size: 0.78rem;
      font-weight: 700;
      padding: 0.2rem 0.6rem;
      border-radius: 999px;
      background: var(--surface-muted, #f1f5f9);
      color: var(--text-muted);
    }

    .quiz-topic-tag {
      font-size: 0.78rem;
      font-weight: 700;
      padding: 0.2rem 0.6rem;
      border-radius: 999px;
      background: rgba(37, 99, 235, 0.1);
      color: var(--accent);
    }

    .progress-bar-track {
      height: 6px;
      border-radius: 999px;
      background: var(--surface-muted, #e2e8f0);
      overflow: hidden;
      margin-bottom: 2rem;
    }

    .progress-bar-fill {
      height: 100%;
      background: linear-gradient(90deg, #2563eb, #7c3aed);
      border-radius: 999px;
      transition: width 300ms ease;
    }

    .quiz-question-title {
      font-size: 1.25rem;
      font-weight: 800;
      color: var(--text);
      line-height: 1.5;
      margin: 0 0 1.5rem 0;
    }

    .quiz-options-list {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
      margin-bottom: 2rem;
    }

    .quiz-option-btn {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 1rem 1.25rem;
      border-radius: var(--radius-md);
      border: 1px solid var(--border);
      background: var(--surface);
      cursor: pointer;
      text-align: left;
      font-size: 0.95rem;
      color: var(--text);
      transition: all 150ms ease;
    }

    .quiz-option-btn:hover:not(:disabled) {
      border-color: var(--accent);
      background: rgba(37, 99, 235, 0.04);
      transform: translateY(-1px);
    }

    .option-letter {
      width: 28px;
      height: 28px;
      border-radius: 50%;
      background: var(--surface-muted, #f1f5f9);
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 700;
      font-size: 0.82rem;
      color: var(--text-muted);
      flex-shrink: 0;
    }

    .option-text {
      flex: 1;
      line-height: 1.4;
    }

    .quiz-option-btn.is-correct {
      background: #ecfdf5 !important;
      border-color: #10b981 !important;
      color: #065f46 !important;
    }

    .quiz-option-btn.is-correct .option-letter {
      background: #10b981;
      color: #fff;
    }

    .quiz-option-btn.is-wrong {
      background: #fef2f2 !important;
      border-color: #ef4444 !important;
      color: #991b1b !important;
    }

    .quiz-option-btn.is-wrong .option-letter {
      background: #ef4444;
      color: #fff;
    }

    .option-feedback {
      display: flex;
      align-items: center;
    }

    .feedback-icon.icon-correct {
      color: #10b981;
    }

    .feedback-icon.icon-wrong {
      color: #ef4444;
    }

    /* ── Explanation ── */
    .quiz-explanation-box {
      padding: 1.25rem;
      border-radius: var(--radius-md);
      background: var(--surface-muted, #f8fafc);
      border: 1px solid var(--border);
      animation: fadeIn 200ms ease;
    }

    .explanation-badge {
      display: inline-flex;
      align-items: center;
      gap: 0.4rem;
      font-weight: 800;
      font-size: 0.88rem;
      color: #ef4444;
      margin-bottom: 0.5rem;
    }

    .explanation-badge.is-success {
      color: #10b981;
    }

    .explanation-badge mat-icon {
      font-size: 18px;
      width: 18px;
      height: 18px;
    }

    .explanation-text {
      font-size: 0.92rem;
      color: var(--text);
      line-height: 1.6;
      margin: 0 0 1.25rem 0;
    }

    .btn--next {
      display: inline-flex;
      align-items: center;
      gap: 0.4rem;
      padding: 0.65rem 1.25rem;
      border-radius: 999px;
      font-weight: 700;
      font-size: 0.88rem;
      cursor: pointer;
    }

    /* ── Results ── */
    .quiz-results {
      text-align: center;
      padding: 1rem 0;
    }

    .score-circle-wrap {
      display: flex;
      justify-content: center;
      margin-bottom: 1.25rem;
    }

    .score-circle {
      width: 130px;
      height: 130px;
      border-radius: 50%;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      border: 5px solid var(--accent);
      background: rgba(37, 99, 235, 0.05);
    }

    .score-circle.is-high {
      border-color: #10b981;
      background: rgba(16, 185, 129, 0.08);
      color: #065f46;
    }

    .score-circle.is-med {
      border-color: #f59e0b;
      background: rgba(245, 158, 11, 0.08);
      color: #92400e;
    }

    .score-circle.is-low {
      border-color: #ef4444;
      background: rgba(239, 68, 68, 0.08);
      color: #991b1b;
    }

    .score-number {
      font-size: 1.8rem;
      font-weight: 800;
    }

    .score-percent {
      font-size: 0.88rem;
      font-weight: 700;
      opacity: 0.85;
    }

    .results-title {
      font-size: 1.4rem;
      font-weight: 800;
      color: var(--text);
      margin-bottom: 0.5rem;
    }

    .results-subtitle {
      font-size: 0.95rem;
      color: var(--text-muted);
      margin-bottom: 1.75rem;
    }

    /* AI Feedback Card */
    .ai-feedback-card {
      max-width: 680px;
      margin: 0 auto 2rem;
      padding: 1.25rem 1.5rem;
      border-radius: var(--radius-md);
      background: linear-gradient(135deg, rgba(37, 99, 235, 0.05), rgba(124, 58, 237, 0.05));
      border: 1px solid rgba(37, 99, 235, 0.2);
      text-align: left;
    }

    .ai-feedback-header {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.92rem;
      font-weight: 800;
      color: #2563eb;
      margin-bottom: 0.75rem;
    }

    .ai-feedback-header mat-icon {
      font-size: 20px;
      width: 20px;
      height: 20px;
    }

    .ai-feedback-content {
      font-size: 0.92rem;
      color: var(--text);
      line-height: 1.6;
      margin: 0 0 1rem 0;
    }

    .reco-title {
      font-size: 0.82rem;
      font-weight: 700;
      color: var(--text-muted);
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }

    .reco-list {
      list-style: none;
      padding: 0;
      margin: 0.4rem 0 0 0;
      display: flex;
      flex-direction: column;
      gap: 0.4rem;
    }

    .reco-list li {
      display: flex;
      align-items: center;
      gap: 0.35rem;
      font-size: 0.88rem;
      color: var(--text);
    }

    .reco-list mat-icon {
      color: #10b981;
      font-size: 18px;
      width: 18px;
      height: 18px;
    }

    /* Review list */
    .results-review-list {
      max-width: 680px;
      margin: 0 auto 2rem;
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
      text-align: left;
    }

    .review-item {
      padding: 1rem;
      border-radius: var(--radius-md);
      background: var(--surface-muted, #f8fafc);
      border-left: 4px solid #ef4444;
      border-top: 1px solid var(--border);
      border-right: 1px solid var(--border);
      border-bottom: 1px solid var(--border);
    }

    .review-item.is-correct {
      border-left-color: #10b981;
    }

    .review-header {
      display: flex;
      align-items: flex-start;
      gap: 0.5rem;
      font-size: 0.9rem;
      font-weight: 700;
      color: var(--text);
      margin-bottom: 0.5rem;
    }

    .review-icon mat-icon {
      font-size: 18px;
      width: 18px;
      height: 18px;
    }

    .review-item.is-correct .review-icon mat-icon {
      color: #10b981;
    }

    .review-item:not(.is-correct) .review-icon mat-icon {
      color: #ef4444;
    }

    .review-answers {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
      font-size: 0.85rem;
      padding-left: 1.65rem;
    }

    .ans-given {
      color: var(--text-muted);
    }

    .ans-expected {
      color: #065f46;
      font-weight: 600;
    }

    .review-explanation {
      margin-top: 0.5rem;
      padding: 0.5rem 0.75rem;
      background: #ffffff;
      border-radius: var(--radius-sm);
      font-size: 0.84rem;
      color: var(--text-muted);
      display: flex;
      align-items: flex-start;
      gap: 0.4rem;
      margin-left: 1.65rem;
      border: 1px solid #e2e8f0;
    }

    .review-explanation mat-icon {
      font-size: 16px;
      width: 16px;
      height: 16px;
      color: var(--accent);
      flex-shrink: 0;
      margin-top: 2px;
    }

    .results-actions {
      display: flex;
      justify-content: center;
      gap: 1rem;
      flex-wrap: wrap;
    }

    .btn--pill {
      border-radius: 999px;
      padding: 0.75rem 1.5rem;
      font-weight: 700;
    }

    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(4px); }
      to { opacity: 1; transform: translateY(0); }
    }
  `]
})
export class QuizComponent implements OnInit {
  profile$ = this.profile.active$;
  session$ = this.session.session$;

  isArabicText(text: string | null | undefined): boolean {
    if (!text) return false;
    return /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/.test(String(text));
  }

  formatQuizExplanation(explanation: string | null | undefined, isCorrect: boolean): string {
    if (!explanation) return '';
    const raw = String(explanation).trim();

    // Nettoyer tout préfixe de félicitation statique (Bravo, Félicitations, أحسنت, Well done, etc.)
    const cleaned = raw
      .replace(/^(bravo|félicitations|felicitations|bien joué|super|excellent|très bien|tres bien|well done|great job)\s*[!.:,-]*\s*/i, '')
      .replace(/^(أحسنت|ممتاز|بارك الله فيك|رائع|عمل رائع)\s*[!.:,-،]*\s*/u, '')
      .trim();

    const isArabic = this.isArabicText(cleaned || raw);

    if (isCorrect) {
      if (isArabic) {
        return `أحسنت ! ${cleaned}`;
      }
      return `Bravo ! ${cleaned}`;
    } else {
      // En cas de réponse fausse, JAMAIS de bravo !
      return cleaned;
    }
  }

  private normalizeForSimilarity(str: string = ''): string {
    return String(str || '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[\u064B-\u065F\u0670]/g, '')
      .replace(/[^a-z0-9\s\u0600-\u06FF]/gi, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  private calculateQuestionSimilarity(q1: string, q2: string): number {
    const norm1 = this.normalizeForSimilarity(q1);
    const norm2 = this.normalizeForSimilarity(q2);
    if (!norm1 || !norm2) return 0;
    if (norm1 === norm2) return 1.0;

    const tokens1 = norm1.split(' ').filter(w => w.length > 1);
    const tokens2 = norm2.split(' ').filter(w => w.length > 1);
    if (tokens1.length === 0 || tokens2.length === 0) return 0;

    const set1 = new Set(tokens1);
    const set2 = new Set(tokens2);

    let intersection = 0;
    for (const t of set1) {
      if (set2.has(t)) intersection++;
    }
    const union = new Set([...set1, ...set2]).size;
    const tokenJaccard = union > 0 ? intersection / union : 0;

    const getBigrams = (s: string) => {
      const bg = new Set<string>();
      const clean = s.replace(/\s+/g, '');
      for (let i = 0; i < clean.length - 1; i++) {
        bg.add(clean.slice(i, i + 2));
      }
      return bg;
    };
    const bg1 = getBigrams(norm1);
    const bg2 = getBigrams(norm2);
    let bgOverlap = 0;
    for (const b of bg1) {
      if (bg2.has(b)) bgOverlap++;
    }
    const bigramDice = (bg1.size + bg2.size) > 0 ? (2 * bgOverlap) / (bg1.size + bg2.size) : 0;

    return Math.max(tokenJaccard, bigramDice * 0.9);
  }

  private isQuestionDuplicateClient(candidateText: string, existingQuestions: (QuizItem | string)[], threshold = 0.52): boolean {
    if (!candidateText || typeof candidateText !== 'string') return true;
    const norm = this.normalizeForSimilarity(candidateText);
    if (norm.length < 6) return true;

    for (const existing of existingQuestions) {
      const exText = typeof existing === 'string' ? existing : existing?.question;
      if (!exText) continue;
      const sim = this.calculateQuestionSimilarity(candidateText, exText);
      if (sim >= threshold) {
        return true;
      }
    }
    return false;
  }

  currentSubject = '';
  customTopic = '';
  currentTopic = '';
  
  // Adaptive Difficulty properties
  currentDifficulty = 'Débutant';
  adaptiveDifficulty = 'Débutant';
  adaptiveLevelIndex = 1;
  selectedDifficultyMode: 'auto' | 'Débutant' | 'Intermédiaire' | 'Avancé' = 'auto';
  selectedQuestionCount: 5 | 10 | 15 = 10;
  generatedBy: string = 'Tuteur IA (Ollama llama3.2)';

  get isOllamaGenerated(): boolean {
    return (this.generatedBy || '').includes('Ollama');
  }

  quizState: 'idle' | 'playing' | 'finished' = 'idle';
  isLoadingAi = false;

  currentQuestions: QuizItem[] = [];
  currentIndex = 0;
  selectedAnswerIndex: number | null = null;
  hasAnswered = false;
  score = 0;

  userAnswers: { question: QuizItem; selectedIdx: number; isCorrect: boolean }[] = [];
  aiFeedback: QuizFeedbackResponse | null = null;

  constructor(
    private profile: ProfileService,
    private session: MockSessionService,
    private aiLearning: AiLearningService
  ) {}

  ngOnInit(): void {
    this.session.session$.subscribe(s => {
      if (s && s.subject) {
        this.currentSubject = s.subject;
        this.loadAdaptiveDifficulty();
      }
    });

    this.profile.active$.subscribe(p => {
      if (p && p.subjects && p.subjects.length > 0) {
        if (!this.currentSubject || !p.subjects.includes(this.currentSubject)) {
          this.currentSubject = p.subjects[0];
        }
      }
      this.loadAdaptiveDifficulty();
      if (this.currentQuestions.length === 0) {
        this.loadNewAiQuiz(false);
      }
    });
  }

  loadAdaptiveDifficulty(): void {
    if (!this.currentSubject) return;
    this.aiLearning.getAdaptiveDifficulty(this.currentSubject).subscribe(info => {
      if (info) {
        this.adaptiveDifficulty = info.difficulty || 'Débutant';
        this.adaptiveLevelIndex = info.levelIndex || 1;
        if (this.selectedDifficultyMode === 'auto') {
          this.currentDifficulty = this.adaptiveDifficulty;
        }
      }
    });
  }

  setDifficultyMode(mode: 'auto' | 'Débutant' | 'Intermédiaire' | 'Avancé'): void {
    this.selectedDifficultyMode = mode;
    if (mode === 'auto') {
      this.currentDifficulty = this.adaptiveDifficulty;
    } else {
      this.currentDifficulty = mode;
    }
    this.loadNewAiQuiz(false);
  }

  setQuestionCount(count: 5 | 10 | 15): void {
    if (this.selectedQuestionCount === count) return;
    this.selectedQuestionCount = count;
    this.loadNewAiQuiz(false);
  }

  get currentQuestion(): QuizItem {
    return this.currentQuestions[this.currentIndex] || {
      question: 'Chargement de la question...',
      options: ['A', 'B', 'C', 'D'],
      correctIndex: 0,
      explanation: ''
    };
  }

  get scoreRatio(): number {
    return this.currentQuestions.length > 0 ? this.score / this.currentQuestions.length : 0;
  }

  get scorePercent(): number {
    return Math.round(this.scoreRatio * 100);
  }

  selectSubject(subj: string): void {
    if (this.currentSubject === subj) return;
    this.currentSubject = subj;
    this.customTopic = '';
    this.loadAdaptiveDifficulty();
    this.loadNewAiQuiz(false);
  }

  loadNewAiQuiz(autoStart: boolean = false): void {
    this.isLoadingAi = true;
    this.aiFeedback = null;
    this.quizState = 'idle';

    const diffToRequest = this.selectedDifficultyMode === 'auto' ? undefined : this.selectedDifficultyMode;

    this.aiLearning.generateQuiz(this.currentSubject, this.customTopic || undefined, diffToRequest, this.selectedQuestionCount).subscribe({
      next: (res) => {
        this.generatedBy = res.generatedBy || 'Tuteur IA (Ollama llama3.2)';
        const validQs: QuizItem[] = [];
        for (const q of (res.questions || [])) {
          if (!q || !q.question || !Array.isArray(q.options) || q.options.length < 4) continue;
          if (q.options.some(opt => /^(choix|option)\s*[a-d\d]+$/i.test((opt || '').trim()))) continue;

          // Reject question if semantically too similar to any question already chosen
          if (this.isQuestionDuplicateClient(q.question, validQs, 0.52)) {
            continue;
          }
          validQs.push(q);
        }

        // STRICT INVARIANT: Always guarantee EXACTLY selectedQuestionCount questions with 0 duplicates
        let finalQs: QuizItem[] = [...validQs];

        // Backfill from certified emergency bank ONLY if short, with strict uniqueness check
        if (finalQs.length < this.selectedQuestionCount) {
          const emergency = this.aiLearning.generateEmergencyQuestions(this.currentSubject, this.currentDifficulty, this.selectedQuestionCount * 2);
          for (const em of emergency) {
            if (finalQs.length >= this.selectedQuestionCount) break;
            if (!this.isQuestionDuplicateClient(em.question, finalQs, 0.50)) {
              finalQs.push(em);
            }
          }
        }

        this.currentQuestions = finalQs.slice(0, this.selectedQuestionCount);
        this.currentTopic = res.topic;
        this.currentDifficulty = res.difficulty || res.adaptiveDifficulty || 'Débutant';
        if (res.adaptiveDifficulty) {
          this.adaptiveDifficulty = res.adaptiveDifficulty;
          this.adaptiveLevelIndex = res.levelIndex || 1;
        }
        this.isLoadingAi = false;
        if (autoStart) {
          this.startQuiz();
        }
      },
      error: (err) => {
        console.warn('Failed to load AI quiz, retrying with fallback:', err);
        const fallback = this.aiLearning.generateEmergencyQuestions(this.currentSubject, this.currentDifficulty, this.selectedQuestionCount);
        this.currentQuestions = fallback.slice(0, this.selectedQuestionCount);
        this.isLoadingAi = false;
        if (autoStart) {
          this.startQuiz();
        }
      }
    });
  }

  startQuiz(): void {
    if (this.currentQuestions.length === 0) {
      this.loadNewAiQuiz(true);
      return;
    }
    this.quizState = 'playing';
    this.currentIndex = 0;
    this.score = 0;
    this.selectedAnswerIndex = null;
    this.hasAnswered = false;
    this.userAnswers = [];
    this.aiFeedback = null;
  }

  answerQuestion(optionIndex: number): void {
    if (this.hasAnswered) return;
    this.selectedAnswerIndex = optionIndex;
    this.hasAnswered = true;

    const isCorrect = optionIndex === this.currentQuestion.correctIndex;
    if (isCorrect) {
      this.score++;
    }

    this.userAnswers.push({
      question: this.currentQuestion,
      selectedIdx: optionIndex,
      isCorrect
    });
  }

  nextQuestion(): void {
    if (this.currentIndex + 1 < this.currentQuestions.length) {
      this.currentIndex++;
      this.selectedAnswerIndex = null;
      this.hasAnswered = false;
    } else {
      this.finishQuiz();
    }
  }

  private finishQuiz(): void {
    this.quizState = 'finished';
    // Fetch AI Tutor pedagogical feedback and update progress
    this.aiLearning.getQuizFeedback(
      this.currentSubject,
      this.score,
      this.currentQuestions.length,
      this.userAnswers
    ).subscribe({
      next: (res) => {
        this.aiFeedback = res;
        if (res.updatedProgress) {
          this.adaptiveDifficulty = res.updatedProgress.adaptiveDifficulty;
          this.adaptiveLevelIndex = res.updatedProgress.levelIndex;
          if (this.selectedDifficultyMode === 'auto') {
            this.currentDifficulty = this.adaptiveDifficulty;
          }
        }
        // Refresh real-time profile stats for Dashboard, Subjects and Progress pages
        this.profile.loadProfileFromDatabase();
      },
      error: () => {}
    });
  }

  restartQuiz(): void {
    this.quizState = 'playing';
    this.currentIndex = 0;
    this.score = 0;
    this.selectedAnswerIndex = null;
    this.hasAnswered = false;
    this.userAnswers = [];
  }
}
