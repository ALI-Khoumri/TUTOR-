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
    <section class="learning-page page-enter" *ngIf="profile$ | async as profile">
      
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
      <div class="subject-bar" *ngIf="availableSubjects.length > 0">
        <div class="subject-bar__label">
          <mat-icon>menu_book</mat-icon>
          <span>Matière :</span>
        </div>
        <div class="subject-pills">
          <button
            *ngFor="let s of availableSubjects"
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

            <!-- Numbered Specific Questions -->
            <div class="questions-list">
              <h4 class="questions-subtitle">
                <mat-icon>help_outline</mat-icon> Questions à traiter :
              </h4>
              <ol class="questions-ordered">
                <li *ngFor="let q of ex.questions; let qIdx = index">
                  <div class="question-row">
                    <span class="q-badge">Question {{ qIdx + 1 }}</span>
                    <span class="q-text">{{ q }}</span>
                  </div>
                </li>
              </ol>
            </div>
          </div>

          <!-- 4. Progressive Methodological Hints (3 levels) -->
          <div class="hints-section">
            <div class="hints-header">
              <div class="hints-title">
                <mat-icon>psychology</mat-icon>
                <span>Boîte à outils méthodologique & Indices progressifs</span>
              </div>
              <span class="hints-sub">Besoin d'un déblocage sans voir la réponse ? Dévoile un indice selon ton besoin :</span>
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

          <!-- 5. Student Workspace / Answer Editor -->
          <div class="workspace-section">
            <div class="workspace-header">
              <div class="workspace-label">
                <mat-icon>edit_note</mat-icon>
                <span>Ton espace de réponse et raisonnement</span>
              </div>
              <div class="autosave-badge">
                <mat-icon>cloud_done</mat-icon>
                <span>Sauvegarde automatique active</span>
              </div>
            </div>

            <!-- Contextual Quick-Insert Toolbar -->
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

            <!-- Textarea -->
            <div class="textarea-wrapper">
              <textarea
                #workspaceArea
                class="workspace-textarea"
                [class.arabic-input]="ex.contextType === 'arabic'"
                rows="6"
                [(ngModel)]="userDrafts[ex.id]"
                (input)="onDraftChange(ex.id)"
                placeholder="Écris ton raisonnement détaillé, tes calculs ou tes réponses ici..."
              ></textarea>
            </div>

            <div class="workspace-footer">
              <span class="word-counter">
                {{ getWordCount(userDrafts[ex.id]) }} mots rédigés
              </span>
              <button
                *ngIf="userDrafts[ex.id]"
                type="button"
                class="btn-text-action"
                (click)="clearDraft(ex.id)"
              >
                <mat-icon>delete_outline</mat-icon> Effacer
              </button>
            </div>

            <!-- AI Draft Evaluation Trigger -->
            <div class="ai-eval-trigger-row">
              <button
                type="button"
                class="btn btn--ai-evaluate"
                [disabled]="isEvaluatingDraft || !userDrafts[ex.id]?.trim()"
                (click)="evaluateDraftWithAi(ex)"
              >
                <mat-icon [class.spin]="isEvaluatingDraft">{{ isEvaluatingDraft ? 'sync' : 'psychology' }}</mat-icon>
                <span>{{ isEvaluatingDraft ? 'Le Tuteur IA analyse ton travail...' : 'Corriger mon brouillon avec le Tuteur IA' }}</span>
              </button>
              <span class="ai-eval-hint" *ngIf="!userDrafts[ex.id]?.trim()">
                💡 Rédige une tentative de réponse ci-dessus pour recevoir les conseils du Tuteur IA avant de voir la solution.
              </span>
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
                <div class="feedback-score-badge" [class.is-good]="currentDraftEvaluation.score >= 70">
                  <span class="score-val">{{ currentDraftEvaluation.score }}</span>
                  <span class="score-max">/100</span>
                </div>
              </div>

              <p class="feedback-body-text">{{ currentDraftEvaluation.feedback }}</p>

              <div class="feedback-details-grid">
                <div class="feedback-col strengths-col" *ngIf="currentDraftEvaluation.strengths?.length">
                  <span class="col-title"><mat-icon>thumb_up</mat-icon> Points forts identifiés :</span>
                  <ul>
                    <li *ngFor="let s of currentDraftEvaluation.strengths">{{ s }}</li>
                  </ul>
                </div>

                <div class="feedback-col tips-col" *ngIf="currentDraftEvaluation.areasToImprove?.length">
                  <span class="col-title"><mat-icon>lightbulb</mat-icon> Conseils avant la solution :</span>
                  <ul>
                    <li *ngFor="let a of currentDraftEvaluation.areasToImprove">{{ a }}</li>
                  </ul>
                </div>
              </div>

              <div class="feedback-footer" *ngIf="currentDraftEvaluation.encouragement">
                <mat-icon>auto_awesome</mat-icon>
                <span>{{ currentDraftEvaluation.encouragement }}</span>
              </div>
            </div>
          </div>

          <!-- 6. Primary Action Buttons -->
          <div class="action-buttons-bar">
            <button
              type="button"
              class="btn btn--primary btn--lg"
              (click)="toggleSolution()"
            >
              <mat-icon>{{ showSolution ? 'visibility_off' : 'verified' }}</mat-icon>
              <span>{{ showSolution ? 'Masquer la correction' : 'Vérifier & Voir la correction détaillée' }}</span>
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
              <span>{{ completedExercises[ex.id] ? 'Validé' : 'Marquer comme validé' }}</span>
            </button>
          </div>

          <!-- 7. Detailed Step-by-Step Correction Panel -->
          <div class="correction-card" *ngIf="showSolution">
            <div class="correction-card__header">
              <div class="header-left">
                <mat-icon>fact_check</mat-icon>
                <h3>Correction pas-à-pas & Auto-évaluation</h3>
              </div>
              <span class="badge badge--success">Corrigé officiel</span>
            </div>

            <!-- Interactive Self-Evaluation Checklist -->
            <div class="evaluation-box" *ngIf="ex.checklist && ex.checklist.length > 0">
              <div class="eval-top">
                <h4>
                  <mat-icon>checklist</mat-icon>
                  Auto-évaluation : Coche les éléments présents dans ta réponse
                </h4>
                <div class="eval-score-badge">
                  Score : {{ getEvaluationScore(ex.id) }} / {{ ex.checklist.length }} critères validés
                </div>
              </div>

              <div class="checklist-grid">
                <label
                  *ngFor="let item of ex.checklist; let cIdx = index"
                  class="check-item"
                  [class.is-checked]="isCriterionChecked(ex.id, cIdx)"
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
                <mat-icon>format_list_numbered</mat-icon> Démarche de résolution détaillée :
              </h4>

              <div class="steps-list">
                <div *ngFor="let step of ex.solutionSteps; let sIdx = index" class="step-card">
                  <div class="step-number">{{ sIdx + 1 }}</div>
                  <div class="step-content">
                    <div class="step-label">{{ step.label }}</div>
                    <div class="step-detail" [innerHTML]="step.detail"></div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Summary & Key takeaway -->
            <div class="takeaway-box" *ngIf="ex.keyTakeaway">
              <div class="takeaway-title">
                <mat-icon>military_tech</mat-icon>
                <span>Règle d'or à mémoriser :</span>
              </div>
              <p class="takeaway-body">{{ ex.keyTakeaway }}</p>
            </div>

            <!-- Pitfalls & Common errors to avoid -->
            <div class="pitfalls-box" *ngIf="ex.pitfalls && ex.pitfalls.length > 0">
              <div class="pitfalls-title">
                <mat-icon>warning_amber</mat-icon>
                <span>⚠️ Erreurs fréquentes à éviter :</span>
              </div>
              <ul class="pitfalls-list">
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
                <span>Exercice précédent</span>
              </button>

              <button
                type="button"
                class="btn btn--primary"
                [disabled]="isLastExercise"
                (click)="navigateExercise(1)"
              >
                <span>Exercice suivant</span>
                <mat-icon>arrow_forward</mat-icon>
              </button>
            </div>

          </div>

        </main>

      </div>

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
                placeholder="Ex : Les verbes défectueux, Dérivée d'une fonction composée, etc."
              />

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

    </section>
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
      font-size: 1.45rem;
      line-height: 2.1;
      color: #1e293b;
      letter-spacing: 0.02em;
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
      background: rgba(15, 23, 42, 0.45);
      backdrop-filter: blur(4px);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
      padding: 1rem;
      animation: fadeIn 150ms ease;
    }

    .modal-card {
      background: #ffffff;
      border-radius: var(--radius-xl, 24px);
      box-shadow: var(--shadow-lg);
      max-width: 520px;
      width: 100%;
      overflow: hidden;
      display: flex;
      flex-direction: column;
      border: 1px solid var(--border);
    }

    .modal-header {
      padding: 1.25rem 1.5rem;
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      border-bottom: 1px solid var(--border);
      background: var(--surface);
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
    }

    .modal-body {
      padding: 1.5rem;
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
      gap: 0.85rem;
    }

    .form-label {
      font-size: 0.84rem;
      font-weight: 700;
      color: var(--text);
    }

    .form-input {
      width: 100%;
      box-sizing: border-box;
      padding: 0.65rem 0.85rem;
      border-radius: var(--radius-sm);
      border: 1px solid var(--border);
      font-size: 0.88rem;
    }

    .diff-selector {
      display: flex;
      gap: 0.5rem;
    }

    .diff-btn {
      flex: 1;
      padding: 0.5rem;
      border-radius: var(--radius-sm);
      border: 1px solid var(--border);
      background: #fff;
      font-size: 0.82rem;
      font-weight: 600;
      cursor: pointer;
    }

    .diff-btn.is-selected {
      background: var(--accent);
      color: #fff;
      border-color: var(--accent);
    }

    .modal-footer {
      padding: 1rem 1.5rem;
      border-top: 1px solid var(--border);
      background: var(--surface);
      display: flex;
      justify-content: flex-end;
      gap: 0.75rem;
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

  currentSubject = 'Langue arabe';
  availableSubjects: string[] = ['Langue arabe', 'Informatique & algorithmique', 'Mathématiques', 'Biologie cellulaire', 'Anglais'];
  
  selectedExerciseId = 'ar-1';
  searchQuery = '';
  activeDifficultyFilter: 'ALL' | 'Débutant' | 'Intermédiaire' | 'Avancé' = 'ALL';

  showSolution = false;
  openHints: Record<string, boolean> = {};
  userDrafts: Record<string, string> = {};
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

  readonly exerciseBanks: Record<string, ExerciseItem[]> = {
    'arabe': [
      {
        id: 'ar-1',
        title: 'Analyse de la phrase nominale (الجملة الاسمية : المبتدأ والخبر)',
        subject: 'Langue arabe',
        difficulty: 'Débutant',
        category: 'Grammaire & Syntaxe (النحو)',
        estimatedTime: '12 min',
        points: 30,
        objective: 'Identifier les deux éléments fondateurs de la phrase nominale (المبتدأ et الخبر), justifier leur cas grammatical (الرفع بالضمة) et transformer la phrase avec la particule « إِنَّ ».',
        contextType: 'arabic',
        contextContent: 'العِلْمُ نُورٌ يُضِيءُ دَرْبَ الحَيَاةِ، وَالصَّبْرُ مِفْتَاحُ الفَرَجِ.',
        contextTranslation: '« La science est une lumière qui éclaire le chemin de la vie, et la patience est la clé de la délivrance. »',
        questions: [
          'Dans la première proposition « العِلْمُ نُورٌ », identifie avec précision le مبتدأ (sujet) et le خبر (prédicat/information).',
          'Quelle est la marque de déclinaison (علامة الإعراب) portée par les mots « العِلْمُ » et « نُورٌ » ? Justifie la règle générale.',
          'Réécris la proposition en plaçant la particule « إِنَّ » au début. Quelles modifications de voyellation s\'opèrent sur le sujet et le prédicat ?'
        ],
        hints: [
          {
            title: 'Indice 1 : Piste de repérage',
            content: 'Le مبتدأ est le nom défini par lequel commence l\'énoncé. Le خبر est l\'élément qui apporte l\'information essentielle et donne un sens complet à la phrase.'
          },
          {
            title: 'Indice 2 : Règle fondamentale du cas sujet (الرفع)',
            content: 'Dans une phrase nominale sans auxiliaire modificateur, le مبتدأ et le خبر sont tous deux مرفوعان (au cas nominatif/sujet). Pour un singulier sain, la marque est la damma (ـُ / ـٌ).'
          },
          {
            title: 'Indice 3 : Action de « إِنَّ » (الحروف الناسخة)',
            content: 'La particule « إِنَّ » rend son nom (اسمها) منصوب (marqué par la fatha ـَ) et conserve son prédicat (خبرها) مرفوع (marqué par la damma ـُ).'
          }
        ],
        solutionSteps: [
          {
            label: 'Étape 1 : Identification du المبتدأ et du الخبر',
            detail: 'Dans la phrase « العِلْمُ نُورٌ » :<br>• <strong>العِلْمُ :</strong> مبتدأ (nom défini placé en tête de phrase).<br>• <strong>نُورٌ :</strong> خبر (information indéfinie qui qualifie le sujet et clôt le sens principal).'
          },
          {
            label: 'Étape 2 : Justification grammaticale des désinences',
            detail: 'Les deux termes sont au cas nominatif (<strong>مرفوع بالضمة الظاهرة على آخره</strong>). « العِلْمُ » porte une damma simple car il a l\'article défini (ال), tandis que « نُورٌ » porte un tanwîn de damma (ضمّتان) car il est indéfini sans complément déterminatif.'
          },
          {
            label: 'Étape 3 : Transformation avec la particule « إِنَّ »',
            detail: 'Après introduction de « إِنَّ », la phrase devient :<br><div class="arabic-font" dir="rtl" style="font-size:1.3rem; margin:0.4rem 0;">« إِنَّ العِلْمَ نُورٌ »</div>Le sujet devient l\'attribut de Inna (<strong>اسم إنّ منصوب بالفتحة</strong>) et le prédicat reste (<strong>خبر إنّ مرفوع بالضمة</strong>).'
          }
        ],
        solutionSummary: 'La phrase nominale repose sur le couple (مبتدأ + خبر) au cas nominatif (الرفع بالضمة). L\'introduction de « إِنَّ » modifie le cas du nom vers l\'accusatif (النصب بالفتحة).',
        pitfalls: [
          'Ne pas confondre le خبر avec un adjectif épithète (صفة) : un adjectif s\'accorde en définition, alors que le خبر d\'origine est indéfini.',
          'Oublier de changer la damma en fatha sur le nom après « إِنَّ ».'
        ],
        keyTakeaway: 'المبتدأ والخبر اسمان مرفوعان بالضمة، وإذا دخلت عليهما «إِنَّ» نصبت المبتدأ وسمي اسمها ورفعت الخبر وسمي خبرها.',
        checklist: [
          'J\'ai correctement identifié « العِلْمُ » comme مبتدأ et « نُورٌ » comme خبر',
          'J\'ai précisé que les deux mots sont مرفوعان بالضمة الظاهرة',
          'J\'ai réécrit « إِنَّ العِلْمَ نُورٌ » en appliquant la fatha sur العِلْمَ et la damma sur نُورٌ'
        ]
      },
      {
        id: 'ar-2',
        title: 'Conjugaison et particularités du verbe défectueux (تصريف الفعل المعتل الناقص)',
        subject: 'Langue arabe',
        difficulty: 'Intermédiaire',
        category: 'Morphologie & Conjugaison (الصرف)',
        estimatedTime: '15 min',
        points: 40,
        objective: 'Comprendre les métamorphoses de la lettre faible finale (حرف العلة) lors de la conjugaison du verbe ناقص au passé, présent et impératif.',
        contextType: 'arabic',
        contextContent: 'الفِعْلَانِ : « دَعَا » (يَدْعُو - دَعْوَةً) وَ « قَضَى » (يَقْضِي - قَضَاءً).',
        contextTranslation: 'Les deux verbes : « Da’â » (invoquer / inviter) et « Qadâ » (juger / accomplir).',
        questions: [
          'Pourquoi le verbe « دَعَا » s\'écrit-il avec un alif droit (ألف ممدودة) tandis que « قَضَى » s\'écrit avec un alif court (ألف مقصورة ى) ?',
          'Conjugue le verbe « دَعَا » au passé (الماضي) avec les pronoms : « أَنَا » (moi) et « هُمْ » (eux, masculin pluriel). Que devient la lettre faible avec « هُمْ » ?',
          'Forme l\'impératif (الأمر) du verbe « قَضَى » avec le pronom « أَنْتَ » (toi, masculin singulier) avec une voyellation complète (شَكْل).'
        ],
        hints: [
          {
            title: 'Indice 1 : Origine de l\'alif final',
            content: 'En arabe, l\'alif final à la 3ème personne du singulier provient soit d\'un Wâw (و) soit d\'un Yâ\' (ي). Regarde la lettre présente au présent (المضارع) !'
          },
          {
            title: 'Indice 2 : Rencontre de deux voyelles longues (التقاء الساكنين)',
            content: 'Lorsque la lettre faible finale rencontre le wâw de pluriel (واو الجماعة), la lettre faible est supprimée pour éviter la lourdeur phonétique.'
          },
          {
            title: 'Indice 3 : Règle de l\'impératif pour les verbes défectueux',
            content: 'L\'impératif d\'un verbe ناقص se forme par suppression du حرف العلة final (حذف حرف العلة), en conservant la voyelle brève correspondante.'
          }
        ],
        solutionSteps: [
          {
            label: 'Étape 1 : Origine étymologique de l\'alif',
            detail: '• Dans « دَعَا », l\'alif est droit (ممدودة) car sa racine présente un Wâw au présent : <strong>يَدْعُو</strong>.<br>• Dans « قَضَى », l\'alif est مقصورة (ى) car sa racine présente un Yâ\' au présent : <strong>يَقْضِي</strong>.'
          },
          {
            label: 'Étape 2 : Conjugaison au passé',
            detail: '• Avec « أَنَا » : <strong>دَعَوْتُ</strong> (le Wâw d\'origine réapparaît).<br>• Avec « هُمْ » : <strong>دَعَوْا</strong> (l\'alif de terminaison est supprimé lors de la rencontre avec le Wâw de pluriel, et la fatha précédente est maintenue).'
          },
          {
            label: 'Étape 3 : Formation de l\'impératif au singulier masculin',
            detail: 'L\'impératif de « قَضَى » avec « أَنْتَ » est :<br><div class="arabic-font" dir="rtl" style="font-size:1.4rem; margin:0.4rem 0;">« اِقْضِ »</div>La lettre faible (الياء) est supprimée (مبني على حذف حرف العلة) et compensée par une kasra sous la lettre ض.'
          }
        ],
        solutionSummary: 'La lettre faible finale s\'efface devant le pronom pluriel au passé (دَعَوْا) et est retranchée à l\'impératif singulier (اِقْضِ).',
        pitfalls: [
          'Écrire l\'impératif « اقضي » avec un yâ\' pour le masculin singulier (le yâ\' n\'existe que pour le féminin singulier : اِقْضِي).',
          'Oublier le retour du Wâw à la première personne : « دَعَوْتُ » et non « دعيت ».'
        ],
        keyTakeaway: 'الفعل الناقص تُحذف لامه (حرف العلة) عند اتصاله بواو الجماعة، ويُبنى أمر المفرد المذكر على حذف حرف العلة.',
        checklist: [
          'J\'ai expliqué la distinction entre origine Wâw (يدعو) et origine Yâ\' (يقضي)',
          'J\'ai conjugué correctement « دَعَوْتُ » et « دَعَوْا » en expliquant l\'élision',
          'J\'ai écrit l\'impératif « اِقْضِ » avec suppression du حرف العلة et présence de la kasra'
        ]
      },
      {
        id: 'ar-3',
        title: 'Les Cinq Noms et leurs marques d\'élocution (الأسماء الخمسة)',
        subject: 'Langue arabe',
        difficulty: 'Intermédiaire',
        category: 'Syntaxe & Déclinaison (الإعراب)',
        estimatedTime: '15 min',
        points: 35,
        objective: 'Identifier les Cinq Noms (أب، أخ، حم، فو، ذو), reconnaître leurs marques d\'élocution longues (الواو، الألف، الياء) et les conditions indispensables de leur application.',
        contextType: 'arabic',
        contextContent: '« كَانَ أَبُوكَ رَجُلًا ذَا مَكَانَةٍ رَفِيعَةٍ، وَسَاعَدَ حَمَاكَ فِي عَمَلِهِ. »',
        contextTranslation: '« Ton père était un homme doté d\'un haut rang, et il a aidé ton beau-père dans son travail. »',
        questions: [
          'Relève les trois termes issus des « Cinq Noms » (الأسماء الخمسة) présents dans la phrase.',
          'Donne la fonction grammaticale et la marque de déclinaison (علامة الإعراب) de chacun des trois noms relevés.',
          'Quelles sont les deux conditions fondamentales pour que ces noms prennent les marques d\'élocution longues (lettres) plutôt que les voyelles courtes ?'
        ],
        hints: [
          {
            title: 'Indice 1 : Les Cinq Noms',
            content: 'Les cinq noms sont : أَبٌ (père), أَخٌ (frère), حَمٌ (beau-père), فُـو (bouche), ذُو (doté de / possesseur).'
          },
          {
            title: 'Indice 2 : Déclinaisons particulières',
            content: 'Au cas nominatif (رفع) : ils prennent le Wâw (و). Au cas accusatif (نصب) : ils prennent l\'Alif (ا). Au cas génitif (جر) : ils prennent le Yâ\' (ي).'
          },
          {
            title: 'Indice 3 : Conditions requises',
            content: 'Ils doivent être au singulier (مفردة) et être annexés (مضافة) à un complément autre que le pronom de 1ère personne (ياء المتكلم).'
          }
        ],
        solutionSteps: [
          {
            label: 'Étape 1 : Relevé des termes',
            detail: '1. <strong>أَبُوكَ</strong> (issu de أَبٌ)<br>2. <strong>ذَا</strong> (issu de ذُو)<br>3. <strong>حَمَاكَ</strong> (issu de حَمٌ)'
          },
          {
            label: 'Étape 2 : Analyse grammaticale détaillée',
            detail: '• <strong>أَبُوكَ :</strong> اسم كان مرفوع وعلامة رفعه <strong>الواو</strong> لأنه من الأسماء الخمسة، والكاف مضاف إليه.<br>• <strong>ذَا :</strong> نعت لـ « رَجُلًا » منصوب وعلامة نصبه <strong>الألف</strong> لأنه من الأسماء الخمسة.<br>• <strong>حَمَاكَ :</strong> مفعول به للفعل « ساعَدَ » منصوب وعلامة نصبه <strong>الألف</strong> لأنه من الأسماء الخمسة.'
          },
          {
            label: 'Étape 3 : Conditions d\'application des marques longues',
            detail: '1. <strong>Qu\'ils soient singuliers :</strong> s\'ils sont au pluriel (آباء) ou au duel (أبوان), ils prennent les marques usuelles du pluriel/duel.<br>2. <strong>Qu\'ils soient annexés (مضافة) :</strong> s\'ils sont isolés (أبٌ), ils se déclinent par voyelles brèves.<br>3. <strong>Que l\'annexion ne soit pas à la ياء المتكلم :</strong> « أَبِي » est décliné avec des voyelles supposées (ضمة مقدرة).'
          }
        ],
        solutionSummary: 'Les Cinq Noms se déclinent par les lettres (الواو رفعًا، الألف نصبًا، الياء جرًا) à condition d\'être singuliers et annexés à autre chose que la yaa de 1ère personne.',
        pitfalls: [
          'Confondre « ذُو » (possesseur, de la liste des 5 noms) avec « الَّذِي » (pronom relatif).',
          'Appliquer les lettres à « أَبِي » (mon père) : avec ياء المتكلم, la déclinaison redevient تقديرية (voyelles implicites).'
        ],
        keyTakeaway: 'تُرفع الأسماء الخمسة بالواو وتُنصب بالألف وتُجر بالياء بشرط أن تكون مفردة ومضافة إلى غير ياء المتكلم.',
        checklist: [
          'J\'ai relevé les 3 termes : أَبُوكَ، ذَا، حَمَاكَ',
          'J\'ai précisé le Wâw pour اسم كان et l\'Alif pour les termes au cas accusatif',
          'J\'ai cité les conditions : être au singulier et être annexé à un complément autre que ياء المتكلم'
        ]
      },
      {
        id: 'ar-4',
        title: 'Stylistique et Rhétorique : La métaphore (البلاغة : التشبيه والاستعارة)',
        subject: 'Langue arabe',
        difficulty: 'Avancé',
        category: 'Rhétorique & Éloquence (البلاغة)',
        estimatedTime: '18 min',
        points: 45,
        objective: 'Distinguer le sens propre (الحقيقة) du sens figuré (المجاز), décomposer les éléments de la métaphore et identifier s\'il s\'agit d\'une استعارة تصريحية ou مكنية.',
        contextType: 'arabic',
        contextContent: 'قَالَ الشَّاعِرُ يَصِفُ عَالِمًا كَرِيمًا : « فَاضَ بَحْرُ جُودِهِ عَلَى السَّائِلِينَ، وَأَشْرَقَتْ شَمْسُ حِكْمَتِهِ فِي الدُّجَى. »',
        contextTranslation: 'Le poète dit pour louer un savant généreux : « L\'océan de sa générosité a débordé sur les demandeurs, et le soleil de sa sagesse a illuminé les ténèbres. »',
        questions: [
          'Dans l\'expression « بَحْرُ جُودِهِ », explique pourquoi il s\'agit d\'une figure de style et nomme le type de comparaison (تشبيه بليغ).',
          'Dans « أَشْرَقَتْ شَمْسُ حِكْمَتِهِ فِي الدُّجَى », que représentent au sens figuré « الشَّمْس » et « الدُّجَى » (l\'obscurité) ?',
          'Explique la différence fondamentale en rhétorique arabe entre la métaphore déclarative (الاستعارة التصريحية) et la métaphore par omission (الاستعارة المكنية).'
        ],
        hints: [
          {
            title: 'Indice 1 : Les composantes du تشبيه',
            content: 'Le تشبيه بليغ est une comparaison dont on a supprimé à la fois l\'outil de comparaison (أداة التشبيه comme كـ / مثل) et le point commun (وجه الشبه).'
          },
          {
            title: 'Indice 2 : Rôle du contexte (القرينة)',
            content: 'Une métaphore (استعارة) est une comparaison où l\'un des deux termes essentiels (soit le مشبه soit le مشبه به) a été effacé.'
          },
          {
            title: 'Indice 3 : التصريحية vs المكنية',
            content: 'Si on mentionne explicitement le comparant (المشبه به) en effaçant le comparé, c\'est تصريحية. Si on mentionne le comparé et qu\'on efface le comparant en laissant un attribut, c\'est مكنية.'
          }
        ],
        solutionSteps: [
          {
            label: 'Étape 1 : Analyse de « بَحْرُ جُودِهِ »',
            detail: 'Il s\'agit d\'un <strong>تشبيه بليغ</strong> constitué par l\'annexion du comparant au comparé (إضافة المشبه به إلى المشبه). Le poète compare la générosité (الجود) à un océan (البحر) sans outil de comparaison (مثل) ni mention explicite du point commun (السعة والكثرة).'
          },
          {
            label: 'Étape 2 : Interprétation figurative',
            detail: '• <strong>شَمْسُ حِكْمَتِهِ :</strong> La sagesse est assimilée au soleil pour sa clarté et sa faculté à guider.<br>• <strong>الدُّجَى :</strong> L\'obscurité est une métaphore déclarative (استعارة تصريحية) désignant <em>l\'ignorance (الجهل)</em> ou l\'égarement.'
          },
          {
            label: 'Étape 3 : Distinction technique التصريحية / المكنية',
            detail: '• <strong>الاستعارة التصريحية :</strong> Le comparant (المشبه به) est déclaré explicitement et le comparé (المشبه) est sous-entendu (ex: « رأيت أسداً يخطب » -> le lion désigne le brave orateur).<br>• <strong>الاستعارة المكنية :</strong> Le comparé est mentionné, le comparant est supprimé, mais on conserve l\'un de ses traits distinctifs (ex: « نطق التاريخ » -> l\'histoire est comparée à un être humain doué de parole).'
          }
        ],
        solutionSummary: 'La métaphore est un تشبيه tronqué. La تصريحية conserve le مشبه به alors que la مكنية conserve le مشبه avec un attribut du مشبه به.',
        pitfalls: [
          'Confondre le المشبه (l\'objet réel que l\'on décrit) et le المشبه به (l\'image poétique utilisée pour comparer).',
          'Oublier de préciser la قرينة (l\'indice contextuel qui empêche de prendre la phrase au sens propre).'
        ],
        keyTakeaway: 'الاستعارة تشبيه حُذف أحد طرفيه : تصريحية إن صُرّح بالمشبه به، ومكنية إن حُذف المشبه به ورُمز له بشيء من لوازمه.',
        checklist: [
          'J\'ai qualifié « بَحْرُ جُودِهِ » de تشبيه بليغ par annexion',
          'J\'ai interprété « الدُّجَى » comme métaphore de l\'ignorance',
          'J\'ai expliqué avec clarté la différence entre استعارة تصريحية et استعارة مكنية'
        ]
      }
    ],

    'informatique': [
      {
        id: 'info-1',
        title: 'Algorithme de recherche d\'extremum et calcul de moyenne',
        subject: 'Informatique & algorithmique',
        difficulty: 'Débutant',
        category: 'Algorithmique fondamentale',
        estimatedTime: '12 min',
        points: 30,
        objective: 'Concevoir un algorithme robuste avec gestion des cas limites (tableau vide), calcul d\'accumulateur et invariant de boucle.',
        contextType: 'code',
        contextContent: 'Signature : function analyserNotes(notes: number[]): { moyenne: number, noteMax: number, noteMin: number }',
        contextTranslation: 'Entrée : tableau de nombres réels (notes d\'un élève entre 0 et 20). Sortie : objet contenant la moyenne, la note la plus haute et la plus basse.',
        questions: [
          'Quel comportement l\'algorithme doit-il adopter si le tableau d\'entrée est vide ? Quelle valeur d\'erreur ou exception retourner ?',
          'Écris l\'algorithme complet (en pseudo-code ou en JavaScript / Python) en effectuant le calcul en une seule passe linéaire O(n).',
          'Justifie la complexité temporelle et spatiale de ton algorithme.'
        ],
        hints: [
          {
            title: 'Indice 1 : Initialisation de l\'accumulateur',
            content: 'Ne commence pas noteMax à 0 ou noteMin à 20 en dur si la fonction peut recevoir des nombres négatifs ou quelconques. Initialise avec la première valeur notes[0].'
          },
          {
            title: 'Indice 2 : Une seule boucle',
            content: 'Inutile de faire trois boucles séparées. Un seul parcours "for" permet de sommer les éléments et de mettre à jour min et max simultanément.'
          },
          {
            title: 'Indice 3 : Cas tableau vide',
            content: 'Vérifie "if (!notes || notes.length === 0)" dès la première ligne pour lever une exception ou renvoyer null.'
          }
        ],
        solutionSteps: [
          {
            label: 'Étape 1 : Spécification et garde de validation',
            detail: 'On teste la taille du tableau. Si <code>notes.length === 0</code>, la moyenne n\'est pas définie mathématiquement (division par zéro). On lève une <code>Error("Le tableau ne peut pas être vide")</code> ou on renvoie <code>null</code>.'
          },
          {
            label: 'Étape 2 : Implémentation en une seule boucle O(n)',
            detail: '<pre style="background:#1e293b; color:#e2e8f0; padding:0.75rem; border-radius:8px; font-size:0.85rem;"><code>function analyserNotes(notes) {\n  if (!notes || notes.length === 0) return null;\n\n  let somme = 0;\n  let max = notes[0];\n  let min = notes[0];\n\n  for (let i = 0; i < notes.length; i++) {\n    const note = notes[i];\n    somme += note;\n    if (note > max) max = note;\n    if (note < min) min = note;\n  }\n\n  return {\n    moyenne: Math.round((somme / notes.length) * 100) / 100,\n    noteMax: max,\n    noteMin: min\n  };\n}</code></pre>'
          },
          {
            label: 'Étape 3 : Analyse des complexités',
            detail: '• <strong>Complexité temporelle :</strong> O(n) où n est le nombre de notes car chaque élément est visité exactement une fois.<br>• <strong>Complexité spatiale :</strong> O(1) en mémoire auxiliaire car seules trois variables scalaires (somme, max, min) sont allouées.'
          }
        ],
        solutionSummary: 'Un algorithme d\'agrégation linéaire O(n) avec O(1) de mémoire garantit une performance optimale et évite la division par zéro.',
        pitfalls: [
          'Initialiser noteMin à 0 (si toutes les notes sont positives mais supérieures à 0, le minimum resterait faussement à 0).',
          'Faire 3 boucles successives ou utiliser des méthodes multiples qui augmentent inutilement les passages mémoire.'
        ],
        keyTakeaway: 'Toujours tester les cas limites (tableau vide ou un seul élément) et initialiser les extremums sur le premier élément de la liste.',
        checklist: [
          'J\'ai géré le cas d\'un tableau vide au début de la fonction',
          'J\'ai initialisé max et min avec le premier élément notes[0]',
          'Mon algorithme s\'exécute en une seule boucle (temps linéaire O(n))'
        ]
      },
      {
        id: 'info-2',
        title: 'Récursivité et pile d\'appels (Détection de Palindrome)',
        subject: 'Informatique & algorithmique',
        difficulty: 'Intermédiaire',
        category: 'Structures de contrôle & Récursivité',
        estimatedTime: '15 min',
        points: 35,
        objective: 'Maîtriser la construction d\'un algorithme récursif : condition d\'arrêt (cas de base), réduction du problème et analyse de la pile d\'appels.',
        contextType: 'code',
        contextContent: 'Problème : Écrire une fonction récursive `estPalindrome(mot: string): boolean` qui détermine si une chaîne est identique à l\'endroit et à l\'envers.',
        contextTranslation: 'Exemples : "kayak" -> true, "radar" -> true, "algorithme" -> false, "a" -> true, "" -> true.',
        questions: [
          'Quels sont les deux cas de base (conditions d\'arrêt) indispensables pour cet algorithme ?',
          'Écris le code récursif complet de la fonction en traitant les caractères d\'extrémité.',
          'Trace pas-à-pas la pile d\'appels (call stack) pour l\'appel `estPalindrome("kayak")`.'
        ],
        hints: [
          {
            title: 'Indice 1 : Cas d\'arrêt triviaux',
            content: 'Une chaîne vide ("") ou d\'un seul caractère ("a") est toujours un palindrome par définition (longueur <= 1).'
          },
          {
            title: 'Indice 2 : Réduction du problème',
            content: 'Si le premier et le dernier caractère sont identiques, le problème revient à tester la sous-chaîne privée de ses deux extrémités.'
          },
          {
            title: 'Indice 3 : Sous-chaîne en JS/Python',
            content: 'En JS : mot.slice(1, -1). En Python : mot[1:-1].'
          }
        ],
        solutionSteps: [
          {
            label: 'Étape 1 : Formalisation des cas de base',
            detail: 'Si <code>mot.length <= 1</code>, on retourne immédiatement <code>true</code>. Si <code>mot[0] !== mot[mot.length - 1]</code>, on retourne immédiatement <code>false</code>.'
          },
          {
            label: 'Étape 2 : Implémentation récursive',
            detail: '<pre style="background:#1e293b; color:#e2e8f0; padding:0.75rem; border-radius:8px; font-size:0.85rem;"><code>function estPalindrome(mot) {\n  mot = mot.toLowerCase();\n  // Cas de base\n  if (mot.length <= 1) return true;\n  // Comparaison des extrémités\n  if (mot[0] !== mot[mot.length - 1]) return false;\n  // Appel récursif sur le mot tronqué\n  return estPalindrome(mot.slice(1, -1));\n}</code></pre>'
          },
          {
            label: 'Étape 3 : Déroulé de la pile pour "kayak"',
            detail: '1. <code>estPalindrome("kayak")</code> : \'k\' === \'k\' -> appelle <code>estPalindrome("aya")</code><br>2. <code>estPalindrome("aya")</code> : \'a\' === \'a\' -> appelle <code>estPalindrome("y")</code><br>3. <code>estPalindrome("y")</code> : longueur = 1 -> cas de base atteint, renvoie <code>true</code><br>Les appels se dépilent et renvoient <code>true</code>.'
          }
        ],
        solutionSummary: 'Un algorithme récursif divise le problème en vérifiant les extrémités puis en déléguant le reste à une sous-chaîne plus courte.',
        pitfalls: [
          'Oublier le cas de base où longueur = 0 (boucle infinie et dépassement de pile Maximum call stack size exceeded).',
          'Oublier de normaliser la casse (.toLowerCase()).'
        ],
        keyTakeaway: 'Tout algorithme récursif doit obligatoirement converger vers un cas de base atteignable pour éviter le débordement de pile.',
        checklist: [
          'J\'ai défini le cas d\'arrêt pour une chaîne vide ou d\'une lettre (length <= 1)',
          'J\'ai vérifié l\'égalité du premier et du dernier caractère',
          'J\'ai tracé la pile d\'appels pour "kayak" jusqu\'au cas de base'
        ]
      },
      {
        id: 'info-3',
        title: 'Requêtes SQL complexes : Jointures, GROUP BY et HAVING',
        subject: 'Informatique & algorithmique',
        difficulty: 'Intermédiaire',
        category: 'Bases de données & SQL',
        estimatedTime: '16 min',
        points: 40,
        objective: 'Maîtriser l\'articulation entre clauses WHERE, GROUP BY, fonctions d\'agrégation (AVG, COUNT) et filtrage post-agrégation avec HAVING.',
        contextType: 'code',
        contextContent: `Tables du schéma relationnel :
• etudiants (id, nom, prenom, filiere_id)
• filieres (id, nom_filiere, departement)
• notes (id, etudiant_id, matiere, valeur)`,
        contextTranslation: 'Objectif : Obtenir pour chaque filière son nom, le nombre total d\'étudiants et la moyenne générale des notes, uniquement pour les filières comptant au moins 3 étudiants inscrits, triées de la meilleure moyenne à la plus basse.',
        questions: [
          'Quelle est la différence fondamentale entre la clause WHERE et la clause HAVING ?',
          'Écris la requête SQL complète respectant l\'ensemble des exigences énoncées.',
          'Pourquoi doit-on utiliser `COALESCE` ou `ROUND` pour présenter des résultats propres dans un tableau de bord ?'
        ],
        hints: [
          {
            title: 'Indice 1 : WHERE vs HAVING',
            content: 'WHERE filtre les lignes individuelles avant tout regroupement. HAVING filtre les groupes formés après l\'exécution du GROUP BY.'
          },
          {
            title: 'Indice 2 : Jointures multiples',
            content: 'Il faut joindre la table filieres avec etudiants (ON filieres.id = etudiants.filiere_id), puis avec notes (ON etudiants.id = notes.etudiant_id).'
          },
          {
            title: 'Indice 3 : Tri décroissant',
            content: 'Utilise ORDER BY moyenne_generale DESC.'
          }
        ],
        solutionSteps: [
          {
            label: 'Étape 1 : Règle WHERE vs HAVING',
            detail: '• <strong>WHERE :</strong> s\'applique ligne à ligne avant l\'agrégation. Ne peut pas contenir de fonction d\'agrégation comme <code>COUNT()</code>.<br>• <strong>HAVING :</strong> s\'applique sur les données agrégées produites par <code>GROUP BY</code>.'
          },
          {
            label: 'Étape 2 : Requête SQL complète',
            detail: `<pre style="background:#1e293b; color:#e2e8f0; padding:0.75rem; border-radius:8px; font-size:0.85rem;"><code>SELECT 
  f.nom_filiere,
  COUNT(DISTINCT e.id) AS total_etudiants,
  ROUND(AVG(n.valeur), 2) AS moyenne_generale
FROM filieres f
INNER JOIN etudiants e ON e.filiere_id = f.id
LEFT JOIN notes n ON n.etudiant_id = e.id
GROUP BY f.id, f.nom_filiere
HAVING COUNT(DISTINCT e.id) >= 3
ORDER BY moyenne_generale DESC;</code></pre>`
          },
          {
            label: 'Étape 3 : Justification de COUNT(DISTINCT) et ROUND',
            detail: 'Puisqu\'un étudiant a plusieurs notes, un simple <code>COUNT(e.id)</code> compterait le nombre de notes et non le nombre d\'étudiants uniques. L\'emploi de <code>COUNT(DISTINCT e.id)</code> est donc impératif.'
          }
        ],
        solutionSummary: 'La requête combine INNER/LEFT JOIN avec GROUP BY sur l\'identifiant de filière, filtre les groupes via HAVING et ordonne en DESC.',
        pitfalls: [
          'Mettre <code>WHERE COUNT(e.id) >= 3</code> (erreur de syntaxe SQL classique : une agrégation ne peut pas figurer dans WHERE).',
          'Oublier le <code>DISTINCT</code> dans le COUNT lorsqu\'on joint une table fille 1-N (notes).'
        ],
        keyTakeaway: 'Le cycle d\'exécution SQL traite WHERE avant le GROUP BY, et HAVING après l\'agrégation.',
        checklist: [
          'J\'ai expliqué la différence temporelle et logique entre WHERE et HAVING',
          'J\'ai utilisé GROUP BY sur f.id et f.nom_filiere',
          'J\'ai utilisé HAVING COUNT(DISTINCT ...) >= 3 et ORDER BY DESC'
        ]
      },
      {
        id: 'info-4',
        title: 'Structures de données : Implémentation d\'une File FIFO avec deux Piles LIFO',
        subject: 'Informatique & algorithmique',
        difficulty: 'Avancé',
        category: 'Structures de données & Algorithmique',
        estimatedTime: '20 min',
        points: 50,
        objective: 'Comprendre les mécanismes internes des files (First In First Out) et simuler leur comportement à l\'aide de deux piles (Last In First Out) avec coût amorti O(1).',
        contextType: 'code',
        contextContent: `Contrainte : Vous disposez uniquement de deux piles StackA et StackB qui possèdent les opérations basiques :
• push(x) : empile un élément
• pop() : dépile et retourne le sommet
• isEmpty() : renvoie vrai si la pile est vide`,
        contextTranslation: 'Concevoir la classe QueueWithTwoStacks avec les méthodes enqueue(x) (enfiler) et dequeue() (défiler en respectant l\'ordre d\'arrivée FIFO).',
        questions: [
          'Explique le principe théorique permettant d\'inverser deux fois l\'ordre LIFO pour obtenir un ordre FIFO.',
          'Écris les algorithmes pour `enqueue(x)` et `dequeue()`.',
          'Démontre que le coût amorti de l\'opération `dequeue()` est de O(1) en moyenne.'
        ],
        hints: [
          {
            title: 'Indice 1 : Le rôle des deux piles',
            content: 'Dédie une pile aux entrées (stackInput) et une pile aux sorties (stackOutput).'
          },
          {
            title: 'Indice 2 : Quand transférer les données ?',
            content: 'Ne transfère de stackInput vers stackOutput que lorsque stackOutput est totalement vide ! Pas à chaque appel.'
          },
          {
            title: 'Indice 3 : Coût amorti',
            content: 'Chaque élément est inséré une fois dans stackInput, transféré une seule fois dans stackOutput, puis dépilé une seule fois.'
          }
        ],
        solutionSteps: [
          {
            label: 'Étape 1 : Principe d\'inversion double',
            detail: 'Dépiler les éléments d\'une pile A pour les empiler dans une pile B inverse leur ordre. Un second dépilement depuis B restitue ainsi l\'ordre initial d\'arrivée (FIFO).'
          },
          {
            label: 'Étape 2 : Implémentation complète',
            detail: `<pre style="background:#1e293b; color:#e2e8f0; padding:0.75rem; border-radius:8px; font-size:0.85rem;"><code>class QueueWithTwoStacks {\n  constructor() {\n    this.stackInput = [];  // Pour enqueue\n    this.stackOutput = []; // Pour dequeue\n  }\n\n  enqueue(x) {\n    this.stackInput.push(x); // O(1)\n  }\n\n  dequeue() {\n    // Si la pile de sortie est vide, transférer tout le contenu de input\n    if (this.stackOutput.length === 0) {\n      while (this.stackInput.length > 0) {\n        this.stackOutput.push(this.stackInput.pop());\n      }\n    }\n    if (this.stackOutput.length === 0) {\n      throw new Error("File vide");\n    }\n    return this.stackOutput.pop();\n  }\n}</code></pre>`
          },
          {
            label: 'Étape 3 : Preuve du coût amorti O(1)',
            detail: 'Bien qu\'un appel occasionnel à <code>dequeue()</code> coûte O(n) lors du transfert, chaque élément subit exactement 3 opérations au cours de sa vie : 1 push dans input, 1 pop de input, 1 push dans output, 1 pop de output. Le coût par élément est donc une constante $c$, soit un <strong>coût amorti O(1)</strong>.'
          }
        ],
        solutionSummary: 'Deux piles LIFO combinées forment une file FIFO performante avec un transfert paresseux (lazy transfer) garantissant O(1) amorti.',
        pitfalls: [
          'Re-transférer les éléments dans la pile d\'entrée après chaque dequeue (ce qui transformerait la complexité en O(n) systématique).',
          'Oublier de vérifier si les deux piles sont vides avant de tenter de dépiler.'
        ],
        keyTakeaway: 'Le transfert paresseux (lazy transfer) uniquement lorsque la pile de sortie est vide permet d\'obtenir une complexité amortie optimale en O(1).',
        checklist: [
          'J\'ai séparé les deux piles en rôle entrée (input) et rôle sortie (output)',
          'J\'ai transféré les éléments uniquement lorsque la pile de sortie est vide',
          'J\'ai justifié le coût amorti O(1) par élément'
        ]
      }
    ],

    'mathematiques': [
      {
        id: 'math-1',
        title: 'Dérivation de polynômes et équation de la tangente',
        subject: 'Mathématiques',
        difficulty: 'Débutant',
        category: 'Analyse fonctionnelle',
        estimatedTime: '12 min',
        points: 30,
        objective: 'Calculer la dérivée d\'une fonction polynomiale du 3ème degré, déterminer les points à tangente horizontale et établir l\'équation réduite d\'une tangente.',
        contextType: 'math',
        contextContent: 'Soit la fonction f définie sur ℝ par : f(x) = 2x³ - 3x² - 12x + 8.',
        contextTranslation: 'On note (C) la courbe représentative de f dans un repère orthonormé.',
        questions: [
          'Calcule la dérivée f\'(x) pour tout réel x.',
          'Résous l\'équation f\'(x) = 0 et donne les coordonnées exactes des points où la tangente est horizontale.',
          'Détermine l\'équation réduite de la tangente (T) à la courbe au point d\'abscisse x₀ = 0.'
        ],
        hints: [
          {
            title: 'Indice 1 : Règle de dérivation',
            content: 'Pour tout entier n, (xⁿ)\' = n·xⁿ⁻¹. Dérive chaque monôme terme à terme.'
          },
          {
            title: 'Indice 2 : Tangente horizontale',
            content: 'Une tangente est horizontale si et seulement si son coefficient directeur est nul, c\'est-à-dire f\'(x) = 0.'
          },
          {
            title: 'Indice 3 : Formule de la tangente',
            content: 'L\'équation générale de la tangente en x₀ est : y = f\'(x₀)(x - x₀) + f(x₀).'
          }
        ],
        solutionSteps: [
          {
            label: 'Étape 1 : Calcul de la dérivée f\'(x)',
            detail: 'f\'(x) = 2 × (3x²) - 3 × (2x) - 12 × (1) + 0 = <strong>6x² - 6x - 12</strong>.<br>On peut factoriser par 6 : f\'(x) = 6(x² - x - 2).'
          },
          {
            label: 'Étape 2 : Résolution de f\'(x) = 0',
            detail: 'x² - x - 2 = 0. Discriminant Δ = (-1)² - 4(1)(-2) = 1 + 8 = 9 = 3².<br>Racines : x₁ = (1 - 3) / 2 = <strong>-1</strong> et x₂ = (1 + 3) / 2 = <strong>2</strong>.<br>Points à tangente horizontale :<br>• A(-1, f(-1)) : f(-1) = 2(-1) - 3(1) + 12 + 8 = <strong>15</strong> -> A(-1, 15)<br>• B(2, f(2)) : f(2) = 16 - 12 - 24 + 8 = <strong>-12</strong> -> B(2, -12).'
          },
          {
            label: 'Étape 3 : Équation de la tangente en x₀ = 0',
            detail: '• f(0) = 8<br>• f\'(0) = -12<br>Formule : y = f\'(0)(x - 0) + f(0) => <strong>y = -12x + 8</strong>.'
          }
        ],
        solutionSummary: 'La dérivée est f\'(x) = 6x² - 6x - 12. Les extremums locaux sont en x = -1 et x = 2, et la tangente en 0 a pour équation y = -12x + 8.',
        pitfalls: [
          'Oublier de multiplier la constante devant xⁿ par l\'exposant (ex: dériver 2x³ en 3x² au lieu de 6x²).',
          'Confondre l\'abscisse x₀ et l\'ordonnée f(x₀) dans la formule de la tangente.'
        ],
        keyTakeaway: 'Le nombre dérivé f\'(a) donne la pente de la tangente au point d\'abscisse a : y = f\'(a)(x - a) + f(a).',
        checklist: [
          'J\'ai obtenu la dérivée f\'(x) = 6x² - 6x - 12',
          'J\'ai trouvé les deux racines x = -1 et x = 2 avec leurs ordonnées respectives',
          'J\'ai calculé l\'équation réduite exacte y = -12x + 8'
        ]
      },
      {
        id: 'math-2',
        title: 'Étude de variations et Théorème des Valeurs Intermédiaires (TVI)',
        subject: 'Mathématiques',
        difficulty: 'Intermédiaire',
        category: 'Analyse & Continuité',
        estimatedTime: '16 min',
        points: 40,
        objective: 'Dresser un tableau de variations complet et appliquer avec rigueur le corollaire du TVI (théorème de la bijection) pour démontrer l\'unicité d\'une solution.',
        contextType: 'math',
        contextContent: 'Soit g la fonction définie sur [0, 2] par g(x) = x³ + 4x - 5.',
        contextTranslation: 'On cherche à étudier l\'équation g(x) = 0.',
        questions: [
          'Démontre que la fonction g est strictement croissante sur l\'intervalle [0, 2].',
          'Calcule g(0) et g(2).',
          'Démontre, en énonçant toutes les hypothèses nécessaires, que l\'équation g(x) = 0 admet une unique solution α sur [0, 2], et détermine la valeur exacte de α.'
        ],
        hints: [
          {
            title: 'Indice 1 : Signe de la dérivée',
            content: 'Calcule g\'(x) et montre qu\'elle est strictement positive pour tout x appartenant à [0, 2].'
          },
          {
            title: 'Indice 2 : Les trois conditions du TVI',
            content: '1) Continuité sur l\'intervalle, 2) Strictement monotone, 3) Le nombre cible (0) est compris entre les images des bornes.'
          },
          {
            title: 'Indice 3 : Racine évidente',
            content: 'Teste les entiers simples (0, 1, 2) pour trouver la solution exacte α.'
          }
        ],
        solutionSteps: [
          {
            label: 'Étape 1 : Calcul de g\'(x) et variations',
            detail: 'g\'(x) = 3x² + 4.<br>Pour tout x ∈ [0, 2], x² ≥ 0 donc 3x² ≥ 0, d\'où <strong>g\'(x) ≥ 4 > 0</strong>.<br>La dérivée étant strictement positive, <strong>g est strictement croissante sur [0, 2]</strong>.'
          },
          {
            label: 'Étape 2 : Images des bornes',
            detail: '• g(0) = 0³ + 4(0) - 5 = <strong>-5</strong><br>• g(2) = 2³ + 4(2) - 5 = 8 + 8 - 5 = <strong>11</strong>'
          },
          {
            label: 'Étape 3 : Application rigoureuse du TVI',
            detail: '1. g est une fonction polynôme, donc <strong>continue sur [0, 2]</strong>.<br>2. g est <strong>strictement croissante sur [0, 2]</strong>.<br>3. g(0) = -5 < 0 et g(2) = 11 > 0, donc <strong>0 ∈ [-5, 11]</strong>.<br>D\'après le corollaire du TVI (théorème de la bijection), l\'équation g(x) = 0 admet une unique solution α sur [0, 2].<br>Valeur exacte : g(1) = 1 + 4 - 5 = 0, donc <strong>α = 1</strong>.'
          }
        ],
        solutionSummary: 'Continuité + stricte monotonie + changement de signe garantissent l\'existence et l\'unicité de la solution α = 1.',
        pitfalls: [
          'Oublier de mentionner la continuité (condition fondamentale pour appliquer le TVI).',
          'Oublier de préciser la "stricte" monotonie pour prouver l\'unicité (sans stricte monotonie, on ne prouve que l\'existence).'
        ],
        keyTakeaway: 'Une fonction continue et strictement monotone sur [a, b] réalise une bijection de [a, b] sur [f(a), f(b)].',
        checklist: [
          'J\'ai calculé g\'(x) = 3x² + 4 et justifié sa positivité stricte',
          'J\'ai vérifié les images des bornes g(0) = -5 et g(2) = 11',
          'J\'ai cité les 3 hypothèses du TVI (continuité, stricte croissance, 0 encadré) et trouvé α = 1'
        ]
      }
    ],

    'biologie': [
      {
        id: 'bio-1',
        title: 'Comparaison Cellule Animale vs Cellule Végétale',
        subject: 'Biologie cellulaire',
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
      }
    ],

    'anglais': [
      {
        id: 'eng-1',
        title: 'Present Simple vs Present Continuous & Stative Verbs',
        subject: 'Anglais',
        difficulty: 'Débutant',
        category: 'Grammaire & Conjugaison',
        estimatedTime: '10 min',
        points: 25,
        objective: 'Distinguer les habitudes permanentes des actions en cours, et maîtriser l\'exception des verbes d\'état (stative verbs).',
        contextType: 'text',
        contextContent: '1. Look! The sun (rise) over the mountains.\n2. She usually (walk) to school, but today she (take) the bus.\n3. I (believe) what you are saying.',
        contextTranslation: 'Mettre les verbes entre parenthèses au temps approprié et justifier.',
        questions: [
          'Complète la phrase 1 en choisissant le bon aspect (Simple ou Continuous) et justifie grâce au marqueur temporel.',
          'Complète la phrase 2 en expliquant le contraste entre l\'habitude et l\'exception temporaire.',
          'Pourquoi le verbe "believe" dans la phrase 3 ne s\'emploie-t-il pas à la forme en -ing ?'
        ],
        hints: [
          {
            title: 'Indice 1 : Marqueurs temporels',
            content: '"Look!" indique une action en cours de déroulement sous les yeux. "Usually" indique une habitude régulière.'
          },
          {
            title: 'Indice 2 : Stative verbs',
            content: 'Les verbes de sentiment, d\'opinion ou de perception (know, believe, understand, love) ne s\'emploient pas au continu.'
          }
        ],
        solutionSteps: [
          {
            label: 'Étape 1 : Action en cours',
            detail: '1. "Look! The sun <strong>is rising</strong> over the mountains." ("Look!" signale une action immédiate).'
          },
          {
            label: 'Étape 2 : Habitude vs rupture temporaire',
            detail: '2. "She usually <strong>walks</strong> to school (habitude -> Present Simple avec -s), but today she <strong>is taking</strong> the bus (exception temporaire -> Present Continuous)."'
          },
          {
            label: 'Étape 3 : Verbe d\'état (Stative verb)',
            detail: '3. "I <strong>believe</strong> what you are saying." (Le verbe "believe" exprime une opinion/état d\'esprit, il ne prend pas de forme progressive).'
          }
        ],
        solutionSummary: 'Present Simple pour les habitudes et états permanents ; Present Continuous pour les actions en cours et exceptions temporaires.',
        pitfalls: [
          'Oublier le "s" à la 3e personne du singulier au Present Simple (she walks).',
          'Dire "I am believing" (erreur d\'anglicisme fréquent).'
        ],
        keyTakeaway: 'Habitude/Vérité générale = Simple Present ; Action en cours = BE + -ING ; Verbes d\'état = Pas de forme progressive.',
        checklist: [
          'J\'ai conjugué "is rising" avec l\'auxiliaire BE',
          'J\'ai distingué "walks" et "is taking"',
          'J\'ai identifié "believe" comme un verbe d\'état invariable au continu'
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

    // Listen to profile subjects
    this.profile.active$.subscribe(p => {
      if (p && p.subjects && p.subjects.length > 0) {
        this.availableSubjects = Array.from(new Set([...p.subjects, ...this.availableSubjects]));
        if (!this.currentSubject || !this.availableSubjects.includes(this.currentSubject)) {
          this.setSubjectInternal(p.subjects[0]);
        }
      }
    });
  }

  get currentExercises(): ExerciseItem[] {
    const sLower = (this.currentSubject || '').toLowerCase().trim();
    for (const key of Object.keys(this.exerciseBanks)) {
      if (sLower.includes(key) || key.includes(sLower)) {
        return this.exerciseBanks[key];
      }
    }
    // Fallback: search in keys
    if (sLower.includes('arab') || sLower.includes('ar')) return this.exerciseBanks['arabe'];
    if (sLower.includes('info') || sLower.includes('algo') || sLower.includes('code')) return this.exerciseBanks['informatique'];
    if (sLower.includes('math')) return this.exerciseBanks['mathematiques'];
    if (sLower.includes('bio') || sLower.includes('svt')) return this.exerciseBanks['biologie'];
    if (sLower.includes('anglais') || sLower.includes('eng')) return this.exerciseBanks['anglais'];

    // Default to arabe if active
    return this.exerciseBanks['arabe'];
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
    const sLower = subj.toLowerCase();
    for (const key of Object.keys(this.exerciseBanks)) {
      if (sLower.includes(key) || key.includes(sLower)) {
        return this.exerciseBanks[key].length;
      }
    }
    return 2;
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
      if (allChecked) {
        this.completedExercises[exerciseId] = true;
      }
    }
    this.savePersistedData();
  }

  getEvaluationScore(exerciseId: string): number {
    const group = this.checkedCriteria[exerciseId];
    if (!group) return 0;
    return Object.values(group).filter(Boolean).length;
  }

  insertChar(char: string): void {
    const current = this.userDrafts[this.selectedExerciseId] || '';
    this.userDrafts[this.selectedExerciseId] = current + char;
    this.saveDraft(this.selectedExerciseId);
    if (this.workspaceArea) {
      this.workspaceArea.nativeElement.focus();
    }
  }

  insertSnippet(code: string): void {
    const current = this.userDrafts[this.selectedExerciseId] || '';
    this.userDrafts[this.selectedExerciseId] = current + (current ? '\n' : '') + code;
    this.saveDraft(this.selectedExerciseId);
    if (this.workspaceArea) {
      this.workspaceArea.nativeElement.focus();
    }
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
    return text.trim().split(/\\s+/).length;
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

  evaluateDraftWithAi(ex: ExerciseItem): void {
    const draft = this.userDrafts[ex.id];
    if (!draft || !draft.trim()) return;

    this.isEvaluatingDraft = true;
    this.currentDraftEvaluation = null;

    this.aiLearning.evaluateExerciseDraft(ex, draft).subscribe({
      next: (res) => {
        this.currentDraftEvaluation = res;
        this.isEvaluatingDraft = false;
        if (res.updatedProgress) {
          this.adaptiveDifficulty = res.updatedProgress.adaptiveDifficulty;
          this.adaptiveLevelIndex = res.updatedProgress.levelIndex;
          this.generatorDifficulty = (this.adaptiveDifficulty as any) || 'Débutant';
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
      next: (newExercise: ExerciseItem) => {
        this.isGeneratingExercise = false;
        if (!newExercise || !newExercise.id) return;

        // Add to subject bank
        const sLower = this.currentSubject.toLowerCase();
        let added = false;
        for (const key of Object.keys(this.exerciseBanks)) {
          if (sLower.includes(key) || key.includes(sLower)) {
            this.exerciseBanks[key].unshift(newExercise);
            added = true;
            break;
          }
        }
        if (!added) {
          // Fallback
          const firstKey = Object.keys(this.exerciseBanks)[0];
          if (firstKey) {
            this.exerciseBanks[firstKey].unshift(newExercise);
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
      },
      error: (err) => {
        console.warn('AI exercise generation failed:', err);
        this.isGeneratingExercise = false;
        this.closeGeneratorModal();
      }
    });
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
      // Restore custom generated exercises
      const savedCustom = localStorage.getItem('tutorai_custom_exercises');
      if (savedCustom) {
        const customList: ExerciseItem[] = JSON.parse(savedCustom);
        for (const ex of customList) {
          const sLower = (ex.subject || '').toLowerCase();
          for (const key of Object.keys(this.exerciseBanks)) {
            if (sLower.includes(key) || key.includes(sLower)) {
              if (!this.exerciseBanks[key].some(e => e.id === ex.id)) {
                this.exerciseBanks[key].unshift(ex);
              }
              break;
            }
          }
        }
      }
      // Drafts
      for (const group of Object.values(this.exerciseBanks)) {
        for (const ex of group) {
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
