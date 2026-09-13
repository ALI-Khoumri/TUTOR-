import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { ProfileService } from '../../core/services/profile.service';
import { MockSessionService } from '../../core/services/mock-session.service';
import { AiLearningService, ExerciseEvaluationResponse } from '../../core/services/ai-learning.service';

export interface ExerciseStep {
  label: string;
  detail: string;
}

export interface ExerciseHint {
  title: string;
  content: string;
}

export interface ExerciseItem {
  id: string;
  title: string;
  subject: string;
  difficulty: 'Débutant' | 'Intermédiaire' | 'Avancé';
  category: string;
  estimatedTime: string;
  points: number;
  objective: string;
  contextType?: 'arabic' | 'code' | 'math' | 'text';
  contextContent?: string;
  contextTranslation?: string;
  questions: string[];
  hints: ExerciseHint[];
  solutionSteps: ExerciseStep[];
  solutionSummary: string;
  pitfalls: string[];
  keyTakeaway: string;
  checklist: string[];
}

@Component({
  selector: 'app-exercises',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule],
  template: `
    <ng-container *ngIf="profile$ | async as profile">
      <section class="learning-page">
      
      <!-- Top Banner / Header -->
      <header class="exercises-header">
        <div class="exercises-header__info">
          <div class="kicker-badge">
            <mat-icon>auto_stories</mat-icon>
            <span>Entraînement guidé & Pratique</span>
          </div>
          <h1 class="page-title">Exercices pratiques</h1>
          <p class="page-subtitle">
            Mets en pratique tes compétences avec des exercices concrets et ciblés, des questions progressives, des indices méthodologiques et une auto-évaluation pas-à-pas.
          </p>
          <div class="header-action-row">
            <button type="button" class="btn-hero-generator" (click)="openGeneratorModal()">
              <mat-icon>auto_awesome</mat-icon>
              <span>Générer un exercice avec le Tuteur IA</span>
            </button>
          </div>
        </div>

        <!-- Global Subject Progress Stats Card -->
        <div class="subject-stats-card">
          <div class="stats-top">
            <div class="stats-label">
              <mat-icon>trending_up</mat-icon>
              <span>Progression {{ currentSubject }}</span>
            </div>
            <div class="adaptive-tier-pill" [class.tier-1]="adaptiveLevelIndex === 1" [class.tier-2]="adaptiveLevelIndex === 2" [class.tier-3]="adaptiveLevelIndex === 3">
              <mat-icon>{{ adaptiveLevelIndex === 3 ? 'military_tech' : adaptiveLevelIndex === 2 ? 'trending_up' : 'school' }}</mat-icon>
              <span>Palier {{ adaptiveLevelIndex }} : {{ adaptiveDifficulty }}</span>
            </div>
            <span class="stats-percent">{{ progressPercentage }}%</span>
          </div>
          
          <div class="progress-bar-track">
            <div class="progress-bar-fill" [style.width.%]="progressPercentage"></div>
          </div>

          <div class="stats-counters">
            <div class="counter-item">
              <span class="counter-value">{{ completedCount }} / {{ currentExercises.length }}</span>
              <span class="counter-label">Validés</span>
            </div>
            <div class="counter-divider"></div>
            <div class="counter-item">
              <span class="counter-value text-accent">{{ totalEarnedXp }} XP</span>
              <span class="counter-label">Points acquis</span>
            </div>
          </div>
        </div>
      </header>

      <!-- Subject Switcher Bar -->
      <div class="subject-bar" *ngIf="profile.subjects && profile.subjects.length > 0">
        <div class="subject-bar__label">
          <mat-icon>menu_book</mat-icon>
          <span>Matière :</span>
        </div>
        <div class="subject-pills">
          <button
            *ngFor="let s of profile.subjects"
            type="button"
            class="subject-pill"
            [class.is-active]="s === currentSubject"
            (click)="selectSubject(s)"
          >
            <span class="pill-dot"></span>
            <span>{{ s }}</span>
            <span class="pill-count">({{ getSubjectCount(s) }})</span>
          </button>
        </div>
      </div>

      <!-- Main Layout: Left Sidebar + Right Active Exercise Panel -->
      <div class="exercises-layout">

        <!-- ── Left Sidebar (List, Filter, Search) ── -->
        <aside class="exercises-sidebar surface">
          <div class="sidebar-header">
            <div class="sidebar-title-row">
              <div class="sidebar-title">
                <mat-icon>format_list_bulleted</mat-icon>
                <span>Exercices ({{ filteredExercises.length }})</span>
              </div>
              <button type="button" class="btn-icon-custom" title="Générer un nouvel exercice" (click)="openGeneratorModal()">
                <mat-icon>add_circle_outline</mat-icon>
              </button>
            </div>

            <!-- Search input -->
            <div class="search-input-wrap">
              <mat-icon class="search-icon">search</mat-icon>
              <input
                type="text"
                class="search-input"
                [(ngModel)]="searchQuery"
                placeholder="Rechercher une notion..."
              />
              <button *ngIf="searchQuery" class="clear-search" (click)="searchQuery = ''">
                <mat-icon>close</mat-icon>
              </button>
            </div>

            <!-- Filter Pills -->
            <div class="filter-row">
              <button
                type="button"
                class="filter-chip"
                [class.is-active]="activeDifficultyFilter === 'ALL'"
                (click)="activeDifficultyFilter = 'ALL'"
              >
                Tous
              </button>
              <button
                type="button"
                class="filter-chip"
                [class.is-active]="activeDifficultyFilter === 'Débutant'"
                (click)="activeDifficultyFilter = 'Débutant'"
              >
                Débutant
              </button>
              <button
                type="button"
                class="filter-chip"
                [class.is-active]="activeDifficultyFilter === 'Intermédiaire'"
                (click)="activeDifficultyFilter = 'Intermédiaire'"
              >
                Moyen
              </button>
              <button
                type="button"
                class="filter-chip"
                [class.is-active]="activeDifficultyFilter === 'Avancé'"
                (click)="activeDifficultyFilter = 'Avancé'"
              >
                Avancé
              </button>
            </div>
          </div>

          <!-- Exercise Cards List -->
          <div class="exercise-list">
            <div
              *ngFor="let ex of filteredExercises; let idx = index"
              class="exercise-item-card"
              [class.is-active]="selectedExerciseId === ex.id"
              [class.is-completed]="completedExercises[ex.id]"
              (click)="selectExercise(ex.id)"
            >
              <div class="item-card__top">
                <span class="item-number">EX {{ getExerciseNumber(ex.id) }}</span>
                <span class="badge" [class]="'badge--' + ex.difficulty.toLowerCase()">
                  {{ ex.difficulty }}
                </span>
              </div>

              <div class="item-card__title">{{ ex.title }}</div>

              <div class="item-card__meta">
                <span class="meta-tag">
                  <mat-icon>schedule</mat-icon> {{ ex.estimatedTime }}
                </span>
                <span class="meta-tag">
                  <mat-icon>workspace_premium</mat-icon> {{ ex.points }} XP
                </span>
              </div>

              <div class="item-card__status" *ngIf="completedExercises[ex.id]">
                <mat-icon>check_circle</mat-icon>
                <span>Validé</span>
              </div>
            </div>

            <!-- Empty state if search returns nothing -->
            <div class="empty-filter-state" *ngIf="filteredExercises.length === 0">
              <mat-icon>search_off</mat-icon>
              <p>Aucun exercice ne correspond à ce filtre.</p>
              <button class="btn btn--outline btn--sm" (click)="resetFilters()">
                Réinitialiser les filtres
              </button>
            </div>
          </div>

          <!-- Quick generator action at sidebar bottom -->
          <div class="sidebar-footer">
            <button type="button" class="btn-generator" (click)="openGeneratorModal()">
              <mat-icon>smart_toy</mat-icon>
              <span>Créer un exercice sur mesure</span>
            </button>
          </div>
        </aside>

        <!-- ── Right Panel: Active Exercise Detail & Workspace ── -->
        <main class="exercise-detail-panel surface" *ngIf="activeExercise as ex">

          <!-- 1. Header of Exercise -->
          <div class="exercise-main-header">
            <div>
              <div class="header-tag-row">
                <span class="badge" [class]="'badge--' + ex.difficulty.toLowerCase()">
                  {{ ex.difficulty }}
                </span>
                <span class="category-tag">{{ ex.category }}</span>
                <span class="meta-pill">
                  <mat-icon>schedule</mat-icon> {{ ex.estimatedTime }}
                </span>
                <span class="meta-pill">
                  <mat-icon>star</mat-icon> +{{ ex.points }} XP
                </span>
              </div>
              <h2 class="active-exercise-title">{{ ex.title }}</h2>
            </div>

            <div class="status-indicator">
              <span class="status-pill" [class.is-done]="completedExercises[ex.id]">
                <mat-icon>{{ completedExercises[ex.id] ? 'check_circle' : 'pending' }}</mat-icon>
                {{ completedExercises[ex.id] ? 'Exercice Validé' : 'À résoudre' }}
              </span>
            </div>
          </div>

          <!-- 2. Objective Banner -->
          <div class="objective-banner">
            <mat-icon class="objective-icon">track_changes</mat-icon>
            <div class="objective-content">
              <strong>Objectif pédagogique :</strong> {{ ex.objective }}
            </div>
          </div>

          <!-- 3. Problem Context / Study Document -->
          <div class="statement-card">
            <div class="card-section-header">
              <mat-icon>assignment</mat-icon>
              <h3>Énoncé du problème</h3>
            </div>

            <!-- Support Document (Text, Arabic diacritics, or Code) -->
            <div class="context-box" *ngIf="ex.contextContent" [class.context-box--arabic]="ex.contextType === 'arabic'">
              <div class="context-box__tag">
                <mat-icon *ngIf="ex.contextType === 'arabic'">translate</mat-icon>
                <mat-icon *ngIf="ex.contextType === 'code'">code</mat-icon>
                <mat-icon *ngIf="ex.contextType === 'math'">functions</mat-icon>
                <mat-icon *ngIf="!ex.contextType || ex.contextType === 'text'">description</mat-icon>
                <span>Support d'étude / Document de travail</span>
              </div>
              
              <div class="context-body" [class.arabic-font]="ex.contextType === 'arabic'" [attr.dir]="ex.contextType === 'arabic' ? 'rtl' : 'ltr'">
                <p>{{ ex.contextContent }}</p>
              </div>

              <div class="context-translation" *ngIf="ex.contextTranslation">
                <span class="tr-label">Traduction / Explication du support :</span>
                <span class="tr-text">{{ ex.contextTranslation }}</span>
              </div>
            </div>

            <!-- Numbered Specific Questions with Dedicated In-Place Answer Workspaces -->
            <div class="questions-section">
              <div class="questions-section-header">
                <div class="questions-section-title">
                  <mat-icon>quiz</mat-icon>
                  <h4>Questions à traiter & Vos réponses</h4>
                </div>
                <div class="questions-progress-pill" [class.is-complete]="getAnsweredCount(ex.id, ex.questions.length) === ex.questions.length">
                  <mat-icon>{{ getAnsweredCount(ex.id, ex.questions.length) === ex.questions.length ? 'check_circle' : 'pending_actions' }}</mat-icon>
                  <span>{{ getAnsweredCount(ex.id, ex.questions.length) }} / {{ ex.questions.length }} question{{ ex.questions.length > 1 ? 's' : '' }} répondue{{ getAnsweredCount(ex.id, ex.questions.length) > 1 ? 's' : '' }}</span>
                </div>
              </div>

              <!-- Contextual Toolbar for active typing -->
              <div class="quick-toolbar" *ngIf="ex.contextType === 'arabic'">
                <span class="toolbar-label">Voyelles arabes (Tashkeel) :</span>
                <div class="char-buttons">
                  <button type="button" class="char-btn" (click)="insertChar('َ')" title="Fatḥah (a)">َ</button>
                  <button type="button" class="char-btn" (click)="insertChar('ُ')" title="Ḍammah (ou)">ُ</button>
                  <button type="button" class="char-btn" (click)="insertChar('ِ')" title="Kasrah (i)">ِ</button>
                  <button type="button" class="char-btn" (click)="insertChar('ْ')" title="Sukūn">ْ</button>
                  <button type="button" class="char-btn" (click)="insertChar('ّ')" title="Shaddah">ّ</button>
                  <button type="button" class="char-btn" (click)="insertChar('ً')" title="Tanwīn fatḥ">ً</button>
                  <button type="button" class="char-btn" (click)="insertChar('ٌ')" title="Tanwīn ḍamm">ٌ</button>
                  <button type="button" class="char-btn" (click)="insertChar('ٍ')" title="Tanwīn kasr">ٍ</button>
                  <button type="button" class="char-btn" (click)="insertChar('؟')" title="Point d'interrogation arabe">؟</button>
                  <button type="button" class="char-btn" (click)="insertChar('،')" title="Virgule arabe">،</button>
                  <button type="button" class="char-btn" (click)="insertChar('؛')" title="Point-virgule arabe">؛</button>
                </div>
              </div>

              <div class="quick-toolbar" *ngIf="ex.contextType === 'math'">
                <span class="toolbar-label">Symboles mathématiques :</span>
                <div class="char-buttons">
                  <button type="button" class="char-btn" (click)="insertChar('²')">²</button>
                  <button type="button" class="char-btn" (click)="insertChar('³')">³</button>
                  <button type="button" class="char-btn" (click)="insertChar('√')">√</button>
                  <button type="button" class="char-btn" (click)="insertChar('π')">π</button>
                  <button type="button" class="char-btn" (click)="insertChar('≤')">≤</button>
                  <button type="button" class="char-btn" (click)="insertChar('≥')">≥</button>
                  <button type="button" class="char-btn" (click)="insertChar('≠')">≠</button>
                  <button type="button" class="char-btn" (click)="insertChar('∈')">∈</button>
                  <button type="button" class="char-btn" (click)="insertChar('→')">→</button>
                  <button type="button" class="char-btn" (click)="insertChar('∞')">∞</button>
                  <button type="button" class="char-btn" (click)="insertChar('Δ')">Δ</button>
                </div>
              </div>

              <div class="quick-toolbar" *ngIf="ex.contextType === 'code'">
                <span class="toolbar-label">Raccourcis code :</span>
                <div class="char-buttons">
                  <button type="button" class="char-btn char-btn--text" (click)="insertSnippet('def solution():\n    pass')">def</button>
                  <button type="button" class="char-btn char-btn--text" (click)="insertSnippet('for item in collection:\n    ')">for</button>
                  <button type="button" class="char-btn char-btn--text" (click)="insertSnippet('if condition:\n    pass\nelse:\n    pass')">if / else</button>
                  <button type="button" class="char-btn char-btn--text" (click)="insertSnippet('return result')">return</button>
                  <button type="button" class="char-btn char-btn--text" (click)="insertSnippet('SELECT * FROM table WHERE ...')">SQL</button>
                </div>
              </div>

              <!-- Question cards with inline answer textareas -->
              <div class="interactive-questions-list">
                <div
                  *ngFor="let q of ex.questions; let qIdx = index"
                  class="question-interactive-card"
                  [class.is-answered]="isQuestionAnswered(ex.id, qIdx)"
                >
                  <div class="q-card-header" [attr.dir]="isArabicExercise(ex) ? 'rtl' : 'ltr'">
                    <div class="q-card-meta">
                      <span class="q-badge">{{ getQuestionBadge(ex, qIdx) }}</span>
                      <span class="q-status-tag" [ngClass]="getQuestionStatus(ex.id, qIdx).cssClass">
                        <mat-icon>{{ getQuestionStatus(ex.id, qIdx).icon }}</mat-icon>
                        <span>{{ getQuestionStatusBadgeText(ex, qIdx) }}</span>
                      </span>
                    </div>
                  </div>

                  <div class="q-statement-text" [class.arabic-font]="isArabicExercise(ex) || isArabicText(q)" [attr.dir]="isArabicExercise(ex) || isArabicText(q) ? 'rtl' : 'ltr'">{{ q }}</div>

                  <!-- Inline contextual hint toggle if matching hint exists -->
                  <div class="q-inline-hint-wrap" *ngIf="ex.hints && ex.hints[qIdx]" [attr.dir]="isArabicExercise(ex) ? 'rtl' : 'ltr'">
                    <button
                      type="button"
                      class="btn-hint-inline"
                      (click)="toggleHint(ex.id, qIdx)"
                    >
                      <mat-icon>lightbulb</mat-icon>
                      <span>{{ getHintToggleText(ex, qIdx) }}</span>
                      <mat-icon class="chevron-sm">{{ openHints[ex.id + '-' + qIdx] ? 'expand_less' : 'expand_more' }}</mat-icon>
                    </button>
                    <div class="hint-inline-box" *ngIf="openHints[ex.id + '-' + qIdx]" [class.arabic-font]="isArabicExercise(ex)">
                      <strong>{{ ex.hints[qIdx].title }} :</strong> {{ ex.hints[qIdx].content }}
                    </div>
                  </div>

                  <!-- Direct Answer Input -->
                  <div class="q-answer-container" [attr.dir]="isArabicExercise(ex) ? 'rtl' : 'ltr'">
                    <div class="q-answer-header-row">
                      <label class="q-answer-label">
                        <mat-icon>edit_note</mat-icon>
                        <span>{{ getAnswerLabelText(ex, qIdx) }}</span>
                      </label>
                      <span class="autosave-tag">
                        <mat-icon>cloud_done</mat-icon> {{ getAutosaveText(ex) }}
                      </span>
                    </div>
                    <textarea
                      class="q-answer-textarea"
                      [class.arabic-input]="isArabicExercise(ex)"
                      [attr.dir]="isArabicExercise(ex) ? 'rtl' : 'ltr'"
                      rows="3"
                      [ngModel]="getQuestionAnswer(ex.id, qIdx)"
                      (ngModelChange)="setQuestionAnswer(ex.id, qIdx, $event)"
                      (focus)="activeQuestionIndex = qIdx"
                      [placeholder]="getAnswerPlaceholderText(ex, qIdx)"
                    ></textarea>
                    <div class="q-answer-footer-row" *ngIf="getQuestionAnswer(ex.id, qIdx)">
                      <span class="q-word-count">{{ getWordCountText(ex, qIdx) }}</span>
                      <button type="button" class="btn-clear-inline" (click)="clearQuestionAnswer(ex.id, qIdx)">
                        <mat-icon>close</mat-icon> {{ getClearBtnText(ex) }}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Main Actions & Evaluation Bar directly below questions -->
          <div class="submission-actions-wrapper">
            <div class="submission-actions-bar">
              <button
                type="button"
                class="btn btn--ai-evaluate"
                [disabled]="isEvaluatingDraft || !hasAnyAnswer(ex.id)"
                (click)="evaluateDraftWithAi(ex)"
              >
                <mat-icon [class.spin]="isEvaluatingDraft">{{ isEvaluatingDraft ? 'sync' : 'psychology' }}</mat-icon>
                <span>{{ getEvaluateButtonText(ex) }}</span>
              </button>

              <button
                type="button"
                class="btn btn--primary"
                (click)="toggleSolution()"
              >
                <mat-icon>{{ showSolution ? 'visibility_off' : 'verified' }}</mat-icon>
                <span>{{ getSolutionButtonText(ex) }}</span>
              </button>

              <button
                type="button"
                class="btn btn--secondary"
                (click)="openAiTutorHelp(ex)"
              >
                <mat-icon>smart_toy</mat-icon>
                <span>Aide du Tuteur IA</span>
              </button>

              <button
                type="button"
                class="btn btn--outline"
                [class.is-done]="completedExercises[ex.id]"
                (click)="toggleCompleted(ex.id)"
              >
                <mat-icon>{{ completedExercises[ex.id] ? 'check_circle' : 'check_circle_outline' }}</mat-icon>
                <span>{{ completedExercises[ex.id] ? 'Exercice Validé' : 'Marquer comme validé' }}</span>
              </button>

              <button
                type="button"
                class="btn btn--outline"
                title="Générer un nouvel exercice sur mesure avec l'IA"
                (click)="openGeneratorModal()"
              >
                <mat-icon>auto_awesome</mat-icon>
                <span>Nouvel exercice IA</span>
              </button>
            </div>

            <div class="submission-hint-message" *ngIf="!hasAnyAnswer(ex.id)">
              💡 Saisissez votre réponse à au moins une question ci-dessus pour lancer la correction interactive du Tuteur IA.
            </div>

            <!-- AI Draft Feedback Card -->
            <div class="ai-draft-feedback-card" *ngIf="currentDraftEvaluation && selectedExerciseId === ex.id">
              <div class="feedback-card-top">
                <div class="feedback-title-group">
                  <mat-icon class="ai-sparkle-icon">psychology</mat-icon>
                  <div>
                    <h4 class="feedback-heading">{{ currentDraftEvaluation.appreciation }}</h4>
                    <span class="feedback-sub">Bilan méthodologique du Tuteur IA</span>
                  </div>
                </div>
                <div
                  class="feedback-score-badge"
                  [class.is-good]="currentDraftEvaluation.score >= 70"
                  [class.is-mid]="currentDraftEvaluation.score >= 50 && currentDraftEvaluation.score < 70"
                  [class.is-fail]="currentDraftEvaluation.score < 50"
                >
                  <span class="score-val">{{ currentDraftEvaluation.score }}</span>
                  <span class="score-max">/100</span>
                </div>
              </div>

              <p class="feedback-body-text">{{ currentDraftEvaluation.feedback }}</p>

              <div class="feedback-details-grid" *ngIf="currentDraftEvaluation.strengths?.length || currentDraftEvaluation.areasToImprove?.length">
                <div class="feedback-col strengths-col" *ngIf="currentDraftEvaluation.strengths?.length">
                  <span class="col-title"><mat-icon>thumb_up</mat-icon> Points forts identifiés :</span>
                  <ul>
                    <li *ngFor="let s of currentDraftEvaluation.strengths">{{ s }}</li>
                  </ul>
                </div>

                <div class="feedback-col tips-col" *ngIf="currentDraftEvaluation.areasToImprove?.length">
                  <span class="col-title"><mat-icon>lightbulb</mat-icon> Conseils d'amélioration :</span>
                  <ul>
                    <li *ngFor="let a of currentDraftEvaluation.areasToImprove">{{ a }}</li>
                  </ul>
                </div>
              </div>

              <!-- Detailed Question-by-Question Correction & Corrigé Type -->
              <div class="detailed-correction-section" *ngIf="currentDraftEvaluation.detailedCorrection?.length">
                <div class="detailed-correction-header">
                  <mat-icon class="correction-header-icon">checklist_rtl</mat-icon>
                  <div>
                    <h5 class="correction-section-title">Corrigé type officiel & Analyse pas-à-pas</h5>
                    <span class="correction-section-sub">Compare ta rédaction avec les réponses attendues pour valider les notions clés :</span>
                  </div>
                </div>

                <div class="correction-cards-list">
                  <div
                    *ngFor="let item of currentDraftEvaluation.detailedCorrection"
                    class="question-correction-card"
                    [class.is-correct]="item.status === 'correct'"
                    [class.is-partiel]="item.status === 'partiel'"
                    [class.is-incorrect]="item.status === 'incorrect'"
                    [class.is-non-repondu]="item.status === 'non_repondu'"
                  >
                    <div class="q-corr-top">
                      <div class="q-corr-meta">
                        <span class="q-corr-pill">Question {{ item.questionIndex }}</span>
                        <span class="q-corr-status-badge" [ngSwitch]="item.status">
                          <ng-container *ngSwitchCase="'correct'">✅ Validée ({{ item.score }} pts)</ng-container>
                          <ng-container *ngSwitchCase="'partiel'">⚠️ Partielle ({{ item.score }} pts)</ng-container>
                          <ng-container *ngSwitchCase="'non_repondu'">❌ Non répondu / « jsp » (0 pt)</ng-container>
                          <ng-container *ngSwitchDefault>❌ Incorrecte ({{ item.score }} pts)</ng-container>
                        </span>
                      </div>
                      <span class="q-corr-score">{{ item.score }}/100</span>
                    </div>

                    <p class="q-corr-question-text"><strong>Question :</strong> {{ item.question }}</p>

                    <div class="q-corr-student-box" *ngIf="item.studentAnswer">
                      <span class="box-label">✏️ Ta réponse :</span>
                      <p class="student-text" [class.is-empty]="item.status === 'non_repondu'">{{ item.studentAnswer }}</p>
                    </div>

                    <div class="q-corr-feedback-box" *ngIf="item.feedback && item.status !== 'non_repondu'">
                      <span class="box-label">🔍 Retour du Tuteur IA :</span>
                      <p>{{ item.feedback }}</p>
                    </div>

                    <div class="q-corr-solution-box">
                      <span class="box-label">💡 Réponse & Corrigé type attendu :</span>
                      <div class="solution-text" [innerHTML]="item.expectedSolution"></div>
                    </div>
                  </div>
                </div>
              </div>

              <div class="feedback-footer" *ngIf="currentDraftEvaluation.encouragement">
                <mat-icon>auto_awesome</mat-icon>
                <span>{{ currentDraftEvaluation.encouragement }}</span>
              </div>

              <div class="feedback-card-actions">
                <button type="button" class="btn btn--outline btn--sm" (click)="retryExercise(ex.id)">
                  <mat-icon>refresh</mat-icon>
                  <span>Effacer et réessayer</span>
                </button>
                <button type="button" class="btn btn--primary btn--sm" (click)="openGeneratorModal()">
                  <mat-icon>auto_awesome</mat-icon>
                  <span>Générer un nouvel exercice sur ce thème</span>
                </button>
              </div>
            </div>
          </div>

          <!-- Progressive Methodological Hints (reference) -->
          <div class="hints-section" *ngIf="ex.hints && ex.hints.length > 0">
            <div class="hints-header">
              <div class="hints-title">
                <mat-icon>psychology</mat-icon>
                <span>Boîte à outils méthodologique & Tous les indices</span>
              </div>
              <span class="hints-sub">Besoin d'un éclairage complémentaire ? Dévoile un indice selon ton besoin :</span>
            </div>

            <div class="hints-accordion">
              <div
                *ngFor="let hint of ex.hints; let hIdx = index"
                class="hint-tier-card"
                [class.is-open]="openHints[ex.id + '-' + hIdx]"
              >
                <button
                  type="button"
                  class="hint-tier-trigger"
                  (click)="toggleHint(ex.id, hIdx)"
                >
                  <div class="hint-trigger-left">
                    <mat-icon class="hint-icon">
                      {{ hIdx === 0 ? 'lightbulb' : hIdx === 1 ? 'school' : 'auto_fix_high' }}
                    </mat-icon>
                    <span class="hint-title-text">{{ hint.title }}</span>
                  </div>
                  <mat-icon class="hint-chevron">
                    {{ openHints[ex.id + '-' + hIdx] ? 'expand_less' : 'expand_more' }}
                  </mat-icon>
                </button>
                <div class="hint-tier-content" *ngIf="openHints[ex.id + '-' + hIdx]">
                  <p>{{ hint.content }}</p>
                </div>
              </div>
            </div>
          </div>

          <!-- 7. Detailed Step-by-Step Correction Panel -->
          <div class="correction-card" *ngIf="showSolution" [attr.dir]="isArabicExercise(ex) ? 'rtl' : 'ltr'">
            <div class="correction-card__header">
              <div class="header-left">
                <mat-icon>fact_check</mat-icon>
                <h3>{{ getCorrectionTitle(ex) }}</h3>
              </div>
              <span class="badge badge--success">{{ getOfficialBadgeText(ex) }}</span>
            </div>

            <!-- Interactive Self-Evaluation Checklist -->
            <div class="evaluation-box" *ngIf="ex.checklist && ex.checklist.length > 0">
              <div class="eval-top">
                <h4>
                  <mat-icon>checklist</mat-icon>
                  {{ getChecklistTitle(ex) }}
                </h4>
                <div class="eval-score-badge">
                  {{ getScoreSummaryText(ex) }}
                </div>
              </div>

              <div class="checklist-grid">
                <label
                  *ngFor="let item of ex.checklist; let cIdx = index"
                  class="check-item"
                  [class.is-checked]="isCriterionChecked(ex.id, cIdx)"
                  [class.arabic-font]="isArabicExercise(ex)"
                >
                  <input
                    type="checkbox"
                    class="custom-check"
                    [checked]="isCriterionChecked(ex.id, cIdx)"
                    (change)="toggleCriterion(ex.id, cIdx)"
                  />
                  <span class="check-label">{{ item }}</span>
                </label>
              </div>
            </div>

            <!-- Step-by-step model solution -->
            <div class="solution-steps-wrapper">
              <h4 class="solution-section-title">
                <mat-icon>format_list_numbered</mat-icon>
                {{ getStepsTitle(ex) }}
              </h4>

              <div class="steps-list">
                <div *ngFor="let step of ex.solutionSteps; let sIdx = index" class="step-card">
                  <div class="step-number">{{ sIdx + 1 }}</div>
                  <div class="step-content">
                    <div class="step-label" [class.arabic-font]="isArabicExercise(ex)">{{ step.label }}</div>
                    <div class="step-detail" [class.arabic-font]="isArabicExercise(ex)" [innerHTML]="step.detail"></div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Summary & Key takeaway -->
            <div class="takeaway-box" *ngIf="ex.keyTakeaway">
              <div class="takeaway-title">
                <mat-icon>military_tech</mat-icon>
                <span>{{ getKeyTakeawayTitle(ex) }}</span>
              </div>
              <p class="takeaway-body" [class.arabic-font]="isArabicExercise(ex)">{{ ex.keyTakeaway }}</p>
            </div>

            <!-- Pitfalls & Common errors to avoid -->
            <div class="pitfalls-box" *ngIf="ex.pitfalls && ex.pitfalls.length > 0">
              <div class="pitfalls-title">
                <mat-icon>warning_amber</mat-icon>
                <span>{{ getPitfallsTitle(ex) }}</span>
              </div>
              <ul class="pitfalls-list" [class.arabic-font]="isArabicExercise(ex)">
                <li *ngFor="let pit of ex.pitfalls">{{ pit }}</li>
              </ul>
            </div>

            <!-- Bottom Navigation to Next Exercise -->
            <div class="correction-bottom-nav">
              <button
                type="button"
                class="btn btn--outline"
                [disabled]="isFirstExercise"
                (click)="navigateExercise(-1)"
              >
                <mat-icon>arrow_back</mat-icon>
                <span>{{ getPrevExerciseText(ex) }}</span>
              </button>

              <button
                type="button"
                class="btn btn--primary"
                [disabled]="isLastExercise"
                (click)="navigateExercise(1)"
              >
                <span>{{ getNextExerciseText(ex) }}</span>
                <mat-icon>arrow_forward</mat-icon>
              </button>
            </div>
          </div>

        </main>

        <!-- Empty state when no exercise is active -->
        <main class="exercise-detail-panel surface empty-panel-centered" *ngIf="!activeExercise">
          <div class="empty-panel-body">
            <div class="empty-icon-circle">
              <mat-icon>school</mat-icon>
            </div>
            <h2>Prêt pour s'entraîner en {{ currentSubject }}</h2>
            <p>Aucun exercice prédéfini n'a été trouvé. Tu peux utiliser le Tuteur IA pour générer un exercice personnalisé dès maintenant !</p>
            <button type="button" class="btn btn--primary" (click)="openGeneratorModal()">
              <mat-icon>smart_toy</mat-icon>
              <span>Générer un exercice IA</span>
            </button>
          </div>
        </main>

      </div>
    </section>

    <!-- ── AI Tutor Drawer / Popover ── -->
    <div class="modal-overlay" *ngIf="showAiModal" (click)="closeAiModal()">
        <div class="modal-card" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <div class="modal-title-wrap">
              <mat-icon class="ai-avatar">smart_toy</mat-icon>
              <div>
                <h3>Coup de pouce du Tuteur IA</h3>
                <p>Besoin d'aide sur : « {{ activeExercise?.title }} »</p>
              </div>
            </div>
            <button class="modal-close-btn" (click)="closeAiModal()">
              <mat-icon>close</mat-icon>
            </button>
          </div>

          <div class="modal-body">
            <div class="ai-speech-bubble">
              <p>
                👋 Salut ! Sur cet exercice de <strong>{{ currentSubject }}</strong>, analyse bien chaque consigne.
              </p>
              <p class="ai-tip-box">
                💡 <strong>Conseil méthodologique :</strong>
                {{ activeExercise?.hints?.[0]?.content || 'Commence par lister les données connues avant de rédiger ta réponse pas-à-pas.' }}
              </p>
              <p>
                Tu veux approfondir ou me poser une question spécifique sur cet exercice ? Je peux analyser ton brouillon et t'expliquer où tu bloques !
              </p>
            </div>
          </div>

          <div class="modal-footer">
            <button class="btn btn--outline" (click)="closeAiModal()">
              Continuer seul
            </button>
            <button class="btn btn--primary" (click)="goToFullTutor()">
              <mat-icon>chat</mat-icon>
              <span>Poser ma question au Tuteur</span>
            </button>
          </div>
        </div>
      </div>

      <!-- ── Exercise Generator Modal ── -->
      <div class="modal-overlay" *ngIf="showGeneratorModal" (click)="closeGeneratorModal()">
        <div class="modal-card" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <div class="modal-title-wrap">
              <mat-icon class="ai-avatar">auto_awesome</mat-icon>
              <div>
                <h3>Générer un exercice personnalisé</h3>
                <p>L'IA crée un exercice adapté à ton niveau en {{ currentSubject }}</p>
              </div>
            </div>
            <button class="modal-close-btn" (click)="closeGeneratorModal()">
              <mat-icon>close</mat-icon>
            </button>
          </div>

          <div class="modal-body">
            <div class="generator-form">
              <label class="form-label" for="customTopic">
                Notion ou chapitre spécifique (optionnel) :
              </label>
              <input
                id="customTopic"
                type="text"
                class="form-input"
                [(ngModel)]="generatorTopic"
                [placeholder]="generatorPlaceholder"
              />

              <div class="topic-chips-group">
                <span class="chips-label">💡 Suggestions rapides pour {{ currentSubject }} :</span>
                <div class="chips-wrap">
                  <button
                    *ngFor="let s of getGeneratorSuggestions()"
                    type="button"
                    class="topic-chip-btn"
                    (click)="generatorTopic = s"
                  >
                    {{ s }}
                  </button>
                </div>
              </div>

              <label class="form-label">Niveau de difficulté souhaité :</label>
              <div class="diff-selector">
                <button
                  type="button"
                  class="diff-btn"
                  [class.is-selected]="generatorDifficulty === 'Débutant'"
                  (click)="generatorDifficulty = 'Débutant'"
                >
                  Débutant
                </button>
                <button
                  type="button"
                  class="diff-btn"
                  [class.is-selected]="generatorDifficulty === 'Intermédiaire'"
                  (click)="generatorDifficulty = 'Intermédiaire'"
                >
                  Intermédiaire
                </button>
                <button
                  type="button"
                  class="diff-btn"
                  [class.is-selected]="generatorDifficulty === 'Avancé'"
                  (click)="generatorDifficulty = 'Avancé'"
                >
                  Avancé
                </button>
              </div>
            </div>
          </div>

          <div class="modal-footer">
            <button class="btn btn--outline" [disabled]="isGeneratingExercise" (click)="closeGeneratorModal()">Annuler</button>
            <button class="btn btn--primary" [disabled]="isGeneratingExercise" (click)="generateCustomExercise()">
              <mat-icon [class.spin]="isGeneratingExercise">{{ isGeneratingExercise ? 'sync' : 'auto_awesome' }}</mat-icon>
              <span>{{ isGeneratingExercise ? 'Le Tuteur IA conçoit ton exercice...' : 'Générer avec le Tuteur IA' }}</span>
            </button>
          </div>
        </div>
      </div>

    </ng-container>
  `,
  styles: [`
    /* ── Header & Banner ── */
    .exercises-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 2rem;
      margin-bottom: 1.5rem;
      flex-wrap: wrap;
    }

    .exercises-header__info {
      flex: 1;
      min-width: 300px;
    }

    .kicker-badge {
      display: inline-flex;
      align-items: center;
      gap: 0.4rem;
      padding: 0.25rem 0.75rem;
      border-radius: 999px;
      background: var(--accent-soft, rgba(37, 99, 235, 0.1));
      color: var(--accent, #2563eb);
      font-size: 0.78rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.04em;
      margin-bottom: 0.6rem;
    }

    .kicker-badge mat-icon {
      font-size: 16px;
      width: 16px;
      height: 16px;
    }

    .page-title {
      font-size: 1.85rem;
      font-weight: 800;
      color: var(--text, #0f172a);
      margin: 0 0 0.4rem 0;
      letter-spacing: -0.02em;
    }

    .page-subtitle {
      font-size: 0.95rem;
      color: var(--text-muted, #64748b);
      margin: 0;
      line-height: 1.55;
      max-width: 680px;
    }

    .header-action-row {
      margin-top: 1rem;
    }

    .btn-hero-generator {
      display: inline-flex;
      align-items: center;
      gap: 0.55rem;
      padding: 0.65rem 1.35rem;
      border-radius: 999px;
      background: linear-gradient(135deg, #2563eb, #7c3aed);
      color: #ffffff;
      font-size: 0.88rem;
      font-weight: 700;
      border: none;
      cursor: pointer;
      box-shadow: 0 4px 14px rgba(37, 99, 235, 0.25);
      transition: all 180ms ease;
    }

    .btn-hero-generator:hover {
      transform: translateY(-1px);
      box-shadow: 0 6px 20px rgba(37, 99, 235, 0.35);
    }

    .btn-hero-generator mat-icon {
      font-size: 18px;
      width: 18px;
      height: 18px;
    }

    /* Stats Card */
    .subject-stats-card {
      background: var(--surface-strong, #ffffff);
      border: 1px solid var(--border, rgba(148, 163, 184, 0.16));
      border-radius: var(--radius-lg, 20px);
      padding: 1.25rem 1.5rem;
      box-shadow: var(--shadow-sm);
      min-width: 280px;
    }

    .stats-top {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 0.6rem;
    }

    .stats-label {
      display: flex;
      align-items: center;
      gap: 0.4rem;
      font-size: 0.82rem;
      font-weight: 700;
      color: var(--text-secondary, #334155);
    }

    .stats-label mat-icon {
      color: var(--accent);
      font-size: 18px;
      width: 18px;
      height: 18px;
    }

    .adaptive-tier-pill {
      display: inline-flex;
      align-items: center;
      gap: 0.35rem;
      padding: 0.2rem 0.65rem;
      border-radius: 999px;
      font-size: 0.72rem;
      font-weight: 700;
    }

    .adaptive-tier-pill.tier-1 {
      background: #dcfce7;
      color: #15803d;
    }

    .adaptive-tier-pill.tier-2 {
      background: #fef3c7;
      color: #b45309;
    }

    .adaptive-tier-pill.tier-3 {
      background: #ede9fe;
      color: #6d28d9;
    }

    .adaptive-tier-pill mat-icon {
      font-size: 14px;
      width: 14px;
      height: 14px;
    }

    .stats-percent {
      font-size: 1.2rem;
      font-weight: 800;
      color: var(--accent);
    }

    .progress-bar-track {
      height: 8px;
      background: var(--surface-muted, #f1f5f9);
      border-radius: 999px;
      overflow: hidden;
      margin-bottom: 0.9rem;
    }

    .progress-bar-fill {
      height: 100%;
      background: linear-gradient(90deg, #2563eb, #3b82f6);
      border-radius: 999px;
      transition: width 400ms ease;
    }

    .stats-counters {
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .counter-item {
      display: flex;
      flex-direction: column;
    }

    .counter-value {
      font-size: 1.05rem;
      font-weight: 800;
      color: var(--text);
    }

    .counter-label {
      font-size: 0.72rem;
      color: var(--text-muted);
      text-transform: uppercase;
      font-weight: 600;
    }

    .counter-divider {
      width: 1px;
      height: 28px;
      background: var(--border);
    }

    .text-accent {
      color: var(--accent) !important;
    }

    /* ── Subject Bar ── */
    .subject-bar {
      display: flex;
      align-items: center;
      gap: 0.85rem;
      margin-bottom: 1.5rem;
      padding: 0.6rem 1rem;
      background: var(--surface-strong);
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
      white-space: nowrap;
    }

    .subject-bar__label mat-icon {
      font-size: 18px;
      width: 18px;
      height: 18px;
      color: var(--accent);
    }

    .subject-pills {
      display: flex;
      gap: 0.5rem;
      flex-wrap: wrap;
    }

    .subject-pill {
      display: inline-flex;
      align-items: center;
      gap: 0.45rem;
      padding: 0.4rem 0.95rem;
      border-radius: 999px;
      font-size: 0.82rem;
      font-weight: 600;
      border: 1.5px solid var(--border);
      background: var(--surface-muted, #f8fafc);
      color: var(--text-secondary);
      cursor: pointer;
      transition: all var(--transition-fast, 180ms ease);
    }

    .pill-dot {
      width: 7px;
      height: 7px;
      border-radius: 50%;
      background: #cbd5e1;
      transition: background 180ms;
    }

    .pill-count {
      font-size: 0.72rem;
      opacity: 0.8;
    }

    .subject-pill:hover:not(.is-active) {
      border-color: var(--accent);
      color: var(--accent);
      background: var(--accent-surface, #eff6ff);
    }

    .subject-pill.is-active {
      background: var(--accent);
      border-color: var(--accent);
      color: #ffffff;
      box-shadow: 0 4px 12px rgba(37, 99, 235, 0.25);
    }

    .subject-pill.is-active .pill-dot {
      background: #ffffff;
    }

    /* ── Main Layout ── */
    .exercises-layout {
      display: grid;
      grid-template-columns: 320px minmax(0, 1fr);
      gap: 1.5rem;
      align-items: start;
    }

    @media (max-width: 980px) {
      .exercises-layout {
        grid-template-columns: 1fr;
      }
    }

    /* ── Left Sidebar ── */
    .exercises-sidebar {
      border-radius: var(--radius-lg);
      border: 1px solid var(--border);
      background: var(--surface-strong);
      overflow: hidden;
      display: flex;
      flex-direction: column;
    }

    .sidebar-header {
      padding: 1.15rem;
      border-bottom: 1px solid var(--border);
      background: var(--surface);
    }

    .sidebar-title-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 0.85rem;
    }

    .sidebar-title {
      display: flex;
      align-items: center;
      gap: 0.4rem;
      font-size: 0.95rem;
      font-weight: 700;
      color: var(--text);
    }

    .sidebar-title mat-icon {
      color: var(--accent);
      font-size: 20px;
      width: 20px;
      height: 20px;
    }

    .btn-icon-custom {
      background: transparent;
      border: none;
      color: var(--text-muted);
      cursor: pointer;
      padding: 4px;
      border-radius: 6px;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: color 180ms;
    }

    .btn-icon-custom:hover {
      color: var(--accent);
    }

    .search-input-wrap {
      position: relative;
      margin-bottom: 0.75rem;
    }

    .search-icon {
      position: absolute;
      left: 10px;
      top: 50%;
      transform: translateY(-50%);
      font-size: 18px;
      width: 18px;
      height: 18px;
      color: var(--text-muted);
    }

    .search-input {
      width: 100%;
      box-sizing: border-box;
      padding: 0.5rem 2rem 0.5rem 2.2rem;
      border-radius: var(--radius-sm);
      border: 1px solid var(--border);
      font-size: 0.82rem;
      background: var(--surface-muted);
      color: var(--text);
    }

    .clear-search {
      position: absolute;
      right: 8px;
      top: 50%;
      transform: translateY(-50%);
      background: none;
      border: none;
      cursor: pointer;
      color: var(--text-muted);
      display: flex;
    }

    .clear-search mat-icon {
      font-size: 16px;
      width: 16px;
      height: 16px;
    }

    .filter-row {
      display: flex;
      gap: 0.35rem;
      flex-wrap: wrap;
    }

    .filter-chip {
      padding: 0.25rem 0.6rem;
      border-radius: 999px;
      font-size: 0.72rem;
      font-weight: 600;
      border: 1px solid var(--border);
      background: var(--surface);
      color: var(--text-muted);
      cursor: pointer;
      transition: all 140ms;
    }

    .filter-chip.is-active {
      background: var(--text);
      color: #fff;
      border-color: var(--text);
    }

    /* List of cards */
    .exercise-list {
      padding: 0.85rem;
      display: flex;
      flex-direction: column;
      gap: 0.65rem;
      max-height: 560px;
      overflow-y: auto;
    }

    .exercise-item-card {
      display: flex;
      flex-direction: column;
      padding: 0.85rem;
      border-radius: var(--radius-md);
      border: 1.5px solid var(--border);
      background: var(--surface);
      cursor: pointer;
      text-align: left;
      transition: all 180ms ease;
      position: relative;
    }

    .exercise-item-card:hover:not(.is-active) {
      border-color: var(--accent);
      background: var(--accent-surface);
      transform: translateY(-1px);
    }

    .exercise-item-card.is-active {
      border-color: var(--accent);
      background: var(--accent-surface);
      box-shadow: 0 4px 14px rgba(37, 99, 235, 0.14);
    }

    .exercise-item-card.is-active::before {
      content: '';
      position: absolute;
      left: 0;
      top: 10px;
      bottom: 10px;
      width: 4px;
      border-radius: 0 4px 4px 0;
      background: var(--accent);
    }

    .item-card__top {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 0.35rem;
    }

    .item-number {
      font-size: 0.72rem;
      font-weight: 800;
      color: var(--text-muted);
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .item-card__title {
      font-size: 0.88rem;
      font-weight: 700;
      color: var(--text);
      line-height: 1.35;
      margin-bottom: 0.5rem;
    }

    .item-card__meta {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      font-size: 0.72rem;
      color: var(--text-muted);
    }

    .meta-tag {
      display: inline-flex;
      align-items: center;
      gap: 0.25rem;
    }

    .meta-tag mat-icon {
      font-size: 13px;
      width: 13px;
      height: 13px;
      color: var(--accent);
    }

    .item-card__status {
      display: flex;
      align-items: center;
      gap: 0.3rem;
      font-size: 0.72rem;
      font-weight: 700;
      color: #059669;
      margin-top: 0.4rem;
    }

    .item-card__status mat-icon {
      font-size: 15px;
      width: 15px;
      height: 15px;
    }

    .empty-filter-state {
      text-align: center;
      padding: 2rem 1rem;
      color: var(--text-muted);
    }

    .empty-filter-state mat-icon {
      font-size: 32px;
      width: 32px;
      height: 32px;
      opacity: 0.5;
      margin-bottom: 0.5rem;
    }

    .sidebar-footer {
      padding: 0.85rem;
      border-top: 1px solid var(--border);
      background: var(--surface);
    }

    .btn-generator {
      width: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.45rem;
      padding: 0.6rem 0.85rem;
      border-radius: var(--radius-md);
      border: 1px dashed var(--accent);
      background: var(--accent-surface);
      color: var(--accent);
      font-size: 0.82rem;
      font-weight: 700;
      cursor: pointer;
      transition: all 180ms ease;
    }

    .btn-generator:hover {
      background: var(--accent);
      color: #fff;
    }

    .btn-generator mat-icon {
      font-size: 18px;
      width: 18px;
      height: 18px;
    }

    /* ── Right Detail Panel ── */
    .exercise-detail-panel {
      padding: 2rem;
      border-radius: var(--radius-lg);
      border: 1px solid var(--border);
      background: var(--surface-strong);
      box-shadow: var(--shadow-sm);
    }

    .exercise-main-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 1.25rem;
      margin-bottom: 1.25rem;
      flex-wrap: wrap;
    }

    .header-tag-row {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      flex-wrap: wrap;
      margin-bottom: 0.5rem;
    }

    .category-tag {
      padding: 0.2rem 0.65rem;
      border-radius: 999px;
      background: var(--surface-muted);
      color: var(--text-secondary);
      font-size: 0.75rem;
      font-weight: 600;
      border: 1px solid var(--border);
    }

    .meta-pill {
      display: inline-flex;
      align-items: center;
      gap: 0.25rem;
      font-size: 0.75rem;
      font-weight: 600;
      color: var(--text-muted);
    }

    .meta-pill mat-icon {
      font-size: 14px;
      width: 14px;
      height: 14px;
      color: var(--accent);
    }

    .active-exercise-title {
      font-size: 1.55rem;
      font-weight: 800;
      color: var(--text);
      line-height: 1.25;
      margin: 0;
    }

    .status-pill {
      display: inline-flex;
      align-items: center;
      gap: 0.35rem;
      padding: 0.35rem 0.85rem;
      border-radius: 999px;
      background: #f1f5f9;
      color: #64748b;
      font-size: 0.78rem;
      font-weight: 700;
    }

    .status-pill mat-icon {
      font-size: 16px;
      width: 16px;
      height: 16px;
    }

    .status-pill.is-done {
      background: #ecfdf5;
      color: #059669;
    }

    /* Objective Banner */
    .objective-banner {
      display: flex;
      align-items: center;
      gap: 0.65rem;
      padding: 0.85rem 1.15rem;
      border-radius: var(--radius-md);
      background: #f0f9ff;
      border: 1px solid #bae6fd;
      color: #0369a1;
      margin-bottom: 1.5rem;
      font-size: 0.88rem;
    }

    .objective-icon {
      font-size: 20px;
      width: 20px;
      height: 20px;
      color: #0284c7;
      flex-shrink: 0;
    }

    /* Statement Card */
    .statement-card {
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: var(--radius-md);
      padding: 1.4rem;
      margin-bottom: 1.5rem;
    }

    .card-section-header {
      display: flex;
      align-items: center;
      gap: 0.45rem;
      margin-bottom: 1rem;
    }

    .card-section-header mat-icon {
      color: var(--accent);
      font-size: 22px;
      width: 22px;
      height: 22px;
    }

    .card-section-header h3 {
      font-size: 1.05rem;
      font-weight: 800;
      color: var(--text);
      margin: 0;
    }

    /* Context box */
    .context-box {
      background: #ffffff;
      border: 1.5px solid #e2e8f0;
      border-radius: var(--radius-md);
      padding: 1.25rem;
      margin-bottom: 1.25rem;
    }

    .context-box--arabic {
      border-color: #cbd5e1;
      background: #fafaf9;
    }

    .context-box__tag {
      display: flex;
      align-items: center;
      gap: 0.35rem;
      font-size: 0.74rem;
      font-weight: 700;
      color: var(--text-muted);
      text-transform: uppercase;
      letter-spacing: 0.04em;
      margin-bottom: 0.75rem;
    }

    .context-box__tag mat-icon {
      font-size: 16px;
      width: 16px;
      height: 16px;
      color: var(--accent);
    }

    .context-body {
      font-size: 1.05rem;
      line-height: 1.7;
      color: var(--text);
    }

    .arabic-font {
      font-family: 'Amiri', 'Traditional Arabic', 'Scheherazade New', serif;
      font-size: 1.35rem;
      line-height: 2;
      color: #1e293b;
      letter-spacing: 0.01em;
    }

    [dir="rtl"] {
      text-align: right;
    }

    [dir="rtl"] .q-card-header,
    [dir="rtl"] .q-answer-header-row,
    [dir="rtl"] .q-answer-footer-row,
    [dir="rtl"] .eval-top,
    [dir="rtl"] .correction-card__header,
    [dir="rtl"] .takeaway-title,
    [dir="rtl"] .pitfalls-title,
    [dir="rtl"] .hints-header,
    [dir="rtl"] .hint-tier-trigger,
    [dir="rtl"] .solution-section-title {
      flex-direction: row-reverse;
      text-align: right;
    }

    [dir="rtl"] .btn-hint-inline {
      flex-direction: row-reverse;
      text-align: right;
    }

    [dir="rtl"] .btn-hint-inline .chevron-sm {
      margin-left: 0;
      margin-right: 0.2rem;
    }

    [dir="rtl"] .hint-inline-box {
      text-align: right;
      direction: rtl;
    }

    [dir="rtl"] .q-answer-textarea {
      text-align: right;
      direction: rtl;
    }

    [dir="rtl"] .q-statement-text {
      text-align: right;
      direction: rtl;
    }

    [dir="rtl"] .step-card {
      flex-direction: row-reverse;
      text-align: right;
    }

    [dir="rtl"] .step-content {
      text-align: right;
    }

    [dir="rtl"] .check-item {
      flex-direction: row-reverse;
      text-align: right;
    }

    [dir="rtl"] .custom-check {
      margin-left: 0.75rem;
      margin-right: 0;
    }

    [dir="rtl"] .pitfalls-list {
      padding-right: 1.5rem;
      padding-left: 0;
      text-align: right;
    }

    .context-translation {
      margin-top: 0.75rem;
      padding-top: 0.75rem;
      border-top: 1px dashed #e2e8f0;
      font-size: 0.85rem;
      color: var(--text-muted);
    }

    .tr-label {
      font-weight: 700;
      margin-right: 0.35rem;
    }

    /* Numbered Questions */
    .questions-subtitle {
      display: flex;
      align-items: center;
      gap: 0.4rem;
      font-size: 0.95rem;
      font-weight: 800;
      color: var(--text);
      margin: 1.25rem 0 0.75rem 0;
    }

    .questions-subtitle mat-icon {
      color: var(--accent);
      font-size: 18px;
      width: 18px;
      height: 18px;
    }

    .questions-ordered {
      list-style: none;
      padding: 0;
      margin: 0;
      display: flex;
      flex-direction: column;
      gap: 0.65rem;
    }

    .question-row {
      display: flex;
      align-items: flex-start;
      gap: 0.65rem;
      padding: 0.65rem 0.85rem;
      border-radius: var(--radius-sm);
      background: #f8fafc;
      border: 1px solid #f1f5f9;
    }

    .q-badge {
      display: inline-block;
      font-size: 0.72rem;
      font-weight: 800;
      padding: 0.2rem 0.5rem;
      border-radius: 999px;
      background: var(--accent);
      color: #fff;
      white-space: nowrap;
      flex-shrink: 0;
    }

    .q-text {
      font-size: 0.92rem;
      color: var(--text);
      line-height: 1.5;
    }


    /* ── Interactive Questions & Answers Section ── */
    .questions-section {
      margin-top: 1.5rem;
      margin-bottom: 1.5rem;
    }

    .questions-section-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1rem;
      flex-wrap: wrap;
      gap: 0.75rem;
    }

    .questions-section-title {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .questions-section-title mat-icon {
      color: var(--accent);
      font-size: 22px;
      width: 22px;
      height: 22px;
    }

    .questions-section-title h4 {
      margin: 0;
      font-size: 1.05rem;
      font-weight: 800;
      color: var(--text);
    }

    .questions-progress-pill {
      display: inline-flex;
      align-items: center;
      gap: 0.4rem;
      padding: 0.35rem 0.85rem;
      border-radius: 999px;
      font-size: 0.82rem;
      font-weight: 700;
      background: #f1f5f9;
      color: #64748b;
      border: 1px solid var(--border);
      transition: all 180ms ease;
    }

    .questions-progress-pill mat-icon {
      font-size: 16px;
      width: 16px;
      height: 16px;
    }

    .questions-progress-pill.is-complete {
      background: #ecfdf5;
      color: #059669;
      border-color: #a7f3d0;
    }

    .interactive-questions-list {
      display: flex;
      flex-direction: column;
      gap: 1.25rem;
    }

    .question-interactive-card {
      border: 1.5px solid #e2e8f0;
      border-radius: var(--radius-md);
      background: #ffffff;
      padding: 1.15rem;
      box-shadow: 0 1px 3px rgba(0,0,0,0.03);
      transition: all 200ms ease;
    }

    .question-interactive-card:hover {
      border-color: #cbd5e1;
      box-shadow: 0 4px 12px rgba(0,0,0,0.05);
    }

    .question-interactive-card.is-answered {
      border-color: #86efac;
      background: #fafdfb;
    }

    .q-card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 0.65rem;
    }

    .q-card-meta {
      display: flex;
      align-items: center;
      gap: 0.65rem;
    }

    .q-status-tag {
      display: inline-flex;
      align-items: center;
      gap: 0.3rem;
      font-size: 0.76rem;
      font-weight: 700;
      padding: 0.15rem 0.55rem;
      border-radius: 999px;
      background: #f8fafc;
      color: #94a3b8;
      border: 1px solid #e2e8f0;
    }

    .q-status-tag mat-icon {
      font-size: 14px;
      width: 14px;
      height: 14px;
    }

    .q-status-tag.is-done,
    .q-status-tag.is-valid {
      background: #ecfdf5;
      color: #059669;
      border-color: #a7f3d0;
    }

    .q-status-tag.is-partial {
      background: #fffbeb;
      color: #d97706;
      border-color: #fde68a;
    }

    .q-status-tag.is-invalid {
      background: #fef2f2;
      color: #dc2626;
      border-color: #fecaca;
    }

    .q-status-tag.is-draft {
      background: #f8fafc;
      color: #64748b;
      border-color: #cbd5e1;
    }

    .q-status-tag.is-entered {
      background: #eff6ff;
      color: #2563eb;
      border-color: #bfdbfe;
    }

    .q-status-tag.is-empty {
      background: #f8fafc;
      color: #94a3b8;
      border-color: #e2e8f0;
    }

    .q-statement-text {
      font-size: 0.95rem;
      font-weight: 600;
      color: var(--text);
      line-height: 1.55;
      margin-bottom: 0.85rem;
    }

    .q-inline-hint-wrap {
      margin-bottom: 0.85rem;
    }

    .btn-hint-inline {
      background: none;
      border: none;
      color: #d97706;
      font-size: 0.82rem;
      font-weight: 700;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 0.35rem;
      padding: 0.25rem 0.5rem;
      border-radius: var(--radius-sm);
      background: #fffbeb;
      border: 1px solid #fde68a;
      transition: all 160ms;
    }

    .btn-hint-inline:hover {
      background: #fef3c7;
    }

    .btn-hint-inline mat-icon {
      font-size: 16px;
      width: 16px;
      height: 16px;
    }

    .btn-hint-inline .chevron-sm {
      font-size: 16px;
      width: 16px;
      height: 16px;
      margin-left: 0.2rem;
    }

    .hint-inline-box {
      margin-top: 0.5rem;
      padding: 0.75rem 1rem;
      background: #fffbeb;
      border-left: 3px solid #f59e0b;
      border-radius: var(--radius-sm);
      font-size: 0.86rem;
      color: #78350f;
      line-height: 1.5;
    }

    .q-answer-container {
      background: #f8fafc;
      border-radius: var(--radius-sm);
      padding: 0.85rem;
      border: 1px solid #e2e8f0;
    }

    .q-answer-header-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 0.5rem;
    }

    .q-answer-label {
      display: flex;
      align-items: center;
      gap: 0.35rem;
      font-size: 0.86rem;
      font-weight: 700;
      color: #334155;
    }

    .q-answer-label mat-icon {
      color: var(--accent);
      font-size: 18px;
      width: 18px;
      height: 18px;
    }

    .autosave-tag {
      display: inline-flex;
      align-items: center;
      gap: 0.2rem;
      font-size: 0.72rem;
      font-weight: 600;
      color: #10b981;
    }

    .autosave-tag mat-icon {
      font-size: 14px;
      width: 14px;
      height: 14px;
    }

    .q-answer-textarea {
      width: 100%;
      box-sizing: border-box;
      padding: 0.65rem 0.85rem;
      border-radius: var(--radius-sm);
      border: 1.5px solid #cbd5e1;
      font-family: inherit;
      font-size: 0.92rem;
      line-height: 1.5;
      color: var(--text);
      background: #ffffff;
      resize: vertical;
      transition: all 180ms ease;
    }

    .q-answer-textarea:focus {
      outline: none;
      border-color: var(--accent);
      box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.12);
      background: #ffffff;
    }

    .q-answer-footer-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-top: 0.4rem;
      padding-top: 0.35rem;
      border-top: 1px dashed #e2e8f0;
    }

    .q-word-count {
      font-size: 0.76rem;
      color: #64748b;
    }

    .btn-clear-inline {
      background: none;
      border: none;
      color: #94a3b8;
      font-size: 0.76rem;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 0.2rem;
      padding: 0.15rem 0.4rem;
      border-radius: 4px;
      transition: color 150ms;
    }

    .btn-clear-inline:hover {
      color: #ef4444;
    }

    .btn-clear-inline mat-icon {
      font-size: 14px;
      width: 14px;
      height: 14px;
    }

    /* ── Submission Actions Wrapper ── */
    .submission-actions-wrapper {
      margin-bottom: 2rem;
      padding-top: 0.75rem;
      border-top: 1px solid var(--border);
    }

    .submission-actions-bar {
      display: flex;
      flex-wrap: wrap;
      gap: 0.85rem;
      align-items: center;
      margin-bottom: 0.75rem;
    }

    .submission-hint-message {
      font-size: 0.82rem;
      color: #64748b;
      font-style: italic;
    }

    /* ── Progressive Hints ── */
    .hints-section {
      margin-bottom: 1.5rem;
    }

    .hints-header {
      margin-bottom: 0.75rem;
    }

    .hints-title {
      display: flex;
      align-items: center;
      gap: 0.4rem;
      font-size: 0.92rem;
      font-weight: 700;
      color: var(--text);
    }

    .hints-title mat-icon {
      color: #f59e0b;
      font-size: 20px;
      width: 20px;
      height: 20px;
    }

    .hints-sub {
      font-size: 0.8rem;
      color: var(--text-muted);
      margin-top: 0.2rem;
      display: block;
    }

    .hints-accordion {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .hint-tier-card {
      border-radius: var(--radius-md);
      border: 1px solid #fed7aa;
      background: #fffbeb;
      overflow: hidden;
      transition: border-color 180ms;
    }

    .hint-tier-trigger {
      width: 100%;
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0.75rem 1rem;
      background: none;
      border: none;
      cursor: pointer;
      text-align: left;
    }

    .hint-trigger-left {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .hint-icon {
      color: #d97706;
      font-size: 18px;
      width: 18px;
      height: 18px;
    }

    .hint-title-text {
      font-size: 0.85rem;
      font-weight: 700;
      color: #92400e;
    }

    .hint-chevron {
      color: #d97706;
      font-size: 20px;
      width: 20px;
      height: 20px;
    }

    .hint-tier-content {
      padding: 0.85rem 1.15rem 1rem 1.15rem;
      border-top: 1px dashed #fde68a;
      font-size: 0.86rem;
      line-height: 1.55;
      color: #78350f;
    }

    /* ── Workspace ── */
    .workspace-section {
      margin-bottom: 1.5rem;
    }

    .workspace-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 0.65rem;
    }

    .workspace-label {
      display: flex;
      align-items: center;
      gap: 0.35rem;
      font-size: 0.92rem;
      font-weight: 700;
      color: var(--text);
    }

    .workspace-label mat-icon {
      color: var(--accent);
      font-size: 20px;
      width: 20px;
      height: 20px;
    }

    .autosave-badge {
      display: flex;
      align-items: center;
      gap: 0.25rem;
      font-size: 0.72rem;
      color: #059669;
      font-weight: 600;
    }

    .autosave-badge mat-icon {
      font-size: 14px;
      width: 14px;
      height: 14px;
    }

    /* Quick Toolbar */
    .quick-toolbar {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.45rem 0.75rem;
      background: #f8fafc;
      border: 1px solid var(--border);
      border-bottom: none;
      border-radius: var(--radius-md) var(--radius-md) 0 0;
      flex-wrap: wrap;
    }

    .toolbar-label {
      font-size: 0.74rem;
      font-weight: 700;
      color: var(--text-muted);
    }

    .char-buttons {
      display: flex;
      gap: 0.25rem;
      flex-wrap: wrap;
    }

    .char-btn {
      min-width: 26px;
      height: 26px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      padding: 0 0.35rem;
      border-radius: 4px;
      border: 1px solid #cbd5e1;
      background: #ffffff;
      font-size: 0.88rem;
      font-weight: 700;
      color: var(--text);
      cursor: pointer;
      transition: all 120ms;
    }

    .char-btn--text {
      font-size: 0.74rem;
      font-family: monospace;
    }

    .char-btn:hover {
      background: var(--accent);
      color: #fff;
      border-color: var(--accent);
    }

    .textarea-wrapper {
      position: relative;
    }

    .workspace-textarea {
      width: 100%;
      box-sizing: border-box;
      padding: 1rem;
      border-radius: var(--radius-md);
      border: 1.5px solid var(--border);
      background: var(--surface);
      color: var(--text);
      font-family: inherit;
      font-size: 0.92rem;
      line-height: 1.6;
      resize: vertical;
      transition: border-color 180ms ease, box-shadow 180ms ease;
    }

    .quick-toolbar + .textarea-wrapper .workspace-textarea {
      border-top-left-radius: 0;
      border-top-right-radius: 0;
    }

    .arabic-input {
      font-family: 'Amiri', 'Traditional Arabic', serif;
      font-size: 1.15rem;
      direction: rtl;
      line-height: 1.8;
    }

    .workspace-textarea:focus {
      outline: none;
      border-color: var(--accent);
      box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.15);
    }

    .workspace-footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-top: 0.4rem;
      font-size: 0.75rem;
      color: var(--text-muted);
    }

    .btn-text-action {
      background: none;
      border: none;
      color: #ef4444;
      font-size: 0.75rem;
      font-weight: 600;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 0.2rem;
    }

    .btn-text-action mat-icon {
      font-size: 14px;
      width: 14px;
      height: 14px;
    }

    /* ── Action Buttons Bar ── */
    .action-buttons-bar {
      display: flex;
      gap: 0.85rem;
      flex-wrap: wrap;
      margin-bottom: 2rem;
    }

    .btn {
      display: inline-flex;
      align-items: center;
      gap: 0.45rem;
      padding: 0.7rem 1.4rem;
      border-radius: 999px;
      font-size: 0.88rem;
      font-weight: 700;
      cursor: pointer;
      transition: all 180ms ease;
      border: none;
    }

    .btn mat-icon {
      font-size: 18px;
      width: 18px;
      height: 18px;
    }

    .btn--primary {
      background: var(--accent, #2563eb);
      color: #ffffff;
      box-shadow: 0 4px 14px rgba(37, 99, 235, 0.25);
    }

    .btn--primary:hover {
      background: var(--accent-strong, #1d4ed8);
      transform: translateY(-1px);
    }

    .btn--secondary {
      background: #f1f5f9;
      color: var(--text);
      border: 1px solid var(--border);
    }

    .btn--secondary:hover {
      background: #e2e8f0;
    }

    .btn--outline {
      background: transparent;
      border: 1.5px solid var(--border);
      color: var(--text-secondary);
    }

    .btn--outline:hover {
      border-color: var(--accent);
      color: var(--accent);
    }

    .btn--outline.is-done {
      background: #ecfdf5;
      border-color: #10b981;
      color: #059669;
    }

    .btn--sm {
      padding: 0.4rem 0.85rem;
      font-size: 0.78rem;
    }

    /* ── Correction Panel ── */
    .correction-card {
      padding: 1.75rem;
      border-radius: var(--radius-lg);
      background: #f0fdf4;
      border: 1.5px solid #86efac;
      animation: slideDown 220ms ease;
    }

    .correction-card__header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1.5rem;
      padding-bottom: 0.75rem;
      border-bottom: 1px solid #bbf7d0;
    }

    .header-left {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      color: #166534;
    }

    .header-left mat-icon {
      color: #10b981;
      font-size: 24px;
      width: 24px;
      height: 24px;
    }

    .header-left h3 {
      font-size: 1.15rem;
      font-weight: 800;
      margin: 0;
    }

    /* Self-Evaluation Box */
    .evaluation-box {
      background: #ffffff;
      border-radius: var(--radius-md);
      padding: 1.25rem;
      border: 1px solid #bbf7d0;
      margin-bottom: 1.5rem;
    }

    .eval-top {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 0.85rem;
      flex-wrap: wrap;
      gap: 0.5rem;
    }

    .eval-top h4 {
      display: flex;
      align-items: center;
      gap: 0.35rem;
      font-size: 0.92rem;
      font-weight: 700;
      color: #15803d;
      margin: 0;
    }

    .eval-top h4 mat-icon {
      font-size: 18px;
      width: 18px;
      height: 18px;
    }

    .eval-score-badge {
      font-size: 0.78rem;
      font-weight: 800;
      padding: 0.25rem 0.75rem;
      border-radius: 999px;
      background: #dcfce7;
      color: #166534;
    }

    .checklist-grid {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .check-item {
      display: flex;
      align-items: center;
      gap: 0.65rem;
      padding: 0.6rem 0.85rem;
      border-radius: var(--radius-sm);
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      cursor: pointer;
      transition: all 140ms;
    }

    .check-item.is-checked {
      background: #f0fdf4;
      border-color: #86efac;
    }

    .custom-check {
      width: 18px;
      height: 18px;
      accent-color: #10b981;
      cursor: pointer;
    }

    .check-label {
      font-size: 0.86rem;
      color: var(--text);
      line-height: 1.4;
    }

    /* Solution steps */
    .solution-steps-wrapper {
      margin-bottom: 1.5rem;
    }

    .solution-section-title {
      display: flex;
      align-items: center;
      gap: 0.4rem;
      font-size: 0.95rem;
      font-weight: 800;
      color: #166534;
      margin: 0 0 0.85rem 0;
    }

    .solution-section-title mat-icon {
      color: #10b981;
      font-size: 20px;
      width: 20px;
      height: 20px;
    }

    .steps-list {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }

    .step-card {
      display: flex;
      align-items: flex-start;
      gap: 0.85rem;
      padding: 1rem;
      border-radius: var(--radius-md);
      background: #ffffff;
      border: 1px solid #bbf7d0;
    }

    .step-number {
      width: 26px;
      height: 26px;
      border-radius: 50%;
      background: #10b981;
      color: #ffffff;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 800;
      font-size: 0.78rem;
      flex-shrink: 0;
    }

    .step-content {
      flex: 1;
    }

    .step-label {
      font-weight: 800;
      font-size: 0.92rem;
      color: #14532d;
      margin-bottom: 0.35rem;
    }

    .step-detail {
      font-size: 0.88rem;
      line-height: 1.6;
      color: #1f2937;
    }

    /* Takeaway box */
    .takeaway-box {
      background: #ffffff;
      border-left: 4px solid #10b981;
      border-radius: var(--radius-sm);
      padding: 0.85rem 1rem;
      margin-bottom: 1rem;
    }

    .takeaway-title {
      display: flex;
      align-items: center;
      gap: 0.35rem;
      font-size: 0.84rem;
      font-weight: 800;
      color: #166534;
      margin-bottom: 0.35rem;
    }

    .takeaway-title mat-icon {
      color: #10b981;
      font-size: 18px;
      width: 18px;
      height: 18px;
    }

    .takeaway-body {
      margin: 0;
      font-size: 0.86rem;
      color: #15803d;
      line-height: 1.5;
    }

    /* Pitfalls box */
    .pitfalls-box {
      background: #fffbeb;
      border-radius: var(--radius-sm);
      border: 1px solid #fde68a;
      padding: 0.85rem 1rem;
      margin-bottom: 1.5rem;
    }

    .pitfalls-title {
      display: flex;
      align-items: center;
      gap: 0.35rem;
      font-size: 0.84rem;
      font-weight: 800;
      color: #92400e;
      margin-bottom: 0.4rem;
    }

    .pitfalls-title mat-icon {
      color: #d97706;
      font-size: 18px;
      width: 18px;
      height: 18px;
    }

    .pitfalls-list {
      margin: 0;
      padding-left: 1.25rem;
      display: flex;
      flex-direction: column;
      gap: 0.3rem;
      font-size: 0.82rem;
      color: #78350f;
    }

    .correction-bottom-nav {
      display: flex;
      justify-content: space-between;
      gap: 1rem;
      padding-top: 1rem;
      border-top: 1px solid #bbf7d0;
    }

    /* Badges */
    .badge {
      font-size: 0.72rem;
      font-weight: 700;
      padding: 0.2rem 0.55rem;
      border-radius: 999px;
      text-transform: capitalize;
    }

    .badge--débutant {
      background: #ecfdf5;
      color: #065f46;
      border: 1px solid #a7f3d0;
    }

    .badge--intermédiaire {
      background: #eff6ff;
      color: #1e40af;
      border: 1px solid #bfdbfe;
    }

    .badge--avancé {
      background: #fef3c7;
      color: #92400e;
      border: 1px solid #fde68a;
    }

    .badge--success {
      background: #dcfce7;
      color: #166534;
      border: 1px solid #86efac;
    }

    /* ── Modals ── */
    .modal-overlay {
      position: fixed;
      inset: 0;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      width: 100vw;
      height: 100vh;
      background: rgba(15, 23, 42, 0.65);
      backdrop-filter: blur(8px);
      -webkit-backdrop-filter: blur(8px);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 999999;
      padding: 1.5rem;
      box-sizing: border-box;
      overflow-y: auto;
      animation: modalFadeIn 180ms ease-out;
    }

    .modal-card {
      background: #ffffff;
      border-radius: var(--radius-xl, 20px);
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.35);
      max-width: 540px;
      width: 100%;
      max-height: min(90vh, 580px);
      margin: auto;
      overflow: hidden;
      display: flex;
      flex-direction: column;
      border: 1px solid var(--border);
      position: relative;
      animation: modalPop 200ms cubic-bezier(0.16, 1, 0.3, 1);
    }

    @keyframes modalFadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }

    @keyframes modalPop {
      from { opacity: 0; transform: scale(0.95) translateY(10px); }
      to { opacity: 1; transform: none; }
    }

    .modal-header {
      padding: 1.25rem 1.5rem;
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      border-bottom: 1px solid var(--border);
      background: var(--surface);
      flex-shrink: 0;
    }

    .modal-title-wrap {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    .ai-avatar {
      font-size: 28px;
      width: 28px;
      height: 28px;
      color: var(--accent);
      padding: 8px;
      border-radius: 12px;
      background: var(--accent-surface);
    }

    .modal-title-wrap h3 {
      font-size: 1.1rem;
      font-weight: 800;
      margin: 0;
      color: var(--text);
    }

    .modal-title-wrap p {
      font-size: 0.78rem;
      color: var(--text-muted);
      margin: 0.15rem 0 0 0;
    }

    .modal-close-btn {
      background: none;
      border: none;
      color: var(--text-muted);
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 0.25rem;
      border-radius: 6px;
    }

    .modal-close-btn:hover {
      background: #f1f5f9;
      color: var(--text);
    }

    .modal-body {
      padding: 1.5rem;
      overflow-y: auto;
      max-height: calc(90vh - 140px);
    }

    .ai-speech-bubble {
      font-size: 0.92rem;
      line-height: 1.6;
      color: var(--text);
    }

    .ai-tip-box {
      background: #f0f9ff;
      border-left: 3px solid #0284c7;
      padding: 0.75rem 1rem;
      border-radius: 6px;
      margin: 0.85rem 0;
      color: #0369a1;
      font-size: 0.88rem;
    }

    .generator-form {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .form-label {
      font-size: 0.84rem;
      font-weight: 700;
      color: var(--text);
    }

    .form-input {
      width: 100%;
      box-sizing: border-box;
      padding: 0.75rem 0.85rem;
      border-radius: var(--radius-sm);
      border: 1px solid var(--border);
      font-size: 0.88rem;
      transition: border-color var(--transition-fast), box-shadow var(--transition-fast);
    }

    .form-input:focus {
      outline: none;
      border-color: var(--accent);
      box-shadow: 0 0 0 3px var(--focus);
    }

    .diff-selector {
      display: flex;
      gap: 0.5rem;
    }

    .diff-btn {
      flex: 1;
      padding: 0.55rem;
      border-radius: var(--radius-sm);
      border: 1px solid var(--border);
      background: #fff;
      font-size: 0.82rem;
      font-weight: 600;
      cursor: pointer;
      transition: all var(--transition-fast);
    }

    .diff-btn.is-selected {
      background: var(--accent);
      color: #fff;
      border-color: var(--accent);
    }

    .modal-footer {
      padding: 1rem 1.5rem;
      border-top: 1px solid var(--border);
      background: #f8fafc;
      display: flex;
      justify-content: flex-end;
      gap: 0.75rem;
      flex-shrink: 0;
    }

    /* ── AI Draft Evaluation Styles ── */
    .ai-eval-trigger-row {
      display: flex;
      align-items: center;
      gap: 0.85rem;
      margin-top: 0.85rem;
      flex-wrap: wrap;
    }

    .btn--ai-evaluate {
      background: linear-gradient(135deg, #2563eb, #7c3aed);
      color: #ffffff;
      border: none;
      padding: 0.65rem 1.25rem;
      border-radius: 999px;
      font-size: 0.85rem;
      font-weight: 700;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 0.45rem;
      box-shadow: 0 4px 12px rgba(37, 99, 235, 0.2);
      transition: all 180ms ease;
    }

    .btn--ai-evaluate:hover:not(:disabled) {
      transform: translateY(-1px);
      box-shadow: 0 6px 16px rgba(37, 99, 235, 0.3);
    }

    .btn--ai-evaluate:disabled {
      opacity: 0.6;
      cursor: not-allowed;
      transform: none;
    }

    .ai-eval-hint {
      font-size: 0.78rem;
      color: var(--text-muted);
      font-style: italic;
    }

    .ai-draft-feedback-card {
      margin-top: 1.25rem;
      padding: 1.25rem;
      border-radius: var(--radius-md);
      background: linear-gradient(135deg, rgba(37, 99, 235, 0.05), rgba(124, 58, 237, 0.05));
      border: 1.5px solid rgba(37, 99, 235, 0.25);
      animation: fadeIn 200ms ease;
    }

    .feedback-card-top {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 0.85rem;
    }

    .feedback-title-group {
      display: flex;
      align-items: center;
      gap: 0.65rem;
    }

    .ai-sparkle-icon {
      font-size: 26px;
      width: 26px;
      height: 26px;
      color: #2563eb;
    }

    .feedback-heading {
      font-size: 1.05rem;
      font-weight: 800;
      color: var(--text);
      margin: 0;
    }

    .feedback-sub {
      font-size: 0.76rem;
      color: var(--text-muted);
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }

    .feedback-score-badge {
      display: flex;
      align-items: baseline;
      gap: 0.15rem;
      padding: 0.35rem 0.75rem;
      border-radius: 999px;
      background: #f1f5f9;
      color: var(--text);
      border: 1px solid var(--border);
    }

    .feedback-score-badge.is-good {
      background: #ecfdf5;
      color: #065f46;
      border-color: #a7f3d0;
    }

    .feedback-score-badge.is-mid {
      background: #fffbeb;
      color: #b45309;
      border-color: #fde68a;
    }

    .feedback-score-badge.is-fail {
      background: #fef2f2;
      color: #b91c1c;
      border-color: #fecaca;
    }

    .score-val {
      font-size: 1.2rem;
      font-weight: 800;
    }

    .score-max {
      font-size: 0.78rem;
      font-weight: 600;
      opacity: 0.75;
    }

    .feedback-body-text {
      font-size: 0.92rem;
      line-height: 1.6;
      color: var(--text);
      margin: 0 0 1rem 0;
    }

    .feedback-details-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
      gap: 1rem;
      margin-bottom: 0.85rem;
    }

    .feedback-col {
      padding: 0.85rem 1rem;
      border-radius: var(--radius-sm);
      font-size: 0.85rem;
    }

    .strengths-col {
      background: #f0fdf4;
      border: 1px solid #bbf7d0;
      color: #14532d;
    }

    .tips-col {
      background: #fffbeb;
      border: 1px solid #fde68a;
      color: #92400e;
    }

    .col-title {
      display: flex;
      align-items: center;
      gap: 0.35rem;
      font-weight: 800;
      font-size: 0.82rem;
      margin-bottom: 0.4rem;
    }

    .col-title mat-icon {
      font-size: 16px;
      width: 16px;
      height: 16px;
    }

    .feedback-col ul {
      margin: 0;
      padding-left: 1.2rem;
    }

    .feedback-col li {
      margin-bottom: 0.25rem;
      line-height: 1.4;
    }

    .feedback-footer {
      display: flex;
      align-items: center;
      gap: 0.4rem;
      font-size: 0.84rem;
      font-weight: 600;
      color: #4f46e5;
      padding-top: 0.5rem;
      border-top: 1px dashed rgba(37, 99, 235, 0.2);
    }

    .feedback-footer mat-icon {
      font-size: 16px;
      width: 16px;
      height: 16px;
    }

    /* ── Detailed Question-by-Question Correction ── */
    .detailed-correction-section {
      margin-top: 1.25rem;
      padding-top: 1rem;
      border-top: 1px dashed rgba(37, 99, 235, 0.2);
    }

    .detailed-correction-header {
      display: flex;
      align-items: center;
      gap: 0.6rem;
      margin-bottom: 1rem;
    }

    .correction-header-icon {
      font-size: 24px;
      width: 24px;
      height: 24px;
      color: #2563eb;
    }

    .correction-section-title {
      font-size: 1rem;
      font-weight: 800;
      color: var(--text);
      margin: 0;
    }

    .correction-section-sub {
      font-size: 0.78rem;
      color: var(--text-muted);
    }

    .correction-cards-list {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .question-correction-card {
      background: #ffffff;
      border-radius: var(--radius-md);
      border: 1.5px solid #e2e8f0;
      padding: 1.15rem;
      box-shadow: 0 2px 6px rgba(0, 0, 0, 0.03);
    }

    .question-correction-card.is-correct {
      border-color: #86efac;
      background: #f0fdf4;
    }

    .question-correction-card.is-partiel {
      border-color: #fde68a;
      background: #fffdf5;
    }

    .question-correction-card.is-non-repondu,
    .question-correction-card.is-incorrect {
      border-color: #fca5a5;
      background: #fff5f5;
    }

    .q-corr-top {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 0.65rem;
    }

    .q-corr-meta {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      flex-wrap: wrap;
    }

    .q-corr-pill {
      font-size: 0.72rem;
      font-weight: 800;
      padding: 0.2rem 0.6rem;
      border-radius: 999px;
      background: #1e293b;
      color: #ffffff;
      text-transform: uppercase;
    }

    .q-corr-status-badge {
      font-size: 0.76rem;
      font-weight: 700;
      padding: 0.2rem 0.55rem;
      border-radius: 999px;
      background: #ffffff;
      border: 1px solid #cbd5e1;
    }

    .q-corr-score {
      font-size: 0.92rem;
      font-weight: 800;
      color: var(--text);
    }

    .q-corr-question-text {
      font-size: 0.9rem;
      color: var(--text);
      line-height: 1.5;
      margin: 0 0 0.75rem 0;
    }

    .q-corr-student-box {
      background: rgba(0, 0, 0, 0.03);
      border-left: 3px solid #94a3b8;
      border-radius: 4px;
      padding: 0.6rem 0.85rem;
      margin-bottom: 0.6rem;
    }

    .box-label {
      font-size: 0.75rem;
      font-weight: 800;
      color: #475569;
      text-transform: uppercase;
      letter-spacing: 0.03em;
      display: block;
      margin-bottom: 0.25rem;
    }

    .student-text {
      font-size: 0.88rem;
      color: #1e293b;
      margin: 0;
      line-height: 1.4;
    }

    .student-text.is-empty {
      color: #dc2626;
      font-style: italic;
      font-weight: 600;
    }

    .q-corr-feedback-box {
      background: #eff6ff;
      border-left: 3px solid #3b82f6;
      border-radius: 4px;
      padding: 0.6rem 0.85rem;
      margin-bottom: 0.6rem;
    }

    .q-corr-feedback-box p {
      margin: 0;
      font-size: 0.86rem;
      color: #1e40af;
      line-height: 1.45;
    }

    .q-corr-solution-box {
      background: #ecfdf5;
      border-left: 3px solid #10b981;
      border-radius: 4px;
      padding: 0.75rem 0.85rem;
    }

    .solution-text {
      font-size: 0.88rem;
      color: #065f46;
      line-height: 1.55;
    }

    .feedback-card-actions {
      display: flex;
      justify-content: flex-end;
      gap: 0.75rem;
      margin-top: 1rem;
      padding-top: 0.75rem;
      border-top: 1px solid rgba(0, 0, 0, 0.08);
      flex-wrap: wrap;
    }

    /* Topic Suggestion Chips */
    .topic-chips-group {
      margin: 0.65rem 0 1rem 0;
    }

    .chips-label {
      font-size: 0.76rem;
      font-weight: 700;
      color: var(--text-muted);
      margin-bottom: 0.4rem;
      display: block;
    }

    .chips-wrap {
      display: flex;
      flex-wrap: wrap;
      gap: 0.4rem;
    }

    .topic-chip-btn {
      padding: 0.25rem 0.65rem;
      border-radius: 999px;
      background: #f1f5f9;
      border: 1px solid #cbd5e1;
      color: #334155;
      font-size: 0.76rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 150ms ease;
    }

    .topic-chip-btn:hover {
      background: #e2e8f0;
      border-color: #94a3b8;
      color: #0f172a;
    }

    .empty-panel-centered {
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 480px;
      text-align: center;
      padding: 3rem 2rem;
    }

    .empty-panel-body {
      max-width: 480px;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 1rem;
    }

    .empty-icon-circle {
      width: 72px;
      height: 72px;
      border-radius: 50%;
      background: #eff6ff;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .empty-icon-circle mat-icon {
      font-size: 36px;
      width: 36px;
      height: 36px;
      color: #3b82f6;
    }

    .spin {
      animation: spin 1s linear infinite;
    }

    @keyframes spin {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }

    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }

    @keyframes slideDown {
      from { opacity: 0; transform: translateY(-8px); }
      to { opacity: 1; transform: translateY(0); }
    }
  `]
})
export class ExercisesComponent implements OnInit {
  @ViewChild('workspaceArea') workspaceArea?: ElementRef<HTMLTextAreaElement>;

  profile$ = this.profile.active$;
  session$ = this.session.session$;

  currentSubject = '';
  availableSubjects: string[] = [];
  
  selectedExerciseId = '';
  searchQuery = '';
  activeDifficultyFilter: 'ALL' | 'Débutant' | 'Intermédiaire' | 'Avancé' = 'ALL';

  showSolution = false;
  openHints: Record<string, boolean> = {};
  userDrafts: Record<string, string> = {};
  questionAnswers: Record<string, Record<number, string>> = {};
  activeQuestionIndex = 0;
  completedExercises: Record<string, boolean> = {};
  checkedCriteria: Record<string, Record<number, boolean>> = {};

  // Modals & AI States
  showAiModal = false;
  showGeneratorModal = false;
  generatorTopic = '';
  generatorDifficulty: 'Débutant' | 'Intermédiaire' | 'Avancé' = 'Débutant';
  adaptiveDifficulty = 'Débutant';
  adaptiveLevelIndex = 1;
  isGeneratingExercise = false;
  isEvaluatingDraft = false;
  currentDraftEvaluation: ExerciseEvaluationResponse | null = null;

  get isPrimaire1(): boolean {
    const lvl = (this.profile.currentProfile?.educationLevel || '').toLowerCase();
    return lvl.includes('1ère année primaire') || lvl.includes('1ere annee primaire') || lvl.includes('1ère primaire') || lvl.includes('cp') || lvl.includes('1 ap') || lvl.includes('première primaire');
  }

  get generatorPlaceholder(): string {
    return this.isPrimaire1
      ? "Ex : Compter jusqu'à 5, Les voyelles, etc."
      : "Ex : Les verbes défectueux, Dérivée d'une fonction composée, etc.";
  }

  readonly cpExerciseBanks: Record<string, ExerciseItem[]> = {
    'mathematiques': [
      {
        id: 'cp-math-1',
        title: 'Le petit panier de pommes de Sarah',
        subject: 'Mathématiques',
        difficulty: 'Débutant',
        category: 'Nombres et calculs • 1ère primaire (CP)',
        estimatedTime: '5 min',
        points: 20,
        objective: 'Dénombrer une petite quantité d\'objets et calculer une addition élémentaire (somme <= 5).',
        contextType: 'text',
        contextContent: 'Sarah prépare un goûter d\'anniversaire. Elle a 3 belles pommes rouges dans son panier. Sa maman lui donne 2 pommes vertes.',
        questions: [
          'Combien de pommes rouges Sarah a-t-elle au début dans son panier ?',
          'Combien de pommes vertes sa maman lui donne-t-elle ?',
          'Combien de pommes Sarah a-t-elle au total en tout (3 + 2) ?'
        ],
        hints: [
          { title: 'Indice 1 : Les pommes rouges', content: 'Relis la deuxième phrase : Sarah a 3 pommes rouges.' },
          { title: 'Indice 2 : Compter avec les doigts', content: 'Mets 3 doigts d\'une main, puis lève 2 doigts de l\'autre main : 1, 2, 3... 4, 5 !' }
        ],
        solutionSteps: [
          { label: 'Étape 1 : Nombre de pommes rouges', detail: 'Sarah a <strong>3 pommes rouges</strong> au début.' },
          { label: 'Étape 2 : Nombre de pommes vertes', detail: 'Sa maman lui donne <strong>2 pommes vertes</strong>.' },
          { label: 'Étape 3 : Calcul du total', detail: 'On additionne : 3 + 2 = <strong>5 pommes au total</strong>.' }
        ],
        solutionSummary: 'Sarah a 5 pommes en tout dans son panier (3 + 2 = 5).',
        pitfalls: ['Prends bien ton temps pour compter chaque doigt sans en sauter.'],
        keyTakeaway: '3 + 2 = 5 !',
        checklist: ['J\'ai trouvé le nombre de pommes rouges', 'J\'ai calculé 3 + 2 = 5']
      },
      {
        id: 'cp-math-2',
        title: 'Les formes géométriques de la classe',
        subject: 'Mathématiques',
        difficulty: 'Débutant',
        category: 'Espace et géométrie • 1ère primaire (CP)',
        estimatedTime: '5 min',
        points: 20,
        objective: 'Reconnaître et nommer les formes planes simples : le rond (cercle), le carré et le triangle.',
        contextType: 'text',
        contextContent: 'Dans la classe de CP, le maître montre trois objets : un ballon de football tout rond, une horloge carrée avec 4 côtés égaux, et un panneau de signalisation pointu qui a 3 côtés.',
        questions: [
          'Quelle est la forme du ballon de football (rond, carré ou triangle) ?',
          'Combien de côtés possède le panneau en forme de triangle ?',
          'Combien de côtés égaux possède l\'horloge carrée ?'
        ],
        hints: [
          { title: 'Indice 1 : Le ballon', content: 'Un ballon roule facilement car il est tout rond.' },
          { title: 'Indice 2 : Le triangle', content: 'Le mot triangle commence par "tri" qui signifie 3 côtés.' }
        ],
        solutionSteps: [
          { label: 'Étape 1', detail: 'Le ballon est un <strong>rond (cercle)</strong>.' },
          { label: 'Étape 2', detail: 'Le triangle possède exactement <strong>3 côtés</strong>.' },
          { label: 'Étape 3', detail: 'Le carré possède <strong>4 côtés</strong> égaux.' }
        ],
        solutionSummary: 'Le ballon est rond, le triangle a 3 côtés et le carré a 4 côtés.',
        pitfalls: ['Ne pas confondre le carré (4 côtés) et le triangle (3 côtés).'],
        keyTakeaway: 'Le rond n\'a pas de coin, le triangle a 3 côtés, le carré a 4 côtés.',
        checklist: ['J\'ai reconnu le rond', 'J\'ai compté 3 côtés pour le triangle']
      }
    ],
    'francais': [
      {
        id: 'cp-fr-1',
        title: 'La ronde des voyelles et des lettres',
        subject: 'Français',
        difficulty: 'Débutant',
        category: 'Lecture et écriture • 1ère primaire (CP)',
        estimatedTime: '5 min',
        points: 20,
        objective: 'Reconnaître les voyelles de l\'alphabet (a, e, i, o, u) et le son initial des mots.',
        contextType: 'text',
        contextContent: 'Amine apprend à lire les jolies lettres. Il voit écrit sur son cahier : « Un petit chat gris joue avec une pomme rouge. »',
        questions: [
          'Par quelle lettre commence le mot « chat » (C, P, ou V) ?',
          'Par quelle lettre commence le mot « pomme » (P, M, ou T) ?',
          'Trouve une voyelle parmi ces quatre lettres : B, D, A, F.'
        ],
        hints: [
          { title: 'Indice 1 : Son [ch]', content: 'Le mot chat commence par la lettre C.' },
          { title: 'Indice 2 : Les voyelles', content: 'Les voyelles chantent toutes seules : A, E, I, O, U, Y.' }
        ],
        solutionSteps: [
          { label: 'Étape 1', detail: '« chat » commence par la lettre <strong>C</strong>.' },
          { label: 'Étape 2', detail: '« pomme » commence par la lettre <strong>P</strong>.' },
          { label: 'Étape 3', detail: 'La lettre <strong>A</strong> est une voyelle.' }
        ],
        solutionSummary: 'Chat commence par C, pomme commence par P, et A est une voyelle.',
        pitfalls: ['Regarde bien la première lettre de chaque mot.'],
        keyTakeaway: 'Les lettres permettent d\'écrire tous les mots magiques !',
        checklist: ['J\'ai trouvé la lettre C', 'J\'ai reconnu la voyelle A']
      },
      {
        id: 'cp-fr-2',
        title: 'Un ou Une devant les mots familiers',
        subject: 'Français',
        difficulty: 'Débutant',
        category: 'Vocabulaire et articles • 1ère primaire (CP)',
        estimatedTime: '5 min',
        points: 20,
        objective: 'Choisir le petit mot correct « un » ou « une » devant des objets du quotidien.',
        contextType: 'text',
        contextContent: 'Dans la trousse de Léa, il y a plusieurs affaires d\'école : un crayon bien taillé, une gomme blanche, et une jolie règle bleue.',
        questions: [
          'Devant le mot « crayon », doit-on dire « un crayon » ou « une crayon » ?',
          'Devant le mot « gomme », doit-on dire « un gomme » ou « une gomme » ?',
          'À quoi sert la gomme dans la trousse de Léa ?'
        ],
        hints: [
          { title: 'Indice 1', content: 'On dit « un garçon » et « une fille », « un crayon » et « une gomme ».' }
        ],
        solutionSteps: [
          { label: 'Étape 1', detail: 'On dit <strong>un crayon</strong>.' },
          { label: 'Étape 2', detail: 'On dit <strong>une gomme</strong>.' },
          { label: 'Étape 3', detail: 'La gomme sert à <strong>effacer une erreur</strong>.' }
        ],
        solutionSummary: 'On dit « un crayon » et « une gomme » pour effacer.',
        pitfalls: ['Pense à écouter comment ça sonne dans ta tête.'],
        keyTakeaway: '« Un » pour les mots masculins, « Une » pour les mots féminins.',
        checklist: ['J\'ai choisi « un crayon »', 'J\'ai choisi « une gomme »']
      }
    ],
    'arabe': [
      {
        id: 'cp-ar-1',
        title: 'أَقْلَامُ أَمِينٍ فِي المِقْلَمَةِ المَدْرَسِيَّةِ',
        subject: 'Langue arabe',
        difficulty: 'Débutant',
        category: 'اللغة العربية • السنة الأولى ابتدائي',
        estimatedTime: '5 دقائق',
        points: 20,
        objective: 'العد البسيط وتمييز الأدوات المدرسية بالحركات القصيرة.',
        contextType: 'arabic',
        contextContent: '« فِي مِقْلَمَةِ أَمِينٍ 3 أَقْلَامٍ زَرْقَاءَ وَقَلَمَانِ أَحْمَرَانِ. »',
        contextTranslation: 'Dans la trousse d\'Amine, il y a 3 stylos bleus et 2 stylos rouges.',
        questions: [
          'كَمْ عَدَدُ الأَقْلَامِ الزَّرْقَاءِ فِي مِقْلَمَةِ أَمِينٍ ؟',
          'مَا هُوَ لَوْنُ القَلَمَيْنِ الآخَرَيْنِ (أَحْمَرَانِ أَمْ أَصْفَرَانِ) ؟',
          'كَمْ مَجْمُوعُ كُلِّ الأَقْلَامِ مَعًا (3 + 2) ؟'
        ],
        hints: [
          { title: 'إرشاد 1', content: 'اقرأ الجملة الأولى : 3 أقلام زرقاء.' },
          { title: 'إرشاد 2', content: 'احسب 3 + 2 على أصابع يديك.' }
        ],
        solutionSteps: [
          { label: 'الخطوة 1', detail: 'عدد الأقلام الزرقاء هو <strong>3 أقلام</strong>.' },
          { label: 'الخطوة 2', detail: 'لون القلمين الآخرين هو <strong>أحمران</strong>.' },
          { label: 'الخطوة 3', detail: 'المجموع الكلي: 3 + 2 = <strong>5 أقلام</strong>.' }
        ],
        solutionSummary: 'في المقلمة 3 أقلام زرقاء وقلمان أحمران، والمجموع 5 أقلام.',
        pitfalls: ['الانتباه إلى قراءة الأعداد بتأنٍّ.'],
        keyTakeaway: '« 3 + 2 = 5 ».',
        checklist: ['حددتُ عدد الأقلام الزرقاء', 'حسبتُ مجموع الأقلام']
      },
      {
        id: 'cp-ar-2',
        title: 'الحُرُوفُ الهِجَائِيَّةُ وَأَسْمَاءُ الإِشَارَةِ',
        subject: 'Langue arabe',
        difficulty: 'Débutant',
        category: 'الحروف والكلمات • الأولى ابتدائي',
        estimatedTime: '5 دقائق',
        points: 20,
        objective: 'التمييز بين اسمي الإشارة «هذا» و «هذه»، وتحديد الحرف الأول في الكلمات البسيطة.',
        contextType: 'arabic',
        contextContent: '« هَذَا وَلَدٌ نَشِيطٌ يَكْتُبُ بِالقَلَمِ، وَهَذِهِ بِنْتٌ مُؤَدَّبَةٌ تَقْرَأُ الكِتَابَ. »',
        contextTranslation: 'C\'est un garçon actif qui écrit avec le stylo, et c\'est une fille polie qui lit le livre.',
        questions: [
          'مَاذَا نَقُولُ لِلْوَلَدِ : (هَذَا وَلَدٌ) أَمْ (هَذِهِ وَلَدٌ) ؟',
          'مَا هُوَ الحَرْفُ الأَوَّلُ فِي كَلِمَةِ «بَاب» ؟',
          'بِمَاذَا يَكْتُبُ الوَلَدُ فِي الدَّفْتَرِ (بِالقَلَمِ أَمْ بِالمِمْحَاةِ) ؟'
        ],
        hints: [
          { title: 'إرشاد 1', content: '«هذا» للمذكر و «هذه» للمؤنث.' }
        ],
        solutionSteps: [
          { label: 'الخطوة 1', detail: 'نقول للولد : <strong>هَذَا وَلَدٌ</strong>.' },
          { label: 'الخطوة 2', detail: 'الحرف الأول في كلمة «بَاب» هو <strong>حرف الباء (ب)</strong>.' },
          { label: 'الخطوة 3', detail: 'يكتب الولد <strong>بِالقَلَمِ</strong>.' }
        ],
        solutionSummary: 'نستخدم «هذا» للمذكر و «هذه» للمؤنث، وكلمة باب تبدأ بالباء.',
        pitfalls: ['عدم الخلط بين هذا وهذه.'],
        keyTakeaway: '« هَذَا لِلْمُذَكَّرِ وَهَذِهِ لِلْمُؤَنَّثِ ».',
        checklist: ['اخترتُ «هذا ولد»', 'عرفتُ حرف الباء']
      }
    ],
    'education_islamique': [
      {
        id: 'cp-ei-1',
        title: 'أَرْكَانُ الإِسْلَامِ الخَمْسَةُ لِلأَطْفَالِ',
        subject: 'Éducation islamique',
        difficulty: 'Débutant',
        category: 'التربية الإسلامية • الأولى ابتدائي',
        estimatedTime: '5 دقائق',
        points: 20,
        objective: 'معرفة عدد أركان الإسلام وأول ركن من أركانه.',
        contextType: 'arabic',
        contextContent: '« بُنِيَ الإِسْلاَمُ عَلَى خَمْسٍ : شَهَادَةِ أَنْ لاَ إِلَهَ إِلاَّ اللهُ وَأَنَّ مُحَمَّدًا رَسُولُ اللهِ، وَإِقَامِ الصَّلاَةِ، وَإِيتَاءِ الزَّكَاةِ، وَصَوْمِ رَمَضَانَ، وَحَجِّ البَيْتِ. »',
        contextTranslation: 'Les 5 piliers de l\'Islam enseignés aux jeunes élèves.',
        questions: [
          'كَمْ عَدَدُ أَرْكَانِ الإِسْلَامِ (3 أَمْ 5 أَمْ 7) ؟',
          'مَا هُوَ الرُّكْنُ الأَوَّلُ مِنْ أَرْكَانِ الإِسْلَامِ ؟',
          'مَاذَا نَقُولُ قَبْلَ أَنْ نَبْدَأَ فِي الأَكْلِ (بِسْمِ اللَّهِ أَمْ الحَمْدُ لِلَّهِ) ؟'
        ],
        hints: [
          { title: 'إرشاد 1', content: 'أركان الإسلام بعدد أصابع يد واحدة كاملة (5).' }
        ],
        solutionSteps: [
          { label: 'الخطوة 1', detail: 'عدد أركان الإسلام هو <strong>5 أركان</strong>.' },
          { label: 'الخطوة 2', detail: 'الركن الأول هو <strong>الشَّهَادَتَانِ</strong>.' },
          { label: 'الخطوة 3', detail: 'قبل الأكل نقول : <strong>بِسْمِ اللَّهِ</strong>.' }
        ],
        solutionSummary: 'أركان الإسلام 5، وأولها الشهادتان، ونقول باسم الله قبل الأكل.',
        pitfalls: ['تذكر أن نقول باسم الله في البداية والحمد لله في النهاية.'],
        keyTakeaway: 'أركان الإسلام خمسة.',
        checklist: ['عرفتُ عدد الأركان وهو 5', 'عرفتُ التسمية قبل الأكل']
      }
    ],
    'biologie': [
      {
        id: 'cp-svt-1',
        title: 'Mes 5 sens et la découverte du monde',
        subject: 'Sciences de la Vie et de la Terre',
        difficulty: 'Débutant',
        category: 'Éveil scientifique • 1ère primaire (CP)',
        estimatedTime: '5 min',
        points: 20,
        objective: 'Identifier les 5 sens et leurs organes associés (yeux, oreilles, nez, langue, mains).',
        contextType: 'text',
        contextContent: 'Lina est dans le jardin. Elle regarde les belles fleurs colorées avec ses yeux, elle écoute le chant des oiseaux avec ses oreilles, et elle sent la bonne odeur de la rose avec son nez.',
        questions: [
          'Avec quel organe de son corps Lina regarde-t-elle les jolies fleurs ?',
          'Avec quel organe entend-elle les oiseaux chanter ?',
          'Combien d\'yeux possède chaque enfant ?'
        ],
        hints: [
          { title: 'Indice 1 : La vue', content: 'On ouvre les yeux le matin pour voir la lumière du jour.' }
        ],
        solutionSteps: [
          { label: 'Étape 1', detail: 'On regarde les fleurs avec <strong>les yeux</strong>.' },
          { label: 'Étape 2', detail: 'On écoute le chant des oiseaux avec <strong>les oreilles</strong>.' },
          { label: 'Étape 3', detail: 'Chaque enfant possède <strong>2 yeux</strong>.' }
        ],
        solutionSummary: 'Les yeux servent à voir et les oreilles servent à entendre.',
        pitfalls: ['Ne pas confondre la vue (les yeux) et l\'ouïe (les oreilles).'],
        keyTakeaway: 'Mes yeux pour voir, mes oreilles pour écouter, mon nez pour sentir !',
        checklist: ['J\'ai identifié les yeux', 'J\'ai identifié les oreilles']
      }
    ],
    'anglais': [
      {
        id: 'cp-en-1',
        title: 'Numbers and Colors in the Classroom',
        subject: 'Anglais',
        difficulty: 'Débutant',
        category: 'English Basics • 1st Grade (CP)',
        estimatedTime: '5 min',
        points: 20,
        objective: 'Count from 1 to 5 and recognize simple primary colors.',
        contextType: 'text',
        contextContent: 'Look at the classroom! The sun is yellow in the sky. Tommy has two (2) blue pencils and three (3) red apples.',
        questions: [
          'What color is the sun (Yellow or Blue)?',
          'How many blue pencils does Tommy have (Two or Five)?',
          'How many fingers do you have on one hand (5 or 10)?'
        ],
        hints: [
          { title: 'Hint 1', content: 'The sun shines bright yellow!' }
        ],
        solutionSteps: [
          { label: 'Step 1', detail: 'The sun is <strong>Yellow</strong>.' },
          { label: 'Step 2', detail: 'Tommy has <strong>two (2)</strong> blue pencils.' },
          { label: 'Step 3', detail: 'We have <strong>5 fingers</strong> on one hand.' }
        ],
        solutionSummary: 'The sun is yellow, Tommy has 2 pencils, and one hand has 5 fingers.',
        pitfalls: ['Count carefully: One, Two, Three, Four, Five!'],
        keyTakeaway: 'Colors and numbers are fun to say in English!',
        checklist: ['I know the color yellow', 'I can count to 5']
      }
    ]
  };

  readonly exerciseBanks: Record<string, ExerciseItem[]> = {
    'education_islamique': [
      {
        id: 'ei-1',
        title: 'أَرْكَانُ الإِسْلاَمِ الخَمْسَةُ وَأَثَرُهَا فِي حَيَاةِ المُسْلِمِ',
        subject: 'Éducation islamique',
        difficulty: 'Débutant',
        category: 'التربية الإسلامية • العقيدة والعبادات',
        estimatedTime: '15 دقيقة',
        points: 30,
        objective: 'التعرف على أركان الإسلام الخمسة بالترتيب، وفهم مكانة الصلاة والزكاة في تحقيق التضامن والنظافة الروحية.',
        contextType: 'arabic',
        contextContent: '« عَنْ عَبْدِ اللهِ بْنِ عُمَرَ رَضِيَ اللهُ عَنْهُمَا قَالَ : قَالَ رَسُولُ اللهِ صَلَّى اللهُ عَلَيْهِ وَسَلَّمَ : بُنِيَ الإِسْلاَمُ عَلَى خَمْسٍ : شَهَادَةِ أَنْ لاَ إِلَهَ إِلاَّ اللهُ وَأَنَّ مُحَمَّدًا رَسُولُ اللهِ، وَإِقَامِ الصَّلاَةِ، وَإِيتَاءِ الزَّكَاةِ، وَحَجِّ البَيْتِ، وَصَوْمِ رَمَضَانَ. » (رواه البخاري ومسلم)',
        contextTranslation: 'Hadith fondamental des 5 piliers de l\'Islam : l\'attestation de foi, la prière, la zakât, le pèlerinage et le jeûne de Ramadan.',
        questions: [
          'رَتِّبْ أَرْكَانَ الإِسْلاَمِ الخَمْسَةَ كَمَا وَرَدَتْ فِي الحَدِيثِ النَّبَوِيِّ الشَّرِيفِ.',
          'بَيِّنْ أَهَمِّيَّةَ « الرُّكْنِ الثَّانِي » (إِقَامُ الصَّلاَةِ) فِي حَيَاةِ التِّلْمِيذِ المُسْلِمِ، وَكَيْفَ تُعَلِّمُهُ النِّظَامَ وَالطَّهَارَةَ.',
          'كَيْفَ يُسَاهِمُ رُكْنُ « إِيتَاءِ الزَّكَاةِ » فِي تَحْقِيقِ التَّضَامُنِ وَالمَحَبَّةِ بَيْنَ أَفْرَادِ المُجْتَمَعِ ؟'
        ],
        hints: [
          { title: 'إرشاد 1', content: 'ابدأ بالشهادتين فهما مفتاح الدخول في الإسلام وأساس كل عمل صالح.' },
          { title: 'إرشاد 2', content: 'الصلاة صلة يومية بين العبد وربه وتتطلب طهارة الثوب والبدن والمكان.' },
          { title: 'إرشاد 3', content: 'الزكاة حق معلوم أوجبه الله في أموال الأغنياء للفقراء والمساكين.' }
        ],
        solutionSteps: [
          {
            label: 'الخطوة 1 : ترتيب الأركان الخمسة',
            detail: '1. شهادة أن لا إله إلا الله وأن محمدًا رسول الله.<br>2. إقام الصلاة.<br>3. إيتاء الزكاة.<br>4. حج البيت لمن استطاع إليه سبيلاً.<br>5. صوم رمضان.'
          },
          {
            label: 'الخطوة 2 : أثر الصلاة في حياة التلميذ',
            detail: 'الصلاة عماد الدين وهي الركن العملي الأول؛ تُرَبِّي التلميذ على احترام الأوقات، والحرص على النظافة التامة بالوضوء، وتمنحه السكينة والطمأنينة النفسية.'
          },
          {
            label: 'الخطوة 3 : دور الزكاة في التضامن الاجتماعي',
            detail: 'الزكاة تطهر نفس الغني من البخل والشح، وتسد حاجة الفقراء والأيتام، وتنشر المحبة وتمنع الحقد في المجتمع.'
          }
        ],
        solutionSummary: 'أركان الإسلام الخمسة هي البناء المتكامل الذي تقوم عليه حياة المسلم عقيدةً وعبادةً وسلوكًا وتكافلاً.',
        pitfalls: ['نسيان ترتيب الأركان كما جاءت في السنة النبوية.', 'إغفال شرط الطهارة عند الحديث عن الصلاة.'],
        keyTakeaway: '« الإِسْلاَمُ عَقِيدَةٌ خَالِصَةٌ وَعَمَلٌ صَالِحٌ وَأَخْلاَقٌ فَاضِلَةٌ ».',
        checklist: [
          'رتبتُ أركان الإسلام الخمسة ترتيبًا صحيحًا',
          'بينتُ دور الصلاة في التربية على الطهارة والنظام',
          'أوضحتُ أثر الزكاة في التكافل الاجتماعي'
        ]
      },
      {
        id: 'ei-2',
        title: 'سُورَةُ الفَاتِحَةِ : فَضْلُهَا، مَقَاصِدُهَا، وَأَحْكَامُ تِلاَوَتِهَا',
        subject: 'Éducation islamique',
        difficulty: 'Intermédiaire',
        category: 'التربية الإسلامية • القرآن الكريم (مدخل التزكية)',
        estimatedTime: '15 دقيقة',
        points: 35,
        objective: 'تدبر معاني سورة الفاتحة ومقاصدها الإيمانية، ومعرفة سبب تسميتها بالسبع المثاني وأم الكتاب، وإتقان أحكام تلاوتها.',
        contextType: 'arabic',
        contextContent: '﴿ بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ (1) الْحَمْدُ لِلَّهِ رَبِّ الْعَالَمِينَ (2) الرَّحْمَٰنِ الرَّحِيمِ (3) مَالِكِ يَوْمِ الدِّينِ (4) إِيَّاكَ نَعْبُدُ وَإِيَّاكَ نَسْتَعِينُ (5) اهْدِنَا الصِّرَاطَ الْمُسْتَقِيمَ (6) صِرَاطَ الَّذِينَ أَنْعَمْتَ عَلَيْهِمْ غَيْرِ الْمَغْضُوبِ عَلَيْهِمْ وَلَا الضَّالِّينَ (7) ﴾',
        contextTranslation: 'Sourate Al-Fatiha (Le Prologue) : La mère du Coran, les 7 versets répétés dans chaque unité de prière.',
        questions: [
          'لِمَاذَا سُمِّيَتْ سُورَةُ الفَاتِحَةِ بِـ « أُمِّ الكِتَابِ » وَ« السَّبْعِ المَثَانِي » ؟',
          'اسْتَخْرِجْ مِنَ الآيَةِ الخَامِسَةِ مَعْنَى « الإِخْلاَصِ فِي العِبَادَةِ وَالتَّوَكُّلِ عَلَى اللهِ » (إِيَّاكَ نَعْبُدُ وَإِيَّاكَ نَسْتَعِينُ).',
          'مَا هُوَ الدُّعَاءُ الجَامِعُ الَّذِي يَسْأَلُهُ المُسْلِمُ رَبَّهُ فِي كُلِّ رَكْعَةٍ مِنْ رَكَعَاتِ صَلاَتِهِ ؟'
        ],
        hints: [
          { title: 'إرشاد 1', content: 'سميت بالسبع المثاني لأنها تتكون من سبع آيات تثنى وتتكرر في كل ركعة من ركعات الصلاة.' },
          { title: 'إرشاد 2', content: 'تقديم المعمول (إياك) يفيد الحصر والاختصاص : لا نعبد إلا أنت ولا نستعين إلا بك.' },
          { title: 'إرشاد 3', content: 'الصراط المستقيم هو طريق الحق والهداية الذي سلكه الأنبياء والصالحون.' }
        ],
        solutionSteps: [
          {
            label: 'الخطوة 1 : أسباب التسمية وفضل السورة',
            detail: '• <strong>أم الكتاب :</strong> لأنها جمعت مقاصد القرآن الكريم كلها من توحيد ووعد ووعيد وتشريع.<br>• <strong>السبع المثاني :</strong> لأنها سبع آيات تُثَنَّى (تُعاد وتُكرَّر) في كل ركعة صلاة فرضًا ونفلاً.'
          },
          {
            label: 'الخطوة 2 : توحيد العبادة والاستعانة',
            detail: '« إِيَّاكَ نَعْبُدُ » براءة من الشرك وإخلاص للعبادة لله وحده، و« إِيَّاكَ نَسْتَعِينُ » براءة من الحول والقوة وتفويض كامل لله تعالى في طلب العون.'
          },
          {
            label: 'الخطوة 3 : الدعاء بالهداية',
            detail: 'الدعاء الجامع هو : ﴿ اهْدِنَا الصِّرَاطَ الْمُسْتَقِيمَ ﴾، وهو سؤال الله الثبات على طريق الحق والعدل والعمل الصالح.'
          }
        ],
        solutionSummary: 'سورة الفاتحة هي أعظم سور القرآن، جمعت الثناء على الله، والاعتراف بربوبيته، وإخلاص العبادة والاستعانة به، والدعاء بالهداية والاستقامة.',
        pitfalls: ['عدم احتساب البسملة كآية من الفاتحة في قراءة من يراها آية.', 'التسرع في قراءتها دون تدبر وتأنٍّ في الصلاة.'],
        keyTakeaway: '« لاَ صَلاَةَ لِمَنْ لَمْ يَقْرَأْ بِفَاتِحَةِ الكِتَابِ ».',
        checklist: [
          'بينتُ معاني أسماء سورة الفاتحة',
          'شرحتُ دلالة إياك نعبد وإياك نستعين',
          'حددتُ الدعاء القرآني الجامع في السورة'
        ]
      },
      {
        id: 'ei-3',
        title: 'الأَخْلاَقُ النَّبَوِيَّةُ الفَاضِلَةُ : الصِّدْقُ وَالأَمَانَةُ وَبِرُّ الوَالِدَيْنِ',
        subject: 'Éducation islamique',
        difficulty: 'Intermédiaire',
        category: 'التربية الإسلامية • مدخل الاقتداء والقسط',
        estimatedTime: '15 دقيقة',
        points: 35,
        objective: 'الاقتداء بأخلاق الرسول صلى الله عليه وسلم، وإدراك فضل الصدق والأمانة وبر الوالدين في بناء شخصية التلميذ المسلم.',
        contextType: 'arabic',
        contextContent: '« قَالَ رَسُولُ اللهِ صَلَّى اللهُ عَلَيْهِ وَسَلَّمَ : عَلَيْكُمْ بِالصِّدْقِ، فَإِنَّ الصِّدْقَ يَهْدِي إِلَى البِرِّ، وَإِنَّ البِرَّ يَهْدِي إِلَى الجَنَّةِ، وَمَا يَزَالُ الرَّجُلُ يَصْدُقُ وَيَتَحَرَّى الصِّدْقَ حَتَّى يُكْتَبَ عِنْدَ اللهِ صِدِّيقًا... » (صحيح مسلم)',
        contextTranslation: 'Hadith sur la valeur cardinale de la véracité (As-Sidq) et ses fruits vertueux menant au bien et au Paradis.',
        questions: [
          'اسْتَدِلَّ مِنْ سِيرَةِ النَّبِيِّ صلى الله عليه وسلم عَلَى صِفَتَيِ « الصِّدْقِ وَالأَمَانَةِ » قَبْلَ البَعْثَةِ النَّبَوِيَّةِ الشَّرِيفَةِ.',
          'بَيِّنْ مَعْنَى « البِرِّ » الوَارِدِ فِي الحَدِيثِ وَكَيْفَ يَرْتَبِطُ بِبِرِّ الوَالِدَيْنِ وَالإِحْسَانِ إِلَيْهِمَا.',
          'اقْتَرِحْ ثَلاَثَةَ سُلُوكِيَّاتٍ عَمَلِيَّةٍ يَلْتَزِمُ بِهَا التِّلْمِيذُ لِيَكُونَ صَادِقًا وَأَمِينًا فِي مَدْرَسَتِهِ وَمَعَ زُمَلاَئِهِ.'
        ],
        hints: [
          { title: 'إرشاد 1', content: 'لقب النبي صلى الله عليه وسلم في الجاهلية بالصادق الأمين واستودعته قريش أموالها.' },
          { title: 'إرشاد 2', content: 'البر اسم جامع لكل خصال الخير، وأعظم البر بعد حق الله هو بر الوالدين.' },
          { title: 'إرشاد 3', content: 'فكر في الامتحانات، والواجبات المدرسية، وحفظ الأغراض المودعة.' }
        ],
        solutionSteps: [
          {
            label: 'الخطوة 1 : الصدق والأمانة في السيرة النبوية',
            detail: 'كان صلى الله عليه وسلم مشهوراً قبل البعثة بلقب <strong>« الصَّادِقِ الأَمِينِ »</strong>، حيث كانت قريش تستودعه ودائعها وأموالها، واختارته السيدة خديجة رضي الله عنها للتجارة في مالها لأمانته وصدقه المشهودين.'
          },
          {
            label: 'الخطوة 2 : مفهوم البر وعلاقته ببر الوالدين',
            detail: '• <strong>البِرُّ :</strong> اسم جامع لكل خصال الخير والفضائل.<br>• <strong>علاقته ببر الوالدين :</strong> قرن الله تعالى حقه بالإحسان إلى الوالدين، وبرهما بطاعتهما وخفض الجناح لهما والدعاء لهما من أعظم أبواب الجنة.'
          },
          {
            label: 'الخطوة 3 : السلوكيات العملية للتلميذ الصادق الأمين',
            detail: '1. <strong>النزاهة في الاختبارات والواجبات :</strong> عدم الغش والاعتماد على الجهد الشخصي.<br>2. <strong>الوفاء بالوعد وحفظ السر :</strong> الصدق في الحديث وتجنب الكذب والمماطلة.<br>3. <strong>رد الأمانات :</strong> الحفاظ على ممتلكات الزملاء والمدرسة ورد ما استعاره سالماً.'
          }
        ],
        solutionSummary: 'الصدق والأمانة هما ركيزتا الأخلاق الإسلامية، وثمرتهما البر والجنة وصلاح المجتمع.',
        pitfalls: [
          'الاعتقاد بأن الكذب جائز في المواقف الصعبة؛ فالصدق منجاة دائماً.',
          'حصر الأمانة في المال فقط، في حين أنها تشمل أيضاً حفظ السر والوفاء بالعهد وإتقان العمل.'
        ],
        keyTakeaway: '« عَلَيْكُمْ بِالصِّدْقِ، فَإِنَّ الصِّدْقَ يَهْدِي إِلَى البِرِّ، وَإِنَّ البِرَّ يَهْدِي إِلَى الجَنَّةِ ».',
        checklist: [
          'استدللتُ على صدق وأمانة النبي صلى الله عليه وسلم قبل البعثة',
          'بينتُ معنى البر وربطه ببر الوالدين',
          'اقترحتُ 3 سلوكيات عملية للصدق والأمانة في البيئة المدرسية'
        ]
      }
    ],
    
        'arabe': [
      {
        id: 'ar-1',
        title: 'تَحْلِيلُ الجُمْلَةِ الاِسْمِيَّةِ : المُبْتَدَأُ وَالخَبَرُ وَنَوَاسِخُهَا',
        subject: 'Langue arabe',
        difficulty: 'Débutant',
        category: 'اللغة العربية • النحو والإعراب',
        estimatedTime: '12 دقيقة',
        points: 30,
        objective: 'تحديد ركني الجملة الاسمية (المبتدأ والخبر)، وتوضيح علامة إعرابهما الأصلية، وبيان أثر دخول النواسخ الحرفية (إِنَّ وأخواتها).',
        contextType: 'arabic',
        contextContent: '« العِلْمُ نُورٌ يُضِيءُ دَرْبَ الحَيَاةِ، وَالصَّبْرُ مِفْتَاحُ الفَرَجِ. »',
        contextTranslation: '« La science est une lumière qui éclaire le chemin de la vie, et la patience est la clé de la délivrance. »',
        questions: [
          'فِي الجُمْلَةِ الأُولَى : « العِلْمُ نُورٌ »، اسْتَخْرِجِ المُبْتَدَأَ وَالخَبَرَ مَعَ بَيَانِ مَعْنَى كُلٍّ مِنْهُمَا.',
          'مَا هِيَ عَلاَمَةُ الإِعْرَابِ الَّتِي تَظْهَرُ عَلَى آخِرِ كُلٍّ مِنْ « العِلْمُ » وَ « نُورٌ » ؟ وَمَا هُوَ حُكْمُهُمَا الإِعْرَابِيُّ الأَصْلِيُّ ؟',
          'أَدْخِلِ النَّاسِخَ الحَرْفِيَّ « إِنَّ » عَلَى جُمْلَةِ « العِلْمُ نُورٌ »، مَعَ الضَّبْطِ التَّامِّ بِالشَّكْلِ، وَبَيِّنِ التَّغْيِيرَ الَّذِي طَرَأَ عَلَى المُبْتَدَأِ وَالخَبَرِ.'
        ],
        hints: [
          {
            title: 'إرشاد 1 : تحديد المبتدأ والخبر',
            content: 'المبتدأ هو الاسم المعرفة المرفوع الذي تبتدئ به الجملة، والخبر هو الكلمة التي تتمم المعنى وتفيد الإخبار عن المبتدأ.'
          },
          {
            title: 'إرشاد 2 : حكم الجملة الاسمية',
            content: 'في الأصل، المبتدأ والخبر مرفوعان بالضمة الظاهرة في حالة الاسم المفرد السالم.'
          },
          {
            title: 'إرشاد 3 : عمل إنّ وأخواتها',
            content: '« إِنَّ » تنصب المبتدأ ويسمى اسمها (فتحة)، وترفع الخبر ويسمى خبرها (ضمة).'
          }
        ],
        solutionSteps: [
          {
            label: 'الخطوة 1 : تحديد المبتدأ والخبر',
            detail: '• <strong>المُبْتَدَأُ :</strong> « العِلْمُ » (اسمٌ مَعْرِفَةٌ مَرْفُوعٌ ابْتُدِئَ بِهِ الكَلاَمُ).<br>• <strong>الخَبَرُ :</strong> « نُورٌ » (اسمٌ نَكِرَةٌ يُتَمِّمُ مَعْنَى الجُمْلَةِ وَيُخْبِرُ عَنِ العِلْمِ).'
          },
          {
            label: 'الخطوة 2 : الحكم الإعرابي وعلامته',
            detail: 'الحُكْمُ الإِعْرَابِيُّ لِلْمُبْتَدَأِ وَالخَبَرِ هُوَ <strong>الرَّفْعُ</strong>، وَعَلاَمَةُ رَفْعِهِمَا هِيَ <strong>الضَّمَّةُ الظَّاهِرَةُ عَلَى آخِرِهِمَا</strong> (« العِلْمُ » ضَمَّةٌ وَاحِدَةٌ لِأَنَّهُ مُعَرَّفٌ بِـ أَلْ، وَ « نُورٌ » تَنْوِينُ الضَّمِّ).'
          },
          {
            label: 'الخطوة 3 : التحويل عند دخول « إِنَّ »',
            detail: 'تُصْبِحُ الجُمْلَةُ :<br><div class="arabic-font" dir="rtl" style="font-size:1.35rem; font-weight:bold; color:var(--primary, #00875a); margin:0.4rem 0;">« إِنَّ العِلْمَ نُورٌ »</div>• <strong>العِلْمَ :</strong> اسْمُ إِنَّ مَنْصُوبٌ بِالفَتْحَةِ الظَّاهِرَةِ.<br>• <strong>نُورٌ :</strong> خَبَرُ إِنَّ مَرْفُوعٌ بِالضَّمَّةِ الظَّاهِرَةِ.'
          }
        ],
        solutionSummary: 'الجملة الاسمية تتكون من مبتدأ وخبر مرفوعين بالضمة، وعند دخول « إنّ » تنصب المبتدأ اسماً لها ويبقى الخبر مرفوعاً.',
        pitfalls: [
          'الخلط بين الخبر والنعت : النعت يتبع المنعوت في التعريف، بينما الأصل في الخبر أن يكون نكرة.',
          'نسيان تغيير حركة المبتدأ من الضمة إلى الفتحة بعد دخول « إنّ ».'
        ],
        keyTakeaway: '« المُبْتَدَأُ وَالخَبَرُ مَرْفُوعَانِ، وَإِذَا دَخَلَتْ عَلَيْهِمَا « إِنَّ » نَصَبَتِ الأَوَّلَ وَرَفَعَتِ الثَّانِي ».',
        checklist: [
          'استخرجتُ « العلم » مبتدأ و « نور » خبراً في الجملة الأولى',
          'بينتُ أن علامة الإعراب هي الرفع بالضمة الظاهرة',
          'كتبتُ « إِنَّ العِلْمَ نُورٌ » بضبط صحيح للفتحة على العلم والضمة على نور'
        ]
      },
      {
        id: 'ar-2',
        title: 'تَصْرِيفُ الفِعْلِ المُعْتَلِّ النَّاقِصِ فِي المَاضِي وَالمُضَارِعِ وَالأَمْرِ',
        subject: 'Langue arabe',
        difficulty: 'Intermédiaire',
        category: 'اللغة العربية • الصرف والتحويل',
        estimatedTime: '15 دقيقة',
        points: 40,
        objective: 'معرفة التغيرات التي تطرأ على حرف العلة في الفعل المعتل الناقص، وتمييز أصل الألف (واو أو ياء)، وتصريفه مع الضمائر وبناء الأمر.',
        contextType: 'arabic',
        contextContent: 'الفِعْلاَنِ : « دَعَا » (مُضَارِعُهُ : يَدْعُو) وَ « قَضَى » (مُضَارِعُهُ : يَقْضِي).',
        contextTranslation: 'Les deux verbes défectueux : « Da\'â » (invoquer) et « Qadâ » (juger).',
        questions: [
          'لِمَاذَا كُتِبَتِ الأَلِفُ فِي آخِرِ الفِعْلِ « دَعَا » مَمْدُودَةً (ا)، بَيْنَمَا كُتِبَتْ فِي « قَضَى » مَقْصُورَةً (ى) ؟ بَيِّنِ القَاعِدَةَ الصَّرْفِيَّةَ.',
          'صَرِّفِ الفِعْلَ « دَعَا » فِي زَمَنِ المَاضِي مَعَ الضَّمِيرَيْنِ : « أَنَا » وَ « هُمْ ». مَاذَا يَحْدُثُ لِحَرْفِ العِلَّةِ مَعَ « هُمْ » ؟',
          'صُغْ فِعْلَ الأَمْرِ مِنَ الفِعْلِ « قَضَى » مَعَ ضَمِيرِ المُخَاطَبِ المُفْرَدِ المُذَكَّرِ « أَنْتَ » مَعَ الضَّبْطِ التَّامِّ بِالشَّكْلِ وَتَعْلِيلِ البِنَاءِ.'
        ],
        hints: [
          {
            title: 'إرشاد 1 : أصل الألف اللينة',
            content: 'لمعرفة أصل الألف في الفعل الثلاثي، نرجعه إلى صيغة المضارع أو نسنده لتاء الفاعل (دعا -> يدعو، قضى -> يقضي).'
          },
          {
            title: 'إرشاد 2 : الإسناد لواو الجماعة',
            content: 'عند إسناد الفعل الناقص إلى واو الجماعة في الماضي، يحذف حرف العلة دائماً مع بقاء الفتحة قبل الواو.'
          },
          {
            title: 'إرشاد 3 : بناء فعل الأمر',
            content: 'يبنى فعل الأمر من المعتل الآخر على حذف حرف العلة، وتوضع حركة دالة على الحرف المحذوف.'
          }
        ],
        solutionSteps: [
          {
            label: 'الخطوة 1 : تعليل كتابة الألف',
            detail: '• فِي « دَعَا » : كُتِبَتِ الأَلِفُ مَمْدُودَةً (ا) لِأَنَّ أَصْلَهَا <strong>وَاوٌ</strong> فِي المُضَارِعِ : <strong>يَدْعُو</strong>.<br>• فِي « قَضَى » : كُتِبَتِ الأَلِفُ مَقْصُورَةً (ى) لِأَنَّ أَصْلَهَا <strong>يَاءٌ</strong> فِي المُضَارِعِ : <strong>يَقْضِي</strong>.'
          },
          {
            label: 'الخطوة 2 : التصريف في الماضي',
            detail: '• مَعَ « أَنَا » : <strong>دَعَوْتُ</strong> (يُرَدُّ حَرْفُ العِلَّةِ إِلَى أَصْلِهِ الوَاوِ).<br>• مَعَ « هُمْ » : <strong>دَعَوْا</strong> (يُحْذَفُ حَرْفُ العِلَّةِ لاِلْتِقَاءِ السَّاكِنَيْنِ مَعَ وَاوِ الجَمَاعَةِ وَتَبْقَى الفَتْحَةُ قَبْلَ الوَاوِ دَلِيلاً عَلَيْهِ).'
          },
          {
            label: 'الخطوة 3 : صياغة فعل الأمر وإعرابه',
            detail: 'فِعْلُ الأَمْرِ مِن « قَضَى » مَعَ « أَنْتَ » هُوَ :<br><div class="arabic-font" dir="rtl" style="font-size:1.4rem; font-weight:bold; color:var(--primary, #00875a); margin:0.4rem 0;">« اِقْضِ »</div>• <strong>الإِعْرَابُ :</strong> فِعْلُ أَمْرٍ مَبْنِيٌّ عَلَى <strong>حَذْفِ حَرْفِ العِلَّةِ (اليَاءِ)</strong>، وَالكِسْرَةُ دَلِيلٌ عَلَيْهَا.'
          }
        ],
        solutionSummary: 'الفعل الناقص تُرَدُّ ألفه إلى أصلها عند الإسناد للتاء المتحركة، وتُحذف مع واو الجماعة، ويُبنى أمره على حذف حرف العلة.',
        pitfalls: [
          'كتابة أمر المفرد المذكر بالياء هكذا « اقضي » وهو خطأ شائع، والصواب « اِقْضِ » بحذف الياء.',
          'قول « دعيت » بالياء في الماضي، والصواب « دَعَوْتُ » بالواو لأن أصلها يدعو.'
        ],
        keyTakeaway: '« الفِعْلُ النَّاقِصُ تُرَدُّ أَلِفُهُ إِلَى أَصْلِهَا (وَاوٌ أَوْ يَاءٌ)، وَيُبْنَى أَمْرُهُ عَلَى حَذْفِ حَرْفِ العِلَّةِ ».',
        checklist: [
          'بينتُ أن الألف ممدودة في دعا لأن أصلها واو ومقصورة في قضى لأن أصلها ياء',
          'صرّفتُ « دَعَوْتُ » و « دَعَوْا » مع توضيح حذف حرف العلة مع واو الجماعة',
          'صغتُ أمر قضى على صورة « اِقْضِ » بحذف الياء مع وضع الكسرة'
        ]
      },
      {
        id: 'ar-3',
        title: 'الأَسْمَاءُ الخَمْسَةُ وَعَلاَمَاتُ إِعْرَابِهَا الفَرْعِيَّةُ',
        subject: 'Langue arabe',
        difficulty: 'Intermédiaire',
        category: 'اللغة العربية • التراكيب والإعراب',
        estimatedTime: '15 دقيقة',
        points: 35,
        objective: 'التعرف على الأسماء الخمسة (أب، أخ، حم، فو، ذو)، وإعرابها بالحروف (الواو رفعاً، الألف نصباً، الياء جراً)، واستيعاب شروط إعرابها الفرعي.',
        contextType: 'arabic',
        contextContent: '« كَانَ أَبُوكَ رَجُلاً ذَا مَكَانَةٍ رَفِيعَةٍ، يُكْرِمُ حَمَاكَ وَيَعْطِفُ عَلَى أَخِيكَ الصَّغِيرِ. »',
        contextTranslation: '« Ton père était un homme de haut rang, il honorait ton beau-père et prenait soin de ton jeune frère. »',
        questions: [
          'اسْتَخْرِجْ مِنَ النَّصِّ كُلَّ اسْمٍ مِنَ الأَسْمَاءِ الخَمْسَةِ، وَحَدِّدْ مَوْقِعَهُ الإِعْرَابِيَّ فِي الجُمْلَةِ.',
          'بَيِّنْ عَلاَمَةَ إِعْرَابِ كُلٍّ مِنْ « أَبُوكَ » وَ « ذَا » وَ « أَخِيكَ »، وَلِمَاذَا أُعْرِبَتْ بِالحُرُوفِ لاَ بِالحَرَكَاتِ ؟',
          'مَا هِيَ الشُّرُوطُ الأَسَاسِيَّةُ الَّتِي يَجِبُ تَوَفُّرُهَا فِي هَذِهِ الأَسْمَاءِ لِكَيْ تُعْرَبَ بِالحُرُوفِ ؟ وَكَيْفَ تُعْرَبُ كَلِمَةُ « أَبِي » عِنْدَ إِضَافَتِهَا لِيَاءِ المُتَكَلِّمِ ؟'
        ],
        hints: [
          {
            title: 'إرشاد 1 : علامات الأسماء الخمسة',
            content: 'تُرفع الأسماء الخمسة بالواو (أبوك)، وتُنصب بالألف (أباك)، وتُجر بالياء (أبيك).'
          },
          {
            title: 'إرشاد 2 : الإعراب حسب الموقع',
            content: '« كان » ترفع الاسم (أبوك) وتنصب الخبر، و « ذا » جاء نعتاً لكلمة « رجلاً » المنصوبة، و « أخيك » سُبق بحرف جر.'
          },
          {
            title: 'إرشاد 3 : شرط الإضافة',
            content: 'يشترط أن تكون مفردة ومضافة إلى غير ياء المتكلم. فإن أضيفت لياء المتكلم أعربت بحركات مقدرة.'
          }
        ],
        solutionSteps: [
          {
            label: 'الخطوة 1 : استخراج الأسماء الخمسة ومواقعها',
            detail: '1. <strong>أَبُوكَ :</strong> اسم « كَانَ » مَرْفُوعٌ.<br>2. <strong>ذَا :</strong> نَعْتٌ لِكَلِمَةِ « رَجُلاً » مَنْصُوبٌ.<br>3. <strong>حَمَاكَ :</strong> مَفْعُولٌ بِهِ لِلْفِعْلِ « يُكْرِمُ » مَنْصُوبٌ.<br>4. <strong>أَخِيكَ :</strong> اسْمٌ مَجْرُورٌ بِحَرْفِ الجَرِّ « عَلَى ».'
          },
          {
            label: 'الخطوة 2 : بيان علامات الإعراب الفرعية',
            detail: '• <strong>أَبُوكَ :</strong> مَرْفُوعٌ وَعَلاَمَةُ رَفْعِهِ <strong>الوَاوُ</strong> لِأَنَّهُ مِنَ الأَسْمَاءِ الخَمْسَةِ.<br>• <strong>ذَا :</strong> مَنْصُوبٌ وَعَلاَمَةُ نَصْبِهِ <strong>الأَلِفُ</strong> لِأَنَّهُ مِنَ الأَسْمَاءِ الخَمْسَةِ.<br>• <strong>أَخِيكَ :</strong> مَجْرُورٌ وَعَلاَمَةُ جَرِّهِ <strong>اليَاءُ</strong> لِأَنَّهُ مِنَ الأَسْمَاءِ الخَمْسَةِ.<br>أُعْرِبَتْ بِالحُرُوفِ (نِيَابَةً عَنِ الحَرَكَاتِ) لاِسْتِيفَائِهَا الشُّرُوطَ الصَّرْفِيَّةَ وَالإِعْرَابِيَّةَ.'
          },
          {
            label: 'الخطوة 3 : شروط الإعراب بالحروف وإعراب « أبي »',
            detail: '<strong>شُرُوطُ الإِعْرَابِ بِالحُرُوفِ :</strong><br>1. أَنْ تَكُونَ <strong>مُفْرَدَةً</strong> (لَيْسَتْ مُثَنَّاةً وَلاَ مَجْمُوعَةً).<br>2. أَنْ تَكُونَ <strong>مُضَافَةً</strong> (إِلَى اسْمٍ ظَاهِرٍ أَوْ ضَمِيرٍ).<br>3. أَنْ تَكُونَ إِضَافَتُهَا <strong>إِلَى غَيْرِ يَاءِ المُتَكَلِّمِ</strong>.<br>• أَمَّا كَلِمَةُ « أَبِي » عِنْدَ إِضَافَتِهَا إِلَى يَاءِ المُتَكَلِّمِ، فَتُعْرَبُ <strong>بِحَرَكَاتٍ مُقَدَّرَةٍ</strong> عَلَى مَا قَبْلَ اليَاءِ مَنَعَ مِنْ ظُهُورِهَا اشْتِغَالُ المَحَلِّ بِالحَرَكَةِ المُنَاسِبَةِ.'
          }
        ],
        solutionSummary: 'تُعرب الأسماء الخمسة بالحروف (الواو رفعاً، والألف نصباً، والياء جراً) بشرط أن تكون مفردة ومضافة إلى غير ياء المتكلم.',
        pitfalls: [
          'الخلط بين « ذُو » (اسم من الأسماء الخمسة بمعنى صاحب) و « الَّذِي » (اسم موصول).',
          'إعراب « أبي » بالحروف : عند اتصالها بياء المتكلم تعرب بحركات مقدرة لا بالحروف.'
        ],
        keyTakeaway: '« تُرْفَعُ الأَسْمَاءُ الخَمْسَةُ بِالوَاوِ، وَتُنْصَبُ بِالأَلِفِ، وَتُجَرُّ بِاليَاءِ، بِشَرْطِ أَنْ تَكُونَ مُفْرَدَةً مُضَافَةً لِغَيْرِ يَاءِ المُتَكَلِّمِ ».',
        checklist: [
          'استخرجتُ الأسماء الخمسة من السند (أبوك، ذا، حماك، أخيك)',
          'حددتُ الواو للرفع والألف للنصب والياء للجر',
          'ذكرتُ شروط الإعراب بالحروف وأوضحت إعراب « أبي » بالحركات المقدرة'
        ]
      },
      {
        id: 'ar-4',
        title: 'عِلْمُ البَيَانِ : التَّشْبِيهُ البَلِيغُ وَالاِسْتِعَارَةُ التَّصْرِيحِيَّةُ وَالمَكْنِيَّةُ',
        subject: 'Langue arabe',
        difficulty: 'Avancé',
        category: 'اللغة العربية • البلاغة وفهم المقروء',
        estimatedTime: '18 دقيقة',
        points: 45,
        objective: 'التمييز بين الحقيقة والمجاز، وتحليل أركان التشبيه البليغ، والتفريق الدقيق بين الاستعارة التصريحية والاستعارة المكنية.',
        contextType: 'arabic',
        contextContent: '« قَالَ الشَّاعِرُ يَصِفُ عَالِماً جَلِيلاً : فَاضَ بَحْرُ جُودِهِ عَلَى السَّائِلِينَ، وَأَشْرَقَتْ شَمْسُ حِكْمَتِهِ فَبَدَّدَتْ ظَلاَمَ الجَهْلِ. »',
        contextTranslation: '« Le poète dit en louant un éminent savant : La mer de sa générosité a inondé les demandeurs, et le soleil de sa sagesse s\'est levé, dissipant les ténèbres de l\'ignorance. »',
        questions: [
          'فِي عِبَارَةِ « بَحْرُ جُودِهِ »، بَيِّنِ الصُّورَةَ البَلاَغِيَّةَ الوَارِدَةَ، وَحَدِّدْ أَرْكَانَهَا وَنَوْعَ التَّشْبِيهِ مَعَ التَّعْلِيلِ.',
          'فِي عِبَارَةِ « أَشْرَقَتْ شَمْسُ حِكْمَتِهِ »، اسْتَخْرِجِ الاِسْتِعَارَةَ المَوْجُودَةَ، وَبَيِّنْ قَرِينَتَهَا المَانِعَةَ مِنْ إِرَادَةِ المَعْنَى الحَقِيقِيِّ.',
          'اشْرَحِ الفَرْقَ الجَوْهَرِيَّ فِي البَلاَغَةِ العَرَبِيَّةِ بَيْنَ « الاِسْتِعَارَةِ التَّصْرِيحِيَّةِ » وَ « الاِسْتِعَارَةِ المَكْنِيَّةِ »، مَعَ إِعْطَاءِ مِثَالٍ تَوْضِيحِيٍّ لِكُلٍّ مِنْهُمَا.'
        ],
        hints: [
          {
            title: 'إرشاد 1 : التشبيه البليغ',
            content: 'التشبيه البليغ هو ما حذفت منه أداة التشبيه ووجه الشبه، وبقي الطرفان الأساسيان (المشبه والمشبه به)، وغالباً ما يأتي على صورة إضافة المشبه به إلى المشبه (بحر جوده).'
          },
          {
            title: 'إرشاد 2 : قرينة الاستعارة',
            content: 'الاستعارة تشبيه حذف أحد طرفيه مع وجود قرينة مانعة من إرادة المعنى الحقيقي (مثل إشراق الحكمة).'
          },
          {
            title: 'إرشاد 3 : التصريحية مقابل المكنية',
            content: 'إذا صُرِّح بلفظ المشبه به وحذف المشبه فهي تصريحية، وإذا حذف المشبه به ورُمز له بشيء من لوازمه فهي مكنية.'
          }
        ],
        solutionSteps: [
          {
            label: 'الخطوة 1 : تحليل الصورة في « بَحْرُ جُودِهِ »',
            detail: 'الصُّورَةُ هِيَ <strong>تَشْبِيهٌ بَلِيغٌ</strong> جَاءَ عَلَى صُورَةِ إِضَافَةِ المُشَبَّهِ بِهِ إِلَى المُشَبَّهِ :<br>• <strong>المُشَبَّهُ :</strong> الجُودُ (الكَرَمُ).<br>• <strong>المُشَبَّهُ بِهِ :</strong> البَحْرُ.<br>حُذِفَتْ أَدَاةُ التَّشْبِيهِ (مِثْل، الكَاف) وَوَجْهُ الشَّبَهِ (السَّعَةُ وَالكَثْرَةُ) لِتَأْكِيدِ قُوَّةِ المُطَابَقَةِ وَالمُبَالَغَةِ فِي الكَرَمِ.'
          },
          {
            label: 'الخطوة 2 : تحليل الاستعارة وقرينتها',
            detail: 'الصُّورَةُ فِي « شَمْسُ حِكْمَتِهِ » : شُبِّهَتِ الحِكْمَةُ بِالشَّمْسِ فِي الهِدَايَةِ وَالوُضُوحِ.<br>• وَعِنْدَ قَوْلِهِ « أَشْرَقَتْ حِكْمَتُهُ » : <strong>اسْتِعَارَةٌ مَكْنِيَّةٌ</strong> حَيْثُ حُذِفَ المُشَبَّهُ بِهِ (الشَّمْسُ) وَرُمِزَ لَهُ بِلاَزِمٍ مِنْ لَوَازِمِهِ هُوَ الفِعْلُ « أَشْرَقَتْ »، وَهِيَ <strong>القَرِينَةُ المَانِعَةُ</strong> مِنْ إِرَادَةِ المَعْنَى الحَقِيقِيِّ.'
          },
          {
            label: 'الخطوة 3 : الفرق بين الاستعارة التصريحية والمكنية',
            detail: '• <strong>الاِسْتِعَارَةُ التَّصْرِيحِيَّةُ :</strong> مَا صُرِّحَ فِيهَا بِلَفْظِ المُشَبَّهِ بِهِ وَحُذِفَ المُشَبَّهُ (مِثَال : « رَأَيْتُ أَسَداً يُلْقِي خُطْبَةً » -> شُبِّهَ الخَطِيبُ الشُّجَاعُ بِالأَسَدِ وَصُرِّحَ بِلَفْظِ الأَسَدِ).<br>• <strong>الاِسْتِعَارَةُ المَكْنِيَّةُ :</strong> مَا حُذِفَ فِيهَا المُشَبَّهُ بِهِ وَرُمِزَ لَهُ بِشَيْءٍ مِنْ صِفَاتِهِ وَلَوَازِمِهِ مَعَ ذِكْرِ المُشَبَّهِ (مِثَال : « نَطَقَ التَّارِيخُ بِأَمْجَادِ أُمَّتِنَا » -> شُبِّهَ التَّارِيخُ بِإِنْسَانٍ يَنْطِقُ، فَحُذِفَ الإِنْسَانُ وَبَقِيَتْ صِفَةُ النُّطْقِ قَرِينَةً).'
          }
        ],
        solutionSummary: 'التشبيه البليغ يجمع المشبه والمشبه به دون أداة، والاستعارة تشبيه حذف أحد طرفيه : تصريحية إن صُرّح بالمشبه به، ومكنية إن حُذف ورُمز له بلازمة.',
        pitfalls: [
          'الخلط بين المشبه والمشبه به عند استخراج التشبيه الإضافي (مثل بحر جوده).',
          'نسيان ذكر القرينة المانعة من إرادة المعنى الحقيقي في الاستعارة.'
        ],
        keyTakeaway: '« الاِسْتِعَارَةُ تَشْبِيهٌ بَلِيغٌ حُذِفَ أَحَدُ طَرَفَيْهِ : تَصْرِيحِيَّةٌ إِنْ صُرِّحَ بِالمُشَبَّهِ بِهِ، وَمَكْنِيَّةٌ إِنْ حُذِفَ وَرُمِزَ لَهُ بِشَيْءٍ مِنْ لَوَازِمِهِ ».',
        checklist: [
          'حددتُ أركان التشبيه البليغ في « بحر جوده » (المشبه والمشبه به)',
          'بينتُ القرينة المانعة في الاستعارة (« أشرقت »)',
          'شرحتُ الفرق بين التصريحية والمكنية بمثال واضح لكل منهما'
        ]
      }
    ],
    'informatique': [
      {
        id: 'info-1',
        title: 'Initiation à l\'algorithmique visuelle avec Scratch — Animer un lutin',
        subject: 'Informatique',
        difficulty: 'Débutant',
        category: 'Programmation visuelle & Scratch',
        estimatedTime: '10 min',
        points: 25,
        objective: 'Comprendre l\'enchaînement des instructions, l\'utilisation des boucles « répéter » et le déplacement sur les axes X et Y.',
        contextType: 'text',
        contextContent: 'On souhaite programmer un lutin chat dans Scratch pour qu\'il avance de 10 pas, dise « Bonjour ! » pendant 2 secondes, puis répète ce mouvement 5 fois à partir de la position initiale (x: 0, y: 0).',
        questions: [
          'Quel bloc de contrôle doit-on utiliser pour déclencher le début du programme lorsque l\'utilisateur clique sur le drapeau vert ?',
          'Quelle boucle permet de répéter exactement 5 fois le bloc d\'instructions sans dupliquer le code ?',
          'À quelle coordonnée X finale le lutin se trouvera-t-il après avoir répété 5 fois « avancer de 10 pas » en partant de x = 0 ?'
        ],
        hints: [
          { title: 'Indice 1 : Événements', content: 'Le bloc déclencheur jaune se trouve dans la catégorie « Événements ».' },
          { title: 'Indice 2 : Calcul de position', content: 'Chaque pas ajoute 10 à la position X. Fais une multiplication simple : 5 × 10.' }
        ],
        solutionSteps: [
          { label: 'Étape 1 : Bloc de démarrage', detail: 'On utilise le bloc chapeau jaune : « Quand le drapeau vert est cliqué ».' },
          { label: 'Étape 2 : Boucle de répétition', detail: 'On insère le bloc de contrôle orange « répéter 5 fois » autour des instructions de mouvement et de parole.' },
          { label: 'Étape 3 : Coordonnée finale', detail: 'Position initiale : 0. Chaque répétition avance de 10. Position finale = 0 + (5 × 10) = 50. Le lutin sera à x = 50.' }
        ],
        solutionSummary: 'Les blocs d\'événements et les boucles de répétition permettent d\'écrire des programmes propres et concis dans Scratch.',
        pitfalls: [
          'Confondre la boucle « répéter 5 fois » avec la boucle « répéter indéfiniment ».',
          'Oublier d\'initialiser la position de départ (x: 0, y: 0) au début du programme.'
        ],
        keyTakeaway: 'En algorithmique, une boucle « répéter N fois » évite de recopier les mêmes instructions plusieurs fois.',
        checklist: [
          'J\'ai identifié le bloc drapeau vert',
          'J\'ai utilisé la boucle « répéter 5 fois »',
          'J\'ai calculé la coordonnée finale x = 50'
        ]
      },
      {
        id: 'info-2',
        title: 'Traitement de texte et tableur — Structurer un exposé scolaire',
        subject: 'Informatique',
        difficulty: 'Intermédiaire',
        category: 'Bureautique & Tableur',
        estimatedTime: '15 min',
        points: 35,
        objective: 'Maîtriser la mise en page d\'un document texte et créer un tableau de notes avec formule de moyenne dans un tableur.',
        contextType: 'text',
        contextContent: 'Dans le cadre d\'un exposé, un élève doit mettre en forme un document avec un titre centré en gras (taille 16), un paragraphe justifié, et insérer un tableau contenant les notes de 4 contrôles (14, 16, 12, 18) pour calculer la moyenne.',
        questions: [
          'Quelle option de paragraphe permet d\'aligner le texte de manière nette sur les bords gauche et droit en même temps ?',
          'Quelle formule universelle doit-on saisir dans la cellule d\'un tableur pour calculer automatiquement la moyenne des cellules B1 à B4 ?',
          'Quel raccourci clavier universel permet d\'enregistrer son travail pour ne pas perdre ses modifications ?'
        ],
        hints: [
          { title: 'Indice 1 : Alignement', content: 'Pense à l\'alignement qui « justifie » les lignes sur les deux marges.' },
          { title: 'Indice 2 : Formule tableur', content: 'Toute formule commence par le signe « = » suivi du nom de la fonction en français ou anglais (MOYENNE).' }
        ],
        solutionSteps: [
          { label: 'Étape 1 : Alignement du texte', detail: 'On sélectionne le texte et on choisit l\'alignement « Justifié » (Ctrl + J).' },
          { label: 'Étape 2 : Formule de moyenne', detail: 'Dans la cellule du tableur, on écrit : <code>=MOYENNE(B1:B4)</code>. Le tableur calcule (14+16+12+18)/4 = 15.' },
          { label: 'Étape 3 : Sauvegarde', detail: 'Le raccourci clavier est <code>Ctrl + S</code>.' }
        ],
        solutionSummary: 'La mise en page soignée et l\'utilisation des formules de tableur permettent de créer des présentations scolaires impeccables.',
        pitfalls: [
          'Oublier le signe égal « = » au début d\'une formule dans un tableur.',
          'Confondre « centrer » et « justifier » pour le corps d\'un texte.'
        ],
        keyTakeaway: 'Un document bien structuré utilise les styles de titre, le texte justifié et les formules de calcul automatiques.',
        checklist: [
          'J\'ai sélectionné l\'alignement justifié',
          'J\'ai écrit la formule =MOYENNE(B1:B4)',
          'J\'ai retenu le raccourci de sauvegarde Ctrl + S'
        ]
      },
      {
        id: 'info-3',
        title: 'Sécurité sur Internet, protection des données et mots de passe',
        subject: 'Informatique',
        difficulty: 'Avancé',
        category: 'Citoyenneté numérique & Sécurité',
        estimatedTime: '18 min',
        points: 40,
        objective: 'Identifier les risques liés aux tentatives d\'hameçonnage (phishing), protéger ses données personnelles et créer des mots de passe robustes.',
        contextType: 'text',
        contextContent: 'Yassine reçoit un e-mail avec un logo ressemblant à son jeu vidéo préféré, indiquant : « Félicitations ! Tu as gagné 1000 pièces d\'or ! Clique sur ce lien et saisis ton mot de passe et ton adresse postale avant ce soir pour les recevoir. »',
        questions: [
          'Quels sont les trois indices qui montrent que cet e-mail est une tentative d\'arnaque ou d\'hameçonnage (phishing) ?',
          'Pourquoi ne faut-il JAMAIS donner son mot de passe ou ses informations personnelles sur un lien reçu par message ?',
          'Donne deux règles indispensables pour composer un mot de passe très difficile à pirater.'
        ],
        hints: [
          { title: 'Indice 1 : Indices suspects', content: 'Regarde le cadeau gratuit, l\'urgence temporelle (« avant ce soir ») et la demande de mot de passe.' },
          { title: 'Indice 2 : Mot de passe fort', content: 'Pense à la longueur (au moins 10 à 12 caractères) et à la variété des types de caractères.' }
        ],
        solutionSteps: [
          { label: 'Étape 1 : Détection de l\'arnaque', detail: 'Indices : promesse d\'un cadeau gratuit non sollicité, urgence artificielle pour stresser l\'utilisateur, demande d\'identifiants confidentiels.' },
          { label: 'Étape 2 : Protection de l\'identité', detail: 'Un service légitime ne demande JAMAIS de saisir son mot de passe par message. Donner son mot de passe permet au pirate de voler le compte.' },
          { label: 'Étape 3 : Création d\'un mot de passe robuste', detail: '1. Longueur d\'au moins 10-12 caractères. 2. Mélange de majuscules, minuscules, chiffres et symboles (ex: « MonChat#2026! »).' }
        ],
        solutionSummary: 'La prudence sur Internet et l\'utilisation de mots de passe robustes sont les piliers indispensables de la sécurité numérique.',
        pitfalls: [
          'Cliquer sur un lien sans vérifier l\'adresse de l\'expéditeur.',
          'Utiliser le même mot de passe simple (ex: prénom + date de naissance) sur tous ses comptes.'
        ],
        keyTakeaway: 'Sur Internet : ne jamais communiquer son mot de passe, se méfier des cadeaux trop beaux pour être vrais et prévenir un adulte responsable en cas de doute.',
        checklist: [
          'J\'ai identifié les indices d\'hameçonnage',
          'J\'ai expliqué les risques de la divulgation du mot de passe',
          'J\'ai formulé les règles d\'un mot de passe sécurisé'
        ]
      }
    ],

        'mathematiques': [
      {
        id: 'math-1',
        title: 'Calcul et simplification de fractions — Le partage équitable',
        subject: 'Mathématiques',
        difficulty: 'Débutant',
        category: 'Nombres & Calculs • Fractions',
        estimatedTime: '10 min',
        points: 25,
        objective: 'Comprendre la notion de fraction, additionner deux fractions de même dénominateur et simplifier le résultat.',
        contextType: 'text',
        contextContent: 'Lors d\'un goûter d\'anniversaire, un grand gâteau est découpé en 12 parts égales. Yasmine mange 3 parts et son frère Adam mange 5 parts.',
        questions: [
          'Écris sous forme de fraction la part mangée par Yasmine et la part mangée par Adam.',
          'Quelle fraction totale du gâteau ont-ils mangée à eux deux ? Donne le résultat sous forme d\'une fraction simplifiée au maximum.',
          'Quelle fraction du gâteau reste-t-il pour leurs parents ?'
        ],
        hints: [
          { title: 'Indice 1 : Fraction de base', content: 'Le nombre total de parts (12) est au dénominateur (en bas).' },
          { title: 'Indice 2 : Simplification', content: 'Pour simplifier 8/12, divise le numérateur et le dénominateur par leur plus grand diviseur commun (4).' }
        ],
        solutionSteps: [
          { label: 'Étape 1 : Écriture des fractions', detail: 'Yasmine : 3/12 du gâteau. Adam : 5/12 du gâteau.' },
          { label: 'Étape 2 : Somme et simplification', detail: 'Total mangé = 3/12 + 5/12 = 8/12. En divisant par 4 : 8/12 = 2/3 du gâteau.' },
          { label: 'Étape 3 : Reste', detail: 'Gâteau entier = 12/12 (ou 1). Reste = 12/12 - 8/12 = 4/12 = 1/3 du gâteau.' }
        ],
        solutionSummary: 'Ils ont mangé 2/3 du gâteau à eux deux, et il reste 1/3 pour les parents.',
        pitfalls: [
          'Additionner les dénominateurs (ex: 3/12 + 5/12 n\'est PAS égal à 8/24 ! On garde le même dénominateur 12).',
          'Oublier de simplifier la fraction finale.'
        ],
        keyTakeaway: 'Pour additionner deux fractions de même dénominateur, on additionne les numérateurs et on conserve le dénominateur commun.',
        checklist: [
          'J\'ai écrit 3/12 et 5/12',
          'J\'ai additionné pour trouver 8/12 puis simplifié en 2/3',
          'J\'ai calculé le reste : 1/3'
        ]
      },
      {
        id: 'math-2',
        title: 'Le Théorème de Pythagore dans le triangle rectangle',
        subject: 'Mathématiques',
        difficulty: 'Intermédiaire',
        category: 'Géométrie • Triangle rectangle',
        estimatedTime: '15 min',
        points: 35,
        objective: 'Calculer la longueur de l\'hypoténuse ou d\'un côté adjacent grâce à l\'égalité de Pythagore.',
        contextType: 'text',
        contextContent: 'Soit un triangle ABC rectangle en A tel que AB = 6 cm et AC = 8 cm. On souhaite déterminer la longueur du côté [BC].',
        questions: [
          'Quel est le nom du côté [BC] opposé à l\'angle droit dans ce triangle ?',
          'Énonce la relation du théorème de Pythagore reliant les longueurs AB, AC et BC.',
          'Calcule la valeur exacte de BC en rédigeant chaque étape de calcul.'
        ],
        hints: [
          { title: 'Indice 1 : Vocabulaire', content: 'Le côté opposé à l\'angle droit est le plus long côté du triangle rectangle : l\'hypoténuse.' },
          { title: 'Indice 2 : Formule', content: 'L\'égalité s\'écrit : BC² = AB² + AC².' }
        ],
        solutionSteps: [
          { label: 'Étape 1 : Identification de l\'hypoténuse', detail: 'Le triangle ABC étant rectangle en A, le côté [BC] opposé à l\'angle droit est l\'hypoténuse.' },
          { label: 'Étape 2 : Énoncé du théorème', detail: 'D\'après le théorème de Pythagore : BC² = AB² + AC².' },
          { label: 'Étape 3 : Calcul numérique', detail: 'BC² = 6² + 8² = 36 + 64 = 100. Donc BC = √100 = 10 cm.' }
        ],
        solutionSummary: 'La longueur de l\'hypoténuse BC est exactement égale à 10 cm.',
        pitfalls: [
          'Oublier d\'élever les longueurs au carré (écrire faussement BC = AB + AC).',
          'Oublier de prendre la racine carrée à la fin du calcul.'
        ],
        keyTakeaway: 'Dans un triangle rectangle, le carré de l\'hypoténuse est égal à la somme des carrés des deux autres côtés : BC² = AB² + AC².',
        checklist: [
          'J\'ai mentionné que le triangle est rectangle en A',
          'J\'ai cité le théorème de Pythagore',
          'J\'ai calculé BC = 10 cm avec son unité'
        ]
      },
      {
        id: 'math-3',
        title: 'Équations du premier degré et problème concret de géométrie',
        subject: 'Mathématiques',
        difficulty: 'Avancé',
        category: 'Algèbre & Équations',
        estimatedTime: '20 min',
        points: 40,
        objective: 'Mettre en équation un problème concret, résoudre une équation du premier degré et vérifier la solution.',
        contextType: 'text',
        contextContent: 'Un jardin rectangulaire a une longueur qui mesure 5 mètres de plus que sa largeur. Son périmètre total est de 50 mètres. On note « x » la largeur du jardin en mètres.',
        questions: [
          'Exprime la longueur du jardin en fonction de x.',
          'Écris l\'expression du périmètre en fonction de x et déduis-en une équation du premier degré.',
          'Résous cette équation pour trouver la largeur x, puis calcule la longueur et l\'aire du jardin.'
        ],
        hints: [
          { title: 'Indice 1 : Longueur en fonction de x', content: 'Puisque la longueur a 5 m de plus que la largeur x, elle vaut (x + 5).' },
          { title: 'Indice 2 : Formule du périmètre', content: 'Périmètre d\'un rectangle = 2 × (Longueur + Largeur) = 50.' }
        ],
        solutionSteps: [
          { label: 'Étape 1 : Expression des dimensions', detail: 'Largeur = x. Longueur = x + 5.' },
          { label: 'Étape 2 : Mise en équation', detail: 'Périmètre = 2 × [x + (x + 5)] = 2 × (2x + 5) = 4x + 10. D\'où l\'équation : 4x + 10 = 50.' },
          { label: 'Étape 3 : Résolution', detail: '4x = 50 - 10 = 40 => x = 40 / 4 = 10 m. Largeur = 10 m, Longueur = 15 m. Aire = 10 × 15 = 150 m².' }
        ],
        solutionSummary: 'Le jardin a une largeur de 10 m, une longueur de 15 m, et son aire est de 150 m².',
        pitfalls: [
          'Confondre le demi-périmètre (L + l = 25) avec le périmètre entier (50).',
          'Oublier de calculer l\'aire à la fin en multipliant Longueur × Largeur.'
        ],
        keyTakeaway: 'Pour résoudre un problème avec une équation : 1. Choisir l\'inconnue, 2. Mettre en équation, 3. Résoudre, 4. Conclure avec les unités.',
        checklist: [
          'J\'ai exprimé la longueur : x + 5',
          'J\'ai résolu 4x + 10 = 50 et trouvé x = 10',
          'J\'ai calculé l\'aire : 150 m²'
        ]
      }
    ],

    'biologie': [
      {
        id: 'bio-1',
        title: 'Comparaison Cellule Animale vs Cellule Végétale',
        subject: 'Sciences de la vie et de la Terre (SVT)',
        difficulty: 'Débutant',
        category: 'Organisation du vivant',
        estimatedTime: '10 min',
        points: 25,
        objective: 'Identifier les structures cellulaires spécifiques à la cellule végétale et expliquer leur rôle physiologique.',
        contextType: 'text',
        contextContent: 'Observation microscopique d\'un épiderme d\'oignon et d\'un frottis de cellules buccales humaines.',
        contextTranslation: 'Comparaison des ultrastructures observables au microscope électronique à transmission.',
        questions: [
          'Énumère 3 organites ou structures caractéristiques exclusives de la cellule végétale.',
          'Quel est le rôle de la paroi pectocellulosique dans le maintien de la plante ?',
          'Dans quel organite s\'effectue la photosynthèse et quel pigment y est indispensable ?'
        ],
        hints: [
          {
            title: 'Indice 1 : Rigidité et photosynthèse',
            content: 'Pense à ce qui donne sa rigidité au végétal sans squelette osseux, et à la couleur verte.'
          },
          {
            title: 'Indice 2 : Réserve d\'eau',
            content: 'Les cellules végétales adultes possèdent une poche centrale remplie d\'eau qui occupe jusqu\'à 90% du volume.'
          }
        ],
        solutionSteps: [
          {
            label: 'Étape 1 : Les 3 structures végétales spécifiques',
            detail: '1. <strong>La paroi pectocellulosique :</strong> enveloppe rigide externe.<br>2. <strong>Les chloroplastes :</strong> organites contenant la chlorophylle.<br>3. <strong>La grande vacuole centrale :</strong> réservoir d\'eau maintenant la pression de turgescence.'
          },
          {
            label: 'Étape 2 : Rôle de la paroi',
            detail: 'Elle protège la cellule contre l\'éclatement en milieu hypotonique et assure le port dressé de la plante par soutien mécanique.'
          },
          {
            label: 'Étape 3 : Photosynthèse',
            detail: 'Elle a lieu dans les <strong>chloroplastes</strong> grâce à la <strong>chlorophylle</strong> qui capte l\'énergie photonique.'
          }
        ],
        solutionSummary: 'La cellule végétale se distingue par la paroi, les chloroplastes et la grande vacuole centrale.',
        pitfalls: [
          'Croire que les cellules végétales n\'ont pas de mitochondries (elles en ont pour respirer la nuit !).'
        ],
        keyTakeaway: 'Paroi + Chloroplastes + Grande Vacuole = triptyque distinctif de la cellule végétale.',
        checklist: [
          'J\'ai listé la paroi, les chloroplastes et la vacuole centrale',
          'J\'ai expliqué le rôle de soutien mécanique et de turgescence',
          'J\'ai associé chloroplaste et chlorophylle'
        ]
      },
      {
        id: 'bio-2',
        title: 'La digestion des aliments et l\'absorption intestinale',
        subject: 'Sciences de la vie et de la Terre (SVT)',
        difficulty: 'Intermédiaire',
        category: 'Nutrition & Santé humaine (Collège 3AC)',
        estimatedTime: '15 min',
        points: 30,
        objective: 'Comprendre la simplification moléculaire des aliments sous l\'action des enzymes digestives et l\'absorption des nutriments dans l\'intestin grêle.',
        contextType: 'text',
        contextContent: 'Lors de son trajet dans le tube digestif, un morceau de pain (riche en amidon) subit une digestion mécanique (mastication) puis chimique grâce aux sucs digestifs (salive, suc gastrique, suc pancréatique et suc intestinal) qui contiennent des enzymes spécifiques. Les grosses molécules sont ainsi découpées en nutriments solubles (comme le glucose) capables de traverser la paroi intestinale.',
        questions: [
          'Quel est le rôle d\'une enzyme digestive comme l\'amylase présente dans la salive ?',
          'À quel niveau du tube digestif a lieu la majorité de l\'absorption des nutriments vers le sang et la lymphe ?',
          'Citez deux caractéristiques anatomiques de la paroi interne de l\'intestin grêle qui facilitent une absorption efficace.'
        ],
        hints: [
          {
            title: 'Indice 1 : Simplification moléculaire',
            content: 'L\'enzyme agit comme une paire de ciseaux chimiques qui découpe les grosses molécules en nutriments élémentaires.'
          },
          {
            title: 'Indice 2 : Surface d\'échange',
            content: 'La paroi intérieure présente de très nombreux replis tapissés de millions de villosités microscopiques très richement vascularisées.'
          }
        ],
        solutionSteps: [
          {
            label: 'Étape 1 : Rôle de l\'amylase',
            detail: 'L\'amylase salivaire catalyse l\'hydrolyse de l\'amidon (glucide complexe) en maltose (sucre plus simple).'
          },
          {
            label: 'Étape 2 : Lieu de l\'absorption',
            detail: 'L\'absorption de la quasi-totalité des nutriments s\'effectue au niveau de l\'intestin grêle.'
          },
          {
            label: 'Étape 3 : Caractéristiques des villosités',
            detail: '1. Une immense surface d\'échange (replis et villosités totalisant plus de 200 m²). 2. Une paroi extrêmement fine (une seule couche cellulaire) traversée par un réseau dense de capillaires sanguins et lymphatiques.'
          }
        ],
        solutionSummary: 'Les enzymes transforment les aliments en nutriments. L\'intestin grêle assure leur absorption grâce à sa très grande surface vascularisée.',
        pitfalls: [
          'Confondre la digestion (transformation chimique des aliments) et l\'absorption (passage des nutriments dans la circulation sanguine).'
        ],
        keyTakeaway: 'Aliments complexes + Enzymes digestives = Nutriments simples solubles absorbés au niveau des villosités de l\'intestin grêle.',
        checklist: [
          'J\'ai expliqué le rôle de simplification de l\'amylase',
          'J\'ai situé l\'absorption dans l\'intestin grêle',
          'J\'ai cité la très grande surface et la richesse en capillaires sanguins'
        ]
      }
    ],

        'methodologie': [
      {
        id: 'meth-1',
        title: 'Créer une fiche de révision claire et mémorable',
        subject: 'Méthodologie',
        difficulty: 'Débutant',
        category: 'Organisation & Méthode de travail',
        estimatedTime: '10 min',
        points: 25,
        objective: 'Savoir synthétiser une leçon sur une fiche bristol en faisant ressortir les titres, définitions clés et exemples sans recopier tout le cours.',
        contextType: 'text',
        contextContent: 'Lina a un contrôle d\'histoire dans trois jours portant sur un chapitre de 12 pages. Elle commence à recopier mot à mot tout son cours sur une feuille blanche et se rend compte qu\'elle n\'aura jamais le temps de tout relire.',
        questions: [
          'Pourquoi le recopiage intégral mot à mot est-il une mauvaise stratégie de révision ?',
          'Quels sont les trois éléments essentiels qui doivent figurer sur une fiche de révision efficace ?',
          'Donne deux conseils visuels pour que la fiche soit agréable et facile à relire avant le contrôle.'
        ],
        hints: [
          { title: 'Indice 1 : Synthèse', content: 'Une fiche de révision sert à résumer et condenser les idées maîtresses, pas à refaire le manuel.' },
          { title: 'Indice 2 : Impact visuel', content: 'Pense aux couleurs, surligneurs, puces et schémas.' }
        ],
        solutionSteps: [
          { label: 'Étape 1 : Diagnostic de la méthode', detail: 'Recopier mot à mot prend énormément de temps et mobilise peu la réflexion active : on recopie machinalement sans mémoriser.' },
          { label: 'Étape 2 : Contenu d\'une bonne fiche', detail: '1. Le plan du cours (grands titres), 2. Les définitions et dates clés indispensables, 3. Deux ou trois exemples concrets et formules.' },
          { label: 'Étape 3 : Clarté visuelle', detail: 'Utiliser des feutres de couleurs différentes pour les titres, surligner les mots importants, et laisser des espaces aérés.' }
        ],
        solutionSummary: 'Une fiche de révision synthétique, aérée et colorée permet de réactiver rapidement ses connaissances avant une évaluation.',
        pitfalls: [
          'Surcharger la fiche avec trop de texte sans aération.',
          'Faire sa fiche la veille au soir à 22h au lieu de l\'anticiper.'
        ],
        keyTakeaway: 'Une bonne fiche de révision résume l\'essentiel avec des mots-clés, des couleurs et des schémas : moins de texte, plus de clarté !',
        checklist: [
          'J\'ai expliqué pourquoi ne pas tout recopier',
          'J\'ai listé les 3 éléments clés d\'une fiche',
          'J\'ai proposé des repères visuels clairs'
        ]
      },
      {
        id: 'meth-2',
        title: 'Organiser son temps de devoirs et planifier sa semaine',
        subject: 'Méthodologie',
        difficulty: 'Intermédiaire',
        category: 'Gestion du temps & Autonomie',
        estimatedTime: '15 min',
        points: 35,
        objective: 'Apprendre à découper son travail scolaire, utiliser la technique de concentration par blocs et éviter la procrastination.',
        contextType: 'text',
        contextContent: 'Mehdi rentre du collège à 17h00. Il a des exercices de maths pour le lendemain, une révision de physique pour jeudi et un livre de français à lire pour la semaine prochaine. Il allume son téléphone en pensant y passer 5 minutes et se retrouve à 19h30 sans avoir commencé ses devoirs.',
        questions: [
          'Quel piège très fréquent a fait perdre plus de deux heures précieuses à Mehdi ?',
          'Comment Mehdi devrait-il organiser sa soirée en utilisant la méthode des blocs de travail (ex: 25 minutes de travail concentré puis 5 minutes de pause) ?',
          'Dans quel ordre Mehdi doit-il classer ses devoirs entre l\'urgent (pour demain), l\'important (pour jeudi) et le long terme (le livre) ?'
        ],
        hints: [
          { title: 'Indice 1 : Distractions', content: 'Le smartphone et les notifications sont les principales causes de déconcentration.' },
          { title: 'Indice 2 : Ordre des priorités', content: 'Commence toujours par ce qui est dû le lendemain avant de planifier la suite.' }
        ],
        solutionSteps: [
          { label: 'Étape 1 : Identification du piège', detail: 'La distraction numérique (smartphone posé à côté en travaillant) et la procrastination : le temps virtuel passe à toute vitesse sans s\'en apercevoir.' },
          { label: 'Étape 2 : Organisation en blocs', detail: 'Éloigner le téléphone dans une autre pièce. Travailler 25 min d\'affilée sans interruption, faire 5 min de vraie pause (boire de l\'eau, s\'étirer), puis reprendre un bloc.' },
          { label: 'Étape 3 : Priorisation des tâches', detail: '1. Urgent pour demain : exercices de maths (priorité 1). 2. Pour jeudi : 20 min de révision de physique. 3. Long terme : lire 2 chapitres du livre de français chaque soir.' }
        ],
        solutionSummary: 'En éloignant les distractions et en découpant son travail en blocs rythmés, Mehdi termine ses devoirs rapidement et sereinement.',
        pitfalls: [
          'Garder son téléphone allumé sur son bureau pendant les devoirs.',
          'Tout remettre au dernier moment la veille d\'un contrôle.'
        ],
        keyTakeaway: 'Le travail en blocs concentrés (25 min travail / 5 min pause) sans écran est trois fois plus efficace et libère du temps libre.',
        checklist: [
          'J\'ai identifié le piège de la distraction sur écran',
          'J\'ai expliqué la méthode des blocs concentrés',
          'J\'ai classé les devoirs par ordre de priorité'
        ]
      }
    ],

        'anglais': [
      {
        id: 'eng-1',
        title: 'My Daily Routine & The Present Simple',
        subject: 'Anglais',
        difficulty: 'Débutant',
        category: 'Grammar & Daily Vocabulary',
        estimatedTime: '10 min',
        points: 25,
        objective: 'Practice using the Present Simple tense to describe daily habits, routines, and school activities.',
        contextType: 'text',
        contextContent: 'Every weekday morning, Adam wakes up at 7:00 AM. He washes his face, brushes his teeth, and puts on his school uniform. At 7:30 AM, he has a delicious breakfast with his parents: warm milk, toasted bread, and honey. Then, he walks to school with his friends Youssef and Sami. Their classes begin at 8:30 AM, and Adam\'s favorite subject is English because he loves learning new words and singing English songs!',
        questions: [
          'What time does Adam wake up, and what does he eat for breakfast?',
          'Find three action verbs in the text that end with "-s" or "-es" because the subject is "he".',
          'Complete the sentence with the correct form of the verb in parentheses: "Adam\'s classes (begin) ______ at 8:30 AM, but his friend (arrive) ______ at 8:15 AM."'
        ],
        hints: [
          { title: 'Hint 1: Finding details', content: 'Look at the first two sentences for the wake-up time (7:00 AM) and the breakfast foods.' },
          { title: 'Hint 2: Verb endings', content: 'With "classes" (plural / they), the verb stays base form (begin). With "his friend" (singular / he), add "-s" (arrives).' }
        ],
        solutionSteps: [
          { label: 'Step 1: Reading comprehension', detail: 'Adam wakes up at 7:00 AM. For breakfast, he has warm milk, toasted bread, and honey.' },
          { label: 'Step 2: Identifying third-person verbs', detail: 'Verbs with -s / -es: "wakes", "washes", "brushes", "puts", "has", "walks", "loves".' },
          { label: 'Step 3: Verb completion', detail: 'Classes (plural) -> <strong>begin</strong>. His friend (singular) -> <strong>arrives</strong>.' }
        ],
        solutionSummary: 'Great job! You mastered the Present Simple tense for daily habits and third-person verb forms.',
        pitfalls: [
          'Forgetting the "-s" or "-es" on verbs with he, she, or it (say "he walks", NOT "he walk").',
          'Adding "-s" when the subject is plural (say "classes begin", NOT "classes begins").'
        ],
        keyTakeaway: 'In the Present Simple: I / You / We / They + base verb. He / She / It + verb + s / es.',
        checklist: [
          'I found the correct details in the text',
          'I identified the verbs ending in -s or -es',
          'I conjugated "begin" and "arrives" correctly'
        ]
      },
      {
        id: 'eng-2',
        title: 'The Great School Science Fair — Past Simple & Irregular Verbs',
        subject: 'Anglais',
        difficulty: 'Intermédiaire',
        category: 'Reading Comprehension & Past Tense',
        estimatedTime: '15 min',
        points: 35,
        objective: 'Master regular and irregular verbs in the Past Simple to tell an exciting story about a school event.',
        contextType: 'text',
        contextContent: 'Last Friday, our school organized an incredible Science Fair. Sarah and Youssef built a solar-powered toy car made from recycled plastic bottles. When their science teacher arrived, they demonstrated how the small solar panel converted sunlight into clean electricity. The car moved quickly across the classroom floor! The school principal saw their innovative project, smiled proudly, and awarded them first prize. It was an inspiring day full of creativity and discovery.',
        questions: [
          'What project did Sarah and Youssef build, and what materials did they use?',
          'Find three irregular verbs in the story and give their base form (infinitive).',
          'Rewrite the following sentence in the negative form in the Past Simple: "The car moved quickly across the classroom floor."'
        ],
        hints: [
          { title: 'Hint 1: Materials used', content: 'Reread the second sentence carefully to find the recycled materials and the solar panel.' },
          { title: 'Hint 2: Negative in Past Simple', content: 'Use "did not" (didn\'t) followed by the base infinitive verb without "-ed".' }
        ],
        solutionSteps: [
          { label: 'Step 1: Reading comprehension', detail: 'Sarah and Youssef built a solar-powered toy car using recycled plastic bottles and a solar panel.' },
          { label: 'Step 2: Irregular verbs', detail: 'Irregular verbs in the text: built (build), saw (see), was (be).' },
          { label: 'Step 3: Negative transformation', detail: '"The car did not (didn\'t) move quickly across the classroom floor."' }
        ],
        solutionSummary: 'Excellent! You demonstrated solid mastery of the Past Simple narrative tense and negative constructions.',
        pitfalls: [
          'Do not say "did not moved" — after "did not", always use the bare infinitive: "did not move".',
          'Do not add "-ed" to irregular verbs (build -> built, NOT builded).'
        ],
        keyTakeaway: 'In the Past Simple: Regular verbs take -ed (arrived, smiled). Irregular verbs change form (built, saw, was). Negative: did not + base verb.',
        checklist: [
          'I answered the comprehension question accurately',
          'I found the irregular verbs built, saw, was',
          'I used "did not move" for the negative sentence'
        ]
      },
      {
        id: 'eng-3',
        title: 'Eco-Heroes: Saving Our Oceans — Modal Verbs (Can, Must, Should)',
        subject: 'Anglais',
        difficulty: 'Avancé',
        category: 'Reading Analysis & Modal Verbs',
        estimatedTime: '18 min',
        points: 40,
        objective: 'Analyze an environmental text and use modal verbs (can, must, should) to express ability, obligation, and advice.',
        contextType: 'text',
        contextContent: 'Plastic pollution has become one of the most critical threats to marine ecosystems worldwide. Millions of tons of plastic enter our oceans every year, harming sea turtles, dolphins, and coral reefs. However, young environmentalists around the globe are taking action. In coastal cities, school eco-clubs organize weekly beach clean-ups and teach citizens how to reduce single-use plastic. Scientists insist that governments must enforce stricter recycling laws, while families should replace plastic bags with reusable cotton bags. Together, young people can make a measurable difference for the future of our blue planet.',
        questions: [
          'According to the article, what marine animals are in danger because of ocean plastic waste?',
          'Identify the three modal verbs used in the text (must, should, can) and explain their different meanings (obligation, recommendation, ability).',
          'Write three practical suggestions for your school to protect the environment, using "We must...", "We should...", and "We can...".'
        ],
        hints: [
          { title: 'Hint 1: Modal verb meanings', content: '"Must" expresses a strict obligation or rule. "Should" expresses good advice. "Can" expresses possibility or ability.' },
          { title: 'Hint 2: Verb form after modals', content: 'Modal verbs are always followed by the base form of the verb without "to" (ex: We must recycle).' }
        ],
        solutionSteps: [
          { label: 'Step 1: Reading comprehension', detail: 'Sea turtles, dolphins, and coral reefs are directly endangered by plastic waste in the oceans.' },
          { label: 'Step 2: Modal verbs analysis', detail: '"Must" = strong obligation (governments must enforce laws). "Should" = recommendation or advice (families should replace plastic bags). "Can" = ability or possibility (young people can make a difference).' },
          { label: 'Step 3: Sentence production', detail: '1. "We must turn off the lights when leaving the classroom." 2. "We should put plastic bottles in the yellow recycling bin." 3. "We can plant green trees in the school garden."' }
        ],
        solutionSummary: 'Outstanding! You demonstrated advanced reading comprehension and confident usage of English modal verbs.',
        pitfalls: [
          'Never put "to" after a modal verb (say "we must protect", NOT "we must to protect").',
          'Never add "-s" to modal verbs (say "he can", NOT "he cans").'
        ],
        keyTakeaway: 'Modal verbs (can, must, should) never change their form and are always followed by the base infinitive verb without "to".',
        checklist: [
          'I understood the environmental threats in the text',
          'I explained the difference between must, should, and can',
          'I produced three structured sentences with modal verbs'
        ]
      }
    ],

    'physique_chimie': [
      {
        id: 'pc-1',
        title: 'Calcul du poids et distinction masse / poids',
        subject: 'Physique-Chimie',
        difficulty: 'Débutant',
        category: 'Mécanique',
        estimatedTime: '10 min',
        points: 30,
        objective: 'Savoir calculer le poids d\'un objet à partir de sa masse et comprendre la différence entre masse (kg) et poids (N).',
        contextType: 'text',
        contextContent: 'Un astronaute a une masse de 80 kg. Sur Terre, l\'intensité de la pesanteur vaut g = 9,8 N/kg. Sur la Lune, g = 1,6 N/kg.',
        questions: [
          'Calcule le poids de l\'astronaute sur Terre.',
          'Calcule son poids sur la Lune.',
          'Sa masse change-t-elle entre la Terre et la Lune ? Justifie ta réponse.'
        ],
        hints: [
          { title: 'Indice 1 : Formule du poids', content: 'Le poids se calcule avec P = m × g, où m est la masse en kg et g l\'intensité de pesanteur en N/kg.' },
          { title: 'Indice 2 : Masse vs Poids', content: 'La masse est une propriété intrinsèque de l\'objet (elle ne change pas). Le poids dépend de l\'endroit (valeur de g).' }
        ],
        solutionSteps: [
          { label: 'Étape 1 : Poids sur Terre', detail: 'P = m × g = 80 × 9,8 = 784 N.' },
          { label: 'Étape 2 : Poids sur la Lune', detail: 'P = m × g = 80 × 1,6 = 128 N.' },
          { label: 'Étape 3 : La masse', detail: 'Non, la masse ne change pas. Elle vaut toujours 80 kg. Seul le poids varie car g est différent.' }
        ],
        solutionSummary: 'P(Terre) = 784 N, P(Lune) = 128 N. La masse (80 kg) est invariable.',
        pitfalls: [
          'Confondre masse et poids : la masse s\'exprime en kg, le poids en newtons.',
          'Oublier que g change selon le lieu (Terre, Lune, Mars...).'
        ],
        keyTakeaway: 'Le poids P = m × g est une force qui dépend du lieu. La masse est une propriété intrinsèque invariable.',
        checklist: [
          'J\'ai utilisé la formule P = m × g',
          'J\'ai bien distingué masse (kg) et poids (N)',
          'J\'ai justifié que la masse est invariable'
        ]
      },
      {
        id: 'pc-2',
        title: 'Équilibrer une équation chimique de combustion',
        subject: 'Physique-Chimie',
        difficulty: 'Intermédiaire',
        category: 'Chimie - Réactions chimiques',
        estimatedTime: '15 min',
        points: 40,
        objective: 'Savoir équilibrer une équation chimique en respectant la conservation des atomes (loi de Lavoisier).',
        contextType: 'text',
        contextContent: 'La combustion complète du méthane (CH₄) dans le dioxygène (O₂) produit du dioxyde de carbone (CO₂) et de l\'eau (H₂O).\nÉquation non équilibrée : CH₄ + O₂ → CO₂ + H₂O',
        questions: [
          'Compte le nombre d\'atomes de chaque élément (C, H, O) dans les réactifs et les produits avant équilibrage.',
          'Équilibre l\'équation en ajustant les coefficients stœchiométriques.',
          'Vérifie que le nombre d\'atomes est identique des deux côtés.'
        ],
        hints: [
          { title: 'Indice 1 : Méthode', content: 'Commence par équilibrer le carbone (C), puis l\'hydrogène (H), et enfin l\'oxygène (O).' },
          { title: 'Indice 2 : Coefficients', content: 'Tu peux placer un coefficient 2 devant H₂O pour avoir 4 H à droite. Ensuite ajuste O₂.' }
        ],
        solutionSteps: [
          { label: 'Étape 1 : Compter les atomes', detail: 'Réactifs : 1 C, 4 H, 2 O. Produits : 1 C, 2 H, 3 O → Non équilibré.' },
          { label: 'Étape 2 : Équilibrer H', detail: 'On met 2 devant H₂O : CH₄ + O₂ → CO₂ + 2H₂O. Maintenant 4 H des deux côtés.' },
          { label: 'Étape 3 : Équilibrer O', detail: 'À droite : 2 O (CO₂) + 2 O (2H₂O) = 4 O. Donc 2 O₂ à gauche. Équation finale : CH₄ + 2O₂ → CO₂ + 2H₂O.' }
        ],
        solutionSummary: 'CH₄ + 2O₂ → CO₂ + 2H₂O. Conservation vérifiée : 1C, 4H, 4O de chaque côté.',
        pitfalls: [
          'Modifier les indices dans les formules chimiques au lieu d\'ajouter des coefficients devant.',
          'Oublier de vérifier la conservation de TOUS les éléments à la fin.'
        ],
        keyTakeaway: 'Rien ne se perd, rien ne se crée, tout se transforme (Lavoisier). On équilibre en ajustant les coefficients, jamais les indices.',
        checklist: [
          'J\'ai compté les atomes avant et après',
          'J\'ai équilibré C, H puis O dans l\'ordre',
          'J\'ai vérifié la conservation de tous les atomes'
        ]
      }
    ],

    'francais': [
      {
        id: 'fr-1',
        title: 'Identifier les figures de style et analyser un extrait poétique',
        subject: 'Langue française',
        difficulty: 'Débutant',
        category: 'Figures de style & Rhétorique',
        estimatedTime: '12 min',
        points: 30,
        objective: 'Reconnaître les figures d\'analogie (métaphore, comparaison) et de substitution (métonymie) dans un texte littéraire.',
        contextType: 'text',
        contextContent: '« La terre est bleue comme une orange.\nJamais une erreur les mots ne mentent pas.\nIls ne vous donnent plus à chanter.\nC\'est au tour des baisers de s\'entendre. »\n— Paul Éluard, L\'Amour la poésie (1929)',
        questions: [
          'Relever dans le premier vers une figure de style explicite et nommer son outil de comparaison.',
          'Expliquez en quoi l\'association « bleue comme une orange » constitue une image surprenante et poétique.',
          'Donnez la classe grammaticale précise du mot « bleue » et sa fonction par rapport à « terre ».'
        ],
        hints: [
          { title: 'Indice 1 : Comparaison', content: 'Une comparaison réunit un comparé, un comparant et un outil de comparaison (« comme », « tel que »).' },
          { title: 'Indice 2 : Surréalisme', content: 'Paul Éluard est un poète surréaliste qui cherche à créer des images neuves et libres défiant la logique habituelle.' }
        ],
        solutionSteps: [
          { label: 'Étape 1 : Repérage', detail: '« La terre est bleue comme une orange » est une comparaison. Comparé = la terre, comparant = une orange, outil = « comme ».' },
          { label: 'Étape 2 : Analyse de l\'effet', detail: 'L\'image surréaliste rapproche deux réalités différentes par la forme ronde et crée un contraste poétique saisissant entre le bleu de la Terre vue du ciel et l\'orange.' },
          { label: 'Étape 3 : Grammaire', detail: '« bleue » est un adjectif qualificatif, épithète liée ou attribut du sujet « La terre » par le verbe d\'état « est ».' }
        ],
        solutionSummary: 'Comparaison surréaliste (outil « comme ») créant une vision poétique ronde et lumineuse de la planète.',
        pitfalls: ['Confondre comparaison (avec outil) et métaphore (sans outil).', 'Oublier de nommer le verbe d\'état reliant le sujet et l\'attribut.'],
        keyTakeaway: 'La comparaison associe deux éléments via un mot-outil pour renouveler le regard du lecteur sur le monde.',
        checklist: [
          'J\'ai identifié l\'outil de comparaison « comme »',
          'J\'ai expliqué la portée poétique de l\'image',
          'J\'ai identifié la fonction grammaticale d\'attribut'
        ]
      },
      {
        id: 'fr-2',
        title: 'Argumentation : Thèse, arguments et connecteurs logiques',
        subject: 'Littérature française',
        difficulty: 'Intermédiaire',
        category: 'Texte argumentatif & Rhétorique',
        estimatedTime: '15 min',
        points: 40,
        objective: 'Dégager la structure argumentative d\'un plaidoyer humaniste et identifier les liens logiques.',
        contextType: 'text',
        contextContent: '« La lecture éclaire l\'esprit et délivre l\'homme de ses préjugés les plus tenaces. Certes, les nouvelles technologies offrent un accès instantané à une infinité d\'informations ; néanmoins, seule l\'immersion patiente dans une œuvre littéraire permet de développer une pensée critique profonde et une réelle empathie. En effet, en s\'identifiant aux personnages, le lecteur fait l\'expérience intime de vies différentes de la sienne. »',
        questions: [
          'Dégagez la thèse centrale défendue par l\'auteur de ce texte.',
          'Relevez un connecteur de concession et le connecteur d\'opposition qui lui répond.',
          'Rédigez un paragraphe court présentant un argument complémentaire sur le rôle de la lecture dans le vocabulaire.'
        ],
        hints: [
          { title: 'Indice 1 : Thèse', content: 'La thèse est l\'opinion principale que le texte cherche à faire admettre au lecteur.' },
          { title: 'Indice 2 : Concession', content: 'La concession reconnaît une part de vérité à l\'adversaire (« Certes... ») avant de réfuter (« néanmoins... »).' }
        ],
        solutionSteps: [
          { label: 'Étape 1 : Thèse', detail: 'La thèse est que la lecture littéraire approfondie est irremplaçable pour forger l\'esprit critique et l\'empathie humaine.' },
          { label: 'Étape 2 : Connecteurs', detail: 'Concession = « Certes » (admettant l\'intérêt d\'Internet) ; Opposition/Réfutation = « néanmoins ».' },
          { label: 'Étape 3 : Paragraphe complémentaire', detail: '« Par ailleurs, la fréquentation régulière des grands textes enrichit le lexique et la maîtrise syntaxique, offrant à chacun les mots indispensables pour exprimer avec nuance ses propres émotions. »' }
        ],
        solutionSummary: 'Thèse valorisant la lecture face au numérique, articulée autour d\'une concession (« Certes... néanmoins ») et d\'un argument d\'empathie.',
        pitfalls: ['Confondre le thème (la lecture) et la thèse (l\'avis défendu sur la lecture).'],
        keyTakeaway: 'Une argumentation convaincante s\'appuie sur la concession pour désamorcer les objections avant d\'affirmer sa thèse.',
        checklist: [
          'J\'ai formulé la thèse en une phrase claire',
          'J\'ai repéré le couple de connecteurs « Certes... néanmoins »',
          'J\'ai rédigé un argument personnel enrichissant le débat'
        ]
      }
    ],

    'histoire_geo': [
      {
        id: 'hg-1',
        title: 'Le relief, les climats et les ressources en eau au Maroc',
        subject: 'Histoire-Géographie',
        difficulty: 'Débutant',
        category: 'Géographie du Maroc (Collège & Primaire)',
        estimatedTime: '12 min',
        points: 30,
        objective: 'Identifier les grands ensembles du relief marocain, les zones climatiques et comprendre les enjeux de la gestion de l\'eau.',
        contextType: 'text',
        contextContent: 'Le Maroc présente une remarquable variété géographique. Au nord s\'élève la chaîne du Rif, tandis que le centre et le sud sont traversés par les trois chaînes atlasiques : le Moyen Atlas, le Haut Atlas (qui culmine au Djebel Toubkal à 4 167 m) et l\'Anti-Atlas. Le climat varie d\'un type méditerranéen au nord à un climat semi-aride puis désertique au sud et à l\'est. Face à la variabilité des précipitations, le Maroc a développé depuis plusieurs décennies une politique majeure de construction de grands barrages.',
        questions: [
          'Quelles sont les 4 grandes chaînes de montagnes qui structurent le relief du Maroc ?',
          'Quel est le point culminant du Maroc et de toute l\'Afrique du Nord, et dans quelle chaîne se situe-t-il ?',
          'Expliquez deux objectifs majeurs de la politique des grands barrages initiée au Maroc.'
        ],
        hints: [
          { title: 'Indice 1 : Les 4 chaînes', content: 'Une chaîne côtière au nord (Rif) et trois chaînes qui portent le nom d\'Atlas (Moyen, Haut, Anti).' },
          { title: 'Indice 2 : Utilité des barrages', content: 'Pensez à l\'eau potable pour les villes, à l\'irrigation des terres agricoles et à la production d\'énergie électrique.' }
        ],
        solutionSteps: [
          { label: 'Étape 1 : Les 4 chaînes de montagnes', detail: 'Le Rif au nord, le Moyen Atlas, le Haut Atlas et l\'Anti-Atlas.' },
          { label: 'Étape 2 : Le point culminant', detail: 'Le Djebel Toubkal culmine à 4 167 mètres d\'altitude dans le Haut Atlas.' },
          { label: 'Étape 3 : Rôle des barrages', detail: '1. Stocker les eaux de pluie pour assurer l\'approvisionnement en eau potable et irriguer l\'agriculture en période sèche. 2. Produire de l\'énergie hydroélectrique propre et réguler les crues des oueds.' }
        ],
        solutionSummary: 'Le Maroc associe montagnes (Rif et 3 Atlas dont le Toubkal à 4167 m) et plaines fertiles, sécurisées par la politique des barrages.',
        pitfalls: ['Confondre le Moyen Atlas et le Haut Atlas en termes d\'altitude maximale.'],
        keyTakeaway: 'La politique des barrages au Maroc est un pilier stratégique pour la sécurité hydrique et le développement agricole.',
        checklist: [
          'J\'ai cité le Rif, le Moyen Atlas, le Haut Atlas et l\'Anti-Atlas',
          'J\'ai mentionné le Djebel Toubkal (4 167 m)',
          'J\'ai expliqué l\'approvisionnement en eau potable et l\'irrigation agricole'
        ]
      },
      {
        id: 'hg-2',
        title: 'L\'essor de la civilisation arabo-islamique et les dynasties marocaines',
        subject: 'Histoire-Géographie',
        difficulty: 'Intermédiaire',
        category: 'Histoire du Maroc et du monde arabo-musulman',
        estimatedTime: '15 min',
        points: 40,
        objective: 'Connaître les étapes fondatrices des premières dynasties musulmanes du Maroc (Idrissides, Almoravides) et leur rayonnement culturel.',
        contextType: 'text',
        contextContent: 'À la fin du VIIIe siècle (789 ap. J.-C.), Moulay Idriss Ier fonde la première dynastie marocaine indépendante. Son fils, Moulay Idriss II, fonde en 808 la ville impériale de Fès. En 859, Fatima Al-Fihriya y fait bâtir la célèbre mosquée et université Al-Qarawiyyin, reconnue comme la plus ancienne université au monde encore en activité. Au XIe siècle, la dynastie des Almoravides unifie le Maroc et fonde Marrakech vers 1070 sous la conduite de Youssef Ibn Tachfin.',
        questions: [
          'Qui a fondé la ville impériale de Fès en 808 et à quelle dynastie appartenait-il ?',
          'Quelle illustre institution scientifique et spirituelle a été fondée à Fès en 859 par Fatima Al-Fihriya ?',
          'Quel souverain a fondé la ville de Marrakech vers 1070 pour en faire la capitale de l\'empire almoravide ?'
        ],
        hints: [
          { title: 'Indice 1 : Fès et les Idrissides', content: 'Le fondateur de Fès est le fils de Moulay Idriss Ier.' },
          { title: 'Indice 2 : Université millénaire', content: 'Son nom commence par « Al-Qarawiyyin ».' }
        ],
        solutionSteps: [
          { label: 'Étape 1 : Fondation de Fès', detail: 'Moulay Idriss II a fondé Fès en 808 ap. J.-C. Il appartenait à la dynastie Idrisside.' },
          { label: 'Étape 2 : Université Al-Qarawiyyin', detail: 'Fatima Al-Fihriya a fondé la mosquée et université Al-Qarawiyyin en 859 à Fès, phare du savoir islamique.' },
          { label: 'Étape 3 : Fondation de Marrakech', detail: 'Youssef Ibn Tachfin a fondé Marrakech vers 1070 comme capitale de la dynastie des Almoravides.' }
        ],
        solutionSummary: 'Idriss II fonde Fès (808) abritant Al-Qarawiyyin (859) ; Youssef Ibn Tachfin fonde Marrakech (1070), capitale almoravide.',
        pitfalls: ['Confondre Idriss Ier (fondateur de la dynastie à Volubilis/Moulay Idriss Zerhoun) et Idriss II (bâtisseur de Fès).'],
        keyTakeaway: 'Fès et Marrakech témoignent de la grandeur des dynasties marocaines et de leur contribution au patrimoine culturel mondial.',
        checklist: [
          'J\'ai nommé Moulay Idriss II pour Fès en 808',
          'J\'ai identifié l\'université Al-Qarawiyyin et Fatima Al-Fihriya',
          'J\'ai mentionné Youssef Ibn Tachfin pour Marrakech'
        ]
      }
    ],

    'education_physique': [
      {
        id: 'eps-1',
        title: 'L\'échauffement corporel et la gestion de l\'effort d\'endurance au collège',
        subject: 'Éducation physique et sportive',
        difficulty: 'Débutant',
        category: 'Physiologie de l\'effort & Santé scolaire',
        estimatedTime: '10 min',
        points: 30,
        objective: 'Calculer sa Fréquence Cardiaque Maximale et calibrer l\'intensité d\'un effort en endurance fondamentale au collège.',
        contextType: 'text',
        contextContent: 'Samy a 13 ans (élève au collège) et se prépare pour la séance de course d\'endurance. Son professeur d\'EPS lui explique qu\'il doit débuter par un échauffement articulaire progressif puis courir à une allure régulière en endurance fondamentale (entre 65% et 75% de sa Fréquence Cardiaque Maximale théorique).\nOn utilise la formule scolaire : FCM = 220 - âge.',
        questions: [
          'Calculez la Fréquence Cardiaque Maximale (FCM) théorique de Samy (13 ans) en battements par minute (bpm).',
          'Déterminez les bornes inférieure (65%) et supérieure (75%) de sa zone d\'endurance (arrondies à l\'unité).',
          'Pourquoi l\'échauffement progressif avant l\'effort est-il indispensable pour les muscles et le cœur ?'
        ],
        hints: [
          { title: 'Indice 1 : FCM', content: 'FCM = 220 - 13 = 207 bpm.' },
          { title: 'Indice 2 : Rôle de l\'échauffement', content: 'Il augmente la température des muscles et prépare le cœur pour éviter les blessures.' }
        ],
        solutionSteps: [
          { label: 'Étape 1 : FCM théorique', detail: 'FCM = 220 - 13 = 207 battements par minute (bpm).' },
          { label: 'Étape 2 : Plage d\'endurance', detail: 'Borne 65% = 207 × 0,65 = 134,5 ≈ 135 bpm. Borne 75% = 207 × 0,75 = 155,2 ≈ 155 bpm. Plage cible = 135 à 155 bpm.' },
          { label: 'Étape 3 : Rôle de l\'échauffement', detail: 'Il élève la température musculaire, lubrifie les articulations (liquide synovial), accélère l\'oxygénation du sang et prévient les élongations et blessures.' }
        ],
        solutionSummary: 'Pour un élève de 13 ans : FCM = 207 bpm. Zone d\'endurance = 135 à 155 bpm avec un échauffement sérieux indispensable.',
        pitfalls: ['Partir en sprint dès le début du cours sans aucun échauffement articulaire préalable.'],
        keyTakeaway: 'Échauffement progressif + Course régulière en aisance respiratoire = Progrès physique en toute sécurité.',
        checklist: [
          'J\'ai calculé la FCM pour 13 ans (207 bpm)',
          'J\'ai calculé la plage 135 - 155 bpm',
          'J\'ai expliqué l\'intérêt préventif de l\'échauffement'
        ]
      }
    ]
  };

  constructor(
    private profile: ProfileService,
    private session: MockSessionService,
    private router: Router,
    private aiLearning: AiLearningService
  ) {}

  ngOnInit(): void {
    // Load persisted completions and drafts from localStorage
    this.loadPersistedData();

    // Listen to session subject
    this.session.session$.subscribe(s => {
      if (s && s.subject) {
        this.setSubjectInternal(s.subject);
      }
    });

    // Listen to profile subjects - only display subjects enrolled by the student
    this.profile.active$.subscribe(p => {
      if (p && p.subjects && p.subjects.length > 0) {
        this.availableSubjects = [...p.subjects];
        if (!this.currentSubject || !this.availableSubjects.includes(this.currentSubject)) {
          this.setSubjectInternal(p.subjects[0]);
        }
      }
    });
  }

  /**
   * Normalizes subject titles to internal exercise bank keys.
   * Priority: 'education_physique' is matched BEFORE 'physi' check to prevent collision.
   */
  normalizeExerciseSubject(subj: string): string {
    const s = (subj || '').toLowerCase().trim();

    // 1. Éducation islamique
    if (s.includes('islam') || s.includes('coran') || s.includes('tarbiya') || s.includes('dîn') || s.includes('din') || s.includes('إسلام')) return 'education_islamique';

    // 2. Langue arabe
    if (s.includes('arab') || s.includes('عرب')) return 'arabe';

    // 3. Langue française
    if (s.includes('franc') || s.includes('franç') || s.includes('litt')) return 'francais';

    // 4. Mathématiques
    if (s.includes('math') || s.includes('calcul') || s.includes('géom') || s.includes('geom') || s.includes('algèb') || s.includes('algeb')) return 'mathematiques';

    // 5. Physique-Chimie
    if (s.includes('physique') || s.includes('chimie') || s.includes('chimi') || s.includes('phys')) return 'physique_chimie';

    // 6. Sciences de la vie et de la Terre (SVT) / Éveil scientifique
    if (s.includes('svt') || s.includes('bio') || s.includes('terre') || s.includes('vie') || s.includes('éveil') || s.includes('eveil') || s.includes('sant')) return 'biologie';

    // 7. Histoire - Géographie
    if (s.includes('hist') || s.includes('géo') || s.includes('geo') || s.includes('civ') || s.includes('citoyen')) return 'histoire_geo';

    // 8. Informatique
    if (s.includes('info') || s.includes('algo') || s.includes('code') || s.includes('program')) return 'informatique';

    // 9. Anglais
    if (s.includes('anglais') || s.includes('eng')) return 'anglais';

    // 10. Méthodologie & Soutien scolaire
    if (s.includes('méthod') || s.includes('method')) return 'methodologie';

    // 11. Éducation physique / Sport
    if (s.includes('éducation physique') || s.includes('education physique') || s.includes('sport') || s.includes('eps')) return 'education_physique';

    return 'mathematiques';
  }

  private readonly dynamicCustomBanks: Record<string, ExerciseItem[]> = {
  };

  

  private generateTailoredExercisesForSubject(subjectName: string): ExerciseItem[] {
    if (this.isPrimaire1) {
      return [
        {
          id: `dyn-cp-${subjectName.toLowerCase().replace(/[^a-z0-9]/g, '-')}-1`,
          title: `Découverte et observation en ${subjectName}`,
          subject: subjectName,
          difficulty: 'Débutant',
          category: `Initiation • 1ère primaire (CP)`,
          estimatedTime: '5 min',
          points: 20,
          objective: `Observer, reconnaître et nommer des éléments simples du quotidien en ${subjectName}.`,
          contextType: 'text',
          contextContent: `En classe de 1ère primaire (CP), nous observons le monde qui nous entoure pour découvrir ${subjectName} à travers des jeux et des images.`,
          questions: [
            `Nomme un élément facile en rapport avec ${subjectName} que tu as découvert aujourd'hui.`,
            `Montre ou choisis l'élément correct parmi les exemples donnés.`,
            `Dis avec tes propres mots simples ce que tu as préféré dans cette activité.`
          ],
          hints: [
            { title: 'Indice CP', content: 'Rappelle-toi des jolies images vues avec le maître ou la maîtresse.' }
          ],
          solutionSteps: [
            { label: 'Étape 1 : Observation', detail: 'Bien regarder les exemples et écouter la consigne.' },
            { label: 'Étape 2 : Réponse', detail: 'Donner une réponse simple avec des mots clairs.' }
          ],
          solutionSummary: `Bravo pour ta participation et ta curiosité en ${subjectName} !`,
          pitfalls: ['Prends bien ton temps pour regarder chaque dessin avant de répondre.'],
          keyTakeaway: 'En CP, on apprend pas à pas en s\'amusant !',
          checklist: [
            'J\'ai bien écouté la consigne',
            'J\'ai donné ma réponse'
          ]
        }
      ];
    }

    const sLower = (subjectName || '').toLowerCase();
    const isIslam = sLower.includes('islam') || sLower.includes('coran') || sLower.includes('tarbiya') || sLower.includes('dîn');
    const isArab = sLower.includes('arab') || sLower.includes('عرب');

    if (isIslam || isArab) {
      const subjectTitleAr = isIslam ? 'التربية الإسلامية' : 'اللغة العربية';
      return [
        {
          id: `dyn-${subjectName.toLowerCase().replace(/[^a-z0-9]/g, '-')}-1`,
          title: isIslam ? 'تطبيق شامل في التربية الإسلامية : أركان الدين والأخلاق' : 'تطبيق شامل في قواعد اللغة العربية وفهم المقروء',
          subject: subjectName,
          difficulty: 'Débutant',
          category: `${subjectTitleAr} • المفاهيم الأساسية`,
          estimatedTime: '15 دقيقة',
          points: 30,
          objective: isIslam ? 'ترسيخ المفاهيم الإسلامية الأساسية وتطبيق الأخلاق الفاضلة.' : 'تطبيق القواعد النحوية وفهم معاني النصوص.',
          contextType: 'arabic',
          contextContent: isIslam
            ? '« قَالَ رَسُولُ اللهِ صَلَّى اللهُ عَلَيْهِ وَسَلَّمَ : مَنْ سَلَكَ طَرِيقًا يَلْتَمِسُ فِيهِ عِلْمًا سَهَّلَ اللهُ لَهُ بِهِ طَرِيقًا إِلَى الجَنَّةِ. »'
            : '« العِلْمُ نُورٌ يَبْنِي العُقُولَ، وَالصِّدْقُ أَمَانَةٌ تَفْتَحُ أَبْوَابَ الخَيْرِ وَالسَّعَادَةِ. »',
          questions: [
            isIslam ? 'اقْرَأِ الحَدِيثَ الشَّرِيفَ مَعَ الشَّكْلِ التَّامِّ، ثُمَّ بَيِّنْ فَضْلَ طَلَبِ العِلْمِ.' : 'حَدِّدِ المَبْدَأَ العَامَّ لِلْجُمْلَةِ وَاسْتَخْرِجِ المَفَاهِيمَ الأَسَاسِيَّةَ.',
            isIslam ? 'كَيْفَ يُطَبِّقُ التِّلْمِيذُ هَذَا الحَدِيثَ فِي اجْتِهَادِهِ الدِّرَاسِيِّ ؟' : 'اسْتَخْرِجِ اسْمًا مَرْفُوعًا وَبَيِّنْ مَوْقِعَهُ الإِعْرَابِيَّ.',
            isIslam ? 'اذْكُرْ خُلُقًا إِسْلاَمِيًّا يَتَحَلَّى بِهِ طَالِبُ العِلْمِ مَعَ مُعَلِّمِهِ وَزُمَلاَئِهِ.' : 'رَكِّبْ جُمْلَةً مُفِيدَةً تَتَضَمَّنُ مُبْتَدَأً وَخَبَرًا مَعَ الضَّبْطِ بِالشَّكْلِ.'
          ],
          hints: [
            { title: 'إرشاد 1', content: 'اقرأ السند بتأنٍّ وانتبه إلى المعاني النبيلة وأواخر الكلمات.' },
            { title: 'إرشاد 2', content: 'أجب بجمل واضحة وتامة التعبير.' }
          ],
          solutionSteps: [
            { label: 'الخطوة 1 : الفهم والتحليل', detail: isIslam ? 'بيان فضل العلم وطريقه المؤدي إلى رضا الله والجنة.' : 'تحديد المبتدأ والخبر وحركات الإعراب.' },
            { label: 'الخطوة 2 : التطبيق العملي', detail: isIslam ? 'الربط بالواقع المدرسي : الجد، والاجتهاد، والتواضع في التعلم.' : 'صياغة الجملة المطلوبة بشكل صحيح.' }
          ],
          solutionSummary: isIslam ? 'طلب العلم فريضة وطريق إلى الخير والنجاح.' : 'التعبير السليم ثمرة الفهم الواعي لقواعد لغتنا العربية.',
          pitfalls: ['عدم ضبط الحركات الإعرابية.', 'التسرع في الإجابة دون قراءة السند.'],
          keyTakeaway: isIslam ? '« طَلَبُ العِلْمِ فَرِيضَةٌ عَلَى كُلِّ مُسْلِمٍ ».' : '« اللُّغَةُ العَرَبِيَّةُ هُوِيَّةٌ وَإِبْدَاعٌ ».',
          checklist: [
            'قرأتُ السند قراءة متأنية',
            'أجبتُ عن جميع الأسئلة بجمل تامة',
            'تحققتُ من سلامة الحركات'
          ]
        }
      ];
    }

    return [
      {
        id: `dyn-${subjectName.toLowerCase().replace(/[^a-z0-9]/g, '-')}-1`,
        title: `Concepts fondamentaux et définitions opératoires en ${subjectName}`,
        subject: subjectName,
        difficulty: 'Débutant',
        category: `Principes fondamentaux • ${subjectName}`,
        estimatedTime: '15 min',
        points: 30,
        objective: `Identifier et expliciter les notions indispensables, les définitions fondamentales et le champ d'application de ${subjectName}.`,
        contextType: 'text',
        contextContent: `Dans le cadre de l'étude approfondie de ${subjectName}, la maîtrise préalable de la terminologie exacte et des postulats théoriques de base constitue le socle indispensable à tout raisonnement rigoureux.`,
        questions: [
          `Définis précisément les deux notions cardinales qui structurent l'étude de ${subjectName}.`,
          `Quelles sont les conditions essentielles de validité ou d'application des principes fondamentaux en ${subjectName} ?`,
          `En quoi la maîtrise de ces notions permet-elle d'éviter les confusions courantes lors des épreuves de ${subjectName} ?`
        ],
        hints: [
          { title: 'Indice méthodologique 1', content: `Reviens aux définitions précises vues en cours de ${subjectName} sans recourir à des approximations de langage.` },
          { title: 'Indice méthodologique 2', content: 'Structure ta réponse en isolant le champ d\'application et les effets directs de chaque concept.' }
        ],
        solutionSteps: [
          { label: 'Étape 1 : Cadrage conceptuel', detail: `Explicitation des concepts clés de ${subjectName} avec mention de leurs propriétés intrinsèques.` },
          { label: 'Étape 2 : Analyse des conditions', detail: `Vérification méthodique des critères d'applicabilité et des champs de validité théorique en ${subjectName}.` },
          { label: 'Étape 3 : Synthèse critique', detail: `Mise en perspective de la portée pratique des définitions opératoires dans la résolution des problèmes de ${subjectName}.` }
        ],
        solutionSummary: `Maîtrise rigoureuse des définitions et principes cardinaux de ${subjectName}, indispensable pour aborder les cas pratiques et examens.`,
        pitfalls: ['Éviter les approximations de vocabulaire et la récitation passive sans compréhension contextuelle.'],
        keyTakeaway: `En ${subjectName}, la précision terminologique et la rigueur de qualification commandent l'ensemble du raisonnement.`,
        checklist: [
          `J'ai défini avec exactitude les concepts centraux de ${subjectName}`,
          'J\'ai vérifié les critères et conditions d\'application',
          'J\'ai soigné la structure argumentative de ma réponse'
        ]
      },
      {
        id: `dyn-${subjectName.toLowerCase().replace(/[^a-z0-9]/g, '-')}-2`,
        title: `Méthode d'application pratique et résolution de cas en ${subjectName}`,
        subject: subjectName,
        difficulty: 'Intermédiaire',
        category: `Analyse & Cas Pratiques • ${subjectName}`,
        estimatedTime: '15 min',
        points: 35,
        objective: `Appliquer la démarche analytique structurée de ${subjectName} pour résoudre un problème type concret.`,
        contextType: 'text',
        contextContent: `Un cas complexe met en jeu plusieurs facteurs interdépendants nécessitant la mobilisation coordonnée des règles et mécanismes propres à ${subjectName}.`,
        questions: [
          `Isole et qualifie méthodiquement les données essentielles du problème en ${subjectName}.`,
          `Quelle démarche séquentielle de résolution convient-il d'adopter face à cette problématique ?`,
          `Formule une solution argumentée et justifie sa pertinence au regard des critères directeurs de ${subjectName}.`
        ],
        hints: [
          { title: 'Indice de structuration', content: 'Applique la méthode du syllogisme : 1. Règle théorique, 2. Confrontation aux faits, 3. Solution déduite.' },
          { title: 'Indice de rigueur', content: 'Vérifie que chaque affirmation repose sur un élément vérifiable de l\'énoncé.' }
        ],
        solutionSteps: [
          { label: 'Étape 1 : Qualification des données', detail: `Identification des paramètres critiques et qualification des éléments de fait au regard des critères de ${subjectName}.` },
          { label: 'Étape 2 : Déploiement de la méthode', detail: `Application méthodique des outils d'analyse et des règles directrices applicables à l'espèce.` },
          { label: 'Étape 3 : Conclusion motivée', detail: `Démonstration de la robustesse de la solution proposée et formulation d'une conclusion explicite.` }
        ],
        solutionSummary: `Résolution méthodique d'un cas d'école en ${subjectName} articulant qualification rigoureuse et argumentation déductive.`,
        pitfalls: ['Sauter l\'étape de qualification des faits avant de formuler la solution.'],
        keyTakeaway: `La méthode analytique en ${subjectName} garantit l'objectivité et la validité de la solution retenue.`,
        checklist: [
          `J'ai qualifié méthodiquement tous les faits en ${subjectName}`,
          'J\'ai structuré mon raisonnement selon une chaîne déductive',
          'J\'ai apporté une réponse claire et concluante'
        ]
      },
      {
        id: `dyn-${subjectName.toLowerCase().replace(/[^a-z0-9]/g, '-')}-3`,
        title: `Synthèse critique et questions transversales en ${subjectName}`,
        subject: subjectName,
        difficulty: 'Avancé',
        category: `Approfondissement & Examen • ${subjectName}`,
        estimatedTime: '20 min',
        points: 40,
        objective: `Confronter les enjeux contemporains, les limites théoriques et les perspectives critiques de ${subjectName}.`,
        contextType: 'text',
        contextContent: `Les évaluations et bilans en ${subjectName} demandent de bien lire les consignes, d'expliquer son raisonnement et d'illustrer par des exemples précis.`,
        questions: [
          `Quels sont les principaux débats contemporains ou tensions conceptuelles qui traversent ${subjectName} ?`,
          `Comment articuler les principes traditionnels avec les exigences modernes de la matière ?`,
          `Rédige une synthèse critique dégageant les lignes de force et les perspectives d'avenir en ${subjectName}.`
        ],
        hints: [
          { title: 'Indice de synthèse', content: 'Construis un plan en deux parties équilibrées illustrant les deux facettes du problème.' },
          { title: 'Indice d\'approfondissement', content: 'Mobilise des exemples concrets pour illustrer chaque articulation théorique.' }
        ],
        solutionSteps: [
          { label: 'Étape 1 : Problématisation transversale', detail: `Mise en tension des principes fondamentaux face aux évolutions et aux contraintes concrètes de ${subjectName}.` },
          { label: 'Étape 2 : Développement dialectique', detail: `Analyse nuancée confrontant thèse et antithèse avec exemples précis et terminologie experte.` },
          { label: 'Étape 3 : Conclusion prospective', detail: `Ouverture sur les tendances d'avenir et synthèse des compétences indispensables pour réussir les épreuves.` }
        ],
        solutionSummary: `Traitement complet d'un sujet de synthèse d'examen en ${subjectName} alliant esprit critique et rigueur doctrinale.`,
        pitfalls: ['Prendre parti de manière dogmatique sans examiner les arguments opposés.'],
        keyTakeaway: `L'excellence en ${subjectName} repose sur l'équilibre entre rigueur technique et hauteur de vue critique.`,
        checklist: [
          `J'ai problématisé le sujet de synthèse en ${subjectName}`,
          'J\'ai développé une argumentation dialectique nuancée',
          'J\'ai conclu par une perspective ouverte et motivée'
        ]
      }
    ];
  }

  get currentExercises(): ExerciseItem[] {
    const key = this.normalizeExerciseSubject(this.currentSubject);
    if (this.isPrimaire1 && key && this.cpExerciseBanks[key] && this.cpExerciseBanks[key].length > 0) {
      return this.cpExerciseBanks[key];
    }
    if (key && this.exerciseBanks[key] && this.exerciseBanks[key].length > 0) {
      return this.exerciseBanks[key];
    }
    if (this.currentSubject) {
      if (!this.dynamicCustomBanks[this.currentSubject]) {
        this.dynamicCustomBanks[this.currentSubject] = this.generateTailoredExercisesForSubject(this.currentSubject);
      }
      return this.dynamicCustomBanks[this.currentSubject];
    }
    return [];
  }

  get filteredExercises(): ExerciseItem[] {
    let list = this.currentExercises;

    if (this.activeDifficultyFilter !== 'ALL') {
      list = list.filter(e => e.difficulty === this.activeDifficultyFilter);
    }

    if (this.searchQuery && this.searchQuery.trim()) {
      const q = this.searchQuery.toLowerCase().trim();
      list = list.filter(e =>
        e.title.toLowerCase().includes(q) ||
        e.category.toLowerCase().includes(q) ||
        e.objective.toLowerCase().includes(q)
      );
    }

    return list;
  }

  get activeExercise(): ExerciseItem | null {
    const list = this.currentExercises;
    return list.find(e => e.id === this.selectedExerciseId) || list[0] || null;
  }

  get completedCount(): number {
    return this.currentExercises.filter(e => this.completedExercises[e.id]).length;
  }

  get progressPercentage(): number {
    const total = this.currentExercises.length;
    if (total === 0) return 0;
    return Math.round((this.completedCount / total) * 100);
  }

  get totalEarnedXp(): number {
    return this.currentExercises
      .filter(e => this.completedExercises[e.id])
      .reduce((sum, e) => sum + e.points, 0);
  }

  get isFirstExercise(): boolean {
    const list = this.filteredExercises;
    return list.findIndex(e => e.id === this.selectedExerciseId) <= 0;
  }

  get isLastExercise(): boolean {
    const list = this.filteredExercises;
    const idx = list.findIndex(e => e.id === this.selectedExerciseId);
    return idx === -1 || idx >= list.length - 1;
  }

  selectSubject(subj: string): void {
    if (this.currentSubject === subj) return;
    this.setSubjectInternal(subj);
  }

  private setSubjectInternal(subj: string): void {
    this.currentSubject = subj;
    this.loadAdaptiveDifficulty();
    const list = this.currentExercises;
    if (list.length > 0) {
      this.selectedExerciseId = list[0].id;
    }
    this.showSolution = false;
    this.openHints = {};
  }

  loadAdaptiveDifficulty(): void {
    if (!this.currentSubject) return;
    this.aiLearning.getAdaptiveDifficulty(this.currentSubject).subscribe(info => {
      if (info) {
        this.adaptiveDifficulty = info.difficulty || 'Débutant';
        this.adaptiveLevelIndex = info.levelIndex || 1;
        this.generatorDifficulty = (this.adaptiveDifficulty as any) || 'Débutant';
      }
    });
  }

  getSubjectCount(subj: string): number {
    const key = this.normalizeExerciseSubject(subj);
    if (this.isPrimaire1 && key && this.cpExerciseBanks[key] && this.cpExerciseBanks[key].length > 0) {
      return this.cpExerciseBanks[key].length;
    }
    if (key && this.exerciseBanks[key] && this.exerciseBanks[key].length > 0) {
      return this.exerciseBanks[key].length;
    }
    if (subj) {
      if (!this.dynamicCustomBanks[subj]) {
        this.dynamicCustomBanks[subj] = this.generateTailoredExercisesForSubject(subj);
      }
      return this.dynamicCustomBanks[subj].length;
    }
    return 0;
  }

  selectExercise(id: string): void {
    this.selectedExerciseId = id;
    this.showSolution = false;
    this.openHints = {};
  }

  getExerciseNumber(id: string): number {
    const idx = this.currentExercises.findIndex(e => e.id === id);
    return idx >= 0 ? idx + 1 : 1;
  }

  toggleHint(exerciseId: string, hintIndex: number): void {
    const key = `${exerciseId}-${hintIndex}`;
    this.openHints[key] = !this.openHints[key];
  }

  toggleSolution(): void {
    this.showSolution = !this.showSolution;
  }

  toggleCompleted(id: string): void {
    this.completedExercises[id] = !this.completedExercises[id];
    this.savePersistedData();
    this.profile.recordExerciseCompleted(this.currentSubject, id, this.completedExercises[id]);
  }

  isCriterionChecked(exerciseId: string, idx: number): boolean {
    return !!this.checkedCriteria[exerciseId]?.[idx];
  }

  toggleCriterion(exerciseId: string, idx: number): void {
    if (!this.checkedCriteria[exerciseId]) {
      this.checkedCriteria[exerciseId] = {};
    }
    this.checkedCriteria[exerciseId][idx] = !this.checkedCriteria[exerciseId][idx];

    // If all criteria checked, automatically mark exercise as completed
    const ex = this.activeExercise;
    if (ex && ex.checklist) {
      const allChecked = ex.checklist.every((_, i) => this.checkedCriteria[exerciseId]?.[i]);
      if (allChecked && !this.completedExercises[exerciseId]) {
        this.completedExercises[exerciseId] = true;
        this.profile.recordExerciseCompleted(this.currentSubject, exerciseId, true);
      }
    }
    this.savePersistedData();
  }

  getEvaluationScore(exerciseId: string): number {
    const group = this.checkedCriteria[exerciseId];
    if (!group) return 0;
    return Object.values(group).filter(Boolean).length;
  }

  // ── Per-Question Answer System ──
  getQuestionAnswer(exId: string, qIdx: number): string {
    return this.questionAnswers[exId]?.[qIdx] || '';
  }

  setQuestionAnswer(exId: string, qIdx: number, val: string): void {
    if (!this.questionAnswers[exId]) {
      this.questionAnswers[exId] = {};
    }
    this.questionAnswers[exId][qIdx] = val;
    this.saveQuestionAnswers(exId);
    this.syncCompiledDraft(exId);
  }

  isGibberishText(text?: string): boolean {
    if (!text || typeof text !== 'string') return true;
    const t = text.trim().toLowerCase();
    if (t.length < 3) return true;
    if (/^(aucune?|rien|non|jsp|je sais pas|sais pas|idk|pas compris|bof|asdf|azerty|sdadad)/i.test(t)) return true;
    if (/(.)\1{3,}/.test(t)) return true;
    const words = t.split(/[\s,;.!?'"()\-]+/).filter(w => w.length >= 2);
    const validWords = words.filter(w => !/^(sdad|asdf|qwerty|zerty|dada|dsad|sada|jsp|idk)$/i.test(w));
    return validWords.length === 0;
  }

  getQuestionStatus(exId: string, qIdx: number): { label: string; icon: string; cssClass: string } {
    if (this.currentDraftEvaluation && this.selectedExerciseId === exId) {
      const evalDetail = this.currentDraftEvaluation.detailedCorrection?.find(d => d.questionIndex === (qIdx + 1));
      if (evalDetail) {
        if (evalDetail.status === 'correct') {
          return { label: `Validée (${evalDetail.score} pts)`, icon: 'check_circle', cssClass: 'is-valid' };
        }
        if (evalDetail.status === 'partiel') {
          return { label: `Partielle (${evalDetail.score} pts)`, icon: 'warning', cssClass: 'is-partial' };
        }
        if (evalDetail.status === 'non_repondu') {
          return { label: 'Non traitée', icon: 'radio_button_unchecked', cssClass: 'is-empty' };
        }
        return { label: `À revoir (${evalDetail.score} pts)`, icon: 'cancel', cssClass: 'is-invalid' };
      }
    }

    const ans = this.getQuestionAnswer(exId, qIdx);
    if (!ans || !ans.trim()) {
      return { label: 'À rédiger', icon: 'radio_button_unchecked', cssClass: 'is-empty' };
    }
    if (this.isGibberishText(ans) || ans.trim().length < 5) {
      return { label: 'Brouillon (court)', icon: 'edit', cssClass: 'is-draft' };
    }
    return { label: 'Réponse enregistrée', icon: 'save', cssClass: 'is-entered' };
  }

  isQuestionAnswered(exId: string, qIdx: number): boolean {
    const a = this.getQuestionAnswer(exId, qIdx);
    return !!a && a.trim().length >= 3 && !this.isGibberishText(a);
  }

  getAnsweredCount(exId: string, total: number): number {
    const answers = this.questionAnswers[exId];
    if (!answers) return 0;
    return Object.values(answers).filter(a => a && a.trim().length > 0).length;
  }

  hasAnyAnswer(exId: string): boolean {
    const answers = this.questionAnswers[exId];
    if (answers && Object.values(answers).some(a => a && a.trim().length > 0)) return true;
    const draft = this.userDrafts[exId];
    return !!draft && draft.trim().length > 0;
  }

  clearQuestionAnswer(exId: string, qIdx: number): void {
    if (this.questionAnswers[exId]) {
      this.questionAnswers[exId][qIdx] = '';
      this.saveQuestionAnswers(exId);
      this.syncCompiledDraft(exId);
    }
  }

  private syncCompiledDraft(exId: string): void {
    const answers = this.questionAnswers[exId];
    const ex = this.activeExercise;
    if (!ex) return;
    const parts: string[] = [];
    if (answers) {
      for (let i = 0; i < ex.questions.length; i++) {
        const ans = answers[i];
        if (ans && ans.trim()) {
          parts.push(`Réponse Question ${i + 1} :\n${ans.trim()}`);
        }
      }
    }
    this.userDrafts[exId] = parts.join('\n\n');
    this.saveDraft(exId);
  }

  private saveQuestionAnswers(exId: string): void {
    try {
      if (this.questionAnswers[exId]) {
        localStorage.setItem(`tutorai_qanswers_${exId}`, JSON.stringify(this.questionAnswers[exId]));
      }
    } catch (_) {}
  }

  isArabicText(text: string | null | undefined): boolean {
    if (!text) return false;
    return /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/.test(String(text));
  }

  isArabicExercise(ex?: ExerciseItem | null): boolean {
    if (!ex) return false;
    const s = (ex.subject || '').toLowerCase();
    return s.includes('arabe') || s.includes('islam') || ex.contextType === 'arabic' || this.isArabicText(ex.title);
  }

  getQuestionBadge(ex: ExerciseItem, qIdx: number): string {
    return this.isArabicExercise(ex) ? `السؤال ${qIdx + 1}` : `Question ${qIdx + 1}`;
  }

  getQuestionStatusBadgeText(ex: ExerciseItem, qIdx: number): string {
    if (this.isArabicExercise(ex)) {
      return this.isQuestionAnswered(ex.id, qIdx) ? 'تمت الإجابة' : 'في انتظار الإجابة';
    }
    return this.getQuestionStatus(ex.id, qIdx).label;
  }

  getHintToggleText(ex: ExerciseItem, qIdx: number): string {
    const isOpen = !!this.openHints[`${ex.id}-${qIdx}`];
    if (this.isArabicExercise(ex)) {
      return isOpen ? 'إخفاء الإرشاد' : `هل تحتاج إلى إرشاد للسؤال ${qIdx + 1} ؟`;
    }
    return isOpen ? "Masquer l'indice" : `Besoin d'un indice pour la Question ${qIdx + 1} ?`;
  }

  getAnswerLabelText(ex: ExerciseItem, qIdx: number): string {
    if (this.isArabicExercise(ex)) {
      return `إجابتك أو تحليلك للسؤال ${qIdx + 1} :`;
    }
    return `Votre réponse ou calcul pour la Question ${qIdx + 1} :`;
  }

  getAutosaveText(ex: ExerciseItem): string {
    return this.isArabicExercise(ex) ? 'حفظ تلقائي' : 'Sauvegarde auto';
  }

  getAnswerPlaceholderText(ex: ExerciseItem, qIdx: number): string {
    if (this.isArabicExercise(ex)) {
      return `اكتب هنا إجابتك المفصلة أو تحليلك للسؤال ${qIdx + 1}...`;
    }
    return `Rédigez ici votre réponse détaillée ou vos calculs pour la Question ${qIdx + 1}...`;
  }

  getWordCountText(ex: ExerciseItem, qIdx: number): string {
    const count = this.getWordCount(this.getQuestionAnswer(ex.id, qIdx));
    if (this.isArabicExercise(ex)) {
      return `${count} كلمة مكتوبة`;
    }
    return `${count} mot(s) rédigé(s)`;
  }

  getClearBtnText(ex: ExerciseItem): string {
    return this.isArabicExercise(ex) ? 'مسح' : 'Effacer';
  }

  getEvaluateButtonText(ex: ExerciseItem): string {
    if (this.isEvaluatingDraft) {
      return this.isArabicExercise(ex) ? 'المرشد الذكي يقوم بتحليل إجاباتك...' : 'Le Tuteur IA analyse tes réponses...';
    }
    return this.isArabicExercise(ex) ? '🚀 تصحيح إجاباتي بواسطة المرشد الذكي' : '🚀 Corriger mes réponses avec le Tuteur IA';
  }

  getSolutionButtonText(ex: ExerciseItem): string {
    if (this.showSolution) {
      return this.isArabicExercise(ex) ? 'إخفاء عناصر الإجابة' : 'Masquer la correction';
    }
    return this.isArabicExercise(ex) ? '📖 عرض عناصر الإجابة والحل المفصل' : '📖 Consulter le corrigé officiel pas-à-pas';
  }

  getCorrectionTitle(ex: ExerciseItem): string {
    return this.isArabicExercise(ex) ? 'عناصر الإجابة النموذجية والتقييم الذاتي' : 'Correction pas-à-pas & Auto-évaluation';
  }

  getOfficialBadgeText(ex: ExerciseItem): string {
    return this.isArabicExercise(ex) ? 'عناصر إجابة رسمية' : 'Corrigé officiel';
  }

  getChecklistTitle(ex: ExerciseItem): string {
    return this.isArabicExercise(ex) ? 'التقييم الذاتي : حدد العناصر المتوفرة في إجابتك' : 'Auto-évaluation : Coche les éléments présents dans ta réponse';
  }

  getScoreSummaryText(ex: ExerciseItem): string {
    const score = this.getEvaluationScore(ex.id);
    const total = ex.checklist?.length || 0;
    if (this.isArabicExercise(ex)) {
      return `النتيجة : ${score} / ${total} معايير محققة`;
    }
    return `Score : ${score} / ${total} critères validés`;
  }

  getStepsTitle(ex: ExerciseItem): string {
    return this.isArabicExercise(ex) ? 'خطوات الحل النموذجي المفصل :' : 'Démarche de résolution détaillée :';
  }

  getKeyTakeawayTitle(ex: ExerciseItem): string {
    return this.isArabicExercise(ex) ? 'القاعدة الذهبية للحفظ :' : "Règle d'or à mémoriser :";
  }

  getPitfallsTitle(ex: ExerciseItem): string {
    return this.isArabicExercise(ex) ? '⚠️ أخطاء شائعة يجب تجنبها :' : '⚠️ Erreurs fréquentes à éviter :';
  }

  getPrevExerciseText(ex: ExerciseItem): string {
    return this.isArabicExercise(ex) ? 'التمرين السابق' : 'Exercice précédent';
  }

  getNextExerciseText(ex: ExerciseItem): string {
    return this.isArabicExercise(ex) ? 'التمرين الموالي' : 'Exercice suivant';
  }

  insertChar(char: string): void {
    const exId = this.selectedExerciseId;
    const current = this.getQuestionAnswer(exId, this.activeQuestionIndex);
    this.setQuestionAnswer(exId, this.activeQuestionIndex, current + char);
  }

  insertSnippet(snippet: string): void {
    const exId = this.selectedExerciseId;
    const current = this.getQuestionAnswer(exId, this.activeQuestionIndex);
    this.setQuestionAnswer(exId, this.activeQuestionIndex, current + (current ? '\n' : '') + snippet);
  }

  onDraftChange(exerciseId: string): void {
    this.saveDraft(exerciseId);
  }

  clearDraft(exerciseId: string): void {
    this.userDrafts[exerciseId] = '';
    this.saveDraft(exerciseId);
  }

  getWordCount(text?: string): number {
    if (!text || !text.trim()) return 0;
    return text.trim().split(/\s+/).length;
  }

  navigateExercise(delta: number): void {
    const list = this.filteredExercises;
    const currentIdx = list.findIndex(e => e.id === this.selectedExerciseId);
    const nextIdx = currentIdx + delta;
    if (nextIdx >= 0 && nextIdx < list.length) {
      this.selectedExerciseId = list[nextIdx].id;
      this.showSolution = false;
      this.openHints = {};
      window.scrollTo({ top: 120, behavior: 'smooth' });
    }
  }

  resetFilters(): void {
    this.searchQuery = '';
    this.activeDifficultyFilter = 'ALL';
  }

  openAiTutorHelp(ex: ExerciseItem): void {
    this.showAiModal = true;
  }

  closeAiModal(): void {
    this.showAiModal = false;
  }

  goToFullTutor(): void {
    this.showAiModal = false;
    const ex = this.activeExercise;
    if (ex) {
      this.session.pushMessage({
        id: 'msg-' + Date.now(),
        author: 'student',
        text: `Peux-tu m'aider sur l'exercice de ${this.currentSubject} intitulé « ${ex.title} » ? Je bloque sur la consigne : « ${ex.questions[0]} »`
      });
    }
    this.router.navigate(['/tutor']);
  }

  openGeneratorModal(): void {
    this.generatorTopic = '';
    this.generatorDifficulty = (this.adaptiveDifficulty as any) || 'Débutant';
    this.showGeneratorModal = true;
  }

  closeGeneratorModal(): void {
    this.showGeneratorModal = false;
  }

  getGeneratorSuggestions(): string[] {
    const s = (this.currentSubject || '').toLowerCase();
    if (this.isPrimaire1) {
      if (s.includes('math')) {
        return [
          'Compter jusqu\'à 10 (objets, doigts)',
          'Petites additions faciles (ex: 2 + 3)',
          'Les formes simples (rond, carré, triangle)',
          'Plus grand ou plus petit (jusqu\'à 10)'
        ];
      }
      if (s.includes('arab') || s.includes('لغة') || s.includes('عربي')) {
        return [
          'الحروف الهجائية وقراءتها',
          'الحركات القصيرة (الفتحة، الضمة، الكسرة)',
          'أسماء الإشارة (هذا، هذه)',
          'قراءة كلمات ثلاثية سهلة (دار، باب، قلم)'
        ];
      }
      if (s.includes('islam') || s.includes('تربية')) {
        return [
          'أركان الإسلام الخمسة',
          'الشهادتان ومعناهما',
          'آداب الأكل والبسملة',
          'سورة الفاتحة وآداب التحية'
        ];
      }
      if (s.includes('fran') || s.includes('french')) {
        return [
          'Les voyelles (a, e, i, o, u)',
          'Les articles un/une et le/la',
          'Les sons et l\'alphabet',
          'Les mots familiers (chat, pomme, maman)'
        ];
      }
      if (s.includes('anglais') || s.includes('engl')) {
        return [
          'Numbers from 1 to 5',
          'Colors (red, blue, yellow, green)',
          'Animals (cat, dog, bird)',
          'Greetings (Hello, Goodbye)'
        ];
      }
      if (s.includes('biolog') || s.includes('svt') || s.includes('scien') || s.includes('eveil')) {
        return [
          'Les 5 sens (yeux, oreilles, nez, mains)',
          'Les animaux et leurs bébés',
          'Le jour et la nuit',
          'Se laver les mains et la propreté'
        ];
      }
      return [
        'Activité très simple de 1ère primaire',
        'Observation et repérage visuel',
        'Jeux éducatifs guidés pour 6 ans'
      ];
    }

    if (s.includes('math')) {
      return ['Fractions & nombres relatifs', 'Théorème de Pythagore & Thalès', 'Calcul littéral & équations', 'Périmètres, aires & volumes'];
    }
    if (s.includes('arab') || s.includes('لغة') || s.includes('عربي')) {
      return ['النحو والإعراب', 'القراءة والفهم', 'الصرف والتحويل', 'التعبير والإنشاء'];
    }
    if (s.includes('islam') || s.includes('تربية')) {
      return ['القرآن الكريم وتجويده', 'السيرة النبوية الشريفة', 'العقيدة والعبادات', 'الآداب والأخلاق الإسلامية'];
    }
    if (s.includes('fran') || s.includes('french')) {
      return ['Grammaire et conjugaison', 'Compréhension de texte', 'Orthographe et accords', 'Vocabulaire et rédaction'];
    }
    if (s.includes('anglais') || s.includes('engl')) {
      return ['Present simple & continuous', 'Vocabulary & daily routines', 'Reading comprehension', 'Past simple & irregular verbs'];
    }
    if (s.includes('physiq') || s.includes('chimi') || s.includes('pc')) {
      return ['Circuits électriques en série et dérivation', 'Masse volumique et états de la matière', 'Vitesse et mouvement', 'Atomes, molécules et combustion'];
    }
    if (s.includes('biolog') || s.includes('svt') || s.includes('scien')) {
      return ['La respiration et la digestion chez l\'Homme', 'La tectonique des plaques et séismes', 'La reproduction des êtres vivants', 'Chaînes alimentaires et écosystèmes'];
    }
    if (s.includes('hist') || s.includes('géo') || s.includes('geo')) {
      return ['Les civilisations antiques', 'L\'histoire du Maroc', 'Les climats et zones géographiques', 'L\'Union Européenne et ses repères'];
    }
    if (s.includes('info') || s.includes('ordinateur')) {
      return ['Initiation aux algorithmes Scratch', 'Bureautique et traitement de texte', 'Sécurité et bon usage d\'Internet'];
    }
    if (s.includes('eps') || s.includes('sport')) {
      return ['Règles des sports collectifs', 'Échauffement et gestion de l\'effort', 'Santé et hygiène de vie'];
    }
    if (s.includes('methodo')) {
      return ['Méthode de révision efficace', 'Organisation du travail et gestion du temps', 'Mémorisation active'];
    }
    return ['Exercice d\'application directe', 'Problème guidé pas à pas', 'Questions de révision et synthèse'];
  }

  retryExercise(exId: string): void {
    if (this.questionAnswers[exId]) {
      this.questionAnswers[exId] = {};
      this.saveQuestionAnswers(exId);
    }
    this.userDrafts[exId] = '';
    this.saveDraft(exId);
    this.currentDraftEvaluation = null;
    this.activeQuestionIndex = 0;
  }

  evaluateDraftWithAi(ex: ExerciseItem): void {
    this.syncCompiledDraft(ex.id);
    const draft = this.userDrafts[ex.id];
    if (!draft || !draft.trim()) return;

    this.isEvaluatingDraft = true;
    this.currentDraftEvaluation = null;

    const qAnswers = this.questionAnswers[ex.id];
    this.aiLearning.evaluateExerciseDraft(ex, draft, qAnswers).subscribe({
      next: (res) => {
        this.currentDraftEvaluation = {
          ...res,
          appreciation: res.appreciation || (res.score >= 70 ? 'Très bon travail !' : res.score >= 50 ? 'Travail partiel à compléter' : 'Brouillon insuffisant'),
          areasToImprove: res.areasToImprove || (res as any).improvements || ['Relire la consigne et le corrigé officiel pas-à-pas']
        };
        this.isEvaluatingDraft = false;
        if (res.updatedProgress) {
          this.adaptiveDifficulty = res.updatedProgress.adaptiveDifficulty;
          this.adaptiveLevelIndex = res.updatedProgress.levelIndex;
          this.generatorDifficulty = (this.adaptiveDifficulty as any) || 'Débutant';
        }
        // ONLY validate exercise if score is genuinely passing (>= 60) AND passed flag is true
        if (res && res.score >= 60 && res.passed && !this.completedExercises[ex.id]) {
          this.completedExercises[ex.id] = true;
          this.savePersistedData();
          this.profile.recordExerciseCompleted(this.currentSubject, ex.id, true);
        } else if (res && (res.score < 60 || !res.passed) && this.completedExercises[ex.id]) {
          // If draft evaluation was insufficient, do not keep exercise validated
          this.completedExercises[ex.id] = false;
          this.savePersistedData();
        }
      },
      error: (err) => {
        console.warn('Evaluation draft error:', err);
        this.isEvaluatingDraft = false;
      }
    });
  }

  generateCustomExercise(): void {
    const topic = this.generatorTopic.trim() || undefined;
    const diff = this.generatorDifficulty;
    this.isGeneratingExercise = true;

    this.aiLearning.generateExercise(this.currentSubject, topic, diff).subscribe({
      next: (rawExercise: ExerciseItem) => {
        this.isGeneratingExercise = false;
        if (!rawExercise || !rawExercise.id) return;

        const newExercise = this.sanitizeExercise(rawExercise);

        // Add to subject bank
        const key = this.normalizeExerciseSubject(this.currentSubject);
        if (this.isPrimaire1 && key && this.cpExerciseBanks[key]) {
          this.cpExerciseBanks[key].unshift(newExercise);
        } else if (key && this.exerciseBanks[key]) {
          this.exerciseBanks[key].unshift(newExercise);
        } else {
          const targetBanks = this.isPrimaire1 ? this.cpExerciseBanks : this.exerciseBanks;
          const firstKey = Object.keys(targetBanks)[0];
          if (firstKey) {
            targetBanks[firstKey].unshift(newExercise);
          }
        }

        // Persist custom exercise
        this.saveCustomExercise(newExercise);

        // Select the newly generated exercise
        this.selectedExerciseId = newExercise.id;
        this.showSolution = false;
        this.openHints = {};
        this.currentDraftEvaluation = null;
        this.closeGeneratorModal();

        // Smoothly scroll to top so user sees the newly generated exercise
        try {
          const contentArea = document.querySelector('.content-area');
          if (contentArea) {
            contentArea.scrollTo({ top: 0, behavior: 'smooth' });
          }
        } catch (_) {}
      },
      error: (err) => {
        console.warn('AI exercise generation failed:', err);
        this.isGeneratingExercise = false;
        this.closeGeneratorModal();
      }
    });
  }

  private sanitizeExercise(ex: any): ExerciseItem {
    if (!this.isSchoolAppropriateExercise(ex)) {
      console.warn('[ExercisesComponent] Discarded non-school or forbidden exercise:', ex?.title);
      // Fallback to first certified exercise of the subject
      const key = this.normalizeExerciseSubject(this.currentSubject);
      if (this.isPrimaire1 && key && this.cpExerciseBanks[key] && this.cpExerciseBanks[key][0]) {
        return this.cpExerciseBanks[key][0];
      }
      if (this.exerciseBanks[key] && this.exerciseBanks[key][0]) {
        return this.exerciseBanks[key][0];
      }
    }
    const cleanQuestionText = (text: string): string => {
      if (!text) return '';
      return text
        .replace(/^(Question\s*\d+\s*[:.-]\s*|\d+[\s).-]\s*|السؤال\s*(\d+|الأول|الثاني|الثالث)\s*[:.-]\s*)/i, '')
        .trim();
    };

    const sanitizedQuestions: string[] = (Array.isArray(ex.questions) ? ex.questions : [])
      .map((q: any) => {
        const raw = typeof q === 'string' ? q.trim() : (q?.question || q?.text || q?.title || JSON.stringify(q));
        return cleanQuestionText(raw);
      })
      .filter((q: string) => Boolean(q));

    const sanitizedHints: ExerciseHint[] = (Array.isArray(ex.hints) ? ex.hints : [])
      .map((h: any, i: number) => {
        if (typeof h === 'string') return { title: `Indice ${i + 1}`, content: h.trim() };
        return {
          title: h?.title || `Indice ${i + 1}`,
          content: typeof h?.content === 'string' ? h.content.trim() : (h?.text || h?.hint || '')
        };
      });

    const normalizeStepDetail = (detail: any): string => {
      if (!detail) return '';
      if (typeof detail === 'string') return detail.trim();
      if (typeof detail === 'object') {
        const parts = Object.entries(detail)
          .filter(([_, v]) => Boolean(v))
          .map(([k, v]) => `<strong>${k} :</strong> ${v}`);
        return parts.length > 0 ? parts.join('<br>') : JSON.stringify(detail);
      }
      return String(detail);
    };

    const sanitizedSteps: ExerciseStep[] = (Array.isArray(ex.solutionSteps) ? ex.solutionSteps : [])
      .map((s: any, i: number) => {
        if (typeof s === 'string') return { label: `Étape ${i + 1}`, detail: s.trim() };
        return {
          label: s?.label || s?.title || `Étape ${i + 1}`,
          detail: normalizeStepDetail(s?.detail || s?.explanation || s?.content || '')
        };
      });

    return {
      id: ex.id || `ai-ex-${Date.now()}`,
      title: ex.title || `Exercice d'application en ${this.currentSubject}`,
      subject: ex.subject || this.currentSubject,
      difficulty: ex.difficulty || 'Intermédiaire',
      category: ex.category || `Entraînement ${this.currentSubject}`,
      estimatedTime: ex.estimatedTime || '15 min',
      points: ex.points || 40,
      objective: ex.objective || `Maîtriser les principes fondamentaux.`,
      contextType: ex.contextType || 'text',
      contextContent: ex.contextContent || '',
      contextTranslation: ex.contextTranslation,
      questions: sanitizedQuestions.length > 0 ? sanitizedQuestions : ['Résoudre l\'exercice méthodiquement.'],
      hints: sanitizedHints,
      solutionSteps: sanitizedSteps,
      solutionSummary: ex.solutionSummary || 'Résolution guidée pas-à-pas.',
      pitfalls: Array.isArray(ex.pitfalls) ? ex.pitfalls.map((p: any) => typeof p === 'string' ? p : (p?.text || String(p))) : ['Attention aux erreurs de calcul ou d\'inattention.'],
      keyTakeaway: ex.keyTakeaway || 'Appliquer rigoureusement la méthodologie étape par étape.',
      checklist: Array.isArray(ex.checklist) ? ex.checklist.map((c: any) => typeof c === 'string' ? c : (c?.text || String(c))) : ['J\'ai répondu aux questions posées']
    };
  }

  private saveCustomExercise(ex: ExerciseItem): void {
    try {
      const saved = localStorage.getItem('tutorai_custom_exercises');
      const list: ExerciseItem[] = saved ? JSON.parse(saved) : [];
      list.unshift(ex);
      localStorage.setItem('tutorai_custom_exercises', JSON.stringify(list.slice(0, 30)));
    } catch (_) {}
  }

  private saveDraft(exerciseId: string): void {
    try {
      localStorage.setItem(`tutorai_draft_${exerciseId}`, this.userDrafts[exerciseId] || '');
    } catch (_) {}
  }

  
  private isSchoolAppropriateExercise(ex: any): boolean {
    if (!ex) return false;
    const cat = (ex.category || '').toLowerCase();
    const title = (ex.title || '').toLowerCase();
    const context = (ex.contextContent || '').toLowerCase();
    const allText = title + ' ' + cat + ' ' + context;

    const bannedKeywords = [
      'fédérale', 'federal reserve', 'politique monétaire', 'monetary policy',
      'taux d\'intérêt', 'taux directeur', 'seuil de rentabilité', 'marge sur coût',
      'amortissement comptable', 'droit pénal', 'droit civil', 'code civil',
      'pharmacologie', 'posologie', 'microbiologie', 'bactériologie',
      'surapprentissage', 'overfitting', 'backpropagation', 'macroéconomie',
      'crise financière', 'marché des titres', 'économie et finance'
    ];

    if (bannedKeywords.some(b => allText.includes(b))) return false;
    if (ex.points && ex.points > 60) return false;

    // If English subject, ensure questions aren't in French
    const s = (ex.subject || '').toLowerCase();
    if (s.includes('anglais') || s.includes('engl')) {
      const qText = Array.isArray(ex.questions) ? ex.questions.join(' ').toLowerCase() : '';
      if (/\b(quelle|pourquoi|définis|expliquez|calculer|dans le cadre)\b/.test(qText)) {
        return false;
      }
    }

    // If Arabic subject, ensure questions are in Arabic and not French
    if (s.includes('arabe') || s.includes('islam')) {
      const qText = Array.isArray(ex.questions) ? ex.questions.join(' ') : '';
      if (!/[\u0600-\u06FF]/.test(qText) || /\b(quelle|pourquoi|définis|expliquez|calculer|dans|considérez|créez)\b/i.test(qText)) {
        return false;
      }
    }

    // Reject exercises where solutionSteps are instructions to the student instead of the model solution
    if (Array.isArray(ex.solutionSteps)) {
      const stepText = ex.solutionSteps.map((st: any) => (st?.detail || '') + ' ' + (st?.label || '')).join(' ').toLowerCase();
      if (/\b(lis les informations|considérez les avantages|créez un exemple|recherchez sur internet|écris un texte)\b/i.test(stepText)) {
        return false;
      }
    }

    // For 1ère primaire (CP), strictly reject any exercise containing advanced topics
    if (this.isPrimaire1) {
      const advancedKeywords = [
        'fraction', 'pythagore', 'thalès', 'thales', 'dérivée', 'derivee', 'intégrale', 'integrale',
        'équation', 'equation', 'trigonométrie', 'trigonometrie', 'vecteur', 'matrice', 'probabilité',
        'passé composé', 'imparfait', 'subjonctif', 'conditionnel', 'complément d\'objet', 'cod', 'coi',
        'proposition subordonnée', 'conjonction de subordination',
        'إعراب', 'مفعول به', 'اسم الفاعل', 'ممنوع من الصرف', 'كان وأخواتها', 'إن وأخواتها', 'المثنى والجمع'
      ];
      if (advancedKeywords.some(b => allText.includes(b))) {
        return false;
      }
    }

    return true;
  }

  private loadPersistedData(): void {
    try {
      // Completed exercises
      const savedCompleted = localStorage.getItem('tutorai_completed_exercises');
      if (savedCompleted) {
        this.completedExercises = JSON.parse(savedCompleted);
      }
      // Criteria
      const savedCriteria = localStorage.getItem('tutorai_checked_criteria');
      if (savedCriteria) {
        this.checkedCriteria = JSON.parse(savedCriteria);
      }
      // Restore custom generated exercises (with strict school firewall)
      const savedCustom = localStorage.getItem('tutorai_custom_exercises');
      if (savedCustom) {
        try {
          const customList: ExerciseItem[] = JSON.parse(savedCustom);
          const validList: ExerciseItem[] = [];
          for (const ex of customList) {
            if (this.isSchoolAppropriateExercise(ex)) {
              const key = this.normalizeExerciseSubject(ex.subject || this.currentSubject);
              if (this.isPrimaire1 && key && this.cpExerciseBanks[key]) {
                if (!this.cpExerciseBanks[key].some(e => e.id === ex.id)) {
                  this.cpExerciseBanks[key].unshift(ex);
                }
              } else if (key && this.exerciseBanks[key]) {
                if (!this.exerciseBanks[key].some(e => e.id === ex.id)) {
                  this.exerciseBanks[key].unshift(ex);
                }
              }
              validList.push(ex);
            }
          }
          // Overwrite localStorage with purged, clean list
          localStorage.setItem('tutorai_custom_exercises', JSON.stringify(validList));
        } catch (_) {}
      }
      // Drafts & Per-question answers
      const allBanks = [...Object.values(this.exerciseBanks), ...Object.values(this.cpExerciseBanks)];
      for (const group of allBanks) {
        for (const ex of group) {
          const savedQa = localStorage.getItem(`tutorai_qanswers_${ex.id}`);
          if (savedQa) {
            try {
              this.questionAnswers[ex.id] = JSON.parse(savedQa);
            } catch (_) {}
          }
          const draft = localStorage.getItem(`tutorai_draft_${ex.id}`);
          if (draft) {
            this.userDrafts[ex.id] = draft;
          }
        }
      }
    } catch (_) {}
  }

  private savePersistedData(): void {
    try {
      localStorage.setItem('tutorai_completed_exercises', JSON.stringify(this.completedExercises));
      localStorage.setItem('tutorai_checked_criteria', JSON.stringify(this.checkedCriteria));
    } catch (_) {}
  }
}
