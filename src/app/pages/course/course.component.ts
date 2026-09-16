import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { Subscription } from 'rxjs';
import { ProfileService } from '../../core/services/profile.service';
import { UserProfile } from '../../core/models/user-profile.model';

export interface CourseTip {
  icon: string;
  badge: string;
  type: 'memo' | 'exam' | 'rule';
  title: string;
  description: string;
}

export interface CourseChapter {
  id: string;
  title: string;
  duration: string;
  level: string;
  summary: string;
  tips: CourseTip[];
  keyPoints: string[];
  rulesOrFormulas: string[];
  caseExample: string;
  pitfalls: string[];
}

export interface SubjectCourseData {
  subject: string;
  category: string;
  description: string;
  chapters: CourseChapter[];
}

@Component({
  selector: 'app-course',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, MatIconModule],
  template: `
    <section class="learning-page page-enter">
      <!-- ─── Header ─────────────────────────────────────────── -->
      <header class="learning-page__header">
        <div class="header-content">
          <div class="header-badges">
            <span class="badge badge--accent">
              <mat-icon class="badge-icon">lightbulb</mat-icon>
              Fiches & Tips de Révision
            </span>
            <span *ngIf="profile" class="badge badge--neutral">
              {{ profile.educationLevel }} {{ profile.studyYear ? '• ' + profile.studyYear : '' }}
            </span>
          </div>
          <h1 class="learning-page__title">Mes Cours & Astuces Clés</h1>
          <p class="learning-page__copy">
            Choisis ta matière pour découvrir les résumés de cours essentiels, moyens mnémotechniques et astuces d'examen.
          </p>
        </div>
      </header>

      <!-- ─── 1. Transition entre les matières inscrites ──────────────── -->
      <div class="surface subject-selector-card">
        <div class="selector-header">
          <div class="selector-title">
            <mat-icon class="section-icon">swap_horiz</mat-icon>
            <span>Mes matières :</span>
          </div>
          <span class="subject-count">{{ availableSubjects.length }} matière{{ availableSubjects.length > 1 ? 's' : '' }}</span>
        </div>

        <div class="subject-chips-container">
          <button
            *ngFor="let subj of availableSubjects"
            type="button"
            class="chip subject-chip"
            [class.is-active]="selectedSubject === subj"
            (click)="selectSubject(subj)"
          >
            <mat-icon class="chip-icon">{{ getSubjectIcon(subj) }}</mat-icon>
            <span class="chip-label">{{ subj }}</span>
          </button>
        </div>
      </div>

      <!-- ─── 2. Contenu du Cours & Fiche Tips ───────────────────────── -->
      <div class="course-workspace-grid" *ngIf="currentCourseData">
        
        <!-- Colonne Gauche : Sommaire des Chapitres -->
        <aside
          class="surface chapters-sidebar"
          [class.arabic-mode]="isArabicSubject(selectedSubject)"
          [attr.dir]="isArabicSubject(selectedSubject) ? 'rtl' : 'ltr'"
        >
          <div class="chapters-header">
            <h2 class="chapters-heading">
              <mat-icon class="heading-icon">format_list_bulleted</mat-icon>
              <span>{{ isArabicSubject(selectedSubject) ? 'فُصُولُ الدَّرْسِ' : 'Chapitres' }}</span>
            </h2>
            <span class="chapters-badge">
              {{ currentCourseData.chapters.length }} {{ isArabicSubject(selectedSubject) ? 'فصول' : 'chapitres' }}
            </span>
          </div>

          <!-- Recherche dans les chapitres -->
          <div class="search-input-wrapper">
            <mat-icon class="search-icon">search</mat-icon>
            <input
              type="text"
              class="search-input"
              [(ngModel)]="searchChapterQuery"
              [placeholder]="isArabicSubject(selectedSubject) ? 'ابحث عن مفهوم أو درس...' : 'Chercher une notion...'"
            />
            <button *ngIf="searchChapterQuery" class="clear-btn" (click)="searchChapterQuery = ''">✕</button>
          </div>

          <!-- Liste des chapitres -->
          <div class="chapters-list">
            <div
              *ngFor="let ch of filteredChapters; let idx = index"
              class="chapter-item"
              [class.is-active]="selectedChapter?.id === ch.id"
              (click)="selectChapter(ch)"
            >
              <div class="ch-number">0{{ idx + 1 }}</div>
              <div class="ch-details">
                <div class="ch-title" [class.arabic-font]="isArabicText(ch.title)">{{ ch.title }}</div>
                <div class="ch-meta">
                  <span class="ch-time">
                    <mat-icon class="tiny-icon">schedule</mat-icon>
                    {{ ch.duration }}
                  </span>
                  <span class="ch-level-tag">{{ ch.level }}</span>
                </div>
              </div>
            </div>

            <div *ngIf="filteredChapters.length === 0" class="empty-search">
              {{ isArabicSubject(selectedSubject) ? 'لا يوجد فصل يطابق « ' + searchChapterQuery + ' »' : 'Aucun chapitre correspondant à « ' + searchChapterQuery + ' ».' }}
            </div>
          </div>
        </aside>

        <!-- Colonne Droite : Fiche de Cours & Tips d'apprentissage -->
        <main
          class="chapter-main-panel"
          *ngIf="selectedChapter"
          [class.arabic-mode]="isArabicSubject(selectedSubject)"
          [attr.dir]="isArabicSubject(selectedSubject) ? 'rtl' : 'ltr'"
        >
          
          <!-- ─── Bandeau : Tips & Astuces du Tuteur ─── -->
          <div class="tips-grid" *ngIf="selectedChapter.tips.length > 0">
            <div
              *ngFor="let tip of selectedChapter.tips"
              class="tip-card"
              [class.tip-card--memo]="tip.type === 'memo'"
              [class.tip-card--exam]="tip.type === 'exam'"
              [class.tip-card--rule]="tip.type === 'rule'"
            >
              <div class="tip-card__header">
                <mat-icon class="tip-icon">{{ tip.icon }}</mat-icon>
                <span class="tip-badge">{{ tip.badge }}</span>
              </div>
              <div class="tip-card__title" [class.arabic-font]="isArabicText(tip.title)">{{ tip.title }}</div>
              <div class="tip-card__desc" [class.arabic-font]="isArabicText(tip.description)">{{ tip.description }}</div>
            </div>
          </div>

          <!-- ─── Fiche synthétique du chapitre ─── -->
          <div class="surface lesson-notes-card">
            <div class="lesson-header">
              <div class="lh-left">
                <span class="kicker">
                  {{ isArabicSubject(selectedSubject)
                    ? (selectedSubject + ' • الفصل ' + (currentChapterIndex + 1) + '/' + currentCourseData.chapters.length)
                    : (selectedSubject + ' • Chapitre ' + (currentChapterIndex + 1) + '/' + currentCourseData.chapters.length)
                  }}
                </span>
                <h2 class="lesson-title" [class.arabic-font]="isArabicText(selectedChapter.title)">
                  {{ selectedChapter.title }}
                </h2>
              </div>
              <span class="badge badge--neutral">
                {{ selectedChapter.duration }} {{ isArabicSubject(selectedSubject) ? 'قراءة ومراجعة' : 'de lecture' }}
              </span>
            </div>

            <!-- 1. Vue d'ensemble du cours -->
            <div class="lesson-section">
              <h4 class="section-subheading">
                <mat-icon class="sub-icon">auto_awesome</mat-icon>
                <span>{{ getUnderstandingTitle() }}</span>
              </h4>
              <p class="summary-text" [class.arabic-font]="isArabicText(selectedChapter.summary)">
                {{ selectedChapter.summary }}
              </p>
            </div>

            <!-- 2. Points essentiels à retenir -->
            <div class="lesson-section">
              <h4 class="section-subheading">
                <mat-icon class="sub-icon">check_circle</mat-icon>
                <span>{{ getKeyPointsTitle() }}</span>
              </h4>
              <ul class="keypoints-list">
                <li *ngFor="let pt of selectedChapter.keyPoints" class="keypoint-item">
                  <mat-icon class="check-bullet">arrow_right</mat-icon>
                  <span [class.arabic-font]="isArabicText(pt)">{{ pt }}</span>
                </li>
              </ul>
            </div>

            <!-- 3. Règles fondamentales ou Textes clés -->
            <div class="lesson-section" *ngIf="selectedChapter.rulesOrFormulas.length > 0">
              <h4 class="section-subheading">
                <mat-icon class="sub-icon">bookmark</mat-icon>
                <span>{{ getRulesTitle() }}</span>
              </h4>
              <div class="articles-grid">
                <div *ngFor="let rule of selectedChapter.rulesOrFormulas" class="article-box">
                  <mat-icon class="art-icon">format_quote</mat-icon>
                  <p class="art-text" [class.arabic-font]="isArabicText(rule)">{{ rule }}</p>
                </div>
              </div>
            </div>

            <!-- 4. Cas Pratique d'application -->
            <div class="lesson-section" *ngIf="selectedChapter.caseExample">
              <h4 class="section-subheading">
                <mat-icon class="sub-icon">lightbulb</mat-icon>
                <span>{{ getCaseExampleTitle() }}</span>
              </h4>
              <div class="case-study-box">
                <p class="case-text" [class.arabic-font]="isArabicText(selectedChapter.caseExample)">
                  {{ selectedChapter.caseExample }}
                </p>
              </div>
            </div>

            <!-- 5. Pièges d'examen à éviter -->
            <div class="lesson-section" *ngIf="selectedChapter.pitfalls.length > 0">
              <h4 class="section-subheading pitfalls-heading">
                <mat-icon class="sub-icon danger-icon">warning</mat-icon>
                <span>{{ getPitfallsTitle() }}</span>
              </h4>
              <div class="pitfalls-list">
                <div *ngFor="let pit of selectedChapter.pitfalls" class="pitfall-item">
                  <mat-icon class="pit-bullet">close</mat-icon>
                  <span [class.arabic-font]="isArabicText(pit)">{{ pit }}</span>
                </div>
              </div>
            </div>

            <!-- ─── Navigation entre chapitres ─── -->
            <div class="chapter-navigation-bar">
              <button
                type="button"
                class="btn btn--secondary btn--sm btn--pill"
                *ngIf="prevChapter"
                (click)="goToPrevChapter()"
              >
                <mat-icon class="btn-icon">arrow_back</mat-icon>
                <span>
                  {{ isArabicSubject(selectedSubject) ? 'الفصل السابق : ' : 'Chapitre précédent : ' }}{{ prevChapter.title }}
                </span>
              </button>
              <div class="nav-spacer"></div>
              <button
                type="button"
                class="btn btn--primary btn--sm btn--pill"
                *ngIf="nextChapter"
                (click)="goToNextChapter()"
              >
                <span>
                  {{ isArabicSubject(selectedSubject) ? 'الفصل التالي : ' : 'Chapitre suivant : ' }}{{ nextChapter.title }}
                </span>
                <mat-icon class="btn-icon" style="margin-left: 0.35rem; margin-right: 0;">arrow_forward</mat-icon>
              </button>
            </div>

            <!-- ─── Passerelles d'entraînement ─── -->
            <div class="practice-cta-section">
              <div class="cta-banner">
                <div class="cta-text-group">
                  <h4 class="cta-title">
                    {{ isArabicSubject(selectedSubject) ? 'مُسْتَعِدٌّ لِتَثْبِيتِ هَذَا الدَّرْسِ ؟' : 'Prêt à valider ce chapitre ?' }}
                  </h4>
                  <p class="cta-desc">
                    {{ getPracticeCtaDescription() }}
                  </p>
                </div>
                <div class="cta-actions">
                  <button type="button" class="btn btn--secondary" (click)="goToQuiz()">
                    <mat-icon class="btn-icon">quiz</mat-icon>
                    <span>{{ isArabicSubject(selectedSubject) ? 'إِجْرَاءُ اخْتِبَارِ الكُوِيزْ' : 'Faire le Quiz' }}</span>
                  </button>
                  <button type="button" class="btn btn--secondary" (click)="goToExercises()">
                    <mat-icon class="btn-icon">fitness_center</mat-icon>
                    <span>{{ getExercisesButtonLabel() }}</span>
                  </button>
                  <button type="button" class="btn btn--ghost" (click)="askTutor()">
                    <mat-icon class="btn-icon">smart_toy</mat-icon>
                    <span>{{ isArabicSubject(selectedSubject) ? 'سُؤَالُ المُرَبِّي الذَّكِيِّ' : 'Poser une question au Tuteur IA' }}</span>
                  </button>
                </div>
              </div>
            </div>

          </div>

        </main>
      </div>

      <!-- État vide -->
      <div *ngIf="!currentCourseData" class="surface empty-state-card">
        <mat-icon class="empty-icon">school</mat-icon>
        <h3>Aucun cours disponible</h3>
        <p>Vérifie les matières sélectionnées dans ton profil.</p>
      </div>
    </section>
  `,
  styles: [`
    .header-badges {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      margin-bottom: 0.5rem;
      flex-wrap: wrap;
    }

    .badge-icon {
      font-size: 15px !important;
      width: 15px !important;
      height: 15px !important;
      margin-right: 0.25rem;
    }

    /* Sélecteur de Matière */
    .subject-selector-card {
      padding: 1.25rem;
      border-radius: var(--radius-md);
      margin-bottom: 1.5rem;
      border: 1px solid var(--border);
      background: var(--surface);
      box-shadow: var(--shadow-sm);
    }

    .selector-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 0.85rem;
    }

    .selector-title {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-weight: 700;
      font-size: 1rem;
      color: var(--text);
    }

    .section-icon {
      color: var(--accent);
      font-size: 22px !important;
      width: 22px !important;
      height: 22px !important;
    }

    .subject-count {
      font-size: 0.82rem;
      color: var(--text-muted);
      font-weight: 500;
    }

    .subject-chips-container {
      display: flex;
      flex-wrap: wrap;
      gap: 0.6rem;
    }

    .subject-chip {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.6rem 1.25rem;
      border-radius: var(--radius-full);
      border: 1px solid var(--border);
      background: var(--surface-muted);
      color: var(--text);
      font-weight: 600;
      font-size: 0.92rem;
      cursor: pointer;
      transition: all 0.25s cubic-bezier(0.2, 0.7, 0.2, 1);
    }

    .subject-chip:hover {
      border-color: var(--accent);
      background: var(--accent-surface);
      transform: translateY(-2px);
    }

    .subject-chip.is-active {
      background: linear-gradient(135deg, var(--accent), #1d4ed8);
      color: #ffffff;
      border-color: transparent;
      box-shadow: 0 4px 14px rgba(37, 99, 235, 0.28);
      transform: translateY(-1px);
    }

    .chip-icon {
      font-size: 19px !important;
      width: 19px !important;
      height: 19px !important;
    }

    /* Layout Course Workspace */
    .course-workspace-grid {
      display: grid;
      grid-template-columns: 320px 1fr;
      gap: 1.25rem;
      align-items: start;
    }

    @media (max-width: 960px) {
      .course-workspace-grid {
        grid-template-columns: 1fr;
      }
    }

    /* Colonne Sommaire des Chapitres */
    .chapters-sidebar {
      padding: 1.15rem;
      border-radius: var(--radius-md);
      border: 1px solid var(--border);
      background: var(--surface);
      box-shadow: var(--shadow-sm);
      display: flex;
      flex-direction: column;
      gap: 0.85rem;
    }

    .chapters-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .chapters-heading {
      font-size: 0.98rem;
      font-weight: 700;
      color: var(--text);
      display: flex;
      align-items: center;
      gap: 0.4rem;
      margin: 0;
    }

    .heading-icon {
      color: var(--accent);
      font-size: 20px !important;
      width: 20px !important;
      height: 20px !important;
    }

    .chapters-badge {
      font-size: 0.76rem;
      padding: 0.2rem 0.55rem;
      border-radius: var(--radius-full);
      background: var(--accent-surface);
      color: var(--accent);
      font-weight: 700;
    }

    .search-input-wrapper {
      position: relative;
      display: flex;
      align-items: center;
    }

    .search-icon {
      position: absolute;
      left: 0.65rem;
      color: var(--text-muted);
      font-size: 18px !important;
      width: 18px !important;
      height: 18px !important;
    }

    .search-input {
      width: 100%;
      padding: 0.45rem 2rem 0.45rem 2.2rem;
      border-radius: var(--radius-sm);
      border: 1px solid var(--border);
      background: var(--surface-muted);
      color: var(--text);
      font-size: 0.84rem;
      outline: none;
      transition: border-color 0.2s ease;
    }

    .search-input:focus {
      border-color: var(--accent);
      background: var(--surface);
    }

    .clear-btn {
      position: absolute;
      right: 0.6rem;
      background: none;
      border: none;
      color: var(--text-muted);
      cursor: pointer;
      font-size: 0.8rem;
    }

    .chapters-list {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
      max-height: 520px;
      overflow-y: auto;
      padding-right: 0.25rem;
    }

    .chapter-item {
      display: flex;
      align-items: flex-start;
      gap: 0.65rem;
      padding: 0.75rem 0.85rem;
      border-radius: var(--radius-sm);
      border: 1px solid var(--border);
      background: var(--surface-muted);
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .chapter-item:hover {
      border-color: var(--accent);
      background: var(--surface);
      transform: translateX(2px);
    }

    .chapter-item.is-active {
      border-color: var(--accent);
      background: var(--accent-surface);
      box-shadow: inset 3px 0 0 var(--accent);
    }

    .ch-number {
      font-size: 0.78rem;
      font-weight: 800;
      color: var(--accent);
      background: #eff6ff;
      padding: 0.2rem 0.45rem;
      border-radius: 4px;
      flex-shrink: 0;
    }

    .ch-details {
      display: flex;
      flex-direction: column;
      gap: 0.2rem;
      flex: 1;
    }

    .ch-title {
      font-size: 0.86rem;
      font-weight: 700;
      color: var(--text);
      line-height: 1.35;
    }

    .ch-meta {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.74rem;
      color: var(--text-muted);
    }

    .ch-time {
      display: inline-flex;
      align-items: center;
      gap: 0.2rem;
    }

    .tiny-icon {
      font-size: 13px !important;
      width: 13px !important;
      height: 13px !important;
    }

    .ch-level-tag {
      background: var(--surface);
      padding: 0.1rem 0.4rem;
      border-radius: 3px;
      border: 1px solid var(--border);
    }

    .empty-search {
      padding: 1.5rem 0.5rem;
      text-align: center;
      font-size: 0.82rem;
      color: var(--text-muted);
    }

    /* Colonne Principale de Cours */
    .chapter-main-panel {
      display: flex;
      flex-direction: column;
      gap: 1.25rem;
    }

    /* Bandeau Tips & Astuces */
    .tips-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
      gap: 0.85rem;
    }

    .tip-card {
      padding: 1rem 1.15rem;
      border-radius: var(--radius-md);
      border: 1px solid var(--border);
      background: var(--surface);
      box-shadow: var(--shadow-sm);
      display: flex;
      flex-direction: column;
      gap: 0.45rem;
      position: relative;
      overflow: hidden;
    }

    .tip-card::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 3px;
    }

    .tip-card--memo::before {
      background: #10b981;
    }
    .tip-card--memo {
      border-color: rgba(16, 185, 129, 0.25);
      background: linear-gradient(180deg, #f0fdf4 0%, #ffffff 100%);
    }
    .tip-card--memo .tip-icon,
    .tip-card--memo .tip-badge {
      color: #059669;
    }

    .tip-card--exam::before {
      background: #3b82f6;
    }
    .tip-card--exam {
      border-color: rgba(59, 130, 246, 0.25);
      background: linear-gradient(180deg, #eff6ff 0%, #ffffff 100%);
    }
    .tip-card--exam .tip-icon,
    .tip-card--exam .tip-badge {
      color: #2563eb;
    }

    .tip-card--rule::before {
      background: #d97706;
    }
    .tip-card--rule {
      border-color: rgba(217, 119, 6, 0.25);
      background: linear-gradient(180deg, #fffbeb 0%, #ffffff 100%);
    }
    .tip-card--rule .tip-icon,
    .tip-card--rule .tip-badge {
      color: #b45309;
    }

    .tip-card__header {
      display: flex;
      align-items: center;
      gap: 0.4rem;
    }

    .tip-icon {
      font-size: 17px !important;
      width: 17px !important;
      height: 17px !important;
    }

    .tip-badge {
      font-size: 0.72rem;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }

    .tip-card__title {
      font-size: 0.92rem;
      font-weight: 700;
      color: var(--text);
    }

    .tip-card__desc {
      font-size: 0.83rem;
      color: var(--text-secondary);
      line-height: 1.45;
    }

    /* Fiche de Cours détaillée */
    .lesson-notes-card {
      padding: 1.75rem;
      border-radius: var(--radius-md);
      border: 1px solid var(--border);
      background: var(--surface);
      box-shadow: var(--shadow-sm);
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }

    .lesson-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 1rem;
      padding-bottom: 1.25rem;
      border-bottom: 1px solid var(--border);
    }

    .lh-left {
      display: flex;
      flex-direction: column;
      gap: 0.35rem;
    }

    .kicker {
      font-size: 0.78rem;
      font-weight: 800;
      text-transform: uppercase;
      color: var(--accent);
      letter-spacing: 0.05em;
    }

    .lesson-title {
      font-size: 1.35rem;
      font-weight: 800;
      color: var(--text);
      margin: 0;
      line-height: 1.3;
    }

    .lesson-section {
      display: flex;
      flex-direction: column;
      gap: 0.65rem;
    }

    .section-subheading {
      font-size: 0.95rem;
      font-weight: 700;
      color: var(--text);
      display: flex;
      align-items: center;
      gap: 0.45rem;
      margin: 0;
    }

    .sub-icon {
      color: var(--accent);
      font-size: 19px !important;
      width: 19px !important;
      height: 19px !important;
    }

    .summary-text {
      font-size: 0.93rem;
      line-height: 1.65;
      color: var(--text-secondary);
      margin: 0;
      background: #f8fafc;
      padding: 0.9rem 1.15rem;
      border-radius: var(--radius-sm);
      border-left: 3px solid var(--accent);
    }

    .keypoints-list {
      list-style: none;
      padding: 0;
      margin: 0;
      display: flex;
      flex-direction: column;
      gap: 0.45rem;
    }

    .keypoint-item {
      display: flex;
      align-items: flex-start;
      gap: 0.35rem;
      font-size: 0.89rem;
      color: var(--text-secondary);
      line-height: 1.45;
    }

    .check-bullet {
      color: var(--accent);
      font-size: 20px !important;
      width: 20px !important;
      height: 20px !important;
      flex-shrink: 0;
      margin-top: -1px;
    }

    .articles-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      gap: 0.75rem;
    }

    .article-box {
      display: flex;
      gap: 0.55rem;
      padding: 0.85rem;
      border-radius: var(--radius-sm);
      background: #f8fafc;
      border: 1px solid var(--border);
    }

    .art-icon {
      color: var(--accent);
      font-size: 20px !important;
      width: 20px !important;
      height: 20px !important;
      flex-shrink: 0;
    }

    .art-text {
      font-size: 0.85rem;
      color: var(--text);
      font-style: italic;
      line-height: 1.45;
      margin: 0;
    }

    .case-study-box {
      padding: 0.85rem 1rem;
      border-radius: var(--radius-sm);
      background: rgba(245, 158, 11, 0.08);
      border: 1px solid rgba(245, 158, 11, 0.25);
    }

    .case-text {
      font-size: 0.88rem;
      color: #92400e;
      line-height: 1.5;
      margin: 0;
    }

    .pitfalls-heading {
      color: #b91c1c;
    }

    .danger-icon {
      color: #ef4444;
    }

    .pitfalls-list {
      display: flex;
      flex-direction: column;
      gap: 0.4rem;
    }

    .pitfall-item {
      display: flex;
      align-items: flex-start;
      gap: 0.5rem;
      padding: 0.6rem 0.8rem;
      border-radius: var(--radius-sm);
      background: #fef2f2;
      border: 1px solid rgba(239, 68, 68, 0.2);
      font-size: 0.86rem;
      color: #991b1b;
      line-height: 1.4;
    }

    .pit-bullet {
      font-size: 16px !important;
      width: 16px !important;
      height: 16px !important;
      color: #ef4444;
      flex-shrink: 0;
      margin-top: 1px;
    }

    /* Navigation entre chapitres */
    .chapter-navigation-bar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 0.75rem;
      padding: 1rem 0;
      border-top: 1px solid var(--border);
      flex-wrap: wrap;
    }

    .nav-spacer {
      flex: 1;
    }

    /* Passerelles d'entraînement */
    .practice-cta-section {
      margin-top: 0.5rem;
      padding-top: 1.25rem;
      border-top: 1px solid var(--border);
    }

    .cta-banner {
      background: linear-gradient(135deg, rgba(37, 99, 235, 0.08), rgba(99, 102, 241, 0.08));
      border: 1px solid rgba(37, 99, 235, 0.2);
      border-radius: var(--radius-md);
      padding: 1.25rem;
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 1rem;
      flex-wrap: wrap;
    }

    .cta-title {
      font-size: 1rem;
      font-weight: 800;
      color: var(--text);
      margin: 0 0 0.2rem 0;
    }

    .cta-desc {
      font-size: 0.84rem;
      color: var(--text-muted);
      margin: 0;
    }

    .cta-actions {
      display: flex;
      gap: 0.55rem;
      flex-wrap: wrap;
    }

    .btn-icon {
      font-size: 17px !important;
      width: 17px !important;
      height: 17px !important;
      margin-right: 0.35rem;
    }

    .empty-state-card {
      padding: 3rem 1.5rem;
      text-align: center;
      border-radius: var(--radius-md);
      border: 1px solid var(--border);
      margin-top: 1.5rem;
    }

    .empty-icon {
      font-size: 48px !important;
      width: 48px !important;
      height: 48px !important;
      color: var(--text-muted);
      margin-bottom: 0.75rem;
    }

    /* ─── Mode Arabe & Typographie Calligraphique ─── */
    .arabic-font {
      font-family: 'Amiri', 'Cairo', 'Segoe UI', Tahoma, sans-serif !important;
    }

    .arabic-mode {
      direction: rtl;
      text-align: right;
    }

    .arabic-mode .chapters-header,
    .arabic-mode .chapter-item,
    .arabic-mode .tip-card__header,
    .arabic-mode .lesson-header,
    .arabic-mode .section-subheading,
    .arabic-mode .keypoint-item,
    .arabic-mode .article-box,
    .arabic-mode .pitfall-item,
    .arabic-mode .chapter-navigation-bar,
    .arabic-mode .cta-banner,
    .arabic-mode .cta-actions {
      direction: rtl;
      text-align: right;
    }

    .arabic-mode .summary-text {
      border-left: none;
      border-right: 4px solid var(--accent);
      font-family: 'Amiri', 'Cairo', serif !important;
      font-size: 1.08rem;
      line-height: 1.95;
    }

    .arabic-mode .lesson-title,
    .arabic-mode .ch-title,
    .arabic-mode .tip-card__title,
    .arabic-mode .cta-title {
      font-family: 'Cairo', 'Amiri', sans-serif !important;
      line-height: 1.5;
    }

    .arabic-mode .tip-card__desc,
    .arabic-mode .keypoint-item span,
    .arabic-mode .art-text,
    .arabic-mode .case-text,
    .arabic-mode .pitfall-item span,
    .arabic-mode .cta-desc {
      font-family: 'Amiri', 'Cairo', serif !important;
      font-size: 1.05rem;
      line-height: 1.9;
    }

    .arabic-mode .art-text {
      font-style: normal;
      font-weight: 500;
      color: #1e293b;
    }

    .arabic-mode .check-bullet {
      transform: scaleX(-1);
      margin-left: 0.4rem;
      margin-right: 0;
    }

    .arabic-mode .search-icon {
      left: auto;
      right: 0.65rem;
    }

    .arabic-mode .search-input {
      padding: 0.45rem 2.2rem 0.45rem 2rem;
      text-align: right;
    }

    .arabic-mode .clear-btn {
      right: auto;
      left: 0.6rem;
    }

    .arabic-mode .chapter-item:hover {
      transform: translateX(-2px);
    }

    .arabic-mode .chapter-item.is-active {
      box-shadow: inset -3px 0 0 var(--accent);
    }
  `]
})
export class CourseComponent implements OnInit, OnDestroy {
  profile: UserProfile | null = null;
  private profileSub?: Subscription;

  // Matières disponibles (strictement celles du profil de l'élève)
  availableSubjects: string[] = [];
  selectedSubject = '';

  // Données du cours
  currentCourseData: SubjectCourseData | null = null;
  selectedChapter: CourseChapter | null = null;
  searchChapterQuery = '';

  // Base complète des cours avec astuces, tips, mnémotechniques et fiches synthétiques
  private readonly courseCatalog: Record<string, SubjectCourseData> = {
    'Sciences de la vie et de la Terre (SVT)': {
      subject: 'Sciences de la vie et de la Terre (SVT)',
      category: 'Sciences & Nature',
      description: 'Génétique moléculaire, immunologie, régulation biologique et flux d\'énergie cellulaire.',
      chapters: [
        {
          id: 'svt-1',
          title: 'La Génétique et l\'Hérédité Moléculaire',
          duration: '45 min',
          level: 'Collège',
          summary: 'L\'information génétique est stockée dans l\'ADN sous forme d\'une séquence de nucléotides. L\'expression comporte deux étapes : la transcription de l\'ADN en ARN messager dans le noyau, puis la traduction de l\'ARNm en protéines au niveau des ribosomes dans le cytoplasme.',
          tips: [
            {
              icon: 'psychology',
              badge: 'Astuce Mémo',
              type: 'memo',
              title: 'Appariement des bases azotées',
              description: 'Retiens simplement : Appartement-Toit (A-T) et Garage-Cave (G-C) pour ne jamais hésiter sur les liaisons hydrogène !'
            },
            {
              icon: 'school',
              badge: 'Conseil d\'Examen',
              type: 'exam',
              title: 'Arbre généalogique génétique',
              description: 'Commence toujours par identifier si la maladie saute des générations (allèle récessif) et si les deux sexes sont également atteints (autosomique).'
            },
            {
              icon: 'check_circle',
              badge: 'Règle d\'Or',
              type: 'rule',
              title: 'Transcription en ARNm',
              description: 'N\'écris jamais de Thymine (T) dans un brin d\'ARN messager : elle est systématiquement remplacée par l\'Uracile (U).'
            }
          ],
          keyPoints: [
            'L\'ADN est une double hélice antiparallèle unie par liaisons hydrogène (A-T, G-C).',
            'La réplication de l\'ADN est semi-conservative (Expérience de Meselson et Stahl).',
            'Le code génétique est universel, redondant (dégénéré) et non-chevauchant (64 codons pour 20 acides aminés).',
            'Les mutations (substitution, délétion, insertion) sont la source des nouveaux allèles.'
          ],
          rulesOrFormulas: [
            'Loi de Chargaff : [A] = [T] et [G] = [C] dans toute molécule d\'ADN bicaténaire.',
            'Codon d\'initiation obligatoire : AUG (Méthionine) et codons stop : UAA, UAG, UGA.'
          ],
          caseExample: 'Arbre généalogique pour une anomalie autosomique récessive : Deux parents sains hétérozygotes ont 25% de risque d\'avoir un enfant atteint.',
          pitfalls: [
            'Ne pas confondre un gène (portion d\'ADN codant une fonction) et un allèle (version particulière de ce gène).',
            'Attention à bien orienter les brins : la synthèse de l\'ARNm se fait dans le sens 5\' vers 3\'.'
          ]
        },
        {
          id: 'svt-2',
          title: 'L\'Immunologie et les Réponses Immunitaires',
          duration: '50 min',
          level: 'Collège',
          summary: 'Le système immunitaire assure la défense de l\'organisme : l\'immunité innée (rapide, non spécifique, réaction inflammatoire) et l\'immunité adaptative (spécifique, médiation humorale via anticorps ou cellulaire via lymphocytes T cytotoxiques).',
          tips: [
            {
              icon: 'psychology',
              badge: 'Astuce Mémo',
              type: 'memo',
              title: 'Différence LB vs LT',
              description: 'LB = Balles / Balistique (anticorps dissous dans le sang). LT = Tireurs d\'élite au corps à corps (perforine/granzyme destructeurs de cellules infectées).'
            },
            {
              icon: 'school',
              badge: 'Conseil d\'Examen',
              type: 'exam',
              title: 'Les 4 signes cardinaux',
              description: 'Pour toute question sur la réaction inflammatoire aiguë, cite obligatoirement : Rougeur, Chaleur, Gonflement (œdème) et Douleur.'
            },
            {
              icon: 'check_circle',
              badge: 'Règle d\'Or',
              type: 'rule',
              title: 'Vaccin vs Sérum',
              description: 'Vaccin = antigène atténué -> immunité active, lente et durable. Sérum = anticorps injectés -> protection passive, immédiate et éphémère.'
            }
          ],
          keyPoints: [
            'La phagocytose par les macrophages et polynucléaires élimine la grande majorité des agresseurs.',
            'Les lymphocytes B activés se différencient en plasmocytes hypersécréteurs d\'anticorps.',
            'Les lymphocytes T CD8+ deviennent cytotoxiques et lysent directement les cellules cibles.',
            'Les lymphocytes mémoires permettent une réponse secondaire dix fois plus rapide et concentrée.'
          ],
          rulesOrFormulas: [
            'Complexe immun : Association spécifique anticorps-antigène neutralisant les toxines.',
            'Sélection clonale : Prolifération exclusive des lymphocytes reconnaissant l\'épitope étranger.'
          ],
          caseExample: 'Réponse vaccinale de rappel : La sécrétion d\'IgG lors d\'une seconde exposition est immédiate grâce aux cellules B mémoires préexistantes.',
          pitfalls: [
            'Ne pas oublier que les lymphocytes T4 (auxiliaires) sont la clé de voûte : sans eux, aucune réponse adaptative efficace n\'est possible.',
            'Les anticorps ne détruisent pas directement les bactéries : ils les neutralisent et facilitent leur phagocytose.'
          ]
        },
        {
          id: 'svt-3',
          title: 'Consommation de Matière Organique & Flux d\'Énergie',
          duration: '40 min',
          level: 'Collège',
          summary: 'La production d\'énergie cellulaire sous forme d\'ATP nécessite la dégradation du glucose. En aérobie, la respiration cellulaire (glycolyse, cycle de Krebs et chaîne respiratoire) produit 36 à 38 ATP. En anaérobie, la fermentation produit 2 ATP.',
          tips: [
            {
              icon: 'psychology',
              badge: 'Astuce Mémo',
              type: 'memo',
              title: 'Bilan énergétique aérobie vs anaérobie',
              description: '38 ATP avec oxygène contre 2 ATP sans oxygène : la respiration cellulaire est presque 20 fois plus efficace énergétiquement !'
            },
            {
              icon: 'school',
              badge: 'Conseil d\'Examen',
              type: 'exam',
              title: 'Rôle exact du dioxygène',
              description: 'Le dioxygène n\'intervient qu\'au tout dernier maillon de la chaîne respiratoire (membrane interne mitochondriale) comme accepteur d\'électrons pour former H2O.'
            },
            {
              icon: 'check_circle',
              badge: 'Règle d\'Or',
              type: 'rule',
              title: 'Lieu de la glycolyse',
              description: 'La glycolyse se produit toujours dans le cytoplasme (hyaloplasme), jamais dans la mitochondrie.'
            }
          ],
          keyPoints: [
            'La glycolyse cytoplasmique oxyde le glucose en 2 pyruvates avec un gain net de 2 ATP.',
            'Le cycle de Krebs dans la matrice mitochondriale libère du CO2 et régénère les coenzymes réduits.',
            'L\'ATP synthase exploite le gradient de protons pour phosphoryler l\'ADP en ATP.'
          ],
          rulesOrFormulas: [
            'Équation globale : C6H12O6 + 6 O2 + 36 ADP + 36 Pi -> 6 CO2 + 6 H2O + 36 ATP.',
            'Rendement énergétique : environ 40% en aérobie, contre 2% en fermentation.'
          ],
          caseExample: 'Effort musculaire intense : La fermentation lactique prend le relais de la respiration et génère de l\'acide lactique responsable de l\'acidose musculaire.',
          pitfalls: [
            'Ne pas confondre la matrice mitochondriale (cycle de Krebs) et l\'espace intermembranaire (accumulation des protons H+).'
          ]
        }
      ]
    },
    'Éducation islamique': {
      subject: 'Éducation islamique',
      category: 'التربية الإسلامية (المقرر المدرسي)',
      description: 'مداخل التزكية، الاقتداء، الاستجابة، القسط والحكمة وفق المقرر الدراسي المعتمد.',
      chapters: [
        {
          id: 'ei-1',
          title: 'مَدْخَلُ التَّزْكِيَةِ : سُورَةُ الفَاتِحَةِ وَأَرْكَانُ الإِيمَانِ',
          duration: '35 دقيقة',
          level: 'المقرر المدرسي',
          summary: 'يُعْنَى مَدْخَلُ التَّزْكِيَةِ بِطَهَارَةِ النَّفْسِ وَتَرْسِيخِ عَقِيدَةِ التَّوْحِيدِ. تُعَدُّ سُورَةُ الفَاتِحَةِ (أُمُّ الكِتَابِ) أَسَاسَ القُرْآنِ الكَرِيمِ لِاشْتِمَالِهَا عَلَى تَوْحِيدِ الرُّبُوبِيَّةِ وَالأُلُوهِيَّةِ وَإِخْلاَصِ العِبَادَةِ وَالاِسْتِعَانَةِ بِاللَّهِ وَطَلَبِ الهِدَايَةِ إِلَى الصِّرَاطِ المُسْتَقِيمِ، مُقْتَرِنَةً بِأَرْكَانِ الإِيمَانِ السِّتَّةِ.',
          tips: [
            {
              icon: 'psychology',
              badge: 'فائدة للحفظ',
              type: 'memo',
              title: 'أَسْمَاءُ سُورَةِ الفَاتِحَةِ',
              description: 'تُسَمَّى الفَاتِحَةُ أَيْضاً "السَّبْعَ المَثَانِيَ" لِأَنَّهَا سَبْعُ آيَاتٍ تُثَنَّى فِي كُلِّ صَلاَةٍ، وَتُسَمَّى "الشَّافِيَةَ" وَ"أُمَّ الكِتَابِ".'
            },
            {
              icon: 'school',
              badge: 'نصيحة للامتحان',
              type: 'exam',
              title: 'دِقَّةُ الاِسْتِشْهَادِ بِالقُرْآنِ الكَرِيمِ',
              description: 'عِنْدَ كِتَابَةِ الآيَاتِ القُرْآنِيَّةِ، احْرِصْ عَلَى الرَّسْمِ القُرْآنِيِّ الصَّحِيحِ وَالشَّكْلِ التَّامِّ وَعَدَمِ إِسْقَاطِ الكَلِمَاتِ.'
            },
            {
              icon: 'check_circle',
              badge: 'قاعدة ذهبية',
              type: 'rule',
              title: 'رُكْنِيَّةُ الفَاتِحَةِ فِي الصَّلاَةِ',
              description: 'لاَ تَصِحُّ صَلاَةُ مُسْلِمٍ بِدُونِ قِرَاءَةِ سُورَةِ الفَاتِحَةِ: «لاَ صَلاَةَ لِمَنْ لَمْ يَقْرَأْ بِفَاتِحَةِ الكِتَابِ».'
            }
          ],
          keyPoints: [
            'سُورَةُ الفَاتِحَةِ مَكِّيَّةٌ وَعَدَدُ آيَاتِهَا سَبْعٌ، وَتَفْتَتِحُ بِالبَسْمَلَةِ وَالحَمْدَلَةِ.',
            'أَرْكَانُ الإِيمَانِ سِتَّةٌ: الإِيمَانُ بِاللَّهِ، وَمَلائِكَتِهِ، وَكُتُبِهِ، وَرُسُلِهِ، وَاليَوْمِ الآخِرِ، وَالقَدَرِ خَيْرِهِ وَشَرِّهِ.',
            'إِخْلاَصُ التَّوَكُّلِ وَالاِسْتِعَانَةِ بِاللَّهِ وَحْدَهُ فِي جَمِيعِ شُؤُونِ الحَيَاةِ: ﴿إِيَّاكَ نَعْبُدُ وَإِيَّاكَ نَسْتَعِينُ﴾.',
            'تَزْكِيَةُ النَّفْسِ تَكُونُ بِتَطْهِيرِهَا مِنَ الرِّيَاءِ وَالكِبْرِ وَتَحْلِيَتِهَا بِالصِّدْقِ وَالإِخْلاَصِ.'
          ],
          rulesOrFormulas: [
            'قَالَ اللَّهُ تَعَالَى: ﴿بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ * الْحَمْدُ لِلَّهِ رَبِّ الْعَالَمِينَ * الرَّحْمَٰنِ الرَّحِيمِ * مَالِكِ يَوْمِ الدِّينِ * إِيَّاكَ نَعْبُدُ وَإِيَّاكَ نَسْتَعِينُ * اهْدِنَا الصِّرَاطَ الْمُسْتَقِيمَ﴾ [سورة الفاتحة: 1-6].',
            'حَدِيثُ جِبْرِيلَ عَلَيْهِ السَّلاَمُ: «الإِيمَانُ أَنْ تُؤْمِنَ بِاللَّهِ، وَمَلَائِكَتِهِ، وَكُتُبِهِ، وَرُسُلِهِ، وَالْيَوْمِ الْآخِرِ، وَتُؤْمِنَ بِالْقَدَرِ خَيْرِهِ وَشَرِّهِ» (صحيح مسلم).'
          ],
          caseExample: 'مَوْقِفٌ تَرْبَوِيٌّ: عِنْدَمَا يَسْتَعِدُّ التِّلْمِيذُ لِلِامْتِحَانِ، يَجْتَهِدُ فِي الحِفْظِ وَالمُرَاجَعَةِ ثُمَّ يَتَوَكَّلُ عَلَى اللَّهِ وَيَسْتَعِينُ بِهِ قَائِلاً: ﴿إِيَّاكَ نَعْبُدُ وَإِيَّاكَ نَسْتَعِينُ﴾.',
          pitfalls: [
            'الخَلْطُ بَيْنَ أَرْكَانِ الإِيمَانِ السِّتَّةِ (عَقِيدَةٌ قَلْبِيَّةٌ) وَأَرْكَانِ الإِسْلاَمِ الخَمْسَةِ (عِبَادَاتٌ عَمَلِيَّةٌ).',
            'إِهْمَالُ الشَّكْلِ أَوْ تَحْرِيفُ حُرُوفِ الآيَاتِ عِنْدَ الِاسْتِظْهَارِ الكِتَابِيِّ.'
          ]
        },
        {
          id: 'ei-2',
          title: 'مَدْخَلُ الاِقْتِدَاءِ : السِّيرَةُ النَّبَوِيَّةُ وَخُلُقَا الصِّدْقِ وَالأَمَانَةِ',
          duration: '40 دقيقة',
          level: 'المقرر المدرسي',
          summary: 'يَهْدِفُ مَدْخَلُ الاِقْتِدَاءِ إِلَى التَّأَسِّي بِسِيرَةِ النَّبِيِّ مُحَمَّدٍ ﷺ وَمَعْرِفَةِ شَمَائِلِهِ العَظِيمَةِ. عُرِفَ النَّبِيُّ ﷺ قَبْلَ البِعْثَةِ وَبَعْدَهَا بِالصِّدْقِ وَالأَمَانَةِ، وَكَانَ نَمُوذَجاً كَامِلاً فِي حُسْنِ الخُلُقِ وَالرَّحْمَةِ بِالعَالَمِينَ.',
          tips: [
            {
              icon: 'psychology',
              badge: 'فائدة للحفظ',
              type: 'memo',
              title: 'لَقَبُ الرَّسُولِ ﷺ قَبْلَ البِعْثَةِ',
              description: 'لُقِّبَ ﷺ فِي مَكَّةَ بِـ "الصَّادِقِ الأَمِينِ"؛ لِأَنَّهُ لَمْ يَكْذِبْ قَطُّ فِي حَيَاتِهِ وَكَانَ أَهْلُ مَكَّةَ يَضَعُونَ عِنْدَهُ أَمَانَاتِهِمْ.'
            },
            {
              icon: 'school',
              badge: 'نصيحة للامتحان',
              type: 'exam',
              title: 'رَبْطُ السِّيرَةِ بِالقِيَمِ',
              description: 'فِي أَسْئِلَةِ التَّحْلِيلِ، ارْبِطْ دَائِماً حَدَثَ السِّيرَةِ بِالقِيمَةِ الخُلُقِيَّةِ المُسْتَفَادَةِ مِنْهُ (الصِّدْقُ، الصَّبْرُ، الأَمَانَةُ، الرَّحْمَةُ).'
            },
            {
              icon: 'check_circle',
              badge: 'قاعدة ذهبية',
              type: 'rule',
              title: 'التَّأَسِّي سَبِيلُ المَحَبَّةِ',
              description: 'قَالَ اللَّهُ تَعَالَى: ﴿لَّقَدْ كَانَ لَكُمْ فِي رَسُولِ اللَّهِ أُسْوَةٌ حَسَنَةٌ﴾؛ فَالِاقْتِدَاءُ هُوَ أَعْظَمُ دَلِيلٍ عَلَى حُبِّ الرَّسُولِ ﷺ.'
            }
          ],
          keyPoints: [
            'وِلادَةُ النَّبِيِّ ﷺ عَامَ الفِيلِ يَتِيماً، وَرِعَايَتُهُ لِلْغَنَمِ فِي طُفُولَتِهِ لِتَعَلُّمِ الصَّبْرِ وَالتَّوَاضُعِ.',
            'حُكْمُ الصِّدْقِ فِي الإِسْلاَمِ: وَاجِبٌ دِينِيٌّ وَخُلُقِيٌّ يَهْدِي إِلَى البِرِّ وَالجَنَّةِ.',
            'الأَمَانَةُ تَشْمَلُ أَمَانَةَ الدِّينِ، وَأَمَانَةَ الحَوَاسِّ، وَأَمَانَةَ الوَدَائِعِ، وَأَمَانَةَ الوَاجِبَاتِ المَدْرَسِيَّةِ.',
            'بِنَاءُ مُجْتَمَعِ المَدِينَةِ المُنَوَّرَةِ عَلَى المُؤَاخَاةِ بَيْنَ المُهَاجِرِينَ وَالأَنْصَارِ.'
          ],
          rulesOrFormulas: [
            'قَالَ رَسُولُ اللَّهِ ﷺ: «إِنَّ الصِّدْقَ يَهْدِي إِلَى الْبِرِّ، وَإِنَّ الْبِرَّ يَهْدِي إِلَى الْجَنَّةِ» (رواه البخاري ومسلم).',
            'قَالَ رَسُولُ اللَّهِ ﷺ: «إِنَّمَا بُعِثْتُ لِأُتَمِّمَ مَكَارِمَ الْأَخْلَاقِ» (صحيح الأدب المفرد).'
          ],
          caseExample: 'تَطْبِيقٌ عَمَلِيٌّ: وَجَدَ تِلْمِيذٌ مِحْفَظَةَ زَمِيلِهِ فِي القِسْمِ؛ فَبَادَرَ إِلَى إِعَادَتِهَا دُونَ تَرَدُّدٍ اقْتِدَاءً بِأَمَانَةِ النَّبِيِّ الكَرِيمِ ﷺ.',
          pitfalls: [
            'حَصْرُ الصِّدْقِ فِي الكَلاَمِ دُونَ الأَفْعَالِ (فَالصِّدْقُ يَكُونُ فِي القَوْلِ وَالعَمَلِ مَعاً).',
            'إِغْفَالُ كِتَابَةِ الصَّلاَةِ وَالسَّلاَمِ عَلَى رَسُولِ اللَّهِ عِنْدَ ذِكْرِ اسْمِهِ الشَّرِيفِ.'
          ]
        },
        {
          id: 'ei-3',
          title: 'مَدْخَلُ الاِسْتِجَابَةِ : فِقْهُ الطَّهَارَةِ وَالصَّلَوَاتِ الخَمْسِ',
          duration: '40 دقيقة',
          level: 'المقرر المدرسي',
          summary: 'يَتَنَاوَلُ مَدْخَلُ الاِسْتِجَابَةِ فِقْهَ العِبَادَاتِ وَأَحْكَامَهَا الشَّرْعِيَّةَ. يُرَكِّزُ هَذَا الدَّرْسُ عَلَى فَرَائِضِ وَسُنَنِ الوُضُوءِ، وَشُرُوطِ صِحَّةِ الصَّلاَةِ وَأَرْكَانِهَا وَمُبْطِلاَتِهَا، مَعَ تَعْزِيزِ الخُشُوعِ كَرُوحٍ لِلصَّلاَةِ.',
          tips: [
            {
              icon: 'psychology',
              badge: 'فائدة للحفظ',
              type: 'memo',
              title: 'فَرَائِضُ الوُضُوءِ السَّبْعُ',
              description: 'فَرَائِضُ الوُضُوءِ سَبْعَةٌ: (النِّيَّةُ، غَسْلُ الوَجْهِ، غَسْلُ اليَدَيْنِ إِلَى المِرْفَقَيْنِ، مَسْحُ الرَّأْسِ، غَسْلُ الرِّجْلَيْنِ إِلَى الكَعْبَيْنِ، الفَوْرُ، الدَّلْكُ).'
            },
            {
              icon: 'school',
              badge: 'نصيحة للامتحان',
              type: 'exam',
              title: 'التَّمْيِيزُ بَيْنَ الشَّرْطِ وَالرُّكْنِ',
              description: 'الشَّرْطُ يَسْبِقُ الصَّلاَةَ وَيَسْتَمِرُّ فِيهَا (كَطَهَارَةِ الحَدَثِ وَاسْتِقْبَالِ القِبْلَةِ)، بَيْنَمَا الرُّكْنُ جُزْءٌ مِنْ ذَاتِ الصَّلاَةِ (كَالرُّكُوعِ وَالسُّجُودِ).'
            },
            {
              icon: 'check_circle',
              badge: 'قاعدة ذهبية',
              type: 'rule',
              title: 'الصَّلاَةُ عِمَادُ الدِّينِ',
              description: 'الصَّلاَةُ هِيَ الرُّكْنُ الثَّانِي مِنْ أَرْكَانِ الإِسْلاَمِ بَعْدَ الشَّهَادَتَيْنِ، وَهِيَ أَوَّلُ مَا يُحَاسَبُ عَلَيْهِ العَبْدُ يَوْمَ القِيَامَةِ.'
            }
          ],
          keyPoints: [
            'الطَّهَارَةُ قِسْمَانِ: طَهَارَةُ حَدَثٍ (بِالوُضُوءِ أَوِ الغُسْلِ أَوِ التَّيَمُّمِ) وَطَهَارَةُ خَبَثٍ (إِزَالَةُ النَّجَاسَةِ عَنِ الثَّوْبِ وَالبَدَنِ وَالمَكَانِ).',
            'سُنَنُ الوُضُوءِ: غَسْلُ اليَدَيْنِ لِلْكُوعَيْنِ، المَضْمَضَةُ، الاِسْتِنْشَاقُ، الاِسْتِنْثَارُ، رَدُّ مَسْحِ الرَّأْسِ، مَسْحُ الأُذُنَيْنِ، تَرْتِيبُ الفَرَائِضِ.',
            'أَرْكَانُ الصَّلاَةِ: تَكْبِيرَةُ الإِحْرَامِ، قِرَاءَةُ الفَاتِحَةِ، القِيَامُ لَهَا، الرُّكُوعُ وَالرَّفْعُ مِنْهُ، السُّجُودُ، الاِعْتِدَالُ، الطُّمَأْنِينَةُ.',
            'مُبْطِلاَتُ الصَّلاَةِ: الكَلاَمُ عَمْداً، الأَكْلُ وَالشُّرْبُ، الحَرَكَةُ الكَثِيرَةُ، الضَّحِكُ بِقَهْقَهَةٍ، وَانْتِقَاضُ الوُضُوءِ.'
          ],
          rulesOrFormulas: [
            'قَالَ اللَّهُ تَعَالَى: ﴿يَا أَيُّهَا الَّذِينَ آمَنُوا إِذَا قُمْتُمْ إِلَى الصَّلَاةِ فَاغْسِلُوا وُجُوهَكُمْ وَأَيْدِيَكُمْ إِلَى الْمَرَافِقِ وَامْسَحُوا بِرُءُوسِكُمْ وَأَرْجُلَكُمْ إِلَى الْكَعْبَيْنِ﴾ [سورة المائدة: 6].',
            'قَالَ رَسُولُ اللَّهِ ﷺ: «بُنِيَ الإِسْلاَمُ عَلَى خَمْسٍ: شَهَادَةِ أَنْ لاَ إِلَهَ إِلاَّ اللَّهُ وَأَنَّ مُحَمَّداً رَسُولُ اللَّهِ، وَإِقَامِ الصَّلاَةِ، وَإِيتَاءِ الزَّكَاةِ، وَحَجِّ البَيْتِ، وَصَوْمِ رَمَضَانَ» (مُتَّفَقٌ عَلَيْهِ).'
          ],
          caseExample: 'تَطْبِيقٌ عَمَلِيٌّ لِلصَّلاَةِ: سَمِعَ التِّلْمِيذُ أَذَانَ الظُّهْرِ، فَتَوَضَّأَ وُضُوءاً سَابِغاً مُتَّبِعاً الفَرَائِضَ وَالسُّنَنَ، ثُمَّ تَوَجَّهَ نَحْوَ القِبْلَةِ مُؤَدِّياً أَرْبَعَ رَكَعَاتٍ بِخُشُوعٍ وَطُمَأْنِينَةٍ.',
          pitfalls: [
            'نِسْيَانُ الدَّلْكِ أَوِ الفَوْرِ (المُوَالاَةِ) فِي الوُضُوءِ حَسَبَ مَذْهَبِ الإِمَامِ مَالِكٍ.',
            'السُّرْعَةُ الشَّدِيدَةُ فِي الصَّلاَةِ دُونَ تَحْقِيقِ الطُّمَأْنِينَةِ فِي الرُّكُوعِ وَالسُّجُودِ.'
          ]
        },
        {
          id: 'ei-4',
          title: 'مَدْخَلُ القِسْطِ وَالحِكْمَةِ : حُقُوقُ الغَيْرِ وَحِمَايَةُ البِيئَةِ',
          duration: '35 دقيقة',
          level: 'المقرر المدرسي',
          summary: 'يُبَيِّنُ هَذَا المَدْخَلُ حُقُوقَ النَّفْسِ وَالوَالِدَيْنِ وَالجِيرَانِ وَالمُجْتَمَعِ، إِضَافَةً إِلَى حَقِّ البِيئَةِ فِي الإِسْلاَمِ؛ حَيْثُ جَعَلَ الشَّرْعُ الحَنِيفُ عِمَارَةَ الأَرْضِ وَحِفْظَ مَوَارِدِهَا مِنَ التَّلَوُّثِ وَالإِسْرَافِ أَمَانَةً وَعِبَادَةً يُثَابُ عَلَيْهَا المُسْلِمُ.',
          tips: [
            {
              icon: 'psychology',
              badge: 'فائدة للحفظ',
              type: 'memo',
              title: 'إِمَاطَةُ الأَذَى صَدَقَةٌ',
              description: 'تَذَكَّرْ دَائِماً حَدِيثَ النَّبِيِّ ﷺ: «وَتُمِيطُ الأَذَى عَنِ الطَّرِيقِ صَدَقَةٌ»؛ فَنَظَافَةُ الشَّارِعِ وَالمَدْرَسَةِ مِنْ شُعَبِ الإِيمَانِ.'
            },
            {
              icon: 'school',
              badge: 'نصيحة للامتحان',
              type: 'exam',
              title: 'وَثِيقَةُ المَدِينَةِ وَالتَّعَايُشُ',
              description: 'اسْتَشْهِدْ بِـ "وَثِيقَةِ المَدِينَةِ المُنَوَّرَةِ" عِنْدَ الحَدِيثِ عَنْ قِيَمِ التَّسَامُحِ، وَالعَدْلِ، وَالمُوَاطَنَةِ، وَحُقُوقِ غَيْرِ المُسْلِمِينَ.'
            },
            {
              icon: 'check_circle',
              badge: 'قاعدة ذهبية',
              type: 'rule',
              title: 'النَّهْيُ عَنِ الإِسْرَافِ فِي المَاءِ',
              description: 'نَهَى الإِسْلاَمُ عَنِ الإِسْرَافِ فِي المَاءِ وَلَوْ كَانَ المَرْءُ يَتَوَضَّأُ عَلَى نَهْرٍ جَارٍ؛ فَالْمَاءُ نِعْمَةٌ يَجِبُ حِفْظُهَا.'
            }
          ],
          keyPoints: [
            'بِرُّ الوَالِدَيْنِ هُوَ أَعْظَمُ حُقُوقِ العِبَادِ بَعْدَ حَقِّ اللَّهِ تَعَالَى.',
            'حُسْنُ الجِوَارِ وَإِفْشَاءُ السَّلاَمِ وَمُسَاعَدَةُ المُحْتَاجِ مِنْ رَكائِزِ السُّلُوكِ الإِسْلاَمِيِّ القَوِيمِ.',
            'حِمَايَةُ البِيئَةِ فِي الإِسْلاَمِ: التَّشْجِيرُ، الحِفَاظُ عَلَى المَاءِ، وَعَدَمُ تَلْوِيثِ الأَمَاكِنِ العَامَّةِ.',
            'وَثِيقَةُ المَدِينَةِ المُنَوَّرَةِ نَمُوذَجٌ تَارِيخِيٌّ رَائِدٌ فِي إِرْسَاءِ التَّعَايُشِ السِّلْمِيِّ وَالحُرِّيَّةِ الدِّينِيَّةِ.'
          ],
          rulesOrFormulas: [
            'قَالَ اللَّهُ تَعَالَى: ﴿وَقَضَىٰ رَبُّكَ أَلَّا تَعْبُدُوا إِلَّا إِيَّاهُ وَبِالْوَالِدَيْنِ إِحْسَانًا﴾ [سورة الإسراء: 23].',
            'قَالَ رَسُولُ اللَّهِ ﷺ: «مَا مِنْ مُسْلِمٍ يَغْرِسُ غَرْسًا، أَوْ يَزْرَعُ زَرْعًا، فَيَأْكُلُ مِنْهُ طَيْرٌ أَوْ إِنْسَانٌ أَوْ بَهِيمَةٌ، إِلَّا كَانَ لَهُ بِهِ صَدَقَةٌ» (صحيح البخاري).'
          ],
          caseExample: 'مُبَادَرَةٌ بِيئِيَّةٌ فِي المَدْرَسَةِ: شَارَكَ التِّلْمِيذُ مَعَ زُمَلائِهِ فِي حَمْلَةِ غَرْسِ الأَشْجَارِ وَتَنْظِيفِ السَّاحَةِ تَرْسِيخاً لِقِيمَةِ حِمَايَةِ البِيئَةِ وَعِمَارَةِ الأَرْضِ.',
          pitfalls: [
            'اعْتِقَادُ أَنَّ حِفْظَ البِيئَةِ شَأْنٌ مَدَنِيٌّ لاَ عِلاَقَةَ لَهُ بِالدِّينِ؛ فَالإِسْلاَمُ جَعَلَ النَّظَافَةَ شَطْرَ الإِيمَانِ.',
            'التَّهَاوُنُ فِي إِعْطَاءِ الجَارِ حَقَّهُ أَوْ إِزْعَاجِهِ بِالصَّوْتِ المُرْتَفِعِ.'
          ]
        }
      ]
    },
    'Langue arabe': {
      subject: 'Langue arabe',
      category: 'اللغة العربية وآدابها (المقرر المدرسي)',
      description: 'النحو والصرف، البلاغة والبيان، قواعد الإملاء، وأساليب التعبير والإنشاء.',
      chapters: [
        {
          id: 'ar-1',
          title: 'الجُمْلَةُ الاِسْمِيَّةُ وَنَوَاسِخُهَا الفِعْلِيَّةُ وَالحَرْفِيَّةُ',
          duration: '40 دقيقة',
          level: 'المقرر المدرسي',
          summary: 'تَتَكَوَّنُ الجُمْلَةُ الاِسْمِيَّةُ مِنْ رُكْنَيْنِ أَسَاسِيَّيْنِ هُمَا المُبْتَدَأُ وَالخَبَرُ، وَحُكْمُهُمَا الإِعْرَابِيُّ الرَّفْعُ. عِنْدَ دُخُولِ النَّوَاسِخِ الفِعْلِيَّةِ (كَانَ وَأَخَوَاتُهَا) أَوْ النَّوَاسِخِ الحَرْفِيَّةِ (إِنَّ وَأَخَوَاتُهَا)، يَتَغَيَّرُ حُكْمُ الجُمْلَةِ وَإِعْرَابُهَا.',
          tips: [
            {
              icon: 'psychology',
              badge: 'فائدة للحفظ',
              type: 'memo',
              title: 'قَاعِدَةُ التَّعَاكُسِ بَيْنَ كَانَ وَإِنَّ',
              description: 'كَانَ تَرْفَعُ الأَوَّلَ وَتَنْصِبُ الثَّانِي (كَانَ الجَوُّ جَمِيلاً). أَمَّا إِنَّ فَتَعْكِسُ تَمَاماً: تَنْصِبُ الأَوَّلَ وَتَرْفَعُ الثَّانِي (إِنَّ العِلْمَ نُورٌ) !'
            },
            {
              icon: 'school',
              badge: 'نصيحة للامتحان',
              type: 'exam',
              title: 'مَنْهَجِيَّةُ الإِعْرَابِ التَّامِّ',
              description: 'فِي سُؤَالِ الإِعْرَابِ، اذْكُرْ دَائِماً ثَلاَثَةَ أُمُورٍ: المَوْقِعَ الإِعْرَابِيَّ (اسْم/خَبَر)، الحَالَةَ (مَرْفُوع/مَنْصُوب)، وَالعَلاَمَةَ الإِعْرَابِيَّةَ (الضَّمَّة الظَّاهِرَة، الأَلِف، الوَاو).'
            },
            {
              icon: 'check_circle',
              badge: 'قاعدة ذهبية',
              type: 'rule',
              title: 'أَنْوَاعُ الخَبَرِ الثَّلاَثَةُ',
              description: 'يَأْتِي الخَبَرُ: مُفْرَداً (العِلْمُ نَافِعٌ)، أَوْ جُمْلَةً فِعْلِيَّةً/اسْمِيَّةً (المُعَلِّمُ يَشْرَحُ)، أَوْ شِبْهَ جُمْلَةٍ مِنَ الجَارِّ وَالمَجْرُورِ أَوِ الظَّرْفِ (الكِتَابُ فَوْقَ المَكْتَبِ).'
            }
          ],
          keyPoints: [
            'المُبْتَدَأُ وَالخَبَرُ مَرْفُوعَانِ دَائِماً بِالأَصْلِ (الضَّمَّةُ لِلْمُفْرَدِ، الأَلِفُ لِلْمُثَنَّى، وَالوَاوُ لِجَمْعِ المُذَكَّرِ السَّالِمِ).',
            'كَانَ وَأَخَوَاتُهَا (أَفْعَالٌ نَاقِصَةٌ): تَرْفَعُ المُبْتَدَأَ فَيُسَمَّى اسْمَهَا، وَتَنْصِبُ الخَبَرَ فَيُسَمَّى خَبَرَهَا.',
            'إِنَّ وَأَخَوَاتُهَا (حُرُوفٌ نَاسِخَةٌ): تَنْصِبُ المُبْتَدَأَ فَيُسَمَّى اسْمَهَا، وَتَرْفَعُ الخَبَرَ فَيُسَمَّى خَبَرَهَا.',
            'أَخَوَاتُ كَانَ: أَصْبَحَ، أَضْحَى، ظَلَّ، أَمْسَى، بَاتَ، صَارَ، لَيْسَ، مَا زَالَ.'
          ],
          rulesOrFormulas: [
            'قَاعِدَةُ الإِعْرَابِ: «إِنَّ العِلْمَ نُورٌ» -> إِنَّ: حَرْفُ تَوْكِيدٍ وَنَصْبٍ، العِلْمَ: اسْمُ إِنَّ مَنْصُوبٌ بِالفَتْحَةِ الظَّاهِرَةِ، نُورٌ: خَبَرُ إِنَّ مَرْفُوعٌ بِالضَّمَّةِ الظَّاهِرَةِ.',
            'قَاعِدَةُ الإِعْرَابِ: «كَانَ النَّصْرُ قَرِيباً» -> كَانَ: فِعْلٌ مَاضٍ نَاقِصٌ، النَّصْرُ: اسْمُ كَانَ مَرْفُوعٌ بِالضَّمَّةِ، قَرِيباً: خَبَرُ كَانَ مَنْصُوبٌ بِالفَتْحَةِ.'
          ],
          caseExample: 'تَحْوِيلُ جُمْلَةٍ: «التِّلْمِيذَانِ مُجْتَهِدَانِ» -> مَعَ كَانَ: «كَانَ التِّلْمِيذَانِ مُجْتَهِدَيْنِ» | مَعَ إِنَّ: «إِنَّ التِّلْمِيذَيْنِ مُجْتَهِدَانِ».',
          pitfalls: [
            'الخَلْطُ بَيْنَ خَبَرِ كَانَ المَنْصُوبِ بِاليَاءِ فِي المُثَنَّى وَالجَمْعِ وَبَيْنَ اسْمِهَا المَرْفُوعِ.',
            'اعْتِقَادُ أَنَّ الخَبَرَ يَكُونُ دَائِماً كَلِمَةً وَاحِدَةً، بَيْنَمَا يَقَعُ جُمْلَةً فِعْلِيَّةً مِثْلَ: «الأُسْتَاذُ يُلْقِي الدَّرْسَ».'
          ]
        },
        {
          id: 'ar-2',
          title: 'عِلْمُ البَيَانِ وَالبَلاَغَةِ : التَّشْبِيهُ وَالاِسْتِعَارَةُ',
          duration: '35 دقيقة',
          level: 'المقرر المدرسي',
          summary: 'يَدْرُسُ عِلْمُ البَيَانِ طُرُقَ التَّعْبِيرِ عَنِ المَعْنَى الوَاحِدِ بِأَسَالِيبَ جَمَالِيَّةٍ مُخْتَلِفَةٍ. يُعَدُّ التَّشْبِيهُ بَيَانَ مُشَارَكَةِ أَمْرٍ لِآخَرَ فِي صِفَةٍ، أَمَّا الاِسْتِعَارَةُ فَهِيَ تَشْبِيهٌ بَلِيغٌ حُذِفَ أَحَدُ طَرَفَيْهِ (المُشَبَّهُ أَوِ المُشَبَّهُ بِهِ).',
          tips: [
            {
              icon: 'psychology',
              badge: 'فائدة للحفظ',
              type: 'memo',
              title: 'أَرْكَانُ التَّشْبِيهِ الأَرْبَعَةُ',
              description: 'تَذَكَّرْ أَرْكَانَ التَّشْبِيهِ: (المُشَبَّهُ + المُشَبَّهُ بِهِ + أَدَاةُ التَّشْبِيهِ + وَجْهُ الشَّبَهِ). مِثْلُ: "العَالِمُ كَالبَحْرِ فِي العَطَاءِ".'
            },
            {
              icon: 'school',
              badge: 'نصيحة للامتحان',
              type: 'exam',
              title: 'الفَرْقُ بَيْنَ التَّصْرِيحِيَّةِ وَالمَكْنِيَّةِ',
              description: 'إِذَا صَرَّحْتَ بِالمُشَبَّهِ بِهِ فَهِيَ تَصْرِيحِيَّةٌ (مِثْلُ: أَقْبَلَ البَدْرُ يَبْتَسِمُ). وَإِذَا حَذَفْتَ المُشَبَّهَ بِهِ وَتَرَكْتَ لاَزِمَةً مِنْ لَوَازِمِهِ فَهِيَ مَكْنِيَّةٌ (مِثْلُ: بَكَى المَطَرُ).'
            },
            {
              icon: 'check_circle',
              badge: 'قاعدة ذهبية',
              type: 'rule',
              title: 'سِرُّ الجَمَالِ البَلاَغِيِّ',
              description: 'عِنْدَ تَحْلِيلِ البَلاَغَةِ، اذْكُرْ دَائِماً سِرَّ الجَمَالِ: التَّشْخِيصُ (إِعْطَاءُ صِفَةِ الإِنْسَانِ لِلْجَمَادِ) أَوْ التَّجْسِيمُ (تَحْوِيلُ المَعْنَوِيِّ إِلَى مَحْسُوسٍ).'
            }
          ],
          keyPoints: [
            'التَّشْبِيهُ التَّامُّ: مَا ذُكِرَتْ فِيهِ الأَرْكَانُ الأَرْبَعَةُ جَمِيعاً.',
            'التَّشْبِيهُ البَلِيغُ: مَا حُذِفَتْ مِنْهُ أَدَاةُ التَّشْبِيهِ وَوَجْهُ الشَّبَهِ مَعاً (مِثْلُ: "العِلْمُ نُورٌ").',
            'الاِسْتِعَارَةُ المَكْنِيَّةُ: يُحْذَفُ فِيهَا المُشَبَّهُ بِهِ مَعَ بَقَاءِ قَرِينَةٍ تَدُلُّ عَلَيْهِ.',
            'الاِسْتِعَارَةُ التَّصْرِيحِيَّةُ: يُصَرَّحُ فِيهَا بِلَفْظِ المُشَبَّهِ بِهِ وَيُحْذَفُ المُشَبَّهُ.'
          ],
          rulesOrFormulas: [
            'مِثَالُ تَشْبِيهٍ تَامٍّ: «كَلاَمُ الأُمِّ كَالشَّهْدِ فِي الحَلاَوَةِ» -> المُشَبَّهُ: كَلاَمُ الأُمِّ، الأَدَاةُ: الكَافُ، المُشَبَّهُ بِهِ: الشَّهْدُ، وَجْهُ الشَّبَهِ: الحَلاَوَةُ.',
            'قَوْلُهُ تَعَالَى: ﴿وَاعْتَصِمُوا بِحَبْلِ اللَّهِ جَمِيعًا﴾ [آل عمران: 103] -> اسْتِعَارَةٌ تَصْرِيحِيَّةٌ، حَيْثُ شُبِّهَ دِينُ اللَّهِ بِالحَبْلِ وَحُذِفَ المُشَبَّهُ.'
          ],
          caseExample: 'تَحْلِيلُ بَيْتٍ شِعْرِيٍّ: «وَإِذَا المَنِيَّةُ أَنْشَبَتْ أَظْفَارَهَا» -> اسْتِعَارَةٌ مَكْنِيَّةٌ؛ شَبَّهَ المَوْتَ بِوَحْشٍ كَاسِرٍ وَحَذَفَ الوَحْشَ وَرَمَزَ لَهُ بِالأَظْفَارِ.',
          pitfalls: [
            'الخَلْطُ بَيْنَ المَجَازِ المُرْسَلِ وَالاِسْتِعَارَةِ (فَالِاسْتِعَارَةُ تَقُومُ حَصْراً عَلَى عَلاَقَةِ المُشَابَهَةِ).',
            'عَدَمُ تَحْدِيدِ القَرِينَةِ الدَّالَّةِ عَلَى المَعْنَى المَجَازِيِّ.'
          ]
        },
        {
          id: 'ar-3',
          title: 'قَوَاعِدُ الإِمْلاَءِ : الهَمْزَاتُ وَالتَّاءَاتُ وَعَلاَمَاتُ التَّرْقِيمِ',
          duration: '35 دقيقة',
          level: 'المقرر المدرسي',
          summary: 'يَكْتَسِبُ التِّلْمِيذُ مَهَارَاتِ الكِتَابَةِ السَّلِيمَةِ وَتَفَادِي الأَخْطَاءِ الشَّائِعَةِ؛ حَيْثُ يُفَرِّقُ بَيْنَ هَمْزَتَيِ الوَصْلِ وَالقَطْعِ، وَيُتْقِنُ رَسْمَ الهَمْزَةِ المُتَوَسِّطَةِ حَسَبَ أَقْوَى الحَرَكَاتِ، وَيُمَيِّزُ بَيْنَ التَّاءِ المَرْبُوطَةِ وَالمَبْسُوطَةِ.',
          tips: [
            {
              icon: 'psychology',
              badge: 'فائدة للحفظ',
              type: 'memo',
              title: 'سُلَّمُ الحَرَكَاتِ فِي الهَمْزَةِ المُتَوَسِّطَةِ',
              description: 'أَقْوَى الحَرَكَاتِ تَرْتِيباً: الكَسْرَةُ (تُنَاسِبُهَا النَّبْرَةُ ئـ)، ثُمَّ الضَّمَّةُ (تُنَاسِبُهَا الوَاوُ ؤ)، ثُمَّ الفَتْحَةُ (تُنَاسِبُهَا الأَلِفُ أ)، ثُمَّ السُّكُونُ هُوَ الأَضْعَفُ.'
            },
            {
              icon: 'school',
              badge: 'نصيحة للامتحان',
              type: 'exam',
              title: 'حِيلَةُ الوَاوِ لِلتَّمْيِيزِ بَيْنَ الوَصْلِ وَالقَطْعِ',
              description: 'ضَعْ حَرْفَ الوَاوِ (و) قَبْلَ الكَلِمَةِ وَانْطِقْهَا: إِذَا سَقَطَتِ الهَمْزَةُ فِي النُّطْقِ فَهِيَ هَمْزَةُ وَصْلٍ (وَاسْتَمَعَ)، وَإِذَا ثَبَتَتْ فَهِيَ قَطْعٌ (وَأَكْرَمَ).'
            },
            {
              icon: 'check_circle',
              badge: 'قاعدة ذهبية',
              type: 'rule',
              title: 'التَّاءُ المَرْبُوطَةُ عِنْدَ الوَقْفِ',
              description: 'التَّاءُ المَرْبُوطَةُ (ـة / ة) تُلْفَظُ هَاءً عِنْدَ الوَقْفِ بِالسُّكُونِ (مَدْرَسَة -> مَدْرَسَهْ)، بَيْنَمَا التَّاءُ المَبْسُوطَةُ تَبْقَى تَاءً (بَيْت -> بَيْتْ).'
            }
          ],
          keyPoints: [
            'هَمْزَةُ الوَصْلِ تُكْتَبُ أَلِفاً دُونَ هَمْزَةٍ (ا)، وَتَكُونُ فِي: (ال) التَّعْرِيفِ، الأَسْمَاءِ العَشَرَةِ، وَأَمْرِ الثُّلاَثِيِّ.',
            'هَمْزَةُ القَطْعِ تُكْتَبُ فَوْقَهَا أَوْ تَحْتَهَا هَمْزَةٌ (أَ / إِ / أُ).',
            'الهَمْزَةُ المُتَوَسِّطَةُ تُكْتَبُ بِمُقَارَنَةِ حَرَكَتِهَا مَعَ حَرَكَةِ الحَرْفِ الَّذِي قَبْلَهَا وَاتِّبَاعِ الأَقْوَى.',
            'عَلاَمَاتُ التَّرْقِيمِ الرَّئِيسِيَّةُ: الفَاصِلَةُ (،)، النُّقْطَةُ (.)، عَلاَمَةُ الاِسْتِفْهَامِ (؟)، وَالنُّقْطَتَانِ التَّفْسِيرِيَّتَانِ (:).'
          ],
          rulesOrFormulas: [
            'قَاعِدَةُ الهَمْزَةِ عَلَى النَّبْرَةِ: «سُئِلَ» (مَكْسُورَةٌ بَعْدَ ضَمٍّ -> الكَسْرَةُ أَقْوَى)، «فِئَةٌ» (مَفْتُوحَةٌ بَعْدَ كَسْرٍ -> الكَسْرَةُ أَقْوَى).',
            'قَاعِدَةُ الهَمْزَةِ عَلَى الوَاوِ: «مُؤْمِنٌ» (سَاكِنَةٌ بَعْدَ ضَمٍّ -> الضَّمَّةُ أَقْوَى).'
          ],
          caseExample: 'تَصْحِيحٌ إِمْلاَئِيٌّ: كَلِمَةُ «اِبْتِسَامَة» (هَمْزَةُ وَصْلٍ لِأَنَّهَا مَصْدَرُ فِعْلٍ خُمَاسِيٍّ)، وَتَنْتَهِي بِتَاءِ مَرْبُوطَةٍ لِأَنَّهَا تُنْطَقُ هَاءً عِنْدَ الوَقْفِ.',
          pitfalls: [
            'كِتَابَةُ هَمْزَةِ القَطْعِ عَلَى كَلِمَةِ «اسْم» أَوِ «ابْن» (الصَّوَابُ أَنَّهُمَا هَمْزَتَا وَصْلٍ).',
            'إِغْفَالُ وَضْعِ النُّقْطَتَيْنِ فَوْقَ التَّاءِ المَرْبُوطَةِ وَالخَلْطُ بَيْنَهَا وَبَيْنَ هَاءِ الضَّمِيرِ.'
          ]
        },
        {
          id: 'ar-4',
          title: 'مَهَارَاتُ التَّعْبِيرِ وَالإِنْشَاءِ وَتَحْلِيلِ النُّصُوصِ الأَدَبِيَّةِ',
          duration: '40 دقيقة',
          level: 'المقرر المدرسي',
          summary: 'يَتَدَرَّبُ التِّلْمِيذُ عَلَى بِنَاءِ مَوْضُوعٍ إِنْشَائِيٍّ مُتَكَامِلٍ يَتَكَوَّنُ مِنْ مُقَدِّمَةٍ مُشَوِّقَةٍ، وَعَرْضٍ مُتَسَلْسِلِ الأَفْكَارِ، وَخَاتِمَةٍ تَرْكِيبِيَّةٍ؛ مَعَ تَوْظِيفِ الرَّوَابِطِ اللُّغَوِيَّةِ وَالشَّوَاهِدِ الأَدَبِيَّةِ وَتَحْلِيلِ النُّصُوصِ القِرَائِيَّةِ.',
          tips: [
            {
              icon: 'psychology',
              badge: 'فائدة للحفظ',
              type: 'memo',
              title: 'تَقْسِيمُ وَقْتِ التَّعْبِيرِ الكِتَابِيِّ',
              description: 'خَصِّصْ: 20% لِفَهْمِ المَوْضُوعِ وَالتَّسْوِيدِ، 60% لِلصِّيَاغَةِ وَالتَّحْرِيرِ، وَ20% لِلْمُرَاجَعَةِ الإِمْلاَئِيَّةِ وَالشَّكْلِ.'
            },
            {
              icon: 'school',
              badge: 'نصيحة للامتحان',
              type: 'exam',
              title: 'أَهَمِّيَّةُ الرَّوَابِطِ وَالشَّوَاهِدِ',
              description: 'زَيِّنْ مَوْضُوعَكَ بِرَوَابِطَ أَنِيقَةٍ مِثْلَ: (عِلاَوَةً عَلَى ذَلِكَ، وَمِنْ هَذَا المُنْطَلَقِ، وَجَدِيرٌ بِالذِّكْرِ) مَعَ شَاهِدٍ شِعْرِيٍّ أَوْ حَدِيثٍ نَبَوِيٍّ.'
            },
            {
              icon: 'check_circle',
              badge: 'قاعدة ذهبية',
              type: 'rule',
              title: 'نَظَافَةُ الوَرَقَةِ وَالخَطُّ الوَاضِحُ',
              description: 'الخَطُّ الحَسَنُ وَتَفَادِي التَّشْطِيبِ وَتَرْكُ بَيَاضٍ فِي بِدَايَةِ كُلِّ فِقْرَةٍ يَزِيدُ مِنْ تَقْدِيرِ المُصَحِّحِ لِمَوْضُوعِكَ.'
            }
          ],
          keyPoints: [
            'المُقَدِّمَةُ: تَمْهِيدٌ عَامٌّ لِلْمَوْضُوعِ مَعَ طَرْحِ الإِشْكَالِيَّةِ أَوْ الأَسْئِلَةِ الجَوْهَرِيَّةِ.',
            'العَرْضُ: مُنَاقَشَةُ الأَفْكَارِ فِي فِقَرَاتٍ مُتَسَلْسِلَةٍ؛ كُلُّ فِقْرَةٍ تُعَالِجُ فِكْرَةً وَاحِدَةً مَدْعُومَةً بِالأَمْثِلَةِ.',
            'الخَاتِمَةُ: خُلاَصَةٌ مُوجَزَةٌ وَإِبْدَاءُ الرَّأْيِ الشَّخْصِيِّ المُعَلَّلِ.',
            'تَوْظِيفُ عَلاَمَاتِ التَّرْقِيمِ بِدِقَّةٍ لِتَوْضِيحِ مَعَانِي الجُمَلِ.'
          ],
          rulesOrFormulas: [
            'مُعَادَلَةُ المَوْضُوعِ النَّاجِحِ = (أَفْكَارٌ مُتَسَلْسِلَةٌ + لُغَةٌ سَلِيمَةٌ مِنَ اللَّحْنِ + شَوَاهِدُ مُلائِمَةٌ + خَطٌّ وَاضِحٌ وَمَقْرُوءٌ).'
          ],
          caseExample: 'تَحْرِيرُ فِقْرَةٍ حَوْلَ فَضْلِ القِرَاءَةِ: «إِنَّ القِرَاءَةَ غِذَاءُ العَقْلِ وَنُورُ البَصِيرَةِ، فَهِيَ تَنْقُلُ القَارِئَ عَبْرَ الأَزْمِنَةِ، وَكَمَا قَالَ الشَّاعِرُ: أَعَزُّ مَكَانٍ فِي الدُّنَى سَرْجُ سَابِحٍ * وَخَيْرُ جَلِيسٍ فِي الزَّمَانِ كِتَابُ».',
          pitfalls: [
            'الخُرُوجُ عَنِ المَوْضُوعِ المَطْلُوبِ (الهَدَفِ المُحَدَّدِ فِي نَصِّ الاِنْطِلاَقِ).',
            'اسْتِعْمَالُ الدَّارِجَةِ أَوْ كَلِمَاتٍ غَيْرِ فَصِيحَةٍ فِي التَّحْرِيرِ.'
          ]
        }
      ]
    },
    'Anglais': {
      subject: 'Anglais',
      category: 'English Language (School Curriculum)',
      description: 'Grammar, vocabulary, reading comprehension, verb tenses, and writing skills for primary and middle-school students.',
      chapters: [
        {
          id: 'eng-c1',
          title: 'The Present Simple Tense & Daily Routines',
          duration: '35 min',
          level: 'School Curriculum',
          summary: 'The Present Simple is one of the most important tenses in English. We use it to talk about habits, daily routines, general truths, and facts. The key rule is: with the third-person singular subjects (he, she, it), the verb takes an "-s" or "-es" ending. For example: "She plays football every Saturday." With I, you, we, and they, the verb stays in its base form: "They play football every Saturday."',
          tips: [
            {
              icon: 'psychology',
              badge: 'Memory Tip',
              type: 'memo',
              title: 'The "HeSheIt" Rule',
              description: 'Remember: He, She, It — don\'t forget the S! Whenever the subject is third-person singular, add -s or -es to the verb (he walks, she watches, it rains).'
            },
            {
              icon: 'school',
              badge: 'Exam Advice',
              type: 'exam',
              title: 'Signal Words for Present Simple',
              description: 'Look for time expressions like "every day", "always", "usually", "sometimes", "never", "on Mondays" — they tell you to use the Present Simple.'
            },
            {
              icon: 'check_circle',
              badge: 'Golden Rule',
              type: 'rule',
              title: 'Negative & Question Forms',
              description: 'Use "do not / don\'t" with I/you/we/they and "does not / doesn\'t" with he/she/it. In questions: "Do you like...?" / "Does she like...?" The main verb always stays in its base form after do/does.'
            }
          ],
          keyPoints: [
            'The Present Simple describes habits, routines, and general truths (e.g., "Water boils at 100°C").',
            'Third-person singular (he/she/it): add -s or -es to the verb (play → plays, watch → watches, go → goes).',
            'Negative form: subject + do/does + not + base verb ("She does not like spinach").',
            'Question form: Do/Does + subject + base verb ("Does he speak French?").'
          ],
          rulesOrFormulas: [
            'Affirmative: Subject + verb (+ s/es for he/she/it). Example: "She reads books every evening."',
            'Negative: Subject + do/does + not + base verb. Example: "They do not watch TV on school nights."',
            'Question: Do/Does + subject + base verb? Example: "Does your brother play basketball?"'
          ],
          caseExample: 'Daily routine description: "Every morning, Adam wakes up at 7:00 AM. He brushes his teeth, eats breakfast with his family, and walks to school. His classes begin at 8:30 AM. After school, he does his homework and plays with his friends."',
          pitfalls: [
            'Forgetting the "-s" with he/she/it: say "She plays" NOT "She play".',
            'Adding "-s" after "does": say "Does she play?" NOT "Does she plays?".',
            'Confusing Present Simple with Present Continuous: "I go to school every day" (habit) vs "I am going to school now" (happening right now).'
          ]
        },
        {
          id: 'eng-c2',
          title: 'The Past Simple & Irregular Verbs',
          duration: '40 min',
          level: 'School Curriculum',
          summary: 'The Past Simple is used to talk about completed actions in the past. Regular verbs form the past by adding "-ed" (walk → walked, play → played). However, many common English verbs are irregular and change their form completely (go → went, see → saw, eat → ate). The Past Simple is the same for all persons (I/you/he/she/it/we/they went).',
          tips: [
            {
              icon: 'psychology',
              badge: 'Memory Tip',
              type: 'memo',
              title: 'Learn Irregular Verbs in Groups',
              description: 'Group irregular verbs by their patterns to memorize them faster: (1) No change: cut-cut-cut, put-put-put. (2) Vowel change: sing-sang-sung, drink-drank-drunk. (3) Completely different: go-went-gone, be-was/were-been.'
            },
            {
              icon: 'school',
              badge: 'Exam Advice',
              type: 'exam',
              title: 'Past Simple Signal Words',
              description: 'Key time expressions that indicate Past Simple: "yesterday", "last week/month/year", "ago" (two days ago), "in 2020", "when I was young". Spot these in exam texts!'
            },
            {
              icon: 'check_circle',
              badge: 'Golden Rule',
              type: 'rule',
              title: 'Negative with "did not"',
              description: 'In the negative, always use "did not" (didn\'t) + base form of the verb. Say "He did not go" NOT "He did not went". The "did" already carries the past meaning.'
            }
          ],
          keyPoints: [
            'Regular verbs: add -ed to the base form (play → played, arrive → arrived, stop → stopped).',
            'Irregular verbs must be memorized: go → went, see → saw, have → had, make → made, take → took.',
            'The Past Simple form is the same for ALL subjects: "I went / She went / They went".',
            'Negative: subject + did not (didn\'t) + base verb. Question: Did + subject + base verb?'
          ],
          rulesOrFormulas: [
            'Regular: Subject + verb-ed. Example: "They played football yesterday."',
            'Irregular: Subject + irregular past form. Example: "She went to the library last Monday."',
            'Negative: Subject + did not + base verb. Example: "We did not finish the homework."',
            'Question: Did + subject + base verb? Example: "Did you see the new science exhibit?"'
          ],
          caseExample: 'Narrative writing: "Last Friday, our school organized a Science Fair. Sarah and Youssef built a solar-powered toy car from recycled materials. Their teacher saw the project and smiled proudly. The principal awarded them first prize. It was an inspiring day!"',
          pitfalls: [
            'Using the past form after "did": say "Did you go?" NOT "Did you went?".',
            'Adding "-ed" to irregular verbs: say "He ate breakfast" NOT "He eated breakfast".',
            'Forgetting to use "was/were" for the verb "to be": "I was happy" (NOT "I did be happy").'
          ]
        },
        {
          id: 'eng-c3',
          title: 'Modal Verbs: Can, Must, Should & Reading Strategies',
          duration: '40 min',
          level: 'School Curriculum',
          summary: 'Modal verbs are special helping verbs that express ability (can), obligation (must), or advice (should). They are always followed by the base form of the verb without "to". Modal verbs never change form — no "-s", no "-ed", no "-ing". For example: "She can swim" (NOT "She cans swim"), "We must arrive on time" (NOT "We must to arrive").',
          tips: [
            {
              icon: 'psychology',
              badge: 'Memory Tip',
              type: 'memo',
              title: 'CMS — Can, Must, Should',
              description: 'Remember CMS like a Content Management System! Can = ability/possibility ("I can speak English"), Must = strong obligation/rule ("You must wear a seatbelt"), Should = advice/recommendation ("You should drink more water").'
            },
            {
              icon: 'school',
              badge: 'Exam Advice',
              type: 'exam',
              title: 'Reading Comprehension Strategy',
              description: 'When answering reading comprehension questions: (1) Read the questions FIRST, (2) Then read the text looking for the answers, (3) Underline key words, (4) Answer using full sentences with evidence from the text.'
            },
            {
              icon: 'check_circle',
              badge: 'Golden Rule',
              type: 'rule',
              title: 'Modal Verbs Never Change',
              description: 'Three things to remember: (1) No "-s" for third person: "He can" NOT "He cans". (2) No "to" after the modal: "You must go" NOT "You must to go". (3) Negative: add "not" after the modal: "cannot", "must not", "should not".'
            }
          ],
          keyPoints: [
            'CAN expresses ability or possibility: "She can play the piano." / "Can I borrow your pen?"',
            'MUST expresses obligation or strong necessity: "Students must arrive on time." / "You must not cheat on exams."',
            'SHOULD expresses advice or recommendation: "You should eat more vegetables." / "He should study harder."',
            'All modals are followed by the BASE FORM of the verb (no "to", no "-s", no "-ing").'
          ],
          rulesOrFormulas: [
            'Structure: Subject + modal verb + base verb. Example: "They should study every day."',
            'Negative: Subject + modal + not + base verb. Example: "You must not use your phone in class."',
            'Question: Modal + subject + base verb? Example: "Can you help me with this exercise?"',
            'CANNOT is written as one word, but MUST NOT and SHOULD NOT are two separate words.'
          ],
          caseExample: 'Environmental awareness: "Plastic pollution is a big problem. Young people can make a difference by reducing waste. Schools should organize clean-up days. Governments must enforce recycling laws. Together, we can protect our oceans and forests for future generations."',
          pitfalls: [
            'Adding "to" after a modal: say "We must protect the environment" NOT "We must to protect".',
            'Adding "-s" to modal verbs: say "She can swim" NOT "She cans swim".',
            'Confusing "must" and "should": "must" is a strong obligation (a rule), "should" is advice (a recommendation).'
          ]
        }
      ]
    }
  };

  constructor(
    private profileService: ProfileService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.profileSub = this.profileService.active$.subscribe(prof => {
      this.profile = prof;
      this.initSubjects();
    });
  }

  ngOnDestroy(): void {
    this.profileSub?.unsubscribe();
  }

  isArabicSubject(subj?: string): boolean {
    if (!subj) return false;
    const s = subj.toLowerCase();
    return s.includes('arabe') || s.includes('islam') || s.includes('دين') || s.includes('عرب') || s.includes('coran') || s.includes('قرآن');
  }

  isArabicText(text?: string): boolean {
    if (!text) return false;
    return /[\u0600-\u06FF]/.test(text);
  }

  isEnglishSubject(subj?: string): boolean {
    if (!subj) return false;
    const s = subj.toLowerCase();
    return s.includes('anglais') || s.includes('english');
  }

  getUnderstandingTitle(): string {
    if (this.isArabicSubject(this.selectedSubject)) return 'مَضْمُونُ الدَّرْسِ وَمَفَاهِيمُهُ الأَسَاسِيَّةُ';
    if (this.isEnglishSubject(this.selectedSubject)) return 'What You Need to Understand';
    return "Ce qu'il faut comprendre";
  }

  getKeyPointsTitle(): string {
    if (this.isArabicSubject(this.selectedSubject)) return 'نِقَاطٌ وَمَحَاوِرُ أَسَاسِيَّةٌ لِلْحِفْظِ وَالتَّرْكِيزِ';
    if (this.isEnglishSubject(this.selectedSubject)) return 'Key Points to Remember';
    return 'Points clés à retenir';
  }

  getRulesTitle(): string {
    if (this.isArabicSubject(this.selectedSubject)) return 'القَوَاعِدُ وَالشَّوَاهِدُ وَالأَدِلَّةُ الشَّرْعِيَّةُ';
    if (this.isEnglishSubject(this.selectedSubject)) return 'Essential Grammar Rules';
    return 'Règles & Formules fondamentales';
  }

  getCaseExampleTitle(): string {
    if (this.isArabicSubject(this.selectedSubject)) return 'أَمْثِلَةٌ وَتَطْبِيقَاتٌ عَمَلِيَّةٌ وَسُلُوكِيَّةٌ';
    if (this.isEnglishSubject(this.selectedSubject)) return 'Practical Example & Application';
    return "Cas d'école & Application concrète";
  }

  getPitfallsTitle(): string {
    if (this.isArabicSubject(this.selectedSubject)) return 'أَخْطَاءٌ شَائِعَةٌ فِي الِامْتِحَانِ يَجِبُ تَجَنُّبُهَا';
    if (this.isEnglishSubject(this.selectedSubject)) return 'Common Exam Mistakes to Avoid';
    return "Pièges d'examen à éviter absolument";
  }

  getPracticeCtaDescription(): string {
    if (this.isArabicSubject(this.selectedSubject)) return 'طَبِّقْ مَا تَعَلَّمْتَهُ الآنَ عَبْرَ اخْتِبَارٍ تَفَاعُلِيٍّ أَوْ تَمْرِينٍ تَدْرِيبِيٍّ مُلائِمٍ.';
    if (this.isEnglishSubject(this.selectedSubject)) return 'Put what you just learned into practice with a quiz or an exercise tailored to your level.';
    return "Mets en application ce que tu viens d'apprendre avec un quiz ou un exercice adapté.";
  }

  getExercisesButtonLabel(): string {
    if (this.isArabicSubject(this.selectedSubject)) return 'التَّدَرُّبُ عَلَى التَّمَارِينِ';
    if (this.isEnglishSubject(this.selectedSubject)) return 'Practice Exercises';
    return "S'entraîner aux Exercices";
  }

  private initSubjects(): void {
    // Affiche STRICTEMENT les matières du profil de l'élève
    if (this.profile?.subjects && this.profile.subjects.length > 0) {
      this.availableSubjects = [...this.profile.subjects];
    } else {
      this.availableSubjects = ['Langue arabe', 'Éducation islamique', 'Sciences de la vie et de la Terre (SVT)'];
    }

    if (this.availableSubjects.length > 0) {
      if (!this.availableSubjects.includes(this.selectedSubject)) {
        this.selectedSubject = this.availableSubjects[0];
      }
    }

    this.loadCourseForSubject(this.selectedSubject);
  }

  selectSubject(subj: string): void {
    this.selectedSubject = subj;
    this.searchChapterQuery = '';
    this.loadCourseForSubject(subj);
  }

  private loadCourseForSubject(subj: string): void {
    if (!subj) return;

    let found = this.courseCatalog[subj];

    if (!found) {
      const lower = subj.toLowerCase();
      for (const [key, data] of Object.entries(this.courseCatalog)) {
        if (lower.includes(key.toLowerCase()) || key.toLowerCase().includes(lower)) {
          found = data;
          break;
        }
      }
    }

    if (!found) {
      // Alias courant pour Arabe ou Islam
      if (subj.toLowerCase().includes('arabe') || subj.toLowerCase().includes('عرب')) {
        found = this.courseCatalog['Langue arabe'];
      } else if (subj.toLowerCase().includes('islam') || subj.toLowerCase().includes('دين')) {
        found = this.courseCatalog['Éducation islamique'];
      }
    }

    if (!found) {
      found = this.generateDynamicCourse(subj);
    }

    this.currentCourseData = found;
    this.selectedChapter = found.chapters[0] || null;
  }

  selectChapter(ch: CourseChapter): void {
    this.selectedChapter = ch;
  }

  get currentChapterIndex(): number {
    if (!this.currentCourseData || !this.selectedChapter) return -1;
    return this.currentCourseData.chapters.findIndex(c => c.id === this.selectedChapter?.id);
  }

  get nextChapter(): CourseChapter | null {
    if (!this.currentCourseData || !this.selectedChapter) return null;
    const idx = this.currentChapterIndex;
    if (idx >= 0 && idx < this.currentCourseData.chapters.length - 1) {
      return this.currentCourseData.chapters[idx + 1];
    }
    return null;
  }

  get prevChapter(): CourseChapter | null {
    if (!this.currentCourseData || !this.selectedChapter) return null;
    const idx = this.currentChapterIndex;
    if (idx > 0) {
      return this.currentCourseData.chapters[idx - 1];
    }
    return null;
  }

  goToNextChapter(): void {
    if (this.nextChapter) {
      this.selectedChapter = this.nextChapter;
      if (typeof window !== 'undefined') {
        window.scrollTo({ top: 140, behavior: 'smooth' });
      }
    }
  }

  goToPrevChapter(): void {
    if (this.prevChapter) {
      this.selectedChapter = this.prevChapter;
      if (typeof window !== 'undefined') {
        window.scrollTo({ top: 140, behavior: 'smooth' });
      }
    }
  }

  get filteredChapters(): CourseChapter[] {
    if (!this.currentCourseData) return [];
    if (!this.searchChapterQuery.trim()) return this.currentCourseData.chapters;
    const q = this.searchChapterQuery.toLowerCase();
    return this.currentCourseData.chapters.filter(ch =>
      ch.title.toLowerCase().includes(q) ||
      ch.summary.toLowerCase().includes(q) ||
      ch.keyPoints.some(pt => pt.toLowerCase().includes(q))
    );
  }

  getSubjectIcon(subj: string): string {
    const s = subj.toLowerCase();
    if (s.includes('islam') || s.includes('دين') || s.includes('coran')) return 'auto_stories';
    if (s.includes('svt') || s.includes('vie') || s.includes('terre') || s.includes('biologie')) return 'science';
    if (s.includes('arabe') || s.includes('langue') || s.includes('français') || s.includes('anglais')) return 'translate';
    if (s.includes('math')) return 'calculate';
    if (s.includes('info') || s.includes('prog') || s.includes('code') || s.includes('algo')) return 'code';
    if (s.includes('phys') || s.includes('chim')) return 'biotech';
    if (s.includes('hist') || s.includes('géo')) return 'public';
    return 'menu_book';
  }

  goToQuiz(): void {
    this.router.navigate(['/quiz'], { queryParams: { subject: this.selectedSubject } });
  }

  goToExercises(): void {
    this.router.navigate(['/exercises'], { queryParams: { subject: this.selectedSubject } });
  }

  askTutor(): void {
    this.router.navigate(['/tutor'], {
      queryParams: {
        subject: this.selectedSubject,
        topic: this.selectedChapter?.title || this.selectedSubject
      }
    });
  }

  private generateDynamicCourse(subjectName: string): SubjectCourseData {
    if (this.isArabicSubject(subjectName)) {
      return {
        subject: subjectName,
        category: 'المقرر الدراسي المعتمد (الابتدائي والإعدادي)',
        description: `مُلَخَّصَاتٌ مُرَكَّزَةٌ، قَوَاعِدُ أَسَاسِيَّةٌ، وَإِرْشَادَاتٌ لِلتَّفَوُّقِ فِي مَادَّةِ ${subjectName}.`,
        chapters: [
          {
            id: 'gen-ar-1',
            title: `أُصُولُ وَمَفَاهِيمُ ${subjectName} الأَسَاسِيَّةُ`,
            duration: '35 دقيقة',
            level: 'المقرر المدرسي',
            summary: `يُقَدِّمُ هَذَا الدَّرْسُ المَفَاهِيمَ الجَوْهَرِيَّةَ وَالتَّعَارِيفَ الأَسَاسِيَّةَ فِي مَادَّةِ ${subjectName}، مَعَ شَرْحٍ تَبْسِيطِيٍّ يُسَاعِدُ التِّلْمِيذَ عَلَى الفَهْمِ السَّلِيمِ وَالتَّرْكِيزِ النَّاجِحِ.`,
            tips: [
              {
                icon: 'psychology',
                badge: 'فائدة للحفظ',
                type: 'memo',
                title: 'طَرِيقَةُ التَّثْبِيتِ النَّشِطِ',
                description: `أَعِدْ صِيَاغَةَ كُلِّ مَفْهُومٍ مِنْ مَفَاهِيمِ ${subjectName} بِأُسْلُوبِكَ الخَاصِّ بَعْدَ القِرَاءَةِ مَعَ ضَبْطِ الكَلِمَاتِ بِالشَّكْلِ التَّامِّ.`
              },
              {
                icon: 'school',
                badge: 'نصيحة للامتحان',
                type: 'exam',
                title: 'دِقَّةُ الإِجَابَةِ فِي الِامْتِحَانِ',
                description: `فِي مَادَّةِ ${subjectName}، لاَ تَتْرُكْ إِجَابَةً دُونَ تَعْلِيلٍ وَاضِحٍ أَوْ رَبْطٍ بِالقَوَاعِدِ وَالنُّصُوصِ المُعْتَمَدَةِ فِي الدَّرْسِ.`
              },
              {
                icon: 'check_circle',
                badge: 'قاعدة ذهبية',
                type: 'rule',
                title: 'الفَهْمُ قَبْلَ الكِتَابَةِ',
                description: 'تَأَنَّ فِي قِرَاءَةِ السُّؤَالِ جَيِّداً قَبْلَ البَدْءِ فِي كِتَابَةِ الإِجَابَةِ؛ فَالْفَهْمُ السَّلِيمُ نِصْفُ النَّجَاحِ.'
              }
            ],
            keyPoints: [
              `اسْتِيعَابُ التَّعَارِيفِ الرَّئِيسِيَّةِ وَالمَفَاهِيمِ المَرْكَزِيَّةِ فِي مَادَّةِ ${subjectName}.`,
              'التَّمْيِيزُ بَيْنَ القَوَاعِدِ الكُلِّيَّةِ وَالتَّطْبِيقَاتِ العَمَلِيَّةِ بِدِقَّةٍ.',
              'اسْتِحْضَارُ الأَمْثِلَةِ التَّوْضِيحِيَّةِ لِكُلِّ قَاعِدَةٍ مَدْرُوسَةٍ.'
            ],
            rulesOrFormulas: [
              'قَاعِدَةٌ تَوجِيهِيَّةٌ: كُلُّ إِجَابَةٍ مُعَلَّلَةٍ بِدَلِيلٍ أَوْ شَاهِدٍ صَحِيحٍ تَنَالُ التَّقْدِيرَ الأَفْضَلَ فِي سُلَّمِ التَّنْقِيطِ.'
            ],
            caseExample: `تَطْبِيقٌ نَمُوذَجِيٌّ: تَحْلِيلُ سُؤَالٍ تَقْيِيمِيٍّ حَوْلَ مَحَاوِرِ ${subjectName} وَالإِجَابَةُ عَنْهُ بِخُطُوَاتٍ مُرَتَّبَةٍ.`,
            pitfalls: [
              'الحِفْظُ الآلِيُّ دُونَ فَهْمِ المَعْنَى المَقْصُودِ.',
              'التَّسَرُّعُ فِي الإِجَابَةِ دُونَ مُرَاجَعَةِ صِحَّةِ الكَلِمَاتِ وَالشَّكْلِ.'
            ]
          },
          {
            id: 'gen-ar-2',
            title: `مَنْهَجِيَّةُ التَّطْبِيقِ وَالمُعَالَجَةِ فِي ${subjectName}`,
            duration: '40 دقيقة',
            level: 'المقرر المدرسي',
            summary: `تَطْبِيقَاتٌ عَمَلِيَّةٌ وَتَمَارِينُ نَمُوذَجِيَّةٌ لِتَرْسِيخِ القَوَاعِدِ وَتَنْمِيَةِ القُدْرَةِ عَلَى التَّحْلِيلِ وَالإِجَابَةِ المُنَظَّمَةِ فِي ${subjectName}.`,
            tips: [
              {
                icon: 'psychology',
                badge: 'فائدة للحفظ',
                type: 'memo',
                title: 'خُطُوَاتُ التَّحْلِيلِ المَنْهَجِيِّ',
                description: 'حَدِّدْ مُعْطَيَاتِ السُّؤَالِ بِدِقَّةٍ، ثُمَّ اسْتَحْضِرِ القَاعِدَةَ المُنَاسِبَةَ، وَصُغِ الجَوَابَ بِأُسْلُوبٍ سَلِيمٍ وَمُتَمَاسِكٍ.'
              },
              {
                icon: 'school',
                badge: 'نصيحة للامتحان',
                type: 'exam',
                title: 'تَنْظِيمُ الفِقَرَاتِ',
                description: 'اجْعَلْ كُلَّ فِكْرَةٍ فِي فِقْرَةٍ مُسْتَقِلَّةٍ، وَاسْتَعْمِلْ عَلاَمَاتِ التَّرْقِيمِ لِتَيْسِيرِ قِرَاءَةِ جَوَابِكَ.'
              },
              {
                icon: 'check_circle',
                badge: 'قاعدة ذهبية',
                type: 'rule',
                title: 'سَلاَمَةُ اللُّغَةِ وَالشَّكْلِ',
                description: 'احْرِصْ عَلَى الكِتَابَةِ بِلُغَةٍ فَصِيحَةٍ خَالِيَةٍ مِنَ الأَخْطَاءِ الإِمْلاَئِيَّةِ وَالنَّحْوِيَّةِ.'
              }
            ],
            keyPoints: [
              `مَهَارَاتُ التَّعَامُلِ مَعَ الأَسْئِلَةِ المُرَكَّبَةِ فِي ${subjectName}.`,
              'التَّطْبِيقُ السَّلِيمُ لِلْقَوَاعِدِ عَلَى الأَمْثِلَةِ الجَدِيدَةِ.',
              'تَنْمِيَةُ التَّعْبِيرِ الكِتَابِيِّ الرَّصِينِ وَالمُقْنِعِ.'
            ],
            rulesOrFormulas: [
              'مَنْهَجُ الحَلِّ: فَهْمُ المَطْلُوبِ -> اسْتِحْضَارُ القَاعِدَةِ -> صِيَاغَةُ الجَوَابِ المُعَلَّلِ.'
            ],
            caseExample: `تَطْبِيقٌ عَمَلِيٌّ: حَلُّ مَسْأَلَةٍ أَوْ تَمْرِينٍ تَقْوِيمِيٍّ يَشْمَلُ أَهَمَّ قَوَاعِدِ ${subjectName}.`,
            pitfalls: [
              'إِهْمَالُ بَعْضِ أَجْزَاءِ السُّؤَالِ المُرَكَّبِ.',
              'عَدَمُ التَّأَكُّدِ مِنْ صِحَّةِ الشَّوَاهِدِ المُسْتَخْدَمَةِ.'
            ]
          },
          {
            id: 'gen-ar-3',
            title: `المُرَاجَعَةُ الشَّامِلَةُ وَمَفَاتِيحُ التَّفَوُّقِ فِي ${subjectName}`,
            duration: '35 دقيقة',
            level: 'المقرر المدرسي',
            summary: `حَصِيلَةٌ شَامِلَةٌ لِأَهَمِّ مَحَاوِرِ المَادَّةِ، مَعَ تَوْجِيهَاتٍ تَرْبَوِيَّةٍ لِتَثْبِيتِ المُكْتَسَبَاتِ وَالحُصُولِ عَلَى أَعْلَى النُّقَاطِ فِي الِامْتِحَانَاتِ.`,
            tips: [
              {
                icon: 'psychology',
                badge: 'فائدة للحفظ',
                type: 'memo',
                title: 'الخَرِيطَةُ الذِّهْنِيَّةُ لِلْمُرَاجَعَةِ',
                description: 'ارْسُمْ مُخَطَّطاً أَوْ خَرِيطَةً ذِهْنِيَّةً تَرْبِطُ بَيْنَ عَنَاوِينِ الدُّرُوسِ لِتَسْهِيلِ اسْتِرْجَاعِهَا يَوْمَ الِامْتِحَانِ.'
              },
              {
                icon: 'school',
                badge: 'نصيحة للامتحان',
                type: 'exam',
                title: 'إِدَارَةُ وَقْتِ الِاخْتِبَارِ',
                description: 'ابْدَأْ بِالأَسْئِلَةِ السَّهْلَةِ لِكَسْبِ الثِّقَةِ، ثُمَّ انْتَقِلْ لِلأَسْئِلَةِ الَّتِي تَطْلُبُ تَفْكِيراً، وَخَصِّصْ خَمْسَ دَقَائِقَ لِلْمُرَاجَعَةِ.'
              },
              {
                icon: 'check_circle',
                badge: 'قاعدة ذهبية',
                type: 'rule',
                title: 'الثِّقَةُ وَالتَّوَكُّلُ',
                description: 'اجْتَهِدْ فِي المُرَاجَعَةِ وَثِقْ فِي قُدُرَاتِكَ مُتَوَكِّلاً عَلَى اللَّهِ تَعَالَى دَائِماً.'
              }
            ],
            keyPoints: [
              `التَّمَكُّنُ مِنَ المَفَاهِيمِ الكُبْرَى فِي مُقَرَّرِ ${subjectName}.`,
              'القُدْرَةُ عَلَى الرَّبْطِ بَيْنَ الدُّرُوسِ وَتَوْظِيفِهَا فِي سِيَاقَاتٍ مُتَنَوِّعَةٍ.',
              'التَّدَرُّبُ عَلَى نَمَاذِجِ الاِمْتِحَانَاتِ المَدْرَسِيَّةِ السَّابِقَةِ.'
            ],
            rulesOrFormulas: [
              'شِعَارُ التَّفَوُّقِ: التَّرْكِيزُ أَثْنَاءَ الشَّرْحِ + المُرَاجَعَةُ المُسْتَمِرَّةُ = النَّجَاحُ البَاهِرُ.'
            ],
            caseExample: `نَمُوذَجُ مَسْأَلَةٍ تَرْكِيبِيَّةٍ تَجْمَعُ عِدَّةَ مَحَاوِرَ مِنْ مَادَّةِ ${subjectName}.`,
            pitfalls: [
              'تَأْجِيلُ المُرَاجَعَةِ إِلَى لَيْلَةِ الِامْتِحَانِ.',
              'تَرْكُ بَعْضِ الأَسْئِلَةِ فَارِغَةً دُونَ مُحَاوَلَةِ الإِجَابَةِ عَنْهَا.'
            ]
          }
        ]
      };
    }

    if (this.isEnglishSubject(subjectName)) {
      return {
        subject: subjectName,
        category: 'English Language (School Curriculum)',
        description: `Study notes, simple explanations, and revision tips for ${subjectName}.`,
        chapters: [
          {
            id: 'gen-en-1',
            title: `Core Concepts & Foundations of ${subjectName}`,
            duration: '35 min',
            level: 'School Curriculum',
            summary: `This lesson covers the essential concepts, simple definitions, and basic vocabulary for ${subjectName}. Understanding these foundations will help you build confidence and succeed in your studies.`,
            tips: [
              {
                icon: 'psychology',
                badge: 'Memory Tip',
                type: 'memo',
                title: 'Active Learning Method',
                description: `After reading each concept in ${subjectName}, try to explain it in your own words. This helps you remember it much better than just re-reading.`
              },
              {
                icon: 'school',
                badge: 'Exam Advice',
                type: 'exam',
                title: 'Be Precise and Clear',
                description: `In ${subjectName}, always support your answers with definitions and rules from the lesson. Never leave an answer without justification.`
              },
              {
                icon: 'check_circle',
                badge: 'Golden Rule',
                type: 'rule',
                title: 'Read Before You Write',
                description: 'Read the entire question carefully before you start writing your answer. Understanding the question properly is half the battle!'
              }
            ],
            keyPoints: [
              `Master the key concepts and definitions in ${subjectName}.`,
              'Understand concrete examples from the lesson.',
              'Be able to explain your reasoning clearly and simply.'
            ],
            rulesOrFormulas: [
              `Key principle: Always explain your reasoning step by step and refer to the corresponding rule from the lesson.`
            ],
            caseExample: `Practice example: Solving a typical question about the fundamentals of ${subjectName}.`,
            pitfalls: [
              'Memorizing without truly understanding the meaning.',
              'Forgetting to reread your answer before moving to the next question.'
            ]
          },
          {
            id: 'gen-en-2',
            title: `Methods & Practice Exercises in ${subjectName}`,
            duration: '40 min',
            level: 'School Curriculum',
            summary: `Guided practice, step-by-step exercises, and practical tips to improve your skills in ${subjectName}.`,
            tips: [
              {
                icon: 'psychology',
                badge: 'Memory Tip',
                type: 'memo',
                title: 'Step-by-Step Approach',
                description: 'Identify what the question asks, recall the relevant rule, then write your answer clearly and logically.'
              },
              {
                icon: 'school',
                badge: 'Exam Advice',
                type: 'exam',
                title: 'Neat Presentation',
                description: 'Present your work line by line to make it easy to read and pleasant to mark.'
              },
              {
                icon: 'check_circle',
                badge: 'Golden Rule',
                type: 'rule',
                title: 'Check Your Results',
                description: 'Always ask yourself: does my answer make sense given the information in the question?'
              }
            ],
            keyPoints: [
              `Techniques for breaking down exercises in ${subjectName}.`,
              'Applying rules from the lesson methodically.',
              'Regular practice with varied situations.'
            ],
            rulesOrFormulas: [
              'Typical approach: Identify the data → Recall the rule → Write a justified answer.'
            ],
            caseExample: `Worked example: A typical assessment exercise in ${subjectName}.`,
            pitfalls: [
              'Skipping steps in your explanation.',
              'Forgetting to check your spelling and technical vocabulary.'
            ]
          },
          {
            id: 'gen-en-3',
            title: `Full Revision & Keys to Success in ${subjectName}`,
            duration: '35 min',
            level: 'School Curriculum',
            summary: `A comprehensive review sheet to revise before an assessment, remember the essentials, and avoid common mistakes in ${subjectName}.`,
            tips: [
              {
                icon: 'psychology',
                badge: 'Memory Tip',
                type: 'memo',
                title: 'Summary Sheet',
                description: 'Write the 5 most important concepts on a small card and reread it before every test.'
              },
              {
                icon: 'school',
                badge: 'Exam Advice',
                type: 'exam',
                title: 'Time Management',
                description: 'Start with the questions you know best, then come back to the ones that need more thought. Keep 5 minutes at the end to review.'
              },
              {
                icon: 'check_circle',
                badge: 'Golden Rule',
                type: 'rule',
                title: 'Careful Proofreading',
                description: 'Always save 5 minutes at the end to proofread all of your answers carefully.'
              }
            ],
            keyPoints: [
              `Overview of the key points in the ${subjectName} curriculum.`,
              'Precision in vocabulary and clarity of presentation.',
              'Confidence in your knowledge through regular practice.'
            ],
            rulesOrFormulas: [
              'Golden rule: Regular work + careful proofreading = the best results.'
            ],
            caseExample: `Test preparation: A practice assessment in ${subjectName}.`,
            pitfalls: [
              'Waiting until the night before the test to revise.',
              'Leaving a question unanswered instead of trying to give a reasoned response.'
            ]
          }
        ]
      };
    }

    return {
      subject: subjectName,
      category: 'Programme Scolaire (Primaire & Collège)',
      description: `Fiche mémo, explications simples et astuces de révision pour ${subjectName}.`,
      chapters: [
        {
          id: 'gen-1',
          title: `Notions fondamentales et Clés de ${subjectName}`,
          duration: '35 min',
          level: 'Programme Scolaire',
          summary: `Ce cours aborde les notions essentielles, les définitions simples et le vocabulaire de base en ${subjectName}.`,
          tips: [
            {
              icon: 'psychology',
              badge: 'Astuce Mémo',
              type: 'memo',
              title: 'Méthode d\'apprentissage active',
              description: `Reformule chaque notion de ${subjectName} avec tes propres mots après chaque lecture pour bien la retenir.`
            },
            {
              icon: 'school',
              badge: 'Conseil d\'Examen',
              type: 'exam',
              title: 'Rigueur et clarté',
              description: `En ${subjectName}, justifie toujours ta réponse en t'appuyant sur les définitions et le cours.`
            },
            {
              icon: 'check_circle',
              badge: 'Règle d\'Or',
              type: 'rule',
              title: 'Vérification des énoncés',
              description: 'Lis attentivement l\'énoncé en entier avant de commencer pour bien repérer ce qui est demandé.'
            }
          ],
          keyPoints: [
            `Maîtrise des notions clés du programme en ${subjectName}.`,
            'Compréhension des exemples concrets du cours.',
            'Capacité à expliquer simplement son raisonnement.'
          ],
          rulesOrFormulas: [
            `Règle directrice : Toujours expliciter les étapes du raisonnement et citer la règle du cours correspondante.`
          ],
          caseExample: `Exemple d'application : Résolution d'une question type portant sur les bases de ${subjectName}.`,
          pitfalls: [
            'Réciter par cœur sans avoir bien compris le sens.',
            'Oublier de relire sa réponse avant de passer à la question suivante.'
          ]
        },
        {
          id: 'gen-2',
          title: `Méthodes et Exercices d'entraînement en ${subjectName}`,
          duration: '40 min',
          level: 'Programme Scolaire',
          summary: `Entraînement guidé, résolution pas à pas d'exercices et conseils pratiques pour progresser en ${subjectName}.`,
          tips: [
            {
              icon: 'psychology',
              badge: 'Astuce Mémo',
              type: 'memo',
              title: 'Méthode pas à pas',
              description: 'Repère les données de l\'exercice, identifie la règle du cours à utiliser, puis rédige ta réponse clairement.'
            },
            {
              icon: 'school',
              badge: 'Conseil d\'Examen',
              type: 'exam',
              title: 'Rédaction soignée',
              description: 'Présente ton calcul ou ton explication ligne par ligne pour rendre la copie agréable à corriger.'
            },
            {
              icon: 'check_circle',
              badge: 'Règle d\'Or',
              type: 'rule',
              title: 'Vérification du résultat',
              description: 'Demande-toi toujours si ton résultat est logique et cohérent par rapport aux données de départ.'
            }
          ],
          keyPoints: [
            `Techniques de décomposition des exercices en ${subjectName}.`,
            'Application méthodique des règles du cours.',
            'Entraînement régulier sur des situations variées.'
          ],
          rulesOrFormulas: [
            'Démarche type : Données du problème -> Règle du cours -> Solution argumentée.'
          ],
          caseExample: `Cas pratique résolu : Exemple type d'exercice d'évaluation en ${subjectName}.`,
          pitfalls: [
            'Sauter des étapes dans l\'explication.',
            'Négliger les unités de mesure ou l\'orthographe des termes techniques.'
          ]
        },
        {
          id: 'gen-3',
          title: `Révision Générale et Clés de Réussite en ${subjectName}`,
          duration: '35 min',
          level: 'Programme Scolaire',
          summary: `Fiche bilan pour réviser avant une évaluation, retenir l'essentiel et éviter les erreurs fréquentes en ${subjectName}.`,
          tips: [
            {
              icon: 'psychology',
              badge: 'Astuce Mémo',
              type: 'memo',
              title: 'Fiche récapitulative',
              description: 'Regroupe les 5 notions les plus importantes sur une petite fiche que tu relis avant le contrôle.'
            },
            {
              icon: 'school',
              badge: 'Conseil d\'Examen',
              type: 'exam',
              title: 'Gestion du temps',
              description: 'Commence par les questions que tu maîtrises le mieux, puis reviens sur celles qui te demandent plus de réflexion.'
            },
            {
              icon: 'check_circle',
              badge: 'Règle d\'Or',
              type: 'rule',
              title: 'Relecture attentive',
              description: 'Garde toujours 5 minutes à la fin pour relire l\'ensemble de tes réponses.'
            }
          ],
          keyPoints: [
            `Vision d'ensemble des points clés du programme en ${subjectName}.`,
            'Précision du vocabulaire et clarté de la présentation.',
            'Confiance en ses acquis grâce à la pratique régulière.'
          ],
          rulesOrFormulas: [
            'Règle d\'or : Un travail régulier et une relecture soignée garantissent les meilleures notes.'
          ],
          caseExample: `Bilan d'entraînement type contrôle en ${subjectName}.`,
          pitfalls: [
            'Attendre la veille du contrôle pour réviser.',
            'Laisser une question sans réponse au lieu d\'essayer d\'argumenter.'
          ]
        }
      ]
    };
  }
}
